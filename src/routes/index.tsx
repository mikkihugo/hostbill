/**
 * Main dashboard route for Cloud-IQ integration
 */

import { type Handlers, type PageProps } from "$fresh/server.ts";
import { CloudIQSyncService } from "../lib/sync.ts";

interface DashboardData {
  stats: Record<string, any>;
  recentSyncs: any[];
  error?: string;
}

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
    <div class="min-h-screen bg-gray-50">
      <div class="bg-white shadow">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="py-6 md:flex md:items-center md:justify-between">
            <div class="flex-1 min-w-0">
              <h1 class="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Cloud-IQ Dashboard
              </h1>
              <p class="mt-1 text-sm text-gray-500">
                Crayon Cloud-IQ integration with HostBill for CSP billing management
              </p>
            </div>
            <div class="mt-4 flex md:mt-0 md:ml-4">
              <a
                href="/orders"
                class="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create Order
              </a>
              <a
                href="/sync"
                class="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sync Status
              </a>
            </div>
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
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
                    <dt class="text-sm font-medium text-gray-500 truncate">
                      Sync Records
                    </dt>
                    <dd class="text-lg font-medium text-gray-900">
                      {stats.syncRecords || 0}
                    </dd>
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
                    <dt class="text-sm font-medium text-gray-500 truncate">
                      Usage Records
                    </dt>
                    <dd class="text-lg font-medium text-gray-900">
                      {stats.usageRecords || 0}
                    </dd>
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
                    <dt class="text-sm font-medium text-gray-500 truncate">
                      Orders
                    </dt>
                    <dd class="text-lg font-medium text-gray-900">
                      {stats.orderRecords || 0}
                    </dd>
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
                    <dt class="text-sm font-medium text-gray-500 truncate">
                      Pending Syncs
                    </dt>
                    <dd class="text-lg font-medium text-gray-900">
                      {stats.pendingSyncs || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sync Status Overview */}
        {stats.syncStatusCounts && (
          <div class="bg-white shadow rounded-lg mb-8">
            <div class="px-6 py-4 border-b border-gray-200">
              <h2 class="text-lg font-semibold text-gray-900">Sync Status Overview</h2>
            </div>
            <div class="px-6 py-4">
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div class="text-center">
                  <div class="text-2xl font-bold text-green-600">
                    {stats.syncStatusCounts.synced || 0}
                  </div>
                  <div class="text-sm text-gray-500">Synced</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-orange-600">
                    {stats.syncStatusCounts.pending || 0}
                  </div>
                  <div class="text-sm text-gray-500">Pending</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-red-600">
                    {stats.syncStatusCounts.error || 0}
                  </div>
                  <div class="text-sm text-gray-500">Errors</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Sync Records */}
        <div class="bg-white shadow rounded-lg">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Recent Sync Records</h2>
            <p class="mt-1 text-sm text-gray-600">
              Latest synchronization activity between Crayon and HostBill
            </p>
          </div>
          <div class="px-6 py-4">
            {recentSyncs.length > 0 ? (
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Sync
                      </th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    {recentSyncs.map((sync, index) => (
                      <tr key={index}>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {sync.product_name}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <span class={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            sync.sync_status === 'synced' 
                              ? 'bg-green-100 text-green-800'
                              : sync.sync_status === 'pending'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {sync.sync_status}
                          </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {sync.quantity}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
              <div class="text-center py-8">
                <p class="text-gray-500">No sync records found</p>
                <p class="text-sm text-gray-400 mt-1">
                  Start by creating an order or running a manual sync
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div class="mt-8 bg-white shadow rounded-lg">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div class="px-6 py-4">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <a
                href="/orders"
                class="block p-6 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <h3 class="text-lg font-medium text-blue-900">Create Order</h3>
                <p class="mt-2 text-sm text-blue-700">
                  Order new CSP services for customers
                </p>
              </a>
              <a
                href="/sync"
                class="block p-6 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
              >
                <h3 class="text-lg font-medium text-green-900">Sync Status</h3>
                <p class="mt-2 text-sm text-green-700">
                  Monitor synchronization between systems
                </p>
              </a>
              <a
                href="/api/sync/manual"
                class="block p-6 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
              >
                <h3 class="text-lg font-medium text-orange-900">Manual Sync</h3>
                <p class="mt-2 text-sm text-orange-700">
                  Trigger immediate synchronization
                </p>
              </a>
              <div class="block p-6 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 class="text-lg font-medium text-gray-900">Last Sync</h3>
                <p class="mt-2 text-sm text-gray-700">
                  {stats.lastSync && stats.lastSync !== 'Never' 
                    ? new Date(stats.lastSync).toLocaleString()
                    : 'Never'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}