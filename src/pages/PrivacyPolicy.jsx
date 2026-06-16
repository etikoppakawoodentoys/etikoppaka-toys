import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiShield, 
  FiLock, 
  FiEye, 
  FiTrash2,
  FiMail,
  FiPhone,
  FiMapPin,
  FiChevronRight,
  FiCheckCircle,
  FiAlertCircle,
  FiArrowLeft,
  FiMenu,
  FiX,
  FiDatabase,
  FiGlobe,
  FiClock
} from 'react-icons/fi';
import { FaCookie, FaUserSecret, FaShieldAlt } from 'react-icons/fa';
import styles from './PrivacyPolicy.module.css';

const PrivacyPolicy = () => {
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
      const sections = ['introduction', 'information', 'usage', 'cookies', 'sharing', 'security', 'rights', 'retention', 'children', 'changes', 'contact'];
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
    { id: 'introduction', icon: <FiShield />, title: 'Introduction' },
    { id: 'information', icon: <FiDatabase />, title: 'Information We Collect' },
    { id: 'usage', icon: <FiEye />, title: 'How We Use Your Information' },
    { id: 'cookies', icon: <FaCookie />, title: 'Cookies & Tracking' },
    { id: 'sharing', icon: <FiGlobe />, title: 'Information Sharing' },
    { id: 'security', icon: <FaShieldAlt />, title: 'Data Security' },
    { id: 'rights', icon: <FiLock />, title: 'Your Rights' },
    { id: 'retention', icon: <FiClock />, title: 'Data Retention' },
    { id: 'children', icon: <FaUserSecret />, title: 'Children\'s Privacy' },
    { id: 'changes', icon: <FiAlertCircle />, title: 'Policy Changes' },
    { id: 'contact', icon: <FiMail />, title: 'Contact Us' }
  ];

  // Mobile Version
  if (isMobile) {
    return (
      <div className={styles.mobilePrivacyPage}>
        {/* Header */}
        <div className={styles.mobileHeader}>
          <Link to="/" className={styles.mobileBackBtn}>
            <FiArrowLeft />
          </Link>
          <h1>Privacy Policy</h1>
          <button className={styles.mobileMenuBtn} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>

        {/* Last Updated Banner */}
        <div className={styles.mobileLastUpdated}>
          <FiClock />
          <span>Last Updated: {lastUpdated}</span>
        </div>

        {/* Mobile Sidebar */}
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
            <FiShield />
          </div>
          <h2>Your Privacy Matters</h2>
          <p>We are committed to protecting your personal information</p>
        </div>

        {/* Content Sections */}
        <div className={styles.mobileContent}>
          {/* Introduction */}
          <div id="introduction" className={styles.mobileSection}>
            <div className={styles.mobileSectionHeader}>
              <FiShield />
              <h3>1. Introduction</h3>
            </div>
            <div className={styles.mobileSectionContent}>
              <p>At Etikoppaka Toys ("we," "our," or "us"), your privacy is of utmost importance. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.</p>
              <div className={styles.mobileInfoBox}>
                <FiCheckCircle />
                <span>We only collect information necessary to provide and improve our services.</span>
              </div>
            </div>
          </div>

          {/* Information We Collect */}
          <div id="information" className={styles.mobileSection}>
            <div className={styles.mobileSectionHeader}>
              <FiDatabase />
              <h3>2. Information We Collect</h3>
            </div>
            <div className={styles.mobileSectionContent}>
              <p>We may collect the following types of information:</p>
              <ul>
                <li><strong>Personal Information:</strong> Name, email address, phone number, shipping address</li>
                <li><strong>Payment Information:</strong> Payment method details (processed securely via third-party providers)</li>
                <li><strong>Account Information:</strong> Username, password, order history</li>
                <li><strong>Technical Information:</strong> IP address, browser type, device information</li>
                <li><strong>Usage Data:</strong> Pages visited, time spent, referral source</li>
              </ul>
            </div>
          </div>

          {/* How We Use Your Information */}
          <div id="usage" className={styles.mobileSection}>
            <div className={styles.mobileSectionHeader}>
              <FiEye />
              <h3>3. How We Use Your Information</h3>
            </div>
            <div className={styles.mobileSectionContent}>
              <p>We use your information to:</p>
              <ul>
                <li>Process and fulfill your orders</li>
                <li>Communicate with you about your orders</li>
                <li>Send promotional offers (with your consent)</li>
                <li>Improve our website and services</li>
                <li>Prevent fraud and enhance security</li>
                <li>Comply with legal obligations</li>
              </ul>
            </div>
          </div>

          {/* Cookies & Tracking */}
          <div id="cookies" className={styles.mobileSection}>
            <div className={styles.mobileSectionHeader}>
              <FaCookie />
              <h3>4. Cookies & Tracking</h3>
            </div>
            <div className={styles.mobileSectionContent}>
              <p>We use cookies and similar tracking technologies to:</p>
              <ul>
                <li>Remember your preferences and login information</li>
                <li>Analyze website traffic and usage patterns</li>
                <li>Personalize your shopping experience</li>
                <li>Show relevant product recommendations</li>
              </ul>
              <div className={styles.mobileWarningBox}>
                <FiAlertCircle />
                <span>You can control cookie settings through your browser preferences.</span>
              </div>
            </div>
          </div>

          {/* Information Sharing */}
          <div id="sharing" className={styles.mobileSection}>
            <div className={styles.mobileSectionHeader}>
              <FiGlobe />
              <h3>5. Information Sharing</h3>
            </div>
            <div className={styles.mobileSectionContent}>
              <p>We do not sell your personal information. We may share your data with:</p>
              <ul>
                <li><strong>Service Providers:</strong> Payment processors, shipping partners, email services</li>
                <li><strong>Legal Authorities:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In case of merger or acquisition</li>
              </ul>
            </div>
          </div>

          {/* Data Security */}
          <div id="security" className={styles.mobileSection}>
            <div className={styles.mobileSectionHeader}>
              <FaShieldAlt />
              <h3>6. Data Security</h3>
            </div>
            <div className={styles.mobileSectionContent}>
              <p>We implement industry-standard security measures including:</p>
              <ul>
                <li>SSL encryption for data transmission</li>
                <li>Secure payment gateway integration</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication</li>
              </ul>
              <div className={styles.mobileInfoBox}>
                <FiCheckCircle />
                <span>While we strive to protect your data, no method of transmission is 100% secure.</span>
              </div>
            </div>
          </div>

          {/* Your Rights */}
          <div id="rights" className={styles.mobileSection}>
            <div className={styles.mobileSectionHeader}>
              <FiLock />
              <h3>7. Your Rights</h3>
            </div>
            <div className={styles.mobileSectionContent}>
              <p>You have the right to:</p>
              <ul>
                <li>Access your personal information</li>
                <li>Correct inaccurate or incomplete data</li>
                <li>Request deletion of your data</li>
                <li>Opt-out of marketing communications</li>
                <li>Data portability</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </div>
          </div>

          {/* Data Retention */}
          <div id="retention" className={styles.mobileSection}>
            <div className={styles.mobileSectionHeader}>
              <FiClock />
              <h3>8. Data Retention</h3>
            </div>
            <div className={styles.mobileSectionContent}>
              <p>We retain your personal information for as long as necessary to:</p>
              <ul>
                <li>Fulfill the purposes outlined in this policy</li>
                <li>Comply with legal and regulatory obligations</li>
                <li>Resolve disputes and enforce agreements</li>
              </ul>
              <p>Generally, we keep order information for 7 years for tax and legal purposes.</p>
            </div>
          </div>

          {/* Children's Privacy */}
          <div id="children" className={styles.mobileSection}>
            <div className={styles.mobileSectionHeader}>
              <FaUserSecret />
              <h3>9. Children's Privacy</h3>
            </div>
            <div className={styles.mobileSectionContent}>
              <p>Our website is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have collected such information, please contact us immediately.</p>
            </div>
          </div>

          {/* Policy Changes */}
          <div id="changes" className={styles.mobileSection}>
            <div className={styles.mobileSectionHeader}>
              <FiAlertCircle />
              <h3>10. Policy Changes</h3>
            </div>
            <div className={styles.mobileSectionContent}>
              <p>We may update this Privacy Policy from time to time. We will notify you of any material changes by:</p>
              <ul>
                <li>Posting the new policy on this page</li>
                <li>Sending an email notification (if applicable)</li>
                <li>Updating the "Last Updated" date</li>
              </ul>
            </div>
          </div>

          {/* Contact Us */}
          <div id="contact" className={styles.mobileSection}>
            <div className={styles.mobileSectionHeader}>
              <FiMail />
              <h3>11. Contact Us</h3>
            </div>
            <div className={styles.mobileSectionContent}>
              <p>If you have questions about this Privacy Policy, please contact us:</p>
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
    <div className={styles.privacyPage}>
      <div className={styles.container}>
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Link to="/">Home</Link>
          <FiChevronRight />
          <span>Privacy Policy</span>
        </div>

        {/* Hero Section */}
        <div className={styles.heroSection}>
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <FiShield />
              Privacy Protected
            </div>
            <h1>Privacy Policy</h1>
            <p>Your trust is important to us. We are committed to protecting your personal information and being transparent about how we use it.</p>
            <div className={styles.heroStats}>
              <div className={styles.heroStat}>
                <FiClock />
                <span>Last Updated: {lastUpdated}</span>
              </div>
              <div className={styles.heroStat}>
                <FiCheckCircle />
                <span>GDPR Compliant</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.privacyLayout}>
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
              <div className={styles.sidebarTrust}>
                <div className={styles.trustBadge}>
                  <FiShield />
                  <span>100% Secure</span>
                </div>
                <div className={styles.trustBadge}>
                  <FiLock />
                  <span>Encrypted Data</span>
                </div>
                <div className={styles.trustBadge}>
                  <FiCheckCircle />
                  <span>GDPR Ready</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className={styles.mainContent}>
            {/* Introduction */}
            <div id="introduction" className={styles.contentSection}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  <FiShield />
                </div>
                <div>
                  <h2>1. Introduction</h2>
                  <p>Welcome to our privacy commitment</p>
                </div>
              </div>
              <div className={styles.sectionContent}>
                <p>At Etikoppaka Toys ("we," "our," or "us"), your privacy is of utmost importance. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website, make purchases, or interact with our services.</p>
                <p>We are committed to protecting your personal information and being transparent about our data practices. By using our website, you consent to the data practices described in this policy.</p>
                <div className={styles.infoBox}>
                  <FiCheckCircle />
                  <div>
                    <strong>Our Commitment</strong>
                    <p>We only collect information necessary to provide and improve our services. We never sell your personal information to third parties.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Information We Collect */}
            <div id="information" className={styles.contentSection}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  <FiDatabase />
                </div>
                <div>
                  <h2>2. Information We Collect</h2>
                  <p>Types of data we gather</p>
                </div>
              </div>
              <div className={styles.sectionContent}>
                <p>We may collect the following types of information:</p>
                <div className={styles.infoGrid}>
                  <div className={styles.infoCard}>
                    <h4>Personal Information</h4>
                    <ul>
                      <li>Full name</li>
                      <li>Email address</li>
                      <li>Phone number</li>
                      <li>Shipping and billing addresses</li>
                    </ul>
                  </div>
                  <div className={styles.infoCard}>
                    <h4>Payment Information</h4>
                    <ul>
                      <li>Payment method details</li>
                      <li>Transaction history</li>
                      <li>Billing information</li>
                    </ul>
                    <p className={styles.note}>*Processed securely via PCI-compliant providers</p>
                  </div>
                  <div className={styles.infoCard}>
                    <h4>Account Information</h4>
                    <ul>
                      <li>Username and password</li>
                      <li>Order history</li>
                      <li>Wishlist items</li>
                      <li>Saved addresses</li>
                    </ul>
                  </div>
                  <div className={styles.infoCard}>
                    <h4>Technical Information</h4>
                    <ul>
                      <li>IP address</li>
                      <li>Browser type and version</li>
                      <li>Device information</li>
                      <li>Operating system</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* How We Use Your Information */}
            <div id="usage" className={styles.contentSection}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  <FiEye />
                </div>
                <div>
                  <h2>3. How We Use Your Information</h2>
                  <p>Purpose of data processing</p>
                </div>
              </div>
              <div className={styles.sectionContent}>
                <p>We use your information for the following purposes:</p>
                <ul>
                  <li><strong>Order Processing:</strong> To process and fulfill your purchases, send order confirmations, and provide customer support</li>
                  <li><strong>Communication:</strong> To respond to your inquiries, send important updates, and share promotional offers (with your consent)</li>
                  <li><strong>Service Improvement:</strong> To analyze website usage, improve user experience, and develop new features</li>
                  <li><strong>Security:</strong> To detect and prevent fraud, protect against unauthorized access, and ensure website security</li>
                  <li><strong>Legal Compliance:</strong> To comply with applicable laws, regulations, and legal processes</li>
                </ul>
              </div>
            </div>

            {/* Cookies & Tracking */}
            <div id="cookies" className={styles.contentSection}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  <FaCookie />
                </div>
                <div>
                  <h2>4. Cookies & Tracking</h2>
                  <p>How we use cookies</p>
                </div>
              </div>
              <div className={styles.sectionContent}>
                <p>We use cookies and similar tracking technologies to enhance your browsing experience. Cookies are small text files stored on your device that help us:</p>
                <ul>
                  <li>Remember your preferences and login information</li>
                  <li>Understand how you interact with our website</li>
                  <li>Personalize content and product recommendations</li>
                  <li>Analyze traffic patterns and improve site performance</li>
                </ul>
                <div className={styles.cookieTypes}>
                  <h4>Types of Cookies We Use:</h4>
                  <div className={styles.cookieGrid}>
                    <div className={styles.cookieCard}>
                      <strong>Essential Cookies</strong>
                      <p>Required for basic website functionality (shopping cart, checkout)</p>
                    </div>
                    <div className={styles.cookieCard}>
                      <strong>Analytics Cookies</strong>
                      <p>Help us understand how visitors use our website</p>
                    </div>
                    <div className={styles.cookieCard}>
                      <strong>Functional Cookies</strong>
                      <p>Remember your preferences and settings</p>
                    </div>
                    <div className={styles.cookieCard}>
                      <strong>Marketing Cookies</strong>
                      <p>Used to show relevant product recommendations</p>
                    </div>
                  </div>
                </div>
                <div className={styles.warningBox}>
                  <FiAlertCircle />
                  <div>
                    <strong>Cookie Control</strong>
                    <p>You can manage cookie preferences through your browser settings. However, disabling certain cookies may affect website functionality.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Information Sharing */}
            <div id="sharing" className={styles.contentSection}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  <FiGlobe />
                </div>
                <div>
                  <h2>5. Information Sharing</h2>
                  <p>When and why we share data</p>
                </div>
              </div>
              <div className={styles.sectionContent}>
                <p>We do not sell, trade, or rent your personal information to third parties. We may share your data in the following circumstances:</p>
                <ul>
                  <li><strong>Service Providers:</strong> We share necessary information with trusted partners who assist in order fulfillment (payment processors, shipping carriers, email services)</li>
                  <li><strong>Legal Requirements:</strong> We may disclose information if required by law, court order, or to protect our rights and safety</li>
                  <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred</li>
                  <li><strong>With Your Consent:</strong> We may share information with your explicit permission</li>
                </ul>
                <div className={styles.infoBox}>
                  <FiCheckCircle />
                  <div>
                    <strong>Third-Party Links</strong>
                    <p>Our website may contain links to third-party sites. We are not responsible for their privacy practices.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Security */}
            <div id="security" className={styles.contentSection}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  <FaShieldAlt />
                </div>
                <div>
                  <h2>6. Data Security</h2>
                  <p>How we protect your information</p>
                </div>
              </div>
              <div className={styles.sectionContent}>
                <p>We implement comprehensive security measures to protect your personal information:</p>
                <div className={styles.securityGrid}>
                  <div className={styles.securityItem}>
                    <FiLock />
                    <div>
                      <strong>SSL Encryption</strong>
                      <p>256-bit encryption for all data transmission</p>
                    </div>
                  </div>
                  <div className={styles.securityItem}>
                    <FiShield />
                    <div>
                      <strong>PCI Compliance</strong>
                      <p>Secure payment gateway integration</p>
                    </div>
                  </div>
                  <div className={styles.securityItem}>
                    <FiDatabase />
                    <div>
                      <strong>Secure Storage</strong>
                      <p>Encrypted databases with access controls</p>
                    </div>
                  </div>
                  <div className={styles.securityItem}>
                    <FiEye />
                    <div>
                      <strong>Regular Audits</strong>
                      <p>Continuous security monitoring and updates</p>
                    </div>
                  </div>
                </div>
                <div className={styles.warningBox}>
                  <FiAlertCircle />
                  <div>
                    <strong>Important Note</strong>
                    <p>While we strive to protect your data, no method of transmission over the Internet is 100% secure.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Your Rights */}
            <div id="rights" className={styles.contentSection}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  <FiLock />
                </div>
                <div>
                  <h2>7. Your Rights</h2>
                  <p>Control over your personal data</p>
                </div>
              </div>
              <div className={styles.sectionContent}>
                <p>Depending on your location, you may have the following rights regarding your personal information:</p>
                <ul>
                  <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete information</li>
                  <li><strong>Right to Erasure:</strong> Request deletion of your data (subject to legal obligations)</li>
                  <li><strong>Right to Restrict Processing:</strong> Limit how we use your data</li>
                  <li><strong>Right to Data Portability:</strong> Receive your data in a structured format</li>
                  <li><strong>Right to Object:</strong> Opt-out of marketing communications</li>
                  <li><strong>Right to Withdraw Consent:</strong> Cancel previous consent at any time</li>
                </ul>
                <div className={styles.infoBox}>
                  <FiCheckCircle />
                  <div>
                    <strong>How to Exercise Your Rights</strong>
                    <p>Contact us at privacy@etikoppakatoys.com. We will respond within 30 days.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Retention */}
            <div id="retention" className={styles.contentSection}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  <FiClock />
                </div>
                <div>
                  <h2>8. Data Retention</h2>
                  <p>How long we keep your data</p>
                </div>
              </div>
              <div className={styles.sectionContent}>
                <p>We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.</p>
                <p>Specific retention periods:</p>
                <ul>
                  <li><strong>Order Information:</strong> 7 years (for tax and legal compliance)</li>
                  <li><strong>Account Information:</strong> Until you delete your account</li>
                  <li><strong>Marketing Data:</strong> Until you unsubscribe</li>
                  <li><strong>Technical Data:</strong> Up to 2 years for analytics</li>
                </ul>
              </div>
            </div>

            {/* Children's Privacy */}
            <div id="children" className={styles.contentSection}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  <FaUserSecret />
                </div>
                <div>
                  <h2>9. Children's Privacy</h2>
                  <p>Protecting young users</p>
                </div>
              </div>
              <div className={styles.sectionContent}>
                <p>Our website is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately. We will take steps to delete such information from our records.</p>
              </div>
            </div>

            {/* Policy Changes */}
            <div id="changes" className={styles.contentSection}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  <FiAlertCircle />
                </div>
                <div>
                  <h2>10. Policy Changes</h2>
                  <p>Updates to this policy</p>
                </div>
              </div>
              <div className={styles.sectionContent}>
                <p>We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of any material changes by:</p>
                <ul>
                  <li>Posting the updated policy on this page with a new "Last Updated" date</li>
                  <li>Sending an email notification to registered users</li>
                  <li>Displaying a notice on our website</li>
                </ul>
                <p>We encourage you to review this Privacy Policy periodically to stay informed about how we protect your information.</p>
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
                  <p>Get in touch with questions</p>
                </div>
              </div>
              <div className={styles.sectionContent}>
                <p>If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:</p>
                <div className={styles.contactGrid}>
                  <div className={styles.contactCard}>
                    <FiMail />
                    <h4>Email</h4>
                    <p>orders@etikoppakatoys.store</p>
                    <a href="mailto:orders@etikoppakatoys.store">Send Email →</a>
                  </div>
                  <div className={styles.contactCard}>
                    <FiPhone />
                    <h4>Phone</h4>
                    <p>+91 9154884214</p>
                    <a href="tel:+919154884214">Call Us →</a>
                  </div>
                  <div className={styles.contactCard}>
                    <FiMapPin />
                    <h4>Address</h4>
                    <p>Etikoppaka, Visakhapatnam<br />Andhra Pradesh - 531082</p>
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

export default PrivacyPolicy;