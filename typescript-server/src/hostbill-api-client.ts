import fetch from 'node-fetch';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

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
export class HostBillAPIClient {
    private apiUrl: string;
    private apiId: string;
    private apiKey: string;
    private cache = new Map<string, CacheEntry<any>>();
    private cacheTimeout = 300000; // 5 minutes in milliseconds

    constructor(apiUrl: string, apiId: string, apiKey: string) {
        this.apiUrl = apiUrl.replace(/\/$/, ''); // Remove trailing slash
        this.apiId = apiId;
        this.apiKey = apiKey;
    }

    /**
     * Get all available API methods using HostBill's introspection
     */
    async getAPIMethods(): Promise<string[]> {
        const cacheKey = 'api_methods';
        
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        const response = await this.makeRequest('getAPIMethods');
        
        if (response.methods) {
            this.cache.set(cacheKey, {
                data: response.methods,
                timestamp: Date.now()
            });
            return response.methods;
        }

        throw new Error('Failed to retrieve API methods');
    }

    /**
     * Get details for a specific API method
     */
    async getMethodDetails(method: string): Promise<APIMethodDetails> {
        const cacheKey = `method_details_${method}`;
        
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        try {
            const response = await this.makeRequest('getAPIMethodDetails', { method });
            
            if (response.details) {
                this.cache.set(cacheKey, {
                    data: response.details,
                    timestamp: Date.now()
                });
                return response.details;
            }
        } catch (error) {
            // Fallback to basic info if detailed method info isn't available
        }

        return {
            method,
            description: `Execute ${method} API call`,
            parameters: []
        };
    }

    /**
     * Execute an API call
     */
    async callAPI(call: string, args: Record<string, any> = {}): Promise<any> {
        return this.makeRequest(call, args);
    }

    /**
     * Test the API connection
     */
    async testConnection(): Promise<boolean> {
        try {
            await this.makeRequest('ping');
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get server information
     */
    async getServerInfo(): Promise<any> {
        try {
            return await this.makeRequest('getServerInfo');
        } catch (error) {
            return { error: error instanceof Error ? error.message : String(error) };
        }
    }

    /**
     * Make an HTTP request to the HostBill API
     */
    private async makeRequest(call: string, args: Record<string, any> = {}): Promise<any> {
        const postData = new URLSearchParams({
            call,
            api_id: this.apiId,
            api_key: this.apiKey,
            ...args
        });

        const response = await fetch(`${this.apiUrl}/api.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
                'User-Agent': 'HostBill-MCP-Server-TS/1.0'
            },
            body: postData.toString()
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const text = await response.text();
        let decoded: any;

        try {
            decoded = JSON.parse(text);
        } catch (error) {
            throw new Error(`Invalid JSON response: ${error instanceof Error ? error.message : String(error)}`);
        }

        if (decoded.error) {
            throw new Error(`API Error: ${decoded.error}`);
        }

        return decoded;
    }

    /**
     * Clear cache
     */
    clearCache(): void {
        this.cache.clear();
    }
}