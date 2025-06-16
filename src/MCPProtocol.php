<?php

namespace HostBillMCP;

/**
 * MCP Protocol Handler - Core implementation of Model Context Protocol
 */
class MCPProtocol
{
    private array $tools = [];
    private array $resources = [];
    private $inputStream;
    private $outputStream;
    private string $serverName;
    private string $version;

    public function __construct(string $serverName = 'hostbill-mcp-server', string $version = '1.0.0')
    {
        $this->serverName = $serverName;
        $this->version = $version;
        $this->inputStream = fopen('php://stdin', 'r');
        $this->outputStream = fopen('php://stdout', 'w');
    }

    /**
     * Register a tool with the MCP server
     */
    public function registerTool(string $name, callable $handler, array $schema): void
    {
        $this->tools[$name] = [
            'handler' => $handler,
            'schema' => $schema
        ];
    }

    /**
     * Start the MCP server and listen for requests
     */
    public function start(): void
    {
        $this->log("Starting MCP server: {$this->serverName} v{$this->version}");
        
        while (!feof($this->inputStream)) {
            $line = trim(fgets($this->inputStream));
            if (empty($line)) {
                continue;
            }

            try {
                $request = json_decode($line, true);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    $this->sendError('Invalid JSON: ' . json_last_error_msg());
                    continue;
                }

                $response = $this->handleRequest($request);
                if ($response !== null) {
                    $this->sendResponse($response);
                }
            } catch (Exception $e) {
                $this->sendError($e->getMessage(), $request['id'] ?? null);
            }
        }
    }

    /**
     * Handle incoming MCP requests
     */
    private function handleRequest(array $request): ?array
    {
        $method = $request['method'] ?? '';
        $id = $request['id'] ?? null;
        $params = $request['params'] ?? [];

        switch ($method) {
            case 'initialize':
                return $this->handleInitialize($id, $params);
            
            case 'tools/list':
                return $this->handleToolsList($id);
            
            case 'tools/call':
                return $this->handleToolCall($id, $params);
            
            case 'ping':
                return ['jsonrpc' => '2.0', 'id' => $id, 'result' => []];
            
            default:
                return [
                    'jsonrpc' => '2.0',
                    'id' => $id,
                    'error' => [
                        'code' => -32601,
                        'message' => 'Method not found'
                    ]
                ];
        }
    }

    /**
     * Handle initialization request
     */
    private function handleInitialize(int $id, array $params): array
    {
        return [
            'jsonrpc' => '2.0',
            'id' => $id,
            'result' => [
                'protocolVersion' => '2024-11-05',
                'capabilities' => [
                    'tools' => ['listChanged' => true],
                    'resources' => ['subscribe' => true, 'listChanged' => true]
                ],
                'serverInfo' => [
                    'name' => $this->serverName,
                    'version' => $this->version
                ]
            ]
        ];
    }

    /**
     * Handle tools list request
     */
    private function handleToolsList(int $id): array
    {
        $tools = [];
        foreach ($this->tools as $name => $tool) {
            $tools[] = [
                'name' => $name,
                'description' => $tool['schema']['description'] ?? '',
                'inputSchema' => $tool['schema']['inputSchema'] ?? ['type' => 'object']
            ];
        }

        return [
            'jsonrpc' => '2.0',
            'id' => $id,
            'result' => ['tools' => $tools]
        ];
    }

    /**
     * Handle tool call request
     */
    private function handleToolCall(int $id, array $params): array
    {
        $toolName = $params['name'] ?? '';
        $arguments = $params['arguments'] ?? [];

        if (!isset($this->tools[$toolName])) {
            return [
                'jsonrpc' => '2.0',
                'id' => $id,
                'error' => [
                    'code' => -32602,
                    'message' => "Tool not found: {$toolName}"
                ]
            ];
        }

        try {
            $handler = $this->tools[$toolName]['handler'];
            $result = $handler($arguments);

            return [
                'jsonrpc' => '2.0',
                'id' => $id,
                'result' => [
                    'content' => [
                        [
                            'type' => 'text',
                            'text' => is_string($result) ? $result : json_encode($result, JSON_PRETTY_PRINT)
                        ]
                    ]
                ]
            ];
        } catch (Exception $e) {
            return [
                'jsonrpc' => '2.0',
                'id' => $id,
                'error' => [
                    'code' => -32603,
                    'message' => "Tool execution failed: " . $e->getMessage()
                ]
            ];
        }
    }

    /**
     * Send a response
     */
    private function sendResponse(array $response): void
    {
        fwrite($this->outputStream, json_encode($response) . "\n");
        fflush($this->outputStream);
    }

    /**
     * Send an error response
     */
    private function sendError(string $message, ?int $id = null): void
    {
        $error = [
            'jsonrpc' => '2.0',
            'id' => $id,
            'error' => [
                'code' => -32603,
                'message' => $message
            ]
        ];

        $this->sendResponse($error);
    }

    /**
     * Log a message
     */
    private function log(string $message): void
    {
        error_log("[MCP] " . $message);
    }
}