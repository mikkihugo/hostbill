/**
 * Sync monitoring page - displays detailed sync status and controls
 */

import { type Handlers, type PageProps } from "$fresh/server.ts";
import { CloudIQSyncService } from "../../lib/sync.ts";


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

export const handler: Handlers<SyncPageData> = {
  async GET(req, ctx) {
    try {
      const syncService = new CloudIQSyncService(config);
      
      // Get all sync data
      const syncRecords = syncService.db.getSyncRecords();
      const usageRecords = syncService.db.getUsageRecords();
      const orderRecords = syncService.db.getOrderRecords();
      const stats = syncService.getSyncStats();

      syncService.cleanup();

      return ctx.render({
        syncRecords,
        usageRecords: usageRecords.slice(0, 50), // Limit for performance
        orderRecords,
        stats,
      });

    } catch (error) {
      console.error("Failed to load sync page:", error);
      return ctx.render({
        syncRecords: [],
        usageRecords: [],
        orderRecords: [],
        stats: {},
        error: `Failed to load sync page: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  },

  async POST(req, ctx) {
    try {
      const formData = await req.formData();
      const action = formData.get("action") as string;

      if (action === "manual_sync") {
        const syncService = new CloudIQSyncService(config);
        const result = await syncService.performFullSync();
        syncService.cleanup();

        // Reload page with result
        const syncServiceReload = new CloudIQSyncService(config);
        const syncRecords = syncServiceReload.db.getSyncRecords();
        const usageRecords = syncServiceReload.db.getUsageRecords();
        const orderRecords = syncServiceReload.db.getOrderRecords();
        const stats = syncServiceReload.getSyncStats();
        syncServiceReload.cleanup();

        return ctx.render({
          syncRecords,
          usageRecords: usageRecords.slice(0, 50),
          orderRecords,
          stats,
          lastSyncResult: `${result.message} (${result.syncedCount} synced, ${result.errorCount} errors)`,
        });
      }

      throw new Error("Unknown action");

    } catch (error) {
      console.error("Sync action failed:", error);
      
      // Reload page with error
      const syncService = new CloudIQSyncService(config);
      const syncRecords = syncService.db.getSyncRecords();
      const usageRecords = syncService.db.getUsageRecords();
      const orderRecords = syncService.db.getOrderRecords();
      const stats = syncService.getSyncStats();
      syncService.cleanup();

      return ctx.render({
        syncRecords,
        usageRecords: usageRecords.slice(0, 50),
        orderRecords,
        stats,
        error: `Sync failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  },
};

export default function SyncPage({ data }: PageProps<SyncPageData>) {
  const { syncRecords, usageRecords, orderRecords, stats, error, lastSyncResult } = data;

  return (
    <div class="min-h-screen">
      <div class="glass-effect border-b border-white/20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="py-8 md:flex md:items-center md:justify-between">
            <div class="flex-1 min-w-0 animate-fade-in">
              <div class="flex items-center space-x-3 mb-2">
                <div class="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <i data-lucide="refresh-cw" class="w-6 h-6 text-white"></i>
                </div>
                <h1 class="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent sm:text-4xl">
                  Sync Monitoring
                </h1>
              </div>
              <p class="mt-2 text-gray-600 text-lg">
                🔄 Monitor and control synchronization between Crayon Cloud-IQ and HostBill
              </p>
            </div>
            <div class="mt-6 flex space-x-3 md:mt-0 md:ml-4 animate-fade-in">
              <a
                href="/"
                class="inline-flex items-center px-6 py-3 border border-gray-200 rounded-xl shadow-sm text-sm font-semibold text-gray-700 bg-white/80 hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 hover-lift"
              >
                <i data-lucide="home" class="w-4 h-4 mr-2"></i>
                Dashboard
              </a>
              <form method="POST" class="inline">
                <input type="hidden" name="action" value="manual_sync" />
                <button
                  type="submit"
                  class="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 hover-lift"
                >
                  <i data-lucide="play-circle" class="w-4 h-4 mr-2"></i>
                  Manual Sync
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {error && (
          <div class="mb-8 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg animate-fade-in">
            <div class="flex">
              <div class="flex-shrink-0">
                <i data-lucide="alert-circle" class="w-5 h-5 text-red-400"></i>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-semibold text-red-800">Error</h3>
                <p class="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {lastSyncResult && (
          <div class="mb-8 p-4 bg-green-50 border-l-4 border-green-400 rounded-lg animate-fade-in">
            <div class="flex">
              <div class="flex-shrink-0">
                <i data-lucide="check-circle" class="w-5 h-5 text-green-400"></i>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-semibold text-green-800">Sync Completed</h3>
                <p class="mt-1 text-sm text-green-700">{lastSyncResult}</p>
              </div>
            </div>
          </div>
        )}

        {/* Summary Statistics */}
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
                    <dt class="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Syncs</dt>
                    <dd class="text-2xl font-bold text-gray-900">{stats.syncRecords || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div class="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-3">
              <div class="text-sm text-blue-700 font-medium">
                <i data-lucide="trending-up" class="w-4 h-4 inline mr-1"></i>
                All records
              </div>
            </div>
          </div>

          <div class="bg-white/70 backdrop-blur-sm overflow-hidden shadow-lg rounded-2xl border border-white/20 hover-lift">
            <div class="p-6">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                    <i data-lucide="check-circle" class="w-6 h-6 text-white"></i>
                  </div>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-semibold text-gray-600 uppercase tracking-wide">Synced</dt>
                    <dd class="text-2xl font-bold text-gray-900">
                      {stats.syncStatusCounts?.synced || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div class="bg-gradient-to-r from-green-50 to-green-100 px-6 py-3">
              <div class="text-sm text-green-700 font-medium">
                <i data-lucide="check" class="w-4 h-4 inline mr-1"></i>
                Completed
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
                    <dd class="text-2xl font-bold text-gray-900">
                      {stats.syncStatusCounts?.pending || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div class="bg-gradient-to-r from-orange-50 to-orange-100 px-6 py-3">
              <div class="text-sm text-orange-700 font-medium">
                <i data-lucide="loader" class="w-4 h-4 inline mr-1"></i>
                Awaiting
              </div>
            </div>
          </div>

          <div class="bg-white/70 backdrop-blur-sm overflow-hidden shadow-lg rounded-2xl border border-white/20 hover-lift">
            <div class="p-6">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                    <i data-lucide="alert-circle" class="w-6 h-6 text-white"></i>
                  </div>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-semibold text-gray-600 uppercase tracking-wide">Errors</dt>
                    <dd class="text-2xl font-bold text-gray-900">
                      {stats.syncStatusCounts?.error || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div class="bg-gradient-to-r from-red-50 to-red-100 px-6 py-3">
              <div class="text-sm text-red-700 font-medium">
                <i data-lucide="x-circle" class="w-4 h-4 inline mr-1"></i>
                Failed
              </div>
            </div>
          </div>
        </div>

        {/* Sync Records Table */}
        <div class="bg-white shadow rounded-lg mb-8">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Sync Records</h2>
            <p class="mt-1 text-sm text-gray-600">
              Subscription synchronization status between Crayon and HostBill
            </p>
          </div>
          <div class="overflow-hidden">
            {syncRecords.length > 0 ? (
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Crayon ID
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      HostBill ID
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
                  {syncRecords.map((record, index) => (
                    <tr key={index} class="hover:bg-gray-50">
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {record.product_name}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {record.crayon_subscription_id}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {record.hostbill_service_id || '-'}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          record.sync_status === 'synced' 
                            ? 'bg-green-100 text-green-800'
                            : record.sync_status === 'pending'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {record.sync_status}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.quantity}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${record.unit_price}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(record.last_sync).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div class="px-6 py-8 text-center">
                <p class="text-gray-500">No sync records found</p>
              </div>
            )}
          </div>
        </div>

        {/* Order Records */}
        <div class="bg-white shadow rounded-lg mb-8">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Order Records</h2>
            <p class="mt-1 text-sm text-gray-600">
              CSP orders created through the system
            </p>
          </div>
          <div class="overflow-hidden">
            {orderRecords.length > 0 ? (
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Crayon Order ID
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      HostBill Order ID
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  {orderRecords.map((record, index) => (
                    <tr key={index} class="hover:bg-gray-50">
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {record.crayon_order_id}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                        {record.hostbill_order_id || '-'}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.customer_id}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          record.status === 'approved' || record.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : record.status === 'pending'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${record.total_amount}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(record.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div class="px-6 py-8 text-center">
                <p class="text-gray-500">No order records found</p>
              </div>
            )}
          </div>
        </div>

        {/* Usage Records (limited view) */}
        <div class="bg-white shadow rounded-lg">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Recent Usage Records</h2>
            <p class="mt-1 text-sm text-gray-600">
              Latest usage data from Crayon (showing first 50 records)
            </p>
          </div>
          <div class="overflow-hidden">
            {usageRecords.length > 0 ? (
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subscription ID
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usage Date
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Synced
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  {usageRecords.map((record, index) => (
                    <tr key={index} class="hover:bg-gray-50">
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {record.subscription_id}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.usage_date}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.quantity_used}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${record.cost}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          record.synced_to_hostbill 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {record.synced_to_hostbill ? 'Synced' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div class="px-6 py-8 text-center">
                <p class="text-gray-500">No usage records found</p>
              </div>
            )}
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