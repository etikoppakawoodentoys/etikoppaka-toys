import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { 
  FiTrash2, FiPlus, FiMinus, FiShoppingBag, FiArrowLeft, FiTruck, FiShield, FiClock, 
  FiCheckCircle, FiHeart, FiChevronRight, FiUser, FiLogIn, FiGift, FiPackage
} from 'react-icons/fi';
import styles from './Cart.module.css';

const GIFT_PACKING_CHARGE = 50;
const DELIVERY_CHARGE = 70;
const FREE_DELIVERY_THRESHOLD = 499;

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [cartHampers, setCartHampers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [message, setMessage] = useState(null);
  const [addToCartMessage, setAddToCartMessage] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(null);
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
    checkAuthAndFetchCart();
    
    const handleCartUpdated = () => {
      console.log('Cart updated event received');
      fetchCart();
    };
    
    window.addEventListener('cartUpdated', handleCartUpdated);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdated);
    };
  }, []);

  const checkAuthAndFetchCart = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsLoggedIn(!!user);
    if (user) {
      await fetchCart();
    } else {
      setLoading(false);
    }
  };

  const fetchCart = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    console.log('Fetching cart for user:', user.id);

    // Fetch regular cart items (products)
    const { data: itemsData, error: itemsError } = await supabase
      .from('cart_items')
      .select(`
        *,
        products (*)
      `)
      .eq('user_id', user.id);

    if (itemsError) {
      console.error('Error fetching cart items:', itemsError);
    } else {
      console.log('Cart items fetched:', itemsData?.length || 0);
    }

    // Fetch hampers from cart_hampers
   const { data: hampersData, error: hampersError } = await supabase
  .from('cart_hampers')
  .select(`
    *,
    hampers!cart_hampers_hamper_id_fkey (*)
  `)
  .eq('user_id', user.id);

    if (hampersError) {
      console.error('Error fetching cart hampers:', hampersError);
    } else {
      console.log('Cart hampers fetched:', hampersData?.length || 0);
      console.log('Hampers data:', JSON.stringify(hampersData, null, 2));
    }

    // Process regular items
    let availableItems = [];
    if (itemsData && itemsData.length > 0) {
      availableItems = itemsData.filter(item => item.products?.stock_quantity > 0);
      const outOfStockItems = itemsData.filter(item => item.products?.stock_quantity === 0);
      
      if (outOfStockItems.length > 0) {
        for (const item of outOfStockItems) {
          await supabase.from('cart_items').delete().eq('id', item.id);
        }
        setMessage({ type: 'warning', text: `${outOfStockItems.length} item(s) were removed from your cart due to being out of stock!` });
        setTimeout(() => setMessage(null), 4000);
      }
    }

    setCartItems(availableItems);
    setCartHampers(hampersData || []);
    setLoading(false);
  };

  const updateQuantity = async (itemId, newQuantity, type = 'product') => {
    if (newQuantity < 1) return;
    setUpdating(true);

    if (type === 'product') {
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
    } else if (type === 'hamper') {
      const { error } = await supabase
        .from('cart_hampers')
        .update({ quantity: newQuantity })
        .eq('id', itemId);

      if (!error) {
        await fetchCart();
      }
    }
    setUpdating(false);
  };

  const removeItem = async (itemId, type = 'product') => {
    setUpdating(true);
    
    if (type === 'product') {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);
      
      if (!error) {
        await fetchCart();
      }
    } else if (type === 'hamper') {
      const { error } = await supabase
        .from('cart_hampers')
        .delete()
        .eq('id', itemId);
      
      if (!error) {
        await fetchCart();
      }
    }
    setUpdating(false);
  };

  // Gift packing toggle for products only
  const toggleGiftPacking = async (itemId, currentValue) => {
    setUpdating(true);
    const newValue = !currentValue;
    const updateData = { gift_packing: newValue };
    if (!newValue) updateData.gift_quote = '';

    const { error } = await supabase
      .from('cart_items')
      .update(updateData)
      .eq('id', itemId);

    if (!error) {
      setCartItems(prev =>
        prev.map(i =>
          i.id === itemId
            ? { ...i, gift_packing: newValue, gift_quote: newValue ? i.gift_quote : '' }
            : i
        )
      );
    }
    setUpdating(false);
  };

  const handleGiftQuoteChange = (itemId, value) => {
    setCartItems(prev =>
      prev.map(i => (i.id === itemId ? { ...i, gift_quote: value } : i))
    );
  };

  const saveGiftQuote = async (itemId, value) => {
    await supabase
      .from('cart_items')
      .update({ gift_quote: value })
      .eq('id', itemId);
  };

  const calculateSubtotal = () => {
    const productsTotal = cartItems.reduce((total, item) => {
      const price = item.products?.price || 0;
      return total + price * item.quantity;
    }, 0);
    
    const hampersTotal = cartHampers.reduce((total, hamper) => {
      const price = hamper.hampers?.price || 0;
      return total + price * hamper.quantity;
    }, 0);
    
    console.log('Products total:', productsTotal, 'Hampers total:', hampersTotal);
    return productsTotal + hampersTotal;
  };

  const calculateGiftCharges = () =>
    cartItems.filter(i => i.gift_packing).length * GIFT_PACKING_CHARGE;

  // Calculate delivery charge based on subtotal
  const calculateDeliveryCharge = () => {
    const subtotal = calculateSubtotal();
    if (subtotal >= FREE_DELIVERY_THRESHOLD) {
      return 0;
    }
    return DELIVERY_CHARGE;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const giftCharges = calculateGiftCharges();
    const deliveryCharge = calculateDeliveryCharge();
    return subtotal + giftCharges + deliveryCharge;
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const getProductImage = (product) => {
    if (product?.images) {
      try {
        const images = JSON.parse(product.images);
        if (images && images.length > 0) return images[0];
      } catch(e) {}
    }
    return product?.image_url || '/images/placeholder.jpg';
  };

  const getHamperImage = (hamper) => {
    if (hamper?.images) {
      try {
        const images = JSON.parse(hamper.images);
        if (images && images.length > 0) return images[0];
      } catch(e) {}
    }
    return hamper?.image_url || '/images/hamper-placeholder.jpg';
  };

  const getHamperTotalPrice = (hamper) => {
    if (!hamper?.hampers) return 0;
    return hamper.hampers.price * hamper.quantity;
  };

  const totalItemsCount = cartItems.length + cartHampers.length;
  const subtotal = calculateSubtotal();
  const deliveryCharge = calculateDeliveryCharge();

  // Show login prompt if user is not logged in
  if (isLoggedIn === false) {
    if (!isMobile) {
      return (
        <div className={styles.loginPromptContainer}>
          <div className={styles.loginPromptCard}>
            <div className={styles.loginPromptIcon}>🛒</div>
            <h2>Your Cart is Waiting!</h2>
            <p>Please sign in to view and manage your cart items.</p>
            <p className={styles.loginPromptSubtext}>Sign in to continue shopping and access your saved items.</p>
            <div className={styles.loginPromptButtons}>
              <Link to="/login" className={styles.loginBtn}>
                <FiLogIn /> Sign In
              </Link>
              <Link to="/signup" className={styles.signupBtn}>
                <FiUser /> Create Account
              </Link>
            </div>
            <Link to="/products" className={styles.continueShoppingLink}>
              Continue Shopping →
            </Link>
          </div>
        </div>
      );
    }
    return (
      <div className={styles.mobileLoginPrompt}>
        <div className={styles.mobileLoginPromptCard}>
          <div className={styles.mobileLoginPromptIcon}>🛒</div>
          <h2>Your Cart is Waiting!</h2>
          <p>Please sign in to view your cart</p>
          <Link to="/login" className={styles.mobileLoginBtn}>Sign In</Link>
          <Link to="/signup" className={styles.mobileSignupBtn}>Create Account</Link>
          <Link to="/products" className={styles.mobileContinueLink}>Continue Shopping →</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading your cart...</p>
      </div>
    );
  }

  if (cartItems.length === 0 && cartHampers.length === 0) {
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

  const giftCharges = calculateGiftCharges();
  const totalAmount = calculateTotal();

  // ============================================
  // MOBILE CART UI
  // ============================================
  if (isMobile) {
    return (
      <div className={styles.mobileCart}>
        {addToCartMessage && (
          <div className={`${styles.addToCartToast} ${styles[addToCartMessage.type]}`}>
            <FiCheckCircle />
            {addToCartMessage.text}
          </div>
        )}
        {message && (
          <div className={`${styles.messageBanner} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}
        
        <div className={styles.mobileHeader}>
          <button onClick={() => navigate(-1)} className={styles.mobileBackBtn}>
            <FiArrowLeft />
          </button>
          <h1>My Cart</h1>
          <div className={styles.mobileCartCount}>{totalItemsCount} items</div>
        </div>

        <div className={styles.mobileCartItems}>
          {/* Regular Products */}
          {cartItems.map((item) => (
            <div key={`product-${item.id}`} className={styles.mobileCartItem}>
              <div className={styles.mobileItemImage}>
                <img src={getProductImage(item.products)} alt={item.products?.name} />
              </div>
              <div className={styles.mobileItemDetails}>
                <h3>{item.products?.name}</h3>
                {item.size && <p className={styles.mobileItemSize}>Size: {item.size}</p>}
                <div className={styles.mobileItemPrice}>₹{item.products?.price}</div>
                <div className={styles.mobileItemTotal}>
                  <span>Total:</span>
                  <strong>₹{item.products?.price * item.quantity}</strong>
                </div>

                <div className={styles.giftPackingRow}>
                  <label className={styles.giftCheckboxLabel}>
                    <input
                      type="checkbox"
                      checked={!!item.gift_packing}
                      onChange={() => toggleGiftPacking(item.id, item.gift_packing)}
                      disabled={updating}
                    />
                    <FiGift className={styles.giftIcon} />
                    Gift Packing <span className={styles.giftCharge}>(+₹{GIFT_PACKING_CHARGE})</span>
                  </label>
                  {item.gift_packing && (
                    <input
                      type="text"
                      className={styles.giftQuoteInput}
                      placeholder="Write a gift message (optional)"
                      value={item.gift_quote || ''}
                      onChange={(e) => handleGiftQuoteChange(item.id, e.target.value)}
                      onBlur={(e) => saveGiftQuote(item.id, e.target.value)}
                      maxLength={120}
                    />
                  )}
                </div>
              </div>
              <div className={styles.mobileItemActions}>
                <div className={styles.mobileQuantityControl}>
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1, 'product')} disabled={updating}>
                    <FiMinus />
                  </button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1, 'product')} disabled={updating}>
                    <FiPlus />
                  </button>
                </div>
                <button onClick={() => removeItem(item.id, 'product')} className={styles.mobileRemoveBtn} disabled={updating}>
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}

          {/* Hampers */}
          {cartHampers.map((hamper) => (
            <div key={`hamper-${hamper.id}`} className={styles.mobileCartItem}>
              <div className={styles.mobileItemImage} style={{ position: 'relative' }}>
                <img src={getHamperImage(hamper.hampers)} alt={hamper.hampers?.name} />
                <div className={styles.hamperBadge}>🎁 Hamper</div>
              </div>
              <div className={styles.mobileItemDetails}>
                <h3>{hamper.hampers?.name}</h3>
                <div className={styles.mobileItemPrice}>₹{hamper.hampers?.price}</div>
                <div className={styles.mobileItemTotal}>
                  <span>Total:</span>
                  <strong>₹{getHamperTotalPrice(hamper)}</strong>
                </div>
                <div className={styles.hamperNote}>
                  <FiPackage /> Gift Hamper
                </div>
              </div>
              <div className={styles.mobileItemActions}>
                <div className={styles.mobileQuantityControl}>
                  <button onClick={() => updateQuantity(hamper.id, hamper.quantity - 1, 'hamper')} disabled={updating}>
                    <FiMinus />
                  </button>
                  <span>{hamper.quantity}</span>
                  <button onClick={() => updateQuantity(hamper.id, hamper.quantity + 1, 'hamper')} disabled={updating}>
                    <FiPlus />
                  </button>
                </div>
                <button onClick={() => removeItem(hamper.id, 'hamper')} className={styles.mobileRemoveBtn} disabled={updating}>
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.mobileOrderSummary}>
          <div className={styles.mobilePriceBreakup}>
            <h3>Price Details</h3>
            <div className={styles.mobileSummaryRow}>
              <span>Price ({totalItemsCount} items)</span>
              <span>₹{subtotal}</span>
            </div>
            {giftCharges > 0 && (
              <div className={styles.mobileSummaryRow}>
                <span>
                  <FiGift style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  Gift Packing ({cartItems.filter(i => i.gift_packing).length} item{cartItems.filter(i => i.gift_packing).length > 1 ? 's' : ''})
                </span>
                <span>₹{giftCharges}</span>
              </div>
            )}
            <div className={styles.mobileSummaryRow}>
              <span>Delivery Fee</span>
              <span className={deliveryCharge === 0 ? styles.free : ''}>
                {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
              </span>
            </div>
            {deliveryCharge > 0 && (
              <div className={styles.mobileSummaryRow}>
                <span>Free Delivery on orders above ₹{FREE_DELIVERY_THRESHOLD}</span>
                <span>Add ₹{FREE_DELIVERY_THRESHOLD - subtotal} more</span>
              </div>
            )}
            <div className={styles.mobileSummaryRow}>
              <span>Packaging Fee</span>
              <span>Included</span>
            </div>
            <div className={`${styles.mobileSummaryRow} ${styles.mobileTotal}`}>
              <span>Total Amount</span>
              <span>₹{totalAmount}</span>
            </div>
            <div className={styles.mobileSavings}>
              <FiCheckCircle /> You will save ₹{(totalAmount * 0.1).toFixed(0)} on this order
            </div>
          </div>
          
          <div className={styles.mobileDeliveryInfo}>
            <div className={styles.mobileDeliveryItem}>
              <FiTruck />
              <div>
                <strong>Free Delivery</strong>
                <span>on orders above ₹{FREE_DELIVERY_THRESHOLD}</span>
              </div>
            </div>
            <div className={styles.mobileDeliveryItem}>
              <FiShield />
              <div>
                <strong>Safe & Secure</strong>
                <span>COD available</span>
              </div>
            </div>
          </div>

          <button onClick={handleCheckout} className={styles.mobileCheckoutBtn} disabled={updating}>
            Proceed to Checkout • ₹{totalAmount}
          </button>
          
          <Link to="/products" className={styles.mobileContinueBtn}>
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  // ============================================
  // DESKTOP CART UI
  // ============================================
  return (
    <div className={styles.cartPage}>
      <div className={styles.container}>
        <div className={styles.breadcrumb}>
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/products">Products</Link>
          <span>/</span>
          <span className={styles.current}>Cart</span>
        </div>

        {addToCartMessage && (
          <div className={`${styles.addToCartToast} ${styles[addToCartMessage.type]}`}>
            <FiCheckCircle />
            {addToCartMessage.text}
          </div>
        )}
        {message && (
          <div className={`${styles.messageBanner} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}
        
        <div className={styles.cartLayout}>
          {/* Left Column */}
          <div className={styles.cartLeft}>
            <div className={styles.cartHeader}>
              <h1>Shopping Cart</h1>
              <p>{totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}</p>
            </div>

            <div className={styles.cartTable}>
              <div className={styles.cartTableHeader}>
                <div className={styles.productCol}>Product</div>
                <div className={styles.priceCol}>Price</div>
                <div className={styles.qtyCol}>Quantity</div>
                <div className={styles.totalCol}>Total</div>
                <div className={styles.actionCol}></div>
              </div>
              
              {/* Regular Products */}
              {cartItems.map((item) => (
                <div key={`product-${item.id}`} className={styles.cartTableRow}>
                  <div className={styles.productInfo}>
                    <img 
                      src={getProductImage(item.products)} 
                      alt={item.products?.name}
                      className={styles.productImage}
                    />
                    <div className={styles.productDetails}>
                      <h3>{item.products?.name}</h3>
                      {item.size && <p className={styles.productSize}>Size: {item.size}</p>}
                      <p className={styles.productStock}>
                        {item.products?.stock_quantity > 10 ? (
                          <span className={styles.inStock}>In Stock</span>
                        ) : item.products?.stock_quantity > 0 ? (
                          <span className={styles.lowStock}>Only {item.products?.stock_quantity} left</span>
                        ) : (
                          <span className={styles.outOfStock}>Out of Stock</span>
                        )}
                      </p>

                      <div className={styles.giftPackingRow}>
                        <label className={styles.giftCheckboxLabel}>
                          <input
                            type="checkbox"
                            checked={!!item.gift_packing}
                            onChange={() => toggleGiftPacking(item.id, item.gift_packing)}
                            disabled={updating}
                          />
                          <FiGift className={styles.giftIcon} />
                          Gift Packing <span className={styles.giftCharge}>(+₹{GIFT_PACKING_CHARGE})</span>
                        </label>
                        {item.gift_packing && (
                          <input
                            type="text"
                            className={styles.giftQuoteInput}
                            placeholder="Write a gift message (optional)"
                            value={item.gift_quote || ''}
                            onChange={(e) => handleGiftQuoteChange(item.id, e.target.value)}
                            onBlur={(e) => saveGiftQuote(item.id, e.target.value)}
                            maxLength={120}
                          />
                        )}
                      </div>

                      <button onClick={() => removeItem(item.id, 'product')} className={styles.removeBtnDesktop} disabled={updating}>
                        <FiTrash2 /> Remove
                      </button>
                    </div>
                  </div>
                  <div className={styles.priceInfo}>
                    <span className={styles.priceAmount}>₹{item.products?.price}</span>
                    {item.gift_packing && (
                      <span className={styles.giftPriceTag}>+₹{GIFT_PACKING_CHARGE} gift</span>
                    )}
                  </div>
                  <div className={styles.quantityInfo}>
                    <div className={styles.quantityControl}>
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1, 'product')} disabled={updating}>
                        <FiMinus />
                      </button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1, 'product')} disabled={updating}>
                        <FiPlus />
                      </button>
                    </div>
                  </div>
                  <div className={styles.totalInfo}>
                    <span className={styles.totalAmount}>
                      ₹{item.products?.price * item.quantity + (item.gift_packing ? GIFT_PACKING_CHARGE : 0)}
                    </span>
                  </div>
                  <div className={styles.actionInfo}>
                    <button onClick={() => removeItem(item.id, 'product')} className={styles.removeIconBtn} disabled={updating}>
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))}

              {/* Hampers */}
              {cartHampers.map((hamper) => (
                <div key={`hamper-${hamper.id}`} className={styles.cartTableRow}>
                  <div className={styles.productInfo}>
                    <img 
                      src={getHamperImage(hamper.hampers)} 
                      alt={hamper.hampers?.name}
                      className={styles.productImage}
                    />
                    <div className={styles.productDetails}>
                      <h3>
                        <FiGift className={styles.hamperIcon} /> {hamper.hampers?.name}
                      </h3>
                      <span className={styles.hamperBadgeDesktop}>🎁 Gift Hamper</span>
                      <button onClick={() => removeItem(hamper.id, 'hamper')} className={styles.removeBtnDesktop} disabled={updating}>
                        <FiTrash2 /> Remove
                      </button>
                    </div>
                  </div>
                  <div className={styles.priceInfo}>
                    <span className={styles.priceAmount}>₹{hamper.hampers?.price}</span>
                  </div>
                  <div className={styles.quantityInfo}>
                    <div className={styles.quantityControl}>
                      <button onClick={() => updateQuantity(hamper.id, hamper.quantity - 1, 'hamper')} disabled={updating}>
                        <FiMinus />
                      </button>
                      <span>{hamper.quantity}</span>
                      <button onClick={() => updateQuantity(hamper.id, hamper.quantity + 1, 'hamper')} disabled={updating}>
                        <FiPlus />
                      </button>
                    </div>
                  </div>
                  <div className={styles.totalInfo}>
                    <span className={styles.totalAmount}>₹{getHamperTotalPrice(hamper)}</span>
                  </div>
                  <div className={styles.actionInfo}>
                    <button onClick={() => removeItem(hamper.id, 'hamper')} className={styles.removeIconBtn} disabled={updating}>
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Link to="/products" className={styles.continueShopping}>
              <FiChevronRight /> Continue Shopping
            </Link>
          </div>

          {/* Right Column */}
          <div className={styles.cartRight}>
            <div className={styles.orderSummary}>
              <h3>Price Details</h3>
              <div className={styles.summaryDetails}>
                <div className={styles.summaryRow}>
                  <span>Price ({totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'})</span>
                  <span>₹{subtotal}</span>
                </div>
                {giftCharges > 0 && (
                  <div className={styles.summaryRow}>
                    <span>
                      <FiGift style={{ verticalAlign: 'middle', marginRight: 4 }} />
                      Gift Packing
                    </span>
                    <span>₹{giftCharges}</span>
                  </div>
                )}
                <div className={styles.summaryRow}>
                  <span>Delivery Fee</span>
                  <span className={deliveryCharge === 0 ? styles.free : ''}>
                    {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
                  </span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Packaging Fee</span>
                  <span>Included</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>COD Charges</span>
                  <span>₹0</span>
                </div>
                <div className={`${styles.summaryRow} ${styles.total}`}>
                  <span>Total Amount</span>
                  <span>₹{totalAmount}</span>
                </div>
              </div>
              
              {deliveryCharge > 0 && (
                <div className={styles.deliveryThresholdMessage}>
                  <FiTruck />
                  <span>Add ₹{FREE_DELIVERY_THRESHOLD - subtotal} more to get FREE Delivery</span>
                </div>
              )}
              
              <div className={styles.savingsInfo}>
                <FiCheckCircle />
                <span>You will save ₹{(totalAmount * 0.1).toFixed(0)} on this order</span>
              </div>
              
              <div className={styles.deliveryInfo}>
                <div className={styles.deliveryItem}>
                  <FiTruck />
                  <div>
                    <strong>Free Delivery</strong>
                    <p>on orders above ₹{FREE_DELIVERY_THRESHOLD}</p>
                  </div>
                </div>
                <div className={styles.deliveryItem}>
                  <FiShield />
                  <div>
                    <strong>Secure Payment</strong>
                    <p>Cash on Delivery available</p>
                  </div>
                </div>
                <div className={styles.deliveryItem}>
                  <FiClock />
                  <div>
                    <strong>Estimated Delivery</strong>
                    <p>3-5 business days</p>
                  </div>
                </div>
              </div>
              
              <button onClick={handleCheckout} className={styles.checkoutBtn} disabled={updating}>
                Proceed to Checkout → ₹{totalAmount}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;