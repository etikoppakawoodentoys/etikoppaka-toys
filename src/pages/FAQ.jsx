import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronDown, FiChevronUp, FiPhone, FiMail, FiMessageCircle, FiArrowLeft, FiSearch, FiHelpCircle, FiPackage, FiTruck, FiRefreshCw, FiCreditCard, FiShield } from 'react-icons/fi';
import styles from './FAQ.module.css';

const FAQ = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const faqCategories = [
    {
      id: 'orders',
      category: "Orders & Payments",
      icon: "💰",
      questions: [
        {
          q: "How do I place an order?",
          a: "Placing an order is simple! Browse our collection, add items to your cart, proceed to checkout, and select your preferred payment method. You can pay via Cash on Delivery (with 50% advance) or online through Razorpay (Card/UPI/NetBanking). Our team will call you within 24 hours to confirm your order."
        },
        {
          q: "What payment methods do you accept?",
          a: "We accept multiple payment methods: 1) Cash on Delivery (50% advance required, balance on delivery), 2) Credit/Debit Cards, 3) UPI (Google Pay, PhonePe, Paytm), 4) NetBanking, 5) Bank Transfers. All online payments are processed securely through Razorpay."
        },
        {
          q: "Is Cash on Delivery available?",
          a: "Yes, Cash on Delivery is available across India. However, a 50% advance payment is required to confirm your order. Our team will call you within 24 hours to share payment details for the advance amount. The remaining 50% can be paid in cash or via card/UPI at the time of delivery."
        },
        {
          q: "How will I know if my order is confirmed?",
          a: "You will receive: 1) An email confirmation immediately after placing your order, 2) A confirmation call from our team within 24 hours, 3) A WhatsApp/SMS confirmation once your 50% advance payment is received. Your order is confirmed only after the advance payment is credited."
        },
        {
          q: "Can I cancel or modify my order?",
          a: "Yes, you can cancel your order before it is shipped. Please contact our support team immediately. If the advance payment has been made, we will process a full refund within 5-7 business days. Modifications to order items or address can be made within 2 hours of order placement."
        }
      ]
    },
    {
      id: 'shipping',
      category: "Shipping & Delivery",
      icon: "📦",
      questions: [
        {
          q: "How long does delivery take?",
          a: "Delivery timelines vary by location: Southern India (AP, TN, KA, KL, TS): 2-4 days, Western India (MH, GJ): 4-6 days, Northern India (DL, UP, HR, PB): 5-7 days, Eastern India (WB, OD, JH): 5-7 days, Northeast India: 7-10 days. Processing takes 1-2 days after payment confirmation."
        },
        {
          q: "Do you offer free shipping?",
          a: "Yes! We offer free shipping on all orders above ₹499. For orders below ₹499, a nominal shipping charge of ₹40-₹60 applies, depending on your location. The shipping cost is calculated and displayed at checkout before you place your order."
        },
        {
          q: "Do you ship internationally?",
          a: "Currently, we ship only within India. We are working on expanding our international shipping capabilities. For international inquiries, please email us at export@etikoppakatoys.com and we'll try to accommodate your request."
        },
        {
          q: "How can I track my order?",
          a: "Once your order is shipped, you will receive: 1) An email with tracking link and courier details, 2) An SMS with AWB number on your registered mobile number, 3) Real-time tracking status in your 'My Orders' section. You can also track directly on the courier partner's website using the AWB number."
        },
        {
          q: "What if I'm not home when delivery arrives?",
          a: "Our courier partners will make up to 3 delivery attempts. You can also request to reschedule delivery via the tracking link or contact our support team. For security reasons, we recommend providing a reliable address where someone is available to receive the package."
        }
      ]
    },
    {
      id: 'returns',
      category: "Returns & Refunds",
      icon: "🔄",
      questions: [
        {
          q: "What is your return policy?",
          a: "We offer a 7-day hassle-free return policy from the date of delivery. You can return items if: 1) Product arrived damaged or defective, 2) Wrong product was delivered, 3) Missing parts or accessories, 4) Quality not as described. Products must be unused, with original packaging and tags intact."
        },
        {
          q: "How do I initiate a return?",
          a: "To initiate a return: 1) Contact our support team within 7 days of delivery, 2) Share your order number and photos/videos of the issue, 3) Our team will verify within 24-48 hours, 4) Return pickup will be arranged (free for defective items), 5) Refund processed after inspection. You can also self-ship returns with shipping reimbursement up to ₹100."
        },
        {
          q: "How long does a refund take?",
          a: "Refunds are processed within 5-7 business days after the returned product is verified at our facility. The refund timeline depends on your payment method: Original Payment Method (5-7 days), Bank Transfer (3-5 days), Store Credit (Instant). You will receive email updates throughout the process."
        },
        {
          q: "What items cannot be returned?",
          a: "The following items cannot be returned: 1) Used or washed products, 2) Returns requested after 7 days of delivery, 3) Products without original packaging or tags, 4) Customized or personalized items, 5) Items damaged due to customer misuse. Please check your order carefully upon delivery."
        },
        {
          q: "Do you offer replacement instead of refund?",
          a: "Yes! For eligible items, we offer replacement with a new piece if available in stock. Replacement is processed after we receive and inspect the returned item. Free replacement pickup is arranged. If the item is out of stock, we will process a full refund instead."
        }
      ]
    },
    {
      id: 'products',
      category: "Product Information",
      icon: "🎨",
      questions: [
        {
          q: "Are the toys safe for children?",
          a: "Absolutely! Our toys are made using traditional methods with 100% natural, non-toxic colors derived from seeds, lac, and minerals. The wood used is Ankudu (Wrightia tinctoria), which is lightweight and safe. All products comply with international safety standards and are certified non-toxic."
        },
        {
          q: "What materials are used?",
          a: "Our toys are crafted from Ankudu wood (locally sourced, sustainable wood) and colored with natural dyes extracted from: 1) Lac (red), 2) Indigo (blue), 3) Haritaki seeds (yellow), 4) Myrobalan (green), 5) Charcoal (black). No synthetic colors or chemicals are used, making them 100% eco-friendly and child-safe."
        },
        {
          q: "Do you offer bulk orders?",
          a: "Yes! We offer bulk orders for: 1) Schools and educational institutions, 2) NGOs and child welfare organizations, 3) Corporate gifting, 4) Wedding return favors, 5) Festival gifting. For bulk orders, we offer special pricing and customization options. Contact our bulk orders team at bulk@etikoppakatoys.com for a custom quote."
        },
        {
          q: "Are these toys GI tagged?",
          a: "Yes! Etikoppaka toys are recognized as a Geographical Indication (GI) product of India, along with Kondapalli toys. This certification ensures authenticity and protects our traditional craft. When you buy from us, you're getting genuine Etikoppaka toys made by certified artisans."
        },
        {
          q: "How should I clean the toys?",
          a: "To maintain the natural finish: 1) Wipe with a soft, dry cloth, 2) Avoid water or any cleaning liquids, 3) Keep away from direct sunlight for extended periods, 4) Store in a cool, dry place. The natural colors may fade slightly over time, adding to the toy's vintage charm."
        }
      ]
    },
    {
      id: 'support',
      category: "Customer Support",
      icon: "📞",
      questions: [
        {
          q: "How can I contact customer support?",
          a: "You can reach us through multiple channels: 1) Phone: +91 9154884214 (Mon-Sat, 10 AM - 7 PM), 2) Email: orders@etikoppakatoys.com (24x7 response within 4 hours), 3) WhatsApp: +91 9154884214 (for quick queries), 4) Contact Form on our website. We typically respond within 4 hours on business days."
        },
        {
          q: "What are your support hours?",
          a: "Our customer support team is available: Monday to Saturday: 10:00 AM to 7:00 PM IST, Sunday: Closed for order processing (you can still place orders, responses will be on Monday). For urgent queries, you can send an email and we'll respond within 24 hours even on Sundays."
        },
        {
          q: "Where are you located?",
          a: "Our workshop and showroom are located at: Etikoppaka Village, Visakhapatnam District, Andhra Pradesh - 531082. Visitors are welcome by appointment. Please call ahead to schedule a visit. You can see the entire crafting process and shop directly from our workshop."
        },
        {
          q: "Do you have any physical stores?",
          a: "Currently, we sell exclusively through our website. However, we occasionally participate in exhibitions and craft fairs across India. Follow us on Instagram @etikoppakatoys for updates about our upcoming events and exhibitions."
        },
        {
          q: "What is your grievance redressal mechanism?",
          a: "For any unresolved issues, you can escalate to our Grievance Officer: Name: Mr. Pavan Kalyan, Email: grievance@etikoppakatoys.com, Phone: +91 9154884214. We aim to resolve all complaints within 48 hours. In case of further escalation, you may contact the concerned consumer forum."
        }
      ]
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const getFilteredFAQs = () => {
    let filtered = faqCategories;
    
    if (activeCategory !== 'all') {
      filtered = filtered.filter(cat => cat.id === activeCategory);
    }
    
    if (searchTerm) {
      filtered = filtered.map(category => ({
        ...category,
        questions: category.questions.filter(q => 
          q.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.a.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })).filter(category => category.questions.length > 0);
    }
    
    return filtered;
  };

  const filteredFAQs = getFilteredFAQs();

  // Mobile UI
  if (isMobile) {
    return (
      <div className={styles.mobileFAQPage}>
        <div className={styles.mobileHeader}>
          <Link to="/" className={styles.mobileBackBtn}>
            <FiArrowLeft />
          </Link>
          <h1>Help & FAQs</h1>
          <div className={styles.mobilePlaceholder}></div>
        </div>

        {/* Search Bar */}
        <div className={styles.mobileSearchBar}>
          <FiSearch />
          <input 
            type="text" 
            placeholder="Search for answers..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Category Filters */}
        <div className={styles.mobileCategoryFilters}>
          <button 
            className={activeCategory === 'all' ? styles.active : ''}
            onClick={() => setActiveCategory('all')}
          >
            All
          </button>
          {faqCategories.map(cat => (
            <button 
              key={cat.id}
              className={activeCategory === cat.id ? styles.active : ''}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.icon} {cat.category.split(' ')[0]}
            </button>
          ))}
        </div>

        <div className={styles.mobileContent}>
          {filteredFAQs.length === 0 && searchTerm && (
            <div className={styles.mobileNoResults}>
              <FiSearch />
              <p>No results found for "{searchTerm}"</p>
              <button onClick={() => setSearchTerm('')}>Clear Search</button>
            </div>
          )}

          {filteredFAQs.map((category, catIdx) => (
            <div key={catIdx} className={styles.mobileCategory}>
              <div className={styles.mobileCategoryHeader}>
                <span>{category.icon}</span>
                <h3>{category.category}</h3>
              </div>
              {category.questions.map((faq, idx) => {
                const globalIdx = `${catIdx}-${idx}`;
                return (
                  <div key={idx} className={styles.mobileFAQItem}>
                    <button 
                      className={styles.mobileFAQQuestion}
                      onClick={() => toggleFAQ(globalIdx)}
                    >
                      <span>{faq.q}</span>
                      {openIndex === globalIdx ? <FiChevronUp /> : <FiChevronDown />}
                    </button>
                    {openIndex === globalIdx && (
                      <div className={styles.mobileFAQAnswer}>
                        <p>{faq.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          <div className={styles.mobileContactCard}>
            <h3>Still have questions?</h3>
            <p>We're here to help you</p>
            <div className={styles.mobileContactInfo}>
              <div><FiPhone /> +91 9154884214</div>
              <div><FiMail /> orders@etikoppakatoys.store</div>
            </div>
            <Link to="/contact" className={styles.mobileContactBtn}>Contact Support →</Link>
          </div>
        </div>
      </div>
    );
  }

  // Desktop UI (Amazon/Flipkart Style)
  return (
    <div className={styles.faqPage}>
      <div className={styles.container}>
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Link to="/">Home</Link>
          <span>/</span>
          <span className={styles.current}>Help & FAQs</span>
        </div>

        {/* Hero Section */}
        <div className={styles.heroSection}>
          <div className={styles.heroContent}>
            <h1>How can we help you?</h1>
            <div className={styles.searchWrapper}>
              <FiSearch className={styles.searchIcon} />
              <input 
                type="text" 
                placeholder="Search for answers..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Categories Navigation */}
        <div className={styles.categoriesNav}>
          {faqCategories.map(cat => (
            <button 
              key={cat.id}
              className={`${styles.categoryNavBtn} ${activeCategory === cat.id ? styles.active : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              <span>{cat.icon}</span>
              <span>{cat.category}</span>
            </button>
          ))}
          <button 
            className={`${styles.categoryNavBtn} ${activeCategory === 'all' ? styles.active : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            <span>📋</span>
            <span>View All</span>
          </button>
        </div>

        <div className={styles.contentGrid}>
          <div className={styles.mainContent}>
            {filteredFAQs.length === 0 && searchTerm && (
              <div className={styles.noResults}>
                <FiSearch />
                <h3>No results found</h3>
                <p>We couldn't find any answers for "{searchTerm}"</p>
                <button onClick={() => setSearchTerm('')}>Clear Search</button>
              </div>
            )}

            {filteredFAQs.map((category, catIdx) => (
              <div key={catIdx} className={styles.categorySection}>
                <div className={styles.categoryHeader}>
                  <span className={styles.categoryIcon}>{category.icon}</span>
                  <h2>{category.category}</h2>
                  <span className={styles.questionCount}>{category.questions.length} questions</span>
                </div>
                <div className={styles.faqList}>
                  {category.questions.map((faq, idx) => {
                    const globalIdx = `${catIdx}-${idx}`;
                    return (
                      <div key={idx} className={styles.faqItem}>
                        <button 
                          className={styles.faqQuestion}
                          onClick={() => toggleFAQ(globalIdx)}
                        >
                          <span>{faq.q}</span>
                          {openIndex === globalIdx ? <FiChevronUp /> : <FiChevronDown />}
                        </button>
                        {openIndex === globalIdx && (
                          <div className={styles.faqAnswer}>
                            <p>{faq.a}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.sidebar}>
            <div className={styles.sidebarCard}>
              <h3>📞 Need Help?</h3>
              <p>Our customer support team is available Monday to Saturday, 10 AM - 7 PM</p>
              <div className={styles.contactInfo}>
                <FiPhone />
                <div>
                  <strong>Call us</strong>
                  <span>+91 9154884214</span>
                </div>
              </div>
              <div className={styles.contactInfo}>
                <FiMail />
                <div>
                  <strong>Email us</strong>
                  <span>orders@etikoppakatoys.store</span>
                </div>
              </div>
              <Link to="/contact" className={styles.contactBtn}>Send a Message →</Link>
            </div>

            <div className={styles.sidebarCard}>
              <h3>🛒 Quick Links</h3>
              <ul className={styles.quickLinks}>
                <li><Link to="/orders">Track Your Order</Link></li>
                <li><Link to="/shipping">Shipping Policy</Link></li>
                <li><Link to="/returns">Return Policy</Link></li>
                <li><Link to="/products">Shop Now</Link></li>
              </ul>
            </div>

            <div className={styles.sidebarCard}>
              <h3>🌸 Why Choose Us</h3>
              <div className={styles.trustBadges}>
                <div className={styles.badge}>
                  <FiShield />
                  <span>GI Tagged</span>
                </div>
                <div className={styles.badge}>
                  <FiPackage />
                  <span>Eco-Friendly</span>
                </div>
                <div className={styles.badge}>
                  <FiTruck />
                  <span>Free Shipping*</span>
                </div>
                <div className={styles.badge}>
                  <FiRefreshCw />
                  <span>7-Day Returns</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;