import { useEffect, useState } from 'react';
import Navigation from '../components/Navigation';
import Dashboard from '../components/Dashboard';

export const meta = () => [
  { title: 'Dashboard - Cloud-IQ' },
  { name: 'description', content: 'Cloud-IQ Dashboard with sync status and statistics' }
];

export default function Index() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sync/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to load stats:', error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="max-w-7xl mx-auto py-10 sm:px-6 lg:px-8">
        <div id="content" className="animate-fade-in">
          <Dashboard stats={stats} loading={loading} />
        </div>
      </main>
    </div>
  );
}
