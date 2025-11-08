import { Form, useActionData } from '@remix-run/react';

export const meta = () => [{ title: 'Sync Monitor - Cloud-IQ' }];

export async function action({ request }) {
  if (request.method === 'POST') {
    try {
      const response = await fetch('http://localhost:3000/api/sync/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Sync failed');
      }

      const result = await response.json();
      return { success: true, message: result.message || 'Sync triggered successfully' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

export default function Sync() {
  const actionData = useActionData();

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
            <p className="text-gray-600 text-lg mt-1">Monitor Crayon and HostBill synchronization</p>
          </div>
        </div>

        <Form method="post" className="mb-8">
          <button
            type="submit"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 font-medium shadow-lg hover-lift disabled:opacity-50"
          >
            <i data-lucide="play" className="w-5 h-5 mr-2"></i>
            Trigger Manual Sync
          </button>
        </Form>

        {actionData && (
          <div
            className={actionData.success ? 'p-4 rounded-lg bg-green-50 border border-green-200 text-green-700' : 'p-4 rounded-lg bg-red-50 border border-red-200 text-red-700'}
          >
            {actionData.message}
          </div>
        )}

        <div className="bg-white/50 rounded-xl p-6 border border-white/20 mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sync Information</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Sync Engine:</strong> Tracks billing data between Crayon and HostBill</p>
            <p><strong>Frequency:</strong> Automatic every 4 hours plus manual triggers</p>
            <p><strong>Last Status:</strong> Check dashboard for latest stats</p>
          </div>
        </div>
      </div>
    </div>
  );
}
