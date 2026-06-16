import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiTruck, FiClock, FiMapPin, FiPhone, FiMail, FiShield, FiCheckCircle, FiArrowLeft, FiPackage, FiGlobe } from 'react-icons/fi';
import styles from './ShippingPolicy.module.css';

const ShippingPolicy = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const shippingInfo = {
    processingTime: "24-48 hours",
    deliveryTime: "3-7 business days",
    freeShippingThreshold: 499,
    shippingCost: 40,
    codAvailable: true,
    codCharges: 0,
    internationalShipping: false,
    dispatchDays: "Monday to Saturday (excluding public holidays)",
    estimatedDelivery: "3-7 business days after dispatch",
    trackingEnabled: true,
    courierPartners: ["Delhivery", "Ecom Express", "India Post", "DTDC"],
    paymentTerms: "Full payment required at checkout. COD available with zero extra charges.",
    contactForOrders: "+91 9154884214",
    emailForOrders: "orders@etikoppakatoys.store"
  };

  const shippingZones = [
    { zone: "Andhra Pradesh & Telangana", time: "2-4 days", cost: "Free above ₹499 | ₹40 otherwise" },
    { zone: "South India (KA, TN, KL)", time: "3-5 days", cost: "Free above ₹499 | ₹40 otherwise" },
    { zone: "West India (MH, GJ)", time: "4-6 days", cost: "Free above ₹499 | ₹50 otherwise" },
    { zone: "North India (DL, UP, HR, PB)", time: "5-7 days", cost: "Free above ₹499 | ₹50 otherwise" },
    { zone: "East India (WB, OD, JH)", time: "5-7 days", cost: "Free above ₹499 | ₹60 otherwise" },
    { zone: "Northeast India", time: "7-10 days", cost: "Free above ₹999 | ₹80 otherwise" }
  ];

  // Mobile UI
  if (isMobile) {
    return (
      <div className={styles.mobileShippingPage}>
        <div className={styles.mobileHeader}>
          <Link to="/" className={styles.mobileBackBtn}>
            <FiArrowLeft />
          </Link>
          <h1>Shipping Policy</h1>
          <div className={styles.mobilePlaceholder}></div>
        </div>

        <div className={styles.mobileContent}>
          <div className={styles.mobileHero}>
            <FiTruck className={styles.mobileHeroIcon} />
            <h2>Fast & Reliable Delivery</h2>
            <p>Free shipping on orders above ₹{shippingInfo.freeShippingThreshold}</p>
          </div>

          <div className={styles.mobileInfoGrid}>
            <div className={styles.mobileInfoCard}>
              <FiClock />
              <div>
                <strong>Processing Time</strong>
                <span>{shippingInfo.processingTime}</span>
              </div>
            </div>
            <div className={styles.mobileInfoCard}>
              <FiTruck />
              <div>
                <strong>Delivery Time</strong>
                <span>{shippingInfo.deliveryTime}</span>
              </div>
            </div>
            <div className={styles.mobileInfoCard}>
              <FiShield />
              <div>
                <strong>Free Shipping</strong>
                <span>Above ₹{shippingInfo.freeShippingThreshold}</span>
              </div>
            </div>
            <div className={styles.mobileInfoCard}>
              <FiPackage />
              <div>
                <strong>Track Order</strong>
                <span>Real-time tracking available</span>
              </div>
            </div>
          </div>

          <div className={styles.mobileSection}>
            <h3>📦 How We Ship</h3>
            <div className={styles.mobilePaymentTerms}>
              <p>We partner with leading courier services including Delhivery, Ecom Express, India Post, and DTDC to ensure your orders reach you safely and on time.</p>
              <div className={styles.mobilePaymentSteps}>
                <div className={styles.step}>
                  <span className={styles.stepNumber}>1</span>
                  <span>Order placed & confirmed</span>
                </div>
                <div className={styles.step}>
                  <span className={styles.stepNumber}>2</span>
                  <span>Order packed with care ({shippingInfo.processingTime})</span>
                </div>
                <div className={styles.step}>
                  <span className={styles.stepNumber}>3</span>
                  <span>Dispatched via trusted courier partner</span>
                </div>
                <div className={styles.step}>
                  <span className={styles.stepNumber}>4</span>
                  <span>Tracking link shared via email/SMS</span>
                </div>
                <div className={styles.step}>
                  <span className={styles.stepNumber}>5</span>
                  <span>Delivered within {shippingInfo.deliveryTime}</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.mobileSection}>
            <h3>📍 Shipping Zones & Delivery Timeline</h3>
            <div className={styles.mobileZonesList}>
              {shippingZones.map((zone, idx) => (
                <div key={idx} className={styles.mobileZoneItem}>
                  <div>
                    <strong>{zone.zone}</strong>
                    <span>Delivery: {zone.time}</span>
                  </div>
                  <span className={styles.zoneCost}>{zone.cost}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.mobileContactCard}>
            <h3>📞 Need Help With Your Order?</h3>
            <p>For order tracking, dispatch updates, or shipping inquiries:</p>
            <div className={styles.mobileContactInfo}>
              <div><FiPhone /> {shippingInfo.contactForOrders}</div>
              <div><FiMail /> {shippingInfo.emailForOrders}</div>
            </div>
            <div className={styles.mobileTiming}>
              <FiClock /> Support Hours: Mon-Sat, 10 AM - 7 PM
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop UI
  return (
    <div className={styles.shippingPage}>
      <div className={styles.container}>
        <div className={styles.breadcrumb}>
          <Link to="/">Home</Link>
          <span>/</span>
          <span className={styles.current}>Shipping Policy</span>
        </div>

        <div className={styles.pageHeader}>
          <FiTruck className={styles.pageIcon} />
          <h1>Shipping Policy</h1>
          <p>Fast, reliable delivery across India</p>
        </div>

        <div className={styles.contentGrid}>
          <div className={styles.mainContent}>
            <div className={styles.infoCard}>
              <h2>📦 Order Processing & Dispatch</h2>
              <p>Orders are processed within <strong>{shippingInfo.processingTime}</strong> of order confirmation. We dispatch orders from our facility in Etikoppaka, Andhra Pradesh.</p>
              
              <h3>Order Dispatch Process:</h3>
              <ul className={styles.processList}>
                <li>✅ Order placed & payment confirmed</li>
                <li>📦 Quality check & secure packaging ({shippingInfo.processingTime})</li>
                <li>🚚 Handover to courier partner</li>
                <li>📱 Tracking details shared via email & SMS</li>
                <li>🏠 Delivery within {shippingInfo.deliveryTime}</li>
              </ul>
            </div>

            <div className={styles.infoCard}>
              <h2>🚚 Delivery Timeline</h2>
              <p>Estimated delivery time: <strong>{shippingInfo.deliveryTime}</strong> after dispatch.</p>
              <div className={styles.timeline}>
                <div className={styles.timelineStep}>
                  <div className={styles.timelineDot}></div>
                  <div>Order Confirmed</div>
                </div>
                <div className={styles.timelineLine}></div>
                <div className={styles.timelineStep}>
                  <div className={styles.timelineDot}></div>
                  <div>Processing ({shippingInfo.processingTime})</div>
                </div>
                <div className={styles.timelineLine}></div>
                <div className={styles.timelineStep}>
                  <div className={styles.timelineDot}></div>
                  <div>Dispatched & Tracking Shared</div>
                </div>
                <div className={styles.timelineLine}></div>
                <div className={styles.timelineStep}>
                  <div className={styles.timelineDot}></div>
                  <div>In Transit ({shippingInfo.deliveryTime})</div>
                </div>
                <div className={styles.timelineLine}></div>
                <div className={styles.timelineStep}>
                  <div className={styles.timelineDot}></div>
                  <div>Delivered</div>
                </div>
              </div>
            </div>

            <div className={styles.infoCard}>
              <h2>📍 Shipping Zones & Charges</h2>
              <div className={styles.zonesTable}>
                <div className={styles.zonesHeader}>
                  <span>Region</span>
                  <span>Delivery Time</span>
                  <span>Shipping Charges</span>
                </div>
                {shippingZones.map((zone, idx) => (
                  <div key={idx} className={styles.zonesRow}>
                    <span>{zone.zone}</span>
                    <span>{zone.time}</span>
                    <span className={styles.freeShipping}>{zone.cost}</span>
                  </div>
                ))}
              </div>
              <p className={styles.shippingNote}>* Free shipping applies automatically at checkout for orders above ₹{shippingInfo.freeShippingThreshold}</p>
            </div>

            <div className={styles.infoCard}>
              <h2>📱 Order Tracking</h2>
              <p>Once your order is dispatched, you will receive:</p>
              <ul className={styles.processList}>
                <li>📧 Email with tracking link and courier details</li>
                <li>📱 SMS with tracking number on your registered mobile</li>
                <li>🔗 Real-time tracking on courier partner's website</li>
              </ul>
              <p>You can also track your order status from <Link to="/orders">My Orders</Link> section.</p>
            </div>
          </div>

          <div className={styles.sidebar}>
            <div className={styles.sidebarCard}>
              <h3>🎁 Free Shipping Offer</h3>
              <p>Enjoy free shipping on all orders above ₹{shippingInfo.freeShippingThreshold}. No coupon code needed - applied automatically!</p>
              <hr />
              <div className={styles.contactInfo}>
                <FiPackage />
                <div>
                  <strong>Cash on Delivery</strong>
                  <span>Available across India with zero extra charges</span>
                </div>
              </div>
            </div>

            <div className={styles.sidebarCard}>
              <h3>📞 Customer Support</h3>
              <div className={styles.contactInfo}>
                <FiPhone />
                <div>
                  <strong>Call us</strong>
                  <span>{shippingInfo.contactForOrders}</span>
                </div>
              </div>
              <div className={styles.contactInfo}>
                <FiMail />
                <div>
                  <strong>Email us</strong>
                  <span>{shippingInfo.emailForOrders}</span>
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

            <div className={styles.sidebarCard}>
              <h3>✅ Bulk Orders & Corporate Gifting</h3>
              <p>For bulk orders and corporate gifting inquiries, contact us directly for special pricing and shipping arrangements.</p>
              <Link to="/bulk-order" className={styles.bulkLink}>Request Bulk Quote →</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingPolicy;