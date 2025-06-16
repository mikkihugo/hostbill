interface ServerConfig {
    serverName: string;
    version: string;
    hostbillUrl: string;
    apiId: string;
    apiKey: string;
}
/**
 * HostBill MCP Server - TypeScript implementation
 */
export declare class HostBillMCPServer {
    private config;
    private hostbill;
    private tools;
    private discoveredMethods;
    private maxTools;
    private readline?;
    constructor(config: ServerConfig);
    /**
     * Start the MCP server
     */
    start(): Promise<void>;
    /**
     * Initialize MCP tools based on HostBill API discovery
     */
    private initializeTools;
    /**
     * Register individual tools for each API method
     */
    private registerIndividualTools;
    /**
     * Register meta-tools for large APIs
     */
    private registerMetaTools;
    /**
     * Register fallback tools when API discovery fails
     */
    private registerFallbackTools;
    /**
     * Handle incoming MCP requests
     */
    private handleRequest;
    /**
     * Handle initialization request
     */
    private handleInitialize;
    /**
     * Handle tools list request
     */
    private handleToolsList;
    /**
     * Handle tool call request
     */
    private handleToolCall;
    /**
     * Execute an API method
     */
    private executeAPIMethod;
    /**
     * List API methods with filtering
     */
    private listAPIMethods;
    /**
     * Get method details
     */
    private getMethodDetails;
    /**
     * Call API method
     */
    private callAPIMethod;
    /**
     * Test connection
     */
    private testConnection;
    /**
     * Get server info
     */
    private getServerInfo;
    /**
     * Generate tool name from API method
     */
    private generateToolName;
    /**
     * Generate tool schema for API method
     */
    private generateToolSchema;
    /**
     * Generate input properties from parameter definitions
     */
    private generateInputProperties;
    /**
     * Send an error response
     */
    private sendError;
    /**
     * Log a message
     */
    private log;
}
export {};
//# sourceMappingURL=hostbill-mcp-server.d.ts.map