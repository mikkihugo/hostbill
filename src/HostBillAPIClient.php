<?php

namespace HostBillMCP;

/**
 * HostBill API Client - Handles authentication and API communication
 */
class HostBillAPIClient
{
    private string $apiUrl;
    private string $apiId;
    private string $apiKey;
    private array $cache = [];
    private int $cacheTimeout = 300; // 5 minutes

    public function __construct(string $apiUrl, string $apiId, string $apiKey)
    {
        $this->apiUrl = rtrim($apiUrl, '/');
        $this->apiId = $apiId;
        $this->apiKey = $apiKey;
    }

    /**
     * Get all available API methods using HostBill's introspection
     */
    public function getAPIMethods(): array
    {
        $cacheKey = 'api_methods';
        
        if (isset($this->cache[$cacheKey]) && 
            time() - $this->cache[$cacheKey]['timestamp'] < $this->cacheTimeout) {
            return $this->cache[$cacheKey]['data'];
        }

        $response = $this->makeRequest('getAPIMethods');
        
        if (isset($response['methods'])) {
            $this->cache[$cacheKey] = [
                'data' => $response['methods'],
                'timestamp' => time()
            ];
            return $response['methods'];
        }

        throw new \Exception('Failed to retrieve API methods');
    }

    /**
     * Get details for a specific API method
     */
    public function getMethodDetails(string $method): array
    {
        $cacheKey = "method_details_{$method}";
        
        if (isset($this->cache[$cacheKey]) && 
            time() - $this->cache[$cacheKey]['timestamp'] < $this->cacheTimeout) {
            return $this->cache[$cacheKey]['data'];
        }

        $response = $this->makeRequest('getAPIMethodDetails', ['method' => $method]);
        
        if (isset($response['details'])) {
            $this->cache[$cacheKey] = [
                'data' => $response['details'],
                'timestamp' => time()
            ];
            return $response['details'];
        }

        // If detailed method info isn't available, return basic info
        return [
            'method' => $method,
            'description' => "Execute {$method} API call",
            'parameters' => []
        ];
    }

    /**
     * Execute an API call
     */
    public function callAPI(string $call, array $args = []): array
    {
        return $this->makeRequest($call, $args);
    }

    /**
     * Make an HTTP request to the HostBill API
     */
    private function makeRequest(string $call, array $args = []): array
    {
        $postData = array_merge([
            'call' => $call,
            'api_id' => $this->apiId,
            'api_key' => $this->apiKey
        ], $args);

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $this->apiUrl . '/api.php',
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query($postData),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_USERAGENT => 'HostBill-MCP-Server/1.0',
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/x-www-form-urlencoded',
                'Accept: application/json'
            ]
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new \Exception("CURL Error: {$error}");
        }

        if ($httpCode !== 200) {
            throw new \Exception("HTTP Error: {$httpCode}");
        }

        $decoded = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \Exception("Invalid JSON response: " . json_last_error_msg());
        }

        if (isset($decoded['error'])) {
            throw new \Exception("API Error: " . $decoded['error']);
        }

        return $decoded;
    }

    /**
     * Test the API connection
     */
    public function testConnection(): bool
    {
        try {
            $this->makeRequest('ping');
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Get server information
     */
    public function getServerInfo(): array
    {
        try {
            return $this->makeRequest('getServerInfo');
        } catch (\Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }

    /**
     * Clear cache
     */
    public function clearCache(): void
    {
        $this->cache = [];
    }
}