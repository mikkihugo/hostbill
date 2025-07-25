#!/usr/bin/env node

/**
 * Cloud-IQ Node.js Application
 * Production-ready HTTP server for Crayon Cloud-IQ and HostBill integration
 * With Microsoft GenAI agent support and enhanced security
 */

import { CloudIQSyncService } from "./lib/sync.js";
import { GenAIService } from "./lib/genai.js";
import { getConfig } from "./lib/config.js";
import { createSecurityMiddleware, healthCheck } from "./lib/security.js";
import { logger, requestLogger, errorTracker } from "./lib/logger.js";
import { createServer } from 'node:http';

// Simple Response class for Web API compatibility
class Response {
  constructor(body, options = {}) {
    this.body = body;
    this.status = options.status || 200;
    this.headers = new Map(Object.entries(options.headers || {}));
  }

  async text() {
    return typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
  }
}

// Get validated configuration
const config = getConfig();

logger.info("🚀 Starting Cloud-IQ Application", {
  nodeEnv: config.server.nodeEnv,
  port: config.server.port
});

// Initialize security middleware
const security = createSecurityMiddleware(config);

// Initialize sync service for background operations
let syncService = null;
let genAiService = null;

if (config.crayon.clientId && config.hostbill.apiUrl) {
  syncService = new CloudIQSyncService({
    crayonConfig: config.crayon,
    hostbillConfig: config.hostbill,
    syncIntervalMinutes: config.sync.intervalMinutes,
    dbPath: config.sync.databasePath
  });
  syncService.startPeriodicSync();
  logger.info("✅ Background sync service started");
} else {
  logger.warn("⚠️  Sync service disabled - missing API configuration");
}

// Initialize GenAI service
genAiService = new GenAIService({
  genAiConfig: config.genAi
});
genAiService.initialize();

// Simple HTTP server handler with security middleware
async function handleRequest(request) {
  const startTime = requestLogger.logRequest(request);
  let response;
  
  try {
    const url = new URL(request.url);
    const { pathname } = url;

    // Apply rate limiting
    const rateLimitResponse = security.applyRateLimit(request);
    if (rateLimitResponse.status === 429) {
      response = new Response(rateLimitResponse.body, rateLimitResponse);
      return security.applySecurityHeaders(response);
    }

    // CORS headers for API requests
    const corsHeaders = {
      "Access-Control-Allow-Origin": config.security.cors.origin,
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      ...rateLimitResponse.headers
    };

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      response = new Response(null, { status: 200, headers: corsHeaders });
      return security.applySecurityHeaders(response);
    }

    // Health check endpoint
    if (pathname === "/health") {
      const healthReport = await healthCheck.generateHealthReport(
        syncService?.db,
        syncService?.crayonClient,
        syncService?.hostbillClient
      );
      response = new Response(JSON.stringify(healthReport), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
      return security.applySecurityHeaders(response);
    }

    // API Routes with validation
    if (pathname.startsWith("/api/")) {
      try {
        // Validate request
        security.validateRequest(request, pathname);
        
        const headers = { ...corsHeaders, "Content-Type": "application/json" };
        response = await handleApiRequest(pathname, request, headers);
        
      } catch (validationError) {
        logger.warn("Request validation failed", {
          url: pathname,
          error: validationError.message
        });
        
        response = new Response(
          JSON.stringify({ 
            error: "Validation Error", 
            message: validationError.message 
          }),
          { status: 400, headers: corsHeaders }
        );
      }
    } else {
      // Static HTML pages
      response = serveStaticPage(pathname);
    }

  } catch (error) {
    logger.error("Request handling error", {
      url: request.url,
      error: error.message,
      stack: error.stack
    });
    
    response = new Response(
      JSON.stringify({ 
        error: "Internal Server Error",
        message: config.server.nodeEnv === 'production' ? 
          'An error occurred while processing your request' : 
          error.message
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  } finally {
    // Log response
    requestLogger.logResponse(request, response, startTime);
  }

  return security.applySecurityHeaders(response);
}

// Handle API requests
async function handleApiRequest(pathname, request, headers) {
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

  // GenAI Agent API endpoints
  if (pathname === "/api/agents/status") {
    const agentStatus = genAiService.getAgentStatus();
    return new Response(JSON.stringify(agentStatus), { headers });
  }

  if (pathname === "/api/agents/tasks" && request.method === "POST") {
    try {
      const taskData = await request.json();
      const result = await genAiService.createTask(taskData);
      return new Response(JSON.stringify(result), { headers });
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers }
      );
    }
  }

  if (pathname === "/api/agents/tasks" && request.method === "GET") {
    const tasks = genAiService.getAllTasks();
    return new Response(JSON.stringify({ tasks }), { headers });
  }

  if (pathname === "/api/agents/workflow" && request.method === "POST") {
    try {
      const workflowData = await request.json();
      const result = await genAiService.processWorkflow(workflowData);
      return new Response(JSON.stringify(result), { headers });
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers }
      );
    }
  }

  // GenAI Proxy API endpoints
  if (pathname === "/api/genai/execute" && request.method === "POST") {
    try {
      const scriptData = await request.json();
      const result = await genAiService.executeGenAIScript(scriptData);
      return new Response(JSON.stringify(result), { headers });
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers }
      );
    }
  }

  if (pathname === "/api/genai/models") {
    const models = genAiService.getAvailableModels();
    return new Response(JSON.stringify(models), { headers });
  }

  return new Response(
    JSON.stringify({ error: "API endpoint not found" }),
    { status: 404, headers }
  );
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
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
    <style>
      /* Custom styles for enhanced visual appeal */
      .glass-effect {
        backdrop-filter: blur(16px);
        background: rgba(255, 255, 255, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
      
      .gradient-bg {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
      
      .hover-lift {
        transition: all 0.3s ease;
      }
      
      .hover-lift:hover {
        transform: translateY(-4px);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      }
      
      .animate-fade-in {
        animation: fadeIn 0.6s ease-in-out;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .pulse-subtle {
        animation: pulse-subtle 2s infinite;
      }
      
      @keyframes pulse-subtle {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.8; }
      }
    </style>
</head>
<body class="bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
    <div class="min-h-screen">
        <nav class="glass-effect border-b border-white/20">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <div class="flex items-center">
                        <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                            <i data-lucide="cloud" class="w-5 h-5 text-white"></i>
                        </div>
                        <h1 class="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Cloud-IQ</h1>
                    </div>
                    <div class="flex items-center space-x-4">
                        <a href="/" class="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                            <i data-lucide="home" class="w-4 h-4 inline mr-1"></i>Dashboard
                        </a>
                        <a href="/orders" class="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                            <i data-lucide="shopping-cart" class="w-4 h-4 inline mr-1"></i>Orders
                        </a>
                        <a href="/sync" class="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                            <i data-lucide="refresh-cw" class="w-4 h-4 inline mr-1"></i>Sync
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <main class="max-w-7xl mx-auto py-10 sm:px-6 lg:px-8">
            <div id="content" class="animate-fade-in">
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
                        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
                            <div class="bg-white/70 backdrop-blur-sm overflow-hidden shadow-lg rounded-2xl border border-white/20 hover-lift">
                                <div class="p-6">
                                    <div class="flex items-center">
                                        <div class="flex-shrink-0">
                                            <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                                                <i data-lucide="database" class="w-6 h-6 text-white"></i>
                                            </div>
                                        </div>
                                        <div class="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt class="text-sm font-semibold text-gray-600 uppercase tracking-wide">Sync Records</dt>
                                                <dd class="text-2xl font-bold text-gray-900">\${stats.syncRecords || 0}</dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                                <div class="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-3">
                                    <div class="text-sm text-blue-700 font-medium">
                                        <i data-lucide="trending-up" class="w-4 h-4 inline mr-1"></i>
                                        Active syncs
                                    </div>
                                </div>
                            </div>
                            
                            <div class="bg-white/70 backdrop-blur-sm overflow-hidden shadow-lg rounded-2xl border border-white/20 hover-lift">
                                <div class="p-6">
                                    <div class="flex items-center">
                                        <div class="flex-shrink-0">
                                            <div class="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                                                <i data-lucide="activity" class="w-6 h-6 text-white"></i>
                                            </div>
                                        </div>
                                        <div class="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt class="text-sm font-semibold text-gray-600 uppercase tracking-wide">Usage Records</dt>
                                                <dd class="text-2xl font-bold text-gray-900">\${stats.usageRecords || 0}</dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                                <div class="bg-gradient-to-r from-green-50 to-green-100 px-6 py-3">
                                    <div class="text-sm text-green-700 font-medium">
                                        <i data-lucide="bar-chart-3" class="w-4 h-4 inline mr-1"></i>
                                        Tracked usage
                                    </div>
                                </div>
                            </div>
                            
                            <div class="bg-white/70 backdrop-blur-sm overflow-hidden shadow-lg rounded-2xl border border-white/20 hover-lift">
                                <div class="p-6">
                                    <div class="flex items-center">
                                        <div class="flex-shrink-0">
                                            <div class="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                                <i data-lucide="shopping-cart" class="w-6 h-6 text-white"></i>
                                            </div>
                                        </div>
                                        <div class="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt class="text-sm font-semibold text-gray-600 uppercase tracking-wide">Orders</dt>
                                                <dd class="text-2xl font-bold text-gray-900">\${stats.orderRecords || 0}</dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                                <div class="bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-3">
                                    <div class="text-sm text-purple-700 font-medium">
                                        <i data-lucide="package" class="w-4 h-4 inline mr-1"></i>
                                        Total orders
                                    </div>
                                </div>
                            </div>
                            
                            <div class="bg-white/70 backdrop-blur-sm overflow-hidden shadow-lg rounded-2xl border border-white/20 hover-lift">
                                <div class="p-6">
                                    <div class="flex items-center">
                                        <div class="flex-shrink-0">
                                            <div class="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                                                <i data-lucide="clock" class="w-6 h-6 text-white"></i>
                                            </div>
                                        </div>
                                        <div class="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt class="text-sm font-semibold text-gray-600 uppercase tracking-wide">Pending</dt>
                                                <dd class="text-2xl font-bold text-gray-900">\${stats.pendingSyncs || 0}</dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                                <div class="bg-gradient-to-r from-orange-50 to-orange-100 px-6 py-3">
                                    <div class="text-sm text-orange-700 font-medium">
                                        <i data-lucide="loader" class="w-4 h-4 inline mr-1"></i>
                                        Awaiting sync
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
                            <div class="bg-white/70 backdrop-blur-sm shadow-lg rounded-2xl p-8 border border-white/20">
                                <div class="flex items-center mb-6">
                                    <div class="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-4">
                                        <i data-lucide="users" class="w-6 h-6 text-white"></i>
                                    </div>
                                    <h3 class="text-xl font-bold text-gray-900">Multi-Agent Crew Status</h3>
                                </div>
                                <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
                                    <div class="text-center bg-blue-50/50 rounded-xl p-4">
                                        <div class="text-3xl font-bold text-blue-600 mb-2">\${agentStatus.agents.total}</div>
                                        <div class="text-sm font-semibold text-gray-600">Active Agents</div>
                                    </div>
                                    <div class="text-center bg-green-50/50 rounded-xl p-4">
                                        <div class="text-3xl font-bold text-green-600 mb-2">\${agentStatus.tasks.total || 0}</div>
                                        <div class="text-sm font-semibold text-gray-600">Total Tasks</div>
                                    </div>
                                    <div class="text-center bg-purple-50/50 rounded-xl p-4">
                                        <div class="text-3xl font-bold text-purple-600 mb-2">\${agentStatus.mcpServers.active}</div>
                                        <div class="text-sm font-semibold text-gray-600">MCP Servers</div>
                                    </div>
                                </div>
                                <div class="mt-6 text-center">
                                    <button onclick="createSampleTask()" class="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 font-medium shadow-lg hover-lift">
                                        <i data-lucide="plus" class="w-4 h-4 mr-2"></i>
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
                            <div class="bg-gray-100/80 backdrop-blur-sm shadow-lg rounded-2xl p-8 border border-gray-200">
                                <div class="flex items-center mb-4">
                                    <div class="w-10 h-10 bg-gradient-to-r from-gray-400 to-gray-500 rounded-xl flex items-center justify-center mr-4">
                                        <i data-lucide="settings" class="w-6 h-6 text-white"></i>
                                    </div>
                                    <h3 class="text-xl font-bold text-gray-700">Multi-Agent Crew</h3>
                                </div>
                                <p class="text-gray-600 leading-relaxed">Multi-agent crew is disabled. Set ENABLE_MULTI_AGENT=true to enable.</p>
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
    
    <script>
        // Initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // Re-initialize icons after dynamic content updates
        const originalInnerHTML = Element.prototype.innerHTML;
        Element.prototype.innerHTML = function(value) {
            const result = originalInnerHTML.call(this, value);
            if (typeof lucide !== 'undefined') {
                setTimeout(() => lucide.createIcons(), 100);
            }
            return result;
        };
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
            <div class="glass-effect rounded-2xl p-8 border border-white/20">
                <div class="flex items-center space-x-3 mb-6">
                    <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <i data-lucide="layout-dashboard" class="w-7 h-7 text-white"></i>
                    </div>
                    <div>
                        <h1 class="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Cloud-IQ Dashboard</h1>
                        <p class="text-gray-600 text-lg mt-1">
                            🚀 Crayon Cloud-IQ integration with HostBill for CSP billing management
                        </p>
                    </div>
                </div>
                
                <div id="sync-stats" class="mb-10">
                    <div class="animate-pulse flex space-x-4">
                        <div class="rounded-2xl bg-slate-200 h-32 w-full"></div>
                        <div class="rounded-2xl bg-slate-200 h-32 w-full"></div>
                        <div class="rounded-2xl bg-slate-200 h-32 w-full"></div>
                        <div class="rounded-2xl bg-slate-200 h-32 w-full"></div>
                    </div>
                </div>

                <div id="agent-status" class="mb-10">
                    <div class="animate-pulse">
                        <div class="rounded-2xl bg-slate-200 h-24 w-full"></div>
                    </div>
                </div>

                <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <div class="bg-white/70 backdrop-blur-sm border-2 border-blue-200 rounded-2xl p-6 hover:border-blue-300 transition-all duration-300 hover-lift">
                        <div class="flex items-center mb-4">
                            <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-3">
                                <i data-lucide="plus-circle" class="w-5 h-5 text-white"></i>
                            </div>
                            <h3 class="text-lg font-bold text-blue-900">Create Order</h3>
                        </div>
                        <p class="text-blue-700 mb-4 leading-relaxed">Order new CSP services for customers</p>
                        <a href="/orders" class="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium">
                            <span>Go to Orders</span>
                            <i data-lucide="arrow-right" class="w-4 h-4 ml-1"></i>
                        </a>
                    </div>
                    
                    <div class="bg-white/70 backdrop-blur-sm border-2 border-green-200 rounded-2xl p-6 hover:border-green-300 transition-all duration-300 hover-lift">
                        <div class="flex items-center mb-4">
                            <div class="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mr-3">
                                <i data-lucide="activity" class="w-5 h-5 text-white"></i>
                            </div>
                            <h3 class="text-lg font-bold text-green-900">Sync Status</h3>
                        </div>
                        <p class="text-green-700 mb-4 leading-relaxed">Monitor synchronization between systems</p>
                        <a href="/sync" class="inline-flex items-center text-green-600 hover:text-green-800 font-medium">
                            <span>View Sync</span>
                            <i data-lucide="arrow-right" class="w-4 h-4 ml-1"></i>
                        </a>
                    </div>
                    
                    <div class="bg-white/70 backdrop-blur-sm border-2 border-orange-200 rounded-2xl p-6 hover:border-orange-300 transition-all duration-300 hover-lift">
                        <div class="flex items-center mb-4">
                            <div class="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mr-3">
                                <i data-lucide="play-circle" class="w-5 h-5 text-white"></i>
                            </div>
                            <h3 class="text-lg font-bold text-orange-900">Manual Sync</h3>
                        </div>
                        <p class="text-orange-700 mb-4 leading-relaxed">Trigger immediate synchronization</p>
                        <button onclick="triggerSync()" class="inline-flex items-center text-orange-600 hover:text-orange-800 font-medium">
                            <span>Run Sync</span>
                            <i data-lucide="arrow-right" class="w-4 h-4 ml-1"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
      `;

    case "/orders":
      return `
        <div class="px-4 py-6 sm:px-0">
            <div class="glass-effect rounded-2xl p-8 border border-white/20">
                <div class="flex items-center space-x-3 mb-6">
                    <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <i data-lucide="shopping-cart" class="w-7 h-7 text-white"></i>
                    </div>
                    <div>
                        <h1 class="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Order Management</h1>
                        <p class="text-gray-600 text-lg mt-1">
                            🛒 Create and manage CSP service orders
                        </p>
                    </div>
                </div>
                <div class="bg-blue-50/80 backdrop-blur-sm border-2 border-blue-200 rounded-2xl p-8">
                    <div class="flex items-center mb-4">
                        <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4">
                            <i data-lucide="info" class="w-5 h-5 text-white"></i>
                        </div>
                        <h3 class="text-xl font-bold text-blue-900">Order Creation</h3>
                    </div>
                    <p class="text-blue-700 leading-relaxed">
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
            <div class="glass-effect rounded-2xl p-8 border border-white/20">
                <div class="flex items-center space-x-3 mb-6">
                    <div class="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
                        <i data-lucide="refresh-cw" class="w-7 h-7 text-white"></i>
                    </div>
                    <div>
                        <h1 class="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Sync Monitoring</h1>
                        <p class="text-gray-600 text-lg mt-1">
                            🔄 Monitor and control synchronization between Crayon Cloud-IQ and HostBill
                        </p>
                    </div>
                </div>
                
                <div class="mb-8">
                    <button 
                        onclick="triggerSync()" 
                        class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 font-semibold shadow-lg hover-lift"
                    >
                        <i data-lucide="play-circle" class="w-5 h-5 mr-2"></i>
                        Run Manual Sync
                    </button>
                </div>

                <div class="bg-yellow-50/80 backdrop-blur-sm border-2 border-yellow-200 rounded-2xl p-8">
                    <div class="flex items-center mb-4">
                        <div class="w-10 h-10 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center mr-4">
                            <i data-lucide="settings" class="w-5 h-5 text-white"></i>
                        </div>
                        <h3 class="text-xl font-bold text-yellow-900">Sync Service Status</h3>
                    </div>
                    <p class="text-yellow-700 leading-relaxed">
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
            <div class="glass-effect rounded-2xl p-12 border border-white/20 text-center">
                <div class="w-20 h-20 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i data-lucide="search-x" class="w-10 h-10 text-white"></i>
                </div>
                <h1 class="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4">404 - Page Not Found</h1>
                <p class="text-gray-600 text-lg mb-8">The page you're looking for doesn't exist.</p>
                <a href="/" class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 font-semibold shadow-lg hover-lift">
                    <i data-lucide="home" class="w-4 h-4 mr-2"></i>
                    Go back to dashboard
                </a>
            </div>
        </div>
      `;
  }
}

// Graceful shutdown handler
function shutdown(signal) {
  logger.info(`🛑 Received ${signal}, shutting down Cloud-IQ application gracefully...`);
  
  // Stop accepting new connections
  server.close(() => {
    logger.info("✅ HTTP server closed");
  });
  
  // Cleanup services
  if (syncService) {
    syncService.cleanup();
    logger.info("✅ Sync service cleaned up");
  }
  
  if (genAiService) {
    genAiService.cleanup();
    logger.info("✅ GenAI service cleaned up");
  }
  
  if (security) {
    security.destroy();
    logger.info("✅ Security middleware cleaned up");
  }
  
  // Force exit after timeout
  setTimeout(() => {
    logger.error("❌ Forced shutdown due to timeout");
    process.exit(1);
  }, 10000);
}

// Handle shutdown signals
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// Start the Node.js HTTP server
const server = createServer(async (req, res) => {
  try {
    const response = await handleNodeRequest(req);
    
    // Set headers
    Object.entries(response.headers || {}).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    
    res.writeHead(response.status || 200);
    
    if (response.body) {
      res.end(response.body);
    } else {
      res.end();
    }
  } catch (error) {
    logger.error("Server error", {
      error: error.message,
      stack: error.stack
    });
    
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: "Internal server error" }));
  }
});

// Handle server errors
server.on('error', (error) => {
  logger.error("Server error", {
    error: error.message,
    code: error.code
  });
  
  if (error.code === 'EADDRINUSE') {
    logger.error(`Port ${config.server.port} is already in use`);
    process.exit(1);
  }
});

server.listen(config.server.port, () => {
  logger.info(`✅ Cloud-IQ server running on http://localhost:${config.server.port}`, {
    nodeEnv: config.server.nodeEnv,
    port: config.server.port
  });
});

// Convert Node.js request to Web API compatible format
async function handleNodeRequest(req) {
  const url = `http://localhost:${config.server.port}${req.url}`;
  
  // Create a Web API compatible request object
  const request = {
    url,
    method: req.method,
    headers: req.headers,
  };

  // Get request body for POST requests
  if (req.method === 'POST' || req.method === 'PUT') {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks).toString();
    request.body = body;
    request.json = () => Promise.resolve(body ? JSON.parse(body) : {});
  } else {
    request.json = () => Promise.resolve({});
  }

  // Call the main handler
  const response = await handleRequest(request);
  
  // Convert Response to Node.js format
  let body = "";
  if (response.body) {
    body = typeof response.body === 'string' ? response.body : JSON.stringify(response.body);
  }
  
  return {
    status: response.status || 200,
    headers: Object.fromEntries(response.headers || []),
    body
  };
}