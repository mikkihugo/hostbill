<?php

require_once __DIR__ . '/../vendor/autoload.php';

use HostBillMCP\MCPProtocol;

/**
 * Simple test script for MCP Protocol implementation
 */

// Create test MCP server
$mcp = new MCPProtocol('test-server', '1.0.0');

// Register a test tool
$mcp->registerTool(
    'test_echo',
    function(array $args) {
        return 'Echo: ' . ($args['message'] ?? 'No message provided');
    },
    [
        'description' => 'Echo back a message',
        'inputSchema' => [
            'type' => 'object',
            'properties' => [
                'message' => [
                    'type' => 'string',
                    'description' => 'Message to echo back'
                ]
            ]
        ]
    ]
);

// Test JSON-RPC requests
$testRequests = [
    // Initialize request
    [
        'jsonrpc' => '2.0',
        'id' => 1,
        'method' => 'initialize',
        'params' => [
            'protocolVersion' => '2024-11-05',
            'capabilities' => []
        ]
    ],
    // List tools request
    [
        'jsonrpc' => '2.0',
        'id' => 2,
        'method' => 'tools/list'
    ],
    // Call tool request
    [
        'jsonrpc' => '2.0',
        'id' => 3,
        'method' => 'tools/call',
        'params' => [
            'name' => 'test_echo',
            'arguments' => [
                'message' => 'Hello, MCP!'
            ]
        ]
    ]
];

echo "Testing MCP Protocol Implementation\n";
echo "==================================\n\n";

foreach ($testRequests as $i => $request) {
    echo "Test " . ($i + 1) . ": " . $request['method'] . "\n";
    echo "Request: " . json_encode($request) . "\n";
    
    // Simulate sending request through stdin/stdout
    $tempInput = tmpfile();
    $tempOutput = tmpfile();
    
    fwrite($tempInput, json_encode($request) . "\n");
    rewind($tempInput);
    
    // Create a mock MCP instance that uses our temp files
    $reflection = new ReflectionClass($mcp);
    $inputProperty = $reflection->getProperty('inputStream');
    $inputProperty->setAccessible(true);
    $inputProperty->setValue($mcp, $tempInput);
    
    $outputProperty = $reflection->getProperty('outputStream');
    $outputProperty->setAccessible(true);
    $outputProperty->setValue($mcp, $tempOutput);
    
    // Process one request
    $handleMethod = $reflection->getMethod('handleRequest');
    $handleMethod->setAccessible(true);
    
    try {
        $response = $handleMethod->invoke($mcp, $request);
        echo "Response: " . json_encode($response) . "\n";
        echo "Status: ✓ SUCCESS\n\n";
    } catch (Exception $e) {
        echo "Error: " . $e->getMessage() . "\n";
        echo "Status: ✗ FAILED\n\n";
    }
    
    fclose($tempInput);
    fclose($tempOutput);
}

echo "MCP Protocol test completed.\n";