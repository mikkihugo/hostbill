import { Link } from '@remix-run/react';

export default function Navigation() {
  return (
    <nav className="glass-effect border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
              <i data-lucide="cloud" className="w-5 h-5 text-white"></i>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Cloud-IQ</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              <i data-lucide="home" className="w-4 h-4 inline mr-1"></i>Dashboard
            </Link>
            <Link to="/orders" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              <i data-lucide="shopping-cart" className="w-4 h-4 inline mr-1"></i>Orders
            </Link>
            <Link to="/sync" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              <i data-lucide="refresh-cw" className="w-4 h-4 inline mr-1"></i>Sync
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
