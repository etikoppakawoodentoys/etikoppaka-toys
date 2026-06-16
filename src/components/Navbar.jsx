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
  FiPackage,
  FiHeart
} from 'react-icons/fi';
import { FaStore, FaBoxOpen, FaUserShield, FaChild } from 'react-icons/fa';
import styles from './Navbar.module.css';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [kidsCount, setKidsCount] = useState(0);
  const [redirected, setRedirected] = useState(false);
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
    fetchKidsCount();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        loadUserProfile(session.user.id);
        getCartCount(session.user.id);
      } else {
        setUserProfile(null);
        setCartCount(0);
        setRedirected(false);
      }
    });
    
    const handleCartUpdate = () => {
      if (user) {
        getCartCount(user.id);
      }
    };
    
    const productsSubscription = supabase
      .channel('products-channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'products' }, 
        () => {
          fetchKidsCount();
        }
      )
      .subscribe();
    
    window.addEventListener('itemAddedToCart', handleCartUpdate);
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      subscription.unsubscribe();
      productsSubscription.unsubscribe();
      window.removeEventListener('itemAddedToCart', handleCartUpdate);
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, [user]);

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
    if (data) {
      setUserProfile(data);
      const adminStatus = data.is_admin === true;
      
      // Redirect admin to dashboard if not already there and not redirected yet
      if (adminStatus && location.pathname !== '/admin' && !redirected) {
        setRedirected(true);
        navigate('/admin', { replace: true });
      }
    }
  };

  const getCartCount = async (userId) => {
    const { data } = await supabase.from('cart_items').select('quantity').eq('user_id', userId);
    if (data) setCartCount(data.reduce((sum, item) => sum + item.quantity, 0));
  };

  const fetchKidsCount = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category', 'Kids')
      .gte('stock_quantity', 1);
    
    if (!error && data) {
      setKidsCount(data.length);
    } else {
      setKidsCount(0);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
    window.location.reload();
  };

  const isActive = (path) => location.pathname === path;
  const isAdmin = userProfile?.is_admin === true;

  // Mobile view - Bottom Navigation Bar
  if (isMobile) {
    return (
      <>
        <div className={styles.bottomBar}>
          {/* For Admin: Only Dashboard and Profile */}
          {isAdmin ? (
            <>
              <Link to="/admin" className={isActive('/admin') ? styles.active : ''}>
                <FiGrid />
                <span>Dashboard</span>
              </Link>
             
            </>
          ) : (
            // For Regular Users: All navigation items
            <>
              <Link to="/" className={isActive('/') ? styles.active : ''}>
                <FiHome />
                <span>Home</span>
              </Link>
              
              {/* Shining Kids Link - Mobile */}
              <Link to="/kids" className={`${styles.kidsNavLink} ${isActive('/kids') ? styles.kidsActive : ''}`}>
                <div className={styles.kidsIconWrapper}>
                  <FaChild />
                  <div className={styles.kidsGlow}></div>
                </div>
                <span className={styles.kidsText}>Kids</span>
                {kidsCount > 0 && <span className={styles.kidsBadgeMobile}>{kidsCount}</span>}
              </Link>
              
              <Link to="/products" className={isActive('/products') ? styles.active : ''}>
                <FiShoppingBag />
                <span>Shop</span>
              </Link>
              
              <Link to="/bulk-order" className={isActive('/bulk-order') ? styles.active : ''}>
                <FiPackage />
                <span>Bulk</span>
              </Link>
              
              <Link to="/deals" className={isActive('/deals') ? styles.active : ''}>
                <FiTag />
                <span>Deals</span>
              </Link>
              
              <Link to="/cart" className={isActive('/cart') ? styles.active : ''}>
                <FiShoppingCart />
                <span>Cart</span>
                {cartCount > 0 && <span className={styles.bottomCartBadge}>{cartCount}</span>}
              </Link>
              
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
            </>
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
            {/* For Admin: Only Dashboard and Profile */}
            {isAdmin ? (
              <>
                <Link to="/admin" className={`${styles.navLink} ${isActive('/admin') ? styles.active : ''}`}>
                  <FiGrid className={styles.icon} />
                  <span>Dashboard</span>
                </Link>
                
                
              </>
            ) : (
              // For Regular Users: All navigation items
              <>
                <Link to="/" className={`${styles.navLink} ${isActive('/') ? styles.active : ''}`}>
                  <FiHome className={styles.icon} />
                  <span>Home</span>
                </Link>
                
                {/* Shining Kids Link - Desktop */}
                <Link to="/kids" className={`${styles.kidsNavLink} ${isActive('/kids') ? styles.kidsActive : ''}`}>
                  <div className={styles.kidsIconWrapper}>
                    <FaChild />
                    <div className={styles.kidsGlow}></div>
                    <div className={styles.kidsSparkle}></div>
                  </div>
                  <span className={styles.kidsText}>Kids</span>
                  {kidsCount > 0 && <span className={styles.kidsBadgeDesktop}>{kidsCount}</span>}
                </Link>
                
                <Link to="/products" className={`${styles.navLink} ${isActive('/products') ? styles.active : ''}`}>
                  <FiShoppingBag className={styles.icon} />
                  <span>Products</span>
                </Link>
                
                <Link to="/bulk-order" className={`${styles.navLink} ${isActive('/bulk-order') ? styles.active : ''}`}>
                  <FiPackage className={styles.icon} />
                  <span>Bulk Order</span>
                </Link>
                
                <Link to="/deals" className={`${styles.navLink} ${isActive('/deals') ? styles.active : ''}`}>
                  <FiTag className={styles.icon} />
                  <span>Deals</span>
                </Link>
                
                <Link to="/cart" className={`${styles.navLink} ${isActive('/cart') ? styles.active : ''}`}>
                  <FiShoppingCart className={styles.icon} />
                  <span>Cart</span>
                  {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
                </Link>
                
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
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;