/**
 * Сервис для выполнения HTTP запросов к Ozon API
 * HttpService.gs
 */

class HttpService {
  constructor() {
    this.apiUrl = CONFIG.API_URL;
  }
  
  /**
   * Выполняет запрос к Ozon API
   */
  fetchOzonData(articles) {
    try {
      Logger.log(`Запрос к Ozon API для ${articles.length} артикулов`);
      
      const payload = {
        articles: articles
      };
      
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };
      
      const response = UrlFetchApp.fetch(this.apiUrl, options);
      const responseCode = response.getResponseCode();
      
      if (responseCode !== 200) {
        throw new Error(`HTTP Error: ${responseCode} - ${response.getContentText()}`);
      }
      
      const responseText = response.getContentText();
      
      if (!responseText) {
        throw new Error('Пустой ответ от API');
      }
      
      const data = JSON.parse(responseText);
      
      if (!data) {
        throw new Error('Некорректная структура ответа API');
      }
      
      Logger.log(`Получен ответ: success=${data.success}, parsed=${data.parsed_articles}/${data.total_articles}`);
      return data;
      
    } catch (error) {
      Logger.log(`Ошибка HTTP запроса: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Тестирует подключение к API
   */
  testConnection(testArticles = [2360879218]) {
    try {
      const response = this.fetchOzonData(testArticles);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}