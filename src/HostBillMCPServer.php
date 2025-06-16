<?php

namespace HostBillMCP;

/**
 * HostBill MCP Server - Dynamic API discovery and tool generation
 */
class HostBillMCPServer
{
    private MCPProtocol $mcp;
    private HostBillAPIClient $hostbill;
    private array $config;
    private array $discoveredMethods = [];
    private int $maxTools = 50; // Switch to meta-tools pattern if exceeded

    public function __construct(array $config)
    {
        $this->config = $config;
        $this->mcp = new MCPProtocol(
            $config['server_name'] ?? 'hostbill-mcp-server',
            $config['version'] ?? '1.0.0'
        );

        $this->hostbill = new HostBillAPIClient(
            $config['hostbill_url'],
            $config['api_id'],
            $config['api_key']
        );

        $this->initializeTools();
    }

    /**
     * Initialize MCP tools based on HostBill API discovery
     */
    private function initializeTools(): void
    {
        try {
            // Test connection first
            if (!$this->hostbill->testConnection()) {
                $this->log('Failed to connect to HostBill API');
                $this->registerFallbackTools();
                return;
            }

            // Discover available API methods
            $this->discoveredMethods = $this->hostbill->getAPIMethods();
            $this->log('Discovered ' . count($this->discoveredMethods) . ' API methods');

            // Generate tools based on discovery
            if (count($this->discoveredMethods) > $this->maxTools) {
                $this->registerMetaTools();
            } else {
                $this->registerIndividualTools();
            }

        } catch (\Exception $e) {
            $this->log('Error during initialization: ' . $e->getMessage());
            $this->registerFallbackTools();
        }
    }

    /**
     * Register individual tools for each API method
     */
    private function registerIndividualTools(): void
    {
        foreach ($this->discoveredMethods as $method) {
            $toolName = $this->generateToolName($method);
            
            $this->mcp->registerTool(
                $toolName,
                function(array $args) use ($method) {
                    return $this->executeAPIMethod($method, $args);
                },
                $this->generateToolSchema($method)
            );
        }

        $this->log('Registered ' . count($this->discoveredMethods) . ' individual tools');
    }

    /**
     * Register meta-tools for large APIs
     */
    private function registerMetaTools(): void
    {
        // Tool to list available API methods
        $this->mcp->registerTool(
            'hostbill_list_methods',
            function(array $args) {
                return $this->listAPIMethods($args);
            },
            [
                'description' => 'List available HostBill API methods with optional filtering',
                'inputSchema' => [
                    'type' => 'object',
                    'properties' => [
                        'filter' => [
                            'type' => 'string',
                            'description' => 'Filter methods by name or description'
                        ],
                        'category' => [
                            'type' => 'string',
                            'description' => 'Filter by method category'
                        ]
                    ]
                ]
            ]
        );

        // Tool to get method details
        $this->mcp->registerTool(
            'hostbill_get_method_details',
            function(array $args) {
                return $this->getMethodDetails($args);
            },
            [
                'description' => 'Get detailed information about a specific API method',
                'inputSchema' => [
                    'type' => 'object',
                    'properties' => [
                        'method' => [
                            'type' => 'string',
                            'description' => 'The API method name'
                        ]
                    ],
                    'required' => ['method']
                ]
            ]
        );

        // Tool to execute API methods
        $this->mcp->registerTool(
            'hostbill_call_api',
            function(array $args) {
                return $this->callAPIMethod($args);
            },
            [
                'description' => 'Execute a HostBill API method with parameters',
                'inputSchema' => [
                    'type' => 'object',
                    'properties' => [
                        'method' => [
                            'type' => 'string',
                            'description' => 'The API method to call'
                        ],
                        'parameters' => [
                            'type' => 'object',
                            'description' => 'Parameters to pass to the API method'
                        ]
                    ],
                    'required' => ['method']
                ]
            ]
        );

        $this->log('Registered meta-tools for ' . count($this->discoveredMethods) . ' API methods');
    }

    /**
     * Register fallback tools when API discovery fails
     */
    private function registerFallbackTools(): void
    {
        $this->mcp->registerTool(
            'hostbill_test_connection',
            function(array $args) {
                return $this->testConnection();
            },
            [
                'description' => 'Test connection to HostBill API',
                'inputSchema' => ['type' => 'object']
            ]
        );

        $this->mcp->registerTool(
            'hostbill_server_info',
            function(array $args) {
                return $this->getServerInfo();
            },
            [
                'description' => 'Get HostBill server information',
                'inputSchema' => ['type' => 'object']
            ]
        );

        $this->log('Registered fallback tools');
    }

    /**
     * Execute an API method
     */
    private function executeAPIMethod(string $method, array $args): string
    {
        try {
            $result = $this->hostbill->callAPI($method, $args);
            return json_encode($result, JSON_PRETTY_PRINT);
        } catch (\Exception $e) {
            return "Error executing {$method}: " . $e->getMessage();
        }
    }

    /**
     * List API methods with filtering
     */
    private function listAPIMethods(array $args): string
    {
        $filter = $args['filter'] ?? '';
        $category = $args['category'] ?? '';
        
        $methods = $this->discoveredMethods;
        
        if (!empty($filter)) {
            $methods = array_filter($methods, function($method) use ($filter) {
                return stripos($method, $filter) !== false;
            });
        }

        if (!empty($category)) {
            $methods = array_filter($methods, function($method) use ($category) {
                return stripos($method, $category) !== false;
            });
        }

        $result = [
            'total_methods' => count($this->discoveredMethods),
            'filtered_methods' => count($methods),
            'methods' => array_values($methods)
        ];

        return json_encode($result, JSON_PRETTY_PRINT);
    }

    /**
     * Get method details
     */
    private function getMethodDetails(array $args): string
    {
        $method = $args['method'] ?? '';
        
        if (empty($method)) {
            return 'Error: Method name is required';
        }

        try {
            $details = $this->hostbill->getMethodDetails($method);
            return json_encode($details, JSON_PRETTY_PRINT);
        } catch (\Exception $e) {
            return "Error getting details for {$method}: " . $e->getMessage();
        }
    }

    /**
     * Call API method
     */
    private function callAPIMethod(array $args): string
    {
        $method = $args['method'] ?? '';
        $parameters = $args['parameters'] ?? [];
        
        if (empty($method)) {
            return 'Error: Method name is required';
        }

        if (!in_array($method, $this->discoveredMethods)) {
            return "Error: Method '{$method}' is not available or not permitted";
        }

        return $this->executeAPIMethod($method, $parameters);
    }

    /**
     * Test connection
     */
    private function testConnection(): string
    {
        $isConnected = $this->hostbill->testConnection();
        return $isConnected ? 'Connection successful' : 'Connection failed';
    }

    /**
     * Get server info
     */
    private function getServerInfo(): string
    {
        $info = $this->hostbill->getServerInfo();
        return json_encode($info, JSON_PRETTY_PRINT);
    }

    /**
     * Generate tool name from API method
     */
    private function generateToolName(string $method): string
    {
        return 'hostbill_' . strtolower(preg_replace('/[^a-zA-Z0-9]/', '_', $method));
    }

    /**
     * Generate tool schema for API method
     */
    private function generateToolSchema(string $method): array
    {
        try {
            $details = $this->hostbill->getMethodDetails($method);
            
            return [
                'description' => $details['description'] ?? "Execute {$method} API call",
                'inputSchema' => [
                    'type' => 'object',
                    'properties' => $this->generateInputProperties($details['parameters'] ?? []),
                    'additionalProperties' => true
                ]
            ];
        } catch (\Exception $e) {
            return [
                'description' => "Execute {$method} API call",
                'inputSchema' => [
                    'type' => 'object',
                    'additionalProperties' => true
                ]
            ];
        }
    }

    /**
     * Generate input properties from parameter definitions
     */
    private function generateInputProperties(array $parameters): array
    {
        $properties = [];
        
        foreach ($parameters as $param) {
            $name = $param['name'] ?? '';
            if (empty($name)) continue;
            
            $properties[$name] = [
                'type' => $param['type'] ?? 'string',
                'description' => $param['description'] ?? ''
            ];
            
            if (isset($param['required']) && $param['required']) {
                $properties[$name]['required'] = true;
            }
        }
        
        return $properties;
    }

    /**
     * Start the MCP server
     */
    public function start(): void
    {
        $this->log('Starting HostBill MCP Server');
        $this->mcp->start();
    }

    /**
     * Log a message
     */
    private function log(string $message): void
    {
        error_log("[HostBill-MCP] " . $message);
    }
}