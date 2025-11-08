import { useLoaderData } from '@remix-run/react';

export const meta = () => [{ title: 'Dashboard - Cloud-IQ' }];

export async function loader() {
  try {
    // Fetch from local backend - adjust port/URL as needed
    const response = await fetch('http://localhost:3000/api/sync/stats', {
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch stats');
    }

    const stats = await response.json();
    return { stats };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Stats loader error:', error);
    return {
      stats: {
        syncRecords: 0,
        usageRecords: 0,
        orderRecords: 0,
        pendingSyncs: 0
      }
    };
  }
}

const StatCard = ({ icon, label, value, color, message }) => (
  <div className="bg-white/70 backdrop-blur-sm overflow-hidden shadow-lg rounded-2xl border border-white/20 hover-lift">
    <div className="p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 w-12 h-12 bg-gradient-to-r from-${color}-500 to-${color}-600 rounded-xl flex items-center justify-center shadow-lg`}>
          <i data-lucide={icon} className="w-6 h-6 text-white"></i>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dt className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{label}</dt>
          <dd className="text-2xl font-bold text-gray-900">{value}</dd>
        </div>
      </div>
    </div>
    <div className={`bg-gradient-to-r from-${color}-50 to-${color}-100 px-6 py-3`}>
      <div className={`text-sm text-${color}-700 font-medium`}>
        <i data-lucide="trending-up" className="w-4 h-4 inline mr-1"></i>{message}
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const { stats } = useLoaderData();

  const statCards = [
    {
      icon: 'database',
      label: 'Sync Records',
      value: stats.syncRecords,
      color: 'blue',
      message: 'Active syncs'
    },
    {
      icon: 'activity',
      label: 'Usage Records',
      value: stats.usageRecords,
      color: 'green',
      message: 'Tracked usage'
    },
    {
      icon: 'shopping-cart',
      label: 'Orders',
      value: stats.orderRecords,
      color: 'purple',
      message: 'Total orders'
    },
    {
      icon: 'clock',
      label: 'Pending',
      value: stats.pendingSyncs,
      color: 'orange',
      message: 'Awaiting sync'
    }
  ];

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

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
          {statCards.map(card => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>
      </div>
    </div>
  );
}
