# Ozon Price Parser API

FastAPI-based API for parsing product prices from Ozon using Selenium with stealth mode.

## Features

- 🚀 Fast and efficient price parsing
- 🛡️ Anti-bot protection bypass using selenium-stealth
- 📊 Batch processing up to 50 articles per request
- 🔄 Automatic retry mechanism
- 📝 Comprehensive logging
- 🏗️ Modular and scalable architecture
- 🐳 Docker support

## Project Structure

```
ozon-parser-api/
├── config/
│   └── settings.py          # Application settings
├── models/
│   └── schemas.py           # Pydantic models
├── utils/
│   └── helpers.py           # Utility functions
├── driver_manager/
│   └── selenium_manager.py  # Selenium WebDriver management
├── parser/
│   └── ozon_parser.py       # Main parsing logic
├── routes/
│   └── parser_routes.py     # FastAPI routes
├── main.py                  # Application entry point
├── run.py                   # Setup and run script
├── requirements.txt         # Python dependencies
├── .env                     # Environment variables
├── Dockerfile              # Docker configuration
└── README.md               # This file
```

## Quick Start

### Prerequisites

- Python 3.11+
- Chrome browser
- ChromeDriver (matching your Chrome version)

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd ozon-parser-api
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env file with your settings
```

4. **Run the application:**
```bash
python run.py
```

Or manually:
```bash
python main.py
```

### Docker Setup

```bash
# Build image
docker build -t ozon-parser-api .

# Run container
docker run -p 8000:8000 ozon-parser-api
```

## API Usage

### Health Check

```bash
curl http://localhost:8000/api/v1/health
```

### Parse Prices

```bash
curl -X POST "http://localhost:8000/api/v1/get_price" \
  -H "Content-Type: application/json" \
  -d '{
    "articles": [2360879218, 859220077, 2430448285, 2392842054, 1774818716]
  }'
```

### Response Format

```json
{
  "success": true,
  "total_articles": 5,
  "parsed_articles": 4,
  "results": [
    {
      "article": 2360879218,
      "success": true,
      "price_info": {
        "isAvailable": true,
        "cardPrice": 55325,
        "price": 61472,
        "originalPrice": 79227
      },
      "error": null
    },
    {
      "article": 859220077,
      "success": false,
      "price_info": null,
      "error": "Failed to extract price info"
    }
  ],
  "errors": ["Failed to extract price info"]
}
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `API_HOST` | API host address | `0.0.0.0` |
| `API_PORT` | API port | `8000` |
| `API_DEBUG` | Debug mode | `true` |
| `HEADLESS` | Run browser in headless mode | `false` |
| `MAX_ARTICLES_PER_REQUEST` | Maximum articles per request | `50` |
| `MAX_RETRIES` | Maximum retry attempts | `3` |
| `RETRY_DELAY` | Delay between retries (seconds) | `2` |

### Settings

You can modify settings in `config/settings.py` or use environment variables.

## API Endpoints

### `POST /api/v1/get_price`

Parse prices for given articles.

**Request Body:**
```json
{
  "articles": [123456789, 987654321]
}
```

**Response:**
- `success`: Overall success status
- `total_articles`: Total number of articles requested
- `parsed_articles`: Number of successfully parsed articles
- `results`: Array of parsing results for each article
- `errors`: List of error messages

### `GET /api/v1/health`

Health check endpoint.

### `POST /api/v1/restart_parser`

Restart the parser instance (useful for debugging).

## How It Works

1. **Request Processing**: API receives article numbers in POST request
2. **URL Construction**: Builds Ozon API URLs for each article
3. **Stealth Navigation**: Uses selenium-stealth to bypass anti-bot protection
4. **JSON Extraction**: Waits for and captures JSON response from Ozon API
5. **Price Parsing**: Extracts price information from `widgetStates.webPrice-*` properties
6. **Response Formation**: Returns structured response with all results

## Anti-Bot Protection

The parser uses several techniques to bypass Ozon's anti-bot protection:

- **Selenium Stealth**: Hides automation indicators
- **User Agent Spoofing**: Uses realistic browser user agents
- **Request Timing**: Implements delays between requests
- **Error Handling**: Detects and handles blocking scenarios

## Performance

- **Target Time**: 3-5 seconds per article
- **Batch Processing**: Up to 50 articles per request
- **Retry Logic**: Automatic retry on failures
- **Resource Management**: Proper cleanup of browser instances

## Logging

The application provides comprehensive logging:

- Request/response logging
- Parsing progress tracking
- Error reporting
- Performance metrics

## Development

### Adding New Features

1. **Parser Extensions**: Modify `parser/ozon_parser.py`
2. **New Endpoints**: Add routes to `routes/parser_routes.py`
3. **Configuration**: Update `config/settings.py`
4. **Models**: Add new schemas to `models/schemas.py`

### Testing

```bash
# Test with sample data
curl -X POST "http://localhost:8000/api/v1/get_price" \
  -H "Content-Type: application/json" \
  -d '{
    "articles": [2360879218]
  }'
```

## Future Enhancements

- [x] Multiple worker support
- [ ] Connection pooling
- [ ] Caching mechanism
- [ ] Rate limiting
- [ ] Monitoring and metrics
- [ ] Database integration
- [ ] Authentication

## Troubleshooting

### Common Issues

1. **ChromeDriver not found**
   - Download ChromeDriver matching your Chrome version
   - Add to PATH or place in project directory

2. **Anti-bot detection**
   - Check if IP is blocked
   - Adjust delay settings
   - Verify stealth configuration

3. **JSON parsing errors**
   - Check if Ozon API structure changed
   - Verify response format
   - Update parsing logic if needed

### Debug Mode

Set `HEADLESS=false` in `.env` to see browser actions in real-time.

## License

MIT License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request