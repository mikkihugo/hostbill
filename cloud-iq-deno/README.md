# Cloud-IQ Deno Fresh2 Application

A comprehensive Crayon Cloud-IQ integration with HostBill for CSP (Cloud Solution Provider) billing management built with Deno Fresh2.

## Features

- **Crayon Cloud-IQ API Integration**: Full support for Microsoft 365, Teams, and other CSP services
- **HostBill Integration**: Automatic product/service management and billing sync
- **Order Management**: Web-based order creation and routing to HostBill
- **Usage Tracking**: Real-time usage monitoring and billing synchronization
- **Renewal Management**: Automated renewal tracking and sync
- **Multi-Agent Development Crews**: AI-powered task orchestration with specialized agents
- **Federated MCP Support**: Integration with Model Context Protocol servers
- **File-based Database**: SQLite for initial deployment, PostgreSQL migration ready
- **Docker Support**: Full containerization with Docker Compose

## Architecture

- **Frontend**: Deno Fresh2 with Tailwind CSS
- **Backend**: TypeScript with Deno runtime
- **Database**: JSON-based file storage (SQLite replacement) with PostgreSQL migration path
- **APIs**: Crayon Cloud-IQ REST API and HostBill API integration
- **Multi-Agent System**: Specialized agents for sync, orders, analytics, and monitoring
- **MCP Integration**: Federated Model Context Protocol server support
- **Deployment**: Docker containers with health checks

## Quick Start

### Prerequisites

- Deno 1.40+ installed
- Crayon Cloud-IQ API credentials
- HostBill instance with API access

### Environment Setup

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Configure your API credentials in `.env`:
   ```bash
   # Crayon Cloud-IQ API Configuration
   CRAYON_CLIENT_ID=your_crayon_client_id
   CRAYON_CLIENT_SECRET=your_crayon_client_secret
   CRAYON_TENANT_ID=your_crayon_tenant_id

   # HostBill API Configuration
   HOSTBILL_URL=https://your-hostbill-instance.com
   HOSTBILL_API_ID=your_hostbill_api_id
   HOSTBILL_API_KEY=your_hostbill_api_key
   
   # Enable multi-agent development crews
   ENABLE_MULTI_AGENT=true
   ```

### Development

1. Install dependencies and start development server:
   ```bash
   deno task dev
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
   deno task start
   ```

## API Endpoints

### Web Routes

- `/` - Main dashboard with sync statistics
- `/orders` - Order creation and management
- `/sync` - Sync monitoring and manual controls

### API Routes

- `POST /api/sync/manual` - Trigger manual synchronization
- `GET /api/sync/stats` - Get synchronization statistics
- `GET /api/agents/status` - Get multi-agent crew status
- `GET /api/agents/tasks` - Get agent tasks (with filtering)
- `POST /api/agents/tasks` - Create new agent task
- `POST /api/agents/workflow` - Orchestrate multi-agent workflow

## Multi-Agent Development Crews

The system includes a sophisticated multi-agent architecture with specialized agents:

### Agent Types

1. **SyncAgent** - Data Synchronization Specialist
   - Handles Crayon-to-HostBill synchronization
   - Manages billing reconciliation
   - Monitors data consistency

2. **OrderAgent** - Order Processing Specialist  
   - Processes CSP orders and approvals
   - Manages customer workflows
   - Coordinates order fulfillment

3. **AnalyticsAgent** - Business Intelligence Specialist
   - Provides usage analysis and insights
   - Generates cost optimization recommendations
   - Performs trend forecasting

4. **MonitorAgent** - System Monitoring Specialist
   - Monitors system health and performance
   - Manages alerts and notifications
   - Optimizes system performance

### Task Orchestration

Agents can work individually or in coordinated workflows:

```typescript
// Create individual task
const taskId = await multiAgentCrew.createTask({
  type: 'sync',
  priority: 'high',
  payload: { operation: 'full-sync' }
});

// Orchestrate complex workflow
const taskIds = await multiAgentCrew.orchestrateWorkflow('order-processing', {
  customerId: 'customer123',
  products: ['office365', 'teams']
});
```

### Federated MCP Integration

The system supports integration with federated Model Context Protocol servers:

- **HostBill MCP Server**: Direct integration with existing HostBill MCP
- **Crayon MCP Server**: Conceptual integration for Crayon API
- **Analytics MCP Server**: Future integration for advanced analytics

Enable multi-agent crews with:
```bash
export ENABLE_MULTI_AGENT=true
```

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
- Default: SQLite file in `./data/cloudiq.db`
- PostgreSQL migration ready (see docker-compose.yml)

## Security Considerations

- API credentials stored in environment variables
- Database files excluded from version control
- HTTPS recommended for production deployments
- Regular backup of database files

## Development

### Project Structure

```
cloud-iq-deno/
├── lib/
│   ├── api/
│   │   ├── crayon.ts      # Crayon Cloud-IQ API client
│   │   └── hostbill.ts    # HostBill API client
│   ├── db/
│   │   └── sqlite.ts      # SQLite database layer
│   └── sync.ts            # Synchronization service
├── routes/
│   ├── api/
│   │   └── sync/
│   │       └── manual.ts  # Manual sync API
│   ├── orders/
│   │   └── index.tsx      # Order management page
│   ├── sync/
│   │   └── index.tsx      # Sync monitoring page
│   ├── _404.tsx           # 404 error page
│   ├── _app.tsx           # App wrapper
│   └── index.tsx          # Dashboard
├── main.ts                # Application entry point
├── fresh.config.ts        # Fresh2 configuration
├── deno.json             # Deno configuration
└── docker-compose.yml    # Docker deployment
```

### Adding New Features

1. **New API Clients**: Add to `lib/api/`
2. **Database Extensions**: Extend `lib/db/sqlite.ts`
3. **Routes**: Add to `routes/` following Fresh2 conventions
4. **Sync Logic**: Extend `lib/sync.ts`

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
3. Verify API connectivity using test endpoints

## Future Enhancements

- [ ] PostgreSQL migration for larger deployments
- [ ] Multi-tenant support
- [ ] Advanced reporting and analytics
- [ ] Webhook support for real-time updates
- [ ] Integration with Microsoft AI and GenAIScript for multi-agent development crews
- [ ] Enhanced UI with interactive dashboards