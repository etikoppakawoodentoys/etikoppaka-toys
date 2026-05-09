import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { FiEye, FiFilter, FiSearch, FiDownload, FiCheckCircle, FiXCircle, FiClock, FiRefreshCw } from 'react-icons/fi';
import styles from './AdminBulkOrders.module.css';

const AdminBulkOrders = () => {
  const [bulkOrders, setBulkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchBulkOrders();
  }, []);

  const fetchBulkOrders = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First check if user is admin
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Please login to view bulk orders');
        setLoading(false);
        return;
      }

      // Check if user is admin
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (userError || !userData?.is_admin) {
        setError('Access denied. Admin privileges required.');
        setLoading(false);
        return;
      }

      // Fetch bulk orders - using a simpler query first
      const { data, error: fetchError } = await supabase
        .from('bulk_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Fetch error:', fetchError);
        setError(`Failed to fetch: ${fetchError.message}`);
        setBulkOrders([]);
      } else if (data) {
        console.log('Fetched bulk orders:', data.length);
        setBulkOrders(data);
      } else {
        setBulkOrders([]);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    setUpdating(true);
    
    try {
      const { error } = await supabase
        .from('bulk_orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) {
        console.error('Update error:', error);
        alert(`Failed to update status: ${error.message}`);
      } else {
        // Refresh the orders list
        await fetchBulkOrders();
        if (selectedOrder) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
      }
    } catch (err) {
      console.error('Update error:', err);
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'processing': return '#3B82F6';
      case 'quoted': return '#8B5CF6';
      case 'approved': return '#10B981';
      case 'completed': return '#059669';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <FiClock size={12} />;
      case 'processing': return <FiClock size={12} />;
      case 'approved': return <FiCheckCircle size={12} />;
      case 'completed': return <FiCheckCircle size={12} />;
      case 'cancelled': return <FiXCircle size={12} />;
      default: return <FiEye size={12} />;
    }
  };

  const filteredOrders = bulkOrders.filter(order => {
    if (!order) return false;
    const matchesSearch = (order.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                          (order.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                          (order.order_number?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                          (order.product_interest?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading bulk orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>⚠️</div>
        <h3>Error Loading Data</h3>
        <p>{error}</p>
        <button onClick={fetchBulkOrders} className={styles.retryBtn}>
          <FiRefreshCw /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={styles.adminBulkOrders}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2>Bulk Order Inquiries</h2>
          <p>Manage and respond to wholesale inquiries</p>
        </div>
        <button onClick={fetchBulkOrders} className={styles.refreshBtn} disabled={loading}>
          <FiRefreshCw /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className={styles.filtersBar}>
        <div className={styles.searchBox}>
          <FiSearch />
          <input
            type="text"
            placeholder="Search by name, email, order number or product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className={styles.filterGroup}>
          <FiFilter />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status ({bulkOrders.length})</option>
            <option value="pending">Pending ({bulkOrders.filter(o => o.status === 'pending').length})</option>
            <option value="processing">Processing ({bulkOrders.filter(o => o.status === 'processing').length})</option>
            <option value="quoted">Quoted ({bulkOrders.filter(o => o.status === 'quoted').length})</option>
            <option value="approved">Approved ({bulkOrders.filter(o => o.status === 'approved').length})</option>
            <option value="completed">Completed ({bulkOrders.filter(o => o.status === 'completed').length})</option>
            <option value="cancelled">Cancelled ({bulkOrders.filter(o => o.status === 'cancelled').length})</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className={styles.resultsCount}>
        Showing {filteredOrders.length} of {bulkOrders.length} inquiries
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📭</div>
          <h3>No bulk orders found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <div className={styles.ordersTable}>
          <table>
            <thead>
              <tr>
                <th>Inquiry #</th>
                <th>Customer</th>
                <th>Contact</th>
                <th>Product Interest</th>
                <th>Quantity</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td className={styles.orderNumber}>#{order.order_number || 'N/A'}</td>
                  <td>
                    <div className={styles.customerInfo}>
                      <strong>{order.full_name || 'N/A'}</strong>
                      {order.company_name && <small>{order.company_name}</small>}
                    </div>
                  </td>
                  <td>
                    <div>{order.email || 'N/A'}</div>
                    <small>{order.phone || 'N/A'}</small>
                  </td>
                  <td className={styles.productCell}>
                    {order.product_interest?.substring(0, 40) || 'N/A'}
                    {order.product_interest?.length > 40 && '...'}
                  </td>
                  <td>{order.quantity || 0} {order.quantity_unit || 'pieces'}</td>
                  <td>
                    <span 
                      className={styles.statusBadge} 
                      style={{ background: getStatusColor(order.status) + '20', color: getStatusColor(order.status) }}
                    >
                      {getStatusIcon(order.status)} {order.status?.toUpperCase() || 'PENDING'}
                    </span>
                  </td>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  <td>
                    <button 
                      className={styles.viewBtn}
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowModal(true);
                      }}
                    >
                      <FiEye /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View Order Modal */}
      {showModal && selectedOrder && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Bulk Order Details</h3>
              <button onClick={() => setShowModal(false)} className={styles.closeBtn}>×</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.orderInfo}>
                <div className={styles.infoRow}>
                  <label>Order Number:</label>
                  <span>#{selectedOrder.order_number}</span>
                </div>
                <div className={styles.infoRow}>
                  <label>Date:</label>
                  <span>{new Date(selectedOrder.created_at).toLocaleString()}</span>
                </div>
                <div className={styles.infoRow}>
                  <label>Status:</label>
                  <select 
                    value={selectedOrder.status} 
                    onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
                    className={styles.statusSelect}
                    disabled={updating}
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="quoted">Quoted</option>
                    <option value="approved">Approved</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className={styles.customerSection}>
                <h4>Customer Information</h4>
                <div className={styles.infoRow}><label>Name:</label><span>{selectedOrder.full_name}</span></div>
                <div className={styles.infoRow}><label>Email:</label><span>{selectedOrder.email}</span></div>
                <div className={styles.infoRow}><label>Phone:</label><span>{selectedOrder.phone}</span></div>
                {selectedOrder.company_name && (
                  <div className={styles.infoRow}><label>Company:</label><span>{selectedOrder.company_name}</span></div>
                )}
                {selectedOrder.gst_number && (
                  <div className={styles.infoRow}><label>GST:</label><span>{selectedOrder.gst_number}</span></div>
                )}
              </div>

              <div className={styles.orderSection}>
                <h4>Order Requirements</h4>
                <div className={styles.infoRow}><label>Product Interest:</label><span>{selectedOrder.product_interest}</span></div>
                <div className={styles.infoRow}><label>Quantity:</label><span>{selectedOrder.quantity} {selectedOrder.quantity_unit}</span></div>
                {selectedOrder.budget_range && (
                  <div className={styles.infoRow}><label>Budget Range:</label><span>{selectedOrder.budget_range}</span></div>
                )}
                {selectedOrder.expected_delivery_date && (
                  <div className={styles.infoRow}><label>Expected Delivery:</label><span>{new Date(selectedOrder.expected_delivery_date).toLocaleDateString()}</span></div>
                )}
                {selectedOrder.additional_requirements && (
                  <div className={styles.infoRow}><label>Additional Requirements:</label><span>{selectedOrder.additional_requirements}</span></div>
                )}
              </div>

              {selectedOrder.admin_notes && (
                <div className={styles.adminNotes}>
                  <h4>Admin Notes</h4>
                  <p>{selectedOrder.admin_notes}</p>
                </div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.respondBtn}
                onClick={() => window.open(`mailto:${selectedOrder.email}?subject=Bulk Order Inquiry #${selectedOrder.order_number}`, '_blank')}
              >
                Respond via Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBulkOrders;