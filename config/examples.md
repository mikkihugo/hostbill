# HostBill Cloud-IQ Configuration Examples

## Deno Application Configuration

### Direct Usage

Run the Deno application directly:

```bash
# Navigate to the Deno implementation
cd cloud-iq-deno

# Set environment variables
export HOSTBILL_URL="https://your-hostbill-instance.com"
export HOSTBILL_API_ID="your-api-id"
export HOSTBILL_API_KEY="your-api-key"
export CRAYON_CLIENT_ID="your-crayon-client-id"
export CRAYON_CLIENT_SECRET="your-crayon-client-secret"  
export CRAYON_TENANT_ID="your-crayon-tenant-id"

# Run the application
deno run -A --env main.ts
```

### Docker Configuration

```bash
# Build and run with Docker
cd cloud-iq-deno
docker build -t hostbill-cloud-iq .
docker run -p 8000:8000 --env-file .env hostbill-cloud-iq
```

### Environment Variables

Create a `.env` file in the `cloud-iq-deno/` directory:

```bash
# HostBill Configuration
HOSTBILL_URL=https://your-hostbill-instance.com
HOSTBILL_API_ID=your-api-id
HOSTBILL_API_KEY=your-api-key

# Crayon Cloud-IQ Configuration
CRAYON_CLIENT_ID=your-crayon-client-id
CRAYON_CLIENT_SECRET=your-crayon-client-secret
CRAYON_TENANT_ID=your-crayon-tenant-id

# Application Configuration
PORT=8000
SYNC_INTERVAL_MINUTES=60
ENABLE_MULTI_AGENT=true
```

## TypeScript/Node.js Configuration

For the alternative TypeScript implementation:

```bash
cd typescript-server
npm install
npm run build

export HOSTBILL_URL="https://your-hostbill-instance.com"
export HOSTBILL_API_ID="your-api-id"
export HOSTBILL_API_KEY="your-api-key"

npm start
```

## Testing the Connection

Access the web interface at `http://localhost:8000` to:
- View the dashboard
- Test API connections
- Monitor sync status
- Manage CSP orders