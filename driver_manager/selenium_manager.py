import logging
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.common.exceptions import TimeoutException, WebDriverException
from selenium_stealth import stealth
from config.settings import settings
from typing import Optional
import time
import json


logger = logging.getLogger(__name__)


class SeleniumManager:
    def __init__(self):
        self.driver: Optional[webdriver.Chrome] = None
        self.wait: Optional[WebDriverWait] = None
    
    def setup_driver(self) -> webdriver.Chrome:
        """
        Setup Chrome driver with stealth configuration
        """
        chrome_options = Options()
        
        # Basic options
        chrome_options.add_argument(f"--user-agent={settings.USER_AGENT}")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        
        # Proxy settings (using Tor)
        chrome_options.add_argument("--proxy-server=socks5://127.0.0.1:9050")
        
        # Performance options
        chrome_options.add_argument("--disable-extensions")
        chrome_options.add_argument("--disable-plugins")
        chrome_options.add_argument("--disable-images")
        # ВАЖНО: НЕ отключаем JavaScript!
        # chrome_options.add_argument("--disable-javascript")  # Закомментировано!
        
        # Headless mode
        if settings.HEADLESS:
            chrome_options.add_argument("--headless=new")
        
        # Window size
        chrome_options.add_argument("--window-size=1920,1080")
        
        try:
            # Используем selenium-manager для автоматического управления драйверами
            from selenium.webdriver.chrome.service import Service
            from webdriver_manager.chrome import ChromeDriverManager
            
            service = Service()
            driver = webdriver.Chrome(service=service, options=chrome_options)
            
            # Apply stealth
            stealth(driver,
                   languages=["en-US", "en"],
                   vendor="Google Inc.",
                   platform="Win32",
                   webgl_vendor="Intel Inc.",
                   renderer="Intel Iris OpenGL Engine",
                   fix_hairline=True,
                )
            
            # Set timeouts
            driver.implicitly_wait(settings.IMPLICIT_WAIT)
            driver.set_page_load_timeout(settings.PAGE_LOAD_TIMEOUT)
            
            # Execute script to hide automation
            driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            
            self.driver = driver
            self.wait = WebDriverWait(driver, settings.IMPLICIT_WAIT)
            
            logger.info("Chrome driver setup successfully")
            return driver
            
        except WebDriverException as e:
            logger.error(f"Failed to setup Chrome driver: {e}")
            raise
    
    def navigate_to_url(self, url: str) -> bool:
        """
        Navigate to URL with error handling
        """
        if not self.driver:
            logger.error("Driver not initialized")
            return False
        
        try:
            logger.info(f"Navigating to: {url}")
            self.driver.get(url)
            
            # Wait a bit for page to load
            time.sleep(2)
            
            # Check if we got blocked
            if self.is_blocked():
                logger.warning("Detected anti-bot protection")
                return False
            
            return True
            
        except TimeoutException:
            logger.error(f"Timeout while loading: {url}")
            return False
        except WebDriverException as e:
            logger.error(f"WebDriver error: {e}")
            return False
    
    def is_blocked(self) -> bool:
        """
        Check if we're blocked by anti-bot protection
        """
        if not self.driver:
            return True
            
        try:
            # Common anti-bot indicators
            blocked_indicators = [
                "cloudflare",
                "checking your browser",
                "enable javascript",
                "access denied",
                "blocked"
            ]
            
            page_source = self.driver.page_source.lower()
            
            for indicator in blocked_indicators:
                if indicator in page_source:
                    return True
                    
            return False
            
        except Exception:
            return True
    
    def wait_for_json_response(self, timeout: int = 30) -> Optional[str]:
        """
        Wait for JSON response with improved logic
        """
        if not self.driver:
            return None
            
        try:
            logger.info("Waiting for JSON response...")
            start_time = time.time()
            
            # Сначала ждем загрузки страницы
            WebDriverWait(self.driver, 10).until(
                lambda driver: driver.execute_script("return document.readyState") == "complete"
            )
            
            # Теперь ждем появления JSON данных
            while time.time() - start_time < timeout:
                try:
                    page_source = self.driver.page_source
                    
                    # Извлекаем JSON из HTML обертки
                    json_content = self.extract_json_from_html(page_source)
                    
                    if json_content:
                        try:
                            # Проверяем, что JSON валидный
                            data = json.loads(json_content)
                            
                            # Проверяем наличие widgetStates
                            if 'widgetStates' in data:
                                logger.info("JSON response with widgetStates found")
                                return json_content
                            
                        except json.JSONDecodeError:
                            # Это не валидный JSON, продолжаем ждать
                            pass
                    
                    # Логируем первые несколько попыток для отладки
                    if time.time() - start_time < 5:
                        logger.debug(f"Page content preview: {page_source[:200]}...")
                    
                    time.sleep(0.5)
                    
                except Exception as e:
                    logger.debug(f"Error checking page source: {e}")
                    time.sleep(0.5)
                    continue
            
            logger.warning(f"Timeout waiting for JSON response after {timeout} seconds")
            # Возвращаем последний извлеченный JSON для отладки
            return self.extract_json_from_html(self.driver.page_source)
            
        except Exception as e:
            logger.error(f"Error waiting for JSON response: {e}")
            return None
    
    def extract_json_from_html(self, html_content: str) -> Optional[str]:
        """
        Extract JSON from HTML wrapper (from <pre> tag)
        """
        try:
            # Ищем содержимое между <pre> тегами
            import re
            
            # Паттерн для поиска JSON в <pre> теге
            pre_pattern = r'<pre[^>]*>(.*?)</pre>'
            pre_match = re.search(pre_pattern, html_content, re.DOTALL | re.IGNORECASE)
            
            if pre_match:
                json_content = pre_match.group(1).strip()
                logger.debug("Found JSON in <pre> tag")
                return json_content
            
            # Если не нашли в <pre>, попробуем найти JSON напрямую
            # Ищем первую открывающую скобку до последней закрывающей
            first_brace = html_content.find('{')
            last_brace = html_content.rfind('}')
            
            if first_brace != -1 and last_brace != -1 and first_brace < last_brace:
                json_content = html_content[first_brace:last_brace + 1]
                logger.debug("Found JSON by brace search")
                return json_content
            
            logger.debug("No JSON found in HTML content")
            return None
            
        except Exception as e:
            logger.error(f"Error extracting JSON from HTML: {e}")
            return None

    def debug_page_content(self):
        """
        Debug helper to see what's on the page
        """
        if not self.driver:
            return
            
        try:
            content = self.driver.page_source
            logger.info(f"Page content length: {len(content)}")
            logger.info(f"Content starts with: {content[:200]}")
            
            # Проверяем наличие <pre> тега
            if '<pre' in content.lower():
                logger.info("Page contains <pre> tag")
                
                # Попробуем извлечь JSON
                json_content = self.extract_json_from_html(content)
                if json_content:
                    logger.info(f"Extracted JSON length: {len(json_content)}")
                    logger.info(f"JSON starts with: {json_content[:100]}")
                    
                    try:
                        data = json.loads(json_content)
                        if 'widgetStates' in data:
                            logger.info("Extracted JSON contains widgetStates")
                            widget_states = data['widgetStates']
                            logger.info(f"WidgetStates keys count: {len(widget_states)}")
                        else:
                            logger.info("Extracted JSON does not contain widgetStates")
                            logger.info(f"JSON keys: {list(data.keys())}")
                    except json.JSONDecodeError as e:
                        logger.info(f"Extracted content is not valid JSON: {e}")
                else:
                    logger.info("Could not extract JSON from <pre> tag")
            
            # Проверяем наличие JavaScript
            if 'script' in content.lower():
                logger.info("Page contains JavaScript")
            
            # Проверяем, есть ли уже JSON напрямую
            stripped_content = content.strip()
            if stripped_content.startswith('{'):
                logger.info("Page contains direct JSON structure")
            else:
                logger.info("Page contains HTML wrapper")
                
        except Exception as e:
            logger.error(f"Error in debug: {e}")
    
    def close(self):
        """
        Close driver and cleanup
        """
        if self.driver:
            try:
                self.driver.quit()
                logger.info("Driver closed successfully")
            except Exception as e:
                logger.error(f"Error closing driver: {e}")
            finally:
                self.driver = None
                self.wait = None