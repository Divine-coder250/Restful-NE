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
    <div className="container mx-auto p-6 min-h-screen">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Vehicles</h1>
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by plate number"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-1/2 px-4 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />
      </div>
      {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}
      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto border border-gray-100">
          <table className="min-w-full">
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
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-sm text-gray-700">{vehicle.id}</td>
                  <td className="p-4 text-sm text-gray-700">{vehicle.plate_number}</td>
                  <td className="p-4 text-sm text-gray-700">{vehicle.vehicle_type}</td>
                  <td className="p-4 text-sm text-gray-700">{vehicle.size}</td>
                  <td className="p-4 text-sm text-gray-700">{vehicle.user_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination meta={meta} setPage={setPage} />
    </div>
  );
};

export default Vehicles;