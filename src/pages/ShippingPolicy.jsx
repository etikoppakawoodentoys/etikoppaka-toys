import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiTruck, FiClock, FiMapPin, FiPhone, FiMail, FiShield, FiCheckCircle, FiArrowLeft } from 'react-icons/fi';
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
    processingTime: "1-2 business days",
    deliveryTime: "3-7 business days",
    freeShippingThreshold: 499,
    shippingCost: 50,
    codAvailable: true,
    codCharges: 0,
    internationalShipping: false,
    paymentTerms: "50% advance payment required for order confirmation. Balance 50% on delivery.",
    contactForOrders: "+91 9154884214",
    emailForOrders: "orders@etikoppakatoys.store"
  };

  const shippingZones = [
    { zone: "Andhra Pradesh", time: "3-4 days", cost: "Free above ₹499" },
    { zone: "Telangana", time: "3-4 days", cost: "Free above ₹499" },
    { zone: "Karnataka", time: "4-5 days", cost: "Free above ₹499" },
    { zone: "Tamil Nadu", time: "4-5 days", cost: "Free above ₹499" },
    { zone: "Kerala", time: "5-6 days", cost: "Free above ₹499" },
    { zone: "Maharashtra", time: "5-6 days", cost: "Free above ₹499" },
    { zone: "Delhi NCR", time: "5-7 days", cost: "Free above ₹499" },
    { zone: "Other States", time: "5-7 days", cost: "Free above ₹499" }
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
          {/* Hero Section */}
          <div className={styles.mobileHero}>
            <FiTruck className={styles.mobileHeroIcon} />
            <h2>Shipping & Delivery</h2>
            <p>Fast, reliable shipping across India</p>
          </div>

          {/* Shipping Info Cards */}
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
                <span>On orders above ₹{shippingInfo.freeShippingThreshold}</span>
              </div>
            </div>
          </div>

          {/* Payment Terms */}
          <div className={styles.mobileSection}>
            <h3>💰 Payment Terms</h3>
            <div className={styles.mobilePaymentTerms}>
              <p>{shippingInfo.paymentTerms}</p>
              <div className={styles.mobilePaymentSteps}>
                <div className={styles.step}>
                  <span className={styles.stepNumber}>1</span>
                  <span>Place order online</span>
                </div>
                <div className={styles.step}>
                  <span className={styles.stepNumber}>2</span>
                  <span>Our team calls for confirmation</span>
                </div>
                <div className={styles.step}>
                  <span className={styles.stepNumber}>3</span>
                  <span>Pay 50% advance via UPI/Bank transfer</span>
                </div>
                <div className={styles.step}>
                  <span className={styles.stepNumber}>4</span>
                  <span>Product shipped after payment confirmation</span>
                </div>
                <div className={styles.step}>
                  <span className={styles.stepNumber}>5</span>
                  <span>Pay remaining 50% on delivery</span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Zones */}
          <div className={styles.mobileSection}>
            <h3>📍 Shipping Zones</h3>
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

          {/* Contact Section */}
          <div className={styles.mobileContactCard}>
            <h3>📞 Need Help?</h3>
            <p>For order confirmation and payment, contact us:</p>
            <div className={styles.mobileContactInfo}>
              <div><FiPhone /> {shippingInfo.contactForOrders}</div>
              <div><FiMail /> {shippingInfo.emailForOrders}</div>
            </div>
            <div className={styles.mobileTiming}>
              <FiClock /> Mon-Sat: 10 AM - 7 PM
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
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Link to="/">Home</Link>
          <span>/</span>
          <span className={styles.current}>Shipping Policy</span>
        </div>

        <div className={styles.pageHeader}>
          <FiTruck className={styles.pageIcon} />
          <h1>Shipping Policy</h1>
          <p>Learn about our shipping and delivery process</p>
        </div>

        <div className={styles.contentGrid}>
          {/* Left Column - Main Info */}
          <div className={styles.mainContent}>
            <div className={styles.infoCard}>
              <h2>📦 Order Processing</h2>
              <p>Orders are processed within <strong>{shippingInfo.processingTime}</strong> after order confirmation and payment of 50% advance amount.</p>
              
              <h3>Order Confirmation Process:</h3>
              <ul className={styles.processList}>
                <li>✅ Order placed online</li>
                <li>📞 Our team calls to confirm order details</li>
                <li>💰 50% advance payment required to confirm order</li>
                <li>🚚 Product shipped after payment confirmation</li>
                <li>💵 Remaining 50% payable on delivery</li>
              </ul>
            </div>

            <div className={styles.infoCard}>
              <h2>🚚 Delivery Timeline</h2>
              <p>Estimated delivery time: <strong>{shippingInfo.deliveryTime}</strong> after shipping.</p>
              <div className={styles.timeline}>
                <div className={styles.timelineStep}>
                  <div className={styles.timelineDot}></div>
                  <div>Order Confirmed</div>
                </div>
                <div className={styles.timelineLine}></div>
                <div className={styles.timelineStep}>
                  <div className={styles.timelineDot}></div>
                  <div>Processing (1-2 days)</div>
                </div>
                <div className={styles.timelineLine}></div>
                <div className={styles.timelineStep}>
                  <div className={styles.timelineDot}></div>
                  <div>Shipped</div>
                </div>
                <div className={styles.timelineLine}></div>
                <div className={styles.timelineStep}>
                  <div className={styles.timelineDot}></div>
                  <div>In Transit (3-7 days)</div>
                </div>
                <div className={styles.timelineLine}></div>
                <div className={styles.timelineStep}>
                  <div className={styles.timelineDot}></div>
                  <div>Delivered</div>
                </div>
              </div>
            </div>

            <div className={styles.infoCard}>
              <h2>💰 Payment Terms</h2>
              <div className={styles.paymentBox}>
                <div className={styles.paymentHalf}>
                  <span className={styles.paymentPercent}>50%</span>
                  <strong>Advance Payment</strong>
                  <p>Required to confirm your order</p>
                  <small>UPI / Bank Transfer / GPay</small>
                </div>
                <div className={styles.paymentArrow}>→</div>
                <div className={styles.paymentHalf}>
                  <span className={styles.paymentPercent}>50%</span>
                  <strong>On Delivery</strong>
                  <p>Cash / Card / UPI</p>
                  <small>Pay when you receive</small>
                </div>
              </div>
              <p className={styles.paymentNote}>* Our team will call you to share payment details for advance amount.</p>
            </div>

            <div className={styles.infoCard}>
              <h2>📍 Shipping Zones & Charges</h2>
              <div className={styles.zonesTable}>
                <div className={styles.zonesHeader}>
                  <span>Region</span>
                  <span>Delivery Time</span>
                  <span>Charges</span>
                </div>
                {shippingZones.map((zone, idx) => (
                  <div key={idx} className={styles.zonesRow}>
                    <span>{zone.zone}</span>
                    <span>{zone.time}</span>
                    <span className={styles.freeShipping}>{zone.cost}</span>
                  </div>
                ))}
              </div>
              <p className={styles.shippingNote}>* Free shipping on all orders above ₹{shippingInfo.freeShippingThreshold}</p>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className={styles.sidebar}>
            <div className={styles.sidebarCard}>
              <h3>📞 Order Confirmation</h3>
              <p>After placing your order, our team will call you within 24 hours to confirm and share payment details.</p>
              <hr />
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
            </div>

            <div className={styles.sidebarCard}>
              <h3>✅ Cash on Delivery</h3>
              <p>COD available across India with zero extra charges.</p>
              <div className={styles.codInfo}>
                <FiCheckCircle />
                <span>No extra COD fees</span>
              </div>
              <div className={styles.codInfo}>
                <FiCheckCircle />
                <span>Pay 50% advance, 50% on delivery</span>
              </div>
            </div>

            <div className={styles.sidebarCard}>
              <h3>⏰ Order Cut-off Time</h3>
              <p>Orders placed before 2 PM are processed the same day.</p>
              <div className={styles.cutoffTime}>
                <FiClock />
                <span>Cut-off: 2:00 PM IST</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingPolicy;