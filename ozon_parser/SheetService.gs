/**
 * Сервис работы с Google Sheets для Ozon парсера
 * SheetService.gs
 */

class SheetService {
  constructor(sheet) {
    this.sheet = sheet;
    this.columnMapping = this.detectColumns();
  }
  
  /**
   * Определяет колонки по названиям заголовков
   */
  detectColumns() {
    try {
      const headerRange = this.sheet.getRange(CONFIG.HEADER_ROW, 1, 1, this.sheet.getLastColumn());
      const headers = headerRange.getValues()[0];
      
      const mapping = {};
      
      headers.forEach((header, index) => {
        if (!header) return;
        
        const headerText = String(header).toLowerCase().trim();
        
        // Проверяем каждый тип колонки
        Object.keys(CONFIG.COLUMN_KEYWORDS).forEach(columnType => {
          const keywords = CONFIG.COLUMN_KEYWORDS[columnType];
          
          // Проверяем, содержит ли заголовок одно из ключевых слов
          if (keywords.some(keyword => headerText.includes(keyword.toLowerCase()))) {
            mapping[columnType] = index + 1; // +1 потому что колонки начинаются с 1
          }
        });
      });
      
      Logger.log('Обнаруженные колонки:');
      Logger.log(JSON.stringify(mapping, null, 2));
      
      return mapping;
      
    } catch (error) {
      Logger.log(`Ошибка определения колонок: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Получает номер колонки по типу
   */
  getColumnNumber(columnType) {
    if (!this.columnMapping[columnType]) {
      throw new Error(`${CONFIG.MESSAGES.COLUMN_NOT_FOUND}: ${columnType}`);
    }
    return this.columnMapping[columnType];
  }
  
  /**
   * Проверяет наличие всех необходимых колонок
   */
  validateColumns() {
    const requiredColumns = ['ARTICLE'];
    const missingColumns = [];
    
    requiredColumns.forEach(columnType => {
      if (!this.columnMapping[columnType]) {
        missingColumns.push(columnType);
      }
    });
    
    if (missingColumns.length > 0) {
      throw new Error(`Отсутствуют необходимые колонки: ${missingColumns.join(', ')}`);
    }
    
    return true;
  }
  
  /**
   * Получает артикулы из таблицы
   */
  getArticlesFromSheet() {
    try {
      this.validateColumns();
      
      const lastRow = this.sheet.getLastRow();
      
      if (lastRow < CONFIG.DATA_START_ROW) {
        return [];
      }
      
      const numRows = lastRow - CONFIG.DATA_START_ROW + 1;
      const articleCol = this.getColumnNumber('ARTICLE');
      
      const range = this.sheet.getRange(CONFIG.DATA_START_ROW, articleCol, numRows, 1);
      const values = range.getValues();
      
      const articles = [];
      
      values.forEach((row, index) => {
        const article = String(row[0]).trim();
        
        if (article && article !== '') {
          // Проверяем, что артикул состоит только из цифр
          if (/^\d+$/.test(article)) {
            articles.push({
              article: parseInt(article), // Ozon API принимает числа
              rowIndex: CONFIG.DATA_START_ROW + index
            });
          } else {
            Logger.log(`Невалидный артикул в строке ${CONFIG.DATA_START_ROW + index}: ${article}`);
          }
        }
      });
      
      return articles;
      
    } catch (error) {
      Logger.log(`Ошибка получения артикулов: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Сохраняет результаты в таблицу
   */
  saveResultsToSheet(results) {
    try {
      if (results.length === 0) {
        return;
      }
      
      // Сортируем по номеру строки для сохранения порядка
      results.sort((a, b) => a.rowIndex - b.rowIndex);
      
      const startRow = results[0].rowIndex;
      const numRows = results.length;
      
      // Сохраняем названия (если колонка существует)
      if (this.columnMapping.TITLE) {
        const titleValues = results.map(result => [result.title]);
        const titleCol = this.getColumnNumber('TITLE');
        const titleRange = this.sheet.getRange(startRow, titleCol, numRows, 1);
        titleRange.setValues(titleValues);
      }
      
      // Сохраняем цену со скидкой (если колонка существует)
      if (this.columnMapping.CARD_PRICE) {
        const cardPriceValues = results.map(result => [result.cardPrice]);
        const cardPriceCol = this.getColumnNumber('CARD_PRICE');
        const cardPriceRange = this.sheet.getRange(startRow, cardPriceCol, numRows, 1);
        cardPriceRange.setValues(cardPriceValues);
        cardPriceRange.setNumberFormat('#,##0" ₽"');
      }
      
      // Сохраняем обычную цену (если колонка существует)
      if (this.columnMapping.PRICE) {
        const priceValues = results.map(result => [result.price]);
        const priceCol = this.getColumnNumber('PRICE');
        const priceRange = this.sheet.getRange(startRow, priceCol, numRows, 1);
        priceRange.setValues(priceValues);
        priceRange.setNumberFormat('#,##0" ₽"');
      }
      
      // Сохраняем первоначальную цену (если колонка существует)
      if (this.columnMapping.ORIGINAL_PRICE) {
        const originalPriceValues = results.map(result => [result.originalPrice]);
        const originalPriceCol = this.getColumnNumber('ORIGINAL_PRICE');
        const originalPriceRange = this.sheet.getRange(startRow, originalPriceCol, numRows, 1);
        originalPriceRange.setValues(originalPriceValues);
        originalPriceRange.setNumberFormat('#,##0" ₽"');
      }
      
      // Сохраняем доступность (если колонка существует)
      if (this.columnMapping.AVAILABLE) {
        const availableValues = results.map(result => [result.isAvailable ? 'Да' : 'Нет']);
        const availableCol = this.getColumnNumber('AVAILABLE');
        const availableRange = this.sheet.getRange(startRow, availableCol, numRows, 1);
        availableRange.setValues(availableValues);
      }
      
      Logger.log(`Сохранено ${results.length} результатов`);
      
    } catch (error) {
      Logger.log(`Ошибка сохранения результатов: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Очищает результаты парсинга
   */
  clearResults() {
    try {
      const lastRow = this.sheet.getLastRow();
      
      if (lastRow < CONFIG.DATA_START_ROW) {
        return;
      }
      
      const numRows = lastRow - CONFIG.DATA_START_ROW + 1;
      
      // Очищаем все колонки с данными
      ['TITLE', 'CARD_PRICE', 'PRICE', 'ORIGINAL_PRICE', 'AVAILABLE'].forEach(columnType => {
        if (this.columnMapping[columnType]) {
          const col = this.getColumnNumber(columnType);
          const range = this.sheet.getRange(CONFIG.DATA_START_ROW, col, numRows, 1);
          range.clearContent();
        }
      });
      
      Logger.log('Результаты очищены');
      
    } catch (error) {
      Logger.log(`Ошибка очистки результатов: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Показывает информацию о найденных колонках
   */
  showColumnInfo() {
    let message = 'Найденные колонки:\n';
    
    Object.keys(this.columnMapping).forEach(columnType => {
      const columnNumber = this.columnMapping[columnType];
      const columnLetter = this.numberToColumn(columnNumber);
      message += `${columnType}: ${columnLetter}${columnNumber}\n`;
    });
    
    // Проверяем отсутствующие колонки
    const allTypes = Object.keys(CONFIG.COLUMN_KEYWORDS);
    const missingTypes = allTypes.filter(type => !this.columnMapping[type]);
    
    if (missingTypes.length > 0) {
      message += '\nОтсутствующие колонки:\n';
      missingTypes.forEach(type => {
        const keywords = CONFIG.COLUMN_KEYWORDS[type].join(', ');
        message += `${type} (ключевые слова: ${keywords})\n`;
      });
    }
    
    Logger.log(message);
    SpreadsheetApp.getActiveSpreadsheet().toast(message, 'Информация о колонках', 10);
  }
  
  /**
   * Преобразует номер колонки в букву
   */
  numberToColumn(num) {
    let result = '';
    while (num > 0) {
      num--;
      result = String.fromCharCode(65 + (num % 26)) + result;
      num = Math.floor(num / 26);
    }
    return result;
  }
}