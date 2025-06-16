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
                'description' => 'List available HostBill API methods with agent-focused filtering for customer service operations',
                'inputSchema' => [
                    'type' => 'object',
                    'properties' => [
                        'filter' => [
                            'type' => 'string',
                            'description' => 'Filter methods by name or description'
                        ],
                        'category' => [
                            'type' => 'string',
                            'description' => 'Filter by method category. Agent categories: customer, orders, support, business, management, reports'
                        ],
                        'agent_mode' => [
                            'type' => 'boolean',
                            'description' => 'Enable agent mode for customer service workflow suggestions and enhanced categorization'
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

        // Tool for agent dashboard - quick access to key customer service functions
        $this->mcp->registerTool(
            'hostbill_agent_dashboard',
            function(array $args) {
                return $this->getAgentDashboard($args);
            },
            [
                'description' => 'Get agent dashboard with quick access to customer service, orders, and support functions',
                'inputSchema' => [
                    'type' => 'object',
                    'properties' => [
                        'focus_area' => [
                            'type' => 'string',
                            'description' => 'Focus on specific area: customer, orders, support, business, all',
                            'enum' => ['customer', 'orders', 'support', 'business', 'all']
                        ]
                    ]
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
     * List API methods with filtering - Enhanced for agent crew operations
     */
    private function listAPIMethods(array $args): string
    {
        $filter = $args['filter'] ?? '';
        $category = $args['category'] ?? '';
        $agentMode = $args['agent_mode'] ?? false;
        
        $methods = $this->discoveredMethods;
        
        // Define agent-focused categories for customer service operations
        $agentCategories = [
            'customer' => ['client', 'customer', 'account', 'contact'],
            'orders' => ['order', 'invoice', 'billing', 'payment', 'product'],
            'support' => ['ticket', 'support', 'help', 'issue', 'request'],
            'business' => ['domain', 'hosting', 'service', 'package', 'plan'],
            'management' => ['admin', 'config', 'setting', 'manage', 'update'],
            'reports' => ['report', 'stat', 'analytic', 'log', 'audit']
        ];

        if (!empty($filter)) {
            $methods = array_filter($methods, function($method) use ($filter) {
                return stripos($method, $filter) !== false;
            });
        }

        if (!empty($category)) {
            if (isset($agentCategories[$category])) {
                // Agent-focused category filtering
                $categoryKeywords = $agentCategories[$category];
                $methods = array_filter($methods, function($method) use ($categoryKeywords) {
                    foreach ($categoryKeywords as $keyword) {
                        if (stripos($method, $keyword) !== false) {
                            return true;
                        }
                    }
                    return false;
                });
            } else {
                // Standard category filtering
                $methods = array_filter($methods, function($method) use ($category) {
                    return stripos($method, $category) !== false;
                });
            }
        }

        $result = [
            'total_methods' => count($this->discoveredMethods),
            'filtered_methods' => count($methods),
            'methods' => array_values($methods)
        ];

        // Add agent-focused information when in agent mode
        if ($agentMode) {
            $result['agent_categories'] = array_keys($agentCategories);
            $result['agent_workflow_suggestions'] = $this->getAgentWorkflowSuggestions($methods);
        }

        return json_encode($result, JSON_PRETTY_PRINT);
    }

    /**
     * Get agent workflow suggestions based on available methods
     */
    private function getAgentWorkflowSuggestions(array $methods): array
    {
        $suggestions = [];
        
        // Customer service workflows
        $customerMethods = array_filter($methods, function($method) {
            return stripos($method, 'client') !== false || stripos($method, 'customer') !== false;
        });
        if (!empty($customerMethods)) {
            $suggestions['customer_service'] = [
                'description' => 'Customer account management and support',
                'methods' => array_values($customerMethods),
                'common_tasks' => ['View customer details', 'Update account information', 'Check service status']
            ];
        }

        // Order processing workflows
        $orderMethods = array_filter($methods, function($method) {
            return stripos($method, 'order') !== false || stripos($method, 'invoice') !== false || stripos($method, 'payment') !== false;
        });
        if (!empty($orderMethods)) {
            $suggestions['order_processing'] = [
                'description' => 'Order management and billing operations',
                'methods' => array_values($orderMethods),
                'common_tasks' => ['Process new orders', 'Generate invoices', 'Handle payments']
            ];
        }

        // Support ticket workflows
        $supportMethods = array_filter($methods, function($method) {
            return stripos($method, 'ticket') !== false || stripos($method, 'support') !== false;
        });
        if (!empty($supportMethods)) {
            $suggestions['support_operations'] = [
                'description' => 'Help desk and ticket management',
                'methods' => array_values($supportMethods),
                'common_tasks' => ['Create tickets', 'Update support requests', 'Track issue resolution']
            ];
        }

        return $suggestions;
    }

    /**
     * Get agent dashboard with quick access to key customer service functions
     */
    private function getAgentDashboard(array $args): string
    {
        $focusArea = $args['focus_area'] ?? 'all';
        
        $dashboard = [
            'agent_info' => [
                'server_status' => 'connected',
                'api_methods_available' => count($this->discoveredMethods),
                'focus_area' => $focusArea,
                'timestamp' => date('Y-m-d H:i:s')
            ]
        ];

        // Define priority methods for each focus area
        $priorityMethods = [
            'customer' => ['getClientDetails', 'getClients', 'updateClient', 'getClientServices'],
            'orders' => ['getOrders', 'createOrder', 'getInvoices', 'createInvoice', 'getPayments'],
            'support' => ['getTickets', 'createTicket', 'updateTicket', 'getTicketReplies'],
            'business' => ['getDomains', 'getProducts', 'getServices', 'getPackages']
        ];

        if ($focusArea === 'all') {
            foreach ($priorityMethods as $area => $methods) {
                $availableMethods = array_intersect($methods, $this->discoveredMethods);
                if (!empty($availableMethods)) {
                    $dashboard['quick_access'][$area] = [
                        'description' => ucfirst($area) . ' operations',
                        'priority_methods' => array_values($availableMethods),
                        'total_related' => count(array_filter($this->discoveredMethods, function($method) use ($area) {
                            return stripos($method, $area) !== false;
                        }))
                    ];
                }
            }
        } else {
            if (isset($priorityMethods[$focusArea])) {
                $availableMethods = array_intersect($priorityMethods[$focusArea], $this->discoveredMethods);
                $dashboard['focused_area'] = [
                    'area' => $focusArea,
                    'priority_methods' => array_values($availableMethods),
                    'all_related' => array_filter($this->discoveredMethods, function($method) use ($focusArea) {
                        return stripos($method, $focusArea) !== false;
                    })
                ];
            }
        }

        // Add agent tips and best practices
        $dashboard['agent_tips'] = [
            'workflow_optimization' => 'Use category filters to quickly find relevant API methods',
            'customer_service' => 'Start with getClientDetails for customer inquiries',
            'order_processing' => 'Use createOrder followed by createInvoice for new sales',
            'support_workflow' => 'Create tickets with createTicket and track with getTickets'
        ];

        return json_encode($dashboard, JSON_PRETTY_PRINT);
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
     * Generate tool schema for API method - Enhanced for agent operations
     */
    private function generateToolSchema(string $method): array
    {
        try {
            $details = $this->hostbill->getMethodDetails($method);
            $agentDescription = $this->getAgentFriendlyDescription($method, $details['description'] ?? '');
            
            return [
                'description' => $agentDescription,
                'inputSchema' => [
                    'type' => 'object',
                    'properties' => $this->generateInputProperties($details['parameters'] ?? []),
                    'additionalProperties' => true
                ]
            ];
        } catch (\Exception $e) {
            $agentDescription = $this->getAgentFriendlyDescription($method);
            return [
                'description' => $agentDescription,
                'inputSchema' => [
                    'type' => 'object',
                    'additionalProperties' => true
                ]
            ];
        }
    }

    /**
     * Get agent-friendly description for API methods
     */
    private function getAgentFriendlyDescription(string $method, string $originalDescription = ''): string
    {
        // Agent-focused descriptions for common HostBill operations
        $agentDescriptions = [
            'getClientDetails' => 'Get customer account information and details (Agent: Use for customer inquiries)',
            'getClients' => 'List all customers (Agent: Customer search and management)',
            'updateClient' => 'Update customer account information (Agent: Modify customer details)',
            'getOrders' => 'View customer orders and order history (Agent: Track order status)',
            'createOrder' => 'Create new order for customer (Agent: Process new sales)',
            'getInvoices' => 'View customer invoices and billing (Agent: Billing inquiries)',
            'createInvoice' => 'Generate invoice for customer (Agent: Manual billing)',
            'getTickets' => 'View support tickets (Agent: Customer support dashboard)',
            'createTicket' => 'Create new support ticket (Agent: Log customer issues)',
            'updateTicket' => 'Update support ticket status (Agent: Manage support cases)',
            'getPayments' => 'View payment history (Agent: Payment inquiries)',
            'getDomains' => 'List customer domains (Agent: Domain management)',
            'getServices' => 'View customer services (Agent: Service management)',
            'getProducts' => 'List available products (Agent: Sales information)'
        ];

        if (isset($agentDescriptions[$method])) {
            return $agentDescriptions[$method];
        }

        // Generate contextual description based on method name
        $baseDescription = $originalDescription ?: "Execute {$method} API call";
        
        if (stripos($method, 'client') !== false || stripos($method, 'customer') !== false) {
            return $baseDescription . ' (Customer Service Operation)';
        } elseif (stripos($method, 'order') !== false || stripos($method, 'invoice') !== false) {
            return $baseDescription . ' (Order Processing Operation)';
        } elseif (stripos($method, 'ticket') !== false || stripos($method, 'support') !== false) {
            return $baseDescription . ' (Support Operation)';
        } elseif (stripos($method, 'domain') !== false || stripos($method, 'service') !== false) {
            return $baseDescription . ' (Business Operation)';
        }

        return $baseDescription;
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