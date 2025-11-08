import Navigation from '../components/Navigation';

export const meta = () => [
  { title: 'Orders - Cloud-IQ' },
  { name: 'description', content: 'HostBill Orders Integration' }
];

export default function Orders() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="max-w-7xl mx-auto py-10 sm:px-6 lg:px-8">
        <div className="glass-effect rounded-2xl p-8 border border-white/20">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <i data-lucide="shopping-cart" className="w-7 h-7 text-white"></i>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Orders</h1>
              <p className="text-gray-600 text-lg mt-1">
                Manage HostBill orders and CSP subscriptions
              </p>
            </div>
          </div>
          <div className="mt-8 text-center">
            <p className="text-gray-500">Order management interface coming soon...</p>
          </div>
        </div>
      </main>
    </div>
  );
}
