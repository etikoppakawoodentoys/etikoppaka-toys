import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { FiPackage, FiTruck, FiShield, FiClock, FiCheck, FiArrowRight, FiMail, FiPhone, FiMapPin, FiDollarSign, FiCalendar, FiUpload, FiX, FiMessageCircle, FiSend } from 'react-icons/fi';
import { FaWhatsapp, FaEnvelope, FaPhone, FaRupeeSign } from 'react-icons/fa';
import { sendBulkOrderNotification } from '../services/emailService';
import styles from './BulkOrderPage.module.css';

const BulkOrderPage = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState(null);
  const [bulkProducts, setBulkProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    company_name: '',
    gst_number: '',
    product_interest: '',
    quantity: '',
    quantity_unit: 'pieces',
    budget_range: '',
    expected_delivery_date: '',
    additional_requirements: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchBulkProducts();
  }, []);

  const fetchBulkProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_bulk_order', true)
      .limit(8);

    if (data && !error) {
      setBulkProducts(data);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setErrorMessage('');
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.full_name.trim()) newErrors.full_name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(formData.phone)) newErrors.phone = 'Enter 10 digit number';
    if (!formData.product_interest.trim()) newErrors.product_interest = 'Product interest is required';
    if (!formData.quantity) newErrors.quantity = 'Quantity is required';
    else if (parseInt(formData.quantity) < 50) newErrors.quantity = 'Minimum quantity is 50 pieces';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setErrorMessage('');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Prepare the data exactly matching the table columns
      const orderData = {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        company_name: formData.company_name || null,
        gst_number: formData.gst_number || null,
        product_interest: formData.product_interest,
        quantity: parseInt(formData.quantity),
        quantity_unit: formData.quantity_unit,
        budget_range: formData.budget_range || null,
        expected_delivery_date: formData.expected_delivery_date || null,
        additional_requirements: formData.additional_requirements || null,
        user_id: user?.id || null,
        status: 'pending'
      };

      console.log('Submitting bulk order:', orderData);

      const { data, error } = await supabase
        .from('bulk_orders')
        .insert([orderData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        setErrorMessage(error.message || 'Failed to submit. Please try again.');
        setLoading(false);
        return;
      }

      if (data) {
        console.log('Bulk order submitted:', data);
        setSubmittedOrder(data);
        setShowSuccess(true);
        
        // Reset form
        setFormData({
          full_name: '',
          email: '',
          phone: '',
          company_name: '',
          gst_number: '',
          product_interest: '',
          quantity: '',
          quantity_unit: 'pieces',
          budget_range: '',
          expected_delivery_date: '',
          additional_requirements: '',
        });
        
        // Send email notification (don't await, let it run in background)
        try {
          await sendBulkOrderNotification(data, {
            name: formData.full_name,
            email: formData.email,
            phone: formData.phone
          });
        } catch (emailError) {
          console.error('Email notification error:', emailError);
          // Don't show error to user, order was successful
        }
        
        // Auto hide success message after 5 seconds
        setTimeout(() => setShowSuccess(false), 5000);
      }
      
    } catch (err) {
      console.error('Submission error:', err);
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppInquiry = () => {
    const message = `Hi, I'm interested in bulk ordering products from your store. Please share more details about wholesale pricing.`;
    window.open(`https://wa.me/919876543210?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (isMobile) {
    return (
      <div className={styles.mobileBulkPage}>
        {/* Mobile Hero Section */}
        <div className={styles.mobileHero}>
          <div className={styles.mobileHeroIcon}>🎁</div>
          <h1>Bulk Orders</h1>
          <p>Get special wholesale pricing for bulk quantities</p>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className={styles.mobileErrorMessage}>
            ❌ {errorMessage}
          </div>
        )}

        {/* Success Toast */}
        {showSuccess && submittedOrder && (
          <div className={styles.mobileSuccessToast}>
            <FiCheck />
            <div>
              <strong>Request Submitted!</strong>
              <p>Order #{submittedOrder.order_number} - We'll contact you within 24 hours.</p>
            </div>
          </div>
        )}

        {/* Features */}
        <div className={styles.mobileFeatures}>
          <div className={styles.mobileFeatureCard}>
            <span>🎯</span>
            <div>
              <strong>Min. Order</strong>
              <span>50 pieces</span>
            </div>
          </div>
          <div className={styles.mobileFeatureCard}>
            <span>💰</span>
            <div>
              <strong>Discount</strong>
              <span>Up to 40% off</span>
            </div>
          </div>
          <div className={styles.mobileFeatureCard}>
            <span>🚚</span>
            <div>
              <strong>Shipping</strong>
              <span>Free above ₹25k</span>
            </div>
          </div>
          <div className={styles.mobileFeatureCard}>
            <span>⚡</span>
            <div>
              <strong>Delivery</strong>
              <span>15-20 days</span>
            </div>
          </div>
        </div>

        {/* Bulk Products */}
        {bulkProducts.length > 0 && (
          <div className={styles.mobileBulkProducts}>
            <h2>Popular for Bulk Orders</h2>
            <div className={styles.mobileProductGrid}>
              {bulkProducts.map(product => (
                <div key={product.id} className={styles.mobileProductCard}>
                  <img src={product.image_url || '/images/placeholder.jpg'} alt={product.name} />
                  <h3>{product.name}</h3>
                  <p className={styles.mobileBulkPrice}>From ₹{Math.floor(product.price * 0.7)}/piece</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inquiry Form */}
        <div className={styles.mobileFormSection}>
          <h2>Request a Quote</h2>
          <p>Fill the form and we'll get back to you within 24 hours</p>
          
          <form onSubmit={handleSubmit} className={styles.mobileForm}>
            <div className={styles.mobileFormGroup}>
              <input
                type="text"
                name="full_name"
                placeholder="Full Name *"
                value={formData.full_name}
                onChange={handleChange}
                className={errors.full_name ? styles.error : ''}
              />
              {errors.full_name && <span className={styles.errorMsg}>{errors.full_name}</span>}
            </div>

            <div className={styles.mobileFormGroup}>
              <input
                type="email"
                name="email"
                placeholder="Email Address *"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? styles.error : ''}
              />
              {errors.email && <span className={styles.errorMsg}>{errors.email}</span>}
            </div>

            <div className={styles.mobileFormGroup}>
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number *"
                value={formData.phone}
                onChange={handleChange}
                className={errors.phone ? styles.error : ''}
              />
              {errors.phone && <span className={styles.errorMsg}>{errors.phone}</span>}
            </div>

            <div className={styles.mobileFormRow}>
              <div className={styles.mobileFormGroup}>
                <input
                  type="text"
                  name="company_name"
                  placeholder="Company Name (Optional)"
                  value={formData.company_name}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.mobileFormGroup}>
                <input
                  type="text"
                  name="gst_number"
                  placeholder="GST Number (Optional)"
                  value={formData.gst_number}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className={styles.mobileFormGroup}>
              <input
                type="text"
                name="product_interest"
                placeholder="Product(s) you're interested in *"
                value={formData.product_interest}
                onChange={handleChange}
                className={errors.product_interest ? styles.error : ''}
              />
              {errors.product_interest && <span className={styles.errorMsg}>{errors.product_interest}</span>}
            </div>

            <div className={styles.mobileFormRow}>
              <div className={styles.mobileFormGroup}>
                <input
                  type="number"
                  name="quantity"
                  placeholder="Quantity *"
                  value={formData.quantity}
                  onChange={handleChange}
                  className={errors.quantity ? styles.error : ''}
                />
                {errors.quantity && <span className={styles.errorMsg}>{errors.quantity}</span>}
              </div>
              <div className={styles.mobileFormGroup}>
                <select name="quantity_unit" value={formData.quantity_unit} onChange={handleChange}>
                  <option value="pieces">Pieces</option>
                  <option value="pairs">Pairs</option>
                  <option value="sets">Sets</option>
                  <option value="dozens">Dozens</option>
                </select>
              </div>
            </div>

            <div className={styles.mobileFormRow}>
              <div className={styles.mobileFormGroup}>
                <select name="budget_range" value={formData.budget_range} onChange={handleChange}>
                  <option value="">Select Budget Range</option>
                  <option value="< ₹10,000">Less than ₹10,000</option>
                  <option value="₹10,000 - ₹25,000">₹10,000 - ₹25,000</option>
                  <option value="₹25,000 - ₹50,000">₹25,000 - ₹50,000</option>
                  <option value="₹50,000 - ₹1,00,000">₹50,000 - ₹1,00,000</option>
                  <option value="> ₹1,00,000">More than ₹1,00,000</option>
                </select>
              </div>
              <div className={styles.mobileFormGroup}>
                <input
                  type="date"
                  name="expected_delivery_date"
                  placeholder="Expected Delivery Date"
                  value={formData.expected_delivery_date}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className={styles.mobileFormGroup}>
              <textarea
                name="additional_requirements"
                placeholder="Additional requirements or specifications..."
                rows="4"
                value={formData.additional_requirements}
                onChange={handleChange}
              />
            </div>

            <button type="submit" className={styles.mobileSubmitBtn} disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Bulk Order Request'}
            </button>
          </form>
        </div>

        {/* WhatsApp CTA */}
        <div className={styles.mobileWhatsappCta}>
          <div className={styles.mobileWhatsappContent}>
            <p>Need help with your bulk order?</p>
            <button onClick={handleWhatsAppInquiry} className={styles.mobileWhatsappBtn}>
              <FaWhatsapp /> Chat on WhatsApp
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Desktop UI
  return (
    <div className={styles.desktopBulkPage}>
      {/* Hero Section */}
      <div className={styles.desktopHero}>
        <div className={styles.desktopHeroContent}>
          <div className={styles.desktopHeroBadge}>Wholesale Pricing</div>
          <h1>Bulk & Wholesale Orders</h1>
          <p>Get special discounts on bulk quantities. Perfect for businesses, events, and resellers.</p>
          <div className={styles.desktopHeroStats}>
            <div className={styles.heroStat}>
              <span>50+</span>
              <p>Minimum Order</p>
            </div>
            <div className={styles.heroStat}>
              <span>40%</span>
              <p>Discount Up To</p>
            </div>
            <div className={styles.heroStat}>
              <span>24h</span>
              <p>Response Time</p>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.desktopContainer}>
        {/* Error Message */}
        {errorMessage && (
          <div className={styles.errorMessageDesktop}>
            <span>❌</span> {errorMessage}
          </div>
        )}

        {/* Success Modal */}
        {showSuccess && submittedOrder && (
          <div className={styles.successModal}>
            <div className={styles.successModalContent}>
              <div className={styles.successIcon}>✅</div>
              <h3>Bulk Order Request Submitted!</h3>
              <p>Your request has been received. Our team will contact you within 24 hours.</p>
              <div className={styles.successDetails}>
                <p>Order Reference: <strong>{submittedOrder.order_number}</strong></p>
                <p>We've sent a confirmation to: <strong>{submittedOrder.email}</strong></p>
              </div>
              <button onClick={() => setShowSuccess(false)} className={styles.successCloseBtn}>Close</button>
            </div>
          </div>
        )}

        {/* Features Grid */}
        <div className={styles.desktopFeatures}>
          <div className={styles.feature}>
            <FiPackage className={styles.featureIcon} />
            <h3>Bulk Quantities</h3>
            <p>Minimum order of 50 pieces per design</p>
          </div>
          <div className={styles.feature}>
            <FaRupeeSign className={styles.featureIcon} />
            <h3>Best Prices</h3>
            <p>Get up to 40% discount on bulk orders</p>
          </div>
          <div className={styles.feature}>
            <FiTruck className={styles.featureIcon} />
            <h3>Free Shipping</h3>
            <p>On orders above ₹25,000</p>
          </div>
          <div className={styles.feature}>
            <FiShield className={styles.featureIcon} />
            <h3>Quality Guarantee</h3>
            <p>100% authentic handcrafted products</p>
          </div>
        </div>

        {/* Bulk Products Showcase */}
        {bulkProducts.length > 0 && (
          <div className={styles.desktopBulkProducts}>
            <div className={styles.sectionHeader}>
              <h2>Popular for Bulk Orders</h2>
              <p>Most requested products for wholesale</p>
            </div>
            <div className={styles.desktopProductGrid}>
              {bulkProducts.map(product => (
                <div key={product.id} className={styles.desktopProductCard}>
                  <img src={product.image_url || '/images/placeholder.jpg'} alt={product.name} />
                  <h3>{product.name}</h3>
                  <p className={styles.bulkPriceText}>Starting from ₹{Math.floor(product.price * 0.7)}/piece*</p>
                  <button 
                    onClick={() => {
                      setFormData(prev => ({ ...prev, product_interest: product.name }));
                      document.getElementById('quoteForm').scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={styles.productEnquireBtn}
                  >
                    Get Quote
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quote Form Section */}
        <div id="quoteForm" className={styles.desktopFormSection}>
          <div className={styles.formContainer}>
            <div className={styles.formInfo}>
              <h2>Request a Quote</h2>
              <p>Fill out the form and our team will get back to you within 24 hours with a custom quote.</p>
              <div className={styles.formInfoList}>
                <div><FiCheck /> Custom pricing for bulk orders</div>
                <div><FiCheck /> Free sample inspection available</div>
                <div><FiCheck /> Pan India shipping</div>
                <div><FiCheck /> GST invoice provided</div>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className={styles.desktopForm}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <input
                    type="text"
                    name="full_name"
                    placeholder="Full Name *"
                    value={formData.full_name}
                    onChange={handleChange}
                    className={errors.full_name ? styles.error : ''}
                  />
                  {errors.full_name && <span className={styles.errorMsg}>{errors.full_name}</span>}
                </div>
                <div className={styles.formGroup}>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address *"
                    value={formData.email}
                    onChange={handleChange}
                    className={errors.email ? styles.error : ''}
                  />
                  {errors.email && <span className={styles.errorMsg}>{errors.email}</span>}
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone Number *"
                    value={formData.phone}
                    onChange={handleChange}
                    className={errors.phone ? styles.error : ''}
                  />
                  {errors.phone && <span className={styles.errorMsg}>{errors.phone}</span>}
                </div>
                <div className={styles.formGroup}>
                  <input
                    type="text"
                    name="company_name"
                    placeholder="Company Name (Optional)"
                    value={formData.company_name}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <input
                    type="text"
                    name="gst_number"
                    placeholder="GST Number (Optional)"
                    value={formData.gst_number}
                    onChange={handleChange}
                  />
                </div>
                <div className={styles.formGroup}>
                  <input
                    type="text"
                    name="product_interest"
                    placeholder="Product(s) you're interested in *"
                    value={formData.product_interest}
                    onChange={handleChange}
                    className={errors.product_interest ? styles.error : ''}
                  />
                  {errors.product_interest && <span className={styles.errorMsg}>{errors.product_interest}</span>}
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <input
                    type="number"
                    name="quantity"
                    placeholder="Quantity *"
                    value={formData.quantity}
                    onChange={handleChange}
                    className={errors.quantity ? styles.error : ''}
                  />
                  {errors.quantity && <span className={styles.errorMsg}>{errors.quantity}</span>}
                </div>
                <div className={styles.formGroup}>
                  <select name="quantity_unit" value={formData.quantity_unit} onChange={handleChange}>
                    <option value="pieces">Pieces</option>
                    <option value="pairs">Pairs</option>
                    <option value="sets">Sets</option>
                    <option value="dozens">Dozens</option>
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <select name="budget_range" value={formData.budget_range} onChange={handleChange}>
                    <option value="">Select Budget Range</option>
                    <option value="< ₹10,000">Less than ₹10,000</option>
                    <option value="₹10,000 - ₹25,000">₹10,000 - ₹25,000</option>
                    <option value="₹25,000 - ₹50,000">₹25,000 - ₹50,000</option>
                    <option value="₹50,000 - ₹1,00,000">₹50,000 - ₹1,00,000</option>
                    <option value="> ₹1,00,000">More than ₹1,00,000</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <input
                    type="date"
                    name="expected_delivery_date"
                    placeholder="Expected Delivery Date"
                    value={formData.expected_delivery_date}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <textarea
                  name="additional_requirements"
                  placeholder="Additional requirements or specifications (size, color, design preferences)..."
                  rows="4"
                  value={formData.additional_requirements}
                  onChange={handleChange}
                />
              </div>

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? 'Submitting Request...' : 'Submit Bulk Order Request'}
              </button>
            </form>
          </div>
        </div>

        {/* WhatsApp Section */}
        <div className={styles.desktopWhatsappSection}>
          <div className={styles.whatsappContent}>
            <div>
              <h3>Quick Inquiry?</h3>
              <p>Chat with our wholesale team directly on WhatsApp</p>
            </div>
            <button onClick={handleWhatsAppInquiry} className={styles.whatsappBtn}>
              <FaWhatsapp /> Message on WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkOrderPage;