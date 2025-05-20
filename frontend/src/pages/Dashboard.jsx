import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { getSlotRequests, getUsers, getVehicles, getParkingSlots } from '../utils/api';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

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

  const barData = {
    labels: ['Pending', 'Approved', 'Rejected'],
    datasets: [
      {
        label: 'Slot Requests',
        data: [stats.pending, stats.approved, stats.rejected],
        backgroundColor: ['#fef08a', '#4ade80', '#f87171'], // Yellow for Pending, Green for Approved, Red for Rejected
        borderColor: ['#ca8a04', '#16a34a', '#dc2626'],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold text-gray-800">Dashboard</h1>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Slot Request Status</h2>
              <Bar
                data={barData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false }, // Hide default legend to use custom one
                    tooltip: { backgroundColor: '#1F2937' },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: { color: '#6B7280' },
                      grid: { color: '#E5E7EB' },
                    },
                    x: {
                      ticks: { color: '#6B7280' },
                      grid: { display: false },
                    },
                  },
                }}
              />
              {/* Custom Legend */}
              <div className="mt-4 flex flex-wrap gap-4">
                <div className="flex items-center">
                  <span className="inline-block w-4 h-4 mr-2 rounded-sm bg-yellow-200"></span>
                  <span className="text-sm text-gray-600">Pending</span>
                </div>
                <div className="flex items-center">
                  <span className="inline-block w-4 h-4 mr-2 rounded-sm bg-green-400"></span>
                  <span className="text-sm text-gray-600">Approved</span>
                </div>
                <div className="flex items-center">
                  <span className="inline-block w-4 h-4 mr-2 rounded-sm bg-red-400"></span>
                  <span className="text-sm text-gray-600">Rejected</span>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Statistics</h2>
              <ul className="space-y-2">
                {[
                  { label: 'Total Users', value: stats.totalUsers },
                  { label: 'Total Vehicles', value: stats.totalVehicles },
                  { label: 'Total Slots', value: stats.totalSlots },
                  { label: 'Pending Requests', value: stats.pending },
                ].map((item, index) => (
                  <li
                    key={item.label}
                    className={`flex justify-between items-center p-3 rounded-lg ${
                      index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                    } hover:bg-gray-100 transition-colors`}
                  >
                    <span className="text-base font-medium text-gray-600">{item.label}</span>
                    <span className="text-base font-bold text-gray-800">{item.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;