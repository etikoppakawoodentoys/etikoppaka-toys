// src/pages/PaymentStatus.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';
import { getPaymentDetailsByOrder } from '../services/paymentService';
import styles from './PaymentStatus.module.css';

const PaymentStatus = () => {
  const location = useLocation();
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const params = new URLSearchParams(location.search);
  const razorpayPaymentId = params.get('razorpay_payment_id');
  const razorpayOrderId = params.get('razorpay_order_id');
  const razorpaySignature = params.get('razorpay_signature');
  
  useEffect(() => {
    if (razorpayPaymentId) {
      fetchPaymentDetails();
    } else {
      setLoading(false);
    }
  }, [razorpayPaymentId]);
  
  const fetchPaymentDetails = async () => {
    // You would fetch order details using the payment ID
    setLoading(false);
  };
  
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
      </div>
    );
  }
  
  return (
    <div className={styles.paymentStatusPage}>
      <div className={styles.paymentCard}>
        {razorpayPaymentId ? (
          <>
            <div className={styles.successIcon}>
              <FiCheckCircle />
            </div>
            <h2>Payment Successful!</h2>
            <p>Your payment has been received successfully.</p>
            <div className={styles.paymentDetails}>
              <div className={styles.detailRow}>
                <span>Payment ID:</span>
                <strong>{razorpayPaymentId}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Order ID:</span>
                <strong>{razorpayOrderId}</strong>
              </div>
            </div>
            <Link to="/orders" className={styles.viewOrdersBtn}>
              View My Orders
            </Link>
          </>
        ) : (
          <>
            <div className={styles.errorIcon}>
              <FiXCircle />
            </div>
            <h2>Payment Pending</h2>
            <p>We didn't receive payment confirmation. Please check your orders.</p>
            <Link to="/orders" className={styles.viewOrdersBtn}>
              Check Orders
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentStatus;