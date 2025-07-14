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
      
      let cardPrice = CONFIG.MESSAGES.NO_PRICE_DATA;
      let price = CONFIG.MESSAGES.NO_PRICE_DATA;
      let originalPrice = CONFIG.MESSAGES.NO_PRICE_DATA;
      let isAvailable = false;
      
      if (result.success && result.price_info) {
        const priceInfo = result.price_info;
        
        // Извлекаем цены (они приходят в копейках, переводим в рубли)
        if (priceInfo.cardPrice) {
          cardPrice = Math.round(priceInfo.cardPrice / 100);
        }
        
        if (priceInfo.price) {
          price = Math.round(priceInfo.price / 100);
        }
        
        if (priceInfo.originalPrice) {
          originalPrice = Math.round(priceInfo.originalPrice / 100);
        }
        
        isAvailable = priceInfo.isAvailable || false;
      }
      
      return {
        article: article,
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