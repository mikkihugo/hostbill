/**
 * Order page route - handles CSP service ordering
 */

import { type Handlers, type PageProps } from "$fresh/server.ts";
import { CloudIQSyncService } from "../../lib/sync.ts";
import { CrayonCloudIQClient } from "../../lib/api/crayon.ts";



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

export const handler: Handlers<OrderPageData> = {
  async GET(req, ctx) {
    try {
      // Initialize clients
      const crayonClient = new CrayonCloudIQClient(config.crayonConfig);
      const syncService = new CloudIQSyncService(config);

      // Get available products from Crayon
      const products = await crayonClient.getProductsCatalog("office|teams|365");
      
      // Get customers (in a real implementation, this would be more sophisticated)
      const customers = [
        { id: "customer1", name: "Acme Corporation" },
        { id: "customer2", name: "Tech Solutions Inc" },
        { id: "customer3", name: "Digital Services Ltd" },
      ];

      syncService.cleanup();

      return ctx.render({
        products: products.slice(0, 20), // Limit to first 20 products
        customers,
      });

    } catch (error) {
      console.error("Failed to load order page:", error);
      return ctx.render({
        products: [],
        customers: [],
        error: `Failed to load order page: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  },

  async POST(req, ctx) {
    try {
      const formData = await req.formData();
      const orderData: OrderFormData = {
        customerId: formData.get("customerId") as string,
        productId: formData.get("productId") as string,
        quantity: parseInt(formData.get("quantity") as string) || 1,
        billingCycle: formData.get("billingCycle") as string || "monthly",
      };

      // Validate form data
      if (!orderData.customerId || !orderData.productId) {
        throw new Error("Customer and product selection are required");
      }

      // Create order through sync service
      const syncService = new CloudIQSyncService(config);
      const result = await syncService.createOrder(orderData);

      syncService.cleanup();

      // Reload page with success message
      const crayonClient = new CrayonCloudIQClient(config.crayonConfig);
      const products = await crayonClient.getProductsCatalog("office|teams|365");
      const customers = [
        { id: "customer1", name: "Acme Corporation" },
        { id: "customer2", name: "Tech Solutions Inc" },
        { id: "customer3", name: "Digital Services Ltd" },
      ];

      return ctx.render({
        products: products.slice(0, 20),
        customers,
        success: `Order created successfully! Crayon Order ID: ${result.crayonOrderId}`,
      });

    } catch (error) {
      console.error("Failed to create order:", error);
      
      // Reload page with error
      const crayonClient = new CrayonCloudIQClient(config.crayonConfig);
      const products = await crayonClient.getProductsCatalog("office|teams|365");
      const customers = [
        { id: "customer1", name: "Acme Corporation" },
        { id: "customer2", name: "Tech Solutions Inc" },
        { id: "customer3", name: "Digital Services Ltd" },
      ];

      return ctx.render({
        products: products.slice(0, 20),
        customers,
        error: `Failed to create order: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  },
};

export default function OrderPage({ data }: PageProps<OrderPageData>) {
  return (
    <div class="min-h-screen py-10">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/20 animate-fade-in">
          <div class="px-8 py-6 border-b border-gray-100">
            <div class="flex items-center mb-2">
              <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                <i data-lucide="shopping-cart" class="w-6 h-6 text-white"></i>
              </div>
              <h1 class="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Cloud-IQ Service Orders</h1>
            </div>
            <p class="text-gray-600 text-lg">
              🚀 Order Microsoft 365, Teams, and other CSP services managed through Crayon Cloud-IQ
            </p>
          </div>

          <div class="px-8 py-8">
            {data.error && (
              <div class="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg animate-fade-in">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <i data-lucide="alert-circle" class="w-5 h-5 text-red-400"></i>
                  </div>
                  <div class="ml-3">
                    <h3 class="text-sm font-semibold text-red-800">Error</h3>
                    <p class="mt-1 text-sm text-red-700">{data.error}</p>
                  </div>
                </div>
              </div>
            )}

            {data.success && (
              <div class="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-lg animate-fade-in">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <i data-lucide="check-circle" class="w-5 h-5 text-green-400"></i>
                  </div>
                  <div class="ml-3">
                    <h3 class="text-sm font-semibold text-green-800">Success</h3>
                    <p class="mt-1 text-sm text-green-700">{data.success}</p>
                  </div>
                </div>
              </div>
            )}

            <form method="POST" class="space-y-8">
              <div class="grid grid-cols-1 gap-8 sm:grid-cols-2">
                <div class="space-y-2">
                  <label for="customerId" class="block text-sm font-semibold text-gray-700">
                    <i data-lucide="user" class="w-4 h-4 inline mr-1"></i>
                    Customer
                  </label>
                  <select
                    id="customerId"
                    name="customerId"
                    required
                    class="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white/90 backdrop-blur-sm"
                  >
                    <option value="">Select a customer</option>
                    {data.customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div class="space-y-2">
                  <label for="billingCycle" class="block text-sm font-semibold text-gray-700">
                    <i data-lucide="calendar" class="w-4 h-4 inline mr-1"></i>
                    Billing Cycle
                  </label>
                  <select
                    id="billingCycle"
                    name="billingCycle"
                    required
                    class="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white/90 backdrop-blur-sm"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="annually">Annually</option>
                  </select>
                </div>
              </div>

              <div class="space-y-2">
                <label for="productId" class="block text-sm font-semibold text-gray-700">
                  <i data-lucide="package" class="w-4 h-4 inline mr-1"></i>
                  Product/Service
                </label>
                <select
                  id="productId"
                  name="productId"
                  required
                  class="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white/90 backdrop-blur-sm"
                >
                  <option value="">Select a product</option>
                  {data.products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {product.description || "CSP Service"}
                    </option>
                  ))}
                </select>
              </div>

              <div class="space-y-2">
                <label for="quantity" class="block text-sm font-semibold text-gray-700">
                  <i data-lucide="hash" class="w-4 h-4 inline mr-1"></i>
                  Quantity
                </label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  min="1"
                  defaultValue="1"
                  required
                  class="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white/90 backdrop-blur-sm"
                />
              </div>

              <div class="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  class="px-6 py-3 text-sm font-semibold text-gray-700 bg-white/90 border border-gray-300 rounded-xl shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 hover-lift"
                >
                  <i data-lucide="x" class="w-4 h-4 inline mr-1"></i>
                  Cancel
                </button>
                <button
                  type="submit"
                  class="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 border border-transparent rounded-xl shadow-sm hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 hover-lift"
                >
                  <i data-lucide="shopping-cart" class="w-4 h-4 inline mr-1"></i>
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>

        <div class="mt-10 bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/20 animate-fade-in">
          <div class="px-8 py-6 border-b border-gray-100">
            <div class="flex items-center">
              <div class="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mr-3">
                <i data-lucide="grid-3x3" class="w-5 h-5 text-white"></i>
              </div>
              <h2 class="text-xl font-bold text-gray-900">Available Products</h2>
            </div>
          </div>
          <div class="px-8 py-8">
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.products.map((product) => (
                <div key={product.id} class="bg-white/80 border-2 border-gray-200 rounded-2xl p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-300 hover-lift">
                  <div class="flex items-start justify-between mb-4">
                    <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <i data-lucide="box" class="w-5 h-5 text-white"></i>
                    </div>
                    {product.price && (
                      <div class="bg-gradient-to-r from-green-100 to-green-200 px-3 py-1 rounded-full">
                        <span class="text-sm font-bold text-green-800">${product.price}/mo</span>
                      </div>
                    )}
                  </div>
                  <h3 class="text-lg font-bold text-gray-900 mb-2">{product.name}</h3>
                  <p class="text-sm text-gray-600 leading-relaxed">
                    {product.description || "Microsoft CSP Service"}
                  </p>
                  <div class="mt-4 flex items-center text-blue-600 font-medium">
                    <i data-lucide="info" class="w-4 h-4 mr-1"></i>
                    <span class="text-xs">CSP Service</span>
                  </div>
                </div>
              ))}
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
    </div>
  );
}