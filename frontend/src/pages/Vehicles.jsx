import React, { useState, useEffect, useCallback } from 'react';
import { useDebounce } from 'use-debounce';
import { getVehicles } from '../utils/api';
import Pagination from '../components/common/Pagination';

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [meta, setMeta] = useState({ totalItems: 0, currentPage: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 500);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getVehicles(page, limit, debouncedSearch);
      setVehicles(response.data.data);
      setMeta(response.data.meta);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch vehicles');
    }
    setLoading(false);
  }, [page, limit, debouncedSearch]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold text-gray-800">Vehicles</h1>
        </div>

        <input
          type="text"
          placeholder="Search by plate number..."
          className="w-full px-4 py-2 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-black outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

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
          <div className="bg-white rounded-xl shadow-sm overflow-x-auto border border-gray-200">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="bg-gray-50 text-gray-700">
                  <th className="p-4 text-left text-sm font-semibold">ID</th>
                  <th className="p-4 text-left text-sm font-semibold">Plate Number</th>
                  <th className="p-4 text-left text-sm font-semibold">Vehicle Type</th>
                  <th className="p-4 text-left text-sm font-semibold">Size</th>
                  <th className="p-4 text-left text-sm font-semibold">User ID</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.length > 0 ? (
                  vehicles.map((vehicle) => (
                    <tr
                      key={vehicle.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-4 text-sm text-gray-700">{vehicle.id}</td>
                      <td className="p-4 text-sm text-gray-700">{vehicle.plate_number}</td>
                      <td className="p-4 text-sm text-gray-700">{vehicle.vehicle_type}</td>
                      <td className="p-4 text-sm text-gray-700">{vehicle.size}</td>
                      <td className="p-4 text-sm text-gray-700">{vehicle.user_id}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-4 text-center text-gray-500">
                      No vehicles found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <Pagination meta={meta} setPage={setPage} />
      </div>
    </div>
  );
};

export default Vehicles;