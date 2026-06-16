import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { sendOrderStatusUpdate } from '../services/emailService';
import { 
  FiPackage, FiTruck, FiCheckCircle, FiClock, FiEye, FiRefreshCw,
  FiXCircle, FiUser, FiMapPin, FiMail, FiPhone, FiShoppingBag,
  FiDollarSign, FiSearch, FiFilter, FiCreditCard, FiAlertCircle, FiGift,
  FiDownload
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

    const ordersSubscription = supabase
      .channel('admin-orders-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        fetchOrders();
        if (payload.new && payload.old?.payment_status !== payload.new.payment_status) {
          setMessage({ type: 'success', text: `Payment status updated for Order #${payload.new.order_number}: ${payload.new.payment_status?.toUpperCase()}` });
          setTimeout(() => setMessage(''), 5000);
        }
      })
      .subscribe();

    const paymentsSubscription = supabase
      .channel('admin-payments-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'razorpay_payments' }, (payload) => {
        fetchOrders();
        setMessage({ type: 'success', text: `💰 New payment received! Payment ID: ${payload.new.razorpay_payment_id?.substring(0, 10)}...` });
        setTimeout(() => setMessage(''), 5000);
      })
      .subscribe();

    return () => {
      ordersSubscription.unsubscribe();
      paymentsSubscription.unsubscribe();
    };
  }, []);

  const fetchOrders = async () => {
    try {
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
            hamper_id,
            item_type,
            product_name,
            quantity,
            price,
            size,
            gift_packing,
            gift_quote,
            gift_charge
          )
        `)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      if (ordersData && ordersData.length > 0) {
        const userIds = [...new Set(ordersData.map(order => order.user_id))];
        const { data: usersData, error: usersError } = await supabase
          .from('users').select('id, name, email, mobile').in('id', userIds);
        if (usersError) throw usersError;

        const usersMap = {};
        usersData?.forEach(user => { usersMap[user.id] = user; });
        setCustomersMap(usersMap);

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

  // Invoice download function (copied from Orders.jsx)
  const downloadInvoiceAsPDF = async (order) => {
  const logoUrl = '/logo1.png';
  const giftItems = order.order_items?.filter(item => item.gift_packing && item.item_type !== 'hamper') || [];
  const hamperItems = order.order_items?.filter(item => item.item_type === 'hamper') || [];
  const giftCharges = order.order_items?.reduce((sum, item) => sum + (item.gift_charge || 0), 0) || 0;
  const deliveryCharge = getDeliveryCharge(order);
  const subtotal = order.total_amount - giftCharges - deliveryCharge;

  const getPaymentLabel = () => {
    if (order.payment_method === 'RAZORPAY') return 'Online Payment (Razorpay)';
    if (order.payment_method === 'COD') return 'Cash on Delivery';
    return order.payment_method || 'Cash on Delivery';
  };

  const isDelivered = order.status === 'delivered';
  const isPaid = order.payment_status === 'paid' || isDelivered;
  const paymentLabel = getPaymentLabel();
  const paymentStatusText = isPaid ? 'PAID' : (order.payment_method === 'COD' ? 'COD PENDING' : 'PENDING');
  const paymentStatusColor = isPaid ? '#10B981' : '#F59E0B';

  const invoiceHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Invoice ${order.order_number}</title><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Georgia','Times New Roman',Arial,sans-serif;background:#F8F2E8;padding:20px;font-size:12px}
    .invoice-container{max-width:700px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.1)}
    .invoice-header{background:linear-gradient(135deg,#1F5B3A,#15452B);padding:20px;text-align:center;color:white}
    .logo{display:flex;align-items:center;justify-content:center;gap:12px}
    .logo-img{width:50px;height:50px;object-fit:contain;background:white;border-radius:50%;padding:6px}
    .logo-text h1{font-size:20px;margin:0}
    .logo-text p{font-size:9px;opacity:0.9;margin-top:2px}
    .invoice-title{margin-top:10px;font-size:18px;font-weight:bold;letter-spacing:1px}
    .invoice-body{padding:20px}
    .order-info{background:#F8F2E8;padding:12px;border-radius:10px;margin-bottom:20px;display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
    .info-item{display:flex;flex-direction:column}
    .info-label{font-size:10px;color:#7A6B5A;margin-bottom:3px}
    .info-value{font-size:11px;font-weight:600;color:#3E2A1F;word-break:break-word}
    table{width:100%;border-collapse:collapse;margin-bottom:20px}
    th{background:#1F5B3A;color:white;padding:8px;text-align:left;font-size:10px}
    td{padding:8px;border-bottom:1px solid #E8DCC8;font-size:10px}
    .gift-row{background:#FEF8F0}
    .hamper-row{background:#E8F5E9}
    .gift-message{font-size:9px;color:#C89B3C;margin-top:3px;font-style:italic}
    .hamper-badge{font-size:8px;color:#1F5B3A;margin-top:3px}
    .total-section{text-align:right;padding:12px;background:#F8F2E8;border-radius:10px;margin-top:15px}
    .total-row{display:flex;justify-content:flex-end;gap:15px;margin-bottom:5px;font-size:11px}
    .total-amount{font-size:18px;font-weight:bold;color:#9E1B1B}
    .delivery-free{color:#10B981;font-weight:bold}
    .delivery-charge{color:#D97706}
    .gift-summary{margin-top:15px;padding:10px;background:#FEF8F0;border-radius:10px;border-left:3px solid #D9B382}
    .gift-summary-title{font-size:11px;font-weight:bold;color:#3E2A1F;margin-bottom:8px;display:flex;align-items:center;gap:5px}
    .gift-summary-item{font-size:9px;color:#7A6B5A;margin-bottom:5px;padding-left:10px}
    .gift-quote{color:#C89B3C;font-style:italic}
    .payment-info{margin-top:15px;padding:10px;border-radius:10px;text-align:center;background:${isPaid ? '#D1FAE5' : '#FEF3C7'};font-size:10px}
    .footer{background:#3E2A1F;color:#E8DCC8;padding:12px;text-align:center;font-size:9px}
    .handcrafted{text-align:center;margin-top:15px;padding-top:8px;border-top:1px dashed #C89B3C;font-size:9px;color:#C89B3C}
    .payment-badge{display:inline-block;padding:2px 8px;border-radius:12px;font-size:9px;font-weight:bold;background:${paymentStatusColor};color:white}
    .delivery-note{margin-top:10px;padding:8px;background:#FEF8F0;border-radius:8px;font-size:9px;color:#1F5B3A;text-align:center}
    @media print{
      body{padding:0;background:white}
      .invoice-container{box-shadow:none;margin:0;border-radius:0}
      .invoice-header{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      th{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .footer{-webkit-print-color-adjust:exact;print-color-adjust:exact}
    }
  </style></head><body>
    <div class="invoice-container">
      <div class="invoice-header">
        <div class="logo">
          <img src="${logoUrl}" alt="Logo" class="logo-img" onerror="this.style.display='none'">
          <div class="logo-text">
            <h1>Etikoppaka Toys</h1>
            <p>Traditional Handcrafted Wooden Toys | Since 1985</p>
          </div>
        </div>
        <div class="invoice-title">TAX INVOICE</div>
      </div>
      <div class="invoice-body">
        <div class="order-info">
          <div class="info-item"><span class="info-label">Order Number</span><span class="info-value">#${order.order_number}</span></div>
          <div class="info-item"><span class="info-label">Order Date</span><span class="info-value">${new Date(order.created_at).toLocaleDateString('en-IN')}</span></div>
          <div class="info-item"><span class="info-label">Payment Method</span><span class="info-value">${paymentLabel}</span></div>
          <div class="info-item"><span class="info-label">Payment Status</span><span class="info-value"><span class="payment-badge">${paymentStatusText}</span></span></div>
          <div class="info-item"><span class="info-label">Order Status</span><span class="info-value">${order.status.toUpperCase().replace(/_/g, ' ')}</span></div>
          <div class="info-item"><span class="info-label">Shipping Address</span><span class="info-value">${order.shipping_address || 'Address provided'}</span></div>
        </div>
        <table>
          <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
          <tbody>${order.order_items && order.order_items.map(item => {
            const isHamper = item.item_type === 'hamper';
            const rowClass = isHamper ? 'hamper-row' : (item.gift_packing ? 'gift-row' : '');
            const badge = isHamper
              ? '<div class="hamper-badge">🎁 Gift Hamper</div>'
              : item.gift_packing
                ? '<div style="font-size:8px;color:#D9B382;margin-top:3px;">🎁 Gift Packed</div>'
                : '';
            const quoteHtml = (!isHamper && item.gift_quote)
              ? `<div class="gift-message">💬 "${item.gift_quote.substring(0, 60)}"</div>`
              : '';
            return `<tr class="${rowClass}"><td style="word-break:break-word;">${item.product_name}${badge}${quoteHtml}</td><td style="text-align:center">x${item.quantity}</td><td style="text-align:right">₹${item.price}</td><td style="text-align:right">₹${(item.price * item.quantity) + (item.gift_charge || 0)}</td></tr>`;
          }).join('')}</tbody>
        </table>
        ${giftItems.length > 0 ? `<div class="gift-summary"><div class="gift-summary-title"><span>🎁</span> Gift Messages</div>${giftItems.map(item => `<div class="gift-summary-item"><strong>${item.product_name}:</strong> <span class="gift-quote">"${item.gift_quote || 'No message added'}"</span></div>`).join('')}</div>` : ''}
        <div class="total-section">
          <div class="total-row"><strong>Subtotal:</strong><span>₹${subtotal}</span></div>
          ${giftCharges > 0 ? `<div class="total-row"><strong>Gift Packing:</strong><span>₹${giftCharges}</span></div>` : ''}
          <div class="total-row"><strong>Delivery Fee:</strong><span>${deliveryCharge === 0 ? '<span class="delivery-free">FREE</span>' : `<span class="delivery-charge">₹${deliveryCharge}</span>`}</span></div>
          <div class="total-row"><strong>Total Amount:</strong><span class="total-amount">₹${order.total_amount}</span></div>
        </div>
        <div class="payment-info"><strong>${paymentLabel === 'Online Payment (Razorpay)' ? '✅ Payment Confirmed' : '💰 Pay on Delivery'}</strong>${order.payment_method === 'RAZORPAY' && order.razorpay_payment_id ? `<p style="margin-top:5px;">Transaction ID: ${order.razorpay_payment_id.substring(0, 20)}</p>` : ''}</div>
        ${isDelivered ? '<div class="delivery-note">🎁 Your order has been delivered. Thank you for shopping with us!</div>' : ''}
        <div class="handcrafted">✨ Each piece is handcrafted with natural colors & sustainable wood ✨</div>
      </div>
      <div class="footer">
        <p>📍 Etikoppaka, Visakhapatnam, AP - 531082 | 📞 +91 9154884214</p>
        <p>© ${new Date().getFullYear()} Etikoppaka Toys. Thank you for supporting traditional craftsmanship!</p>
      </div>
    </div>
  </body></html>`;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(invoiceHtml);
  printWindow.document.close();
  printWindow.print();
};
  const updateOrderStatus = async (orderId, newStatusValue) => {
    setUpdating(true);
    const order = orders.find(o => o.id === orderId);
    let currentHistory = order.status_history || [];
    if (typeof currentHistory === 'string') {
      try { currentHistory = JSON.parse(currentHistory); } catch(e) { currentHistory = []; }
    }
    const newHistory = [...currentHistory, {
      status: newStatusValue,
      timestamp: new Date().toISOString(),
      note: `Order status updated to ${newStatusValue.replace(/_/g, ' ')}`
    }];

    const { error } = await supabase
      .from('orders')
      .update({ status: newStatusValue, status_history: JSON.stringify(newHistory), updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (error) {
      setMessage({ type: 'error', text: 'Failed to update order status' });
    } else {
      setMessage({ type: 'success', text: `Order status updated to ${newStatusValue.replace(/_/g, ' ')}` });
      await sendOrderStatusUpdate(order.order_number, newStatusValue, order.users?.email, order.users?.name || 'Customer', order.total_amount, order.shipping_address);
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
        {config.icon}{config.label}
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

  const getStatusClass = (status) => styles[status] || styles.pending;

  // ── Helpers ──────────────────────────────────────────────────────────────
  const getGiftItems = (orderItems) =>
    orderItems?.filter(item => item.gift_packing && item.item_type !== 'hamper') || [];

  const getHamperItems = (orderItems) =>
    orderItems?.filter(item => item.item_type === 'hamper') || [];

  const getProductItems = (orderItems) =>
    orderItems?.filter(item => item.item_type !== 'hamper') || [];

  const orderHasGifts = (order) =>
    getGiftItems(order.order_items).length > 0;

  const orderHasHampers = (order) =>
    getHamperItems(order.order_items).length > 0;

  const orderGiftCharge = (order) =>
    order.order_items?.reduce((sum, item) => sum + (item.gift_charge || 0), 0) || 0;

  const getDeliveryCharge = (order) => {
    if (order.delivery_charge !== undefined && order.delivery_charge !== null) {
      return order.delivery_charge;
    }
    const giftCharges = orderGiftCharge(order);
    const subtotal = order.total_amount - giftCharges;
    return subtotal >= 499 ? 0 : 70;
  };
  // ────────────────────────────────────────────────────────────────────────

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
    cod: orders.filter(o => o.payment_method === 'COD' && o.payment_status !== 'paid').length,
    gift: orders.filter(o => orderHasGifts(o)).length,
    hamper: orders.filter(o => orderHasHampers(o)).length,
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
          <div className={styles.statChip}><FiShoppingBag /><span>Total: {stats.total}</span></div>
          <div className={styles.statChip} style={{ background: '#FEF3C7', color: '#F59E0B' }}><FiClock /><span>Pending: {stats.pending}</span></div>
          <div className={styles.statChip} style={{ background: '#D1FAE5', color: '#1F5B3A' }}><FiCheckCircle /><span>Delivered: {stats.delivered}</span></div>
          <div className={styles.statChip} style={{ background: '#FEE2E2', color: '#9E1B1B' }}><FiXCircle /><span>Cancelled: {stats.cancelled}</span></div>
          <div className={styles.statChip} style={{ background: '#DBEAFE', color: '#3B82F6' }}><FiCreditCard /><span>Paid: {stats.paid}</span></div>
          <div className={styles.statChip} style={{ background: '#E8F5E9', color: '#1F5B3A' }}><FiDollarSign /><span>COD: {stats.cod}</span></div>
          <div className={styles.statChip} style={{ background: '#FEF3C7', color: '#C89B3C' }}><FiGift /><span>Gift Orders: {stats.gift}</span></div>
          <div className={styles.statChip} style={{ background: '#D1FAE5', color: '#059669' }}><FiGift /><span>Hamper Orders: {stats.hamper}</span></div>
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
        <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>
      )}

      {/* Orders Grid */}
      <div className={styles.ordersGrid}>
        {filteredOrders.map((order) => {
          const hasGifts = orderHasGifts(order);
          const hasHampers = orderHasHampers(order);
          const giftCharge = orderGiftCharge(order);
          const deliveryCharge = getDeliveryCharge(order);
          const giftItems = getGiftItems(order.order_items);
          const hamperItems = getHamperItems(order.order_items);
          const productItems = getProductItems(order.order_items);

          return (
            <div
              key={order.id}
              className={`${styles.orderCard} ${hasGifts ? styles.giftOrder : ''} ${hasHampers ? styles.hamperOrder : ''}`}
            >
              <div className={styles.orderCardHeader}>
                <div className={styles.orderInfo}>
                  <span className={styles.orderNumber}>#{order.order_number}</span>
                  <span className={styles.orderDate}>{new Date(order.created_at).toLocaleString()}</span>
                </div>
                <div className={styles.badgeGroup}>
                  {getStatusBadge(order.status)}
                  {getPaymentBadge(order.payment_status, order.payment_method)}
                  {hasGifts && (
                    <span className={styles.giftBadge}><FiGift /> Gift Order</span>
                  )}
                  {hasHampers && (
                    <span className={styles.hamperBadge}><FiGift /> Has Hamper</span>
                  )}
                </div>
              </div>

              <div className={styles.orderCardBody}>
                {/* Payment Details */}
                {order.payment_method === 'RAZORPAY' && order.razorpay_payment_id && (
                  <div className={styles.paymentSection}>
                    <div className={styles.sectionTitle}><FiCreditCard /><h4>Payment Details</h4></div>
                    <div className={styles.paymentDetails}>
                      <p><strong>Payment ID:</strong> <code>{order.razorpay_payment_id}</code></p>
                      <p><strong>Order ID:</strong> <code>{order.razorpay_order_id}</code></p>
                      <p><strong>Status:</strong> {getPaymentBadge(order.payment_status, order.payment_method)}</p>
                      <p><strong>Amount:</strong> ₹{order.total_amount}</p>
                    </div>
                  </div>
                )}

                {/* Customer Details */}
                <div className={styles.customerSection}>
                  <div className={styles.sectionTitle}><FiUser /><h4>Customer Details</h4></div>
                  <div className={styles.customerDetails}>
                    <p><strong>Name:</strong> {order.users?.name || 'N/A'}</p>
                    <p><FiMail /> {order.users?.email || 'N/A'}</p>
                    <p><FiPhone /> {order.users?.mobile || 'N/A'}</p>
                    <p><FiMapPin /> {order.shipping_address}</p>
                  </div>
                </div>

                {/* Order Items */}
                <div className={styles.itemsSection}>
                  <div className={styles.sectionTitle}><FiShoppingBag /><h4>Order Items</h4></div>
                  <div className={styles.itemsList}>

                    {/* Regular product items */}
                    {productItems.map(item => (
                      <div key={item.id} className={`${styles.orderItem} ${item.gift_packing ? styles.giftItem : ''}`}>
                        <span className={styles.itemName}>
                          {item.product_name}
                          {item.gift_packing && (
                            <span className={styles.giftItemBadge}><FiGift /> Gift Packed</span>
                          )}
                        </span>
                        <span className={styles.itemQty}>x{item.quantity}</span>
                        <span className={styles.itemPrice}>
                          ₹{item.price * item.quantity + (item.gift_charge || 0)}
                        </span>
                      </div>
                    ))}

                    {/* Hamper items — shown in a distinct section */}
                    {hamperItems.length > 0 && (
                      <div className={styles.hamperItemsSection}>
                        <p className={styles.hamperItemsTitle}><FiGift /> Gift Hampers</p>
                        {hamperItems.map(item => (
                          <div key={item.id} className={`${styles.orderItem} ${styles.hamperItem}`}>
                            <span className={styles.itemName}>
                              {item.product_name}
                              <span className={styles.hamperItemBadge}>🎁 Hamper</span>
                            </span>
                            <span className={styles.itemQty}>x{item.quantity}</span>
                            <span className={styles.itemPrice}>₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Gift messages panel — product gifts only */}
                  {hasGifts && (
                    <div className={styles.adminGiftBox}>
                      <p className={styles.adminGiftTitle}><FiGift /> Gift Packing Details</p>
                      {giftItems.map(item => (
                        <div key={item.id} className={styles.adminGiftRow}>
                          <span className={styles.adminGiftProduct}>{item.product_name}</span>
                          <span className={styles.adminGiftMessage}>
                            {item.gift_quote
                              ? <><strong>Message:</strong> "{item.gift_quote}"</>
                              : <em>No gift message</em>
                            }
                          </span>
                          <span className={styles.adminGiftCharge}>+₹{item.gift_charge || 50}</span>
                        </div>
                      ))}
                      <p className={styles.adminGiftTotal}>Gift Packing Charge: ₹{giftCharge}</p>
                    </div>
                  )}

                  <div className={styles.orderTotal}>
                    <FiDollarSign />
                    <strong>Total Amount:</strong>
                    <span>₹{order.total_amount}</span>
                    {deliveryCharge !== undefined && (
                      <span className={`${styles.deliveryNote} ${deliveryCharge === 0 ? styles.freeDelivery : ''}`}>
                        {deliveryCharge === 0 ? '(FREE Delivery)' : `(incl. ₹${deliveryCharge} delivery)`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
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
                    onClick={() => { setSelectedOrderForStatus(order); setShowStatusPopup(true); }}
                    disabled={order.status === 'delivered' || order.status === 'cancelled'}
                  >
                    <FiRefreshCw /> Update Status
                  </button>
                  <button
                    className={styles.invoiceBtn}
                    onClick={() => downloadInvoiceAsPDF(order)}
                    title="Download Invoice"
                  >
                    <FiDownload /> Invoice
                  </button>
                </div>

                {/* Status History */}
                {selectedOrder === order.id && (
                  <div className={styles.historySection}>
                    <div className={styles.sectionTitle}><FiClock /><h4>Status History</h4></div>
                    <div className={styles.timeline}>
                      {(() => {
                        let historyArray = order.status_history || [];
                        if (typeof historyArray === 'string') {
                          try { historyArray = JSON.parse(historyArray); } catch(e) { historyArray = []; }
                        }
                        return historyArray.length > 0 ? (
                          historyArray.map((update, idx) => (
                            <div key={idx} className={styles.timelineItem}>
                              <div className={`${styles.timelineDot} ${getStatusClass(update.status)}`} />
                              <div className={styles.timelineContent}>
                                <div className={styles.timelineHeader}>
                                  <span className={styles.timelineStatus}>{update.status?.toUpperCase().replace(/_/g, ' ') || 'Updated'}</span>
                                  <span className={styles.timelineDate}>{new Date(update.timestamp).toLocaleString()}</span>
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
          );
        })}
      </div>

      {filteredOrders.length === 0 && !loading && (
        <div className={styles.noOrders}><p>No orders found</p></div>
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