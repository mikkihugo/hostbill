# HostBill MCP Server

A modern MCP (Model Context Protocol) server for HostBill that provides dynamic API discovery and intelligent tool generation.

## 🚀 Quick Start

Choose your preferred implementation:

### Deno Implementation (Recommended)
```bash
cd cloud-iq-deno
export HOSTBILL_URL="https://your-hostbill-instance.com"
export HOSTBILL_API_ID="your-api-id"
export HOSTBILL_API_KEY="your-api-key"
deno run -A --env main.ts
```

### TypeScript/Node.js Implementation
```bash
cd typescript-server
npm install && npm run build
export HOSTBILL_URL="https://your-hostbill-instance.com"
export HOSTBILL_API_ID="your-api-id" 
export HOSTBILL_API_KEY="your-api-key"
node dist/index.js
```

## 📦 Available Implementations

| Implementation | Runtime | Dependencies | Performance | Security |
|---|---|---|---|---|
| **Deno** | Deno 1.48+ | Zero external | ~100ms startup | Secure by default |
| **TypeScript** | Node.js 18+ | Minimal | ~200ms startup | Standard Node.js |

**Recommendation**: Use Deno for modern development with built-in TypeScript support and enhanced security.

## 🔧 How It Works

### Dynamic API Discovery
1. **Connection Test**: Verifies HostBill API connectivity
2. **Method Discovery**: Automatically discovers all available API methods
3. **Permission Filtering**: Only exposes methods accessible to your API key
4. **Smart Tool Generation**: Creates appropriate MCP tools based on available methods

### Adaptive Tool Strategy
- **Individual Tools** (≤50 methods): Each API method gets its own tool
- **Meta-Tools** (>50 methods): Provides flexible meta-tools for any API method
- **Fallback Mode**: Basic connectivity tools if discovery fails

## 🛠️ Available Tools

### Individual Mode (≤50 methods)
Each HostBill API method becomes a dedicated MCP tool with intelligent descriptions.

### Meta-Tools Mode (>50 methods)
- **`hostbill_list_methods`**: Discover and filter available API methods
- **`hostbill_get_method_details`**: Get detailed information about specific methods  
- **`hostbill_call_api`**: Execute any HostBill API method with parameters
- **`hostbill_agent_dashboard`**: Role-based dashboards for different user types

### Role-Based Agent Support
- **Customer Service**: Customer inquiries, orders, support tickets
- **Business Agents**: Partnerships, sales, market analysis
- **Product Owners**: Product management, development, analytics
- **Research Analysts**: Data analysis, reporting, insights

## 🔒 Security & Performance

### Security Features
- Environment variable credential handling
- Permission-based method exposure
- Input validation and error handling
- No persistent credential storage

### Performance Optimizations
- Method caching (5-minute TTL)
- Lazy loading of method details
- HTTP connection reuse
- Graceful degradation

## 📋 Requirements

- **Deno 1.48+** (for Deno implementation) or **Node.js 18+** (for TypeScript)
- HostBill instance with API access enabled
- Valid HostBill API credentials (API ID + API Key)
- Optional: Crayon Cloud-IQ credentials for CSP integration

## 🎯 Usage Examples

### Claude Desktop Configuration
```json
{
  "mcpServers": {
    "hostbill": {
      "command": "deno",
      "args": ["run", "-A", "--env", "/path/to/cloud-iq-deno/main.ts"],
      "env": {
        "HOSTBILL_URL": "https://your-hostbill-instance.com",
        "HOSTBILL_API_ID": "your-api-id",
        "HOSTBILL_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Docker Deployment
```bash
cd cloud-iq-deno
docker build -t hostbill-mcp .
docker run -p 8000:8000 --env-file .env hostbill-mcp
```

## 🔍 Troubleshooting

### Connection Issues
1. Verify HostBill URL is correct and accessible
2. Check API credentials are valid and active
3. Ensure HostBill API is enabled in admin settings
4. Test connectivity with `--test` flag (TypeScript implementation)

### Permission Issues
- Verify API key permissions in HostBill admin panel
- Check that API access is enabled for your user role
- Ensure required HostBill modules are active

### Performance Issues
- Monitor startup time and memory usage
- Use agent mode for enhanced role-specific functionality
- Increase timeouts for large HostBill instances

## 📁 Repository Structure

```
├── cloud-iq-deno/          # Primary Deno implementation (v1.48.0)
├── typescript-server/      # Alternative TypeScript/Node.js implementation
├── config/                 # Configuration examples and documentation
├── .env.example           # Environment variable template
└── README.md              # This documentation
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with both implementations
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

---

**Ready to get started?** Choose your implementation above and follow the quick start guide!