import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { 
  FiHome, 
  FiShoppingBag, 
  FiTag, 
  FiShoppingCart, 
  FiUser, 
  FiLogOut, 
  FiChevronDown,
  FiGrid,
  FiPackage
} from 'react-icons/fi';
import { FaStore, FaBoxOpen, FaUserShield } from 'react-icons/fa';
import styles from './Navbar.module.css';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        loadUserProfile(session.user.id);
        getCartCount(session.user.id);
      } else {
        setUserProfile(null);
        setCartCount(0);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleScroll = () => {
    setScrolled(window.scrollY > 50);
  };

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      await loadUserProfile(user.id);
      await getCartCount(user.id);
    }
  };

  const loadUserProfile = async (userId) => {
    const { data } = await supabase.from('users').select('*').eq('id', userId).single();
    if (data) setUserProfile(data);
  };

  const getCartCount = async (userId) => {
    const { data } = await supabase.from('cart_items').select('quantity').eq('user_id', userId);
    if (data) setCartCount(data.reduce((sum, item) => sum + item.quantity, 0));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
    window.location.reload();
  };

  const isActive = (path) => location.pathname === path;

  // Check if user is admin
  const isAdmin = userProfile?.is_admin === true;

  // Mobile view - Bottom Navigation Bar
  if (isMobile) {
    return (
      <>
        {/* Mobile Bottom Navigation Bar */}
        <div className={styles.bottomBar}>
          <Link to="/" className={isActive('/') ? styles.active : ''}>
            <FiHome />
            <span>Home</span>
          </Link>
          <Link to="/products" className={isActive('/products') ? styles.active : ''}>
            <FiShoppingBag />
            <span>Shop</span>
          </Link>
          
          {/* Bulk Order Link - Mobile */}
          <Link to="/bulk-order" className={isActive('/bulk-order') ? styles.active : ''}>
            <FiPackage />
            <span>Bulk</span>
          </Link>
          
          <Link to="/deals" className={isActive('/deals') ? styles.active : ''}>
            <FiTag />
            <span>Deals</span>
          </Link>
          
          {/* Show Admin Dashboard instead of Cart for Admin on Mobile */}
          {isAdmin ? (
            <Link to="/admin" className={isActive('/admin') ? styles.active : ''}>
              <FiGrid />
              <span>Admin</span>
            </Link>
          ) : (
            <Link to="/cart" className={isActive('/cart') ? styles.active : ''}>
              <FiShoppingCart />
              <span>Cart</span>
              {cartCount > 0 && <span className={styles.bottomCartBadge}>{cartCount}</span>}
            </Link>
          )}
          
          {user ? (
            <Link to="/profile" className={isActive('/profile') ? styles.active : ''}>
              <FiUser />
              <span>Profile</span>
            </Link>
          ) : (
            <Link to="/login" className={isActive('/login') ? styles.active : ''}>
              <FiUser />
              <span>Login</span>
            </Link>
          )}
        </div>
      </>
    );
  }

  // Desktop view - Full Navbar
  return (
    <>
      <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
        <div className={styles.navContainer}>
          <Link to="/" className={styles.logo}>
            <img src="/logo.png" alt="Etikoppaka Toys" className={styles.logoImage} />
          </Link>

          <div className={styles.navLinks}>
            <Link to="/" className={`${styles.navLink} ${isActive('/') ? styles.active : ''}`}>
              <FiHome className={styles.icon} />
              <span>Home</span>
            </Link>
            <Link to="/products" className={`${styles.navLink} ${isActive('/products') ? styles.active : ''}`}>
              <FiShoppingBag className={styles.icon} />
              <span>Products</span>
            </Link>
            
            {/* Bulk Order Link - Desktop */}
            <Link to="/bulk-order" className={`${styles.navLink} ${isActive('/bulk-order') ? styles.active : ''}`}>
              <FiPackage className={styles.icon} />
              <span>Bulk Order</span>
            </Link>
            
            <Link to="/deals" className={`${styles.navLink} ${isActive('/deals') ? styles.active : ''}`}>
              <FiTag className={styles.icon} />
              <span>Deals</span>
            </Link>
            
            {isAdmin ? (
              <Link to="/admin" className={`${styles.navLink} ${isActive('/admin') ? styles.active : ''}`}>
                <FiGrid className={styles.icon} />
                <span>Dashboard</span>
              </Link>
            ) : (
              <Link to="/cart" className={`${styles.navLink} ${isActive('/cart') ? styles.active : ''}`}>
                <FiShoppingCart className={styles.icon} />
                <span>Cart</span>
                {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
              </Link>
            )}
            
            {user ? (
              <div className={styles.userMenu}>
                <button className={styles.profileBtn}>
                  <div className={styles.avatar}>
                    {userProfile?.name ? userProfile.name[0].toUpperCase() : user.email[0].toUpperCase()}
                  </div>
                  <span className={styles.userName}>{userProfile?.name?.split(' ')[0] || user.email?.split('@')[0]}</span>
                  <FiChevronDown className={styles.chevron} />
                </button>
                <div className={styles.dropdown}>
                  <Link to="/profile"><FiUser /> My Profile</Link>
                  <Link to="/orders"><FaBoxOpen /> My Orders</Link>
                  <button onClick={handleLogout}><FiLogOut /> Logout</button>
                </div>
              </div>
            ) : (
              <div className={styles.authButtons}>
                <Link to="/login" className={styles.loginBtn}><FiUser /> Login</Link>
                <Link to="/signup" className={styles.signupBtn}><FaStore /> Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;