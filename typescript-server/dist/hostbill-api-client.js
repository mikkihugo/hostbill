import fetch from 'node-fetch';
/**
 * HostBill API Client - TypeScript implementation
 */
export class HostBillAPIClient {
    apiUrl;
    apiId;
    apiKey;
    cache = new Map();
    cacheTimeout = 300000; // 5 minutes in milliseconds
    constructor(apiUrl, apiId, apiKey) {
        this.apiUrl = apiUrl.replace(/\/$/, ''); // Remove trailing slash
        this.apiId = apiId;
        this.apiKey = apiKey;
    }
    /**
     * Get all available API methods using HostBill's introspection
     */
    async getAPIMethods() {
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
    async getMethodDetails(method) {
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
        }
        catch (error) {
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
    async callAPI(call, args = {}) {
        return this.makeRequest(call, args);
    }
    /**
     * Test the API connection
     */
    async testConnection() {
        try {
            await this.makeRequest('ping');
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Get server information
     */
    async getServerInfo() {
        try {
            return await this.makeRequest('getServerInfo');
        }
        catch (error) {
            return { error: error instanceof Error ? error.message : String(error) };
        }
    }
    /**
     * Make an HTTP request to the HostBill API
     */
    async makeRequest(call, args = {}) {
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
        let decoded;
        try {
            decoded = JSON.parse(text);
        }
        catch (error) {
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
    clearCache() {
        this.cache.clear();
    }
}
//# sourceMappingURL=hostbill-api-client.js.map