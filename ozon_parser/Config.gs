/**
 * Файл конфигурации для Ozon парсера
 * Config.gs
 */

const CONFIG = {
  // Настройки поиска столбцов по названию
  COLUMN_KEYWORDS: {
    NUMBER: ['№', 'номер', 'number', 'n'],
    ARTICLE: ['артикул', 'article', 'код', 'code'],
    TITLE: ['наименование', 'name', 'название', 'title', 'товар'],
    CARD_PRICE: ['сpp', 'кошелька', 'cardprice', 'card price'],
    PRICE: ['без ozon', 'без озон', 'всех скидок', 'price'],
    ORIGINAL_PRICE: ['первоначальная', 'original', 'оригинальная'],
    AVAILABLE: ['доступность', 'available', 'в наличии', 'наличие']
  },
  
  // Настройки API
  API_URL: 'http://<IP-ADRESS>:8000/api/v1/get_price',
  
  // Настройки запросов
  BATCH_SIZE: 50,           // Размер батча (максимум для Ozon API)
  REQUEST_DELAY: 2000,      // Задержка между запросами (мс)
  MAX_RETRIES: 3,           // Максимальное количество попыток
  
  // Настройки таблицы
  HEADER_ROW: 2,            // Строка с заголовками
  DATA_START_ROW: 3,        // Первая строка с данными
  
  // Сообщения
  MESSAGES: {
    NO_PRICE_DATA: 'Цена не найдена',
    PROCESSING: 'Обработка...',
    ERROR: 'Ошибка',
    NOT_AVAILABLE: 'Нет в наличии',
    COLUMN_NOT_FOUND: 'Столбец не найден'
  }
};