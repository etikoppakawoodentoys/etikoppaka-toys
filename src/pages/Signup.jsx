import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft } from 'react-icons/fi';
import styles from './Signup.module.css';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (!name || !email || !password) {
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
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            name: name,
            role: 'customer'
          }
        }
      });
      
      if (signUpError) throw signUpError;
      
      if (data.user) {
        setSuccess('Account created successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      console.error('Signup error:', err);
      if (err.message === 'User already registered') {
        setError('Email already registered. Please login instead.');
      } else {
        setError(err.message || 'Signup failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // MOBILE SIGNUP UI
  // ============================================
  if (isMobile) {
    return (
      <div className={styles.mobileSignupPage}>
        {/* Mobile Header */}
        <div className={styles.mobileHeader}>
          <button onClick={() => navigate('/')} className={styles.mobileBackBtn}>
            <FiArrowLeft />
          </button>
          <h1>Create Account</h1>
          <div className={styles.mobilePlaceholder}></div>
        </div>

        {/* Mobile Logo */}
        <div className={styles.mobileLogoContainer}>
          <img src="/logo.png" alt="Etikoppaka Toys" className={styles.mobileLogo} />
        </div>

        {/* Mobile Signup Form */}
        <div className={styles.mobileSignupCard}>
          <h2>Join Us</h2>
          <p className={styles.mobileSubtitle}>Create your account to start shopping</p>

          {error && <div className={styles.mobileErrorMessage}>{error}</div>}
          {success && <div className={styles.mobileSuccessMessage}>{success}</div>}

          <form onSubmit={handleSignup}>
            <div className={styles.mobileInputGroup}>
              <FiUser className={styles.mobileInputIcon} />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                required
                disabled={loading}
              />
            </div>

            <div className={styles.mobileInputGroup}>
              <FiMail className={styles.mobileInputIcon} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                disabled={loading}
              />
            </div>

            <div className={styles.mobileInputGroup}>
              <FiLock className={styles.mobileInputIcon} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min 6 characters)"
                required
                disabled={loading}
              />
              <button 
                type="button"
                className={styles.mobilePasswordToggle}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            <div className={styles.mobileInputGroup}>
              <FiLock className={styles.mobileInputIcon} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                required
                disabled={loading}
              />
              <button 
                type="button"
                className={styles.mobilePasswordToggle}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            <button type="submit" className={styles.mobileSubmitBtn} disabled={loading}>
              {loading ? 'Creating Account...' : 'Sign Up →'}
            </button>
          </form>

          <div className={styles.mobileLoginLink}>
            Already have an account? <Link to="/login">Sign In</Link>
          </div>
        </div>

        {/* Mobile Footer */}
        <div className={styles.mobileFooter}>
          <p>By signing up, you agree to our Terms of Service & Privacy Policy</p>
        </div>
      </div>
    );
  }

  // ============================================
  // DESKTOP SIGNUP UI
  // ============================================
  return (
    <div className={styles.signupPage}>
      <div className={styles.signupContainer}>
        <div className={styles.signupLeft}>
          <div className={styles.brand}>
            <img src="/logo.png" alt="Etikoppaka Toys" className={styles.brandLogo} />
          </div>
          <div className={styles.features}>
            <div className={styles.feature}>
              <span>✓</span> Easy checkout with COD
            </div>
            <div className={styles.feature}>
              <span>✓</span> Track your orders
            </div>
            <div className={styles.feature}>
              <span>✓</span> Save multiple addresses
            </div>
            <div className={styles.feature}>
              <span>✓</span> Get exclusive deals & offers
            </div>
          </div>
        </div>

        <div className={styles.signupRight}>
          <div className={styles.signupCard}>
            <h3>Create Account</h3>
            <p className={styles.subtitle}>Join our traditional toy community</p>

            {error && <div className={styles.errorMessage}>{error}</div>}
            {success && <div className={styles.successMessage}>{success}</div>}

            <form onSubmit={handleSignup}>
              <div className={styles.inputGroup}>
                <label>Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  disabled={loading}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  disabled={loading}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password (min 6 characters)"
                  required
                  disabled={loading}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  disabled={loading}
                />
              </div>

              <button type="submit" className={styles.signupBtn} disabled={loading}>
                {loading ? 'Creating Account...' : 'Sign Up →'}
              </button>
            </form>

            <div className={styles.loginLink}>
              Already have an account? <Link to="/login">Login here</Link>
            </div>

            <div className={styles.terms}>
              By signing up, you agree to our Terms of Service and Privacy Policy
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;