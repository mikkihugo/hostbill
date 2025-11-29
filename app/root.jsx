import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration } from '@remix-run/react';

export const meta = () => [
  { charset: 'utf-8' },
  { name: 'viewport', content: 'width=device-width, initial-scale=1' },
  { title: 'Cloud-IQ - Crayon & HostBill Integration' }
];

export default function App() {
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
        <style>{`
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
        `}</style>
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
                  <h1 class="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    Cloud-IQ
                  </h1>
                </div>
                <div class="flex items-center space-x-4">
                  <a
                    href="/"
                    class="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                  >
                    <i data-lucide="home" class="w-4 h-4 inline mr-1"></i>Dashboard
                  </a>
                  <a
                    href="/orders"
                    class="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                  >
                    <i data-lucide="shopping-cart" class="w-4 h-4 inline mr-1"></i>Orders
                  </a>
                  <a
                    href="/sync"
                    class="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                  >
                    <i data-lucide="refresh-cw" class="w-4 h-4 inline mr-1"></i>Sync
                  </a>
                </div>
              </div>
            </div>
          </nav>

          <main class="max-w-7xl mx-auto py-10 sm:px-6 lg:px-8">
            <div class="animate-fade-in">
              <Outlet />
            </div>
          </main>
        </div>

        <script>
          {`
            if (typeof lucide !== 'undefined') {
              lucide.createIcons();
            }
          `}
        </script>

        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
