/**
 * Процессор данных для обработки ответов Ozon API
 * DataProcessor.gs
 */

class DataProcessor {
  /**
   * Обрабатывает ответ от Ozon API
   */
  processOzonResponse(apiResponse) {
    try {
      const results = [];
      
      if (!apiResponse.results || !Array.isArray(apiResponse.results)) {
        throw new Error('Некорректная структура ответа API');
      }
      
      apiResponse.results.forEach(result => {
        try {
          const processedProduct = this.processProduct(result);
          results.push(processedProduct);
        } catch (error) {
          Logger.log(`Ошибка обработки продукта ${result.article}: ${error.message}`);
          // Добавляем результат с ошибкой
          results.push({
            article: String(result.article),
            title: CONFIG.MESSAGES.ERROR,
            cardPrice: CONFIG.MESSAGES.ERROR,
            price: CONFIG.MESSAGES.ERROR,
            originalPrice: CONFIG.MESSAGES.ERROR,
            isAvailable: false
          });
        }
      });
      
      Logger.log(`Обработано ${results.length} продуктов`);
      return results;
      
    } catch (error) {
      Logger.log(`Ошибка обработки ответа API: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Обрабатывает один продукт
   */
  processProduct(result) {
    try {
      const article = String(result.article);
      
      let title = CONFIG.MESSAGES.NO_PRICE_DATA;
      let cardPrice = CONFIG.MESSAGES.NO_PRICE_DATA;
      let price = CONFIG.MESSAGES.NO_PRICE_DATA;
      let originalPrice = CONFIG.MESSAGES.NO_PRICE_DATA;
      let isAvailable = false;
      
      if (result.success && result.price_info) {
        const priceInfo = result.price_info;
        
        // Извлекаем название
        if (priceInfo.title) {
          title = priceInfo.title;
        }
        
        // Извлекаем цены (они уже в рублях)
        if (priceInfo.cardPrice) {
          cardPrice = priceInfo.cardPrice;
        }
        
        if (priceInfo.price) {
          price = priceInfo.price;
        }
        
        if (priceInfo.originalPrice) {
          originalPrice = priceInfo.originalPrice;
        }
        
        isAvailable = priceInfo.isAvailable || false;
      }
      
      return {
        article: article,
        title: title,
        cardPrice: cardPrice,
        price: price,
        originalPrice: originalPrice,
        isAvailable: isAvailable
      };
      
    } catch (error) {
      Logger.log(`Ошибка обработки продукта: ${error.message}`);
      throw error;
    }
  }
}