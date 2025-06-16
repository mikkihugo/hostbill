import { createInterface } from 'readline';
import { HostBillAPIClient } from './hostbill-api-client.js';
/**
 * HostBill MCP Server - TypeScript implementation
 */
export class HostBillMCPServer {
    config;
    hostbill;
    tools = new Map();
    discoveredMethods = [];
    maxTools = 50; // Switch to meta-tools pattern if exceeded
    readline;
    constructor(config) {
        this.config = config;
        this.hostbill = new HostBillAPIClient(config.hostbillUrl, config.apiId, config.apiKey);
    }
    /**
     * Start the MCP server
     */
    async start() {
        await this.initializeTools();
        this.log(`Starting ${this.config.serverName} v${this.config.version}`);
        this.readline = createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: false
        });
        this.readline.on('line', async (line) => {
            try {
                const request = JSON.parse(line.trim());
                const response = await this.handleRequest(request);
                if (response) {
                    console.log(JSON.stringify(response));
                }
            }
            catch (error) {
                this.sendError(`Invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
        this.readline.on('close', () => {
            process.exit(0);
        });
    }
    /**
     * Initialize MCP tools based on HostBill API discovery
     */
    async initializeTools() {
        try {
            // Test connection first
            const isConnected = await this.hostbill.testConnection();
            if (!isConnected) {
                this.log('Failed to connect to HostBill API');
                this.registerFallbackTools();
                return;
            }
            // Discover available API methods
            this.discoveredMethods = await this.hostbill.getAPIMethods();
            this.log(`Discovered ${this.discoveredMethods.length} API methods`);
            // Generate tools based on discovery
            if (this.discoveredMethods.length > this.maxTools) {
                this.registerMetaTools();
            }
            else {
                await this.registerIndividualTools();
            }
        }
        catch (error) {
            this.log(`Error during initialization: ${error instanceof Error ? error.message : String(error)}`);
            this.registerFallbackTools();
        }
    }
    /**
     * Register individual tools for each API method
     */
    async registerIndividualTools() {
        for (const method of this.discoveredMethods) {
            const toolName = this.generateToolName(method);
            const schema = await this.generateToolSchema(method);
            this.tools.set(toolName, {
                name: toolName,
                description: schema.description,
                inputSchema: schema.inputSchema,
                handler: async (args) => this.executeAPIMethod(method, args)
            });
        }
        this.log(`Registered ${this.discoveredMethods.length} individual tools`);
    }
    /**
     * Register meta-tools for large APIs
     */
    registerMetaTools() {
        // Tool to list available API methods
        this.tools.set('hostbill_list_methods', {
            name: 'hostbill_list_methods',
            description: 'List available HostBill API methods with optional filtering',
            inputSchema: {
                type: 'object',
                properties: {
                    filter: {
                        type: 'string',
                        description: 'Filter methods by name or description'
                    },
                    category: {
                        type: 'string',
                        description: 'Filter by method category'
                    }
                }
            },
            handler: async (args) => this.listAPIMethods(args)
        });
        // Tool to get method details
        this.tools.set('hostbill_get_method_details', {
            name: 'hostbill_get_method_details',
            description: 'Get detailed information about a specific API method',
            inputSchema: {
                type: 'object',
                properties: {
                    method: {
                        type: 'string',
                        description: 'The API method name'
                    }
                },
                required: ['method']
            },
            handler: async (args) => this.getMethodDetails(args)
        });
        // Tool to execute API methods
        this.tools.set('hostbill_call_api', {
            name: 'hostbill_call_api',
            description: 'Execute a HostBill API method with parameters',
            inputSchema: {
                type: 'object',
                properties: {
                    method: {
                        type: 'string',
                        description: 'The API method to call'
                    },
                    parameters: {
                        type: 'object',
                        description: 'Parameters to pass to the API method'
                    }
                },
                required: ['method']
            },
            handler: async (args) => this.callAPIMethod(args)
        });
        this.log(`Registered meta-tools for ${this.discoveredMethods.length} API methods`);
    }
    /**
     * Register fallback tools when API discovery fails
     */
    registerFallbackTools() {
        this.tools.set('hostbill_test_connection', {
            name: 'hostbill_test_connection',
            description: 'Test connection to HostBill API',
            inputSchema: { type: 'object' },
            handler: async () => this.testConnection()
        });
        this.tools.set('hostbill_server_info', {
            name: 'hostbill_server_info',
            description: 'Get HostBill server information',
            inputSchema: { type: 'object' },
            handler: async () => this.getServerInfo()
        });
        this.log('Registered fallback tools');
    }
    /**
     * Handle incoming MCP requests
     */
    async handleRequest(request) {
        const { method, id, params = {} } = request;
        switch (method) {
            case 'initialize':
                return this.handleInitialize(id);
            case 'tools/list':
                return this.handleToolsList(id);
            case 'tools/call':
                return await this.handleToolCall(id, params);
            case 'ping':
                return { jsonrpc: '2.0', id, result: {} };
            default:
                return {
                    jsonrpc: '2.0',
                    id,
                    error: {
                        code: -32601,
                        message: 'Method not found'
                    }
                };
        }
    }
    /**
     * Handle initialization request
     */
    handleInitialize(id) {
        return {
            jsonrpc: '2.0',
            id,
            result: {
                protocolVersion: '2024-11-05',
                capabilities: {
                    tools: { listChanged: true },
                    resources: { subscribe: true, listChanged: true }
                },
                serverInfo: {
                    name: this.config.serverName,
                    version: this.config.version
                }
            }
        };
    }
    /**
     * Handle tools list request
     */
    handleToolsList(id) {
        const tools = Array.from(this.tools.values()).map(tool => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema
        }));
        return {
            jsonrpc: '2.0',
            id,
            result: { tools }
        };
    }
    /**
     * Handle tool call request
     */
    async handleToolCall(id, params = {}) {
        const { name: toolName, arguments: args = {} } = params;
        const tool = this.tools.get(toolName);
        if (!tool) {
            return {
                jsonrpc: '2.0',
                id,
                error: {
                    code: -32602,
                    message: `Tool not found: ${toolName}`
                }
            };
        }
        try {
            const result = await tool.handler(args);
            return {
                jsonrpc: '2.0',
                id,
                result: {
                    content: [
                        {
                            type: 'text',
                            text: result
                        }
                    ]
                }
            };
        }
        catch (error) {
            return {
                jsonrpc: '2.0',
                id,
                error: {
                    code: -32603,
                    message: `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
                }
            };
        }
    }
    /**
     * Execute an API method
     */
    async executeAPIMethod(method, args) {
        try {
            const result = await this.hostbill.callAPI(method, args);
            return JSON.stringify(result, null, 2);
        }
        catch (error) {
            return `Error executing ${method}: ${error instanceof Error ? error.message : String(error)}`;
        }
    }
    /**
     * List API methods with filtering
     */
    async listAPIMethods(args) {
        const { filter = '', category = '' } = args;
        let methods = [...this.discoveredMethods];
        if (filter) {
            methods = methods.filter(method => method.toLowerCase().includes(filter.toLowerCase()));
        }
        if (category) {
            methods = methods.filter(method => method.toLowerCase().includes(category.toLowerCase()));
        }
        const result = {
            total_methods: this.discoveredMethods.length,
            filtered_methods: methods.length,
            methods
        };
        return JSON.stringify(result, null, 2);
    }
    /**
     * Get method details
     */
    async getMethodDetails(args) {
        const { method } = args;
        if (!method) {
            return 'Error: Method name is required';
        }
        try {
            const details = await this.hostbill.getMethodDetails(method);
            return JSON.stringify(details, null, 2);
        }
        catch (error) {
            return `Error getting details for ${method}: ${error instanceof Error ? error.message : String(error)}`;
        }
    }
    /**
     * Call API method
     */
    async callAPIMethod(args) {
        const { method, parameters = {} } = args;
        if (!method) {
            return 'Error: Method name is required';
        }
        if (!this.discoveredMethods.includes(method)) {
            return `Error: Method '${method}' is not available or not permitted`;
        }
        return this.executeAPIMethod(method, parameters);
    }
    /**
     * Test connection
     */
    async testConnection() {
        const isConnected = await this.hostbill.testConnection();
        return isConnected ? 'Connection successful' : 'Connection failed';
    }
    /**
     * Get server info
     */
    async getServerInfo() {
        const info = await this.hostbill.getServerInfo();
        return JSON.stringify(info, null, 2);
    }
    /**
     * Generate tool name from API method
     */
    generateToolName(method) {
        return 'hostbill_' + method.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
    }
    /**
     * Generate tool schema for API method
     */
    async generateToolSchema(method) {
        try {
            const details = await this.hostbill.getMethodDetails(method);
            return {
                description: details.description || `Execute ${method} API call`,
                inputSchema: {
                    type: 'object',
                    properties: this.generateInputProperties(details.parameters || []),
                    additionalProperties: true
                }
            };
        }
        catch (error) {
            return {
                description: `Execute ${method} API call`,
                inputSchema: {
                    type: 'object',
                    additionalProperties: true
                }
            };
        }
    }
    /**
     * Generate input properties from parameter definitions
     */
    generateInputProperties(parameters) {
        const properties = {};
        for (const param of parameters) {
            const name = param.name;
            if (!name)
                continue;
            properties[name] = {
                type: param.type || 'string',
                description: param.description || ''
            };
            if (param.required) {
                properties[name].required = true;
            }
        }
        return properties;
    }
    /**
     * Send an error response
     */
    sendError(message, id) {
        const error = {
            jsonrpc: '2.0',
            id,
            error: {
                code: -32603,
                message
            }
        };
        console.log(JSON.stringify(error));
    }
    /**
     * Log a message
     */
    log(message) {
        console.error(`[HostBill-MCP-TS] ${message}`);
    }
}
//# sourceMappingURL=hostbill-mcp-server.js.map