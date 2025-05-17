import React, { useState, useEffect, useCallback } from 'react';
import { useDebounce } from 'use-debounce';
import { getUsers, deleteUser } from '../utils/api';
import Pagination from '../components/common/Pagination';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ totalItems: 0, currentPage: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 500);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getUsers(page, limit, debouncedSearch);
      setUsers(response.data.data);
      setMeta(response.data.meta);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch users');
    }
    setLoading(false);
  }, [page, limit, debouncedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(id);
        alert('User deleted');
        fetchUsers();
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to delete user');
      }
    }
  };

  return (
    <div className="container mx-auto p-6 min-h-screen">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Users</h1>
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name or email"
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
                <th className="p-4 text-left text-sm font-semibold">Name</th>
                <th className="p-4 text-left text-sm font-semibold">Email</th>
                <th className="p-4 text-left text-sm font-semibold">Verified</th>
                <th className="p-4 text-left text-sm font-semibold">Role</th>
                <th className="p-4 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-sm text-gray-700">{user.id}</td>
                  <td className="p-4 text-sm text-gray-700">{user.name}</td>
                  <td className="p-4 text-sm text-gray-700">{user.email}</td>
                  <td className="p-4 text-sm text-gray-700">{user.is_verified ? 'Yes' : 'No'}</td>
                  <td className="p-4 text-sm text-gray-700">{user.role}</td>
                  <td className="p-4">
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-full hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
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

export default Users;