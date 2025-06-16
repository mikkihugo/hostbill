interface APIMethodDetails {
    method: string;
    description: string;
    parameters: Array<{
        name: string;
        type: string;
        description: string;
        required?: boolean;
    }>;
}
/**
 * HostBill API Client - TypeScript implementation
 */
export declare class HostBillAPIClient {
    private apiUrl;
    private apiId;
    private apiKey;
    private cache;
    private cacheTimeout;
    constructor(apiUrl: string, apiId: string, apiKey: string);
    /**
     * Get all available API methods using HostBill's introspection
     */
    getAPIMethods(): Promise<string[]>;
    /**
     * Get details for a specific API method
     */
    getMethodDetails(method: string): Promise<APIMethodDetails>;
    /**
     * Execute an API call
     */
    callAPI(call: string, args?: Record<string, any>): Promise<any>;
    /**
     * Test the API connection
     */
    testConnection(): Promise<boolean>;
    /**
     * Get server information
     */
    getServerInfo(): Promise<any>;
    /**
     * Make an HTTP request to the HostBill API
     */
    private makeRequest;
    /**
     * Clear cache
     */
    clearCache(): void;
}
export {};
//# sourceMappingURL=hostbill-api-client.d.ts.map