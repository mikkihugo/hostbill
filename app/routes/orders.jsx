export const meta = () => [{ title: 'Orders - Cloud-IQ' }];

export default function Orders() {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="glass-effect rounded-2xl p-8 border border-white/20">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
            <i data-lucide="shopping-cart" className="w-7 h-7 text-white"></i>
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Orders
            </h1>
            <p className="text-gray-600 text-lg mt-1">Manage and track orders</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Order ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Customer</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Amount</th>
              </tr>
            </thead>
            <tbody id="orders-table">
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-600">
                  Loading orders...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
