export default function Dashboard({ stats, loading }) {
  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="glass-effect rounded-2xl p-8 border border-white/20">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-2xl bg-slate-200 h-32 w-full"></div>
            <div className="rounded-2xl bg-slate-200 h-32 w-full"></div>
            <div className="rounded-2xl bg-slate-200 h-32 w-full"></div>
            <div className="rounded-2xl bg-slate-200 h-32 w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      icon: 'database',
      label: 'Sync Records',
      value: stats?.syncRecords || 0,
      color: 'blue',
      message: 'Active syncs'
    },
    {
      icon: 'activity',
      label: 'Usage Records',
      value: stats?.usageRecords || 0,
      color: 'green',
      message: 'Tracked usage'
    },
    {
      icon: 'shopping-cart',
      label: 'Orders',
      value: stats?.orderRecords || 0,
      color: 'purple',
      message: 'Total orders'
    },
    {
      icon: 'clock',
      label: 'Pending',
      value: stats?.pendingSyncs || 0,
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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Cloud-IQ Dashboard</h1>
            <p className="text-gray-600 text-lg mt-1">
              Crayon Cloud-IQ integration with HostBill for CSP billing management
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
          {statCards.map(card => (
            <div key={card.label} className="bg-white/70 backdrop-blur-sm overflow-hidden shadow-lg rounded-2xl border border-white/20 hover:shadow-xl transition-shadow">
              <div className="p-6">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 w-12 h-12 bg-gradient-to-r from-${card.color}-500 to-${card.color}-600 rounded-xl flex items-center justify-center shadow-lg`}>
                    <i data-lucide={card.icon} className="w-6 h-6 text-white"></i>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{card.label}</dt>
                    <dd className="text-2xl font-bold text-gray-900">{card.value}</dd>
                  </div>
                </div>
              </div>
              <div className={`bg-gradient-to-r from-${card.color}-50 to-${card.color}-100 px-6 py-3`}>
                <div className={`text-sm text-${card.color}-700 font-medium`}>
                  <i data-lucide="trending-up" className="w-4 h-4 inline mr-1"></i>{card.message}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
