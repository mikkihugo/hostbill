#!/usr/bin/env -S deno run -A --env

/**
 * Cloud-IQ Deno Application
 * Standalone HTTP server for Crayon Cloud-IQ and HostBill integration
 * With multi-agent development crews and federated MCP support
 */

import { CloudIQSyncService } from "./lib/sync.js";

// Configuration from environment variables
const config = {
  port: parseInt(Deno.env.get("PORT") || "8000"),
  crayonConfig: {
    clientId: Deno.env.get("CRAYON_CLIENT_ID") || "",
    clientSecret: Deno.env.get("CRAYON_CLIENT_SECRET") || "",
    tenantId: Deno.env.get("CRAYON_TENANT_ID") || "",
    dynamicAuth: Deno.env.get("CRAYON_DYNAMIC_AUTH") === "true",
    username: Deno.env.get("CRAYON_USERNAME") || "",
  },
  hostbillConfig: {
    apiUrl: Deno.env.get("HOSTBILL_URL") || "",
    apiId: Deno.env.get("HOSTBILL_API_ID") || "",
    apiKey: Deno.env.get("HOSTBILL_API_KEY") || "",
  },
  syncIntervalMinutes: parseInt(Deno.env.get("SYNC_INTERVAL_MINUTES") || "60"),
};

console.log("🚀 Starting Cloud-IQ Application");
console.log(`📊 Server will run on http://localhost:${config.port}`);

// Initialize sync service for background operations
let syncService = null;

if (config.crayonConfig.clientId && config.hostbillConfig.apiUrl) {
  syncService = new CloudIQSyncService(config);
  syncService.startPeriodicSync();
  console.log("✅ Background sync service started");
} else {
  console.log("⚠️  Sync service disabled - missing API configuration");
}
// Simple HTTP server handler
async function handler(request) {
  const url = new URL(request.url);
  const { pathname, searchParams } = url;

  // CORS headers for API requests
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  // Handle preflight requests
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // API Routes
    if (pathname.startsWith("/api/")) {
      const headers = { ...corsHeaders, "Content-Type": "application/json" };

      // Sync API endpoints
      if (pathname === "/api/sync/manual" && request.method === "POST") {
        if (syncService) {
          const result = await syncService.performFullSync();
          return new Response(JSON.stringify(result), { headers });
        } else {
          return new Response(
            JSON.stringify({ error: "Sync service not available" }),
            { status: 503, headers }
          );
        }
      }

      if (pathname === "/api/sync/stats") {
        if (syncService) {
          const stats = syncService.getSyncStats();
          return new Response(JSON.stringify(stats), { headers });
        } else {
          return new Response(
            JSON.stringify({ error: "Sync service not available" }),
            { status: 503, headers }
          );
        }
      }
          return new Response(
            JSON.stringify({ error: "Multi-agent crew not available" }),
            { status: 503, headers }
          );
        }
      }

      if (pathname === "/api/agents/tasks" && request.method === "POST") {
        } else {
          return new Response(
            JSON.stringify({ error: "Multi-agent crew not available" }),
            { status: 503, headers }
          );
        }
      }

      if (pathname === "/api/agents/workflow" && request.method === "POST") {
        } else {
          return new Response(
            JSON.stringify({ error: "Multi-agent crew not available" }),
            { status: 503, headers }
          );
        }
      }

      return new Response(
        JSON.stringify({ error: "API endpoint not found" }),
        { status: 404, headers }
      );
    }

    // Static HTML pages
    return serveStaticPage(pathname);

  } catch (error) {
    console.error("Request error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
}

function serveStaticPage(pathname) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cloud-IQ - Crayon & HostBill Integration</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
    <div class="min-h-screen">
        <nav class="bg-white shadow">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <div class="flex items-center">
                        <h1 class="text-xl font-bold text-gray-900">Cloud-IQ</h1>
                    </div>
                    <div class="flex items-center space-x-4">
                        <a href="/" class="text-gray-700 hover:text-gray-900">Dashboard</a>
                        <a href="/orders" class="text-gray-700 hover:text-gray-900">Orders</a>
                        <a href="/sync" class="text-gray-700 hover:text-gray-900">Sync</a>
                    </div>
                </div>
            </div>
        </nav>

        <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div id="content">
                ${getPageContent(pathname)}
            </div>
        </main>
    </div>

    <script>
        // Simple client-side routing and API interaction
        async function triggerSync() {
            try {
                const response = await fetch('/api/sync/manual', { method: 'POST' });
                const result = await response.json();
                alert(result.message || 'Sync completed');
                location.reload();
            } catch (error) {
                alert('Sync failed: ' + error.message);
            }
        }

        async function loadStats() {
            try {
                const response = await fetch('/api/sync/stats');
                const stats = await response.json();
                
                const statsElement = document.getElementById('sync-stats');
                if (statsElement) {
                    statsElement.innerHTML = \`
                        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                            <div class="bg-white overflow-hidden shadow rounded-lg">
                                <div class="p-5">
                                    <div class="flex items-center">
                                        <div class="flex-shrink-0">
                                            <div class="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                                                <span class="text-white text-sm font-medium">S</span>
                                            </div>
                                        </div>
                                        <div class="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt class="text-sm font-medium text-gray-500 truncate">Sync Records</dt>
                                                <dd class="text-lg font-medium text-gray-900">\${stats.syncRecords || 0}</dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="bg-white overflow-hidden shadow rounded-lg">
                                <div class="p-5">
                                    <div class="flex items-center">
                                        <div class="flex-shrink-0">
                                            <div class="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                                                <span class="text-white text-sm font-medium">U</span>
                                            </div>
                                        </div>
                                        <div class="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt class="text-sm font-medium text-gray-500 truncate">Usage Records</dt>
                                                <dd class="text-lg font-medium text-gray-900">\${stats.usageRecords || 0}</dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="bg-white overflow-hidden shadow rounded-lg">
                                <div class="p-5">
                                    <div class="flex items-center">
                                        <div class="flex-shrink-0">
                                            <div class="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                                                <span class="text-white text-sm font-medium">O</span>
                                            </div>
                                        </div>
                                        <div class="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt class="text-sm font-medium text-gray-500 truncate">Orders</dt>
                                                <dd class="text-lg font-medium text-gray-900">\${stats.orderRecords || 0}</dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="bg-white overflow-hidden shadow rounded-lg">
                                <div class="p-5">
                                    <div class="flex items-center">
                                        <div class="flex-shrink-0">
                                            <div class="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                                                <span class="text-white text-sm font-medium">P</span>
                                            </div>
                                        </div>
                                        <div class="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt class="text-sm font-medium text-gray-500 truncate">Pending</dt>
                                                <dd class="text-lg font-medium text-gray-900">\${stats.pendingSyncs || 0}</dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    \`;
                }
            } catch (error) {
                console.error('Failed to load stats:', error);
            }
        }

        // Load stats on dashboard page
        if (window.location.pathname === '/') {
            loadStats();
            loadAgentStatus();
        }

        async function loadAgentStatus() {
            try {
                const response = await fetch('/api/agents/status');
                if (response.ok) {
                    const agentStatus = await response.json();
                    
                    const agentElement = document.getElementById('agent-status');
                    if (agentElement && agentStatus.agents) {
                        agentElement.innerHTML = \`
                            <div class="bg-white shadow rounded-lg p-6">
                                <h3 class="text-lg font-semibold text-gray-900 mb-4">Multi-Agent Crew Status</h3>
                                <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    <div class="text-center">
                                        <div class="text-2xl font-bold text-blue-600">\${agentStatus.agents.total}</div>
                                        <div class="text-sm text-gray-500">Agents</div>
                                    </div>
                                    <div class="text-center">
                                        <div class="text-2xl font-bold text-green-600">\${agentStatus.tasks.total || 0}</div>
                                        <div class="text-sm text-gray-500">Tasks</div>
                                    </div>
                                    <div class="text-center">
                                        <div class="text-2xl font-bold text-purple-600">\${agentStatus.mcpServers.active}</div>
                                        <div class="text-sm text-gray-500">MCP Servers</div>
                                    </div>
                                </div>
                                <div class="mt-4">
                                    <button onclick="createSampleTask()" class="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
                                        Create Sample Task
                                    </button>
                                </div>
                            </div>
                        \`;
                    }
                } else {
                    const agentElement = document.getElementById('agent-status');
                    if (agentElement) {
                        agentElement.innerHTML = \`
                            <div class="bg-gray-100 shadow rounded-lg p-6">
                                <h3 class="text-lg font-semibold text-gray-700 mb-2">Multi-Agent Crew</h3>
                                <p class="text-sm text-gray-600">Multi-agent crew is disabled. Set ENABLE_MULTI_AGENT=true to enable.</p>
                            </div>
                        \`;
                    }
                }
            } catch (error) {
                console.error('Failed to load agent status:', error);
            }
        }

        async function createSampleTask() {
            try {
                const response = await fetch('/api/agents/tasks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'analysis',
                        priority: 'medium',
                        payload: { operation: 'sample-analysis', source: 'dashboard' }
                    })
                });
                
                const result = await response.json();
                if (result.taskId) {
                    alert(\`Created task: \${result.taskId}\`);
                    loadAgentStatus(); // Reload status
                } else {
                    alert('Failed to create task');
                }
            } catch (error) {
                alert('Error creating task: ' + error.message);
            }
        }
    </script>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}

function getPageContent(pathname) {
  switch (pathname) {
    case "/":
      return `
        <div class="px-4 py-6 sm:px-0">
            <div class="border-4 border-dashed border-gray-200 rounded-lg p-8">
                <h1 class="text-3xl font-bold text-gray-900 mb-4">Cloud-IQ Dashboard</h1>
                <p class="text-gray-600 mb-6">
                    Crayon Cloud-IQ integration with HostBill for CSP billing management
                </p>
                
                <div id="sync-stats" class="mb-8">
                    <div class="animate-pulse">Loading statistics...</div>
                </div>

                <div id="agent-status" class="mb-8">
                    <div class="animate-pulse">Loading agent status...</div>
                </div>

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <h3 class="text-lg font-medium text-blue-900">Create Order</h3>
                        <p class="mt-2 text-sm text-blue-700">Order new CSP services for customers</p>
                        <a href="/orders" class="mt-4 inline-block text-blue-600 hover:text-blue-800">Go to Orders →</a>
                    </div>
                    <div class="bg-green-50 border border-green-200 rounded-lg p-6">
                        <h3 class="text-lg font-medium text-green-900">Sync Status</h3>
                        <p class="mt-2 text-sm text-green-700">Monitor synchronization between systems</p>
                        <a href="/sync" class="mt-4 inline-block text-green-600 hover:text-green-800">View Sync →</a>
                    </div>
                    <div class="bg-orange-50 border border-orange-200 rounded-lg p-6">
                        <h3 class="text-lg font-medium text-orange-900">Manual Sync</h3>
                        <p class="mt-2 text-sm text-orange-700">Trigger immediate synchronization</p>
                        <button onclick="triggerSync()" class="mt-4 inline-block text-orange-600 hover:text-orange-800">Run Sync →</button>
                    </div>
                </div>
            </div>
        </div>
      `;

    case "/orders":
      return `
        <div class="px-4 py-6 sm:px-0">
            <div class="border-4 border-dashed border-gray-200 rounded-lg p-8">
                <h1 class="text-3xl font-bold text-gray-900 mb-4">Order Management</h1>
                <p class="text-gray-600 mb-6">
                    Create and manage CSP service orders
                </p>
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 class="text-lg font-medium text-blue-900">Order Creation</h3>
                    <p class="mt-2 text-sm text-blue-700">
                        Order functionality requires full API configuration. 
                        Configure Crayon and HostBill API credentials to enable order creation.
                    </p>
                </div>
            </div>
        </div>
      `;

    case "/sync":
      return `
        <div class="px-4 py-6 sm:px-0">
            <div class="border-4 border-dashed border-gray-200 rounded-lg p-8">
                <h1 class="text-3xl font-bold text-gray-900 mb-4">Sync Monitoring</h1>
                <p class="text-gray-600 mb-6">
                    Monitor and control synchronization between Crayon Cloud-IQ and HostBill
                </p>
                
                <div class="mb-6">
                    <button 
                        onclick="triggerSync()" 
                        class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                    >
                        Run Manual Sync
                    </button>
                </div>

                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <h3 class="text-lg font-medium text-yellow-900">Sync Service Status</h3>
                    <p class="mt-2 text-sm text-yellow-700">
                        Sync monitoring requires full API configuration.
                        Configure environment variables to enable full sync functionality.
                    </p>
                </div>
            </div>
        </div>
      `;

    default:
      return `
        <div class="px-4 py-6 sm:px-0">
            <div class="border-4 border-dashed border-gray-200 rounded-lg p-8 text-center">
                <h1 class="text-3xl font-bold text-gray-900 mb-4">404 - Page Not Found</h1>
                <p class="text-gray-600 mb-6">The page you're looking for doesn't exist.</p>
                <a href="/" class="text-indigo-600 hover:text-indigo-800">Go back to dashboard →</a>
            </div>
        </div>
      `;
  }
}

// Graceful shutdown handler
function shutdown() {
  console.log("\n🛑 Shutting down Cloud-IQ application...");
  if (syncService) {
    syncService.cleanup();
    console.log("✅ Sync service cleaned up");
  }
  Deno.exit(0);
}

// Handle shutdown signals
Deno.addSignalListener("SIGINT", shutdown);
Deno.addSignalListener("SIGTERM", shutdown);

// Start the server
const server = Deno.serve({ port: config.port }, handler);
console.log(`✅ Cloud-IQ server running on http://localhost:${config.port}`);

// Keep the process alive
await server.finished;