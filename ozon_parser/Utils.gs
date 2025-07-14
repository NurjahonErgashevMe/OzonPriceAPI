/**
 * Утилиты и вспомогательные функции для Ozon парсера
 * Utils.gs
 */

/**
 * Показывает уведомление о прогрессе
 */
function showProgressToast(message) {
  SpreadsheetApp.getActiveSpreadsheet().toast(message, 'Ozon Парсер', 3);
}

/**
 * Показывает уведомление об ошибке
 */
function showErrorToast(message) {
  SpreadsheetApp.getActiveSpreadsheet().toast(message, 'Ошибка', 10);
}

/**
 * Функция для отладки - тестирует подключение к Ozon API
 */
function debugAPIResponse() {
  try {
    const httpService = new HttpService();
    const response = httpService.fetchOzonData([2360879218]);
    Logger.log('Структура ответа Ozon API:');
    Logger.log(JSON.stringify(response, null, 2));
  } catch (error) {
    Logger.log(`Ошибка отладки: ${error.message}`);
  }
}

/**
 * Тестирует парсинг одного артикула
 */
function testSingleArticle() {
  const testArticle = 2360879218; // Замените на реальный артикул Ozon
  
  try {
    const httpService = new HttpService();
    const response = httpService.fetchOzonData([testArticle]);
    
    const processor = new DataProcessor();
    const results = processor.processOzonResponse(response);
    
    Logger.log('Результат тестирования:');
    Logger.log(JSON.stringify(results, null, 2));
    
  } catch (error) {
    Logger.log(`Ошибка тестирования: ${error.message}`);
  }
}

/**
 * Показывает информацию о найденных колонках
 */
function showColumnInfo() {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const sheetService = new SheetService(sheet);
    sheetService.showColumnInfo();
  } catch (error) {
    Logger.log(`Ошибка показа информации о колонках: ${error.message}`);
    showErrorToast(`Ошибка: ${error.message}`);
  }
}

/**
 * Возвращает текущую дату и время в формате строки
 */
function getCurrentDateTime() {
  const now = new Date();
  return Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd.MM.yyyy HH:mm:ss');
}

/**
 * Проверяет, является ли значение валидным артикулом Ozon
 */
function isValidOzonArticle(article) {
  if (!article) {
    return false;
  }
  
  const trimmed = String(article).trim();
  return /^\d+$/.test(trimmed) && trimmed.length > 0;
}

/**
 * Безопасно парсит JSON
 */
function safeJSONParse(jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    Logger.log(`Ошибка парсинга JSON: ${error.message}`);
    return null;
  }
}

/**
 * Задержка выполнения
 */
function sleep(milliseconds) {
  Utilities.sleep(milliseconds);
}

/**
 * Логирует информацию с временной меткой
 */
function logWithTimestamp(message) {
  const timestamp = getCurrentDateTime();
  Logger.log(`[${timestamp}] ${message}`);
}

/**
 * Тестирует подключение к Ozon API
 */
function testOzonConnection() {
  try {
    const httpService = new HttpService();
    const result = httpService.testConnection();
    
    if (result.success) {
      showProgressToast('Подключение к Ozon API успешно!');
      Logger.log('Тест подключения успешен');
      Logger.log(JSON.stringify(result.data, null, 2));
    } else {
      showErrorToast(`Ошибка подключения: ${result.error}`);
      Logger.log(`Тест подключения неудачен: ${result.error}`);
    }
    
  } catch (error) {
    Logger.log(`Ошибка тестирования подключения: ${error.message}`);
    showErrorToast(`Ошибка: ${error.message}`);
  }
}