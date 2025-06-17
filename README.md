# HostBill MCP Server

A powerful MCP (Model Context Protocol) server for HostBill with dynamic API discovery and multi-role agent support.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Available Implementations](#available-implementations)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [How It Works](#how-it-works)
- [Available Tools](#available-tools)
- [Multi-Role Agent Support](#multi-role-agent-support)
- [Example Interactions](#example-interactions)
- [Performance & Security](#performance--security)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Overview

The HostBill MCP Server provides seamless integration between HostBill's comprehensive billing API and MCP-compatible AI assistants. It features automatic API discovery, role-based access patterns, and intelligent tool generation for optimal agent workflows.

## Features

### Core Capabilities
- **🔄 Dynamic API Discovery**: Automatically discovers and exposes HostBill API methods
- **🛡️ Permission-Aware**: Only exposes methods accessible to your API credentials
- **📊 Adaptive Tool Strategy**: Switches between individual tools and meta-tools based on API size
- **⚡ Performance Optimized**: Intelligent caching and connection pooling
- **🔒 Security First**: Input validation, error handling, and secure credential management

### Multi-Role Agent Support
- **👥 Role-Based Workflows**: Specialized support for different agent types
- **🎯 Smart Categorization**: Automatic method categorization for role-specific needs  
- **📋 Agent Dashboards**: Quick access panels for each role type
- **💡 Workflow Suggestions**: Contextual tips and best practices
- **🔄 Cross-Role Collaboration**: Support for multi-agent team workflows

## Available Implementations

This repository provides **two complete, feature-equivalent implementations**:

| Implementation | Best For | Runtime | Dependencies | Memory Usage |
|---------------|----------|---------|--------------|--------------|
| **[PHP](/)** (Recommended) | Production HostBill environments | PHP 8.1+ | Minimal (cURL) | ~10-15MB |
| **[TypeScript](/typescript-server)** | Modern development workflows | Node.js 18+ | node-fetch | ~25-35MB |

**Recommendation**: Use PHP for production due to lower resource usage and simpler deployment. Use TypeScript for development environments requiring modern tooling.

## Quick Start

### Prerequisites
- HostBill instance with API access enabled
- Valid HostBill API credentials (API ID and Key)
- PHP 8.1+ (for PHP version) or Node.js 18+ (for TypeScript version)

### PHP Version (Recommended)

```bash
# 1. Clone and install
git clone https://github.com/mikkihugo/hostbill-mcp-server.git
cd hostbill-mcp-server
composer install --no-dev

# 2. Test connection
export HOSTBILL_URL="https://your-hostbill-instance.com"
export HOSTBILL_API_ID="your-api-id"  
export HOSTBILL_API_KEY="your-api-key"
php bin/hostbill-mcp-server --test

# 3. Configure Claude Desktop
# Add to ~/.config/Claude/claude_desktop_config.json (Linux/Mac)
# or %APPDATA%\Claude\claude_desktop_config.json (Windows)
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
# 1. Build and install
cd typescript-server
npm install
npm run build

# 2. Test connection
export HOSTBILL_URL="https://your-hostbill-instance.com"
export HOSTBILL_API_ID="your-api-id"
export HOSTBILL_API_KEY="your-api-key"
node dist/index.js --test

# 3. Configure Claude Desktop
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

## Installation

### System Requirements

**PHP Version:**
- PHP 8.1 or higher
- cURL extension enabled
- Composer (for dependency management)

**TypeScript Version:**
- Node.js 18.0.0 or higher
- npm or yarn

**HostBill Requirements:**
- HostBill instance with API access enabled
- Valid API credentials with appropriate permissions
- Network connectivity between the MCP server and HostBill instance

### Detailed Installation Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/mikkihugo/hostbill-mcp-server.git
   cd hostbill-mcp-server
   ```

2. **Install Dependencies**
   
   For PHP version:
   ```bash
   composer install --no-dev --optimize-autoloader
   ```
   
   For TypeScript version:
   ```bash
   cd typescript-server
   npm install --production
   npm run build
   ```

3. **Configure Environment**
   
   Create a `.env` file (optional, can use direct environment variables):
   ```bash
   HOSTBILL_URL=https://your-hostbill-instance.com
   HOSTBILL_API_ID=your-api-id
   HOSTBILL_API_KEY=your-api-key
   ```

4. **Test Installation**
   ```bash
   # PHP version
   php bin/hostbill-mcp-server --test
   
   # TypeScript version  
   node typescript-server/dist/index.js --test
   ```

## Configuration

### Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `HOSTBILL_URL` | Your HostBill instance URL | Yes | `https://billing.yourcompany.com` |
| `HOSTBILL_API_ID` | HostBill API ID | Yes | `admin` |
| `HOSTBILL_API_KEY` | HostBill API Key | Yes | `your-secret-api-key` |

### HostBill API Setup

1. **Enable API Access**
   - Login to HostBill admin panel
   - Navigate to Settings → API Configuration
   - Enable API access and note your API credentials

2. **Configure API Permissions**
   - Ensure your API user has appropriate permissions
   - Test API access using HostBill's built-in API tester

3. **Security Considerations**
   - Use dedicated API credentials for the MCP server
   - Limit API permissions to required operations only
   - Consider IP whitelisting for additional security

### MCP Client Configuration

**Claude Desktop Configuration:**

On macOS/Linux: `~/.config/Claude/claude_desktop_config.json`
On Windows: `%APPDATA%\Claude\claude_desktop_config.json`

**VS Code with Continue Extension:**
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

## How It Works

### Dynamic Discovery Process

1. **Connection Test**: Verifies API connectivity with HostBill
2. **Method Discovery**: Retrieves all available API methods using HostBill's introspection
3. **Permission Filtering**: Only exposes methods accessible to your API credentials
4. **Tool Generation**: Creates MCP tools based on discovered methods

### Adaptive Tool Strategy

The server automatically chooses the optimal tool strategy based on API size:

#### Individual Tools Mode (≤50 methods)
- Creates a dedicated tool for each API method
- Direct method access with custom schemas
- Best for smaller HostBill configurations

#### Meta-Tools Mode (>50 methods)  
- Uses three powerful meta-tools:
  - `hostbill_list_methods`: Discover and filter available methods
  - `hostbill_get_method_details`: Get detailed method information
  - `hostbill_call_api`: Execute any API method
  - `hostbill_agent_dashboard`: Role-based quick access

### Intelligent Caching

- **Method Caching**: API method lists cached for 5 minutes
- **Connection Pooling**: Reuses HTTP connections when possible  
- **Graceful Degradation**: Falls back to basic functionality if discovery fails

## Available Tools

### Core Tools (Meta-Tools Mode)

#### `hostbill_list_methods`
Discover and filter available HostBill API methods with intelligent categorization.

**Parameters:**
- `filter` (string): Filter methods by name or description
- `category` (string): Filter by role-specific categories  
- `role` (string): Agent role type (`customer_service`, `business_agent`, `product_owner`, `research`)
- `agent_mode` (boolean): Enable enhanced categorization and workflow suggestions

**Example:**
```javascript
{
  "name": "hostbill_list_methods",
  "arguments": {
    "role": "customer_service",
    "category": "customer",
    "agent_mode": true
  }
}
```

#### `hostbill_call_api`
Execute any HostBill API method with parameters.

**Parameters:**
- `method` (string, required): The API method to call
- `parameters` (object): Parameters to pass to the API method

**Example:**
```javascript
{
  "name": "hostbill_call_api", 
  "arguments": {
    "method": "getClientDetails",
    "parameters": {
      "id": 123
    }
  }
}
```

#### `hostbill_agent_dashboard`  
Role-based dashboard with quick access to relevant functions.

**Parameters:**
- `role` (string): Agent role type
- `focus_area` (string): Specific area to focus on (role-dependent)

#### Fallback Tools
When API discovery fails, basic tools are available:
- `hostbill_test_connection`: Test API connectivity
- `hostbill_server_info`: Get HostBill server information

## Multi-Role Agent Support

### Supported Agent Roles

#### 🎧 Customer Service Agent
**Focus Areas:** Customer support, order processing, billing inquiries

**Key Categories:**
- **Customer**: Account management and customer details
- **Orders**: Order processing and tracking  
- **Support**: Ticket management and issue resolution
- **Business**: Service and domain management

**Priority Methods:** `getClientDetails`, `getOrders`, `createTicket`, `getInvoices`

#### 💼 Business Agent  
**Focus Areas:** Partnership management, sales operations, revenue tracking

**Key Categories:**
- **Partnerships**: Affiliate and reseller management
- **Sales**: Lead tracking and conversion optimization
- **Analytics**: Performance metrics and business intelligence
- **Strategy**: Planning and forecasting

**Priority Methods:** `getAffiliates`, `getSalesStats`, `getLeads`, `getCommissions`

#### 📦 Product Owner
**Focus Areas:** Product management, pricing strategy, feature development

**Key Categories:**
- **Products**: Catalog and lifecycle management
- **Analytics**: Product performance and adoption metrics
- **Development**: Configuration and feature management
- **Integration**: API and system connectivity

**Priority Methods:** `getProducts`, `getProductStats`, `updatePricing`, `getCategories`

#### 📊 Research Analyst
**Focus Areas:** Data analysis, market research, user behavior

**Key Categories:**
- **Analytics**: Business intelligence and reporting
- **Research**: Market research and feedback analysis
- **Behavior**: User activity and pattern analysis  
- **Performance**: System performance and benchmarking

**Priority Methods:** `getReports`, `getStatistics`, `getAnalytics`, `getUsageData`

### Role-Based Workflows

Each role includes:
- **Smart Method Filtering**: Automatically categorizes methods by relevance
- **Workflow Suggestions**: Common task patterns and best practices
- **Quick Access Dashboards**: Priority methods for immediate access
- **Contextual Descriptions**: Role-specific descriptions for each tool

## Example Interactions

### Getting Started

#### Discover Available Capabilities
```
User: "What HostBill operations can you help me with?"
Assistant: Uses hostbill_list_methods with agent_mode=true
Result: Shows all available roles, categories, and workflow suggestions
```

#### Role-Specific Discovery
```
Customer Service Agent: "Show me customer service tools"
Assistant: Uses hostbill_agent_dashboard with role="customer_service"
Result: Customer service quick access panel with priority methods
```

### Customer Service Workflows

#### Handle Customer Inquiry
```
Agent: "Get details for customer ID 123"
Assistant: Uses hostbill_call_api with method="getClientDetails", parameters={"id": 123}
Result: Complete customer account information and service details
```

#### Process Support Ticket
```
Agent: "Create a support ticket for client 456 about billing issue"
Assistant: Uses hostbill_call_api with method="createTicket"
Result: New support ticket created with proper categorization
```

### Business Agent Workflows

#### Partnership Analysis
```
Business Agent: "Show me affiliate performance data"
Assistant: Uses hostbill_call_api with method="getAffiliateStats"
Result: Comprehensive affiliate performance metrics and commission data
```

#### Sales Pipeline Review
```
Business Agent: "What are our current sales leads?"
Assistant: Uses hostbill_call_api with method="getLeads"
Result: Current sales pipeline with lead status and conversion data
```

### Product Owner Workflows

#### Product Performance Analysis
```
Product Owner: "Show me product usage statistics"
Assistant: Uses hostbill_call_api with method="getProductStats"
Result: Product adoption metrics, usage patterns, and performance data
```

#### Pricing Strategy Review
```
Product Owner: "List all products with current pricing"
Assistant: Uses hostbill_call_api with method="getProducts"
Result: Complete product catalog with pricing, categories, and configurations
```

### Research Analyst Workflows

#### Generate Analytics Report
```
Research Analyst: "Generate a user behavior analysis report"
Assistant: Uses hostbill_call_api with method="getUserActivityReport"
Result: Comprehensive user behavior analysis with actionable insights
```

#### Performance Metrics Review
```
Research Analyst: "Show me system performance metrics"
Assistant: Uses hostbill_call_api with method="getPerformanceStats"
Result: System performance data, response times, and usage patterns
```

### Cross-Role Collaboration

#### Multi-Agent Project Support
```
Team Lead: "Show all agent roles and their capabilities for team coordination"
Assistant: Uses hostbill_list_methods with agent_mode=true
Result: Complete overview of all roles, categories, and coordination suggestions
```

## Performance & Security

### Performance Features
- **Method Caching**: 5-minute cache for API method discovery
- **Connection Pooling**: Efficient HTTP connection reuse
- **Lazy Loading**: Method details fetched only when needed
- **Graceful Degradation**: Maintains functionality even if discovery fails

### Security Considerations
- **Environment Variables**: Secure credential management
- **Input Validation**: Comprehensive parameter validation
- **Permission Filtering**: Only exposes permitted API methods
- **Error Handling**: Secure error messages without sensitive data exposure
- **Audit Logging**: Operation logging for security monitoring

### Performance Metrics
- **Startup Time**: PHP ~50ms, TypeScript ~200ms
- **Memory Usage**: PHP ~10-15MB, TypeScript ~25-35MB  
- **Response Time**: Typically <100ms for cached operations
- **Throughput**: Supports concurrent requests with connection pooling

## Troubleshooting

### Common Issues

#### Connection Problems
**Symptom**: Connection test fails or API calls timeout

**Solutions:**
1. Verify HostBill URL is correct and accessible
2. Check API credentials in HostBill admin panel
3. Ensure HostBill API is enabled in configuration
4. Test network connectivity: `curl https://your-hostbill-instance.com/api.php`
5. Check firewall rules and DNS resolution

#### Authentication Issues  
**Symptom**: "API Error: Authentication failed" or permission denied

**Solutions:**
1. Verify API ID and Key are correct
2. Check API user permissions in HostBill
3. Ensure API access is enabled for your user role
4. Test credentials with HostBill's built-in API tester

#### Method Discovery Issues
**Symptom**: No methods discovered or limited methods available

**Solutions:**
1. Check API user permissions - may need broader access
2. Verify HostBill version supports API introspection
3. Try clearing cache: restart the MCP server
4. Check HostBill API logs for error details

#### Performance Issues
**Symptom**: Slow response times or timeouts

**Solutions:**
1. Monitor HostBill server performance and database
2. Check network latency between MCP server and HostBill
3. Consider increasing cache timeout for stable environments
4. Use meta-tools mode for large API sets (>50 methods)

### Debug Mode

Enable detailed logging by setting environment variable:
```bash
export DEBUG=1
```

### Getting Help

1. **Check logs**: Review error logs for detailed diagnostic information
2. **Test connection**: Use `--test` flag to verify basic connectivity  
3. **API documentation**: Consult HostBill API documentation for method details
4. **Community support**: Visit the GitHub repository for issues and discussions

## Contributing

We welcome contributions to improve the HostBill MCP Server! Here's how you can help:

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/yourusername/hostbill-mcp-server.git
   cd hostbill-mcp-server
   ```

2. **Set Up Development Environment**
   ```bash
   # PHP development
   composer install
   
   # TypeScript development  
   cd typescript-server
   npm install
   ```

3. **Run Tests**
   ```bash
   # Basic protocol test
   php examples/test-mcp.php
   
   # Connection test (requires HostBill credentials)
   php bin/hostbill-mcp-server --test
   ```

### Contribution Guidelines

- **Code Style**: Follow PSR-12 for PHP, Prettier for TypeScript
- **Testing**: Add tests for new features and bug fixes
- **Documentation**: Update README and inline documentation
- **Security**: Consider security implications of changes
- **Compatibility**: Maintain compatibility with existing MCP clients

### Areas for Contribution

- **Enhanced Role Support**: Add new agent roles or improve existing ones
- **Performance Optimization**: Improve caching, connection handling, or response times
- **Testing**: Expand test coverage and add integration tests
- **Documentation**: Improve examples, tutorials, or API documentation
- **Bug Fixes**: Address issues reported in GitHub

### Pull Request Process

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make changes with appropriate tests and documentation
3. Ensure all tests pass and code follows style guidelines
4. Submit pull request with clear description of changes
5. Address review feedback promptly

## License

MIT License - see [LICENSE](LICENSE) file for details.