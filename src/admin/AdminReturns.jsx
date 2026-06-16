import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { 
  FiEye, FiCheckCircle, FiXCircle, FiClock, FiPackage, 
  FiTruck, FiMessageSquare, FiFilter, FiSearch, FiRefreshCw,
  FiAlertCircle, FiDollarSign, FiRefreshCcw
} from 'react-icons/fi';
import styles from './AdminReturns.module.css';
import { sendEmailNotification } from '../services/emailService';
const AdminReturns = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [adminMessage, setAdminMessage] = useState('');
  const [updating, setUpdating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [error, setError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');

  const statusOptions = [
    { value: 'pending', label: 'Pending', icon: <FiClock size={14} />, color: '#F59E0B', bg: '#FEF3C7' },
    { value: 'approved', label: 'Approved - Awaiting Pickup', icon: <FiCheckCircle size={14} />, color: '#10B981', bg: '#D1FAE5' },
    { value: 'picked_up', label: 'Picked Up - In Transit', icon: <FiTruck size={14} />, color: '#3B82F6', bg: '#DBEAFE' },
    { value: 'replacement', label: 'Replacement Sent', icon: <FiPackage size={14} />, color: '#8B5CF6', bg: '#EDE9FE' },
    { value: 'refunded', label: 'Refund Processed', icon: <FiDollarSign size={14} />, color: '#059669', bg: '#D1FAE5' },
    { value: 'rejected', label: 'Rejected', icon: <FiXCircle size={14} />, color: '#EF4444', bg: '#FEE2E2' },
    { value: 'completed', label: 'Completed', icon: <FiCheckCircle size={14} />, color: '#059669', bg: '#D1FAE5' }
  ];

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: returnsData, error: returnsError } = await supabase
        .from('returns')
        .select('*')
        .order('created_at', { ascending: false });

      if (returnsError) throw returnsError;

      if (returnsData && returnsData.length > 0) {
        const orderIds = [...new Set(returnsData.map(r => r.order_id))];
        
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('id, order_number, total_amount, shipping_address, user_id')
          .in('id', orderIds);

        if (ordersError) throw ordersError;

        const userIds = [...new Set(ordersData?.map(o => o.user_id) || [])];
        
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, name, email, mobile')
          .in('id', userIds);

        if (usersError) throw usersError;

        const ordersMap = {};
        ordersData?.forEach(order => {
          ordersMap[order.id] = order;
        });

        const usersMap = {};
        usersData?.forEach(user => {
          usersMap[user.id] = user;
        });

        const combinedReturns = returnsData.map(returnItem => {
          const order = ordersMap[returnItem.order_id];
          const user = order ? usersMap[order.user_id] : null;
          
          return {
            ...returnItem,
            order_number: order?.order_number || 'N/A',
            order_total: order?.total_amount || 0,
            order_address: order?.shipping_address || 'N/A',
            customer_name: user?.name || 'N/A',
            customer_email: user?.email || 'N/A',
            customer_phone: user?.mobile || 'N/A'
          };
        });

        setReturns(combinedReturns);
      } else {
        setReturns([]);
      }
    } catch (error) {
      console.error('Error fetching returns:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateReturnStatus = async (returnId, newStatus) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('returns')
        .update({
          status: newStatus,
          admin_message: adminMessage,
          resolved_at: newStatus === 'approved' || newStatus === 'rejected' || newStatus === 'refunded' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', returnId);

      if (error) throw error;

      await fetchReturns();
      setShowModal(false);
      setSelectedReturn(null);
      setAdminMessage('');
      setSelectedStatus('');
    } catch (error) {
      console.error('Error updating return:', error);
      alert('Failed to update return status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { label: 'Pending', color: '#F59E0B', bg: '#FEF3C7', icon: <FiClock size={12} /> },
      approved: { label: 'Approved', color: '#10B981', bg: '#D1FAE5', icon: <FiCheckCircle size={12} /> },
      rejected: { label: 'Rejected', color: '#EF4444', bg: '#FEE2E2', icon: <FiXCircle size={12} /> },
      replacement: { label: 'Replacement Sent', color: '#8B5CF6', bg: '#EDE9FE', icon: <FiPackage size={12} /> },
      refunded: { label: 'Refunded', color: '#059669', bg: '#D1FAE5', icon: <FiDollarSign size={12} /> },
      completed: { label: 'Completed', color: '#059669', bg: '#D1FAE5', icon: <FiCheckCircle size={12} /> },
      picked_up: { label: 'Picked Up', color: '#3B82F6', bg: '#DBEAFE', icon: <FiTruck size={12} /> }
    };
    const c = config[status] || config.pending;
    return (
      <span className={styles.statusBadge} style={{ background: c.bg, color: c.color }}>
        {c.icon} {c.label}
      </span>
    );
  };

  const filteredReturns = returns.filter(r => {
    const matchesSearch = r.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.customer_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading return requests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <FiAlertCircle className={styles.errorIcon} />
        <h3>Error Loading Returns</h3>
        <p>{error}</p>
        <button onClick={fetchReturns} className={styles.retryBtn}>Try Again</button>
      </div>
    );
  }

  // Mobile UI
  if (isMobile) {
    return (
      <div className={styles.mobileAdminReturns}>
        <div className={styles.mobileHeader}>
          <h2>Return Requests</h2>
          <button onClick={fetchReturns} className={styles.refreshBtn}><FiRefreshCw /></button>
        </div>

        <div className={styles.mobileFilters}>
          <div className={styles.searchBox}>
            <FiSearch />
            <input
              type="text"
              placeholder="Search by order number or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status ({returns.length})</option>
            <option value="pending">Pending ({returns.filter(r => r.status === 'pending').length})</option>
            <option value="approved">Approved ({returns.filter(r => r.status === 'approved').length})</option>
            <option value="replacement">Replacement ({returns.filter(r => r.status === 'replacement').length})</option>
            <option value="refunded">Refunded ({returns.filter(r => r.status === 'refunded').length})</option>
            <option value="rejected">Rejected ({returns.filter(r => r.status === 'rejected').length})</option>
            <option value="completed">Completed ({returns.filter(r => r.status === 'completed').length})</option>
          </select>
        </div>

        {filteredReturns.length === 0 ? (
          <div className={styles.noResults}>
            <p>No return requests found</p>
          </div>
        ) : (
          <div className={styles.mobileReturnsList}>
            {filteredReturns.map(returnReq => (
              <div key={returnReq.id} className={styles.mobileReturnCard}>
                <div className={styles.mobileReturnHeader}>
                  <span className={styles.orderNumber}>#{returnReq.order_number}</span>
                  {getStatusBadge(returnReq.status)}
                </div>
                <div className={styles.mobileReturnCustomer}>
                  <strong>{returnReq.customer_name}</strong>
                  <span>{returnReq.customer_email}</span>
                </div>
                <div className={styles.mobileReturnReason}>
                  <span>Reason: {returnReq.reason}</span>
                </div>
                <button onClick={() => {
                  setSelectedReturn(returnReq);
                  setSelectedStatus(returnReq.status);
                  setShowModal(true);
                }} className={styles.mobileViewBtn}>
                  <FiEye /> View & Manage
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Mobile Modal */}
        {showModal && selectedReturn && (
          <div className={styles.mobileModal} onClick={() => setShowModal(false)}>
            <div className={styles.mobileModalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.mobileModalHeader}>
                <h3>Manage Return Request</h3>
                <button onClick={() => setShowModal(false)}>✕</button>
              </div>
              <div className={styles.mobileModalBody}>
                <div className={styles.detailRow}><strong>Order:</strong> #{selectedReturn.order_number}</div>
                <div className={styles.detailRow}><strong>Customer:</strong> {selectedReturn.customer_name}</div>
                <div className={styles.detailRow}><strong>Email:</strong> {selectedReturn.customer_email}</div>
                <div className={styles.detailRow}><strong>Phone:</strong> {selectedReturn.customer_phone}</div>
                <div className={styles.detailRow}><strong>Amount:</strong> ₹{selectedReturn.order_total}</div>
                <div className={styles.detailRow}><strong>Reason:</strong> {selectedReturn.reason}</div>
                <div className={styles.detailRow}><strong>Description:</strong> {selectedReturn.issue_description}</div>
                <div className={styles.detailRow}><strong>Resolution Preferred:</strong> {selectedReturn.resolution_preference}</div>
                {selectedReturn.images?.length > 0 && (
                  <div className={styles.images}>
                    <strong>Images:</strong>
                    <div className={styles.imagePreview}>
                      {selectedReturn.images.map((img, idx) => (
                        <img key={idx} src={img} alt="Return evidence" />
                      ))}
                    </div>
                  </div>
                )}
                
                <div className={styles.formGroup}>
                  <label>Update Status</label>
                  <select 
                    value={selectedStatus} 
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className={styles.statusSelect}
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Admin Message (will be sent to customer)</label>
                  <textarea
                    rows="3"
                    value={adminMessage}
                    onChange={(e) => setAdminMessage(e.target.value)}
                    placeholder="Add your response message here..."
                  />
                </div>
              </div>
              <div className={styles.mobileModalFooter}>
                <button 
                  onClick={() => updateReturnStatus(selectedReturn.id, 'rejected')} 
                  className={styles.rejectBtn} 
                  disabled={updating}
                >
                  <FiXCircle /> Reject
                </button>
                <button 
                  onClick={() => updateReturnStatus(selectedReturn.id, selectedStatus)} 
                  className={styles.approveBtn} 
                  disabled={updating || selectedStatus === selectedReturn.status}
                >
                  <FiCheckCircle /> Update Status
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop UI
  return (
    <div className={styles.adminReturns}>
      <div className={styles.header}>
        <h2>Return Requests</h2>
        <p>Manage customer return and refund requests ({returns.length} total)</p>
      </div>

      <div className={styles.filtersBar}>
        <div className={styles.searchBox}>
          <FiSearch />
          <input
            type="text"
            placeholder="Search by order number or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className={styles.filterGroup}>
          <FiFilter />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status ({returns.length})</option>
            <option value="pending">Pending ({returns.filter(r => r.status === 'pending').length})</option>
            <option value="approved">Approved ({returns.filter(r => r.status === 'approved').length})</option>
            <option value="replacement">Replacement ({returns.filter(r => r.status === 'replacement').length})</option>
            <option value="refunded">Refunded ({returns.filter(r => r.status === 'refunded').length})</option>
            <option value="rejected">Rejected ({returns.filter(r => r.status === 'rejected').length})</option>
            <option value="completed">Completed ({returns.filter(r => r.status === 'completed').length})</option>
            <option value="picked_up">Picked Up ({returns.filter(r => r.status === 'picked_up').length})</option>
          </select>
        </div>
        <button onClick={fetchReturns} className={styles.refreshDesktopBtn}>
          <FiRefreshCw /> Refresh
        </button>
      </div>

      {filteredReturns.length === 0 ? (
        <div className={styles.noResultsDesktop}>
          <p>No return requests found</p>
        </div>
      ) : (
        <div className={styles.returnsTable}>
          <table>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Reason</th>
                <th>Resolution</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredReturns.map(returnReq => (
                <tr key={returnReq.id}>
                  <td>#{returnReq.order_number}</td>
                  <td>
                    <div>{returnReq.customer_name}</div>
                    <small>{returnReq.customer_email}</small>
                  </td>
                  <td>{returnReq.reason}</td>
                  <td>{returnReq.resolution_preference}</td>
                  <td>{getStatusBadge(returnReq.status)}</td>
                  <td>{new Date(returnReq.created_at).toLocaleDateString()}</td>
                  <td>
                    <button onClick={() => {
                      setSelectedReturn(returnReq);
                      setSelectedStatus(returnReq.status);
                      setShowModal(true);
                    }} className={styles.viewBtn}>
                      <FiEye /> Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Desktop Modal */}
      {showModal && selectedReturn && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Manage Return Request</h3>
              <button onClick={() => setShowModal(false)} className={styles.closeBtn}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.infoGrid}>
                <div className={styles.infoCard}>
                  <h4>Order Information</h4>
                  <p><strong>Order #:</strong> #{selectedReturn.order_number}</p>
                  <p><strong>Amount:</strong> ₹{selectedReturn.order_total}</p>
                  <p><strong>Date:</strong> {new Date(selectedReturn.created_at).toLocaleString()}</p>
                  <p><strong>Address:</strong> {selectedReturn.order_address}</p>
                </div>
                <div className={styles.infoCard}>
                  <h4>Customer Information</h4>
                  <p><strong>Name:</strong> {selectedReturn.customer_name}</p>
                  <p><strong>Email:</strong> {selectedReturn.customer_email}</p>
                  <p><strong>Phone:</strong> {selectedReturn.customer_phone}</p>
                </div>
              </div>

              <div className={styles.infoCard}>
                <h4>Return Details</h4>
                <p><strong>Reason:</strong> {selectedReturn.reason}</p>
                <p><strong>Description:</strong> {selectedReturn.issue_description}</p>
                <p><strong>Resolution Preferred:</strong> {selectedReturn.resolution_preference}</p>
                {selectedReturn.images?.length > 0 && (
                  <div className={styles.images}>
                    <strong>Images ({selectedReturn.images.length}):</strong>
                    <div className={styles.imagePreview}>
                      {selectedReturn.images.map((img, idx) => (
                        <img key={idx} src={img} alt="Return evidence" />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.infoCard}>
                <h4>Update Status</h4>
                <select 
                  value={selectedStatus} 
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className={styles.statusSelect}
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.infoCard}>
                <h4>Admin Response</h4>
                <textarea
                  rows="3"
                  value={adminMessage}
                  onChange={(e) => setAdminMessage(e.target.value)}
                  placeholder="Add your response message here..."
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button onClick={() => updateReturnStatus(selectedReturn.id, 'rejected')} className={styles.rejectBtn} disabled={updating}>
                <FiXCircle /> Reject
              </button>
              <button 
                onClick={() => updateReturnStatus(selectedReturn.id, selectedStatus)} 
                className={styles.approveBtn} 
                disabled={updating || selectedStatus === selectedReturn.status}
              >
                <FiCheckCircle /> Update Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReturns;