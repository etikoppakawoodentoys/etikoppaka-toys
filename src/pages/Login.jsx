import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft } from 'react-icons/fi';
import styles from './Login.module.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });
      
      if (signInError) throw signInError;
      
      if (data.user) {
        const userSession = {
          email: email,
          name: data.user.user_metadata?.name || email.split('@')[0],
          loggedInAt: Date.now(),
          expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
        };
        localStorage.setItem('user_session', JSON.stringify(userSession));
        
        navigate('/');
        window.location.reload();
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err.message === 'Invalid login credentials') {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // MOBILE LOGIN UI
  // ============================================
  if (isMobile) {
    return (
      <div className={styles.mobileLoginPage}>
        {/* Mobile Header */}
        <div className={styles.mobileHeader}>
          <button onClick={() => navigate('/')} className={styles.mobileBackBtn}>
            <FiArrowLeft />
          </button>
          <h1>Welcome Back</h1>
          <div className={styles.mobilePlaceholder}></div>
        </div>

        {/* Mobile Logo */}
        <div className={styles.mobileLogoContainer}>
          <img src="/logo.png" alt="Etikoppaka Toys" className={styles.mobileLogo} />
        </div>

        {/* Mobile Login Form */}
        <div className={styles.mobileLoginCard}>
          <h2>Sign In</h2>
          <p className={styles.mobileSubtitle}>Enter your credentials to access your account</p>

          {error && <div className={styles.mobileErrorMessage}>{error}</div>}

          <form onSubmit={handleLogin}>
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
                placeholder="Password"
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

            <div className={styles.mobileForgotLink}>
              <Link to="/forgot-password">Forgot Password?</Link>
            </div>

            <button type="submit" className={styles.mobileSubmitBtn} disabled={loading}>
              {loading ? 'Logging in...' : 'Sign In →'}
            </button>
          </form>

          <div className={styles.mobileSignupLink}>
            Don't have an account? <Link to="/signup">Sign Up</Link>
          </div>
        </div>

        {/* Mobile Footer Text */}
        <div className={styles.mobileFooter}>
          <p>By continuing, you agree to our Terms of Service & Privacy Policy</p>
        </div>
      </div>
    );
  }

  // ============================================
  // DESKTOP LOGIN UI (Existing Premium Style)
  // ============================================
  return (
    <div className={styles.loginPage}>
      <div className={styles.loginContainer}>
        <div className={styles.loginLeft}>
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
              <span>✓</span> Save your addresses
            </div>
            <div className={styles.feature}>
              <span>✓</span> Get exclusive deals
            </div>
          </div>
        </div>

        <div className={styles.loginRight}>
          <div className={styles.loginCard}>
            <h3>Welcome Back!</h3>
            <p className={styles.subtitle}>Login to your account</p>

            {error && <div className={styles.errorMessage}>{error}</div>}

            <form onSubmit={handleLogin}>
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
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                />
              </div>

              <div className={styles.forgotPasswordLink}>
                <Link to="/forgot-password">Forgot Password?</Link>
              </div>

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? 'Logging in...' : 'Login →'}
              </button>
            </form>

            <div className={styles.signupLink}>
              Don't have an account? <Link to="/signup">Create Account</Link>
            </div>

            <div className={styles.terms}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;