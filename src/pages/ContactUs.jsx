import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { 
  FiMapPin, 
  FiPhone, 
  FiMail, 
  FiClock, 
  FiSend, 
  FiCheckCircle, 
  FiAlertCircle,
  FiMessageSquare,
  FiArrowLeft,
  FiFacebook,
  FiInstagram,
  FiTwitter,
  FiYoutube,
  FiUser,
  FiEdit2,
  FiAtSign
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { sendEmailNotification } from '../services/emailService';
import styles from './ContactUs.module.css';

const ContactUs = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.full_name.trim()) newErrors.full_name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email address';
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Enter valid 10 digit number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setErrorMessage('');

    try {
      const { error } = await supabase
        .from('contact_us')
        .insert({
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone || null,
          subject: formData.subject,
          message: formData.message,
          status: 'pending'
        });

      if (error) throw error;

      // Send email notification to admin
      await sendEmailNotification('contact_us_admin', 'etikoppakawoodentoys@gmail.com', {
        customerName: formData.full_name,
        customerEmail: formData.email,
        customerPhone: formData.phone || 'Not provided',
        subject: formData.subject,
        message: formData.message
      });

      // Send auto-reply to customer
      await sendEmailNotification('contact_us_customer', formData.email, {
        customerName: formData.full_name
      });

      setSuccess(true);
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
      
      setTimeout(() => setSuccess(false), 5000);
      
    } catch (error) {
      console.error('Contact form error:', error);
      setErrorMessage('Failed to send message. Please try again.');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = {
    address: 'Etikoppaka Village, Visakhapatnam District, Andhra Pradesh - 531082',
    phone: '+91 9154884214',
    email: 'orders@etikoppakatoys.store',
    supportEmail: 'support@etikoppakatoys.store',
    whatsapp: '+91 9154884214',
    hours: 'Monday - Saturday: 10:00 AM - 7:00 PM',
    sunday: 'Sunday: Closed (Online orders accepted)'
  };

  // Desktop UI
  if (!isMobile) {
    return (
      <div className={styles.contactPage}>
        <div className={styles.container}>
          <div className={styles.breadcrumb}>
            <Link to="/">Home</Link>
            <span>/</span>
            <span className={styles.current}>Contact Us</span>
          </div>

          <div className={styles.twoColumnLayout}>
            {/* Left Column - Contact Info */}
            <div className={styles.leftColumn}>
              <div className={styles.infoCard}>
                <div className={styles.sectionBadge}>Get in Touch</div>
                <h1 className={styles.sectionTitle}>We'd Love to<br />Hear From You</h1>
                <p className={styles.sectionDesc}>
                  Have questions about our products? Need help with an order? 
                  Our support team is here to assist you.
                </p>

                <div className={styles.contactDetails}>
                  <div className={styles.contactItem}>
                    <div className={styles.contactIcon}>
                      <FiMapPin />
                    </div>
                    <div>
                      <h4>Visit Our Workshop</h4>
                      <p>{contactInfo.address}</p>
                    </div>
                  </div>

                  <div className={styles.contactItem}>
                    <div className={styles.contactIcon}>
                      <FiPhone />
                    </div>
                    <div>
                      <h4>Call Us</h4>
                      <p>{contactInfo.phone}</p>
                      <span>Mon-Sat, 10 AM - 7 PM</span>
                    </div>
                  </div>

                  <div className={styles.contactItem}>
                    <div className={styles.contactIcon}>
                      <FiMail />
                    </div>
                    <div>
                      <h4>Email Us</h4>
                      <p>{contactInfo.email}</p>
                      <span>We reply within 24 hours</span>
                    </div>
                  </div>

                  <div className={styles.contactItem}>
                    <div className={styles.contactIcon}>
                      <FaWhatsapp />
                    </div>
                    <div>
                      <h4>WhatsApp</h4>
                      <p>Quick responses on WhatsApp</p>
                      <a href={`https://wa.me/${contactInfo.whatsapp.replace(/[^0-9]/g, '')}`}>Chat Now →</a>
                    </div>
                  </div>
                </div>

                <div className={styles.socialConnect}>
                  <h4>Connect With Us</h4>
                  <div className={styles.socialIcons}>
                   
                    <a href="https://www.instagram.com/etikoppaka_wooden_toys?igsh=eG1pb2R0aWZuMncw" className={styles.socialIcon}><FiInstagram /></a>
                 
                    <a href="https://www.youtube.com/@etikoppakawoodentoy" className={styles.socialIcon}><FiYoutube /></a>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Contact Form */}
            <div className={styles.rightColumn}>
              {success && (
                <div className={styles.alertSuccess}>
                  <FiCheckCircle />
                  <div>
                    <strong>Message Sent Successfully!</strong>
                    <p>Thank you for contacting us. We'll get back to you within 24 hours.</p>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className={styles.alertError}>
                  <FiAlertCircle />
                  <div>
                    <strong>Something went wrong!</strong>
                    <p>{errorMessage}</p>
                  </div>
                </div>
              )}

              <div className={styles.formCard}>
                <h2>Send us a Message</h2>
                <p>Fill out the form and we'll get back to you as soon as possible.</p>

                <form onSubmit={handleSubmit} className={styles.form}>
                  <div className={styles.formRow}>
                    <div className={styles.inputGroup}>
                      <label>Full Name <span>*</span></label>
                      <div className={styles.inputWrapper}>
                        <FiUser className={styles.inputIcon} />
                        <input
                          type="text"
                          name="full_name"
                          placeholder="Enter your full name"
                          value={formData.full_name}
                          onChange={handleChange}
                          className={errors.full_name ? styles.errorInput : ''}
                        />
                      </div>
                      {errors.full_name && <span className={styles.errorText}>{errors.full_name}</span>}
                    </div>

                    <div className={styles.inputGroup}>
                      <label>Email Address <span>*</span></label>
                      <div className={styles.inputWrapper}>
                        <FiAtSign className={styles.inputIcon} />
                        <input
                          type="email"
                          name="email"
                          placeholder="your@email.com"
                          value={formData.email}
                          onChange={handleChange}
                          className={errors.email ? styles.errorInput : ''}
                        />
                      </div>
                      {errors.email && <span className={styles.errorText}>{errors.email}</span>}
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.inputGroup}>
                      <label>Phone Number (Optional)</label>
                      <div className={styles.inputWrapper}>
                        <FiPhone className={styles.inputIcon} />
                        <input
                          type="tel"
                          name="phone"
                          placeholder="10 digit mobile number"
                          value={formData.phone}
                          onChange={handleChange}
                          className={errors.phone ? styles.errorInput : ''}
                        />
                      </div>
                      {errors.phone && <span className={styles.errorText}>{errors.phone}</span>}
                    </div>

                    <div className={styles.inputGroup}>
                      <label>Subject <span>*</span></label>
                      <div className={styles.inputWrapper}>
                        <FiEdit2 className={styles.inputIcon} />
                        <input
                          type="text"
                          name="subject"
                          placeholder="What is this regarding?"
                          value={formData.subject}
                          onChange={handleChange}
                          className={errors.subject ? styles.errorInput : ''}
                        />
                      </div>
                      {errors.subject && <span className={styles.errorText}>{errors.subject}</span>}
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Message <span>*</span></label>
                    <div className={styles.textareaWrapper}>
                      <FiMessageSquare className={styles.textareaIcon} />
                      <textarea
                        name="message"
                        rows="5"
                        placeholder="Please describe your query in detail..."
                        value={formData.message}
                        onChange={handleChange}
                        className={errors.message ? styles.errorInput : ''}
                      />
                    </div>
                    {errors.message && <span className={styles.errorText}>{errors.message}</span>}
                  </div>

                  <button type="submit" className={styles.submitButton} disabled={loading}>
                    {loading ? 'Sending...' : <><FiSend /> Send Message</>}
                  </button>
                </form>

                <div className={styles.responseNote}>
                  <FiClock />
                  <span>We typically respond within 24 hours on business days.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mobile UI
  return (
    <div className={styles.mobileContactPage}>
      <div className={styles.mobileHeader}>
        <Link to="/" className={styles.mobileBackBtn}>
          <FiArrowLeft />
        </Link>
        <h1>Contact Us</h1>
        <div className={styles.mobilePlaceholder}></div>
      </div>

      {success && (
        <div className={styles.mobileAlertSuccess}>
          <FiCheckCircle />
          <div>
            <strong>Message Sent!</strong>
            <p>We'll get back to you soon.</p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className={styles.mobileAlertError}>
          <FiAlertCircle />
          <div>
            <strong>Failed!</strong>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      <div className={styles.mobileContactInfo}>
        <div className={styles.mobileInfoItem}>
          <div className={styles.mobileInfoIcon}>
            <FiMapPin />
          </div>
          <div>
            <h4>Address</h4>
            <p>{contactInfo.address}</p>
          </div>
        </div>

        <div className={styles.mobileInfoItem}>
          <div className={styles.mobileInfoIcon}>
            <FiPhone />
          </div>
          <div>
            <h4>Phone</h4>
            <a href={`tel:${contactInfo.phone}`}>{contactInfo.phone}</a>
          </div>
        </div>

        <div className={styles.mobileInfoItem}>
          <div className={styles.mobileInfoIcon}>
            <FiMail />
          </div>
          <div>
            <h4>Email</h4>
            <a href={`mailto:${contactInfo.email}`}>{contactInfo.email}</a>
          </div>
        </div>

        <div className={styles.mobileInfoItem}>
          <div className={styles.mobileInfoIcon}>
            <FiClock />
          </div>
          <div>
            <h4>Hours</h4>
            <p>{contactInfo.hours}</p>
            <small>{contactInfo.sunday}</small>
          </div>
        </div>
      </div>

      <div className={styles.mobileFormCard}>
        <h2>Send Message</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.mobileInputGroup}>
            <input
              type="text"
              name="full_name"
              placeholder="Full Name *"
              value={formData.full_name}
              onChange={handleChange}
              className={errors.full_name ? styles.errorInput : ''}
            />
            {errors.full_name && <span className={styles.errorText}>{errors.full_name}</span>}
          </div>

          <div className={styles.mobileInputGroup}>
            <input
              type="email"
              name="email"
              placeholder="Email Address *"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? styles.errorInput : ''}
            />
            {errors.email && <span className={styles.errorText}>{errors.email}</span>}
          </div>

          <div className={styles.mobileInputGroup}>
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number (Optional)"
              value={formData.phone}
              onChange={handleChange}
              className={errors.phone ? styles.errorInput : ''}
            />
            {errors.phone && <span className={styles.errorText}>{errors.phone}</span>}
          </div>

          <div className={styles.mobileInputGroup}>
            <input
              type="text"
              name="subject"
              placeholder="Subject *"
              value={formData.subject}
              onChange={handleChange}
              className={errors.subject ? styles.errorInput : ''}
            />
            {errors.subject && <span className={styles.errorText}>{errors.subject}</span>}
          </div>

          <div className={styles.mobileInputGroup}>
            <textarea
              name="message"
              rows="5"
              placeholder="Message *"
              value={formData.message}
              onChange={handleChange}
              className={errors.message ? styles.errorInput : ''}
            />
            {errors.message && <span className={styles.errorText}>{errors.message}</span>}
          </div>

          <button type="submit" className={styles.mobileSubmitBtn} disabled={loading}>
            {loading ? 'Sending...' : <><FiSend /> Send Message</>}
          </button>
        </form>
      </div>

      <div className={styles.mobileSocial}>
        
        <a href="https://www.instagram.com/etikoppaka_wooden_toys?igsh=eG1pb2R0aWZuMncw" className={styles.mobileSocialIcon}><FiInstagram /></a>
       
        <a href="https://www.youtube.com/@EtikoppakaToys" className={styles.mobileSocialIcon}><FiYoutube /></a>
        <a href={`https://wa.me/${contactInfo.whatsapp.replace(/[^0-9]/g, '')}`} className={styles.mobileSocialIcon}>💬</a>
      </div>
    </div>
  );
};

export default ContactUs;