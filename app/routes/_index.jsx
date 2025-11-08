export const meta = () => [{ title: 'Dashboard - Cloud-IQ' }];

export async function loader() {
  try {
    const response = await fetch('http://localhost:8000/api/sync/stats');
    const stats = await response.json();
    return { stats };
  } catch (error) {
    console.error('Failed to load stats:', error);
    return { stats: null };
  }
}

export default function Dashboard() {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="glass-effect rounded-2xl p-8 border border-white/20">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <i data-lucide="layout-dashboard" className="w-7 h-7 text-white"></i>
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Cloud-IQ Dashboard
            </h1>
            <p className="text-gray-600 text-lg mt-1">
              🚀 Crayon Cloud-IQ integration with HostBill for CSP billing management
            </p>
          </div>
        </div>

        <div id="sync-stats" className="mb-10">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-2xl bg-slate-200 h-32 w-full"></div>
            <div className="rounded-2xl bg-slate-200 h-32 w-full"></div>
            <div className="rounded-2xl bg-slate-200 h-32 w-full"></div>
            <div className="rounded-2xl bg-slate-200 h-32 w-full"></div>
          </div>
        </div>

        <div id="agent-status"></div>
      </div>
    </div>
  );
}
