import React, { useEffect } from 'react';
import { FiCheckCircle, FiAlertCircle, FiX, FiStar, FiInfo } from 'react-icons/fi';
import styles from './CustomAlert.module.css';

const CustomAlert = ({ message, title, type, onClose, showReview = false, reviewData = null }) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FiCheckCircle />;
      case 'error':
        return <FiAlertCircle />;
      case 'warning':
        return <FiAlertCircle />;
      case 'info':
        return <FiInfo />;
      case 'review':
        return <FiStar />;
      default:
        return <FiCheckCircle />;
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return '#10B981';
      case 'error':
        return '#EF4444';
      case 'warning':
        return '#F59E0B';
      case 'info':
        return '#3B82F6';
      case 'review':
        return '#F59E0B';
      default:
        return '#10B981';
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.alert} onClick={(e) => e.stopPropagation()}>
        <div className={styles.alertIcon} style={{ background: `${getIconColor()}15`, color: getIconColor() }}>
          {getIcon()}
        </div>
        
        <div className={styles.alertContent}>
          <h3 className={styles.alertTitle}>{title}</h3>
          <p className={styles.alertMessage}>{message}</p>
          
          {showReview && reviewData && (
            <div className={styles.reviewPreview}>
              <div className={styles.reviewRating}>
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={i < reviewData.rating ? styles.starFilled : styles.starEmpty}>★</span>
                ))}
              </div>
              <div className={styles.reviewText}>"{reviewData.comment}"</div>
            </div>
          )}
        </div>
        
        <button className={styles.alertClose} onClick={onClose}>
          <FiX />
        </button>
        
        <button className={styles.alertButton} onClick={onClose}>
          Got it
        </button>
      </div>
    </div>
  );
};

export default CustomAlert;