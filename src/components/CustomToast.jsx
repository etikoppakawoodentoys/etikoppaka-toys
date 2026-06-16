import React, { useEffect } from 'react';
import { FiCheckCircle, FiAlertCircle, FiX, FiStar } from 'react-icons/fi';
import styles from './CustomToast.module.css';

const CustomToast = ({ message, type, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FiCheckCircle />;
      case 'error':
        return <FiAlertCircle />;
      case 'warning':
        return <FiAlertCircle />;
      case 'info':
        return <FiStar />;
      default:
        return <FiCheckCircle />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'success':
        return 'Success!';
      case 'error':
        return 'Error!';
      case 'warning':
        return 'Warning!';
      case 'info':
        return 'Info';
      default:
        return '';
    }
  };

  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      <div className={styles.toastIcon}>{getIcon()}</div>
      <div className={styles.toastContent}>
        <div className={styles.toastTitle}>{getTitle()}</div>
        <div className={styles.toastMessage}>{message}</div>
      </div>
      <button className={styles.toastClose} onClick={onClose}>
        <FiX />
      </button>
      <div className={styles.toastProgress} style={{ animationDuration: `${duration}ms` }}></div>
    </div>
  );
};

export default CustomToast;