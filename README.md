# HostBill MCP Server

An MCP (Model Context Protocol) server for HostBill that provides dynamic API discovery and tool generation.

## Available Implementations

This repository provides **two complete implementations**:

1. **PHP Implementation** (recommended for HostBill environments) - Located in the root directory
2. **TypeScript/Node.js Implementation** (modern alternative) - Located in `typescript-server/`

Both implementations provide identical functionality and MCP protocol compliance.

## Quick Start

### PHP Version (Recommended)
```bash
# Install dependencies
composer install --no-dev

# Test connection
export HOSTBILL_URL="https://your-hostbill-instance.com"
export HOSTBILL_API_ID="your-api-id"
export HOSTBILL_API_KEY="your-api-key"
php bin/hostbill-mcp-server --test

# Use with Claude Desktop - add to claude_desktop_config.json:
{
  "mcpServers": {
    "hostbill": {
      "command": "php",
      "args": ["/path/to/hostbill-mcp-server/bin/hostbill-mcp-server"],
      "env": {
        "HOSTBILL_URL": "https://your-hostbill-instance.com",
        "HOSTBILL_API_ID": "your-api-id",
        "HOSTBILL_API_KEY": "your-api-key"
      }
    }
  }
}
```

### TypeScript Version
```bash
# Build and install
cd typescript-server
npm install
npm run build

# Test connection
export HOSTBILL_URL="https://your-hostbill-instance.com"
export HOSTBILL_API_ID="your-api-id"
export HOSTBILL_API_KEY="your-api-key"
node dist/index.js --test

# Use with Claude Desktop - add to claude_desktop_config.json:
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

## Implementation Comparison

| Feature | PHP Version | TypeScript Version |
|---------|-------------|-------------------|
| **Runtime** | PHP 8.1+ | Node.js 18+ |
| **Dependencies** | Minimal (cURL) | node-fetch |
| **Startup Time** | ~50ms | ~200ms |
| **Memory Usage** | ~10-15MB | ~25-35MB |
| **Type Safety** | Runtime only | Compile-time + Runtime |
| **Development** | Traditional PHP | Modern ES modules |
| **Deployment** | Simple (single binary) | Requires build step |
| **Performance** | Excellent | Very good |
| **Debugging** | Standard PHP tools | Rich TypeScript tooling |

**Recommendation**: Use the PHP version for production HostBill environments due to lower resource usage and simpler deployment. Use the TypeScript version if you prefer modern development tools and type safety.

## How It Works

### Dynamic Discovery

The server uses HostBill's built-in introspection capabilities:

1. **Connection Test**: Verifies API connectivity using a ping request
2. **Method Discovery**: Calls `getAPIMethods` to get all available API methods
3. **Permission Filtering**: Only methods accessible to the API key are exposed
4. **Tool Generation**: Creates MCP tools based on discovered methods

### Adaptive Tool Strategy

- **Individual Tools** (≤50 methods): Creates a specific tool for each API method
- **Meta-Tools** (>50 methods): Creates three meta-tools:
  - `hostbill_list_methods`: List and filter available methods
  - `hostbill_get_method_details`: Get details for specific methods
  - `hostbill_call_api`: Execute any API method with parameters

### Fallback Mode

If API discovery fails, the server provides basic tools:
- Connection testing
- Server information retrieval

## Available Tools

### Individual Mode Tools

When fewer than 50 API methods are available, each method gets its own tool:
- `hostbill_[method_name]`: Execute specific API methods

### Meta-Tools Mode

When 50+ API methods are available:

- **`hostbill_list_methods`**: List available API methods
  - Parameters: `filter` (string), `category` (string)
  
- **`hostbill_get_method_details`**: Get method information
  - Parameters: `method` (string, required)
  
- **`hostbill_call_api`**: Execute any API method
  - Parameters: `method` (string, required), `parameters` (object)

### Fallback Tools

- **`hostbill_test_connection`**: Test API connectivity
- **`hostbill_server_info`**: Get HostBill server information

## Security Considerations

- API credentials are handled securely through environment variables
- Only methods permitted by the API key are exposed
- Input validation and error handling prevent malicious requests
- No sensitive data is logged or cached persistently

## Performance Features

- **Method Caching**: API method lists are cached for 5 minutes
- **Lazy Loading**: Method details are fetched only when needed
- **Connection Pooling**: Reuses HTTP connections when possible
- **Graceful Degradation**: Falls back to basic functionality if discovery fails

## Example Interactions

### Listing Available Methods
```
User: "What HostBill API methods are available?"
Assistant: Uses hostbill_list_methods to show all accessible methods
```

### Getting Client Information
```
User: "Get information about client ID 123"
Assistant: Uses hostbill_call_api with method="getClientDetails" and parameters={"id": 123}
```

### Creating an Invoice
```
User: "Create an invoice for client 456"
Assistant: Uses hostbill_call_api with method="createInvoice" and appropriate parameters
```

## Requirements

- PHP 8.1 or higher
- cURL extension
- HostBill instance with API access
- Valid HostBill API credentials

## Troubleshooting

### Connection Issues
1. Verify HostBill URL is correct and accessible
2. Check API credentials are valid
3. Ensure HostBill API is enabled
4. Test with `--test` flag for detailed diagnostics

### Permission Issues
- Verify API key has necessary permissions in HostBill admin
- Check that API access is enabled for your user role

### Performance Issues
- Consider using meta-tools mode for large API sets
- Monitor cache hit rates in logs
- Increase cache timeout if needed

## License

MIT License - see LICENSE file for details