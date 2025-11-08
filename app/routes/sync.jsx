export const meta = () => [{ title: 'Sync Monitor - Cloud-IQ' }];

export default function Sync() {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="glass-effect rounded-2xl p-8 border border-white/20">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl flex items-center justify-center">
            <i data-lucide="refresh-cw" className="w-7 h-7 text-white"></i>
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Sync Monitor
            </h1>
            <p className="text-gray-600 text-lg mt-1">Monitor Crayon & HostBill synchronization</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 mb-8">
          <button
            onClick={() => triggerSync()}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 font-medium shadow-lg hover-lift"
          >
            <i data-lucide="refresh-cw" className="w-5 h-5 mr-2"></i>
            Trigger Manual Sync
          </button>
        </div>

        <div className="bg-white/50 rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sync Activity Log</h3>
          <div id="sync-log" className="space-y-2 max-h-96 overflow-y-auto">
            <p className="text-sm text-gray-600">Loading sync activity...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

async function triggerSync() {
  try {
    const response = await fetch('/api/sync/manual', { method: 'POST' });
    const result = await response.json();
    alert(result.message || 'Sync completed successfully');
  } catch (error) {
    alert('Sync failed: ' + error.message);
  }
}
