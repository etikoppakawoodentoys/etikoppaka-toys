import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronDown, FiChevronUp, FiPhone, FiMail, FiMessageCircle, FiArrowLeft } from 'react-icons/fi';
import styles from './FAQ.module.css';

const FAQ = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);

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
      category: "🛒 Orders & Payments",
      icon: "💰",
      questions: [
        {
          q: "How do I place an order?",
          a: "Simply browse our products, add items to cart, proceed to checkout, and select Cash on Delivery. Our team will call you to confirm the order and share payment details for 50% advance."
        },
        {
          q: "What is the payment process?",
          a: "We require 50% advance payment to confirm your order. Our team will call you within 24 hours of order placement to share UPI/Bank transfer details. The remaining 50% is payable on delivery via cash, card, or UPI."
        },
        {
          q: "Is Cash on Delivery available?",
          a: "Yes, COD is available across India. However, 50% advance payment is required to confirm the order. The balance 50% can be paid on delivery."
        },
        {
          q: "How will I know if my order is confirmed?",
          a: "You will receive a confirmation call from our team within 24 hours. Your order is confirmed only after the 50% advance payment is received."
        }
      ]
    },
    {
      category: "🚚 Shipping & Delivery",
      icon: "📦",
      questions: [
        {
          q: "How long does delivery take?",
          a: "Delivery takes 3-7 business days after shipping. Processing takes 1-2 days after payment confirmation."
        },
        {
          q: "Do you offer free shipping?",
          a: "Yes, free shipping on all orders above ₹499."
        },
        {
          q: "Do you ship internationally?",
          a: "Currently, we ship only within India."
        },
        {
          q: "Can I track my order?",
          a: "Yes, once your order is shipped, you will receive a tracking link via SMS/Email."
        }
      ]
    },
    {
      category: "🔄 Returns & Refunds",
      icon: "🔄",
      questions: [
        {
          q: "What is your return policy?",
          a: "We offer a 7-day return policy for damaged, defective, or wrong products received. Returns are not accepted for used or washed items."
        },
        {
          q: "How do I initiate a return?",
          a: "Contact our support team within 7 days of delivery. Share your order number and issue details. We'll arrange a pickup and process refund after verification."
        },
        {
          q: "How long does refund take?",
          a: "Refunds are processed within 5-7 business days after the returned product is verified."
        }
      ]
    },
    {
      category: "🎨 Product Information",
      icon: "🎨",
      questions: [
        {
          q: "Are the toys safe for children?",
          a: "Yes, all our toys are made with natural, non-toxic colors and sustainable wood. They are completely safe for children."
        },
        {
          q: "What materials are used?",
          a: "We use Ankudu wood (locally sourced) and natural dyes extracted from seeds, lac, and minerals."
        },
        {
          q: "Do you offer bulk orders?",
          a: "Yes, bulk orders are available for schools, NGOs, and corporate gifting. Contact us for special pricing."
        }
      ]
    },
    {
      category: "📞 Customer Support",
      icon: "📞",
      questions: [
        {
          q: "How can I contact support?",
          a: "Call us at +91 98765 43210 (Mon-Sat, 10 AM - 7 PM) or email orders@etikoppakatoys.com"
        },
        {
          q: "What are your support hours?",
          a: "Our support team is available Monday to Saturday, 10:00 AM to 7:00 PM IST."
        },
        {
          q: "Do you have a physical store?",
          a: "Our workshop and showroom are located in Etikoppaka, Visakhapatnam, Andhra Pradesh."
        }
      ]
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Mobile UI
  if (isMobile) {
    return (
      <div className={styles.mobileFAQPage}>
        <div className={styles.mobileHeader}>
          <Link to="/" className={styles.mobileBackBtn}>
            <FiArrowLeft />
          </Link>
          <h1>FAQ</h1>
          <div className={styles.mobilePlaceholder}></div>
        </div>

        <div className={styles.mobileContent}>
          <div className={styles.mobileHero}>
            <FiMessageCircle className={styles.mobileHeroIcon} />
            <h2>Frequently Asked Questions</h2>
            <p>Find answers to common questions</p>
          </div>

          {faqCategories.map((category, catIdx) => (
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
            <p>Our support team is here to help</p>
            <div className={styles.mobileContactInfo}>
              <div><FiPhone /> +91 98765 43210</div>
              <div><FiMail /> support@etikoppakatoys.com</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop UI
  return (
    <div className={styles.faqPage}>
      <div className={styles.container}>
        <div className={styles.breadcrumb}>
          <Link to="/">Home</Link>
          <span>/</span>
          <span className={styles.current}>FAQ</span>
        </div>

        <div className={styles.pageHeader}>
          <FiMessageCircle className={styles.pageIcon} />
          <h1>Frequently Asked Questions</h1>
          <p>Find answers to common questions about our products, orders, and policies</p>
        </div>

        <div className={styles.contentGrid}>
          <div className={styles.mainContent}>
            {faqCategories.map((category, catIdx) => (
              <div key={catIdx} className={styles.categorySection}>
                <div className={styles.categoryHeader}>
                  <span className={styles.categoryIcon}>{category.icon}</span>
                  <h2>{category.category}</h2>
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
              <p>Our customer support team is available to assist you</p>
              <div className={styles.contactInfo}>
                <FiPhone />
                <div>
                  <strong>Call us</strong>
                  <span>+91 9154884214</span>
                  <small>Mon-Sat, 10 AM - 7 PM</small>
                </div>
              </div>
              <div className={styles.contactInfo}>
                <FiMail />
                <div>
                  <strong>Email us</strong>
                  <span>orders@etikoppakatoys.store</span>
                  <small>24x7 support</small>
                </div>
              </div>
            </div>

            <div className={styles.sidebarCard}>
              <h3>🛒 Order Status</h3>
              <p>Track your order status anytime</p>
              <Link to="/orders" className={styles.trackBtn}>
                Track Order →
              </Link>
            </div>

            <div className={styles.sidebarCard}>
              <h3>📦 Quick Links</h3>
              <ul className={styles.quickLinks}>
                <li><Link to="/shipping">Shipping Policy</Link></li>
                <li><Link to="/returns">Return Policy</Link></li>
                <li><Link to="/contact">Contact Us</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;