/**
 * Order page route - handles CSP service ordering
 */

import { type Handlers, type PageProps } from "$fresh/server.ts";
import { CloudIQSyncService } from "../../lib/sync.ts";
import { CrayonCloudIQClient } from "../../lib/api/crayon.ts";

interface OrderPageData {
  products: any[];
  customers: any[];
  error?: string;
  success?: string;
}

interface OrderFormData {
  customerId: string;
  productId: string;
  quantity: number;
  billingCycle: string;
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
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-white shadow rounded-lg">
          <div class="px-6 py-4 border-b border-gray-200">
            <h1 class="text-2xl font-bold text-gray-900">Cloud-IQ Service Orders</h1>
            <p class="mt-1 text-sm text-gray-600">
              Order Microsoft 365, Teams, and other CSP services managed through Crayon Cloud-IQ
            </p>
          </div>

          <div class="px-6 py-4">
            {data.error && (
              <div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <div class="flex">
                  <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-800">Error</h3>
                    <p class="mt-1 text-sm text-red-700">{data.error}</p>
                  </div>
                </div>
              </div>
            )}

            {data.success && (
              <div class="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <div class="flex">
                  <div class="ml-3">
                    <h3 class="text-sm font-medium text-green-800">Success</h3>
                    <p class="mt-1 text-sm text-green-700">{data.success}</p>
                  </div>
                </div>
              </div>
            )}

            <form method="POST" class="space-y-6">
              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label for="customerId" class="block text-sm font-medium text-gray-700">
                    Customer
                  </label>
                  <select
                    id="customerId"
                    name="customerId"
                    required
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">Select a customer</option>
                    {data.customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label for="billingCycle" class="block text-sm font-medium text-gray-700">
                    Billing Cycle
                  </label>
                  <select
                    id="billingCycle"
                    name="billingCycle"
                    required
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="annually">Annually</option>
                  </select>
                </div>
              </div>

              <div>
                <label for="productId" class="block text-sm font-medium text-gray-700">
                  Product/Service
                </label>
                <select
                  id="productId"
                  name="productId"
                  required
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Select a product</option>
                  {data.products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {product.description || "CSP Service"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label for="quantity" class="block text-sm font-medium text-gray-700">
                  Quantity
                </label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  min="1"
                  defaultValue="1"
                  required
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div class="flex justify-end space-x-3">
                <button
                  type="button"
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>

        <div class="mt-8 bg-white shadow rounded-lg">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Available Products</h2>
          </div>
          <div class="px-6 py-4">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.products.map((product) => (
                <div key={product.id} class="border border-gray-200 rounded-lg p-4">
                  <h3 class="text-sm font-medium text-gray-900">{product.name}</h3>
                  <p class="mt-1 text-sm text-gray-600">
                    {product.description || "Microsoft CSP Service"}
                  </p>
                  {product.price && (
                    <p class="mt-2 text-sm font-semibold text-indigo-600">
                      ${product.price}/month
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}