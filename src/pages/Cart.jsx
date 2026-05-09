import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { FiTrash2, FiPlus, FiMinus, FiShoppingBag, FiArrowLeft, FiTruck, FiShield, FiClock } from 'react-icons/fi';
import styles from './Cart.module.css';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [message, setMessage] = useState(null); // Added for out-of-stock notifications
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
    fetchCart();
  }, []);

  // UPDATED: Enhanced fetchCart with out-of-stock handling and user feedback
  const fetchCart = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        products (*)
      `)
      .eq('user_id', user.id);

    if (data && !error) {
      // Filter out out-of-stock items and show message
      const availableItems = data.filter(item => item.products?.stock_quantity > 0);
      const outOfStockItems = data.filter(item => item.products?.stock_quantity === 0);
      
      if (outOfStockItems.length > 0) {
        // Remove out of stock items from cart
        for (const item of outOfStockItems) {
          await supabase.from('cart_items').delete().eq('id', item.id);
        }
        setMessage({ type: 'warning', text: `${outOfStockItems.length} item(s) were removed from your cart due to being out of stock!` });
        setTimeout(() => setMessage(null), 4000);
      }
      
      setCartItems(availableItems);
    }
    setLoading(false);
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    setUpdating(true);

    // Check if product is still in stock before updating
    const item = cartItems.find(i => i.id === itemId);
    if (item && item.products) {
      const maxStock = item.products.stock_quantity;
      if (newQuantity > maxStock) {
        setMessage({ type: 'error', text: `Only ${maxStock} item(s) available in stock!` });
        setTimeout(() => setMessage(null), 3000);
        setUpdating(false);
        return;
      }
    }

    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: newQuantity })
      .eq('id', itemId);

    if (!error) {
      await fetchCart();
    }
    setUpdating(false);
  };

  const removeItem = async (itemId) => {
    setUpdating(true);
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);

    if (!error) {
      await fetchCart();
    }
    setUpdating(false);
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item.products?.price || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  const handleCheckout = () => {
    navigate('/checkout');
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
        <p>Loading your cart...</p>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className={styles.emptyCartContainer}>
        <div className={styles.emptyCart}>
          <div className={styles.emptyIcon}>🛒</div>
          <h2>Your Cart is Empty</h2>
          <p>Looks like you haven't added any items to your cart yet.</p>
          <Link to="/products" className={styles.shopBtn}>Start Shopping →</Link>
        </div>
      </div>
    );
  }

  // ============================================
  // MOBILE CART UI (Swiggy/Zomato Style)
  // ============================================
  if (isMobile) {
    return (
      <div className={styles.mobileCart}>
        {/* Notification Banner */}
        {message && (
          <div className={`${styles.messageBanner} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}
        
        {/* Mobile Header */}
        <div className={styles.mobileHeader}>
          <button onClick={() => navigate(-1)} className={styles.mobileBackBtn}>
            <FiArrowLeft />
          </button>
          <h1>My Cart</h1>
          <div className={styles.mobileCartCount}>{cartItems.length} items</div>
        </div>

        {/* Cart Items List */}
        <div className={styles.mobileCartItems}>
          {cartItems.map((item) => (
            <div key={item.id} className={styles.mobileCartItem}>
              <img 
                src={getProductImage(item.products)} 
                alt={item.products?.name}
                className={styles.mobileItemImage}
              />
              <div className={styles.mobileItemDetails}>
                <h3>{item.products?.name}</h3>
                {item.size && <p className={styles.mobileItemSize}>Size: {item.size}</p>}
                <div className={styles.mobileItemPrice}>₹{item.products?.price}</div>
              </div>
              <div className={styles.mobileItemActions}>
                <div className={styles.mobileQuantityControl}>
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={updating}
                  >
                    <FiMinus />
                  </button>
                  <span>{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={updating}
                  >
                    <FiPlus />
                  </button>
                </div>
                <button 
                  onClick={() => removeItem(item.id)}
                  className={styles.mobileRemoveBtn}
                  disabled={updating}
                >
                  <FiTrash2 />
                </button>
              </div>
              <div className={styles.mobileItemTotal}>
                ₹{item.products?.price * item.quantity}
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary - Mobile */}
        <div className={styles.mobileOrderSummary}>
          <div className={styles.mobileSummaryHeader}>
            <h3>Bill Details</h3>
          </div>
          <div className={styles.mobileSummaryRow}>
            <span>Subtotal ({cartItems.length} items)</span>
            <span>₹{calculateTotal()}</span>
          </div>
          <div className={styles.mobileSummaryRow}>
            <span>Delivery Fee</span>
            <span className={styles.free}>Free</span>
          </div>
          <div className={styles.mobileSummaryRow}>
            <span>Packaging Fee</span>
            <span>Included</span>
          </div>
          <div className={`${styles.mobileSummaryRow} ${styles.mobileTotal}`}>
            <span>Total Amount</span>
            <span>₹{calculateTotal()}</span>
          </div>
          
          <div className={styles.mobileDeliveryInfo}>
            <div className={styles.mobileDeliveryItem}>
              <FiTruck />
              <span>Free delivery on orders above ₹499</span>
            </div>
            <div className={styles.mobileDeliveryItem}>
              <FiShield />
              <span>Safe & Secure COD</span>
            </div>
          </div>

          <button 
            onClick={handleCheckout}
            className={styles.mobileCheckoutBtn}
            disabled={updating}
          >
            Proceed to Checkout • ₹{calculateTotal()}
          </button>
          
          <Link to="/products" className={styles.mobileContinueBtn}>
            Add More Items
          </Link>
        </div>
      </div>
    );
  }

  // ============================================
  // DESKTOP CART UI (Premium Traditional Style)
  // ============================================
  return (
    <div className={styles.cartPage}>
      <div className={styles.container}>
        {/* Notification Banner */}
        {message && (
          <div className={`${styles.messageBanner} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}
        
        <button onClick={() => navigate(-1)} className={styles.backBtn}>
          <FiArrowLeft /> Back
        </button>
        
        <h1 className={styles.pageTitle}>Shopping Cart</h1>
        
        <div className={styles.cartLayout}>
          <div className={styles.cartItems}>
            <div className={styles.cartHeader}>
              <div>Product</div>
              <div>Price</div>
              <div>Quantity</div>
              <div>Total</div>
              <div></div>
            </div>
            
            {cartItems.map((item) => (
              <div key={item.id} className={styles.cartItem}>
                <div className={styles.productInfo}>
                  <img 
                    src={getProductImage(item.products)} 
                    alt={item.products?.name}
                    className={styles.itemImage}
                  />
                  <div>
                    <h3>{item.products?.name}</h3>
                    {item.size && <p className={styles.itemSize}>Size: {item.size}</p>}
                  </div>
                </div>
                <div className={styles.itemPrice}>₹{item.products?.price}</div>
                <div className={styles.quantityControl}>
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={updating}
                  >
                    <FiMinus />
                  </button>
                  <span>{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={updating}
                  >
                    <FiPlus />
                  </button>
                </div>
                <div className={styles.itemTotal}>
                  ₹{item.products?.price * item.quantity}
                </div>
                <button 
                  onClick={() => removeItem(item.id)}
                  className={styles.removeBtn}
                  disabled={updating}
                >
                  <FiTrash2 />
                </button>
              </div>
            ))}
          </div>

          <div className={styles.cartSummary}>
            <h3>Order Summary</h3>
            <div className={styles.summaryDetails}>
              <div className={styles.summaryRow}>
                <span>Subtotal ({cartItems.length} items)</span>
                <span>₹{calculateTotal()}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Shipping</span>
                <span className={styles.free}>Free</span>
              </div>
              <div className={styles.summaryRow}>
                <span>COD Charges</span>
                <span>₹0</span>
              </div>
              <div className={`${styles.summaryRow} ${styles.total}`}>
                <span>Total</span>
                <span>₹{calculateTotal()}</span>
              </div>
            </div>
            
            <div className={styles.deliveryInfo}>
              <p><FiTruck /> Free Delivery on orders above ₹499</p>
              <p><FiShield /> Safe & Secure COD</p>
              <p><FiClock /> Estimated Delivery: 3-5 days</p>
            </div>
            
            <button 
              onClick={handleCheckout}
              className={styles.checkoutBtn}
              disabled={updating}
            >
              Proceed to Checkout →
            </button>
            <Link to="/products" className={styles.continueBtn}>
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;