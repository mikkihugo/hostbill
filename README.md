# HostBill MCP Server

An MCP (Model Context Protocol) server for HostBill that provides dynamic API discovery and tool generation.

## Available Implementations

This repository provides **two complete implementations**:

1. **Deno Implementation** (recommended) - Located in `cloud-iq-deno/` - Modern runtime with TypeScript support
2. **TypeScript/Node.js Implementation** (alternative) - Located in `typescript-server/` - Traditional Node.js approach

Both implementations provide comprehensive HostBill integration and MCP protocol compliance.

## Quick Start

### Deno Version (Recommended)
```bash
# Navigate to Deno implementation
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

# Or use Docker
docker build -t hostbill-cloud-iq .
docker run -p 8000:8000 --env-file .env hostbill-cloud-iq
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

| Feature | Deno Version | TypeScript Version |
|---------|-------------|-------------------|
| **Runtime** | Deno 1.48+ | Node.js 18+ |
| **Dependencies** | Zero external deps | node-fetch |
| **Startup Time** | ~100ms | ~200ms |
| **Memory Usage** | ~15-25MB | ~25-35MB |
| **Type Safety** | Built-in TypeScript | Compile-time + Runtime |
| **Development** | Modern Deno ecosystem | Traditional Node.js |
| **Deployment** | Single binary | Requires build step |
| **Performance** | Excellent | Very good |
| **Security** | Secure by default | Standard Node.js |

**Recommendation**: Use the Deno version for modern development with built-in TypeScript support and enhanced security. Use the TypeScript/Node.js version if you prefer traditional Node.js tooling.

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
- `hostbill_[method_name]`: Execute specific API methods with agent-friendly descriptions

### Meta-Tools Mode

When 50+ API methods are available:

- **`hostbill_list_methods`**: List available API methods with role-focused filtering
  - Parameters: `filter` (string), `category` (string), `role` (string), `agent_mode` (boolean)
  - Supported roles: `customer_service`, `business_agent`, `product_owner`, `research`
  - Categories vary by role (see Role Categories section above)
  - When `agent_mode` is true, provides role-specific workflow suggestions and enhanced categorization
  
- **`hostbill_get_method_details`**: Get method information
  - Parameters: `method` (string, required)
  
- **`hostbill_call_api`**: Execute any API method
  - Parameters: `method` (string, required), `parameters` (object)

- **`hostbill_agent_dashboard`**: Role-based dashboard for different agent types
  - Parameters: `role` (string: customer_service, business_agent, product_owner, research), `focus_area` (string: varies by role)
  - Provides quick access to priority methods and role-specific workflow tips
  - Supports all agent roles with specialized functionality for each

### Agent-Focused Features

The server now includes comprehensive support for multiple agent roles and their specific workflows:

#### **🎯 Multi-Role Support**
- **Customer Service Agents**: Customer inquiries, order processing, support tickets
- **Business Agents**: Partnership management, sales operations, market analysis  
- **Product Owners**: Product management, feature development, pricing strategy
- **Research Analysts**: Data analysis, user behavior, performance metrics

#### **🔧 Role-Specific Tools**
- **Smart Categorization**: API methods automatically categorized for role-specific workflows
- **Agent Mode**: Enhanced filtering and workflow suggestions when `agent_mode=true`
- **Role Dashboards**: Specialized dashboards for each agent role with priority methods
- **Workflow Suggestions**: Automatic suggestions for common role-specific workflows
- **Contextual Descriptions**: Tool descriptions include role-specific context and usage guidance

#### **📊 Role Categories**

**Customer Service Agent:**
- Customer: client, customer, account, contact operations
- Orders: order, invoice, billing, payment, product operations  
- Support: ticket, support, help, issue, request operations
- Business: domain, hosting, service, package, plan operations
- Management: admin, config, setting, manage, update operations
- Reports: report, stat, analytic, log, audit operations

**Business Agent:**
- Partnerships: partner, affiliate, reseller, vendor, supplier operations
- Sales: lead, prospect, sale, conversion, pipeline operations
- Market: campaign, promo, discount, marketing, segment operations
- Business: revenue, profit, cost, pricing, commission operations
- Analytics: report, stat, metric, performance, trend operations
- Strategy: plan, goal, target, forecast, budget operations

**Product Owner:**
- Products: product, package, plan, service, feature operations
- Development: config, setting, template, custom, build operations
- Roadmap: version, update, release, deploy, migration operations
- Analytics: usage, adoption, feedback, metric, performance operations
- Management: category, inventory, pricing, lifecycle, portfolio operations
- Integration: api, webhook, connector, sync, import operations

**Research Analyst:**
- Analytics: report, stat, analytic, metric, data operations
- Research: survey, feedback, review, rating, opinion operations
- Behavior: usage, activity, session, interaction, event operations
- Performance: performance, speed, load, response, benchmark operations
- Insights: trend, pattern, correlation, prediction, forecast operations
- Monitoring: log, audit, track, monitor, alert operations

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

### Multi-Role Agent Dashboards

#### Customer Service Agent
```
Agent: "Show me the customer service dashboard"
Assistant: Uses hostbill_agent_dashboard with role="customer_service" to display customer service quick access panel
```

#### Business Agent Dashboard
```
Business Agent: "Show me business agent tools for partnerships"
Assistant: Uses hostbill_agent_dashboard with role="business_agent" and focus_area="partnerships"
Result: Shows partnership management methods, affiliate tools, and business development workflows
```

#### Product Owner Dashboard
```
Product Owner: "I need product management tools"
Assistant: Uses hostbill_agent_dashboard with role="product_owner" and focus_area="products"
Result: Shows product catalog management, analytics, and development tools
```

#### Research Analyst Dashboard
```
Research Analyst: "Show me data analysis capabilities"
Assistant: Uses hostbill_agent_dashboard with role="research" and focus_area="analytics"
Result: Shows reporting tools, metrics, and behavioral analysis methods
```

### Role-Specific Method Filtering

#### Business Agent Method Discovery
```
Business Agent: "What partnership management methods are available?"
Assistant: Uses hostbill_list_methods with role="business_agent", category="partnerships", agent_mode=true
Result: Shows partner-related methods with business development workflow suggestions
```

#### Product Owner Analytics
```
Product Owner: "Show me product analytics tools"
Assistant: Uses hostbill_list_methods with role="product_owner", category="analytics", agent_mode=true
Result: Lists product performance and adoption tracking methods with product management workflows
```

#### Research Data Access
```
Research Analyst: "What research and analytics tools do I have?"
Assistant: Uses hostbill_list_methods with role="research", category="analytics", agent_mode=true
Result: Shows comprehensive data analysis tools with research methodology suggestions
```

### Cross-Role Collaboration

#### Multi-Role Project Support
```
Team Lead: "Show me all available agent roles and their capabilities"
Assistant: Uses hostbill_list_methods with agent_mode=true (shows all roles)
Result: Displays all supported roles, their categories, and workflow suggestions for team coordination
```

### Standard API Operations

#### Listing Available Methods
```
User: "What HostBill API methods are available?"
Assistant: Uses hostbill_list_methods to show all accessible methods
```

#### Getting Client Information
```
Customer Service Agent: "Get information about client ID 123"
Assistant: Uses hostbill_call_api with method="getClientDetails" and parameters={"id": 123}
Note: Tool description shows "(Customer Service: Use for customer inquiries)"
```

#### Creating an Invoice
```
Customer Service Agent: "Create an invoice for client 456"
Assistant: Uses hostbill_call_api with method="createInvoice" and appropriate parameters
Note: Tool description shows "(Customer Service: Manual billing)"
```

#### Business Agent Partnership Management
```
Business Agent: "Get affiliate performance data"
Assistant: Uses hostbill_call_api with method="getAffiliateStats" and appropriate parameters
Note: Tool description shows "(Business Agent: Partnership development)"
```

#### Product Owner Analytics
```
Product Owner: "Show me product usage statistics"
Assistant: Uses hostbill_call_api with method="getProductStats" and appropriate parameters
Note: Tool description shows "(Product Owner: Product analytics)"
```

#### Research Data Analysis
```
Research Analyst: "Generate user behavior report"
Assistant: Uses hostbill_call_api with method="getUserActivityReport" and appropriate parameters
Note: Tool description shows "(Research: Behavioral analysis)"
```

## Requirements

- Deno 1.48 or higher (for Deno implementation)
- Node.js 18+ (for TypeScript implementation)
- HostBill instance with API access
- Valid HostBill API credentials
- Optional: Crayon Cloud-IQ API credentials for CSP integration

## Troubleshooting

### Connection Issues
1. Verify HostBill URL is correct and accessible
2. Check API credentials are valid
3. Ensure HostBill API is enabled
4. For Deno: Check that all required environment variables are set
5. For TypeScript: Test with build and connection validation

### Permission Issues
- Verify API key has necessary permissions in HostBill admin
- Check that API access is enabled for your user role

### Performance Issues
- Monitor application performance through browser console
- Consider enabling multi-agent mode for enhanced functionality
- Increase sync timeout if needed for large datasets

## License

MIT License - see LICENSE file for details