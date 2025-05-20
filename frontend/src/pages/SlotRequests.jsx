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
      const slotNumber = response.data.slot?.slot_number || 'N/A';
      const approvalStatus = response.data.approvalEmailStatus || 'failed';
      const paymentStatus = response.data.paymentEmailStatus || 'failed';
      alert(`Request approved. Slot: ${slotNumber}. Approval Email: ${approvalStatus}, Payment Email: ${paymentStatus}`);
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
        return <span className={`${baseClasses} bg-green-700 text-white`}>Approved</span>;
      case 'rejected':
        return <span className={`${baseClasses} bg-red-700 text-white`}>Rejected</span>;
      case 'pending':
        return <span className={`${baseClasses} bg-yellow-600 text-white`}>Pending</span>;
      default:
        return <span className={`${baseClasses} bg-gray-600 text-white`}>{status}</span>;
    }
  };

  const handleViewDetails = (request) => {
    setSelectedRequestDetails(request);
  };

  const closeDetailsModal = () => {
    setSelectedRequestDetails(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold text-gray-800">Slot Requests</h1>
        </div>

        <input
          type="text"
          placeholder="Search by plate number or status..."
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
            {requests.length > 0 ? (
              requests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex flex-col justify-between"
                >
                  <div className="space-y-1 mb-3">
                    <p className="text-xs text-gray-500">ID: {req.id}</p>
                    <h2 className="text-lg font-bold text-gray-800">Plate: {req.plate_number}</h2>
                    <p className="text-sm text-gray-600">Type: {req.vehicle_type}</p>
                    <div className="mt-2">{getStatusBadge(req.request_status)}</div>
                  </div>
                  <div className="flex justify-end gap-2 text-sm">
                    {req.request_status.toLowerCase() === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleApprove(req.id)}
                          className="px-3 py-1.5 text-sm font-medium text-white bg-black/70 rounded-full hover:bg-black transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setSelectedRequestId(req.id)}
                          className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-full hover:bg-red-700 transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleViewDetails(req)}
                        className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                      >
                        View Details
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500">
                No slot requests found.
              </div>
            )}
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
                className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-all mb-4"
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
    </div>
  );
};

export default SlotRequests;