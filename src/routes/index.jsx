/**
 * Main dashboard route for Cloud-IQ integration
 */

import { type Handlers, type PageProps } from "$fresh/server.ts";
import { CloudIQSyncService } from "../lib/sync.ts";


// Configuration from environment variables
const config = {
  crayonConfig: {
    clientId: Deno.env.get("CRAYON_CLIENT_ID") || "",
    clientSecret: Deno.env.get("CRAYON_CLIENT_SECRET") || "",
    tenantId: Deno.env.get("CRAYON_TENANT_ID") || "",
  },
  hostbillConfig: {
    apiUrl: Deno.env.get("HOSTBILL_URL") || "",
    apiId: Deno.env.get("HOSTBILL_API_ID") || "",
    apiKey: Deno.env.get("HOSTBILL_API_KEY") || "",
  },
};

export const handler: Handlers<DashboardData> = {
  async GET(req, ctx) {
    try {
      const syncService = new CloudIQSyncService(config);
      
      // Get sync statistics
      const stats = syncService.getSyncStats();
      
      // Get recent sync records (last 10)
      const allSyncs = syncService.db.getSyncRecords();
      const recentSyncs = allSyncs.slice(0, 10);

      syncService.cleanup();

      return ctx.render({
        stats,
        recentSyncs,
      });

    } catch (error) {
      console.error("Failed to load dashboard:", error);
      return ctx.render({
        stats: {},
        recentSyncs: [],
        error: `Failed to load dashboard: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  },
};

export default function Dashboard({ data }: PageProps<DashboardData>) {
  const { stats, recentSyncs, error } = data;

  return (
    <div class="min-h-screen">
      <div class="glass-effect border-b border-white/20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="py-8 md:flex md:items-center md:justify-between">
            <div class="flex-1 min-w-0 animate-fade-in">
              <div class="flex items-center space-x-3 mb-2">
                <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <i data-lucide="cloud" class="w-6 h-6 text-white"></i>
                </div>
                <h1 class="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent sm:text-4xl">
                  Cloud-IQ Dashboard
                </h1>
              </div>
              <p class="mt-2 text-gray-600 text-lg">
                🚀 Crayon Cloud-IQ integration with HostBill for CSP billing management
              </p>
            </div>
            <div class="mt-6 flex space-x-3 md:mt-0 md:ml-4 animate-fade-in">
              <a
                href="/orders"
                class="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 hover-lift"
              >
                <i data-lucide="plus-circle" class="w-4 h-4 mr-2"></i>
                Create Order
              </a>
              <a
                href="/sync"
                class="inline-flex items-center px-6 py-3 border border-gray-200 rounded-xl shadow-sm text-sm font-semibold text-gray-700 bg-white/80 hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 hover-lift"
              >
                <i data-lucide="refresh-cw" class="w-4 h-4 mr-2"></i>
                Sync Status
              </a>
            </div>
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {error && (
          <div class="mb-8 p-4 bg-red-50 border border-red-200 rounded-md">
            <div class="flex">
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">Error</h3>
                <p class="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10 animate-fade-in">
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
                    <dt class="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                      Sync Records
                    </dt>
                    <dd class="text-2xl font-bold text-gray-900">
                      {stats.syncRecords || 0}
                    </dd>
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
                    <dt class="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                      Usage Records
                    </dt>
                    <dd class="text-2xl font-bold text-gray-900">
                      {stats.usageRecords || 0}
                    </dd>
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
                    <dt class="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                      Orders
                    </dt>
                    <dd class="text-2xl font-bold text-gray-900">
                      {stats.orderRecords || 0}
                    </dd>
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
                    <dt class="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                      Pending Syncs
                    </dt>
                    <dd class="text-2xl font-bold text-gray-900">
                      {stats.pendingSyncs || 0}
                    </dd>
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

        {/* Sync Status Overview */}
        {stats.syncStatusCounts && (
          <div class="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl mb-10 border border-white/20 animate-fade-in">
            <div class="px-8 py-6 border-b border-gray-100">
              <div class="flex items-center">
                <div class="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <i data-lucide="pie-chart" class="w-5 h-5 text-white"></i>
                </div>
                <h2 class="text-xl font-bold text-gray-900">Sync Status Overview</h2>
              </div>
            </div>
            <div class="px-8 py-8">
              <div class="grid grid-cols-1 gap-8 sm:grid-cols-3">
                <div class="text-center group">
                  <div class="w-20 h-20 mx-auto bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mb-4 shadow-lg group-hover:scale-105 transition-transform">
                    <i data-lucide="check-circle" class="w-10 h-10 text-white"></i>
                  </div>
                  <div class="text-3xl font-bold text-green-600 mb-2">
                    {stats.syncStatusCounts.synced || 0}
                  </div>
                  <div class="text-sm font-semibold text-gray-600 uppercase tracking-wide">Synced Successfully</div>
                  <div class="text-xs text-gray-500 mt-1">All systems connected</div>
                </div>
                <div class="text-center group">
                  <div class="w-20 h-20 mx-auto bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mb-4 shadow-lg group-hover:scale-105 transition-transform">
                    <i data-lucide="clock" class="w-10 h-10 text-white"></i>
                  </div>
                  <div class="text-3xl font-bold text-orange-600 mb-2">
                    {stats.syncStatusCounts.pending || 0}
                  </div>
                  <div class="text-sm font-semibold text-gray-600 uppercase tracking-wide">Pending Sync</div>
                  <div class="text-xs text-gray-500 mt-1">Awaiting processing</div>
                </div>
                <div class="text-center group">
                  <div class="w-20 h-20 mx-auto bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mb-4 shadow-lg group-hover:scale-105 transition-transform">
                    <i data-lucide="alert-circle" class="w-10 h-10 text-white"></i>
                  </div>
                  <div class="text-3xl font-bold text-red-600 mb-2">
                    {stats.syncStatusCounts.error || 0}
                  </div>
                  <div class="text-sm font-semibold text-gray-600 uppercase tracking-wide">Sync Errors</div>
                  <div class="text-xs text-gray-500 mt-1">Requires attention</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Sync Records */}
        <div class="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/20 animate-fade-in">
          <div class="px-8 py-6 border-b border-gray-100">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center mr-3">
                  <i data-lucide="list" class="w-5 h-5 text-white"></i>
                </div>
                <div>
                  <h2 class="text-xl font-bold text-gray-900">Recent Sync Records</h2>
                  <p class="text-sm text-gray-600 mt-1">
                    Latest synchronization activity between Crayon and HostBill
                  </p>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <div class="w-3 h-3 bg-green-400 rounded-full pulse-subtle"></div>
                <span class="text-sm text-gray-500 font-medium">Live Status</span>
              </div>
            </div>
          </div>
          <div class="px-8 py-6">
            {recentSyncs.length > 0 ? (
              <div class="overflow-x-auto">
                <table class="min-w-full">
                  <thead>
                    <tr class="border-b border-gray-200">
                      <th class="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        <i data-lucide="package" class="w-4 h-4 inline mr-1"></i>
                        Product
                      </th>
                      <th class="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        <i data-lucide="activity" class="w-4 h-4 inline mr-1"></i>
                        Status
                      </th>
                      <th class="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        <i data-lucide="hash" class="w-4 h-4 inline mr-1"></i>
                        Quantity
                      </th>
                      <th class="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        <i data-lucide="dollar-sign" class="w-4 h-4 inline mr-1"></i>
                        Price
                      </th>
                      <th class="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        <i data-lucide="clock" class="w-4 h-4 inline mr-1"></i>
                        Last Sync
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100">
                    {recentSyncs.map((sync, index) => (
                      <tr key={index} class="hover:bg-blue-50/50 transition-colors">
                        <td class="px-6 py-4 whitespace-nowrap">
                          <div class="flex items-center">
                            <div class="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-500 rounded-lg flex items-center justify-center mr-3">
                              <i data-lucide="box" class="w-4 h-4 text-white"></i>
                            </div>
                            <div class="text-sm font-semibold text-gray-900">{sync.product_name}</div>
                          </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <span class={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-full border ${
                            sync.sync_status === 'synced' 
                              ? 'bg-green-100 text-green-800 border-green-200'
                              : sync.sync_status === 'pending'
                              ? 'bg-orange-100 text-orange-800 border-orange-200'
                              : 'bg-red-100 text-red-800 border-red-200'
                          }`}>
                            <i data-lucide={
                              sync.sync_status === 'synced' ? 'check-circle' :
                              sync.sync_status === 'pending' ? 'clock' : 'x-circle'
                            } class="w-3 h-3 mr-1"></i>
                            {sync.sync_status}
                          </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600">
                          {sync.quantity}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          ${sync.unit_price}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(sync.last_sync).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div class="text-center py-12">
                <div class="w-16 h-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i data-lucide="database" class="w-8 h-8 text-gray-500"></i>
                </div>
                <p class="text-gray-600 text-lg font-medium">No sync records found</p>
                <p class="text-sm text-gray-500 mt-2">
                  Start by creating an order or running a manual sync
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div class="mt-10 bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/20 animate-fade-in">
          <div class="px-8 py-6 border-b border-gray-100">
            <div class="flex items-center">
              <div class="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mr-3">
                <i data-lucide="zap" class="w-5 h-5 text-white"></i>
              </div>
              <h2 class="text-xl font-bold text-gray-900">Quick Actions</h2>
            </div>
          </div>
          <div class="px-8 py-8">
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <a
                href="/orders"
                class="group block p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl hover:from-blue-100 hover:to-blue-200 hover:border-blue-300 transition-all duration-300 hover-lift"
              >
                <div class="flex items-center mb-4">
                  <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                    <i data-lucide="plus-circle" class="w-5 h-5 text-white"></i>
                  </div>
                  <h3 class="text-lg font-bold text-blue-900">Create Order</h3>
                </div>
                <p class="text-sm text-blue-700 leading-relaxed">
                  Order new CSP services for customers with streamlined workflow
                </p>
                <div class="mt-4 flex items-center text-blue-600 font-medium">
                  <span class="text-sm">Get Started</span>
                  <i data-lucide="arrow-right" class="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"></i>
                </div>
              </a>
              <a
                href="/sync"
                class="group block p-6 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-2xl hover:from-green-100 hover:to-green-200 hover:border-green-300 transition-all duration-300 hover-lift"
              >
                <div class="flex items-center mb-4">
                  <div class="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                    <i data-lucide="refresh-cw" class="w-5 h-5 text-white"></i>
                  </div>
                  <h3 class="text-lg font-bold text-green-900">Sync Status</h3>
                </div>
                <p class="text-sm text-green-700 leading-relaxed">
                  Monitor synchronization between systems in real-time
                </p>
                <div class="mt-4 flex items-center text-green-600 font-medium">
                  <span class="text-sm">View Details</span>
                  <i data-lucide="arrow-right" class="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"></i>
                </div>
              </a>
              <a
                href="/api/sync/manual"
                class="group block p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-2xl hover:from-orange-100 hover:to-orange-200 hover:border-orange-300 transition-all duration-300 hover-lift"
              >
                <div class="flex items-center mb-4">
                  <div class="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                    <i data-lucide="play-circle" class="w-5 h-5 text-white"></i>
                  </div>
                  <h3 class="text-lg font-bold text-orange-900">Manual Sync</h3>
                </div>
                <p class="text-sm text-orange-700 leading-relaxed">
                  Trigger immediate synchronization across all systems
                </p>
                <div class="mt-4 flex items-center text-orange-600 font-medium">
                  <span class="text-sm">Run Now</span>
                  <i data-lucide="arrow-right" class="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"></i>
                </div>
              </a>
              <div class="block p-6 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl">
                <div class="flex items-center mb-4">
                  <div class="w-10 h-10 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl flex items-center justify-center mr-3">
                    <i data-lucide="clock" class="w-5 h-5 text-white"></i>
                  </div>
                  <h3 class="text-lg font-bold text-gray-900">Last Sync</h3>
                </div>
                <p class="text-sm text-gray-700 leading-relaxed mb-4">
                  {stats.lastSync && stats.lastSync !== 'Never' 
                    ? new Date(stats.lastSync).toLocaleString()
                    : 'No sync performed yet'
                  }
                </p>
                <div class="flex items-center text-gray-600 font-medium">
                  <div class="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                  <span class="text-sm">System Status</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <script>
        {/* Initialize Lucide icons */}
        if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }
      </script>
    </div>
  );
}