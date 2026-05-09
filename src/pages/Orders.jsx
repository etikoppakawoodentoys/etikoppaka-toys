import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { 
  FiPackage, 
  FiTruck, 
  FiCheckCircle, 
  FiClock, 
  FiDownload, 
  FiEye,
  FiChevronDown,
  FiChevronUp,
  FiShoppingBag,
  FiCalendar,
  FiMapPin,
  FiDollarSign,
  FiArrowLeft
} from 'react-icons/fi';
import { FaStar, FaRegClock } from 'react-icons/fa';
import styles from './Orders.module.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (location.state && location.state.orderSuccess) {
      setSuccessMessage(`Order #${location.state.orderNumber} placed successfully! Our team will call you to confirm.`);
      setTimeout(() => setSuccessMessage(''), 5000);
    }
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data && !error) {
      setOrders(data);
    }
    setLoading(false);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { label: 'Pending', color: '#F59E0B', bg: '#FEF3C7', icon: <FaRegClock /> },
      'accepted': { label: 'Accepted', color: '#10B981', bg: '#D1FAE5', icon: <FiCheckCircle /> },
      'shipped': { label: 'Shipped', color: '#3B82F6', bg: '#DBEAFE', icon: <FiPackage /> },
      'transit': { label: 'In Transit', color: '#8B5CF6', bg: '#EDE9FE', icon: <FiTruck /> },
      'out_for_delivery': { label: 'Out for Delivery', color: '#EC4899', bg: '#FCE7F3', icon: <FiTruck /> },
      'delivered': { label: 'Delivered', color: '#059669', bg: '#D1FAE5', icon: <FiCheckCircle /> },
      'cancelled': { label: 'Cancelled', color: '#EF4444', bg: '#FEE2E2', icon: <FiPackage /> }
    };
    
    const config = statusConfig[status] || statusConfig['pending'];
    return (
      <span className={styles.statusBadge} style={{ background: config.bg, color: config.color }}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const getStatusSteps = (currentStatus) => {
    const steps = [
      { status: 'pending', label: 'Order Placed', icon: '📝' },
      { status: 'accepted', label: 'Accepted', icon: '✅' },
      { status: 'shipped', label: 'Shipped', icon: '📦' },
      { status: 'transit', label: 'In Transit', icon: '🚚' },
      { status: 'out_for_delivery', label: 'Out for Delivery', icon: '🚛' },
      { status: 'delivered', label: 'Delivered', icon: '🎁' }
    ];

    const currentIndex = steps.findIndex(step => step.status === currentStatus);
    
    return (
      <div className={styles.timeline}>
        {steps.map((step, index) => (
          <div key={step.status} className={styles.timelineStep}>
            <div className={`${styles.timelineIcon} ${index <= currentIndex ? styles.completed : ''}`}>
              {step.icon}
            </div>
            <div className={styles.timelineLabel}>{step.label}</div>
            {index < steps.length - 1 && (
              <div className={`${styles.timelineLine} ${index < currentIndex ? styles.active : ''}`} />
            )}
          </div>
        ))}
      </div>
    );
  };

  const getStatusHistoryArray = (statusHistory) => {
    if (!statusHistory) return [];
    if (Array.isArray(statusHistory)) return statusHistory;
    if (typeof statusHistory === 'string') {
      try {
        const parsed = JSON.parse(statusHistory);
        return Array.isArray(parsed) ? parsed : [];
      } catch(e) {
        return [];
      }
    }
    return [];
  };

  const downloadInvoiceAsPDF = async (order) => {
    // Get the logo as base64 to ensure it works in print
    const logoUrl = '/logo1.png';
    
    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Invoice ${order.order_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Georgia', 'Times New Roman', 'Segoe UI', Arial, sans-serif; padding: 40px; background: #F8F2E8; }
          .invoice-container { max-width: 800px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
          .invoice-header { background: linear-gradient(135deg, #1F5B3A, #15452B); padding: 30px; text-align: center; color: white; }
          .logo { display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 15px; }
          .logo-img { width: 70px; height: 70px; object-fit: contain; background: white; border-radius: 50%; padding: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
          .logo-text { text-align: left; }
          .logo-text h1 { font-size: 28px; margin: 0; font-family: 'Georgia', serif; letter-spacing: 1px; }
          .logo-text p { font-size: 12px; opacity: 0.9; margin-top: 5px; letter-spacing: 0.5px; }
          .invoice-title { margin-top: 20px; font-size: 24px; font-weight: bold; letter-spacing: 2px; }
          .invoice-body { padding: 30px; }
          .order-info { background: #F8F2E8; padding: 20px; border-radius: 12px; margin-bottom: 30px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
          .info-item { display: flex; flex-direction: column; }
          .info-label { font-size: 12px; color: #7A6B5A; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px; }
          .info-value { font-size: 14px; font-weight: 600; color: #3E2A1F; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background: #1F5B3A; color: white; padding: 12px; text-align: left; font-weight: 600; font-size: 13px; }
          td { padding: 12px; border-bottom: 1px solid #E8DCC8; font-size: 13px; }
          .total-section { text-align: right; padding: 20px; background: #F8F2E8; border-radius: 12px; margin-top: 20px; }
          .total-row { display: flex; justify-content: flex-end; gap: 20px; margin-bottom: 10px; font-size: 14px; }
          .total-amount { font-size: 24px; font-weight: bold; color: #9E1B1B; }
          .payment-info { margin-top: 30px; padding: 20px; background: #D1FAE5; border-radius: 12px; text-align: center; }
          .payment-info strong { color: #1F5B3A; }
          .footer { background: #3E2A1F; color: #E8DCC8; padding: 20px; text-align: center; font-size: 12px; }
          .footer p { margin: 5px 0; }
          .handcrafted { text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px dashed #C89B3C; font-size: 11px; color: #C89B3C; font-style: italic; }
          @media print { 
            body { padding: 0; background: white; } 
            .invoice-container { box-shadow: none; margin: 0; border-radius: 0; }
            .invoice-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .footer { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="invoice-header">
            <div class="logo">
              <img src="${logoUrl}" alt="Etikoppaka Toys Logo" class="logo-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
              <div class="logo-text">
                <h1>Etikoppaka Toys</h1>
                <p>Traditional Handcrafted Wooden Toys</p>
                <p>Since 1985 | GI Tagged | Natural Dyes</p>
              </div>
            </div>
            <div class="invoice-title">TAX INVOICE</div>
          </div>
          <div class="invoice-body">
            <div class="order-info">
              <div class="info-item"><span class="info-label">Order Number</span><span class="info-value">${order.order_number}</span></div>
              <div class="info-item"><span class="info-label">Order Date</span><span class="info-value">${new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
              <div class="info-item"><span class="info-label">Payment Method</span><span class="info-value">Cash on Delivery 💰</span></div>
              <div class="info-item"><span class="info-label">Order Status</span><span class="info-value">${order.status.toUpperCase().replace(/_/g, ' ')}</span></div>
              <div class="info-item"><span class="info-label">Shipping Address</span><span class="info-value">${order.shipping_address || 'Address provided at checkout'}</span></div>
            </div>
            <table>
              <thead>
                <tr><th>Product</th><th>Quantity</th><th>Unit Price</th><th>Total</th></tr>
              </thead>
              <tbody>
                ${order.order_items && order.order_items.map(item => `
                  <tr>
                    <td>${item.product_name}</td>
                    <td>x${item.quantity}</td>
                    <td>₹${item.price}</td>
                    <td>₹${item.price * item.quantity}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="total-section">
              <div class="total-row"><strong>Subtotal:</strong><span>₹${order.total_amount}</span></div>
              <div class="total-row"><strong>Shipping:</strong><span>Free</span></div>
              <div class="total-row"><strong>Packaging:</strong><span>Included</span></div>
              <div class="total-row"><strong>Total Amount:</strong><span class="total-amount">₹${order.total_amount}</span></div>
            </div>
            <div class="payment-info">
              <strong>💰 Cash on Delivery (COD)</strong>
              <p style="margin-top:5px;font-size:12px;">Pay when you receive your order. No extra charges!</p>
            </div>
            <div class="handcrafted">
              ✨ Each piece is handcrafted with natural colors and sustainable wood ✨
            </div>
          </div>
          <div class="footer">
            <p>🙏 Thank you for supporting traditional Indian craftsmanship!</p>
            <p>📍 Etikoppaka, Visakhapatnam, Andhra Pradesh - 531082</p>
            <p>📞 +91 9154884214 | 📧 orders@etikoppakatoys.com</p>
            <p>🌿 Eco-friendly • Non-toxic dyes • Sustainable wood</p>
            <hr style="border-color:#C89B3C; margin:10px 0;">
            <p>© ${new Date().getFullYear()} Etikoppaka Toys. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading your orders...</p>
      </div>
    );
  }

  // ============================================
  // MOBILE ORDERS UI (Swiggy/Zomato Style)
  // ============================================
  if (isMobile) {
    return (
      <div className={styles.mobileOrdersPage}>
        {/* Mobile Header */}
        <div className={styles.mobileHeader}>
          <button onClick={() => window.history.back()} className={styles.mobileBackBtn}>
            <FiArrowLeft />
          </button>
          <h1>My Orders</h1>
          <div className={styles.mobilePlaceholder}></div>
        </div>

        {successMessage && (
          <div className={styles.mobileSuccessMessage}>
            <FiCheckCircle />
            {successMessage}
          </div>
        )}

        {orders.length === 0 ? (
          <div className={styles.mobileEmptyOrders}>
            <FiShoppingBag className={styles.mobileEmptyIcon} />
            <h2>No Orders Yet</h2>
            <p>You haven't placed any orders yet.</p>
            <Link to="/products" className={styles.mobileShopBtn}>Start Shopping →</Link>
          </div>
        ) : (
          <div className={styles.mobileOrdersList}>
            {orders.map((order) => (
              <div key={order.id} className={styles.mobileOrderCard}>
                <div className={styles.mobileOrderHeader}>
                  <div>
                    <span className={styles.mobileOrderNumber}>#{order.order_number}</span>
                    <span className={styles.mobileOrderDate}>
                      {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                <div className={styles.mobileOrderItems}>
                  {order.order_items && order.order_items.slice(0, 2).map((item) => (
                    <div key={item.id} className={styles.mobileOrderItem}>
                      <span className={styles.mobileItemName}>{item.product_name}</span>
                      <span className={styles.mobileItemQty}>x{item.quantity}</span>
                      <span className={styles.mobileItemPrice}>₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                  {order.order_items && order.order_items.length > 2 && (
                    <div className={styles.mobileMoreItems}>
                      +{order.order_items.length - 2} more items
                    </div>
                  )}
                </div>

                <div className={styles.mobileOrderFooter}>
                  <div className={styles.mobileOrderTotal}>
                    <span>Total:</span>
                    <strong>₹{order.total_amount}</strong>
                  </div>
                  <button 
                    onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
                    className={styles.mobileTrackBtn}
                  >
                    {selectedOrder === order.id ? 'Hide Details' : 'Track Order'}
                  </button>
                  <button 
                    onClick={() => downloadInvoiceAsPDF(order)}
                    className={styles.mobileInvoiceBtn}
                  >
                    <FiDownload /> Invoice
                  </button>
                </div>

                {selectedOrder === order.id && (
                  <div className={styles.mobileOrderDetails}>
                    <div className={styles.mobileTrackingStatus}>
                      <h4>Order Status</h4>
                      {getStatusSteps(order.status)}
                    </div>
                    
                    <div className={styles.mobileShippingInfo}>
                      <div className={styles.mobileInfoRow}>
                        <FiMapPin />
                        <div>
                          <strong>Shipping Address</strong>
                          <p>{order.shipping_address}</p>
                        </div>
                      </div>
                      <div className={styles.mobileInfoRow}>
                        <FiDollarSign />
                        <div>
                          <strong>Payment Method</strong>
                          <p>Cash on Delivery</p>
                        </div>
                      </div>
                    </div>

                    {(() => {
                      const historyArray = getStatusHistoryArray(order.status_history);
                      return historyArray.length > 0 && (
                        <div className={styles.mobileUpdateHistory}>
                          <h4>Update History</h4>
                          {historyArray.map((update, idx) => (
                            <div key={idx} className={styles.mobileUpdateItem}>
                              <div className={styles.mobileUpdateDot}></div>
                              <div>
                                <div className={styles.mobileUpdateStatus}>
                                  {update.status?.toUpperCase().replace(/_/g, ' ')}
                                </div>
                                <div className={styles.mobileUpdateDate}>
                                  {new Date(update.timestamp).toLocaleString()}
                                </div>
                                {update.note && <p className={styles.mobileUpdateNote}>{update.note}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ============================================
  // DESKTOP ORDERS UI (Premium Traditional Style)
  // ============================================
  return (
    <div className={styles.ordersPage}>
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>My Orders</h1>
          <p className={styles.pageSubtitle}>Track and manage your orders</p>
        </div>
        
        {successMessage && (
          <div className={styles.successMessage}>
            <FiCheckCircle />
            {successMessage}
          </div>
        )}

        {orders.length === 0 ? (
          <div className={styles.emptyOrders}>
            <div className={styles.emptyIcon}>
              <FiShoppingBag />
            </div>
            <h2>No Orders Yet</h2>
            <p>You haven't placed any orders yet. Start shopping!</p>
            <Link to="/products" className={styles.shopBtn}>Start Shopping →</Link>
          </div>
        ) : (
          <div className={styles.ordersList}>
            {orders.map((order) => (
              <div key={order.id} className={styles.orderCard}>
                <div className={styles.orderHeader}>
                  <div className={styles.orderInfo}>
                    <span className={styles.orderNumber}>#{order.order_number}</span>
                    <span className={styles.orderDate}>
                      <FiCalendar />
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                <div className={styles.orderItems}>
                  {order.order_items && order.order_items.slice(0, 3).map((item) => (
                    <div key={item.id} className={styles.orderItem}>
                      <div className={styles.itemInfo}>
                        <span className={styles.itemName}>{item.product_name}</span>
                        <span className={styles.itemQuantity}>x{item.quantity}</span>
                      </div>
                      <div className={styles.itemPrice}>₹{item.price * item.quantity}</div>
                    </div>
                  ))}
                  {order.order_items && order.order_items.length > 3 && (
                    <div className={styles.moreItems}>
                      +{order.order_items.length - 3} more items
                    </div>
                  )}
                </div>

                <div className={styles.orderFooter}>
                  <div className={styles.orderTotal}>
                    <span>Total Amount:</span>
                    <strong>₹{order.total_amount}</strong>
                  </div>
                  <div className={styles.orderActions}>
                    <button 
                      onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
                      className={styles.trackBtn}
                    >
                      {selectedOrder === order.id ? <FiChevronUp /> : <FiChevronDown />}
                      {selectedOrder === order.id ? 'Hide Tracking' : 'Track Order'}
                    </button>
                    <button 
                      onClick={() => downloadInvoiceAsPDF(order)}
                      className={styles.invoiceBtn}
                    >
                      <FiDownload />
                      Invoice
                    </button>
                  </div>
                </div>

                {selectedOrder === order.id && (
                  <div className={styles.orderTracking}>
                    <div className={styles.trackingHeader}>
                      <FiTruck />
                      <h4>Order Tracking</h4>
                    </div>
                    {getStatusSteps(order.status)}
                    
                    <div className={styles.deliveryInfo}>
                      <div className={styles.deliveryItem}>
                        <FiMapPin />
                        <div>
                          <strong>Shipping Address</strong>
                          <p>{order.shipping_address}</p>
                        </div>
                      </div>
                      <div className={styles.deliveryItem}>
                        <FiDollarSign />
                        <div>
                          <strong>Payment Method</strong>
                          <p>Cash on Delivery</p>
                        </div>
                      </div>
                    </div>
                    
                    {(() => {
                      const historyArray = getStatusHistoryArray(order.status_history);
                      return historyArray.length > 0 && (
                        <div className={styles.updateHistory}>
                          <h5>Update History</h5>
                          {historyArray.map((update, index) => (
                            <div key={index} className={styles.updateItem}>
                              <div className={styles.updateDot}></div>
                              <div className={styles.updateContent}>
                                <span className={styles.updateDate}>
                                  {new Date(update.timestamp).toLocaleString()}
                                </span>
                                <span className={styles.updateStatus}>
                                  {update.status ? update.status.toUpperCase().replace(/_/g, ' ') : 'Updated'}
                                </span>
                                {update.note && <p className={styles.updateNote}>{update.note}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;