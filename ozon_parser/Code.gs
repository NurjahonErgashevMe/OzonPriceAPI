/**
 * Основные функции для Ozon парсера
 * Code.gs
 */

/**
 * Главная функция для парсинга артикулов
 * Запускается из меню
 */
function parseArticles() {
  try {
    Logger.log('=== НАЧАЛО ПАРСИНГА АРТИКУЛОВ OZON ===');
    
    const sheet = SpreadsheetApp.getActiveSheet();
    const parser = new OzonParser(sheet);
    
    // Показываем начальное сообщение
    showProgressToast('Начинаем парсинг артикулов...');
    
    // Запускаем парсинг
    parser.parseAllArticles();
    
    Logger.log('=== ПАРСИНГ ЗАВЕРШЕН ===');
    showProgressToast('Парсинг завершен успешно!');
    
  } catch (error) {
    Logger.log(`Критическая ошибка: ${error.message}`);
    showErrorToast(`Ошибка: ${error.message}`);
  }
}

/**
 * Функция для очистки результатов парсинга
 */
function clearResults() {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const parser = new OzonParser(sheet);
    parser.clearResults();
    
    showProgressToast('Результаты очищены');
    
  } catch (error) {
    Logger.log(`Ошибка очистки: ${error.message}`);
    showErrorToast(`Ошибка очистки: ${error.message}`);
  }
}

/**
 * Создает меню в таблице
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Ozon Парсер')
    .addItem('Парсить артикулы', 'parseArticles')
    .addItem('Очистить результаты', 'clearResults')
    .addToUi();
}