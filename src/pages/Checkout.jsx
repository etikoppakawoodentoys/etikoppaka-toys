import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { sendOrderConfirmation, sendAdminNotification } from '../services/emailService';
import { loadRazorpayScript, createRazorpayOrder, openRazorpayCheckout } from '../services/razorpayService';
import { savePaymentDetails } from '../services/paymentService';
import { 
  FiMapPin, 
  FiPlus, 
  FiCheck, 
  FiTruck, 
  FiShield, 
  FiClock, 
  FiDollarSign,
  FiHome,
  FiEdit2,
  FiTrash2,
  FiArrowLeft,
  FiChevronRight,
  FiPackage,
  FiCreditCard,
  FiSmartphone
} from 'react-icons/fi';
import styles from './Checkout.module.css';

const Checkout = () => {
  const [cartItems, setCartItems] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [message, setMessage] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Load Razorpay script
    loadRazorpayScript().then(loaded => {
      setRazorpayLoaded(loaded);
      if (!loaded) {
        console.error('Failed to load Razorpay script');
      }
    });
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError) throw profileError;

      if (profile) {
        setUserProfile(profile);
        let addresses = [];
        if (profile.saved_addresses) {
          if (typeof profile.saved_addresses === 'string') {
            try {
              addresses = JSON.parse(profile.saved_addresses);
            } catch(e) {
              addresses = [];
            }
          } else if (Array.isArray(profile.saved_addresses)) {
            addresses = profile.saved_addresses;
          }
        }
        setSavedAddresses(addresses);
        
        const defaultAddr = addresses.find(addr => addr.isDefault);
        if (defaultAddr) {
          setSelectedAddress(defaultAddr);
        }
      }

      const { data: cart, error: cartError } = await supabase
        .from('cart_items')
        .select(`
          *,
          products (*)
        `)
        .eq('user_id', user.id);

      if (cartError) throw cartError;

      if (cart && cart.length > 0) {
        setCartItems(cart);
      } else {
        navigate('/cart');
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item.products?.price || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item.products?.price || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  const handleSelectAddress = (address) => {
    setSelectedAddress(address);
    setShowNewAddress(false);
    setEditingAddress(null);
  };

  const handleEditAddress = (address, index) => {
    setNewAddressForm({
      name: address.name || '',
      mobile: address.mobile || '',
      doorNo: address.doorNo || '',
      street: address.street || '',
      city: address.city || '',
      state: address.state || 'Andhra Pradesh',
      pincode: address.pincode || '',
      landmark: address.landmark || '',
      isDefault: address.isDefault || false
    });
    setEditingAddress(index);
    setShowNewAddress(true);
  };

  const handleDeleteAddress = async (index) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      const updatedAddresses = savedAddresses.filter((_, i) => i !== index);
      setSavedAddresses(updatedAddresses);
      
      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from('users')
        .update({ saved_addresses: JSON.stringify(updatedAddresses) })
        .eq('id', user.id);
      
      if (selectedAddress === savedAddresses[index]) {
        setSelectedAddress(null);
      }
      
      setMessage({ type: 'success', text: 'Address deleted!' });
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const [newAddressForm, setNewAddressForm] = useState({
    name: '',
    mobile: '',
    doorNo: '',
    street: '',
    city: '',
    state: 'Andhra Pradesh',
    pincode: '',
    landmark: '',
    isDefault: false
  });

  const handleSaveAddress = async () => {
    if (!newAddressForm.name || !newAddressForm.mobile || !newAddressForm.doorNo || 
        !newAddressForm.street || !newAddressForm.city || !newAddressForm.pincode) {
      setMessage({ type: 'error', text: 'Please fill all required fields' });
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const formattedAddress = {
      id: editingAddress !== null ? savedAddresses[editingAddress]?.id : Date.now(),
      name: newAddressForm.name,
      mobile: newAddressForm.mobile,
      doorNo: newAddressForm.doorNo,
      street: newAddressForm.street,
      city: newAddressForm.city,
      state: newAddressForm.state,
      pincode: newAddressForm.pincode,
      landmark: newAddressForm.landmark,
      isDefault: newAddressForm.isDefault,
      fullAddress: `${newAddressForm.doorNo}, ${newAddressForm.street}${newAddressForm.landmark ? ', ' + newAddressForm.landmark : ''}, ${newAddressForm.city}, ${newAddressForm.state}, ${newAddressForm.pincode}`
    };

    let updatedAddresses = [...savedAddresses];
    
    if (newAddressForm.isDefault) {
      updatedAddresses = updatedAddresses.map(addr => ({ ...addr, isDefault: false }));
    }
    
    if (editingAddress !== null) {
      updatedAddresses[editingAddress] = formattedAddress;
    } else {
      updatedAddresses.push(formattedAddress);
    }
    
    setSavedAddresses(updatedAddresses);
    
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from('users')
      .update({ saved_addresses: JSON.stringify(updatedAddresses) })
      .eq('id', user.id);
    
    if (formattedAddress.isDefault) {
      setSelectedAddress(formattedAddress);
    }
    
    setShowNewAddress(false);
    setEditingAddress(null);
    setNewAddressForm({
      name: '',
      mobile: '',
      doorNo: '',
      street: '',
      city: '',
      state: 'Andhra Pradesh',
      pincode: '',
      landmark: '',
      isDefault: false
    });
    
    setMessage({ type: 'success', text: editingAddress !== null ? 'Address updated!' : 'Address added!' });
    setTimeout(() => setMessage(''), 3000);
  };

  // FIXED: processRazorpayPayment function with correct options
  const processRazorpayPayment = async (order, totalAmount) => {
  try {
    console.log('Creating Razorpay order for amount:', totalAmount);
    
    const razorpayOrder = await createRazorpayOrder(totalAmount, order.order_number);
    
    console.log('Razorpay order created:', razorpayOrder);
    
    const options = {
      key: 'rzp_test_SnBlDP2IEuNUzl',
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      name: 'Etikoppaka Toys',
      description: `Order #${order.order_number}`,
      image: '/logo1.png',
      order_id: razorpayOrder.id,
      prefill: {
        name: userProfile?.name || '',
        email: userProfile?.email || '',
        contact: userProfile?.mobile || '',
      },
      notes: {
        address: selectedAddress?.fullAddress || 'Address provided',
        order_id: order.id,
      },
      theme: {
        color: '#1F5B3A',
      },
      modal: {
        ondismiss: () => {
          console.log('Payment modal closed');
          setSubmitting(false);
          setMessage({ type: 'error', text: 'Payment cancelled' });
          setTimeout(() => setMessage(''), 3000);
        },
      },
    };
    
    // This will open the Razorpay checkout popup
    openRazorpayCheckout(options);
    
  } catch (error) {
    console.error('Razorpay error:', error);
    setMessage({ type: 'error', text: error.message || 'Failed to initialize payment. Please try again.' });
    setTimeout(() => setMessage(''), 3000);
    setSubmitting(false);
  }
};
  const handleSuccessfulPayment = async (order, paymentResponse) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Update order with payment details
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_signature: paymentResponse.razorpay_signature,
        payment_status: 'paid',
      })
      .eq('id', order.id);
    
    if (updateError) throw updateError;
    
    // Clear cart
    await supabase.from('cart_items').delete().eq('user_id', user.id);
    
    // Send email notifications (optional)
    const orderDetails = {
      order_number: order.order_number,
      total_amount: order.total_amount,
      created_at: order.created_at,
      shipping_address: order.shipping_address,
      items: order.order_items
    };
    
    await sendOrderConfirmation(orderDetails, user.email, userProfile?.name || 'Customer');
    await sendAdminNotification(orderDetails, {
      name: userProfile?.name || 'Customer',
      email: user.email,
      mobile: userProfile?.mobile || 'Not provided'
    });
    
    navigate('/orders', { 
      state: { 
        orderSuccess: true, 
        orderNumber: order.order_number, 
        paymentSuccess: true,
        paymentId: paymentResponse.razorpay_payment_id
      } 
    });
    
  } catch (error) {
    console.error('Error updating order after payment:', error);
    setMessage({ type: 'error', text: 'Payment successful but order update failed. Please contact support.' });
    setTimeout(() => setMessage(''), 5000);
    setSubmitting(false);
  }
};

  const handlePlaceOrder = async () => {
  if (!selectedAddress) {
    setMessage({ type: 'error', text: 'Please select a shipping address' });
    return;
  }

  setSubmitting(true);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }

    const totalAmount = calculateTotal();
    
    // Get formatted address
    const fullAddress = selectedAddress.fullAddress || 
      `${selectedAddress.doorNo}, ${selectedAddress.street}, ${selectedAddress.city} - ${selectedAddress.pincode}`;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        total_amount: totalAmount,
        shipping_address: fullAddress,
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'COD' ? 'pending' : 'initiated',
        status: 'pending',
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Add order items
    const orderItems = cartItems.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.products.name,
      quantity: item.quantity,
      price: item.products.price,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    if (paymentMethod === 'COD') {
      // Clear cart and redirect for COD
      await supabase.from('cart_items').delete().eq('user_id', user.id);
      navigate('/orders', { state: { orderSuccess: true, orderNumber: order.order_number } });
    } else {
      // Process Razorpay payment
      const razorpayOrder = await createRazorpayOrder(totalAmount, order.order_number);
      
      const options = {
        key: 'rzp_test_SnBlDP2IEuNUzl',
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'Etikoppaka Toys',
        description: `Order #${order.order_number}`,
        order_id: razorpayOrder.id,
        prefill: {
          name: userProfile?.name || '',
          email: userProfile?.email || '',
          contact: userProfile?.mobile || '',
        },
        theme: { color: '#1F5B3A' },
        handler: async (response) => {
          // Payment success - update order
          await supabase
            .from('orders')
            .update({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              payment_status: 'paid',
            })
            .eq('id', order.id);
          
          // Clear cart
          await supabase.from('cart_items').delete().eq('user_id', user.id);
          
          // Redirect to orders
          navigate('/orders', { 
            state: { 
              orderSuccess: true, 
              orderNumber: order.order_number,
              paymentSuccess: true 
            } 
          });
        },
        modal: {
          ondismiss: () => {
            setSubmitting(false);
            setMessage({ type: 'error', text: 'Payment cancelled' });
          }
        }
      };
      
      const rzp = new window.Razorpay(options);
      rzp.open();
    }
    
  } catch (error) {
    console.error('Error:', error);
    setMessage({ type: 'error', text: error.message || 'Failed to place order' });
    setSubmitting(false);
  }
};

  const getProductImage = (product) => {
    if (product.images) {
      try {
        const images = JSON.parse(product.images);
        if (images && images.length > 0) return images[0];
      } catch(e) {}
    }
    return product.image_url || '/images/placeholder.jpg';
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading checkout...</p>
      </div>
    );
  }

  // ============================================
  // MOBILE CHECKOUT UI with Razorpay
  // ============================================
  if (isMobile) {
    return (
      <div className={styles.mobileCheckout}>
        <div className={styles.mobileHeader}>
          <button onClick={() => navigate('/cart')} className={styles.mobileBackBtn}>
            <FiArrowLeft />
          </button>
          <h1>Checkout</h1>
          <div className={styles.mobilePlaceholder}></div>
        </div>

        <div className={styles.mobileScrollContent}>
          {/* Address Section */}
          <div className={styles.mobileSection}>
            <div className={styles.mobileSectionHeader}>
              <FiMapPin />
              <h2>Delivery Address</h2>
            </div>
            
            {savedAddresses.length > 0 && !showNewAddress && (
              <div className={styles.mobileAddressList}>
                {savedAddresses.map((address, index) => (
                  <div 
                    key={address.id || index}
                    className={`${styles.mobileAddressCard} ${selectedAddress?.id === address.id ? styles.selected : ''}`}
                    onClick={() => handleSelectAddress(address)}
                  >
                    <div className={styles.mobileAddressRadio}>
                      {selectedAddress?.id === address.id && <FiCheck />}
                    </div>
                    <div className={styles.mobileAddressDetails}>
                      <p className={styles.mobileAddressName}>{address.name}</p>
                      <p className={styles.mobileAddressPhone}>📞 {address.mobile}</p>
                      <p className={styles.mobileAddressText}>{address.doorNo}, {address.street}</p>
                      {address.landmark && <p className={styles.mobileAddressLandmark}>📍 {address.landmark}</p>}
                      <p className={styles.mobileAddressLocation}>{address.city}, {address.state} - {address.pincode}</p>
                    </div>
                    <div className={styles.mobileAddressActions}>
                      <button onClick={(e) => { e.stopPropagation(); handleEditAddress(address, index); }} className={styles.mobileEditAddress}>
                        <FiEdit2 />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteAddress(index); }} className={styles.mobileDeleteAddress}>
                        <FiTrash2 />
                      </button>
                    </div>
                    {address.isDefault && <span className={styles.mobileDefaultBadge}>Default</span>}
                  </div>
                ))}
              </div>
            )}

            <button 
              className={styles.mobileAddAddressBtn}
              onClick={() => {
                setShowNewAddress(!showNewAddress);
                setEditingAddress(null);
                setNewAddressForm({
                  name: userProfile?.name || '',
                  mobile: userProfile?.mobile || '',
                  doorNo: '',
                  street: '',
                  city: '',
                  state: 'Andhra Pradesh',
                  pincode: '',
                  landmark: '',
                  isDefault: savedAddresses.length === 0
                });
              }}
            >
              <FiPlus /> {showNewAddress ? 'Cancel' : 'Add New Address'}
            </button>

            {showNewAddress && (
              <div className={styles.mobileNewAddressForm}>
                <h3>{editingAddress !== null ? 'Edit Address' : 'New Address'}</h3>
                <input type="text" placeholder="Full Name *" value={newAddressForm.name} onChange={(e) => setNewAddressForm({ ...newAddressForm, name: e.target.value })} />
                <input type="tel" placeholder="Mobile Number *" value={newAddressForm.mobile} onChange={(e) => setNewAddressForm({ ...newAddressForm, mobile: e.target.value })} />
                <input type="text" placeholder="Door/House No *" value={newAddressForm.doorNo} onChange={(e) => setNewAddressForm({ ...newAddressForm, doorNo: e.target.value })} />
                <input type="text" placeholder="Street Address *" value={newAddressForm.street} onChange={(e) => setNewAddressForm({ ...newAddressForm, street: e.target.value })} />
                <input type="text" placeholder="Landmark" value={newAddressForm.landmark} onChange={(e) => setNewAddressForm({ ...newAddressForm, landmark: e.target.value })} />
                <input type="text" placeholder="City *" value={newAddressForm.city} onChange={(e) => setNewAddressForm({ ...newAddressForm, city: e.target.value })} />
                <select value={newAddressForm.state} onChange={(e) => setNewAddressForm({ ...newAddressForm, state: e.target.value })}>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Telangana">Telangana</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Kerala">Kerala</option>
                </select>
                <input type="text" placeholder="PIN Code *" value={newAddressForm.pincode} onChange={(e) => setNewAddressForm({ ...newAddressForm, pincode: e.target.value })} maxLength="6" />
                <label className={styles.mobileCheckbox}>
                  <input type="checkbox" checked={newAddressForm.isDefault} onChange={(e) => setNewAddressForm({ ...newAddressForm, isDefault: e.target.checked })} />
                  Set as default address
                </label>
                <button onClick={handleSaveAddress} className={styles.mobileSaveAddressBtn}>
                  {editingAddress !== null ? 'Update Address' : 'Save Address'}
                </button>
              </div>
            )}
          </div>

          {/* Payment Method Selection - Mobile */}
          <div className={styles.mobileSection}>
            <div className={styles.mobileSectionHeader}>
              <FiCreditCard />
              <h2>Payment Method</h2>
            </div>
            <div className={styles.mobilePaymentOptions}>
              <div 
                className={`${styles.mobilePaymentOption} ${paymentMethod === 'COD' ? styles.selected : ''}`}
                onClick={() => setPaymentMethod('COD')}
              >
                <div className={styles.mobilePaymentIcon}>💰</div>
                <div className={styles.mobilePaymentInfo}>
                  <strong>Cash on Delivery</strong>
                  <p>Pay when you receive your order</p>
                </div>
                {paymentMethod === 'COD' && <FiCheck className={styles.mobilePaymentCheck} />}
              </div>
              <div 
                className={`${styles.mobilePaymentOption} ${paymentMethod === 'RAZORPAY' ? styles.selected : ''}`}
                onClick={() => setPaymentMethod('RAZORPAY')}
              >
                <div className={styles.mobilePaymentIcon}>💳</div>
                <div className={styles.mobilePaymentInfo}>
                  <strong>Credit/Debit Card</strong>
                  <p>UPI, NetBanking, Wallet</p>
                </div>
                {paymentMethod === 'RAZORPAY' && <FiCheck className={styles.mobilePaymentCheck} />}
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className={styles.mobileSection}>
            <div className={styles.mobileSectionHeader}>
              <FiPackage />
              <h2>Order Items ({cartItems.length})</h2>
            </div>
            <div className={styles.mobileOrderItems}>
              {cartItems.map((item) => (
                <div key={item.id} className={styles.mobileOrderItem}>
                  <img src={getProductImage(item.products)} alt={item.products?.name} />
                  <div className={styles.mobileOrderItemInfo}>
                    <h4>{item.products?.name}</h4>
                    <p>Qty: {item.quantity}</p>
                  </div>
                  <div className={styles.mobileOrderItemPrice}>
                    ₹{item.products?.price * item.quantity}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className={styles.mobileOrderSummaryCard}>
            <h3>Order Summary</h3>
            <div className={styles.mobileSummaryRow}>
              <span>Subtotal ({cartItems.length} items)</span>
              <span>₹{calculateSubtotal()}</span>
            </div>
            <div className={styles.mobileSummaryRow}>
              <span>Shipping</span>
              <span className={styles.free}>Free</span>
            </div>
            <div className={styles.mobileSummaryRow}>
              <span>{paymentMethod === 'COD' ? 'COD Charges' : 'Payment Gateway Fee'}</span>
              <span>{paymentMethod === 'COD' ? '₹0' : '₹0'}</span>
            </div>
            <div className={`${styles.mobileSummaryRow} ${styles.mobileTotalRow}`}>
              <span>Total Amount</span>
              <strong>₹{calculateTotal()}</strong>
            </div>
            
            <button 
              onClick={handlePlaceOrder}
              className={styles.mobilePlaceOrderBtn}
              disabled={submitting || !selectedAddress}
            >
              {submitting ? 'Processing...' : `${paymentMethod === 'COD' ? 'Place Order' : 'Pay Now'} • ₹${calculateTotal()}`}
            </button>
          </div>

          <div className={styles.mobileBottomPadding}></div>
        </div>

        {message && (
          <div className={`${styles.mobileMessage} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}
      </div>
    );
  }

  // ============================================
  // DESKTOP CHECKOUT UI with Razorpay
  // ============================================
  return (
    <div className={styles.checkoutPage}>
      <div className={styles.container}>
        <Link to="/cart" className={styles.backLink}>
          <FiArrowLeft /> Back to Cart
        </Link>

        <h1 className={styles.pageTitle}>Checkout</h1>

        {message && (
          <div className={`${styles.message} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}

        <div className={styles.checkoutLayout}>
          <div className={styles.checkoutLeft}>
            {/* Shipping Address Section */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <FiMapPin className={styles.sectionIcon} />
                <h2>Shipping Address</h2>
              </div>

              {savedAddresses.length > 0 && !showNewAddress && (
                <div className={styles.addressList}>
                  {savedAddresses.map((address, index) => (
                    <div 
                      key={address.id || index}
                      className={`${styles.addressCard} ${selectedAddress === address ? styles.selected : ''}`}
                      onClick={() => handleSelectAddress(address)}
                    >
                      <div className={styles.addressRadio}>
                        {selectedAddress === address && <FiCheck />}
                      </div>
                      <div className={styles.addressDetails}>
                        <p className={styles.addressName}>{address.name}</p>
                        <p className={styles.addressMobile}>📞 {address.mobile}</p>
                        <p className={styles.addressText}>{address.doorNo}, {address.street}</p>
                        {address.landmark && <p className={styles.addressLandmark}>📍 {address.landmark}</p>}
                        <p className={styles.addressLocation}>{address.city}, {address.state} - {address.pincode}</p>
                      </div>
                      <div className={styles.addressActions}>
                        <button onClick={(e) => { e.stopPropagation(); handleEditAddress(address, index); }} className={styles.editAddress}>
                          <FiEdit2 />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteAddress(index); }} className={styles.deleteAddress}>
                          <FiTrash2 />
                        </button>
                      </div>
                      {address.isDefault && <span className={styles.defaultBadge}>Default</span>}
                    </div>
                  ))}
                </div>
              )}

              <button 
                className={styles.addAddressBtn}
                onClick={() => {
                  setShowNewAddress(!showNewAddress);
                  setEditingAddress(null);
                  setNewAddressForm({
                    name: userProfile?.name || '',
                    mobile: userProfile?.mobile || '',
                    doorNo: '',
                    street: '',
                    city: '',
                    state: 'Andhra Pradesh',
                    pincode: '',
                    landmark: '',
                    isDefault: savedAddresses.length === 0
                  });
                }}
              >
                <FiPlus /> {showNewAddress ? 'Cancel' : 'Add New Address'}
              </button>

              {showNewAddress && (
                <div className={styles.newAddressForm}>
                  <h3>{editingAddress !== null ? 'Edit Address' : 'New Address'}</h3>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Full Name *</label>
                      <input type="text" value={newAddressForm.name} onChange={(e) => setNewAddressForm({ ...newAddressForm, name: e.target.value })} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Mobile Number *</label>
                      <input type="tel" value={newAddressForm.mobile} onChange={(e) => setNewAddressForm({ ...newAddressForm, mobile: e.target.value })} />
                    </div>
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Door/House No *</label>
                      <input type="text" value={newAddressForm.doorNo} onChange={(e) => setNewAddressForm({ ...newAddressForm, doorNo: e.target.value })} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Street Address *</label>
                      <input type="text" value={newAddressForm.street} onChange={(e) => setNewAddressForm({ ...newAddressForm, street: e.target.value })} />
                    </div>
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Landmark</label>
                      <input type="text" value={newAddressForm.landmark} onChange={(e) => setNewAddressForm({ ...newAddressForm, landmark: e.target.value })} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>City *</label>
                      <input type="text" value={newAddressForm.city} onChange={(e) => setNewAddressForm({ ...newAddressForm, city: e.target.value })} />
                    </div>
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>State</label>
                      <select value={newAddressForm.state} onChange={(e) => setNewAddressForm({ ...newAddressForm, state: e.target.value })}>
                        <option value="Andhra Pradesh">Andhra Pradesh</option>
                        <option value="Telangana">Telangana</option>
                        <option value="Karnataka">Karnataka</option>
                        <option value="Tamil Nadu">Tamil Nadu</option>
                        <option value="Kerala">Kerala</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>PIN Code *</label>
                      <input type="text" value={newAddressForm.pincode} onChange={(e) => setNewAddressForm({ ...newAddressForm, pincode: e.target.value })} maxLength="6" />
                    </div>
                  </div>
                  <label className={styles.checkbox}>
                    <input type="checkbox" checked={newAddressForm.isDefault} onChange={(e) => setNewAddressForm({ ...newAddressForm, isDefault: e.target.checked })} />
                    Set as default address
                  </label>
                  <div className={styles.formActions}>
                    <button onClick={handleSaveAddress} className={styles.saveAddressBtn}>
                      {editingAddress !== null ? 'Update Address' : 'Save Address'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Method Section - Desktop */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <FiCreditCard className={styles.sectionIcon} />
                <h2>Payment Method</h2>
              </div>
              <div className={styles.paymentOptions}>
                <div 
                  className={`${styles.paymentOption} ${paymentMethod === 'COD' ? styles.selected : ''}`}
                  onClick={() => setPaymentMethod('COD')}
                >
                  <input type="radio" checked={paymentMethod === 'COD'} readOnly />
                  <div>
                    <strong>Cash on Delivery</strong>
                    <p>Pay when you receive your order</p>
                  </div>
                </div>
                <div 
                  className={`${styles.paymentOption} ${paymentMethod === 'RAZORPAY' ? styles.selected : ''}`}
                  onClick={() => setPaymentMethod('RAZORPAY')}
                >
                  <input type="radio" checked={paymentMethod === 'RAZORPAY'} readOnly />
                  <div>
                    <strong>Credit/Debit Card, UPI, NetBanking</strong>
                    <p>Secure payment via Razorpay</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items Section */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <FiPackage className={styles.sectionIcon} />
                <h2>Order Items</h2>
              </div>
              <div className={styles.orderItemsList}>
                {cartItems.map((item) => (
                  <div key={item.id} className={styles.orderItem}>
                    <img src={getProductImage(item.products)} alt={item.products?.name} />
                    <div className={styles.orderItemDetails}>
                      <h4>{item.products?.name}</h4>
                      <p>Quantity: {item.quantity}</p>
                      {item.size && <p>Size: {item.size}</p>}
                    </div>
                    <div className={styles.orderItemPrice}>
                      ₹{item.products?.price * item.quantity}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary Desktop */}
          <div className={styles.checkoutRight}>
            <div className={styles.orderSummary}>
              <h3>Order Summary</h3>
              <div className={styles.summaryDetails}>
                <div className={styles.summaryRow}>
                  <span>Subtotal ({cartItems.length} items)</span>
                  <span>₹{calculateSubtotal()}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Shipping</span>
                  <span className={styles.free}>Free</span>
                </div>
                <div className={`${styles.summaryRow} ${styles.total}`}>
                  <span>Total Amount</span>
                  <span>₹{calculateTotal()}</span>
                </div>
              </div>
              <button 
                onClick={handlePlaceOrder}
                className={styles.placeOrderBtn}
                disabled={submitting || !selectedAddress}
              >
                {submitting ? 'Processing...' : (paymentMethod === 'COD' ? 'Place Order (COD) →' : 'Proceed to Pay →')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;