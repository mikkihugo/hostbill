# HostBill MCP Server (TypeScript)

Alternative TypeScript/Node.js implementation of the HostBill MCP Server with dynamic API discovery.

## Features

- **Modern TypeScript Implementation**: Type-safe implementation using modern ES modules
- **Dynamic API Discovery**: Automatically discovers available HostBill API methods
- **Permission-Aware Tools**: Only exposes API methods that the provided API key has access to
- **Adaptive Selection**: Uses meta-tools pattern for large APIs (>50 methods)
- **Async/Await**: Modern async patterns throughout
- **Comprehensive Error Handling**: Graceful degradation and detailed error messages

## Installation

1. Install Node.js 18+ and npm
2. Install dependencies:
   ```bash
   cd typescript-server
   npm install
   ```
3. Build the TypeScript code:
   ```bash
   npm run build
   ```

## Configuration

Set the following environment variables:

- `HOSTBILL_URL`: Your HostBill instance URL (e.g., `https://billing.yourcompany.com`)
- `HOSTBILL_API_ID`: Your HostBill API ID
- `HOSTBILL_API_KEY`: Your HostBill API Key

## Usage

### Development Mode

Run directly with TypeScript:
```bash
npm run dev
```

### Production Mode

Build and run:
```bash
npm run build
npm start
```

### Test Connection

```bash
export HOSTBILL_URL="https://your-hostbill-instance.com"
export HOSTBILL_API_ID="your-api-id"
export HOSTBILL_API_KEY="your-api-key"

node dist/index.js --test
```

### With Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "hostbill-ts": {
      "command": "node",
      "args": ["/path/to/hostbill-mcp-server/typescript-server/dist/index.js"],
      "env": {
        "HOSTBILL_URL": "https://your-hostbill-instance.com",
        "HOSTBILL_API_ID": "your-api-id",
        "HOSTBILL_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Run the compiled server
- `npm run dev` - Run in development mode with tsx
- `npm run test` - Run tests

## Architecture

### Key Components

- **HostBillAPIClient**: HTTP client for HostBill API communication
- **HostBillMCPServer**: Main MCP server implementation
- **MCPProtocol**: JSON-RPC protocol handling

### Type Safety

The TypeScript implementation provides:
- Strong typing for all API interfaces
- Type-safe parameter validation
- Compile-time error checking
- Better IDE support and autocomplete

### Modern Features

- ES Modules with proper imports/exports
- Async/await for all asynchronous operations
- Map-based tool storage for O(1) lookups
- Proper error handling with try/catch blocks
- Clean separation of concerns

## Dependencies

- **node-fetch**: HTTP client for API requests
- **typescript**: TypeScript compiler
- **tsx**: TypeScript execution for development
- **@types/node**: Node.js type definitions

## Requirements

- Node.js 18.0.0 or higher
- HostBill instance with API access
- Valid HostBill API credentials

## License

MIT License - see LICENSE file for details