import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { FiX, FiCheckCircle, FiAlertCircle, FiShield } from 'react-icons/fi';
import styles from './ReturnModal.module.css';

const ReturnModal = ({ order, onClose, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const returnReasons = [
    'Damaged product received',
    'Wrong product received',
    'Product not as described',
    'Size/color not as expected',
    'Quality issues',
    'Changed my mind',
    'Other'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason) {
      setMessage('Please select a reason for return');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setSubmitting(true);
    setMessage('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessage('Please login to submit return request');
      setTimeout(() => setMessage(''), 3000);
      setSubmitting(false);
      return;
    }

    // Check if return already exists for this order
    const { data: existingReturn } = await supabase
      .from('returns')
      .select('id, status')
      .eq('order_id', order.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingReturn) {
      setMessage(`Return request already submitted. Status: ${existingReturn.status}`);
      setTimeout(() => setMessage(''), 3000);
      setSubmitting(false);
      return;
    }

    // Insert return request
    const { error } = await supabase
      .from('returns')
      .insert({
        order_id: order.id,
        user_id: user.id,
        reason: reason,
        details: details || null,
        status: 'pending',
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Return error:', error);
      setMessage(error.message || 'Failed to submit return request');
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage('Return request submitted successfully!');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 2000);
    }

    setSubmitting(false);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Request Return</h3>
          <button onClick={onClose} className={styles.closeBtn}>
            <FiX />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          {message && (
            <div className={`${styles.message} ${message.includes('successfully') ? styles.success : styles.error}`}>
              {message.includes('successfully') ? <FiCheckCircle /> : <FiAlertCircle />}
              <span>{message}</span>
            </div>
          )}
          
          <div className={styles.formGroup}>
            <label>Order Number</label>
            <input type="text" value={order.order_number} disabled className={styles.disabledInput} />
          </div>

          <div className={styles.formGroup}>
            <label>Order Items</label>
            <div className={styles.orderItemsList}>
              {order.order_items && order.order_items.map((item) => (
                <div key={item.id} className={styles.orderItemCard}>
                  <div className={styles.orderItemInfo}>
                    <span className={styles.orderItemName}>{item.product_name}</span>
                    <span className={styles.orderItemQty}>Qty: {item.quantity}</span>
                    <span className={styles.orderItemPrice}>₹{item.price * item.quantity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label>Reason for Return *</label>
            <select value={reason} onChange={(e) => setReason(e.target.value)} required>
              <option value="">Select a reason</option>
              {returnReasons.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label>Additional Details (Optional)</label>
            <textarea
              rows="4"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Please provide more details about the issue... (e.g., which part is damaged, describe the issue)"
            />
          </div>
          
          <div className={styles.infoBox}>
            <FiShield />
            <div>
              <strong>Return Instructions:</strong>
              <ul>
                <li>Keep the product in original packaging</li>
                <li>Our team will contact you within 24-48 hours</li>
                <li>Free pickup arranged for defective items</li>
                <li>Self-ship returns accepted with shipping reimbursement up to ₹100</li>
              </ul>
            </div>
          </div>
          
          <div className={styles.formActions}>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} className={styles.submitBtn}>
              {submitting ? 'Submitting...' : 'Submit Return Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReturnModal;