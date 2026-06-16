import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiRefreshCw, FiCheckCircle, FiXCircle, FiClock, FiShield, FiPhone, FiMail, FiArrowLeft, FiTruck, FiDollarSign } from 'react-icons/fi';
import styles from './ReturnPolicy.module.css';

const ReturnPolicy = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const returnInfo = {
    returnWindow: 7,
    eligibleConditions: [
      "Item arrived damaged or defective",
      "Wrong item delivered",
      "Missing parts or accessories",
      "Quality not as described",
      "Size mismatch (for applicable products)"
    ],
    nonEligibleConditions: [
      "Items used, washed, or altered",
      "Return request after 7 days of delivery",
      "Products without original packaging/tags",
      "Customized or personalized items",
      "Items damaged due to misuse"
    ],
    refundTimeline: "5-7 business days",
    returnShipping: "Free for defective/damaged products",
    refundMethod: "Original payment method / Bank transfer / Store credit",
    returnProcessDays: "2-3 business days for inspection",
    replacementAvailable: true,
    selfShipReturns: "Self-ship returns accepted with shipping reimbursement"
  };

  const returnSteps = [
    { step: 1, title: "Initiate Return", description: "Contact us within 7 days of delivery" },
    { step: 2, title: "Share Details", description: "Order number, issue description & photos/videos" },
    { step: 3, title: "Verification", description: "Team reviews within 24-48 hours" },
    { step: 4, title: "Return Approval", description: "Return pickup arranged or self-ship initiated" },
    { step: 5, title: "Inspection", description: "Product inspected at our facility (2-3 days)" },
    { step: 6, title: "Refund/Replacement", description: "Processed within 5-7 business days" }
  ];

  const refundMethods = [
    { method: "Original Payment Method", time: "5-7 business days", note: "Credits back to card/UPI/bank" },
    { method: "Bank Transfer", time: "3-5 business days", note: "For COD or prepaid orders" },
    { method: "Store Credit", time: "Instant", note: "Valid for 12 months" }
  ];

  // Mobile UI
  if (isMobile) {
    return (
      <div className={styles.mobileReturnPage}>
        <div className={styles.mobileHeader}>
          <Link to="/" className={styles.mobileBackBtn}>
            <FiArrowLeft />
          </Link>
          <h1>Return Policy</h1>
          <div className={styles.mobilePlaceholder}></div>
        </div>

        <div className={styles.mobileContent}>
          <div className={styles.mobileHero}>
            <FiRefreshCw className={styles.mobileHeroIcon} />
            <h2>Easy Returns & Refunds</h2>
            <p>{returnInfo.returnWindow}-day hassle-free return policy</p>
          </div>

          <div className={styles.mobileInfoCard}>
            <h3>📋 How to Return an Item</h3>
            <div className={styles.mobileSteps}>
              {returnSteps.map((step) => (
                <div key={step.step} className={styles.mobileStep}>
                  <div className={styles.mobileStepNumber}>{step.step}</div>
                  <div>
                    <strong>{step.title}</strong>
                    <span>{step.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.mobileInfoCard}>
            <h3>✅ Eligible for Return</h3>
            <ul>
              {returnInfo.eligibleConditions.map((condition, idx) => (
                <li key={idx}><FiCheckCircle /> {condition}</li>
              ))}
            </ul>
          </div>

          <div className={styles.mobileInfoCard}>
            <h3>❌ Not Eligible for Return</h3>
            <ul>
              {returnInfo.nonEligibleConditions.map((condition, idx) => (
                <li key={idx}><FiXCircle /> {condition}</li>
              ))}
            </ul>
          </div>

          <div className={styles.mobileInfoCard}>
            <h3>💰 Refund Options</h3>
            {refundMethods.map((method, idx) => (
              <div key={idx} className={styles.mobileRefundMethod}>
                <div><strong>{method.method}</strong></div>
                <div className={styles.mobileRefundDetail}>
                  <span>⏱️ {method.time}</span>
                  <span>📝 {method.note}</span>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.mobileContactCard}>
            <h3>📞 Initiate a Return</h3>
            <p>Contact our customer support team to start your return:</p>
            <div className={styles.mobileContactInfo}>
              <div><FiPhone /> +91 9154884214</div>
              <div><FiMail /> orders@etikoppakatoys.store</div>
            </div>
            <p className={styles.mobileReturnNote}>Have your order number ready for faster processing.</p>
          </div>
        </div>
      </div>
    );
  }

  // Desktop UI
  return (
    <div className={styles.returnPage}>
      <div className={styles.container}>
        <div className={styles.breadcrumb}>
          <Link to="/">Home</Link>
          <span>/</span>
          <span className={styles.current}>Return Policy</span>
        </div>

        <div className={styles.pageHeader}>
          <FiRefreshCw className={styles.pageIcon} />
          <h1>Return & Refund Policy</h1>
          <p>{returnInfo.returnWindow}-day hassle-free returns. Shop with confidence!</p>
        </div>

        <div className={styles.contentGrid}>
          <div className={styles.mainContent}>
            <div className={styles.infoCard}>
              <h2>📋 Return Process</h2>
              <div className={styles.stepsGrid}>
                {returnSteps.map((step) => (
                  <div key={step.step} className={styles.stepCard}>
                    <div className={styles.stepNumber}>{step.step}</div>
                    <h4>{step.title}</h4>
                    <p>{step.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.infoCard}>
              <h2>✅ Eligible for Return</h2>
              <div className={styles.eligibleList}>
                {returnInfo.eligibleConditions.map((condition, idx) => (
                  <div key={idx} className={styles.eligibleItem}>
                    <FiCheckCircle />
                    <span>{condition}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.infoCard}>
              <h2>❌ Not Eligible for Return</h2>
              <div className={styles.notEligibleList}>
                {returnInfo.nonEligibleConditions.map((condition, idx) => (
                  <div key={idx} className={styles.notEligibleItem}>
                    <FiXCircle />
                    <span>{condition}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.infoCard}>
              <h2>💰 Refund Information</h2>
              <div className={styles.refundTable}>
                {refundMethods.map((method, idx) => (
                  <div key={idx} className={styles.refundRow}>
                    <div className={styles.refundMethod}>{method.method}</div>
                    <div className={styles.refundTimeline}>⏱️ {method.time}</div>
                    <div className={styles.refundNote}>{method.note}</div>
                  </div>
                ))}
              </div>
              <p className={styles.refundNoteText}>* Refunds are processed after successful inspection of returned item.</p>
            </div>
          </div>

          <div className={styles.sidebar}>
            <div className={styles.sidebarCard}>
              <h3>🚚 Return Shipping</h3>
              <div className={styles.returnShippingInfo}>
                <p><strong>For defective/damaged items:</strong> Free pickup arranged by us.</p>
                <p><strong>For other returns:</strong> Self-ship to our address. Shipping charges reimbursed up to ₹100 after verification.</p>
              </div>
              <hr />
              <div className={styles.returnAddress}>
                <strong>Return Address:</strong>
                <span>Etikoppaka Toys, Etikoppaka Village, Visakhapatnam District, Andhra Pradesh - 531082</span>
              </div>
            </div>

            <div className={styles.sidebarCard}>
              <h3>🔄 Replacement Policy</h3>
              <p>For eligible items, we offer replacement with a new piece if available in stock. Replacement is processed after we receive and inspect the returned item.</p>
              <div className={styles.replacementInfo}>
                <FiTruck />
                <span>Free replacement pickup arranged</span>
              </div>
            </div>

            <div className={styles.sidebarCard}>
              <h3>📞 Need Help?</h3>
              <div className={styles.contactInfo}>
                <FiPhone />
                <div>
                  <strong>Call Returns Team</strong>
                  <span>+91 9154884214</span>
                </div>
              </div>
              <div className={styles.contactInfo}>
                <FiMail />
                <div>
                  <strong>Email Returns</strong>
                  <span>orders@etikoppakatoys.store</span>
                </div>
              </div>
              <div className={styles.contactInfo}>
                <FiClock />
                <div>
                  <strong>Support Hours</strong>
                  <span>Monday - Saturday, 10 AM - 7 PM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnPolicy;