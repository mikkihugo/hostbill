# HostBill MCP Server Configuration Examples

## Claude Desktop Configuration

Add this to your Claude Desktop configuration file:

### For macOS:
`~/Library/Application Support/Claude/claude_desktop_config.json`

### For Windows:
`%APPDATA%\Claude\claude_desktop_config.json`

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

## Environment Variables

Create a `.env` file in your project root:

```bash
HOSTBILL_URL=https://your-hostbill-instance.com
HOSTBILL_API_ID=your-api-id
HOSTBILL_API_KEY=your-api-key
```

## VS Code Configuration

For use with Continue or other MCP-compatible VS Code extensions:

```json
{
  "mcp": {
    "servers": {
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
}
```

## Direct Usage

You can also run the server directly:

```bash
export HOSTBILL_URL="https://your-hostbill-instance.com"
export HOSTBILL_API_ID="your-api-id"
export HOSTBILL_API_KEY="your-api-key"

php bin/hostbill-mcp-server
```

## Testing the Connection

Before setting up with an MCP client, test the connection:

```bash
php bin/hostbill-mcp-server --test
```

This will verify:
- Connection to your HostBill instance
- API authentication
- Discovery of available API methods
- HostBill version information