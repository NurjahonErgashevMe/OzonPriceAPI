/**
 * Основной класс парсера Ozon
 * OzonParser.gs
 */

class OzonParser {
  constructor(sheet) {
    this.sheet = sheet;
    this.sheetService = new SheetService(sheet);
    this.httpService = new HttpService();
    this.dataProcessor = new DataProcessor();
  }
  
  /**
   * Парсит все артикулы из таблицы
   */
  parseAllArticles() {
    try {
      // Получаем артикулы из таблицы
      const articlesData = this.sheetService.getArticlesFromSheet();
      
      if (articlesData.length === 0) {
        showProgressToast('Нет артикулов для обработки');
        return;
      }
      
      Logger.log(`Найдено ${articlesData.length} артикулов для обработки`);
      
      // Разбиваем на батчи по 50 артикулов (максимум для Ozon API)
      const batches = this.createBatches(articlesData, CONFIG.BATCH_SIZE);
      Logger.log(`Создано ${batches.length} батчей`);
      
      // Обрабатываем каждый батч
      const allResults = [];
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        
        showProgressToast(`Обрабатываем батч ${i + 1} из ${batches.length}...`);
        Logger.log(`Обрабатываем батч ${i + 1}/${batches.length} (${batch.length} артикулов)`);
        
        try {
          // Получаем данные для батча
          const batchResults = this.processBatch(batch);
          allResults.push(...batchResults);
          
          // Сохраняем результаты батча сразу
          showProgressToast(`Сохраняем результаты батча ${i + 1}...`);
          this.sheetService.saveResultsToSheet(batchResults);
          
          // Задержка между батчами
          if (i < batches.length - 1) {
            Logger.log(`Ожидание ${CONFIG.REQUEST_DELAY}мс перед следующим батчем...`);
            Utilities.sleep(CONFIG.REQUEST_DELAY);
          }
          
        } catch (error) {
          Logger.log(`Ошибка обработки батча ${i + 1}: ${error.message}`);
          
          // Добавляем ошибочные результаты для сохранения порядка
          const errorResults = batch.map(item => ({
            rowIndex: item.rowIndex,
            article: String(item.article),
            title: CONFIG.MESSAGES.ERROR,
            cardPrice: CONFIG.MESSAGES.ERROR,
            price: CONFIG.MESSAGES.ERROR,
            originalPrice: CONFIG.MESSAGES.ERROR,
            isAvailable: false
          }));
          
          // Сохраняем ошибочные результаты
          this.sheetService.saveResultsToSheet(errorResults);
          allResults.push(...errorResults);
        }
      }
      
      Logger.log(`Обработано ${allResults.length} артикулов`);
      
    } catch (error) {
      Logger.log(`Ошибка парсинга: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Обрабатывает один батч артикулов
   */
  processBatch(batch) {
    try {
      // Извлекаем артикулы для запроса (числа)
      const articles = batch.map(item => item.article);
      
      // Делаем запрос к Ozon API
      const apiResponse = this.httpService.fetchOzonData(articles);
      
      // Обрабатываем ответ
      const processedData = this.dataProcessor.processOzonResponse(apiResponse);
      
      // Сопоставляем результаты с исходными данными
      const results = this.matchResultsWithOriginal(batch, processedData);
      
      return results;
      
    } catch (error) {
      Logger.log(`Ошибка обработки батча: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Создает батчи артикулов
   */
  createBatches(articles, batchSize) {
    const batches = [];
    
    for (let i = 0; i < articles.length; i += batchSize) {
      batches.push(articles.slice(i, i + batchSize));
    }
    
    return batches;
  }
  
  /**
   * Сопоставляет результаты API с исходными данными
   */
  matchResultsWithOriginal(originalBatch, processedData) {
    const results = [];
    
    // Создаем карту результатов по артикулам
    const resultsMap = new Map();
    processedData.forEach(item => {
      resultsMap.set(item.article, item);
    });
    
    // Сопоставляем с исходными данными
    originalBatch.forEach(originalItem => {
      const result = resultsMap.get(String(originalItem.article));
      
      results.push({
        rowIndex: originalItem.rowIndex,
        article: String(originalItem.article),
        title: result?.title || CONFIG.MESSAGES.NO_PRICE_DATA,
        cardPrice: result?.cardPrice || CONFIG.MESSAGES.NO_PRICE_DATA,
        price: result?.price || CONFIG.MESSAGES.NO_PRICE_DATA,
        originalPrice: result?.originalPrice || CONFIG.MESSAGES.NO_PRICE_DATA,
        isAvailable: result?.isAvailable || false
      });
    });
    
    return results;
  }
  
  /**
   * Очищает результаты парсинга
   */
  clearResults() {
    this.sheetService.clearResults();
  }
}