import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { FiMail, FiArrowLeft, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import styles from './ForgotPassword.module.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Get the current URL for redirect
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      
      if (resetError) throw resetError;
      
      setSuccess('Password reset link sent! Check your email for the link to reset your password.');
      setEmail('');
    } catch (err) {
      console.error('Reset error:', err);
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.forgotPage}>
      <div className={styles.forgotContainer}>
        <div className={styles.forgotCard}>
          <Link to="/login" className={styles.backLink}>
            <FiArrowLeft /> Back to Login
          </Link>
          
          <div className={styles.header}>
            <div className={styles.icon}>🔐</div>
            <h2>Forgot Password?</h2>
            <p>Enter your email address and we'll send you a link to reset your password.</p>
          </div>

          {error && (
            <div className={styles.errorMessage}>
              <FiAlertCircle />
              {error}
            </div>
          )}
          
          {success && (
            <div className={styles.successMessage}>
              <FiCheckCircle />
              {success}
            </div>
          )}

          <form onSubmit={handleResetPassword}>
            <div className={styles.inputGroup}>
              <label>Email Address</label>
              <div className={styles.inputWrapper}>
                <FiMail className={styles.inputIcon} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button type="submit" className={styles.resetBtn} disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;