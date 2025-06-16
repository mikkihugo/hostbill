# HostBill MCP Server

An MCP (Model Context Protocol) server for HostBill that provides dynamic API discovery and tool generation.

## Features

- **Dynamic API Discovery**: Automatically discovers available HostBill API methods using the `getAPIMethods` endpoint
- **Permission-Aware Tools**: Only exposes API methods that the provided API key has access to
- **Adaptive Selection**: Uses meta-tools pattern for large APIs (>50 methods) or individual tools for smaller APIs
- **Secure Authentication**: Handles API authentication securely with proper error handling
- **Caching**: Implements caching for API method discovery to improve performance
- **Comprehensive Error Handling**: Graceful degradation when API is unavailable

## Installation

1. Clone this repository
2. Install PHP dependencies:
   ```bash
   composer install --no-dev
   ```

## Configuration

Set the following environment variables:

- `HOSTBILL_URL`: Your HostBill instance URL (e.g., `https://billing.yourcompany.com`)
- `HOSTBILL_API_ID`: Your HostBill API ID
- `HOSTBILL_API_KEY`: Your HostBill API Key

## Usage

### Test Connection

Before using with an MCP client, test the connection:

```bash
export HOSTBILL_URL="https://your-hostbill-instance.com"
export HOSTBILL_API_ID="your-api-id"
export HOSTBILL_API_KEY="your-api-key"

php bin/hostbill-mcp-server --test
```

### With Claude Desktop

Add to your Claude Desktop configuration:

```json
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