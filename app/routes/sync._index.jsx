import { useState } from 'react';
import Navigation from '../components/Navigation';

export const meta = () => [
  { title: 'Sync - Cloud-IQ' },
  { name: 'description', content: 'Billing Synchronization Management' }
];

export default function Sync() {
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/sync/manual', { method: 'POST' });
      const result = await response.json();
      setMessage(result.message || 'Sync completed successfully');
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      setMessage(`Sync failed: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="max-w-7xl mx-auto py-10 sm:px-6 lg:px-8">
        <div className="glass-effect rounded-2xl p-8 border border-white/20">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
              <i data-lucide="refresh-cw" className="w-7 h-7 text-white"></i>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Synchronization</h1>
              <p className="text-gray-600 text-lg mt-1">
                Sync billing data between Crayon and HostBill
              </p>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              <i data-lucide="play" className="w-5 h-5 mr-2"></i>
              {syncing ? 'Syncing...' : 'Start Manual Sync'}
            </button>

            {message && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
                {message}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
