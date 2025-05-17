import React, { useState, useEffect, useCallback } from 'react';
import { useDebounce } from 'use-debounce';
import { getLogs } from '../utils/api';
import Pagination from '../components/common/Pagination';

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState({ totalItems: 0, currentPage: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 500);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getLogs(page, limit, debouncedSearch);
      setLogs(response.data.data);
      setMeta(response.data.meta);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch logs');
    }
    setLoading(false);
  }, [page, limit, debouncedSearch]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="container mx-auto p-6 min-h-screen">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Activity Logs</h1>
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by action or user ID"
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
                <th className="p-4 text-left text-sm font-semibold">User ID</th>
                <th className="p-4 text-left text-sm font-semibold">Action</th>
                <th className="p-4 text-left text-sm font-semibold">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-sm text-gray-700">{log.id}</td>
                  <td className="p-4 text-sm text-gray-700">{log.user_id}</td>
                  <td className="p-4 text-sm text-gray-700">{log.action}</td>
                  <td className="p-4 text-sm text-gray-700">{new Date(log.created_at).toLocaleString()}</td>
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

export default Logs;