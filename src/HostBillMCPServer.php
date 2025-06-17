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
                            'description' => 'Filter by method category. Available categories: customer, orders, support, business, management, reports, products, analytics, partnerships, research'
                        ],
                        'role' => [
                            'type' => 'string',
                            'description' => 'Filter for specific role type: customer_service, business_agent, product_owner, research',
                            'enum' => ['customer_service', 'business_agent', 'product_owner', 'research']
                        ],
                        'agent_mode' => [
                            'type' => 'boolean',
                            'description' => 'Enable agent mode for workflow suggestions and enhanced categorization (works with role parameter for role-specific suggestions)'
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

        // Tool for agent dashboard - quick access to key functions for different roles
        $this->mcp->registerTool(
            'hostbill_agent_dashboard',
            function(array $args) {
                return $this->getAgentDashboard($args);
            },
            [
                'description' => 'Get role-based dashboard with quick access to relevant functions for customer service, business development, product management, and research',
                'inputSchema' => [
                    'type' => 'object',
                    'properties' => [
                        'role' => [
                            'type' => 'string',
                            'description' => 'Agent role type: customer_service, business_agent, product_owner, research',
                            'enum' => ['customer_service', 'business_agent', 'product_owner', 'research']
                        ],
                        'focus_area' => [
                            'type' => 'string',
                            'description' => 'Focus on specific area (role-dependent): customer, orders, support, business, products, analytics, partnerships, research, all',
                            'enum' => ['customer', 'orders', 'support', 'business', 'products', 'analytics', 'partnerships', 'research', 'all']
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
     * Execute an API method with improved error handling
     */
    private function executeAPIMethod(string $method, array $args): string
    {
        try {
            $result = $this->hostbill->callAPI($method, $args);
            return json_encode($result, JSON_PRETTY_PRINT);
        } catch (\Exception $e) {
            $this->log("API call failed for method '{$method}': " . $e->getMessage());
            return json_encode([
                'error' => "Failed to execute method '{$method}'",
                'message' => $e->getMessage(),
                'method' => $method,
                'timestamp' => date('Y-m-d H:i:s')
            ], JSON_PRETTY_PRINT);
        }
    }

    /**
     * List API methods with filtering - Enhanced for multiple agent roles
     */
    private function listAPIMethods(array $args): string
    {
        $filter = $args['filter'] ?? '';
        $category = $args['category'] ?? '';
        $role = $args['role'] ?? '';
        $agentMode = $args['agent_mode'] ?? false;
        
        $methods = $this->discoveredMethods;
        
        // Define role-focused categories for different agent types
        $roleCategories = [
            'customer_service' => [
                'customer' => ['client', 'customer', 'account', 'contact'],
                'orders' => ['order', 'invoice', 'billing', 'payment', 'product'],
                'support' => ['ticket', 'support', 'help', 'issue', 'request'],
                'business' => ['domain', 'hosting', 'service', 'package', 'plan'],
                'management' => ['admin', 'config', 'setting', 'manage', 'update'],
                'reports' => ['report', 'stat', 'analytic', 'log', 'audit']
            ],
            'business_agent' => [
                'partnerships' => ['partner', 'affiliate', 'reseller', 'vendor', 'supplier'],
                'sales' => ['lead', 'prospect', 'sale', 'conversion', 'pipeline'],
                'market' => ['campaign', 'promo', 'discount', 'marketing', 'segment'],
                'business' => ['revenue', 'profit', 'cost', 'pricing', 'commission'],
                'analytics' => ['report', 'stat', 'metric', 'performance', 'trend'],
                'strategy' => ['plan', 'goal', 'target', 'forecast', 'budget']
            ],
            'product_owner' => [
                'products' => ['product', 'package', 'plan', 'service', 'feature'],
                'development' => ['config', 'setting', 'template', 'custom', 'build'],
                'roadmap' => ['version', 'update', 'release', 'deploy', 'migration'],
                'analytics' => ['usage', 'adoption', 'feedback', 'metric', 'performance'],
                'management' => ['category', 'inventory', 'pricing', 'lifecycle', 'portfolio'],
                'integration' => ['api', 'webhook', 'connector', 'sync', 'import']
            ],
            'research' => [
                'analytics' => ['report', 'stat', 'analytic', 'metric', 'data'],
                'research' => ['survey', 'feedback', 'review', 'rating', 'opinion'],
                'behavior' => ['usage', 'activity', 'session', 'interaction', 'event'],
                'performance' => ['performance', 'speed', 'load', 'response', 'benchmark'],
                'insights' => ['trend', 'pattern', 'correlation', 'prediction', 'forecast'],
                'monitoring' => ['log', 'audit', 'track', 'monitor', 'alert']
            ]
        ];

        // Use role-specific categories if role is specified, otherwise use customer service as default
        $agentCategories = $roleCategories[$role] ?? $roleCategories['customer_service'];

        if (!empty($filter)) {
            $methods = array_filter($methods, function($method) use ($filter) {
                return stripos($method, $filter) !== false;
            });
        }

        if (!empty($category)) {
            if (isset($agentCategories[$category])) {
                // Role-focused category filtering
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

        // Add role-focused information when in agent mode
        if ($agentMode) {
            $result['available_roles'] = array_keys($roleCategories);
            $result['current_role'] = $role ?: 'customer_service';
            $result['role_categories'] = array_keys($agentCategories);
            $result['role_workflow_suggestions'] = $this->getRoleWorkflowSuggestions($methods, $role);
        }

        return json_encode($result, JSON_PRETTY_PRINT);
    }

    /**
     * Get role-specific workflow suggestions based on available methods
     */
    private function getRoleWorkflowSuggestions(array $methods, string $role = ''): array
    {
        $suggestions = [];
        
        if ($role === 'business_agent' || empty($role)) {
            // Business agent workflows
            $partnerMethods = array_filter($methods, function($method) {
                return stripos($method, 'partner') !== false || stripos($method, 'affiliate') !== false || stripos($method, 'reseller') !== false;
            });
            if (!empty($partnerMethods)) {
                $suggestions['partnership_management'] = [
                    'description' => 'Partner and affiliate relationship management',
                    'methods' => array_values($partnerMethods),
                    'common_tasks' => ['Manage partner accounts', 'Track affiliate performance', 'Process partner commissions']
                ];
            }

            $salesMethods = array_filter($methods, function($method) {
                return stripos($method, 'lead') !== false || stripos($method, 'sale') !== false || stripos($method, 'conversion') !== false;
            });
            if (!empty($salesMethods)) {
                $suggestions['sales_operations'] = [
                    'description' => 'Sales pipeline and lead management',
                    'methods' => array_values($salesMethods),
                    'common_tasks' => ['Track sales leads', 'Monitor conversion rates', 'Manage sales pipeline']
                ];
            }
        }

        if ($role === 'product_owner' || empty($role)) {
            // Product owner workflows
            $productMethods = array_filter($methods, function($method) {
                return stripos($method, 'product') !== false || stripos($method, 'package') !== false || stripos($method, 'plan') !== false;
            });
            if (!empty($productMethods)) {
                $suggestions['product_management'] = [
                    'description' => 'Product catalog and lifecycle management',
                    'methods' => array_values($productMethods),
                    'common_tasks' => ['Manage product catalog', 'Update pricing plans', 'Monitor product performance']
                ];
            }

            $configMethods = array_filter($methods, function($method) {
                return stripos($method, 'config') !== false || stripos($method, 'setting') !== false || stripos($method, 'template') !== false;
            });
            if (!empty($configMethods)) {
                $suggestions['product_configuration'] = [
                    'description' => 'Product settings and configuration management',
                    'methods' => array_values($configMethods),
                    'common_tasks' => ['Configure product settings', 'Manage templates', 'Update system configurations']
                ];
            }
        }

        if ($role === 'research' || empty($role)) {
            // Research workflows
            $analyticsMethods = array_filter($methods, function($method) {
                return stripos($method, 'report') !== false || stripos($method, 'stat') !== false || stripos($method, 'analytic') !== false;
            });
            if (!empty($analyticsMethods)) {
                $suggestions['data_analysis'] = [
                    'description' => 'Business intelligence and data analysis',
                    'methods' => array_values($analyticsMethods),
                    'common_tasks' => ['Generate reports', 'Analyze metrics', 'Track KPIs']
                ];
            }

            $usageMethods = array_filter($methods, function($method) {
                return stripos($method, 'usage') !== false || stripos($method, 'activity') !== false || stripos($method, 'log') !== false;
            });
            if (!empty($usageMethods)) {
                $suggestions['behavior_research'] = [
                    'description' => 'User behavior and activity analysis',
                    'methods' => array_values($usageMethods),
                    'common_tasks' => ['Track user activity', 'Analyze usage patterns', 'Monitor system logs']
                ];
            }
        }

        if ($role === 'customer_service' || empty($role)) {
            // Customer service workflows (existing)
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
        }

        return $suggestions;
    }

    /**
     * Get role-based agent dashboard with quick access to relevant functions
     */
    private function getAgentDashboard(array $args): string
    {
        $role = $args['role'] ?? 'customer_service';
        $focusArea = $args['focus_area'] ?? 'all';
        
        $dashboard = [
            'agent_info' => [
                'server_status' => 'connected',
                'api_methods_available' => count($this->discoveredMethods),
                'role' => $role,
                'focus_area' => $focusArea,
                'timestamp' => date('Y-m-d H:i:s')
            ]
        ];

        // Define role-specific priority methods
        $rolePriorityMethods = [
            'customer_service' => [
                'customer' => ['getClientDetails', 'getClients', 'updateClient', 'getClientServices'],
                'orders' => ['getOrders', 'createOrder', 'getInvoices', 'createInvoice', 'getPayments'],
                'support' => ['getTickets', 'createTicket', 'updateTicket', 'getTicketReplies'],
                'business' => ['getDomains', 'getProducts', 'getServices', 'getPackages']
            ],
            'business_agent' => [
                'partnerships' => ['getAffiliates', 'createAffiliate', 'getResellers', 'getPartners'],
                'sales' => ['getLeads', 'createLead', 'getSalesStats', 'getConversions'],
                'analytics' => ['getReports', 'getSalesReports', 'getPerformanceStats'],
                'business' => ['getRevenue', 'getProfitReports', 'getCommissions']
            ],
            'product_owner' => [
                'products' => ['getProducts', 'createProduct', 'updateProduct', 'getPackages'],
                'analytics' => ['getProductStats', 'getUsageReports', 'getAdoptionMetrics'],
                'management' => ['getCategories', 'updatePricing', 'getInventory'],
                'development' => ['getConfigs', 'updateSettings', 'getTemplates']
            ],
            'research' => [
                'analytics' => ['getReports', 'getStatistics', 'getMetrics', 'getAnalytics'],
                'research' => ['getSurveys', 'getFeedback', 'getReviews', 'getRatings'],
                'behavior' => ['getUsageData', 'getActivityLogs', 'getSessionData'],
                'performance' => ['getPerformanceStats', 'getLoadMetrics', 'getBenchmarks']
            ]
        ];

        $priorityMethods = $rolePriorityMethods[$role] ?? $rolePriorityMethods['customer_service'];

        if ($focusArea === 'all') {
            foreach ($priorityMethods as $area => $methods) {
                $availableMethods = array_intersect($methods, $this->discoveredMethods);
                if (!empty($availableMethods)) {
                    $dashboard['quick_access'][$area] = [
                        'description' => $this->getAreaDescription($area, $role),
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
                    'role' => $role,
                    'description' => $this->getAreaDescription($focusArea, $role),
                    'priority_methods' => array_values($availableMethods),
                    'all_related' => array_filter($this->discoveredMethods, function($method) use ($focusArea) {
                        return stripos($method, $focusArea) !== false;
                    })
                ];
            }
        }

        // Add role-specific tips and best practices
        $dashboard['role_tips'] = $this->getRoleTips($role);

        return json_encode($dashboard, JSON_PRETTY_PRINT);
    }

    /**
     * Get area description based on role context
     */
    private function getAreaDescription(string $area, string $role): string
    {
        $descriptions = [
            'customer_service' => [
                'customer' => 'Customer account management and support operations',
                'orders' => 'Order processing and billing operations',
                'support' => 'Help desk and ticket management',
                'business' => 'Business services and domain management'
            ],
            'business_agent' => [
                'partnerships' => 'Partner and affiliate relationship management',
                'sales' => 'Sales pipeline and lead management',
                'analytics' => 'Business intelligence and performance metrics',
                'business' => 'Revenue tracking and business development'
            ],
            'product_owner' => [
                'products' => 'Product catalog and lifecycle management',
                'analytics' => 'Product performance and adoption metrics',
                'management' => 'Product portfolio and pricing management',
                'development' => 'Product configuration and development'
            ],
            'research' => [
                'analytics' => 'Data analysis and business intelligence',
                'research' => 'Market research and customer feedback',
                'behavior' => 'User behavior and activity analysis',
                'performance' => 'System performance and benchmarking'
            ]
        ];

        return $descriptions[$role][$area] ?? ucfirst($area) . ' operations';
    }

    /**
     * Get role-specific tips and best practices
     */
    private function getRoleTips(string $role): array
    {
        $tips = [
            'customer_service' => [
                'workflow_optimization' => 'Use category filters to quickly find relevant API methods',
                'customer_service' => 'Start with getClientDetails for customer inquiries',
                'order_processing' => 'Use createOrder followed by createInvoice for new sales',
                'support_workflow' => 'Create tickets with createTicket and track with getTickets'
            ],
            'business_agent' => [
                'partnership_management' => 'Monitor affiliate performance regularly using performance reports',
                'sales_optimization' => 'Track conversion rates and adjust strategies based on data',
                'market_analysis' => 'Use analytics tools to identify market trends and opportunities',
                'revenue_tracking' => 'Monitor revenue streams and commission structures regularly'
            ],
            'product_owner' => [
                'product_lifecycle' => 'Track product adoption metrics to guide development decisions',
                'feature_development' => 'Use customer feedback to prioritize product features',
                'pricing_strategy' => 'Analyze usage patterns to optimize pricing models',
                'market_positioning' => 'Monitor competitor offerings and adjust product positioning'
            ],
            'research' => [
                'data_collection' => 'Establish consistent data collection methodologies',
                'analysis_workflow' => 'Use statistical analysis to identify significant patterns',
                'insight_generation' => 'Combine quantitative data with qualitative feedback',
                'reporting_strategy' => 'Create actionable reports with clear recommendations'
            ]
        ];

        return $tips[$role] ?? $tips['customer_service'];
    }

    /**
     * Get method details
     */
    private function getMethodDetails(array $args): string
    {
        $method = $args['method'] ?? '';
        
        if (empty($method)) {
            return json_encode(['error' => 'Method name is required'], JSON_PRETTY_PRINT);
        }

        // Validate method name format (alphanumeric and underscores only)
        if (!preg_match('/^[a-zA-Z_][a-zA-Z0-9_]*$/', $method)) {
            return json_encode(['error' => 'Invalid method name format'], JSON_PRETTY_PRINT);
        }

        try {
            $details = $this->hostbill->getMethodDetails($method);
            return json_encode($details, JSON_PRETTY_PRINT);
        } catch (\Exception $e) {
            return json_encode([
                'error' => "Failed to get details for method '{$method}'",
                'message' => $e->getMessage()
            ], JSON_PRETTY_PRINT);
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
            return json_encode(['error' => 'Method name is required'], JSON_PRETTY_PRINT);
        }

        // Validate method name format
        if (!preg_match('/^[a-zA-Z_][a-zA-Z0-9_]*$/', $method)) {
            return json_encode(['error' => 'Invalid method name format'], JSON_PRETTY_PRINT);
        }

        if (!in_array($method, $this->discoveredMethods)) {
            return json_encode([
                'error' => "Method '{$method}' is not available or not permitted",
                'available_methods' => count($this->discoveredMethods),
                'hint' => 'Use hostbill_list_methods to see available methods'
            ], JSON_PRETTY_PRINT);
        }

        // Validate parameters is an array
        if (!is_array($parameters)) {
            return json_encode(['error' => 'Parameters must be an object/array'], JSON_PRETTY_PRINT);
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
     * Get role-friendly description for API methods
     */
    private function getAgentFriendlyDescription(string $method, string $originalDescription = ''): string
    {
        // Role-focused descriptions for common HostBill operations
        $roleDescriptions = [
            // Customer Service Agent descriptions
            'getClientDetails' => 'Get customer account information and details (Customer Service: Use for customer inquiries)',
            'getClients' => 'List all customers (Customer Service: Customer search and management)',
            'updateClient' => 'Update customer account information (Customer Service: Modify customer details)',
            'getOrders' => 'View customer orders and order history (Customer Service: Track order status)',
            'createOrder' => 'Create new order for customer (Customer Service: Process new sales)',
            'getInvoices' => 'View customer invoices and billing (Customer Service: Billing inquiries)',
            'createInvoice' => 'Generate invoice for customer (Customer Service: Manual billing)',
            'getTickets' => 'View support tickets (Customer Service: Customer support dashboard)',
            'createTicket' => 'Create new support ticket (Customer Service: Log customer issues)',
            'updateTicket' => 'Update support ticket status (Customer Service: Manage support cases)',
            'getPayments' => 'View payment history (Customer Service: Payment inquiries)',
            'getDomains' => 'List customer domains (Customer Service: Domain management)',
            'getServices' => 'View customer services (Customer Service: Service management)',
            'getProducts' => 'List available products (Customer Service: Sales information)',

            // Business Agent descriptions
            'getAffiliates' => 'Manage affiliate partners (Business Agent: Partnership development)',
            'createAffiliate' => 'Add new affiliate partner (Business Agent: Expand partner network)',
            'getResellers' => 'View reseller accounts (Business Agent: Channel management)',
            'getLeads' => 'Track sales leads (Business Agent: Pipeline management)',
            'createLead' => 'Add new sales lead (Business Agent: Lead generation)',
            'getSalesStats' => 'View sales performance (Business Agent: Revenue analysis)',
            'getConversions' => 'Track conversion rates (Business Agent: Performance optimization)',
            'getCommissions' => 'View commission structures (Business Agent: Partner compensation)',

            // Product Owner descriptions
            'createProduct' => 'Add new product to catalog (Product Owner: Product development)',
            'updateProduct' => 'Modify product specifications (Product Owner: Product management)',
            'getPackages' => 'View product packages (Product Owner: Portfolio management)',
            'getProductStats' => 'Analyze product performance (Product Owner: Product analytics)',
            'getUsageReports' => 'Monitor product usage (Product Owner: Adoption analysis)',
            'getCategories' => 'Manage product categories (Product Owner: Catalog organization)',
            'updatePricing' => 'Adjust product pricing (Product Owner: Pricing strategy)',
            'getConfigs' => 'View product configurations (Product Owner: Product settings)',

            // Research descriptions
            'getReports' => 'Generate analytical reports (Research: Data analysis)',
            'getStatistics' => 'View system statistics (Research: Performance metrics)',
            'getMetrics' => 'Access key performance indicators (Research: KPI tracking)',
            'getAnalytics' => 'View detailed analytics (Research: Behavioral analysis)',
            'getSurveys' => 'Access customer surveys (Research: Market research)',
            'getFeedback' => 'View customer feedback (Research: Sentiment analysis)',
            'getUsageData' => 'Analyze usage patterns (Research: User behavior)',
            'getActivityLogs' => 'Review system activity (Research: Activity analysis)',
            'getPerformanceStats' => 'Monitor performance metrics (Research: Performance analysis)'
        ];

        if (isset($roleDescriptions[$method])) {
            return $roleDescriptions[$method];
        }

        // Generate contextual description based on method name for different roles
        $baseDescription = $originalDescription ?: "Execute {$method} API call";
        
        if (stripos($method, 'client') !== false || stripos($method, 'customer') !== false) {
            return $baseDescription . ' (Customer Service Operation)';
        } elseif (stripos($method, 'order') !== false || stripos($method, 'invoice') !== false) {
            return $baseDescription . ' (Customer Service/Business Agent Operation)';
        } elseif (stripos($method, 'ticket') !== false || stripos($method, 'support') !== false) {
            return $baseDescription . ' (Customer Service Operation)';
        } elseif (stripos($method, 'product') !== false || stripos($method, 'package') !== false) {
            return $baseDescription . ' (Product Owner/Customer Service Operation)';
        } elseif (stripos($method, 'report') !== false || stripos($method, 'stat') !== false || stripos($method, 'analytic') !== false) {
            return $baseDescription . ' (Research/Business Agent Operation)';
        } elseif (stripos($method, 'partner') !== false || stripos($method, 'affiliate') !== false || stripos($method, 'reseller') !== false) {
            return $baseDescription . ' (Business Agent Operation)';
        } elseif (stripos($method, 'domain') !== false || stripos($method, 'service') !== false) {
            return $baseDescription . ' (Customer Service/Product Owner Operation)';
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