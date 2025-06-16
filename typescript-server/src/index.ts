#!/usr/bin/env node

import { createInterface } from 'readline';
import { HostBillMCPServer } from './hostbill-mcp-server.js';

// Configuration from environment variables
const config = {
    serverName: 'hostbill-mcp-server-ts',
    version: '1.0.0',
    hostbillUrl: process.env.HOSTBILL_URL || '',
    apiId: process.env.HOSTBILL_API_ID || '',
    apiKey: process.env.HOSTBILL_API_KEY || ''
};

// Handle command line arguments
const args = process.argv.slice(2);

if (args.length > 0) {
    switch (args[0]) {
        case '--help':
        case '-h':
            console.log('HostBill MCP Server (TypeScript)');
            console.log(`Usage: ${process.argv[1]} [options]`);
            console.log('Options:');
            console.log('  --help, -h     Show this help message');
            console.log('  --version, -v  Show version information');
            console.log('  --test         Test HostBill API connection');
            console.log('\nEnvironment Variables:');
            console.log('  HOSTBILL_URL      Your HostBill instance URL');
            console.log('  HOSTBILL_API_ID   Your API ID');
            console.log('  HOSTBILL_API_KEY  Your API Key');
            process.exit(0);
            
        case '--version':
        case '-v':
            console.log(`HostBill MCP Server (TypeScript) v${config.version}`);
            process.exit(0);
            
        case '--test':
            await testConnection();
            process.exit(0);
            
        default:
            console.error(`Unknown option: ${args[0]}`);
            console.error('Use --help for usage information');
            process.exit(1);
    }
}

// Validate configuration
if (!config.hostbillUrl || !config.apiId || !config.apiKey) {
    console.error('Error: Missing required environment variables:');
    console.error('- HOSTBILL_URL: Your HostBill instance URL');
    console.error('- HOSTBILL_API_ID: Your API ID');
    console.error('- HOSTBILL_API_KEY: Your API Key');
    process.exit(1);
}

async function testConnection() {
    console.log('Testing HostBill API connection...');
    
    try {
        const { HostBillAPIClient } = await import('./hostbill-api-client.js');
        const client = new HostBillAPIClient(config.hostbillUrl, config.apiId, config.apiKey);
        
        const isConnected = await client.testConnection();
        if (isConnected) {
            console.log('✓ Connection successful');
            
            try {
                const methods = await client.getAPIMethods();
                console.log(`✓ Discovered ${methods.length} API methods`);
                
                const info = await client.getServerInfo();
                if (info.version) {
                    console.log(`✓ HostBill version: ${info.version}`);
                }
            } catch (e) {
                console.log(`⚠ Warning: ${e instanceof Error ? e.message : String(e)}`);
            }
        } else {
            console.log('✗ Connection failed');
            process.exit(1);
        }
    } catch (e) {
        console.error(`Error: ${e instanceof Error ? e.message : String(e)}`);
        process.exit(1);
    }
}

// Start the MCP server
try {
    const server = new HostBillMCPServer(config);
    await server.start();
} catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
}