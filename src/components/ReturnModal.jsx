import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { FiX, FiUpload, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import styles from './ReturnModal.module.css';
import { sendEmailNotification } from '../services/emailService';

const ReturnModal = ({ order, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [resolutionPreference, setResolutionPreference] = useState('refund');
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const reasons = [
    { value: 'damaged', label: 'Product arrived damaged', icon: '📦' },
    { value: 'wrong_item', label: 'Wrong item received', icon: '❌' },
    { value: 'defective', label: 'Product is defective', icon: '⚠️' },
    { value: 'quality_issue', label: 'Quality not as expected', icon: '🔍' },
    { value: 'missing_parts', label: 'Missing parts or accessories', icon: '🔧' },
    { value: 'size_issue', label: 'Size doesn\'t fit', icon: '📏' },
    { value: 'changed_mind', label: 'Changed my mind', icon: '🤔' },
    { value: 'other', label: 'Other issue', icon: '📝' }
  ];

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    setUploading(true);
    
    const uploadedUrls = [];
    for (const file of files) {
      const fileName = `${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from('return-images')
        .upload(fileName, file);
      
      if (!error && data) {
        const { data: { publicUrl } } = supabase.storage
          .from('return-images')
          .getPublicUrl(fileName);
        uploadedUrls.push(publicUrl);
      }
    }
    
    setImages([...images, ...uploadedUrls]);
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!selectedReason) {
      setMessage({ type: 'error', text: 'Please select a reason for return' });
      return;
    }
    
    if (!issueDescription.trim()) {
      setMessage({ type: 'error', text: 'Please describe the issue' });
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('returns')
        .insert({
          order_id: order.id,
          order_number: order.order_number,
          user_id: user.id,
          reason: selectedReason,
          issue_description: issueDescription,
          resolution_preference: resolutionPreference,
          images: images,
          status: 'pending'
        });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Return request submitted successfully!' });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to submit return request' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Return Request</h3>
          <button onClick={onClose} className={styles.closeBtn}>✕</button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.orderInfo}>
            <p><strong>Order #{order.order_number}</strong></p>
            <p>Placed on: {new Date(order.created_at).toLocaleDateString()}</p>
            <p>Amount: ₹{order.total_amount}</p>
          </div>

          {message && (
            <div className={`${styles.message} ${styles[message.type]}`}>
              {message.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
              {message.text}
            </div>
          )}

          <div className={styles.formGroup}>
            <label>Reason for Return *</label>
            <div className={styles.reasonsGrid}>
              {reasons.map(reason => (
                <button
                  key={reason.value}
                  className={`${styles.reasonBtn} ${selectedReason === reason.value ? styles.selected : ''}`}
                  onClick={() => setSelectedReason(reason.value)}
                >
                  <span>{reason.icon}</span>
                  <span>{reason.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Describe the issue in detail *</label>
            <textarea
              rows={4}
              placeholder="Please provide detailed information about the issue..."
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Resolution Preference</label>
            <div className={styles.resolutionOptions}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  value="refund"
                  checked={resolutionPreference === 'refund'}
                  onChange={(e) => setResolutionPreference(e.target.value)}
                />
                Refund to original payment method
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  value="replacement"
                  checked={resolutionPreference === 'replacement'}
                  onChange={(e) => setResolutionPreference(e.target.value)}
                />
                Replacement with new item
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  value="store_credit"
                  checked={resolutionPreference === 'store_credit'}
                  onChange={(e) => setResolutionPreference(e.target.value)}
                />
                Store credit/gift card
              </label>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Upload Images (Optional)</label>
            <div className={styles.imageUploadArea}>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                id="imageUpload"
                style={{ display: 'none' }}
              />
              <label htmlFor="imageUpload" className={styles.uploadLabel}>
                <FiUpload /> {uploading ? 'Uploading...' : 'Click to upload images'}
              </label>
              {images.length > 0 && (
                <div className={styles.imagePreview}>
                  {images.map((img, idx) => (
                    <img key={idx} src={img} alt={`Preview ${idx}`} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.cancelBtn}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className={styles.submitBtn}>
            {loading ? 'Submitting...' : 'Submit Return Request'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReturnModal;