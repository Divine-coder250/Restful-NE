import React, { useState, useEffect, useCallback } from 'react';
import { useDebounce } from 'use-debounce';
import {
  getParkingSlots,
  createBulkParkingSlots,
  updateParkingSlot,
  deleteParkingSlot,
} from '../utils/api';
import Pagination from '../components/common/Pagination';

const ParkingSlots = () => {
  const [slots, setSlots] = useState([]);
  const [meta, setMeta] = useState({ totalItems: 0, currentPage: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 500);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bulkForm, setBulkForm] = useState({ count: '', location: '', size: '', vehicle_type: '' });
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editForm, setEditForm] = useState({ 
    slot_number: '', 
    location: '', 
    size: '', 
    vehicle_type: '', 
    status: '' 
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getParkingSlots(page, limit, debouncedSearch);
      setSlots(response.data.data);
      setMeta(response.data.meta);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch parking slots');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const handleBulkInputChange = (e) => {
    const { name, value } = e.target;
    setBulkForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const { count, location, size, vehicle_type } = bulkForm;

    if (!count || !location || !size || !vehicle_type) {
      setError('All fields are required');
      return;
    }

    const countNum = parseInt(count);
    if (isNaN(countNum) || countNum <= 0 || countNum > 100) {
      setError('Count must be between 1 and 100');
      return;
    }

    setIsCreating(true);
    try {
      const prefix = `SLOT-${Math.floor(Math.random() * 1000)}`;
      const slots = Array.from({ length: countNum }, (_, i) => ({
        slot_number: `${prefix}-${i + 1}`,
        location,
        size,
        vehicle_type,
        status: 'available',
      }));

      await createBulkParkingSlots({ slots });
      setBulkForm({ count: '', location: '', size: '', vehicle_type: '' });
      setShowBulkModal(false);
      await fetchSlots();
      alert(`${countNum} parking slots created successfully!`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create slots');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const { slot_number, location, size, vehicle_type, status } = editForm;
    
    if (!slot_number || !location || !size || !vehicle_type || !status) {
      setError('All fields are required');
      return;
    }

    try {
      await updateParkingSlot(editId, { 
        slot_number, 
        location, 
        size, 
        vehicle_type, 
        status 
      });
      
      setEditForm({ 
        slot_number: '', 
        location: '', 
        size: '', 
        vehicle_type: '', 
        status: '' 
      });
      setIsEditing(false);
      setEditId(null);
      await fetchSlots();
      alert('Parking slot updated successfully!');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to update parking slot';
      setError(errorMsg);
      console.error('Update error:', err);
    }
  };

  const handleEdit = (slot) => {
    setEditForm({
      slot_number: slot.slot_number,
      location: slot.location,
      size: slot.size,
      vehicle_type: slot.vehicle_type,
      status: slot.status,
    });
    setEditId(slot.id);
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this parking slot?')) return;
    try {
      await deleteParkingSlot(id);
      await fetchSlots();
      alert('Deleted successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete slot');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold text-gray-800">Parking Slots</h1>
          <button
            onClick={() => setShowBulkModal(true)}
            className="bg-black text-white px-5 py-2 rounded-lg shadow hover:bg-black"
          >
            + Create Bulk
          </button>
        </div>

        <input
          type="text"
          placeholder="Search slot number, type, or location..."
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {slots.length > 0 ? (
              slots.map((slot) => (
                <div
                  key={slot.id}
                  className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex flex-col justify-between"
                >
                  <div className="space-y-1 mb-3">
                    <p className="text-xs text-gray-500">ID: {slot.id}</p>
                    <h2 className="text-lg font-bold text-gray-800">{slot.slot_number}</h2>
                    <p className="text-sm text-gray-600">Location: {slot.location}</p>
                    <p className="text-sm text-gray-600">Size: {slot.size}</p>
                    <p className="text-sm text-gray-600">Type: {slot.vehicle_type}</p>
                    <span
                      className={`inline-block px-3 py-1 text-xs rounded-full font-medium ${
                        slot.status === 'available'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {slot.status.charAt(0).toUpperCase() + slot.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-end gap-2 text-sm">
                    <button
                      onClick={() => handleEdit(slot)}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(slot.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500">
                No parking slots found.
              </div>
            )}
          </div>
        )}

        <Pagination meta={meta} setPage={setPage} />
      </div>

      {/* Bulk Create Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create Bulk Parking Slots</h2>
            
            {error && (
              <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                <p className="text-sm">{error}</p>
              </div>
            )}
            
            <form onSubmit={handleBulkSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="count">
                  Number of Slots (1-100)
                </label>
                <input
                  type="number"
                  id="count"
                  name="count"
                  value={bulkForm.count}
                  onChange={handleBulkInputChange}
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  min="1"
                  max="100"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="location">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={bulkForm.location}
                  onChange={handleBulkInputChange}
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="size">
                  Size
                </label>
                <select
                  id="size"
                  name="size"
                  value={bulkForm.size}
                  onChange={handleBulkInputChange}
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                >
                  <option value="">Select Size</option>
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="vehicle_type">
                  Vehicle Type
                </label>
                <select
                  id="vehicle_type"
                  name="vehicle_type"
                  value={bulkForm.vehicle_type}
                  onChange={handleBulkInputChange}
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                >
                  <option value="">Select Vehicle Type</option>
                  <option value="car">Car</option>
                  <option value="taxi">Taxi</option>
                  <option value="truck">Truck</option>
                  <option value="any">Any</option>
                </select>
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkModal(false);
                    setError('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-black rounded-full hover:bg-black/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create Slots'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Parking Slot</h2>
            
            {error && (
              <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                <p className="text-sm">{error}</p>
              </div>
            )}
            
            <form onSubmit={handleEditSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="edit-slot_number">
                  Slot Number
                </label>
                <input
                  type="text"
                  id="edit-slot_number"
                  name="slot_number"
                  value={editForm.slot_number}
                  onChange={handleEditInputChange}
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="edit-location">
                  Location
                </label>
                <input
                  type="text"
                  id="edit-location"
                  name="location"
                  value={editForm.location}
                  onChange={handleEditInputChange}
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="edit-size">
                  Size
                </label>
                <select
                  id="edit-size"
                  name="size"
                  value={editForm.size}
                  onChange={handleEditInputChange}
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                >
                  <option value="">Select Size</option>
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="edit-vehicle_type">
                  Vehicle Type
                </label>
                <select
                  id="edit-vehicle_type"
                  name="vehicle_type"
                  value={editForm.vehicle_type}
                  onChange={handleEditInputChange}
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                >
                  <option value="">Select Vehicle Type</option>
                  <option value="car">Car</option>
                  <option value="taxi">Taxi</option>
                  <option value="truck">Truck</option>
                  <option value="any">Any</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="edit-status">
                  Status
                </label>
                <select
                  id="edit-status"
                  name="status"
                  value={editForm.status}
                  onChange={handleEditInputChange}
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                >
                  <option value="">Select Status</option>
                  <option value="available">Available</option>
                  <option value="unavailable">Occupied</option>
                </select>
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditId(null);
                    setError('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-black rounded-full hover:bg-black/70 transition-colors"
                >
                  Update Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      
    </div>
  );
};

export default ParkingSlots;
