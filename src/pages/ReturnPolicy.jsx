import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiRefreshCw, FiCheckCircle, FiXCircle, FiClock, FiShield, FiPhone, FiMail, FiArrowLeft } from 'react-icons/fi';
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
      "Product damaged during shipping",
      "Wrong product delivered",
      "Missing parts/accessories",
      "Product quality issues"
    ],
    nonEligibleConditions: [
      "Used or washed products",
      "Returns after 7 days",
      "Products without original packaging",
      "Customized/personalized items"
    ],
    refundTimeline: "5-7 business days",
    returnShipping: "Free for defective products",
    refundMethod: "Bank transfer / Store credit"
  };

  const returnSteps = [
    { step: 1, title: "Contact Us", description: "Reach out within 7 days of delivery" },
    { step: 2, title: "Share Details", description: "Order number & issue description" },
    { step: 3, title: "Verification", description: "Our team verifies the issue" },
    { step: 4, title: "Pickup Arranged", description: "Return pickup scheduled" },
    { step: 5, title: "Refund Processed", description: "Refund within 5-7 business days" }
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
            <h2>Easy Returns</h2>
            <p>7-day hassle-free return policy</p>
          </div>

          <div className={styles.mobileInfoCard}>
            <h3>📋 Return Process</h3>
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

          <div className={styles.mobileContactCard}>
            <h3>📞 Need Help?</h3>
            <div className={styles.mobileContactInfo}>
              <div><FiPhone /> +91 9154884214</div>
              <div><FiMail /> returns@etikoppakatoys.com</div>
            </div>
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
          <h1>Return Policy</h1>
          <p>7-day hassle-free return policy</p>
        </div>

        <div className={styles.contentGrid}>
          <div className={styles.mainContent}>
            <div className={styles.infoCard}>
              <h2>📋 How to Return an Item</h2>
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
          </div>

          <div className={styles.sidebar}>
            <div className={styles.sidebarCard}>
              <h3>💰 Refund Information</h3>
              <div className={styles.refundInfo}>
                <div className={styles.refundItem}>
                  <strong>Refund Timeline</strong>
                  <span>{returnInfo.refundTimeline}</span>
                </div>
                <div className={styles.refundItem}>
                  <strong>Return Shipping</strong>
                  <span>{returnInfo.returnShipping}</span>
                </div>
                <div className={styles.refundItem}>
                  <strong>Refund Method</strong>
                  <span>{returnInfo.refundMethod}</span>
                </div>
              </div>
            </div>

            <div className={styles.sidebarCard}>
              <h3>📞 Contact Returns Team</h3>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnPolicy;