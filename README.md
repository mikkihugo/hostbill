# Cloud-IQ HostBill Integration

A comprehensive Crayon Cloud-IQ integration with HostBill for CSP (Cloud Solution Provider) billing management built with Node.js and Microsoft GenAI Script.

## Features

- **Crayon Cloud-IQ API Integration**: Full support for Microsoft 365, Teams, and other CSP services
- **HostBill Integration**: Automatic product/service management and billing sync
- **Microsoft GenAI Agents**: AI-powered billing analysis, customer support, and process automation
- **GenAI Proxy API**: Direct access to GenAI Script functionality for custom workflows
- **Order Management**: Web-based order creation and routing to HostBill
- **Usage Tracking**: Real-time usage monitoring and billing synchronization
- **Renewal Management**: Automated renewal tracking and sync
- **Dynamic Authentication**: Flexible user authentication for Crayon integration
- **Docker Support**: Full containerization with Docker Compose

## Architecture

- **Backend**: Node.js runtime with modern JavaScript/ES modules
- **AI Integration**: Microsoft GenAI Script for intelligent automation
- **Database**: JSON-based file storage with PostgreSQL migration path
- **APIs**: Crayon Cloud-IQ REST API and HostBill API integration
- **Deployment**: Docker containers with health checks

## Quick Start

### Prerequisites

- Node.js 18+ installed
- Crayon Cloud-IQ API credentials
- HostBill instance with API access
- OpenAI API key (for GenAI features)

### Environment Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

3. Configure your API credentials in `.env`:
   ```bash
   # HostBill Configuration
   HOSTBILL_URL=https://your-hostbill-instance.com
   HOSTBILL_API_ID=your_hostbill_api_id
   HOSTBILL_API_KEY=your_hostbill_api_key

   # Crayon Cloud-IQ Configuration
   CRAYON_CLIENT_ID=your_crayon_client_id
   CRAYON_CLIENT_SECRET=your_crayon_client_secret
   CRAYON_TENANT_ID=your_crayon_tenant_id

   # GenAI Configuration
   ENABLE_GENAI=true
   GENAI_API_KEY=your_openai_api_key
   GENAI_MODEL=gpt-4
   ```

### Development

1. Start development server:
   ```bash
   npm run dev
   ```

2. Open your browser to `http://localhost:8000`

### Production Deployment

#### Docker Compose (Recommended)

1. Configure environment variables in `.env`

2. Start the application:
   ```bash
   docker-compose up -d
   ```

3. The application will be available at `http://localhost:8000`

#### Manual Deployment

1. Build and start the application:
   ```bash
   npm start
   ```

## API Endpoints

### Web Routes

- `/` - Main dashboard with sync statistics and agent status
- `/orders` - Order creation and management
- `/sync` - Sync monitoring and manual controls

### API Routes

#### Sync Management
- `POST /api/sync/manual` - Trigger manual synchronization
- `GET /api/sync/stats` - Get synchronization statistics

#### GenAI Agent Management
- `GET /api/agents/status` - Get agent status and metrics
- `POST /api/agents/tasks` - Create new AI agent task
- `GET /api/agents/tasks` - List all tasks
- `POST /api/agents/workflow` - Process multi-step workflow

#### GenAI Proxy API
- `POST /api/genai/execute` - Execute GenAI Script directly
- `GET /api/genai/models` - Get available AI models

### API Routes

- `POST /api/sync/manual` - Trigger manual synchronization
- `GET /api/sync/stats` - Get synchronization statistics

## Database Schema

### Sync Records
- Tracks synchronization between Crayon subscriptions and HostBill services
- Status: pending, synced, error

### Usage Records
- Stores usage data from Crayon for billing purposes
- Links to sync records for invoice generation

### Order Records
- Manages CSP orders created through the system
- Tracks approval workflow and HostBill integration

## Sync Process

The system automatically synchronizes data between Crayon Cloud-IQ and HostBill:

1. **Subscription Sync**: Active subscriptions from Crayon → HostBill products/services
2. **Usage Tracking**: Usage data from Crayon → HostBill invoices
3. **Order Processing**: New orders → Both systems with approval workflow
4. **Renewal Management**: Upcoming renewals → Service updates

## Configuration

### Sync Interval
- Default: 60 minutes
- Configurable via `SYNC_INTERVAL_MINUTES` environment variable

### Database
- Default: JSON file in `./data/cloudiq.json`
- PostgreSQL migration ready (see docker-compose.yml)

### Authentication
- Dynamic user authentication for Crayon API
- Secure credential management via environment variables

## Security Considerations

- API credentials stored in environment variables
- Database files excluded from version control
- HTTPS recommended for production deployments
- Regular backup of database files

## Development

### Project Structure

```
cloud-iq-hostbill/
├── src/
│   ├── api/
│   │   ├── crayon.js      # Crayon Cloud-IQ API client
│   │   └── hostbill.js    # HostBill API client
│   ├── db/
│   │   └── sqlite.js      # Database layer
│   └── sync.js            # Synchronization service
├── routes/
│   ├── api/
│   │   └── sync/
│   │       └── manual.js  # Manual sync API
│   ├── orders/
│   │   └── index.jsx      # Order management page
│   ├── sync/
│   │   └── index.jsx      # Sync monitoring page
│   ├── _404.jsx           # 404 error page
│   ├── _app.jsx           # App wrapper
│   └── index.jsx          # Dashboard
├── main.js                # Application entry point
├── deno.json             # Deno configuration
└── docker-compose.yml    # Docker deployment
```

### Adding New Features

1. **New API Clients**: Add to `src/api/`
2. **Database Extensions**: Extend `src/db/sqlite.js`
3. **Routes**: Add to `routes/` following conventions
4. **Sync Logic**: Extend `src/sync.js`

## Troubleshooting

### Common Issues

1. **Database Lock Errors**: Ensure proper cleanup in sync service
2. **API Authentication**: Verify Crayon and HostBill credentials
3. **Network Issues**: Check firewall and DNS resolution
4. **Sync Failures**: Monitor logs and sync status page

### Logs

Check application logs for detailed error information:
```bash
docker-compose logs -f cloud-iq
```

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the sync monitoring page for error details
2. Review application logs
3. Verify API connectivity using test endpoints.