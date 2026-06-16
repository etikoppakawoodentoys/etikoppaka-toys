import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { FiLock, FiEye, FiEyeOff, FiCheckCircle, FiAlertCircle, FiArrowLeft } from 'react-icons/fi';
import styles from './ResetPassword.module.css';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResetToken = async () => {
      try {
        // Get token from URL hash
        const hash = window.location.hash;
        console.log('Hash:', hash);
        
        if (!hash || !hash.includes('access_token')) {
          setError('Invalid reset link. Please request a new password reset.');
          setChecking(false);
          return;
        }
        
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const type = params.get('type');
        
        console.log('Access token found:', !!accessToken);
        console.log('Refresh token found:', !!refreshToken);
        console.log('Type:', type);
        
        if (!accessToken) {
          setError('Invalid reset link. No token found.');
          setChecking(false);
          return;
        }
        
        // FIRST: Try to set the session with both tokens
        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (!sessionError) {
            console.log('Session set successfully with tokens');
            setChecking(false);
            return;
          }
        }
        
        // SECOND: Try verifyOtp for recovery
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: accessToken,
          type: 'recovery',
        });
        
        if (verifyError) {
          console.error('Verification error:', verifyError);
          setError('Invalid or expired reset link. Please request a new password reset.');
          setChecking(false);
          return;
        }
        
        console.log('Token verified successfully');
        setChecking(false);
        
      } catch (err) {
        console.error('Error:', err);
        setError('Something went wrong. Please try again.');
        setChecking(false);
      }
    };
    
    handleResetToken();
  }, []);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });
      
      if (updateError) {
        console.error('Update error:', updateError);
        
        if (updateError.message === 'Auth session missing!') {
          setError('Session expired. Please request a new password reset link.');
        } else {
          setError(updateError.message || 'Failed to update password');
        }
        setLoading(false);
        return;
      }
      
      setSuccess('Password updated successfully! Redirecting to login...');
      
      // Sign out after password reset
      await supabase.auth.signOut();
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (err) {
      console.error('Reset error:', err);
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const requestNewResetLink = async () => {
    const email = prompt('Enter your email address to receive a new reset link:');
    if (email && email.includes('@')) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        
        if (error) {
          alert('Error: ' + error.message);
        } else {
          alert('✅ Reset link sent! Please check your email inbox (and spam folder).');
        }
      } catch (err) {
        alert('Failed to send reset link. Please try again.');
      }
    } else if (email) {
      alert('Please enter a valid email address.');
    }
  };

  if (checking) {
    return (
      <div className={styles.resetPage}>
        <div className={styles.resetContainer}>
          <div className={styles.resetCard}>
            <div className={styles.header}>
              <div className={styles.icon}>⏳</div>
              <h2>Verifying Reset Link</h2>
              <p>Please wait...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !success) {
    return (
      <div className={styles.resetPage}>
        <div className={styles.resetContainer}>
          <div className={styles.resetCard}>
            <Link to="/login" className={styles.backLink}>
              <FiArrowLeft /> Back to Login
            </Link>
            <div className={styles.header}>
              <div className={styles.icon}>🔗</div>
              <h2>Reset Link Issue</h2>
            </div>
            <div className={styles.errorMessage}>
              <FiAlertCircle />
              {error}
            </div>
            <button onClick={requestNewResetLink} className={styles.requestNewBtn}>
              Request New Reset Link
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.resetPage}>
      <div className={styles.resetContainer}>
        <div className={styles.resetCard}>
          <Link to="/login" className={styles.backLink}>
            <FiArrowLeft /> Back to Login
          </Link>
          
          <div className={styles.header}>
            <div className={styles.icon}>🔒</div>
            <h2>Reset Password</h2>
            <p>Enter your new password below.</p>
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
              <label>New Password</label>
              <div className={styles.inputWrapper}>
                <FiLock className={styles.inputIcon} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                  required
                  disabled={loading}
                />
                <button 
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Confirm New Password</label>
              <div className={styles.inputWrapper}>
                <FiLock className={styles.inputIcon} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  required
                  disabled={loading}
                />
                <button 
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className={styles.resetBtn} 
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Reset Password →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;