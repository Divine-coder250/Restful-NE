import React, { useState, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { getSlotRequests, getUsers, getVehicles, getParkingSlots } from '../utils/api';

ChartJS.register(ArcElement, Tooltip, Legend);

const Dashboard = () => {
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    totalUsers: 0,
    totalVehicles: 0,
    totalSlots: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        const [requestsRes, usersRes, vehiclesRes, slotsRes] = await Promise.all([
          getSlotRequests(1, 1000, ''),
          getUsers(1, 1000, ''),
          getVehicles(1, 1000, ''),
          getParkingSlots(1, 1000, ''),
        ]);

        const requests = requestsRes.data.data;
        const pending = requests.filter((r) => r.request_status === 'pending').length;
        const approved = requests.filter((r) => r.request_status === 'approved').length;
        const rejected = requests.filter((r) => r.request_status === 'rejected').length;

        setStats({
          pending,
          approved,
          rejected,
          totalUsers: usersRes.data.meta.totalItems,
          totalVehicles: vehiclesRes.data.meta.totalItems,
          totalSlots: slotsRes.data.meta.totalItems,
        });
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch stats');
      }
      setLoading(false);
    };

    fetchStats();
  }, []);

  const pieData = {
    labels: ['Pending', 'Approved', 'Rejected'],
    datasets: [
      {
        data: [stats.pending, stats.approved, stats.rejected],
        backgroundColor: ['#6B7240', '#4B5563', '#374151'],
        borderColor: ['#4B5563', '#374151', '#1F2937'],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="container mx-auto p-6 bg-white-900 min-h-screen">
      <header className="header">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
      </header>
      {error && <p className="text-red-400 mb-4">{error}</p>}
      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-black border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-xl font-semibold text-white mb-4">Slot Request Status</h2>
            <Pie
              data={pieData}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'top', labels: { color: '#D1D5DB' } },
                  tooltip: { backgroundColor: '#1F2937' },
                },
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <ul className="stat-list">
              {[
                { label: 'Total Users', value: stats.totalUsers, color: 'stat-value bg-black' },
                { label: 'Total Vehicles', value: stats.totalVehicles, color: 'stat-value bg-gray-700' },
                { label: 'Total Slots', value: stats.totalSlots, color: 'stat-value bg-gray-800' },
                { label: 'Pending Requests', value: stats.pending, color: 'stat-value bg-gray-600' },
              ].map((item) => (
                <li key={item.label} className="stat-list-item">
                  <span className="text-base font-medium text-gray-200">{item.label}</span>
                  <span className={`text-base font-bold ${item.color}`}>{item.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;