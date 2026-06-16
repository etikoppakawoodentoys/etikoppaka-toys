import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { loadRazorpayScript, createRazorpayOrder } from '../services/razorpayService';
import { 
  FiPackage, FiTruck, FiCheckCircle, FiClock, FiDownload, FiEye,
  FiChevronDown, FiChevronUp, FiShoppingBag, FiCalendar, FiMapPin,
  FiDollarSign, FiArrowLeft, FiRefreshCw, FiCreditCard, FiGift, FiStar, FiX
} from 'react-icons/fi';
import { FaStar, FaRegClock } from 'react-icons/fa';
import ReturnModal from '../components/ReturnModal';
import CustomToast from '../components/CustomToast';
import CustomAlert from '../components/CustomAlert';
import styles from './Orders.module.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState('');
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedProductForReview, setSelectedProductForReview] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');
  const [existingReview, setExistingReview] = useState(null);

  const [toast, setToast] = useState(null);
  const [alert, setAlert] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const showAlert = (title, message, type = 'info', showReview = false, reviewData = null) => {
    setAlert({ title, message, type, showReview, reviewData });
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
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
    loadRazorpayScript();
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    const ordersSubscription = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${currentUserId}` },
        (payload) => {
          fetchOrders();
          if (payload.eventType === 'UPDATE' && payload.new.payment_status === 'paid' && payload.old.payment_status !== 'paid') {
            showToast(`Payment successful for Order #${payload.new.order_number}!`, 'success');
          }
        })
      .subscribe();

    const orderItemsSubscription = supabase
      .channel('order-items-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => fetchOrders())
      .subscribe();

    return () => {
      ordersSubscription.unsubscribe();
      orderItemsSubscription.unsubscribe();
    };
  }, [currentUserId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id);
  };

  const fetchOrders = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items (*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data && !error) setOrders(data);
    setLoading(false);
  };

  const handlePayNow = async (order) => {
    if (order.status === 'delivered') {
      showAlert('Payment Not Needed', 'This order has already been delivered. No payment needed.', 'info');
      return;
    }
    setProcessingPayment(order.id);
    try {
      const razorpayOrder = await createRazorpayOrder(order.total_amount, order.order_number);
      const options = {
        key: 'rzp_live_SnFBYmQC6vompt',
        amount: razorpayOrder.amount,
        currency: 'INR',
        name: 'Etikoppaka Toys',
        description: `Payment for Order #${order.order_number}`,
        image: '/logo1.png',
        order_id: razorpayOrder.id,
        prefill: { name: order.users?.name || '', email: order.users?.email || '', contact: order.users?.mobile || '' },
        theme: { color: '#1F5B3A' },
        handler: async (response) => {
          const { error: updateError } = await supabase
            .from('orders')
            .update({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              payment_status: 'paid',
              payment_method: 'RAZORPAY'
            })
            .eq('id', order.id);
          if (updateError) {
            showAlert('Payment Error', 'Payment successful but order update failed. Please contact support.', 'error');
          } else {
            showToast(`Payment successful for Order #${order.order_number}!`, 'success');
            fetchOrders();
          }
        },
        modal: { ondismiss: () => setProcessingPayment(null) }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Payment error:', error);
      showAlert('Payment Failed', 'Failed to initiate payment. Please try again.', 'error');
    } finally {
      setProcessingPayment(null);
    }
  };

  const openReviewModal = async (item) => {
    if (!item || item.item_type === 'hamper') {
      showAlert('Hamper Review', 'You can review individual products from the hamper after receiving them.', 'info');
      return;
    }

    const productId = item.product_id || item.id;

    const { data: validProduct, error: productError } = await supabase
      .from('products')
      .select('id, name, price')
      .eq('id', productId)
      .maybeSingle();

    if (productError || !validProduct) {
      showAlert('Product Unavailable', 'Sorry, this product is no longer available for review.', 'error');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id, rating, comment')
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingReview) {
        showAlert('Already Reviewed', 'You have already reviewed this product!', 'review', true,
          { rating: existingReview.rating, comment: existingReview.comment });
        return;
      }
    }

    const productWithValidInfo = {
      ...item,
      id: productId,
      product_id: productId,
      name: validProduct.name
    };

    setSelectedProductForReview(productWithValidInfo);
    setReviewRating(5);
    setReviewText('');
    setReviewMessage('');
    setExistingReview(null);
    setShowReviewModal(true);
  };

  const checkReturnExists = async (orderId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase
      .from('returns')
      .select('id, status')
      .eq('order_id', orderId)
      .eq('user_id', user.id)
      .maybeSingle();
    return data;
  };

  const handleReturnClick = async (order) => {
    const existingReturn = await checkReturnExists(order.id);
    if (existingReturn) {
      showAlert('Return Already Submitted', `Your return request has already been submitted. Status: ${existingReturn.status}`, 'warning');
    } else if (order.status === 'delivered') {
      setSelectedOrderForReturn(order);
      setShowReturnModal(true);
    } else {
      showAlert('Cannot Request Return', 'Return can only be requested for delivered orders.', 'error');
    }
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
        {config.icon}{config.label}
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
      } catch(e) { return []; }
    }
    return [];
  };

  const calculateGiftCharges = (orderItems) => {
    if (!orderItems) return 0;
    return orderItems.reduce((total, item) => total + (item.gift_charge || 0), 0);
  };

  const getGiftItems = (orderItems) => {
    if (!orderItems) return [];
    return orderItems.filter(item => item.gift_packing === true && item.item_type !== 'hamper');
  };

  const getHamperItems = (orderItems) => {
    if (!orderItems) return [];
    return orderItems.filter(item => item.item_type === 'hamper');
  };

  const getFirstProductItem = (orderItems) => {
    if (!orderItems) return null;
    return orderItems.find(item => item.item_type !== 'hamper') || null;
  };

  // Get delivery charge from order (if stored) or calculate
  const getDeliveryCharge = (order) => {
    // If order has delivery_charge field, use it
    if (order.delivery_charge !== undefined && order.delivery_charge !== null) {
      return order.delivery_charge;
    }
    // Otherwise calculate based on subtotal (fallback)
    const subtotal = order.total_amount - calculateGiftCharges(order.order_items);
    return subtotal >= 499 ? 0 : 70;
  };

  const downloadInvoiceAsPDF = async (order) => {
    const logoUrl = '/logo1.png';
    const giftItems = getGiftItems(order.order_items);
    const hamperItems = getHamperItems(order.order_items);
    const giftCharges = calculateGiftCharges(order.order_items);
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

    const invoiceHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Invoice ${order.order_number}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Georgia','Times New Roman',Arial,sans-serif;background:#F8F2E8;padding:20px;font-size:12px}.invoice-container{max-width:700px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.1)}.invoice-header{background:linear-gradient(135deg,#1F5B3A,#15452B);padding:20px;text-align:center;color:white}.logo{display:flex;align-items:center;justify-content:center;gap:12px}.logo-img{width:50px;height:50px;object-fit:contain;background:white;border-radius:50%;padding:6px}.logo-text h1{font-size:20px;margin:0}.logo-text p{font-size:9px;opacity:0.9;margin-top:2px}.invoice-title{margin-top:10px;font-size:18px;font-weight:bold;letter-spacing:1px}.invoice-body{padding:20px}.order-info{background:#F8F2E8;padding:12px;border-radius:10px;margin-bottom:20px;display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.info-item{display:flex;flex-direction:column}.info-label{font-size:10px;color:#7A6B5A;margin-bottom:3px}.info-value{font-size:11px;font-weight:600;color:#3E2A1F}table{width:100%;border-collapse:collapse;margin-bottom:20px}th{background:#1F5B3A;color:white;padding:8px;text-align:left;font-size:10px}td{padding:8px;border-bottom:1px solid #E8DCC8;font-size:10px}.gift-row{background:#FEF8F0}.hamper-row{background:#E8F5E9}.gift-message{font-size:9px;color:#C89B3C;margin-top:3px;font-style:italic}.hamper-badge{font-size:8px;color:#1F5B3A;margin-top:3px}.total-section{text-align:right;padding:12px;background:#F8F2E8;border-radius:10px;margin-top:15px}.total-row{display:flex;justify-content:flex-end;gap:15px;margin-bottom:5px;font-size:11px}.total-amount{font-size:18px;font-weight:bold;color:#9E1B1B}.delivery-free{color:#10B981;font-weight:bold}.delivery-charge{color:#D97706}.gift-summary{margin-top:15px;padding:10px;background:#FEF8F0;border-radius:10px;border-left:3px solid #D9B382}.gift-summary-title{font-size:11px;font-weight:bold;color:#3E2A1F;margin-bottom:8px;display:flex;align-items:center;gap:5px}.gift-summary-item{font-size:9px;color:#7A6B5A;margin-bottom:5px;padding-left:10px}.gift-quote{color:#C89B3C;font-style:italic}.payment-info{margin-top:15px;padding:10px;border-radius:10px;text-align:center;background:${isPaid ? '#D1FAE5' : '#FEF3C7'};font-size:10px}.footer{background:#3E2A1F;color:#E8DCC8;padding:12px;text-align:center;font-size:9px}.handcrafted{text-align:center;margin-top:15px;padding-top:8px;border-top:1px dashed #C89B3C;font-size:9px;color:#C89B3C}.payment-badge{display:inline-block;padding:2px 8px;border-radius:12px;font-size:9px;font-weight:bold;background:${paymentStatusColor};color:white}.delivery-note{margin-top:10px;padding:8px;background:#FEF8F0;border-radius:8px;font-size:9px;color:#1F5B3A;text-align:center}@media print{body{padding:0;background:white}.invoice-container{box-shadow:none;margin:0;border-radius:0}.invoice-header{-webkit-print-color-adjust:exact;print-color-adjust:exact}th{-webkit-print-color-adjust:exact;print-color-adjust:exact}.footer{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body><div class="invoice-container"><div class="invoice-header"><div class="logo"><img src="${logoUrl}" alt="Logo" class="logo-img" onerror="this.style.display='none'"><div class="logo-text"><h1>Etikoppaka Toys</h1><p>Traditional Handcrafted Wooden Toys | Since 1985</p></div></div><div class="invoice-title">TAX INVOICE</div></div><div class="invoice-body"><div class="order-info"><div class="info-item"><span class="info-label">Order Number</span><span class="info-value">${order.order_number}</span></div><div class="info-item"><span class="info-label">Order Date</span><span class="info-value">${new Date(order.created_at).toLocaleDateString('en-IN')}</span></div><div class="info-item"><span class="info-label">Payment Method</span><span class="info-value">${paymentLabel}</span></div><div class="info-item"><span class="info-label">Payment Status</span><span class="info-value"><span class="payment-badge">${paymentStatusText}</span></span></div><div class="info-item"><span class="info-label">Order Status</span><span class="info-value">${order.status.toUpperCase().replace(/_/g, ' ')}</span></div><div class="info-item"><span class="info-label">Shipping Address</span><span class="info-value">${order.shipping_address?.substring(0, 60) || 'Address provided'}</span></div></div><table><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>${order.order_items && order.order_items.map(item => {
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
    }).join('')}</tbody></table>${giftItems.length > 0 ? `<div class="gift-summary"><div class="gift-summary-title"><span>🎁</span> Gift Messages</div>${giftItems.map(item => `<div class="gift-summary-item"><strong>${item.product_name}:</strong> <span class="gift-quote">"${item.gift_quote || 'No message added'}"</span></div>`).join('')}</div>` : ''}<div class="total-section"><div class="total-row"><strong>Subtotal:</strong><span>₹${subtotal}</span></div>${giftCharges > 0 ? `<div class="total-row"><strong>Gift Packing:</strong><span>₹${giftCharges}</span></div>` : ''}<div class="total-row"><strong>Delivery Fee:</strong><span>${deliveryCharge === 0 ? '<span class="delivery-free">FREE</span>' : `<span class="delivery-charge">₹${deliveryCharge}</span>`}</span></div><div class="total-row"><strong>Total Amount:</strong><span class="total-amount">₹${order.total_amount}</span></div></div><div class="payment-info"><strong>${paymentLabel === 'Online Payment (Razorpay)' ? '✅ Payment Confirmed' : '💰 Pay on Delivery'}</strong>${order.payment_method === 'RAZORPAY' && order.razorpay_payment_id ? `<p style="margin-top:5px;">Transaction ID: ${order.razorpay_payment_id.substring(0, 20)}</p>` : ''}</div>${isDelivered ? '<div class="delivery-note">🎁 Your order has been delivered. Thank you for shopping with us!</div>' : ''}<div class="handcrafted">✨ Each piece is handcrafted with natural colors & sustainable wood ✨</div></div><div class="footer"><p>📍 Etikoppaka, Visakhapatnam, AP - 531082 | 📞 +91 9154884214</p><p>© ${new Date().getFullYear()} Etikoppaka Toys. Thank you for supporting traditional craftsmanship!</p></div></div></body></html>`;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
    printWindow.print();
  };

  // Review Modal Component
  const ReviewModal = () => {
    const [localRating, setLocalRating] = useState(5);
    const [localText, setLocalText] = useState('');
    const [localSubmitting, setLocalSubmitting] = useState(false);
    const [localMessage, setLocalMessage] = useState('');
    const [localExisting, setLocalExisting] = useState(null);

    useEffect(() => {
      if (showReviewModal && selectedProductForReview) {
        const initReview = async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          const { data: existing } = await supabase
            .from('reviews')
            .select('*')
            .eq('product_id', selectedProductForReview.id)
            .eq('user_id', user.id)
            .maybeSingle();
          if (existing) {
            setLocalMessage('You have already reviewed this product!');
            setLocalExisting(existing);
            setTimeout(() => { setShowReviewModal(false); setSelectedProductForReview(null); }, 2000);
            return;
          }
          setLocalExisting(null);
          setLocalRating(5);
          setLocalText('');
          setLocalMessage('');
          setLocalSubmitting(false);
        };
        initReview();
      }
    }, [showReviewModal, selectedProductForReview]);

    const handleLocalSubmit = async () => {
      if (!localText.trim()) { showToast('Please write your review', 'error'); return; }
      setLocalSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { showToast('Please login to submit a review', 'error'); setLocalSubmitting(false); return; }

      const productIdToUse = selectedProductForReview.product_id || selectedProductForReview.id;
      const { data: product, error: productError } = await supabase
        .from('products').select('id, name').eq('id', productIdToUse).maybeSingle();
      if (productError || !product) {
        showToast('Product no longer exists. Unable to submit review.', 'error');
        setLocalSubmitting(false);
        return;
      }
      const { data: existing } = await supabase
        .from('reviews').select('id').eq('product_id', productIdToUse).eq('user_id', user.id).maybeSingle();
      if (existing) {
        showToast('You have already reviewed this product!', 'warning');
        setLocalSubmitting(false);
        setTimeout(() => { setShowReviewModal(false); setSelectedProductForReview(null); }, 1500);
        return;
      }
      const { error } = await supabase.from('reviews').insert({
        product_id: productIdToUse, user_id: user.id, rating: localRating, comment: localText.trim()
      });
      if (error) {
        showToast(error.message || 'Failed to submit review', 'error');
      } else {
        showToast('Review submitted successfully!', 'success');
        setExistingReview(true);
        fetchOrders();
        setTimeout(() => { setShowReviewModal(false); setSelectedProductForReview(null); }, 1500);
      }
      setLocalSubmitting(false);
    };

    if (!showReviewModal) return null;

    if (localExisting) {
      return (
        <div className={styles.reviewModal} onClick={() => setShowReviewModal(false)}>
          <div className={styles.reviewModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.reviewModalHeader}>
              <h3>Already Reviewed</h3>
              <button onClick={() => setShowReviewModal(false)} className={styles.reviewModalClose}><FiX /></button>
            </div>
            <div className={styles.reviewModalBody}>
              <div className={styles.reviewModalMessage} style={{ background: '#FEF3C7', color: '#D97706', borderLeftColor: '#F59E0B' }}>
                You have already reviewed this product!
              </div>
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <p><strong>Your Review:</strong></p>
                <p>"{localExisting.comment}"</p>
                <p>Rating: {localExisting.rating} ★</p>
                <button onClick={() => setShowReviewModal(false)} className={styles.submitReviewBtn} style={{ marginTop: '20px' }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.reviewModal} onClick={() => setShowReviewModal(false)}>
        <div className={styles.reviewModalContent} onClick={(e) => e.stopPropagation()}>
          <div className={styles.reviewModalHeader}>
            <h3>Write a Review for {selectedProductForReview?.product_name}</h3>
            <button onClick={() => setShowReviewModal(false)} className={styles.reviewModalClose}><FiX /></button>
          </div>
          <div className={styles.reviewModalBody}>
            {localMessage && (
              <div className={`${styles.reviewModalMessage} ${localMessage.includes('successfully') ? styles.success : styles.error}`}>
                {localMessage}
              </div>
            )}
            <div className={styles.reviewRatingSection}>
              <label>Your Rating</label>
              <div className={styles.reviewStars}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} type="button" onClick={() => setLocalRating(star)} className={styles.ratingStarBtn}>
                    {star <= localRating ? <FaStar className={styles.activeStar} /> : <FaStar className={styles.inactiveStar} />}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.reviewTextSection}>
              <label>Your Review</label>
              <textarea rows="5" value={localText} onChange={(e) => setLocalText(e.target.value)}
                placeholder="Share your experience..." className={styles.reviewTextarea} />
            </div>
            <div className={styles.reviewModalActions}>
              <button onClick={handleLocalSubmit} disabled={localSubmitting} className={styles.submitReviewBtn}>
                {localSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading your orders...</p>
      </div>
    );
  }

  const isOrderDelivered = (order) => order.status === 'delivered';
  const needsPayment = (order) =>
    order.payment_method === 'COD' && order.payment_status !== 'paid' && order.status !== 'delivered';

  // ============================================
  // MOBILE ORDERS UI
  // ============================================
  if (isMobile) {
    return (
      <div className={styles.mobileOrdersPage}>
        <div className={styles.mobileHeader}>
          <button onClick={() => window.history.back()} className={styles.mobileBackBtn}><FiArrowLeft /></button>
          <h1>My Orders</h1>
          <div className={styles.mobilePlaceholder}></div>
        </div>

        {successMessage && (
          <div className={styles.mobileSuccessMessage}><FiCheckCircle /> {successMessage}</div>
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
            {orders.map((order) => {
              const giftItems = getGiftItems(order.order_items);
              const hamperItems = getHamperItems(order.order_items);
              const giftCharges = calculateGiftCharges(order.order_items);
              const deliveryCharge = getDeliveryCharge(order);
              const delivered = isOrderDelivered(order);
              const showPayNow = needsPayment(order);
              const firstProductItem = getFirstProductItem(order.order_items);
              const hasReviewableItem = !!firstProductItem;

              return (
                <div key={order.id} className={styles.mobileOrderCard}>
                  <div className={styles.mobileOrderHeader}>
                    <div>
                      <span className={styles.mobileOrderNumber}>#{order.order_number}</span>
                      <span className={styles.mobileOrderDate}>{new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className={styles.mobileBadgeGroup}>
                      {getStatusBadge(order.status)}
                      {order.payment_method === 'COD' && order.payment_status !== 'paid' && <span className={styles.mobileCodBadge}>COD</span>}
                      {order.payment_status === 'paid' && <span className={styles.mobilePaidBadge}>Paid</span>}
                    </div>
                  </div>

                  <div className={styles.mobileOrderItems}>
                    {order.order_items && order.order_items.filter(i => i.item_type !== 'hamper').slice(0, 2).map((item) => (
                      <div key={item.id} className={styles.mobileOrderItem}>
                        <div className={styles.mobileItemInfo}>
                          <span className={styles.mobileItemName}>
                            {item.product_name}
                            {item.gift_packing && <span className={styles.mobileGiftIcon}> 🎁</span>}
                          </span>
                          <span className={styles.mobileItemQty}>x{item.quantity}</span>
                        </div>
                        <span className={styles.mobileItemPrice}>₹{(item.price * item.quantity) + (item.gift_charge || 0)}</span>
                      </div>
                    ))}
                    {hamperItems.slice(0, 1).map((item) => (
                      <div key={item.id} className={styles.mobileOrderItem}>
                        <div className={styles.mobileItemInfo}>
                          <span className={styles.mobileItemName}>
                            🎁 {item.product_name}
                            <span className={styles.mobileGiftIcon}> Hamper</span>
                          </span>
                          <span className={styles.mobileItemQty}>x{item.quantity}</span>
                        </div>
                        <span className={styles.mobileItemPrice}>₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                    {order.order_items && order.order_items.length > 2 && (
                      <div className={styles.mobileMoreItems}>+{order.order_items.length - 2} more items</div>
                    )}
                    {giftItems.length > 0 && (
                      <div className={styles.mobileGiftSummary}>
                        <div className={styles.mobileGiftHeader}><FiGift /> Gift Packing ({giftItems.length} item{giftItems.length > 1 ? 's' : ''})</div>
                        {giftItems.map(item => (
                          <div key={item.id} className={styles.mobileGiftMessage}>
                            <strong>{item.product_name}:</strong> "{item.gift_quote || 'No message'}"
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className={styles.mobileOrderFooter}>
                    <div className={styles.mobileOrderTotal}>
  <div className={styles.mobileOrderTotalRow}>
    <span>Subtotal</span>
    <strong>₹{order.total_amount - (deliveryCharge + giftCharges)}</strong>
  </div>
  {giftCharges > 0 && (
    <div className={styles.mobileOrderTotalRow}>
      <span>Gift Packing</span>
      <span>+ ₹{giftCharges}</span>
    </div>
  )}
  <div className={styles.mobileOrderTotalRow}>
    <span>Delivery Fee</span>
    <span className={deliveryCharge === 0 ? styles.freeDeliveryText : styles.paidDeliveryText}>
      {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
    </span>
  </div>
  <div className={styles.mobileOrderTotalRow}>
    <strong>Total</strong>
    <strong>₹{order.total_amount}</strong>
  </div>
</div>

                    <div className={styles.mobileButtonRow}>
                      {showPayNow && (
                        <button onClick={() => handlePayNow(order)} disabled={processingPayment === order.id} className={styles.mobilePayNowBtn}>
                          <FiCreditCard /> {processingPayment === order.id ? 'Processing...' : 'Pay Now'}
                        </button>
                      )}
                      <button onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)} className={styles.mobileTrackBtn}>
                        {selectedOrder === order.id ? 'Hide' : 'Track'}
                      </button>
                    </div>

                    <div className={styles.mobileButtonRow}>
                      <button onClick={() => downloadInvoiceAsPDF(order)} className={styles.mobileInvoiceBtn}>
                        <FiDownload /> Invoice
                      </button>
                      {delivered && hasReviewableItem ? (
                        <button onClick={() => openReviewModal(firstProductItem)} className={styles.mobileWriteReviewBtn}>
                          <FiStar /> Review
                        </button>
                      ) : (
                        <button className={styles.mobileReturnBtn} disabled={true}>
                          <FiRefreshCw /> Return
                        </button>
                      )}
                    </div>

                    {delivered && (
                      <div className={styles.mobileButtonRow}>
                        <button onClick={() => handleReturnClick(order)} className={styles.mobileReturnBtn}>
                          <FiRefreshCw /> Request Return
                        </button>
                      </div>
                    )}
                  </div>

                  {selectedOrder === order.id && (
                    <div className={styles.mobileOrderDetails}>
                      <div className={styles.mobileTrackingStatus}>
                        <h4>Order Status</h4>
                        {getStatusSteps(order.status)}
                      </div>
                      <div className={styles.mobileShippingInfo}>
                        <div className={styles.mobileInfoRow}><FiMapPin /><div><strong>Shipping Address</strong><p>{order.shipping_address}</p></div></div>
                        <div className={styles.mobileInfoRow}><FiDollarSign /><div><strong>Payment Method</strong>
                          <p>{order.payment_method === 'RAZORPAY' ? 'Online Payment (Razorpay)' : 'Cash on Delivery'}{(order.payment_status === 'paid' || delivered) && ' ✓ Paid'}</p>
                        </div></div>
                       <div className={styles.mobileInfoRow}>
  <FiTruck />
  <div>
    <strong>Delivery Fee</strong>
    <p className={deliveryCharge === 0 ? styles.freeDelivery : styles.paidDelivery}>
      {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
    </p>
  </div>
</div>
                        {giftCharges > 0 && (
                          <div className={styles.mobileInfoRow}><FiGift /><div><strong>Gift Packing</strong>
                            <p>Gift packing charge: ₹{giftCharges}</p>
                            {giftItems.map(item => <p key={item.id} style={{ fontSize: '10px', marginTop: '4px' }}>{item.product_name}: "{item.gift_quote || 'No message'}"</p>)}
                          </div></div>
                        )}
                        {order.payment_method === 'RAZORPAY' && order.razorpay_payment_id && (
                          <div className={styles.mobileInfoRow}><FiCheckCircle /><div><strong>Payment ID</strong>
                            <p style={{ fontSize: '10px', wordBreak: 'break-all' }}>{order.razorpay_payment_id}</p>
                          </div></div>
                        )}
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
                                  <div className={styles.mobileUpdateStatus}>{update.status?.toUpperCase().replace(/_/g, ' ')}</div>
                                  <div className={styles.mobileUpdateDate}>{new Date(update.timestamp).toLocaleString()}</div>
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
              );
            })}
          </div>
        )}

        {showReviewModal && <ReviewModal />}
        {showReturnModal && selectedOrderForReturn && (
          <ReturnModal
            order={selectedOrderForReturn}
            onClose={() => setShowReturnModal(false)}
            onSuccess={() => { setShowReturnModal(false); showToast('Return request submitted successfully!', 'success'); fetchOrders(); }}
          />
        )}
        {toast && <CustomToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        {alert && <CustomAlert title={alert.title} message={alert.message} type={alert.type} showReview={alert.showReview} reviewData={alert.reviewData} onClose={() => setAlert(null)} />}
      </div>
    );
  }

  // ============================================
  // DESKTOP ORDERS UI
  // ============================================
  return (
    <div className={styles.ordersPage}>
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>My Orders</h1>
          <p className={styles.pageSubtitle}>Track and manage your orders</p>
        </div>

        {successMessage && (
          <div className={styles.successMessage}><FiCheckCircle /> {successMessage}</div>
        )}

        {orders.length === 0 ? (
          <div className={styles.emptyOrders}>
            <div className={styles.emptyIcon}><FiShoppingBag /></div>
            <h2>No Orders Yet</h2>
            <p>You haven't placed any orders yet. Start shopping!</p>
            <Link to="/products" className={styles.shopBtn}>Start Shopping →</Link>
          </div>
        ) : (
          <div className={styles.ordersList}>
            {orders.map((order) => {
              const giftItems = getGiftItems(order.order_items);
              const hamperItems = getHamperItems(order.order_items);
              const giftCharges = calculateGiftCharges(order.order_items);
              const deliveryCharge = getDeliveryCharge(order);
              const delivered = isOrderDelivered(order);
              const showPayNow = needsPayment(order);
              const firstProductItem = getFirstProductItem(order.order_items);
              const hasReviewableItem = !!firstProductItem;

              return (
                <div key={order.id} className={styles.orderCard}>
                  <div className={styles.orderHeader}>
                    <div className={styles.orderInfo}>
                      <span className={styles.orderNumber}>#{order.order_number}</span>
                      <span className={styles.orderDate}>
                        <FiCalendar /> {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <div className={styles.badgeGroup}>
                      {getStatusBadge(order.status)}
                      {order.payment_method === 'COD' && order.payment_status !== 'paid' && !delivered && (
                        <span className={styles.codBadgeDesktop}>Cash on Delivery</span>
                      )}
                      {(order.payment_status === 'paid' || delivered) && (
                        <span className={styles.paidBadgeDesktop}>✓ Payment Received</span>
                      )}
                    </div>
                  </div>

                  <div className={styles.orderItems}>
                    {order.order_items && order.order_items.filter(i => i.item_type !== 'hamper').slice(0, 2).map((item) => (
                      <div key={item.id} className={styles.orderItem}>
                        <div className={styles.itemInfo}>
                          <span className={styles.itemName}>
                            {item.product_name}
                            {item.gift_packing && <span className={styles.giftIconDesktop}> 🎁 Gift Packed</span>}
                          </span>
                          <span className={styles.itemQuantity}>x{item.quantity}</span>
                        </div>
                        <div className={styles.itemPrice}>₹{(item.price * item.quantity) + (item.gift_charge || 0)}</div>
                      </div>
                    ))}
                    {hamperItems.slice(0, 1).map((item) => (
                      <div key={item.id} className={styles.orderItem}>
                        <div className={styles.itemInfo}>
                          <span className={styles.itemName}>
                            🎁 {item.product_name}
                            <span className={styles.giftIconDesktop}> Hamper</span>
                          </span>
                          <span className={styles.itemQuantity}>x{item.quantity}</span>
                        </div>
                        <div className={styles.itemPrice}>₹{item.price * item.quantity}</div>
                      </div>
                    ))}
                    {order.order_items && order.order_items.length > 3 && (
                      <div className={styles.moreItems}>+{order.order_items.length - 3} more items</div>
                    )}
                    {giftItems.length > 0 && (
                      <div className={styles.giftSummaryDesktop}>
                        <div className={styles.giftHeaderDesktop}><FiGift /> Gift Messages ({giftItems.length} item{giftItems.length > 1 ? 's' : ''})</div>
                        {giftItems.map(item => (
                          <div key={item.id} className={styles.giftMessageDesktop}>
                            <strong>{item.product_name}:</strong> "{item.gift_quote || 'No message added'}"
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className={styles.orderFooter}>
                    <div className={styles.orderTotal}>
                      <span>Total Amount:</span>
                      <strong>₹{order.total_amount}</strong>
                      {deliveryCharge > 0 && <span className={styles.giftTotalNote}>(includes ₹{deliveryCharge} delivery)</span>}
                      {deliveryCharge === 0 && <span className={styles.freeDeliveryNote}>(Free Delivery)</span>}
                    </div>
                    <div className={styles.orderActions}>
                      {showPayNow && (
                        <button onClick={() => handlePayNow(order)} disabled={processingPayment === order.id} className={styles.payNowBtn}>
                          <FiCreditCard /> {processingPayment === order.id ? 'Processing...' : 'Pay Now'}
                        </button>
                      )}
                      <button onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)} className={styles.trackBtn}>
                        {selectedOrder === order.id ? <FiChevronUp /> : <FiChevronDown />}
                        {selectedOrder === order.id ? 'Hide Tracking' : 'Track Order'}
                      </button>
                      <button onClick={() => downloadInvoiceAsPDF(order)} className={styles.invoiceBtn}>
                        <FiDownload /> Invoice
                      </button>
                      {delivered && hasReviewableItem && (
                        <button onClick={() => openReviewModal(firstProductItem)} className={styles.writeReviewBtnDesktop}>
                          <FiStar /> Write Review
                        </button>
                      )}
                      <button onClick={() => handleReturnClick(order)} className={styles.returnBtn} disabled={!delivered}>
                        <FiRefreshCw /> Request Return
                      </button>
                    </div>
                  </div>

                  {selectedOrder === order.id && (
                    <div className={styles.orderTracking}>
                      <div className={styles.trackingHeader}><FiTruck /><h4>Order Tracking</h4></div>
                      {getStatusSteps(order.status)}
                      <div className={styles.deliveryInfo}>
                        <div className={styles.deliveryItem}><FiMapPin /><div><strong>Shipping Address</strong><p>{order.shipping_address}</p></div></div>
                        <div className={styles.deliveryItem}><FiDollarSign /><div><strong>Payment Method</strong>
                          <p>{order.payment_method === 'RAZORPAY' ? 'Online Payment (Razorpay)' : 'Cash on Delivery'}{(order.payment_status === 'paid' || delivered) && ' ✓ Paid'}</p>
                        </div></div>
                        <div className={styles.deliveryItem}><FiTruck /><div><strong>Delivery Fee</strong>
                          <p className={deliveryCharge === 0 ? styles.freeDelivery : ''}>{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}</p>
                        </div></div>
                        {giftCharges > 0 && (
                          <div className={styles.deliveryItem}><FiGift /><div><strong>Gift Packing</strong>
                            <p>Gift packing charge: ₹{giftCharges}</p>
                            {giftItems.map(item => <p key={item.id} style={{ fontSize: '11px', marginTop: '4px' }}>{item.product_name}: "{item.gift_quote || 'No message added'}"</p>)}
                          </div></div>
                        )}
                        {order.payment_method === 'RAZORPAY' && order.razorpay_payment_id && (
                          <div className={styles.deliveryItem}><FiCheckCircle /><div><strong>Payment ID</strong>
                            <p style={{ fontSize: '11px', wordBreak: 'break-all' }}>{order.razorpay_payment_id}</p>
                          </div></div>
                        )}
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
                                  <span className={styles.updateDate}>{new Date(update.timestamp).toLocaleString()}</span>
                                  <span className={styles.updateStatus}>{update.status ? update.status.toUpperCase().replace(/_/g, ' ') : 'Updated'}</span>
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
              );
            })}
          </div>
        )}
      </div>

      {showReturnModal && selectedOrderForReturn && (
        <ReturnModal
          order={selectedOrderForReturn}
          onClose={() => setShowReturnModal(false)}
          onSuccess={() => { setShowReturnModal(false); showToast('Return request submitted successfully!', 'success'); fetchOrders(); }}
        />
      )}
      {showReviewModal && <ReviewModal />}
      {toast && <CustomToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {alert && <CustomAlert title={alert.title} message={alert.message} type={alert.type} showReview={alert.showReview} reviewData={alert.reviewData} onClose={() => setAlert(null)} />}
    </div>
  );
};

export default Orders;