import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { sendOrderStatusUpdate } from '../services/emailService';
import { 
  FiPackage, 
  FiTruck, 
  FiCheckCircle, 
  FiClock, 
  FiEye, 
  FiRefreshCw,
  FiXCircle,
  FiUser,
  FiMapPin,
  FiMail,
  FiPhone,
  FiShoppingBag,
  FiDollarSign,
  FiSearch,
  FiFilter,
  FiCreditCard,
  FiAlertCircle
} from 'react-icons/fi';
import styles from './AdminOrders.module.css';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showStatusPopup, setShowStatusPopup] = useState(false);
  const [selectedOrderForStatus, setSelectedOrderForStatus] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [customersMap, setCustomersMap] = useState({});

  const statuses = [
    { value: 'pending', label: 'Pending', icon: <FiClock />, color: '#F59E0B', bg: '#FEF3C7' },
    { value: 'accepted', label: 'Accepted', icon: <FiCheckCircle />, color: '#10B981', bg: '#D1FAE5' },
    { value: 'shipped', label: 'Shipped', icon: <FiPackage />, color: '#3B82F6', bg: '#DBEAFE' },
    { value: 'transit', label: 'In Transit', icon: <FiTruck />, color: '#8B5CF6', bg: '#EDE9FE' },
    { value: 'out_for_delivery', label: 'Out for Delivery', icon: <FiTruck />, color: '#EC4899', bg: '#FCE7F3' },
    { value: 'delivered', label: 'Delivered', icon: <FiCheckCircle />, color: '#059669', bg: '#D1FAE5' },
    { value: 'cancelled', label: 'Cancelled', icon: <FiXCircle />, color: '#EF4444', bg: '#FEE2E2' }
  ];

  const paymentStatuses = {
    'pending': { label: 'Pending', color: '#F59E0B', bg: '#FEF3C7', icon: <FiClock /> },
    'initiated': { label: 'Initiated', color: '#3B82F6', bg: '#DBEAFE', icon: <FiRefreshCw /> },
    'paid': { label: 'Paid', color: '#10B981', bg: '#D1FAE5', icon: <FiCheckCircle /> },
    'failed': { label: 'Failed', color: '#EF4444', bg: '#FEE2E2', icon: <FiXCircle /> },
    'refunded': { label: 'Refunded', color: '#8B5CF6', bg: '#EDE9FE', icon: <FiRefreshCw /> },
    'cod': { label: 'COD', color: '#1F5B3A', bg: '#E8F5E9', icon: <FiDollarSign /> }
  };

  useEffect(() => {
    fetchOrders();
    
    // Real-time subscription for orders - LISTENS FOR PAYMENT UPDATES
    const ordersSubscription = supabase
      .channel('orders-channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' }, 
        (payload) => {
          console.log('Real-time order update:', payload);
          fetchOrders(); // Refresh orders when any change happens
          
          // Show notification for payment updates
          if (payload.new && payload.old?.payment_status !== payload.new.payment_status) {
            setMessage({ 
              type: 'success', 
              text: `Payment status updated for Order #${payload.new.order_number}: ${payload.new.payment_status?.toUpperCase()}` 
            });
            setTimeout(() => setMessage(''), 5000);
          }
        }
      )
      .subscribe();

    // Real-time subscription for razorpay_payments table
    const paymentsSubscription = supabase
      .channel('payments-channel')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'razorpay_payments' }, 
        (payload) => {
          console.log('New payment received:', payload);
          fetchOrders(); // Refresh orders when new payment is recorded
          setMessage({ 
            type: 'success', 
            text: `💰 New payment received! Payment ID: ${payload.new.razorpay_payment_id?.substring(0, 10)}...` 
          });
          setTimeout(() => setMessage(''), 5000);
        }
      )
      .subscribe();

    return () => {
      ordersSubscription.unsubscribe();
      paymentsSubscription.unsubscribe();
    };
  }, []);

  const fetchOrders = async () => {
    try {
      // Fetch all orders with order_items and payment details
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          user_id,
          total_amount,
          status,
          status_history,
          shipping_address,
          payment_method,
          payment_status,
          razorpay_order_id,
          razorpay_payment_id,
          created_at,
          updated_at,
          order_items (
            id,
            product_id,
            product_name,
            quantity,
            price,
            size
          )
        `)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      if (ordersData && ordersData.length > 0) {
        // Get unique user IDs
        const userIds = [...new Set(ordersData.map(order => order.user_id))];
        
        // Fetch all users in one query
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, name, email, mobile')
          .in('id', userIds);

        if (usersError) throw usersError;

        // Create a map of user data
        const usersMap = {};
        usersData?.forEach(user => {
          usersMap[user.id] = user;
        });
        setCustomersMap(usersMap);

        // Combine orders with user data
        const ordersWithUsers = ordersData.map(order => ({
          ...order,
          users: usersMap[order.user_id] || { name: 'N/A', email: 'N/A', mobile: 'N/A' }
        }));

        setOrders(ordersWithUsers);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setMessage({ type: 'error', text: 'Failed to fetch orders' });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatusValue) => {
    setUpdating(true);
    
    const order = orders.find(o => o.id === orderId);
    let currentHistory = order.status_history || [];
    
    if (typeof currentHistory === 'string') {
      try {
        currentHistory = JSON.parse(currentHistory);
      } catch(e) {
        currentHistory = [];
      }
    }
    
    const newHistory = [...currentHistory, {
      status: newStatusValue,
      timestamp: new Date().toISOString(),
      note: `Order status updated to ${newStatusValue.replace(/_/g, ' ')}`
    }];

    const { error } = await supabase
      .from('orders')
      .update({ 
        status: newStatusValue,
        status_history: JSON.stringify(newHistory),
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (error) {
      setMessage({ type: 'error', text: 'Failed to update order status' });
    } else {
      setMessage({ type: 'success', text: `Order status updated to ${newStatusValue.replace(/_/g, ' ')}` });
      
      // Send email notification to customer
      const emailSent = await sendOrderStatusUpdate(
        order.order_number,
        newStatusValue,
        order.users?.email,
        order.users?.name || 'Customer',
        order.total_amount,
        order.shipping_address
      );
      
      console.log('Status update email sent:', emailSent ? 'Success' : 'Failed');
      
      fetchOrders();
      setShowStatusPopup(false);
      setSelectedOrderForStatus(null);
      setNewStatus('');
    }
    setUpdating(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const getStatusBadge = (status) => {
    const config = statuses.find(s => s.value === status) || statuses[0];
    return (
      <span className={styles.statusBadge} style={{ background: config.bg, color: config.color }}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const getPaymentBadge = (paymentStatus, paymentMethod) => {
    const config = paymentStatuses[paymentStatus] || paymentStatuses['pending'];
    return (
      <span className={styles.paymentBadge} style={{ background: config.bg, color: config.color }}>
        {config.icon}
        {paymentMethod === 'RAZORPAY' ? `💰 ${config.label}` : `📦 ${config.label} (${paymentMethod})`}
      </span>
    );
  };

  const getStatusClass = (status) => {
    return styles[status] || styles.pending;
  };

  const filteredOrders = orders.filter(order => {
    if (filter !== 'all' && order.status !== filter) return false;
    if (searchTerm) {
      return order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             order.users?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             order.users?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             order.razorpay_payment_id?.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    paid: orders.filter(o => o.payment_status === 'paid').length,
    cod: orders.filter(o => o.payment_method === 'COD' && o.payment_status !== 'paid').length
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.adminOrders}>
      {/* Header */}
      <div className={styles.header}>
        <h2>Order Management</h2>
        <div className={styles.headerStats}>
          <div className={styles.statChip}>
            <FiShoppingBag />
            <span>Total: {stats.total}</span>
          </div>
          <div className={styles.statChip} style={{ background: '#FEF3C7', color: '#F59E0B' }}>
            <FiClock />
            <span>Pending: {stats.pending}</span>
          </div>
          <div className={styles.statChip} style={{ background: '#D1FAE5', color: '#1F5B3A' }}>
            <FiCheckCircle />
            <span>Delivered: {stats.delivered}</span>
          </div>
          <div className={styles.statChip} style={{ background: '#FEE2E2', color: '#9E1B1B' }}>
            <FiXCircle />
            <span>Cancelled: {stats.cancelled}</span>
          </div>
          <div className={styles.statChip} style={{ background: '#DBEAFE', color: '#3B82F6' }}>
            <FiCreditCard />
            <span>Paid: {stats.paid}</span>
          </div>
          <div className={styles.statChip} style={{ background: '#E8F5E9', color: '#1F5B3A' }}>
            <FiDollarSign />
            <span>COD: {stats.cod}</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className={styles.filtersBar}>
        <div className={styles.searchBox}>
          <FiSearch />
          <input
            type="text"
            placeholder="Search by order ID, customer, email, or payment ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className={styles.filterDropdown}>
          <FiFilter />
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Orders</option>
            {statuses.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
        </div>
      </div>

      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      {/* Orders Grid */}
      <div className={styles.ordersGrid}>
        {filteredOrders.map((order) => (
          <div key={order.id} className={styles.orderCard}>
            <div className={styles.orderCardHeader}>
              <div className={styles.orderInfo}>
                <span className={styles.orderNumber}>#{order.order_number}</span>
                <span className={styles.orderDate}>
                  {new Date(order.created_at).toLocaleString()}
                </span>
              </div>
              <div className={styles.badgeGroup}>
                {getStatusBadge(order.status)}
                {getPaymentBadge(order.payment_status, order.payment_method)}
              </div>
            </div>

            <div className={styles.orderCardBody}>
              {/* Payment Details Section - NEW */}
              {order.payment_method === 'RAZORPAY' && order.razorpay_payment_id && (
                <div className={styles.paymentSection}>
                  <div className={styles.sectionTitle}>
                    <FiCreditCard />
                    <h4>Payment Details</h4>
                  </div>
                  <div className={styles.paymentDetails}>
                    <p><strong>Payment ID:</strong> <code>{order.razorpay_payment_id}</code></p>
                    <p><strong>Order ID:</strong> <code>{order.razorpay_order_id}</code></p>
                    <p><strong>Status:</strong> {getPaymentBadge(order.payment_status, order.payment_method)}</p>
                    <p><strong>Amount:</strong> ₹{order.total_amount}</p>
                  </div>
                </div>
              )}

              <div className={styles.customerSection}>
                <div className={styles.sectionTitle}>
                  <FiUser />
                  <h4>Customer Details</h4>
                </div>
                <div className={styles.customerDetails}>
                  <p><strong>Name:</strong> {order.users?.name || 'N/A'}</p>
                  <p><FiMail /> {order.users?.email || 'N/A'}</p>
                  <p><FiPhone /> {order.users?.mobile || 'N/A'}</p>
                  <p><FiMapPin /> {order.shipping_address}</p>
                </div>
              </div>

              <div className={styles.itemsSection}>
                <div className={styles.sectionTitle}>
                  <FiShoppingBag />
                  <h4>Order Items</h4>
                </div>
                <div className={styles.itemsList}>
                  {order.order_items?.map(item => (
                    <div key={item.id} className={styles.orderItem}>
                      <span className={styles.itemName}>{item.product_name}</span>
                      <span className={styles.itemQty}>x{item.quantity}</span>
                      <span className={styles.itemPrice}>₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.orderTotal}>
                  <FiDollarSign />
                  <strong>Total Amount:</strong>
                  <span>₹{order.total_amount}</span>
                </div>
              </div>

              <div className={styles.actionsSection}>
                <button 
                  className={styles.viewBtn}
                  onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
                >
                  <FiEye />
                  {selectedOrder === order.id ? 'Hide Details' : 'View Details'}
                </button>
                <button 
                  className={styles.updateBtn}
                  onClick={() => {
                    setSelectedOrderForStatus(order);
                    setShowStatusPopup(true);
                  }}
                  disabled={order.status === 'delivered' || order.status === 'cancelled'}
                >
                  <FiRefreshCw />
                  Update Status
                </button>
              </div>

              {selectedOrder === order.id && (
                <div className={styles.historySection}>
                  <div className={styles.sectionTitle}>
                    <FiClock />
                    <h4>Status History</h4>
                  </div>
                  <div className={styles.timeline}>
                    {(() => {
                      let historyArray = order.status_history || [];
                      if (typeof historyArray === 'string') {
                        try {
                          historyArray = JSON.parse(historyArray);
                        } catch(e) {
                          historyArray = [];
                        }
                      }
                      return historyArray.length > 0 ? (
                        historyArray.map((update, idx) => (
                          <div key={idx} className={styles.timelineItem}>
                            <div className={`${styles.timelineDot} ${getStatusClass(update.status)}`} />
                            <div className={styles.timelineContent}>
                              <div className={styles.timelineHeader}>
                                <span className={styles.timelineStatus}>
                                  {update.status?.toUpperCase().replace(/_/g, ' ') || 'Updated'}
                                </span>
                                <span className={styles.timelineDate}>
                                  {new Date(update.timestamp).toLocaleString()}
                                </span>
                              </div>
                              {update.note && <p className={styles.timelineNote}>{update.note}</p>}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className={styles.noHistory}>No status history available</div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredOrders.length === 0 && !loading && (
        <div className={styles.noOrders}>
          <p>No orders found</p>
        </div>
      )}

      {/* Status Update Popup */}
      {showStatusPopup && selectedOrderForStatus && (
        <div className={styles.popupOverlay} onClick={() => setShowStatusPopup(false)}>
          <div className={styles.popupContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.popupHeader}>
              <h3>Update Order Status</h3>
              <button onClick={() => setShowStatusPopup(false)} className={styles.popupClose}>✕</button>
            </div>
            <div className={styles.popupBody}>
              <p>Order #: <strong>{selectedOrderForStatus.order_number}</strong></p>
              <p>Current Status: {getStatusBadge(selectedOrderForStatus.status)}</p>
              <p>Payment Status: {getPaymentBadge(selectedOrderForStatus.payment_status, selectedOrderForStatus.payment_method)}</p>
              <div className={styles.statusOptions}>
                <label>Select New Status</label>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                  <option value="">Select status</option>
                  {statuses.map(status => (
                    <option key={status.value} value={status.value} disabled={status.value === selectedOrderForStatus.status}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className={styles.popupFooter}>
              <button onClick={() => setShowStatusPopup(false)} className={styles.cancelBtn}>Cancel</button>
              <button 
                onClick={() => updateOrderStatus(selectedOrderForStatus.id, newStatus)}
                disabled={!newStatus || updating}
                className={styles.confirmBtn}
              >
                {updating ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;