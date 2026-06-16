import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiShield, 
  FiLock, 
  FiCreditCard, 
  FiTruck, 
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiChevronRight,
  FiFileText,
  FiUserCheck,
  FiShoppingBag,
  FiDollarSign,
  FiArrowLeft,
  FiMenu,
  FiX,
  FiBookOpen,
  FiMail,
  FiPhone,
  FiMapPin
} from 'react-icons/fi';
import { FaGavel, FaHandshake, FaRegClock, FaLeaf, FaAward } from 'react-icons/fa';
import styles from './TermsOfService.module.css';

const TermsOfService = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [activeSection, setActiveSection] = useState('introduction');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lastUpdated] = useState('May 21, 2026');

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['introduction', 'eligibility', 'account', 'orders', 'shipping', 'returns', 'intellectual', 'limitation', 'termination', 'governing', 'contact'];
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    setMobileMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const sections = [
    { id: 'introduction', icon: <FiBookOpen />, title: 'Introduction' },
    { id: 'eligibility', icon: <FiUserCheck />, title: 'Eligibility' },
    { id: 'account', icon: <FiShield />, title: 'Account Registration' },
    { id: 'orders', icon: <FiShoppingBag />, title: 'Orders & Payments' },
    { id: 'shipping', icon: <FiTruck />, title: 'Shipping & Delivery' },
    { id: 'returns', icon: <FiRefreshCw />, title: 'Returns & Refunds' },
    { id: 'intellectual', icon: <FiLock />, title: 'Intellectual Property' },
    { id: 'limitation', icon: <FiAlertCircle />, title: 'Limitation of Liability' },
    { id: 'termination', icon: <FiFileText />, title: 'Termination' },
    { id: 'governing', icon: <FaGavel />, title: 'Governing Law' },
    { id: 'contact', icon: <FiMail />, title: 'Contact Us' }
  ];

  // Mobile Version
  if (isMobile) {
    return (
      <div className={styles.mobileTermsPage}>
        {/* Header */}
        <div className={styles.mobileHeader}>
          <Link to="/" className={styles.mobileBackBtn}>
            <FiArrowLeft />
          </Link>
          <h1>Terms of Service</h1>
          <button className={styles.mobileMenuBtn} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>

        {/* Last Updated Banner */}
        <div className={styles.mobileLastUpdated}>
          <FiRefreshCw />
          <span>Last Updated: {lastUpdated}</span>
        </div>

        {/* Mobile Sidebar Menu */}
        {mobileMenuOpen && (
          <div className={styles.mobileSidebar}>
            <div className={styles.mobileSidebarHeader}>
              <h3>Quick Navigation</h3>
            </div>
            <div className={styles.mobileSidebarNav}>
              {sections.map((section) => (
                <button
                  key={section.id}
                  className={`${styles.mobileNavItem} ${activeSection === section.id ? styles.active : ''}`}
                  onClick={() => scrollToSection(section.id)}
                >
                  {section.icon}
                  <span>{section.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Hero Section */}
        <div className={styles.mobileHero}>
          <div className={styles.mobileHeroIcon}>
            <FaGavel />
          </div>
          <h2>Our Terms of Service</h2>
          <p>Please read these terms carefully before using our website</p>
        </div>

        {/* Content Sections */}
        <div className={styles.mobileContent}>
          {/* Introduction */}
          <div id="introduction" className={styles.mobileSection}>
            <div className={styles.mobileSectionHeader}>
              <FiBookOpen />
              <h3>1. Introduction</h3>
            </div>
            <div className={styles.mobileSectionContent}>
              <p>Welcome to Etikoppaka Toys ("we," "our," or "us"). By accessing or using our website, you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these Terms, you may not access the website.</p>
              <p>Etikoppaka Toys is a traditional handcrafted wooden toy brand based in Etikoppaka, Andhra Pradesh, India. We specialize in eco-friendly, naturally colored wooden toys that celebrate India's rich cultural heritage.</p>
              <div className={styles.mobileInfoBox}>
                <FiCheckCircle />
                <span>By using our services, you confirm that you are at least 18 years old or have parental consent.</span>
              </div>
            </div>
          </div>

          {/* Eligibility */}
          <div id="eligibility" className={styles.mobileSection}>
            <div className={styles.mobileSectionHeader}>
              <FiUserCheck />
              <h3>2. Eligibility</h3>
            </div>
            <div className={styles.mobileSectionContent}>
              <p>To use our services, you must:</p>
              <ul>
                <li>Be at least 18 years of age or have valid parental/guardian consent</li>
                <li>Provide accurate and complete information during registration</li>
                <li>Not be prohibited from receiving services under applicable laws</li>
                <li>Have the capacity to enter into a legally binding contract</li>
              </ul>
            </div>
          </div>

          {/* Account Registration */}
          <div id="account" className={styles.mobileSection}>
            <div className={styles.mobileSectionHeader}>
              <FiShield />
              <h3>3. Account Registration</h3>
            </div>
            <div className={styles.mobileSectionContent}>
              <p>When creating an account with us, you agree to:</p>
              <ul>
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain the security of your password and account</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>
              <div className={styles.mobileWarningBox}>
                <FiAlertCircle />
                <span>We reserve the right to suspend or terminate accounts that violate these Terms.</span>
              </div>
            </div>
          </div>

          {/* Orders & Payments */}
          <div id="orders" className={styles.mobileSection}>
            <div className={styles.mobileSectionHeader}>
              <FiShoppingBag />
              <h3>4. Orders & Payments</h3>
            </div>
            <div className={styles.mobileSectionContent}>
              <p>By placing an order, you agree to:</p>
              <ul>
                <li>Pay the full amount including taxes and shipping fees</li>
                <li>Provide valid payment information</li>
                <li>Accept that orders are subject to acceptance and availability</li>
                <li>Receive order confirmation via email</li>
              </ul>
              <div className={styles.mobilePaymentMethods}>
                <h4>Accepted Payment Methods:</h4>
                <div className={styles.mobilePaymentIcons}>
                  <span>💳 Credit/Debit Cards</span>
                  <span>🏦 UPI</span>
                  <span>📱 NetBanking</span>
                  <span>💵 Cash on Delivery</span>
                  <span>📱 Wallet</span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping & Delivery */}
          <div id="shipping" className={styles.mobileSection}>
            <div className={styles.mobileSectionHeader}>
              <FiTruck />
              <h3>5. Shipping & Delivery</h3>
            </div>
            <div className={styles.mobileSectionContent}>
              <p>Our shipping policy includes:</p>
              <ul>
                <li>Processing time: 2-3 business days</li>
                <li>Delivery time: 3-7 business days depending on location</li>
                <li>Free shipping on orders above ₹499</li>
                <li>International shipping available on request</li>
              </ul>
              <div className={styles.mobileInfoBox}>
                <FiTruck />
                <span>You will receive a tracking number once your order ships.</span>
              </div>
            </div>
          </div>

          {/* Returns & Refunds */}
          <div id="returns" className={styles.mobileSection}>
            <div className={styles.mobileSectionHeader}>
              <FiRefreshCw />
              <h3>6. Returns & Refunds</h3>
            </div>
            <div className={styles.mobileSectionContent}>
              <p>We offer a 7-day return policy for eligible items:</p>
              <ul>
                <li>Items must be unused and in original packaging</li>
                <li>Return shipping costs are borne by the customer</li>
                <li>Refunds are processed within 7-10 business days</li>
                <li>Damaged or defective items qualify for free replacement</li>
              </ul>
              <div className={styles.mobileWarningBox}>
                <FiRefreshCw />
                <span>Customized or personalized items cannot be returned.</span>
              </div>
            </div>
          </div>

          {/* Intellectual Property */}
          <div id="intellectual" className={styles.mobileSection}>
            <div className={styles.mobileSectionHeader}>
              <FiLock />
              <h3>7. Intellectual Property</h3>
            </div>
            <div className={styles.mobileSectionContent}>
              <p>All content on this website, including but not limited to:</p>
              <ul>
                <li>Product designs and images</li>
                <li>Logos, trademarks, and brand names</li>
                <li>Text, graphics, and software</li>
                <li>Videos and audio content</li>
              </ul>
              <p>is the exclusive property of Etikoppaka Toys and is protected by Indian and international copyright laws.</p>
            </div>
          </div>

          {/* Limitation of Liability */}
          <div id="limitation" className={styles.mobileSection}>
            <div className={styles.mobileSectionHeader}>
              <FiAlertCircle />
              <h3>8. Limitation of Liability</h3>
            </div>
            <div className={styles.mobileSectionContent}>
              <p>To the maximum extent permitted by law, Etikoppaka Toys shall not be liable for:</p>
              <ul>
                <li>Any indirect, incidental, or consequential damages</li>
                <li>Loss of profits, data, or business opportunities</li>
                <li>Delays or failures due to circumstances beyond our control</li>
              </ul>
              <p>Our total liability shall not exceed the amount paid for the product in question.</p>
            </div>
          </div>

          {/* Termination */}
          <div id="termination" className={styles.mobileSection}>
            <div className={styles.mobileSectionHeader}>
              <FiFileText />
              <h3>9. Termination</h3>
            </div>
            <div className={styles.mobileSectionContent}>
              <p>We may terminate or suspend your account immediately, without prior notice, for any violation of these Terms. Upon termination:</p>
              <ul>
                <li>Your right to use the service ceases immediately</li>
                <li>Any pending orders will be cancelled and refunded</li>
                <li>You must destroy any downloaded materials</li>
              </ul>
            </div>
          </div>

          {/* Governing Law */}
          <div id="governing" className={styles.mobileSection}>
            <div className={styles.mobileSectionHeader}>
              <FaGavel />
              <h3>10. Governing Law</h3>
            </div>
            <div className={styles.mobileSectionContent}>
              <p>These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts in Visakhapatnam, Andhra Pradesh.</p>
            </div>
          </div>

          {/* Contact Us */}
          <div id="contact" className={styles.mobileSection}>
            <div className={styles.mobileSectionHeader}>
              <FiMail />
              <h3>11. Contact Us</h3>
            </div>
            <div className={styles.mobileSectionContent}>
              <p>If you have any questions about these Terms, please contact us:</p>
              <div className={styles.mobileContactInfo}>
                <div className={styles.mobileContactItem}>
                  <FiMail />
                  <span>orders@etikoppakatoys.store</span>
                </div>
                <div className={styles.mobileContactItem}>
                  <FiPhone />
                  <span>+91 9154884214</span>
                </div>
                <div className={styles.mobileContactItem}>
                  <FiMapPin />
                  <span>Etikoppaka, Visakhapatnam, AP - 531082</span>
                </div>
              </div>
            </div>
          </div>

          
          
        </div>
      </div>
    );
  }

  // Desktop Version
  return (
    <div className={styles.termsPage}>
      <div className={styles.container}>
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Link to="/">Home</Link>
          <FiChevronRight />
          <span>Terms of Service</span>
        </div>

        {/* Hero Section */}
        <div className={styles.heroSection}>
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <FaGavel />
              Legal Information
            </div>
            <h1>Terms of Service</h1>
            <p>Please read these terms carefully before using our website. By accessing our site, you agree to be bound by these terms.</p>
            <div className={styles.heroStats}>
              <div className={styles.heroStat}>
                <FiRefreshCw />
                <span>Last Updated: {lastUpdated}</span>
              </div>
              <div className={styles.heroStat}>
                <FiFileText />
                <span>Version 2.0</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.termsLayout}>
          {/* Sidebar Navigation */}
          <div className={styles.sidebar}>
            <div className={styles.sidebarSticky}>
              <h3>Quick Navigation</h3>
              <nav className={styles.sidebarNav}>
                {sections.map((section) => (
                  <button
                    key={section.id}
                    className={`${styles.navItem} ${activeSection === section.id ? styles.active : ''}`}
                    onClick={() => scrollToSection(section.id)}
                  >
                    {section.icon}
                    <span>{section.title}</span>
                  </button>
                ))}
              </nav>
              <div className={styles.sidebarHelp}>
                <div className={styles.sidebarHelpIcon}>💬</div>
                <h4>Need Help?</h4>
                <p>Our support team is available 24/7</p>
                <Link to="/contact" className={styles.helpBtn}>Contact Support</Link>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className={styles.mainContent}>
            {/* Introduction */}
            <div id="introduction" className={styles.contentSection}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  <FiBookOpen />
                </div>
                <div>
                  <h2>1. Introduction</h2>
                  <p>Welcome to Etikoppaka Toys</p>
                </div>
              </div>
              <div className={styles.sectionContent}>
                <p>Welcome to Etikoppaka Toys ("we," "our," or "us"). By accessing or using our website, you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these Terms, you may not access the website.</p>
                <p>Etikoppaka Toys is a traditional handcrafted wooden toy brand based in Etikoppaka, Andhra Pradesh, India. We specialize in eco-friendly, naturally colored wooden toys that celebrate India's rich cultural heritage. Our toys are crafted using traditional lac-turnery techniques passed down through generations.</p>
                <div className={styles.infoBox}>
                  <FiCheckCircle />
                  <div>
                    <strong>Acceptance of Terms</strong>
                    <p>By using our services, you confirm that you are at least 18 years old or have parental/guardian consent to use our services.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Eligibility */}
            <div id="eligibility" className={styles.contentSection}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  <FiUserCheck />
                </div>
                <div>
                  <h2>2. Eligibility</h2>
                  <p>Who can use our services</p>
                </div>
              </div>
              <div className={styles.sectionContent}>
                <p>To use our services, you must:</p>
                <ul>
                  <li>Be at least 18 years of age or have valid parental/guardian consent</li>
                  <li>Provide accurate, current, and complete information during registration</li>
                  <li>Not be prohibited from receiving services under applicable laws</li>
                  <li>Have the legal capacity to enter into a binding contract</li>
                  <li>Use the services only for lawful purposes</li>
                </ul>
              </div>
            </div>

            {/* Account Registration */}
            <div id="account" className={styles.contentSection}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  <FiShield />
                </div>
                <div>
                  <h2>3. Account Registration</h2>
                  <p>Creating and managing your account</p>
                </div>
              </div>
              <div className={styles.sectionContent}>
                <p>When creating an account with us, you agree to:</p>
                <ul>
                  <li>Provide accurate, current, and complete information</li>
                  <li>Maintain the security and confidentiality of your password</li>
                  <li>Notify us immediately of any unauthorized access or use</li>
                  <li>Accept responsibility for all activities that occur under your account</li>
                  <li>Not share your account credentials with any third party</li>
                </ul>
                <div className={styles.warningBox}>
                  <FiAlertCircle />
                  <div>
                    <strong>Account Security</strong>
                    <p>We reserve the right to suspend or terminate accounts that violate these Terms or engage in fraudulent activities.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Orders & Payments */}
            <div id="orders" className={styles.contentSection}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  <FiShoppingBag />
                </div>
                <div>
                  <h2>4. Orders & Payments</h2>
                  <p>How to place orders and make payments</p>
                </div>
              </div>
              <div className={styles.sectionContent}>
                <p>By placing an order through our website, you agree to:</p>
                <ul>
                  <li>Pay the full amount including applicable taxes and shipping fees</li>
                  <li>Provide valid and accurate payment information</li>
                  <li>Accept that all orders are subject to acceptance and availability</li>
                  <li>Receive order confirmation via email with tracking details</li>
                  <li>Authorize us to charge the provided payment method</li>
                </ul>
                <div className={styles.paymentMethods}>
                  <h4>Accepted Payment Methods:</h4>
                  <div className={styles.paymentIcons}>
                    <div className={styles.paymentIcon}>💳 Credit/Debit Cards</div>
                    <div className={styles.paymentIcon}>🏦 UPI (Google Pay, PhonePe, Paytm)</div>
                    <div className={styles.paymentIcon}>📱 NetBanking (All Major Banks)</div>
                    <div className={styles.paymentIcon}>💵 Cash on Delivery</div>
                    <div className={styles.paymentIcon}>📱 Mobile Wallets</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping & Delivery */}
            <div id="shipping" className={styles.contentSection}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  <FiTruck />
                </div>
                <div>
                  <h2>5. Shipping & Delivery</h2>
                  <p>Our shipping policy</p>
                </div>
              </div>
              <div className={styles.sectionContent}>
                <p>Our shipping policy includes:</p>
                <ul>
                  <li><strong>Processing Time:</strong> 2-3 business days for order processing</li>
                  <li><strong>Delivery Time:</strong> 3-7 business days depending on location</li>
                  <li><strong>Free Shipping:</strong> On all orders above ₹499</li>
                  <li><strong>International Shipping:</strong> Available on request with additional charges</li>
                  <li><strong>Tracking:</strong> You will receive a tracking number once your order ships</li>
                </ul>
                <div className={styles.infoBox}>
                  <FiTruck />
                  <div>
                    <strong>Delivery Partners</strong>
                    <p>We partner with trusted courier services including Delhivery, DTDC, and India Post for reliable delivery.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Returns & Refunds */}
            <div id="returns" className={styles.contentSection}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  <FiRefreshCw />
                </div>
                <div>
                  <h2>6. Returns & Refunds</h2>
                  <p>Our return and refund policy</p>
                </div>
              </div>
              <div className={styles.sectionContent}>
                <p>We offer a <strong>7-day return policy</strong> for eligible items:</p>
                <ul>
                  <li>Items must be unused, undamaged, and in original packaging</li>
                  <li>Return shipping costs are borne by the customer</li>
                  <li>Refunds are processed within 7-10 business days of receiving returned items</li>
                  <li>Damaged or defective items qualify for free replacement or full refund</li>
                  <li>Original shipping charges are non-refundable</li>
                </ul>
                <div className={styles.warningBox}>
                  <FiRefreshCw />
                  <div>
                    <strong>Non-Returnable Items</strong>
                    <p>Customized, personalized, or made-to-order items cannot be returned unless defective.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Intellectual Property */}
            <div id="intellectual" className={styles.contentSection}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  <FiLock />
                </div>
                <div>
                  <h2>7. Intellectual Property</h2>
                  <p>Ownership of content and designs</p>
                </div>
              </div>
              <div className={styles.sectionContent}>
                <p>All content on this website, including but not limited to:</p>
                <ul>
                  <li>Product designs, images, and descriptions</li>
                  <li>Logos, trademarks, service marks, and brand names</li>
                  <li>Text, graphics, user interfaces, and software</li>
                  <li>Videos, audio clips, and animations</li>
                  <li>Layout, design, and compilation of content</li>
                </ul>
                <p>is the exclusive property of Etikoppaka Toys and is protected by Indian and international copyright, trademark, and other intellectual property laws.</p>
                <div className={styles.infoBox}>
                  <FiLock />
                  <div>
                    <strong>Use of Content</strong>
                    <p>You may not reproduce, distribute, modify, create derivative works of, or publicly display any content without our prior written consent.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Limitation of Liability */}
            <div id="limitation" className={styles.contentSection}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  <FiAlertCircle />
                </div>
                <div>
                  <h2>8. Limitation of Liability</h2>
                  <p>Our liability to you</p>
                </div>
              </div>
              <div className={styles.sectionContent}>
                <p>To the maximum extent permitted by applicable law, Etikoppaka Toys shall not be liable for:</p>
                <ul>
                  <li>Any indirect, incidental, special, consequential, or punitive damages</li>
                  <li>Loss of profits, revenue, data, or business opportunities</li>
                  <li>Delays or failures due to circumstances beyond our reasonable control</li>
                  <li>Any unauthorized access to or use of our secure servers</li>
                  <li>Any bugs, viruses, or other harmful code</li>
                </ul>
                <div className={styles.warningBox}>
                  <FiAlertCircle />
                  <div>
                    <strong>Maximum Liability</strong>
                    <p>Our total liability shall not exceed the amount paid for the product in question.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Termination */}
            <div id="termination" className={styles.contentSection}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  <FiFileText />
                </div>
                <div>
                  <h2>9. Termination</h2>
                  <p>Account suspension and termination</p>
                </div>
              </div>
              <div className={styles.sectionContent}>
                <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason including, without limitation, breach of these Terms.</p>
                <p>Upon termination:</p>
                <ul>
                  <li>Your right to use the service ceases immediately</li>
                  <li>Any pending orders will be cancelled and refunded</li>
                  <li>You must destroy any downloaded materials in your possession</li>
                  <li>Certain provisions of these Terms shall survive termination</li>
                </ul>
              </div>
            </div>

            {/* Governing Law */}
            <div id="governing" className={styles.contentSection}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  <FaGavel />
                </div>
                <div>
                  <h2>10. Governing Law</h2>
                  <p>Applicable laws and jurisdiction</p>
                </div>
              </div>
              <div className={styles.sectionContent}>
                <p>These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.</p>
                <p>Any dispute, controversy, or claim arising out of or relating to these Terms shall be subject to the exclusive jurisdiction of the courts located in <strong>Visakhapatnam, Andhra Pradesh</strong>.</p>
              </div>
            </div>

            {/* Contact Us */}
            <div id="contact" className={styles.contentSection}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  <FiMail />
                </div>
                <div>
                  <h2>11. Contact Us</h2>
                  <p>How to reach us</p>
                </div>
              </div>
              <div className={styles.sectionContent}>
                <p>If you have any questions, concerns, or suggestions about these Terms, please contact us:</p>
                <div className={styles.contactGrid}>
                  <div className={styles.contactCard}>
                    <FiMail />
                    <h4>Email Us</h4>
                    <p>orders@etikoppakatoys.store</p>
                    <a href="mailto:orders@etikoppakatoys.store">Send Email →</a>
                  </div>
                  <div className={styles.contactCard}>
                    <FiPhone />
                    <h4>Call Us</h4>
                    <p>+91 9154884214</p>
                    <a href="tel:+919154884214">Call Now →</a>
                  </div>
                  <div className={styles.contactCard}>
                    <FiMapPin />
                    <h4>Visit Us</h4>
                    <p>Etikoppaka, Visakhapatnam, AP - 531082</p>
                    <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer">Get Directions →</a>
                  </div>
                </div>
              </div>
            </div>

            
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;