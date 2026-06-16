import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { 
  FiMapPin, 
  FiPhone, 
  FiMail, 
  FiClock, 
  FiFacebook, 
  FiInstagram, 
  FiTwitter, 
  FiYoutube,
  FiShoppingBag,
  FiTag,
  FiHome,
  FiPackage,
  FiShield,
  FiTruck,
  FiCheckCircle,
  FiAlertCircle,
  FiHeart,
  FiUser,
  FiRefreshCw,     
  FiHelpCircle,
  FiExternalLink
} from 'react-icons/fi';
import styles from './Footer.module.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = useState({ type: '', text: '' });
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check if current path is an admin page
  const isAdminPage = location.pathname.startsWith('/admin');

  // Don't render footer on any admin page (desktop or mobile)
  if (isAdminPage) {
    return null;
  }

  const handleSubscribe = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setSubscriptionMessage({ type: 'error', text: 'Please enter your email address' });
      setTimeout(() => setSubscriptionMessage({ type: '', text: '' }), 3000);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setSubscriptionMessage({ type: 'error', text: 'Please enter a valid email address' });
      setTimeout(() => setSubscriptionMessage({ type: '', text: '' }), 3000);
      return;
    }

    setIsSubscribing(true);
    setSubscriptionMessage({ type: '', text: '' });

    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert([{ email: email, subscribed_at: new Date().toISOString() }])
        .select();

      if (error) {
        if (error.code === '23505') {
          setSubscriptionMessage({ type: 'warning', text: 'This email is already subscribed!' });
        } else {
          throw error;
        }
      } else {
        setSubscriptionMessage({ type: 'success', text: 'Successfully subscribed!' });
        setEmail('');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      setSubscriptionMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setIsSubscribing(false);
      setTimeout(() => setSubscriptionMessage({ type: '', text: '' }), 5000);
    }
  };

  // For desktop - show footer only on non-admin pages
  if (!isMobile) {
    return (
      <footer className={styles.footer}>
        {/* Newsletter Section */}
        <div className={styles.newsletterSection}>
          <div className={styles.container}>
            <div className={styles.newsletterContent}>
              <h3>Subscribe to Our Newsletter</h3>
              <p>Get updates about new collections, special offers, and traditional craft stories</p>
              
              {subscriptionMessage.text && (
                <div className={`${styles.subscriptionMessage} ${styles[subscriptionMessage.type]}`}>
                  {subscriptionMessage.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
                  {subscriptionMessage.text}
                </div>
              )}
              
              <form className={styles.newsletterForm} onSubmit={handleSubscribe}>
                <input 
                  type="email" 
                  placeholder="Enter your email address" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubscribing}
                />
                <button type="submit" disabled={isSubscribing}>
                  {isSubscribing ? 'Subscribing...' : 'Subscribe'}
                </button>
              </form>
              <p className={styles.newsletterNote}>No spam, unsubscribe anytime.</p>
            </div>
          </div>
        </div>

        <div className={styles.footerContent}>
          <div className={styles.container}>
            <div className={styles.footerGrid}>
              {/* Brand Section */}
              <div className={styles.footerSection}>
                <div className={styles.brand}>
                  <img src="/logo1.png" alt="Etikoppaka Toys" className={styles.logoImage} />
                  <h3 className={styles.brandName}>Etikoppaka Toys</h3>
                </div>
                <p className={styles.brandDesc}>
                  Preserving the rich heritage of traditional Indian wooden toys, 
                  crafted with love using natural dyes and sustainable practices since generations.
                </p>
                <div className={styles.certification}>
                  <span>✓ GI Tagged</span>
                  <span>✓ Eco-Friendly</span>
                  <span>✓ Handcrafted</span>
                </div>
              </div>

              {/* Quick Links */}
              <div className={styles.footerSection}>
                <h4 className={styles.sectionTitle}>Quick Links</h4>
                <ul className={styles.linkList}>
                  <li><Link to="/"><FiHome className={styles.linkIcon} /> Home</Link></li>
                  <li><Link to="/products"><FiShoppingBag className={styles.linkIcon} /> Products</Link></li>
                  <li><Link to="/deals"><FiTag className={styles.linkIcon} /> Deals</Link></li>
                  <li><Link to="/contact">Contact Us</Link></li> 
                </ul>
              </div>

              {/* Customer Service */}
              <div className={styles.footerSection}>
                <h4 className={styles.sectionTitle}>Customer Service</h4>
                <ul className={styles.linkList}>
                  <li><Link to="/orders"><FiPackage className={styles.linkIcon} /> My Orders</Link></li>
                  <li><Link to="/profile">My Account</Link></li>
                  <li><Link to="/shipping"><FiTruck className={styles.linkIcon} /> Shipping Policy</Link></li>
                  <li><Link to="/returns">Return Policy</Link></li>
                  <li><Link to="/faq">FAQ</Link></li>
                </ul>
              </div>

              {/* Contact Info */}
              <div className={styles.footerSection}>
                <h4 className={styles.sectionTitle}>Get in Touch</h4>
                <div className={styles.contactInfo}>
                  <p><FiMapPin className={styles.contactIcon} /> Etikoppaka, Visakhapatnam, Andhra Pradesh - 531082</p>
                  <p><FiPhone className={styles.contactIcon} /> +91 9154884214</p>
                  <p><FiMail className={styles.contactIcon} /> orders@etikoppakatoys.com</p>
                  <p><FiClock className={styles.contactIcon} /> Mon-Sat: 10 AM - 7 PM</p>
                </div>
                <div className={styles.socialLinks}>
                  <a href="https://www.instagram.com/etikoppaka_wooden_toys?igsh=eG1pb2R0aWZuMncw" className={styles.mobileSocialLink}><FiInstagram /></a>
                  <a href="https://www.youtube.com/@EtikoppakaToys" className={styles.mobileSocialLink}><FiYoutube /></a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <div className={styles.container}>
            <div className={styles.bottomContent}>
              <p>&copy; {currentYear} Etikoppaka Toys. All rights reserved.</p>
              <div className={styles.paymentMethods}>
                <span>COD Available</span>
                <span><FiShield /> Secure Payment</span>
                <span>Free Shipping*</span>
              </div>
            </div>
            <div className={styles.developerCredit}>
              <p>
                Developed by{' '}
                <a 
                  href="https://brandversetech.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.developerLink}
                >
                  Brandverse Technologies India Pvt. Ltd.
                  <FiExternalLink className={styles.externalIcon} />
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  // ============================================
  // MOBILE FOOTER - Only show on home page (non-admin)
  // ============================================
  // Only show mobile footer on home page (and not on admin pages - already checked above)
  if (location.pathname !== '/') {
    return null;
  }

  return (
    <footer className={styles.mobileFooter}>
      {/* Newsletter Section - Mobile */}
      <div className={styles.mobileNewsletter}>
        <div className={styles.mobileNewsletterIcon}>📧</div>
        <h3>Get Offers & Updates</h3>
        <p>Be the first to know about new collections and deals</p>
        <form className={styles.mobileNewsletterForm} onSubmit={handleSubscribe}>
          <input 
            type="email" 
            placeholder="Enter your email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubscribing}
          />
          <button type="submit" disabled={isSubscribing}>
            {isSubscribing ? '...' : 'Subscribe'}
          </button>
        </form>
        {subscriptionMessage.text && (
          <div className={`${styles.mobileSubMessage} ${styles[subscriptionMessage.type]}`}>
            {subscriptionMessage.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
            {subscriptionMessage.text}
          </div>
        )}
      </div>

      {/* Quick Links Grid - Mobile */}
      <div className={styles.mobileLinksGrid}>
        <Link to="/shipping"><FiTruck /> Shipping</Link>
        <Link to="/returns"><FiRefreshCw /> Returns</Link>
        <Link to="/faq"><FiHelpCircle /> FAQ</Link>
        <Link to="/contact"><FiMail /> Contact</Link>
      </div>

      {/* Contact Info - Mobile */}
      <div className={styles.mobileContact}>
        <div className={styles.mobileContactItem}>
          <FiMapPin />
          <span>Etikoppaka, Visakhapatnam, AP</span>
        </div>
        <div className={styles.mobileContactItem}>
          <FiPhone />
          <span>+91 9154884214</span>
        </div>
        <div className={styles.mobileContactItem}>
          <FiMail />
          <span>orders@etikoppakatoys.store</span>
        </div>
        <div className={styles.mobileContactItem}>
          <FiClock />
          <span>Mon-Sat: 10 AM - 7 PM</span>
        </div>
      </div>

      {/* Social Links - Mobile */}
      <div className={styles.mobileSocial}>
        <a href="https://www.instagram.com/etikoppaka_wooden_toys?igsh=eG1pb2R0aWZuMncw" className={styles.mobileSocialLink}><FiInstagram /></a>
        <a href="https://www.youtube.com/@EtikoppakaToys" className={styles.mobileSocialLink}><FiYoutube /></a>
      </div>

      {/* Brand & Copyright - Mobile */}
      <div className={styles.mobileBrand}>
        <div className={styles.mobileLogoContainer}>
          <img src="/logo1.png" alt="Etikoppaka Toys" className={styles.mobileLogoLarge} />
        </div>
        <div className={styles.mobileBrandInfoCenter}>
          <h4>Etikoppaka Toys</h4>
          <p>Traditional Handcrafted Wooden Toys</p>
          <div className={styles.mobileCertification}>
            <span>✓ GI Tagged</span>
            <span>✓ Eco-Friendly</span>
            <span>✓ Handcrafted</span>
          </div>
        </div>
      </div>

      <div className={styles.mobileCopyright}>
        <p>© {currentYear} Etikoppaka Wooden Toys</p>
        <p>
          Developed by{' '}
          <a 
            href="https://brandversetech.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.mobileDeveloperLink}
          >
            Brandverse Technologies India Pvt. Ltd.
            <FiExternalLink className={styles.mobileExternalIcon} />
          </a>
        </p>
      </div>

      <div className={styles.mobilePayment}>
        <span>COD Available</span>
        <span>Secure Payment</span>
        <span>Free Shipping*</span>
      </div>
    </footer>
  );
};

export default Footer;