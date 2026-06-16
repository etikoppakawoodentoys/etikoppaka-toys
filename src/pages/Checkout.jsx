import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { sendOrderConfirmation, sendAdminNotification } from '../services/emailService';
import { loadRazorpayScript, createRazorpayOrder } from '../services/razorpayService';
import { 
  FiMapPin, FiPlus, FiCheck, FiArrowLeft, FiPackage,
  FiCreditCard, FiTrash2, FiEdit2, FiSave, FiGift, FiTruck
} from 'react-icons/fi';
import styles from './Checkout.module.css';

const GIFT_PACKING_CHARGE = 50;
const DELIVERY_CHARGE = 70;
const FREE_DELIVERY_THRESHOLD = 499;

const Checkout = () => {
  const [cartItems, setCartItems] = useState([]);
  const [cartHampers, setCartHampers] = useState([]);
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
  const navigate = useNavigate();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    loadRazorpayScript();
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }

      const { data: profile } = await supabase
        .from('users').select('*').eq('id', user.id).single();

      if (profile) {
        setUserProfile(profile);
        let addresses = [];
        if (profile.saved_addresses) {
          addresses = typeof profile.saved_addresses === 'string'
            ? JSON.parse(profile.saved_addresses)
            : profile.saved_addresses;
        }
        setSavedAddresses(addresses);
        const defaultAddr = addresses.find(addr => addr.isDefault);
        if (defaultAddr) setSelectedAddress(defaultAddr);
      }

      const { data: cart } = await supabase
        .from('cart_items')
        .select('*, products(*)')
        .eq('user_id', user.id);

      const { data: hampers } = await supabase
        .from('cart_hampers')
        .select('*, hampers!cart_hampers_hamper_id_fkey (*)')
        .eq('user_id', user.id);

      const hasItems = (cart && cart.length > 0) || (hampers && hampers.length > 0);
      if (!hasItems) {
        navigate('/cart');
        return;
      }

      setCartItems(cart || []);
      setCartHampers(hampers || []);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  // ── Totals ───────────────────────────────────────────────────────────────
  const calculateSubtotal = () => {
    const productsTotal = cartItems.reduce(
      (total, item) => total + (item.products?.price || 0) * item.quantity, 0
    );
    const hampersTotal = cartHampers.reduce(
      (total, h) => total + (h.hampers?.price || 0) * h.quantity, 0
    );
    return productsTotal + hampersTotal;
  };

  const calculateGiftCharges = () =>
    cartItems.filter(i => i.gift_packing).length * GIFT_PACKING_CHARGE;

  const calculateDeliveryCharge = () => {
    const subtotal = calculateSubtotal();
    return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
  };

  const calculateTotal = () =>
    calculateSubtotal() + calculateGiftCharges() + calculateDeliveryCharge();

  const totalItemsCount = cartItems.length + cartHampers.length;
  // ────────────────────────────────────────────────────────────────────────

  const [newAddressForm, setNewAddressForm] = useState({
    name: '', mobile: '', doorNo: '', street: '', city: '',
    state: 'Andhra Pradesh', pincode: '', landmark: '', isDefault: false
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
      ...newAddressForm,
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
    await supabase.from('users').update({ saved_addresses: JSON.stringify(updatedAddresses) }).eq('id', user.id);
    if (formattedAddress.isDefault) setSelectedAddress(formattedAddress);
    setShowNewAddress(false);
    setEditingAddress(null);
    setNewAddressForm({ name: '', mobile: '', doorNo: '', street: '', city: '', state: 'Andhra Pradesh', pincode: '', landmark: '', isDefault: false });
    setMessage({ type: 'success', text: editingAddress !== null ? 'Address updated!' : 'Address added!' });
    setTimeout(() => setMessage(''), 3000);
  };

  const handleDeleteAddress = async (index) => {
    if (!window.confirm('Delete this address?')) return;
    const updatedAddresses = savedAddresses.filter((_, i) => i !== index);
    setSavedAddresses(updatedAddresses);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('users').update({ saved_addresses: JSON.stringify(updatedAddresses) }).eq('id', user.id);
    if (selectedAddress?.id === savedAddresses[index]?.id) setSelectedAddress(null);
    setMessage({ type: 'success', text: 'Address deleted!' });
    setTimeout(() => setMessage(''), 3000);
  };

  const handleEditAddress = (address, index) => {
    setNewAddressForm({
      name: address.name || '', mobile: address.mobile || '', doorNo: address.doorNo || '',
      street: address.street || '', city: address.city || '', state: address.state || 'Andhra Pradesh',
      pincode: address.pincode || '', landmark: address.landmark || '', isDefault: address.isDefault || false
    });
    setEditingAddress(index);
    setShowNewAddress(true);
  };

  const handleSelectAddress = (address) => {
    setSelectedAddress(address);
    setShowNewAddress(false);
    setEditingAddress(null);
  };

  const processRazorpayPayment = async (order, totalAmount) => {
    try {
      const razorpayOrder = await createRazorpayOrder(totalAmount, order.order_number);
      const options = {
        key: 'rzp_live_SnFBYmQC6vompt',
        amount: razorpayOrder.amount,
        currency: 'INR',
        name: 'Etikoppaka Toys',
        description: `Order #${order.order_number}`,
        image: '/logo1.png',
        order_id: razorpayOrder.id,
        prefill: { name: userProfile?.name || '', email: userProfile?.email || '', contact: userProfile?.mobile || '' },
        theme: { color: '#1F5B3A' },
        modal: {
          ondismiss: () => {
            setSubmitting(false);
            setMessage({ type: 'error', text: 'Payment cancelled' });
            setTimeout(() => setMessage(''), 3000);
          }
        },
        handler: async (response) => {
          const { data: { user } } = await supabase.auth.getUser();
          await supabase.from('orders').update({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            payment_status: 'paid',
          }).eq('id', order.id);
          await supabase.from('cart_items').delete().eq('user_id', user.id);
          await supabase.from('cart_hampers').delete().eq('user_id', user.id);
          navigate('/orders', { state: { orderSuccess: true, orderNumber: order.order_number, paymentSuccess: true } });
        }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Razorpay error:', error);
      setMessage({ type: 'error', text: 'Failed to initialize payment. Please try again.' });
      setTimeout(() => setMessage(''), 3000);
      setSubmitting(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setMessage({ type: 'error', text: 'Please select a shipping address' });
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const totalAmount = calculateTotal();
      const giftCharges = calculateGiftCharges();
      const deliveryCharge = calculateDeliveryCharge();
      const fullAddress = selectedAddress.fullAddress ||
        `${selectedAddress.doorNo}, ${selectedAddress.street}, ${selectedAddress.city} - ${selectedAddress.pincode}`;

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: totalAmount,
          shipping_address: fullAddress,
          payment_method: paymentMethod,
          payment_status: paymentMethod === 'COD' ? 'pending' : 'initiated',
          status: 'pending',
          delivery_charge: deliveryCharge,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const productOrderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.products.name,
        quantity: item.quantity,
        price: item.products.price,
        gift_packing: !!item.gift_packing,
        gift_quote: item.gift_packing ? (item.gift_quote || '') : '',
        gift_charge: item.gift_packing ? GIFT_PACKING_CHARGE : 0,
        item_type: 'product',
      }));

      const hamperOrderItems = cartHampers.map(h => ({
        order_id: order.id,
        product_id: null,
        product_name: h.hampers?.name || 'Gift Hamper',
        quantity: h.quantity,
        price: h.hampers?.price || 0,
        gift_packing: false,
        gift_quote: '',
        gift_charge: 0,
        item_type: 'hamper',
        hamper_id: h.hamper_id,
      }));

      const orderItems = [...productOrderItems, ...hamperOrderItems];

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      order.order_items = orderItems;

      const orderDetails = {
        order_number: order.order_number,
        total_amount: totalAmount,
        created_at: order.created_at,
        shipping_address: fullAddress,
        items: orderItems,
        payment_method: paymentMethod,
        gift_charges: giftCharges,
        delivery_charge: deliveryCharge,
      };

      if (paymentMethod === 'COD') {
        await supabase.from('cart_items').delete().eq('user_id', user.id);
        await supabase.from('cart_hampers').delete().eq('user_id', user.id);
       await sendOrderConfirmation(orderDetails, user.email, userProfile?.name || 'Customer', { 
  paymentMethod: 'COD',
  deliveryCharge: deliveryCharge  // ← PASS THIS
});
        await sendAdminNotification(orderDetails, {
  name: userProfile?.name || 'Customer',
  email: user.email,
  mobile: userProfile?.mobile || 'Not provided',
  paymentMethod: 'COD'
  // deliveryCharge is already in orderDetails.delivery_charge
});
        navigate('/orders', { state: { orderSuccess: true, orderNumber: order.order_number } });
      } else {
        await processRazorpayPayment(order, totalAmount);
      }
      setSubmitting(false);
    } catch (error) {
      console.error('Order error:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to place order' });
      setTimeout(() => setMessage(''), 3000);
      setSubmitting(false);
    }
  };

  const getProductImage = (product) => {
    if (product.images) {
      try {
        const images = JSON.parse(product.images);
        if (images?.length > 0) return images[0];
      } catch(e) {}
    }
    return product.image_url || '/images/placeholder.jpg';
  };

  const getHamperImage = (hamper) => {
    if (hamper?.images) {
      try {
        const images = JSON.parse(hamper.images);
        if (images?.length > 0) return images[0];
      } catch(e) {}
    }
    return hamper?.image_url || '/images/hamper-placeholder.jpg';
  };

  const giftCharges = calculateGiftCharges();
  const deliveryCharge = calculateDeliveryCharge();
  const subtotal = calculateSubtotal();
  const giftItems = cartItems.filter(i => i.gift_packing);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading checkout...</p>
      </div>
    );
  }

  const AddressForm = () => (
    <div className={styles.newAddressForm}>
      <h3>{editingAddress !== null ? 'Edit Address' : 'Add New Address'}</h3>
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label>Full Name <span className={styles.required}>*</span></label>
          <input type="text" placeholder="Enter full name" value={newAddressForm.name} onChange={(e) => setNewAddressForm({...newAddressForm, name: e.target.value})} />
        </div>
        <div className={styles.formGroup}>
          <label>Mobile Number <span className={styles.required}>*</span></label>
          <input type="tel" placeholder="10 digit mobile number" value={newAddressForm.mobile} onChange={(e) => setNewAddressForm({...newAddressForm, mobile: e.target.value})} />
        </div>
      </div>
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label>Door/House No <span className={styles.required}>*</span></label>
          <input type="text" placeholder="House/Building No." value={newAddressForm.doorNo} onChange={(e) => setNewAddressForm({...newAddressForm, doorNo: e.target.value})} />
        </div>
        <div className={styles.formGroup}>
          <label>Street Address <span className={styles.required}>*</span></label>
          <input type="text" placeholder="Street name" value={newAddressForm.street} onChange={(e) => setNewAddressForm({...newAddressForm, street: e.target.value})} />
        </div>
      </div>
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label>Landmark</label>
          <input type="text" placeholder="Nearby landmark (optional)" value={newAddressForm.landmark} onChange={(e) => setNewAddressForm({...newAddressForm, landmark: e.target.value})} />
        </div>
        <div className={styles.formGroup}>
          <label>City <span className={styles.required}>*</span></label>
          <input type="text" placeholder="City name" value={newAddressForm.city} onChange={(e) => setNewAddressForm({...newAddressForm, city: e.target.value})} />
        </div>
      </div>
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label>State</label>
          <select value={newAddressForm.state} onChange={(e) => setNewAddressForm({...newAddressForm, state: e.target.value})}>
            {["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal"].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className={styles.formGroup}>
          <label>PIN Code <span className={styles.required}>*</span></label>
          <input type="text" placeholder="6 digit PIN code" value={newAddressForm.pincode} onChange={(e) => setNewAddressForm({...newAddressForm, pincode: e.target.value})} maxLength="6" />
        </div>
      </div>
      <div className={styles.checkboxGroup}>
        <label>
          <input type="checkbox" checked={newAddressForm.isDefault} onChange={(e) => setNewAddressForm({...newAddressForm, isDefault: e.target.checked})} />
          Set as default address
        </label>
      </div>
      <div className={styles.formActions}>
        <button type="button" onClick={() => { setShowNewAddress(false); setEditingAddress(null); }} className={styles.cancelBtn}>Cancel</button>
        <button type="button" onClick={handleSaveAddress} className={styles.saveAddressBtn}>
          <FiSave /> {editingAddress !== null ? 'Update Address' : 'Save Address'}
        </button>
      </div>
    </div>
  );

  // ============================================
  // MOBILE CHECKOUT UI
  // ============================================
  if (isMobile) {
    return (
      <div className={styles.mobileCheckout}>
        <div className={styles.mobileHeader}>
          <button onClick={() => navigate('/cart')} className={styles.mobileBackBtn}><FiArrowLeft /></button>
          <h1>Checkout</h1>
          <div className={styles.mobilePlaceholder}></div>
        </div>

        <div className={styles.mobileScrollContent}>
          {/* Address Section */}
          <div className={styles.mobileSection}>
            <div className={styles.mobileSectionHeader}><FiMapPin /><h2>Delivery Address</h2></div>
            {savedAddresses.map((address, index) => (
              <div key={address.id || index} className={`${styles.mobileAddressCard} ${selectedAddress?.id === address.id ? styles.selected : ''}`} onClick={() => handleSelectAddress(address)}>
                <div className={styles.mobileAddressRadio}>{selectedAddress?.id === address.id && <FiCheck />}</div>
                <div className={styles.mobileAddressDetails}>
                  <p className={styles.mobileAddressName}>{address.name}</p>
                  <p className={styles.mobileAddressPhone}>📞 {address.mobile}</p>
                  <p>{address.doorNo}, {address.street}</p>
                  <p>{address.city}, {address.state} - {address.pincode}</p>
                </div>
                <div className={styles.mobileAddressActions}>
                  <button onClick={(e) => { e.stopPropagation(); handleEditAddress(address, index); }}><FiEdit2 /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteAddress(index); }}><FiTrash2 /></button>
                </div>
              </div>
            ))}
            <button className={styles.mobileAddAddressBtn} onClick={() => setShowNewAddress(!showNewAddress)}>
              <FiPlus /> {showNewAddress ? 'Cancel' : 'Add New Address'}
            </button>
            {showNewAddress && <AddressForm />}
          </div>

          {/* Payment Method */}
          <div className={styles.mobileSection}>
            <div className={styles.mobileSectionHeader}><FiCreditCard /><h2>Payment Method</h2></div>
            <div className={styles.mobilePaymentOptions}>
              <div className={`${styles.mobilePaymentOption} ${paymentMethod === 'COD' ? styles.selected : ''}`} onClick={() => setPaymentMethod('COD')}>
                <span>💰</span>
                <div><strong>Cash on Delivery</strong><p>Pay when you receive</p></div>
                {paymentMethod === 'COD' && <FiCheck />}
              </div>
              <div className={`${styles.mobilePaymentOption} ${paymentMethod === 'RAZORPAY' ? styles.selected : ''}`} onClick={() => setPaymentMethod('RAZORPAY')}>
                <span>💳</span>
                <div><strong>Card/UPI/NetBanking</strong><p>Pay via Razorpay</p></div>
                {paymentMethod === 'RAZORPAY' && <FiCheck />}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className={styles.mobileOrderSummaryCard}>
            <h3>Order Summary</h3>

            {/* Regular products */}
            {cartItems.map(item => (
              <div key={`product-${item.id}`} className={styles.mobileSummaryRow}>
                <span>
                  {item.products.name} x{item.quantity}
                  {item.gift_packing && <span className={styles.giftTag}> 🎁 Gift</span>}
                </span>
                <span>₹{item.products.price * item.quantity + (item.gift_packing ? GIFT_PACKING_CHARGE : 0)}</span>
              </div>
            ))}

            {/* Hampers */}
            {cartHampers.map(h => (
              <div key={`hamper-${h.id}`} className={styles.mobileSummaryRow}>
                <span>
                  🎁 {h.hampers?.name} x{h.quantity}
                  <span className={styles.giftTag}> Hamper</span>
                </span>
                <span>₹{(h.hampers?.price || 0) * h.quantity}</span>
              </div>
            ))}

            {giftCharges > 0 && (
              <div className={styles.mobileSummaryRow}>
                <span><FiGift style={{ verticalAlign: 'middle', marginRight: 4 }} />Gift Packing ({giftItems.length} item{giftItems.length > 1 ? 's' : ''})</span>
                <span>₹{giftCharges}</span>
              </div>
            )}

            <div className={styles.mobileSummaryRow}><span>Subtotal</span><span>₹{subtotal}</span></div>

            <div className={styles.mobileSummaryRow}>
              <span><FiTruck style={{ verticalAlign: 'middle', marginRight: 4 }} />Delivery Fee</span>
              <span className={deliveryCharge === 0 ? styles.free : ''}>
                {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
              </span>
            </div>

            {deliveryCharge > 0 && (
              <div className={styles.mobileSummaryRow} style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                <span>Add ₹{FREE_DELIVERY_THRESHOLD - subtotal} more for free delivery</span>
              </div>
            )}

            <div className={`${styles.mobileSummaryRow} ${styles.mobileTotalRow}`}>
              <span>Total</span><strong>₹{calculateTotal()}</strong>
            </div>

            {/* Gift messages summary */}
            {giftItems.length > 0 && (
              <div className={styles.giftSummaryBox}>
                <p className={styles.giftSummaryTitle}><FiGift /> Gift Messages</p>
                {giftItems.map(item => (
                  <div key={item.id} className={styles.giftSummaryItem}>
                    <span className={styles.giftSummaryProduct}>{item.products.name}:</span>
                    <span className={styles.giftSummaryQuote}>
                      {item.gift_quote ? `"${item.gift_quote}"` : <em>No message</em>}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button onClick={handlePlaceOrder} className={styles.mobilePlaceOrderBtn} disabled={submitting || !selectedAddress}>
              {submitting ? 'Processing...' : `${paymentMethod === 'COD' ? 'Place Order' : 'Pay Now'} • ₹${calculateTotal()}`}
            </button>
          </div>
        </div>

        {message && <div className={`${styles.mobileMessage} ${styles[message.type]}`}>{message.text}</div>}
      </div>
    );
  }

  // ============================================
  // DESKTOP CHECKOUT UI
  // ============================================
  return (
    <div className={styles.checkoutPage}>
      <div className={styles.container}>
        <Link to="/cart" className={styles.backLink}><FiArrowLeft /> Back to Cart</Link>
        <h1 className={styles.pageTitle}>Checkout</h1>
        {message && <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>}

        <div className={styles.checkoutLayout}>
          <div className={styles.checkoutLeft}>
            {/* Address Section */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}><FiMapPin /><h2>Shipping Address</h2></div>
              {savedAddresses.map((address, idx) => (
                <div key={idx} className={`${styles.addressCard} ${selectedAddress?.id === address.id ? styles.selected : ''}`} onClick={() => setSelectedAddress(address)}>
                  <div className={styles.addressRadio}>{selectedAddress?.id === address.id && <FiCheck />}</div>
                  <div>
                    <p><strong>{address.name}</strong> 📞 {address.mobile}</p>
                    <p>{address.doorNo}, {address.street}</p>
                    <p>{address.city}, {address.state} - {address.pincode}</p>
                  </div>
                  <div className={styles.addressActions}>
                    <button onClick={(e) => { e.stopPropagation(); handleEditAddress(address, idx); }}><FiEdit2 /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteAddress(idx); }}><FiTrash2 /></button>
                  </div>
                </div>
              ))}
              <button className={styles.addAddressBtn} onClick={() => setShowNewAddress(!showNewAddress)}><FiPlus /> Add New Address</button>
              {showNewAddress && <AddressForm />}
            </div>

            {/* Payment Method */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}><FiCreditCard /><h2>Payment Method</h2></div>
              <div className={styles.paymentOptions}>
                <div className={`${styles.paymentOption} ${paymentMethod === 'COD' ? styles.selected : ''}`} onClick={() => setPaymentMethod('COD')}>
                  <input type="radio" checked={paymentMethod === 'COD'} readOnly /> Cash on Delivery
                </div>
                <div className={`${styles.paymentOption} ${paymentMethod === 'RAZORPAY' ? styles.selected : ''}`} onClick={() => setPaymentMethod('RAZORPAY')}>
                  <input type="radio" checked={paymentMethod === 'RAZORPAY'} readOnly /> Razorpay (Card/UPI/NetBanking)
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <FiPackage /><h2>Order Items ({totalItemsCount})</h2>
              </div>

              {/* Regular products */}
              {cartItems.map(item => (
                <div key={`product-${item.id}`} className={styles.orderItem}>
                  <span>
                    {item.products.name} x{item.quantity}
                    {item.gift_packing && <span className={styles.giftTag}> 🎁 Gift Packed</span>}
                  </span>
                  <span>₹{item.products.price * item.quantity + (item.gift_packing ? GIFT_PACKING_CHARGE : 0)}</span>
                </div>
              ))}

              {/* Hampers */}
              {cartHampers.map(h => (
                <div key={`hamper-${h.id}`} className={styles.orderItem}>
                  <span>
                    <FiGift style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    {h.hampers?.name} x{h.quantity}
                    <span className={styles.giftTag}> 🎁 Hamper</span>
                  </span>
                  <span>₹{(h.hampers?.price || 0) * h.quantity}</span>
                </div>
              ))}

              {/* Gift messages summary */}
              {giftItems.length > 0 && (
                <div className={styles.giftSummaryBox}>
                  <p className={styles.giftSummaryTitle}><FiGift /> Gift Messages</p>
                  {giftItems.map(item => (
                    <div key={item.id} className={styles.giftSummaryItem}>
                      <span className={styles.giftSummaryProduct}>{item.products.name}:</span>
                      <span className={styles.giftSummaryQuote}>
                        {item.gift_quote ? `"${item.gift_quote}"` : <em>No message added</em>}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={styles.checkoutRight}>
            <div className={styles.orderSummary}>
              <h3>Order Summary</h3>
              <div className={styles.summaryRow}>
                <span>Subtotal ({totalItemsCount} items)</span>
                <span>₹{subtotal}</span>
              </div>
              {giftCharges > 0 && (
                <div className={styles.summaryRow}>
                  <span><FiGift style={{ verticalAlign: 'middle', marginRight: 4 }} />Gift Packing</span>
                  <span>₹{giftCharges}</span>
                </div>
              )}
              <div className={styles.summaryRow}>
                <span><FiTruck style={{ verticalAlign: 'middle', marginRight: 4 }} />Delivery Fee</span>
                <span className={deliveryCharge === 0 ? styles.free : ''}>
                  {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
                </span>
              </div>
              {deliveryCharge > 0 && (
                <div className={styles.summaryRow} style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                  <span>Add ₹{FREE_DELIVERY_THRESHOLD - subtotal} more for free delivery</span>
                </div>
              )}
              <div className={styles.summaryRow}>
                <span>COD Charges</span>
                <span>₹0</span>
              </div>
              <div className={`${styles.summaryRow} ${styles.total}`}>
                <span>Total</span>
                <span>₹{calculateTotal()}</span>
              </div>
              <button onClick={handlePlaceOrder} className={styles.placeOrderBtn} disabled={submitting || !selectedAddress}>
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