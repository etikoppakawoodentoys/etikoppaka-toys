import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { 
  FiGift, FiShoppingCart, FiArrowLeft, FiChevronRight, 
  FiCheck, FiShare2, FiStar, FiTruck, 
  FiPackage, FiClock, FiShield, FiMinus, FiPlus,
  FiInfo, FiRotateCcw
} from 'react-icons/fi';
import styles from './HamperDetail.module.css';

const HamperDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hamper, setHamper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showShareTooltip, setShowShareTooltip] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    checkAuth();
    fetchHamperDetail();
  }, [id]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsLoggedIn(!!user);
    console.log('User logged in:', !!user);
  };

  const fetchHamperDetail = async () => {
    setLoading(true);
    try {
      const { data: hamperData, error: hamperError } = await supabase
        .from('hampers')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (hamperError) throw hamperError;
      if (!hamperData) throw new Error('Hamper not found');

      const { data: itemsData, error: itemsError } = await supabase
        .from('hamper_items')
        .select('*')
        .eq('hamper_id', id);

      if (itemsError) throw itemsError;

      const productIds = itemsData?.map(item => item.product_id) || [];
      let productsData = [];
      
      if (productIds.length > 0) {
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('*')
          .in('id', productIds);
        
        if (!productsError && products) {
          productsData = products;
        }
      }

      const hamperItems = itemsData.map(item => ({
        ...item,
        products: productsData.find(p => p.id === item.product_id)
      }));

      const completeHamper = {
        ...hamperData,
        hamper_items: hamperItems
      };

      setHamper(completeHamper);
      
    } catch (err) {
      console.error('Error fetching hamper:', err);
      setMessage({ type: 'error', text: err.message || 'Hamper not found' });
      setTimeout(() => navigate('/hampers'), 2000);
    }
    setLoading(false);
  };

  const getHamperImages = () => {
    if (hamper?.images) {
      try {
        const images = JSON.parse(hamper.images);
        if (images && images.length > 0) return images;
      } catch(e) {}
    }
    return hamper?.image_url ? [hamper.image_url] : ['/images/hamper-placeholder.jpg'];
  };

  const getProductImage = (product) => {
    if (product?.images) {
      try {
        const images = JSON.parse(product.images);
        if (images && images.length > 0) return images[0];
      } catch(e) {}
    }
    return product?.image_url || '/images/product-placeholder.jpg';
  };

  const calculateTotalPrice = () => {
    if (!hamper) return 0;
    let total = 0;
    hamper.hamper_items.forEach(item => {
      total += (item.products.price * item.quantity);
    });
    return total;
  };

  const addToCart = async () => {
    if (!isLoggedIn) {
      setMessage({ type: 'error', text: 'Please login to add items to cart' });
      setTimeout(() => setMessage(''), 3000);
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    setAddingToCart(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not found');
      }

      const hamperId = parseInt(id);
      const quantityToAdd = quantity;

      console.log('Adding hamper to cart:', {
        user_id: user.id,
        hamper_id: hamperId,
        quantity: quantityToAdd
      });

      // First, check if cart_hampers table exists and we can query it
      const { data: tableCheck, error: tableError } = await supabase
        .from('cart_hampers')
        .select('count')
        .limit(1);

      if (tableError) {
        console.error('cart_hampers table error:', tableError);
        setMessage({ type: 'error', text: 'Database table issue. Please contact support.' });
        setAddingToCart(false);
        return;
      }

      // Check if hamper already exists in cart_hampers
      const { data: existingHamper, error: checkError } = await supabase
        .from('cart_hampers')
        .select('*')
        .eq('user_id', user.id)
        .eq('hamper_id', hamperId)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing hamper:', checkError);
        throw checkError;
      }

      let result;
      if (existingHamper) {
        // Update existing hamper quantity
        console.log('Updating existing hamper, current quantity:', existingHamper.quantity);
        const newQuantity = existingHamper.quantity + quantityToAdd;
        result = await supabase
          .from('cart_hampers')
          .update({ quantity: newQuantity })
          .eq('id', existingHamper.id);
        
        if (result.error) throw result.error;
        console.log('Hamper quantity updated successfully to:', newQuantity);
      } else {
        // Add new hamper to cart
        console.log('Adding new hamper to cart');
        result = await supabase
          .from('cart_hampers')
          .insert({
            user_id: user.id,
            hamper_id: hamperId,
            quantity: quantityToAdd
          });
        
        if (result.error) throw result.error;
        console.log('New hamper added successfully');
      }
      
      // Dispatch custom event for cart update
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      
      setAddedToCart(true);
      setMessage({ type: 'success', text: `${hamper.name} (${quantity}) added to cart!` });
      
      setTimeout(() => {
        setAddedToCart(false);
        setMessage('');
      }, 3000);
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to add to cart. Please try again.' });
      setTimeout(() => setMessage(''), 3000);
    }
    
    setAddingToCart(false);
  };

  const proceedToCheckout = async () => {
    await addToCart();
    navigate('/checkout');
  };

  const handleQuantityChange = (delta) => {
    const newQty = quantity + delta;
    if (newQty >= 1 && newQty <= 10) {
      setQuantity(newQty);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setShowShareTooltip(true);
      setTimeout(() => setShowShareTooltip(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading gift hamper details...</p>
      </div>
    );
  }

  if (!hamper) {
    return (
      <div className={styles.notFoundContainer}>
        <div className={styles.notFound}>
          <div className={styles.notFoundIcon}>🎁</div>
          <h2>Hamper Not Found</h2>
          <p>The gift hamper you're looking for doesn't exist or has been removed.</p>
          <Link to="/hampers">
            <button className={styles.backToShopBtn}>Browse Hampers</button>
          </Link>
        </div>
      </div>
    );
  }

  const images = getHamperImages();
  const totalPrice = calculateTotalPrice();

  // Mobile UI
  if (isMobile) {
    return (
      <div className={styles.mobileProductDetail}>
        {message && (
          <div className={`${styles.mobileAddToCartToast} ${message.type === 'success' ? styles.success : styles.error}`}>
            {message.type === 'success' ? <FiCheck /> : <FiInfo />}
            {message.text}
          </div>
        )}

        <div className={styles.mobileHeader}>
          <button onClick={() => navigate(-1)} className={styles.mobileBackBtn}>
            <FiArrowLeft />
          </button>
          <h1>Gift Hamper</h1>
          <button onClick={handleShare} className={styles.mobileShareBtn}>
            <FiShare2 />
          </button>
        </div>

        <div className={styles.mobileImageGallery}>
          <div className={styles.mobileImageScroll}>
            {images.map((img, idx) => (
              <div 
                key={idx} 
                className={`${styles.mobileImageItem} ${activeImage === idx ? styles.active : ''}`}
                onClick={() => setActiveImage(idx)}
              >
                <img src={img} alt={`${hamper.name} ${idx + 1}`} />
              </div>
            ))}
          </div>
          
          <div className={styles.mobileMainImage}>
            <img src={images[activeImage]} alt={hamper.name} />
            <div className={styles.mobileBulkBadge}>
              <FiGift /> Premium Hamper
            </div>
            <div className={styles.mobileShareIcon} onClick={handleShare}>
              <FiShare2 />
            </div>
          </div>
          
          <div className={styles.mobileImageIndicators}>
            {images.map((_, idx) => (
              <div 
                key={idx} 
                className={`${styles.mobileIndicator} ${activeImage === idx ? styles.active : ''}`}
                onClick={() => setActiveImage(idx)}
              />
            ))}
          </div>
        </div>

        <div className={styles.mobileProductInfo}>
          <h2>{hamper.name}</h2>
          
          <div className={styles.mobileRating}>
            <div className={styles.mobileStars}>
              {[...Array(5)].map((_, i) => (
                <FiStar key={i} color={i < 4 ? "#F59E0B" : "#E8DCC8"} size={12} />
              ))}
            </div>
            <span>({hamper.hamper_items?.length || 0} items)</span>
          </div>

          <div className={styles.mobilePriceSection}>
            <div className={styles.mobilePriceRow}>
              <div className={styles.mobileDealPrice}>₹{totalPrice}</div>
              {hamper.price > totalPrice && (
                <>
                  <div className={styles.mobileOriginalPrice}>₹{hamper.price}</div>
                  <div className={styles.mobileDiscountTag}>Save ₹{hamper.price - totalPrice}</div>
                </>
              )}
            </div>
          </div>

          <div className={styles.mobileStock}>
            <span className={styles.inStock}>
              <FiCheck /> In Stock
            </span>
          </div>

          <div className={styles.mobileDescription}>
            <p>{hamper.description || "A beautifully curated gift hamper featuring handpicked premium products."}</p>
          </div>

          <div className={styles.mobileItemsSection}>
            <h4>🎁 What's Inside</h4>
            <div className={styles.mobileItemsGrid}>
              {hamper.hamper_items.map((item, idx) => (
                <div key={idx} className={styles.mobileItemCard}>
                  <div className={styles.mobileItemImage}>
                    <img src={getProductImage(item.products)} alt={item.products.name} />
                  </div>
                  <div className={styles.mobileItemDetails}>
                    <div className={styles.mobileItemName}>{item.products.name}</div>
                    <div className={styles.mobileItemMeta}>
                      <span className={styles.mobileItemQuantity}>{item.quantity}</span>
                      <span className={styles.mobileItemPrice}>₹{item.products.price}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.mobileQuantitySection}>
            <label>Quantity</label>
            <div className={styles.mobileQuantityControl}>
              <button onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>
                <FiMinus />
              </button>
              <span>{quantity}</span>
              <button onClick={() => handleQuantityChange(1)} disabled={quantity >= 10}>
                <FiPlus />
              </button>
            </div>
          </div>

          <button 
            className={styles.mobileAddToCartBtn}
            onClick={addToCart}
            disabled={addingToCart}
          >
            {addingToCart ? (
              <div className={styles.loadingSpinner} style={{ width: 20, height: 20 }} />
            ) : addedToCart ? (
              <><FiCheck /> Added to Cart</>
            ) : (
              <><FiShoppingCart /> Add to Cart • ₹{totalPrice * quantity}</>
            )}
          </button>

          <div className={styles.mobileDeliveryInfo}>
            <div className={styles.mobileDeliveryItem}>
              <FiTruck />
              <span>Free delivery on orders above ₹499</span>
            </div>
            <div className={styles.mobileDeliveryItem}>
              <FiShield />
              <span>Premium quality guaranteed</span>
            </div>
            <div className={styles.mobileDeliveryItem}>
              <FiClock />
              <span>Estimated delivery: 3-5 business days</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop UI
  return (
    <div className={styles.productDetailPage}>
      <div className={styles.container}>
        <div className={styles.breadcrumb}>
          <Link to="/">Home</Link>
          <FiChevronRight />
          <Link to="/hampers">Gift Hampers</Link>
          <FiChevronRight />
          <span className={styles.current}>{hamper.name}</span>
        </div>

        <div className={styles.productLayout}>
          <div className={styles.productGallery}>
            <div className={styles.mainImage}>
              <img src={images[activeImage]} alt={hamper.name} />
              <div className={styles.bulkBadge}>
                <FiGift /> Premium Hamper
              </div>
              <div className={styles.shareContainer}>
                <button onClick={handleShare} className={styles.shareBtn}>
                  <FiShare2 />
                </button>
                {showShareTooltip && <span className={styles.shareTooltip}>Link copied!</span>}
              </div>
            </div>
            
            <div className={styles.thumbnailList}>
              {images.map((img, idx) => (
                <div 
                  key={idx} 
                  className={`${styles.thumbnail} ${activeImage === idx ? styles.active : ''}`}
                  onClick={() => setActiveImage(idx)}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} />
                </div>
              ))}
            </div>
          </div>

          <div className={styles.productInfo}>
            <h1 className={styles.productName}>{hamper.name}</h1>
            
            <div className={styles.ratingSection}>
              <div className={styles.stars}>
                {[...Array(5)].map((_, i) => (
                  <FiStar key={i} className={i < 4 ? styles.starFilled : styles.starEmpty} />
                ))}
              </div>
              <span className={styles.reviewCount}>{hamper.hamper_items?.length || 0} Premium Items</span>
            </div>

            <div className={styles.priceSection}>
              <div className={styles.priceRow}>
                <span className={styles.currentPrice}>₹{totalPrice}</span>
                {hamper.price > totalPrice && (
                  <>
                    <span className={styles.originalPrice}>₹{hamper.price}</span>
                    <span className={styles.discountBadge}>Save ₹{hamper.price - totalPrice}</span>
                  </>
                )}
              </div>
            </div>

            <div className={styles.stockInfo}>
              <span className={styles.inStock}>
                <FiCheck /> In Stock
              </span>
            </div>

            <div className={styles.description}>
              <p>{hamper.description || "A beautifully curated gift hamper featuring handpicked premium products. Perfect for gifting on special occasions like birthdays, anniversaries, festivals, or just to show you care."}</p>
            </div>

            <div className={styles.itemsSection}>
              <h3>🎁 What's Inside</h3>
              <div className={styles.itemsGrid}>
                {hamper.hamper_items.map((item, idx) => (
                  <div key={idx} className={styles.itemCard}>
                    <div className={styles.itemImage}>
                      <img src={getProductImage(item.products)} alt={item.products.name} />
                    </div>
                    <div className={styles.itemDetails}>
                      <div className={styles.itemName}>{item.products.name}</div>
                      <div className={styles.itemMeta}>
                        <span className={styles.itemQuantity}>{item.quantity}</span>
                        <span className={styles.itemPrice}>₹{item.products.price}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.quantitySection}>
              <h3>Quantity</h3>
              <div className={styles.quantityControl}>
                <button onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>
                  <FiMinus />
                </button>
                <span>{quantity}</span>
                <button onClick={() => handleQuantityChange(1)} disabled={quantity >= 10}>
                  <FiPlus />
                </button>
              </div>
            </div>

            <button 
              className={styles.addToCartBtn}
              onClick={addToCart}
              disabled={addingToCart}
            >
              {addingToCart ? (
                <>Adding to Cart...</>
              ) : addedToCart ? (
                <><FiCheck /> Added to Cart</>
              ) : (
                <><FiShoppingCart /> Add to Cart • ₹{totalPrice * quantity}</>
              )}
            </button>

            <div className={styles.deliveryInfo}>
              <div className={styles.deliveryItem}>
                <FiTruck />
                <div>
                  <strong>Free Delivery</strong>
                  <span>on orders above ₹499</span>
                </div>
              </div>
              <div className={styles.deliveryItem}>
                <FiShield />
                <div>
                  <strong>Secure Payment</strong>
                  <span>100% secure transactions</span>
                </div>
              </div>
              <div className={styles.deliveryItem}>
                <FiClock />
                <div>
                  <strong>Easy Returns</strong>
                  <span>7 days return policy</span>
                </div>
              </div>
            </div>

            <div className={styles.features}>
              <span><FiGift /> Premium Quality</span>
              <span>🎀 Ready to Gift</span>
              <span>✨ Handpicked Items</span>
              <span>💝 Best Value</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HamperDetail;