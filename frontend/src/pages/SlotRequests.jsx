import React, { useState, useEffect, useCallback } from 'react';
import { useDebounce } from 'use-debounce';
import { getSlotRequests, approveRequest, rejectRequest } from '../utils/api';
import Pagination from '../components/common/Pagination';

const SlotRequests = () => {
  const [requests, setRequests] = useState([]);
  const [meta, setMeta] = useState({ totalItems: 0, currentPage: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 500);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [selectedRequestDetails, setSelectedRequestDetails] = useState(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getSlotRequests(page, limit, debouncedSearch);
      setRequests(response.data.data);
      setMeta(response.data.meta);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch requests');
    }
    setLoading(false);
  }, [page, limit, debouncedSearch]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (id) => {
    try {
      const response = await approveRequest(id);
      alert(`Request approved. Slot: ${response.data.slot?.slot_number || 'N/A'}. Email: ${response.data.emailStatus}`);
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to approve request');
    }
  };

  const handleReject = async () => {
    if (!rejectReason) {
      alert('Please provide a reason for rejection');
      return;
    }
    try {
      const response = await rejectRequest(selectedRequestId, rejectReason);
      alert(`Request rejected. Email: ${response.data.emailStatus}`);
      setRejectReason('');
      setSelectedRequestId(null);
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reject request');
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = 'px-3 py-1 rounded-full text-xs font-medium';
    
    switch (status.toLowerCase()) {
      case 'approved':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>Approved</span>;
      case 'rejected':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>Rejected</span>;
      case 'pending':
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Pending</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>{status}</span>;
    }
  };

  const handleViewDetails = (request) => {
    setSelectedRequestDetails(request);
  };

  const closeDetailsModal = () => {
    setSelectedRequestDetails(null);
  };

  return (
    <div className="container mx-auto p-6 min-h-screen">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Slot Requests</h1>
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by plate number or status"
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
                <th className="p-4 text-left text-sm font-semibold">Status</th>
                <th className="p-4 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-sm text-gray-700">{req.id}</td>
                  <td className="p-4 text-sm text-gray-700">{req.plate_number}</td>
                  <td className="p-4 text-sm text-gray-700 capitalize">{req.vehicle_type}</td>
                  <td className="p-4">{getStatusBadge(req.request_status)}</td>
                  <td className="p-4">
                    {req.request_status.toLowerCase() === 'pending' ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(req.id)}
                          className="px-3 py-1.5 text-sm font-medium text-white bg-black/70 rounded-full hover:bg-blue-700 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setSelectedRequestId(req.id)}
                          className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-full hover:bg-red-700 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleViewDetails(req)}
                        className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                      >
                        View Details
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject Request Modal */}
      {selectedRequestId && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Reject Request #{selectedRequestId}
            </h2>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter reason for rejection"
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all mb-4"
              rows="4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setRejectReason('');
                  setSelectedRequestId(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-full hover:bg-red-700 transition-colors"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {selectedRequestDetails && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Request Details #{selectedRequestDetails.id}
            </h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-gray-700">Plate Number:</p>
                <p className="text-gray-600">{selectedRequestDetails.plate_number}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Vehicle Type:</p>
                <p className="text-gray-600 capitalize">{selectedRequestDetails.vehicle_type}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Status:</p>
                {getStatusBadge(selectedRequestDetails.request_status)}
              </div>
              {selectedRequestDetails.request_status.toLowerCase() === 'rejected' && selectedRequestDetails.rejection_reason && (
                <div>
                  <p className="font-medium text-gray-700">Rejection Reason:</p>
                  <p className="text-gray-600">{selectedRequestDetails.rejection_reason}</p>
                </div>
              )}
              {selectedRequestDetails.request_status.toLowerCase() === 'approved' && selectedRequestDetails.slot && (
                <div>
                  <p className="font-medium text-gray-700">Assigned Slot:</p>
                  <p className="text-gray-600">{selectedRequestDetails.slot.slot_number}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={closeDetailsModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Pagination meta={meta} setPage={setPage} />
    </div>
  );
};

export default SlotRequests;