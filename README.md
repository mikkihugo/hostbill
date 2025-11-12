# Cloud-IQ - Crayon & HostBill Integration

Production-ready Cloud-IQ HostBill Integration with Microsoft GenAI for CSP billing management.

## Architecture

**Modern Stack:**

- **Frontend:** Remix v2.12 with React 18 (file-based routing)
- **Runtime:** Node.js 22 LTS
- **Backend:** Node.js HTTP server with Web API compatibility
- **AI Integration:** Microsoft GenAI Script agents
- **Database:** SQLite file-based storage
- **Styling:** Tailwind CSS + Lucide Icons
- **Code Quality:** ESLint 9 + Prettier 3

## Features

### Dashboard

- Real-time sync status: Active syncs, usage records, orders
- Agent monitoring: Multi-agent crew status and task management
- Stats visualization: Interactive cards with live metrics

### Orders Management

- Browse all CSP orders from HostBill
- View order status and billing amounts
- Track customer subscriptions

### Sync Monitor

- Manual trigger for Crayon and HostBill synchronization
- Sync activity logging
- Status notifications

### Backend Integration

- Crayon API: Cloud-IQ CSP product catalog
- HostBill API: Customer and order management
- GenAI: Intelligent billing automation and agent workflows
- Database: SQLite for reliable data persistence

## Getting Started

### Prerequisites

- Node.js >= 22.0.0
- npm >= 10.0.0

### Installation

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Configure environment variables
# CRAYON_CLIENT_ID, CRAYON_CLIENT_SECRET
# HOSTBILL_API_KEY, HOSTBILL_API_URL
# GENAI_API_KEY (for Microsoft GenAI integration)
```

### Development

```bash
# Run development server (Remix + hot reload)
npm run dev

# Lint code
npm run lint

# Format code
npm run format

# Run tests
npm run test
```

### Production Build

```bash
# Build optimized production bundle
npm run build

# Start production server
npm run start

# Docker deployment
npm run docker:prod
```

## File Structure

```
hostbill/
├── app/                          # Remix app
│   ├── root.jsx                 # Root layout with nav
│   ├── routes/
│   │   ├── _index.jsx          # Dashboard page
│   │   ├── orders.jsx          # Orders page
│   │   └── sync.jsx            # Sync monitor page
│
├── src/                          # Node.js backend
│   ├── main.js                 # HTTP server entry
│   ├── lib/
│   │   ├── api/               # API clients
│   │   │   ├── crayon.js     # Crayon Cloud-IQ API
│   │   │   └── hostbill.js   # HostBill API
│   │   ├── sync.js            # Billing sync logic
│   │   ├── genai.js           # GenAI agent integration
│   │   ├── config.js          # Config validation
│   │   ├── logger.js          # Structured logging
│   │   ├── security.js        # Security middleware
│   │   └── db/
│   │       └── sqlite.js      # Database layer
│   └── data/                  # SQLite database files
│
├── server.js                   # Remix server handler
├── remix.config.js             # Remix configuration
├── tsconfig.json               # TypeScript config
├── eslint.config.js            # ESLint rules
├── .prettierrc.json            # Prettier config
├── package.json                # Dependencies
└── Dockerfile                  # Production container
```

## API Integration

### Loader Functions

Remix loaders fetch data on the server:

```jsx
export async function loader() {
  const response = await fetch('http://localhost:3000/api/sync/stats');
  const stats = await response.json();
  return { stats };
}
```

### Action Functions

Remix actions handle form submissions:

```jsx
export async function action({ request }) {
  if (request.method === 'POST') {
    const response = await fetch('http://localhost:3000/api/sync/manual', {
      method: 'POST'
    });
    return await response.json();
  }
}
```

## Code Quality

### ESLint

- All 50+ errors fixed
- 12 intentional warnings (security.js)
- Enforces proper patterns

### Prettier

- 100 character line width
- Single quotes
- 2-space indentation

### Validation

```bash
npm run validate  # lint + format check + tests
```

## Deployment

### Docker

```bash
npm run docker:build   # Build image
npm run docker:run     # Run container
npm run docker:prod    # Production
```

### Environment Variables

Create `.env` file with:

- CRAYON_CLIENT_ID, CRAYON_CLIENT_SECRET
- HOSTBILL_API_KEY, HOSTBILL_API_URL
- GENAI_API_KEY
- PORT, NODE_ENV

## Testing

```bash
npm run test           # Run tests
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report
```

## License

MIT

## Support

https://github.com/mikkihugo/hostbill/issues
