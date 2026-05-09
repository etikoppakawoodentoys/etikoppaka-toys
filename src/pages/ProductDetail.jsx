import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { 
  FiArrowLeft, 
  FiMinus, 
  FiPlus, 
  FiShoppingCart, 
  FiTruck, 
  FiDollarSign, 
  FiRefreshCw,
  FiShare2,
  FiStar,
  FiCheck,
  FiPackage,
  FiMessageSquare,
  FiUser,
  FiCalendar,
  FiThumbsUp,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import { FaLeaf, FaHandSpock, FaAward, FaStar, FaStarHalfAlt } from 'react-icons/fa';
import styles from './ProductDetail.module.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [productImages, setProductImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [showReviews, setShowReviews] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchProduct();
    getCurrentUser();
  }, [id]);

  useEffect(() => {
    if (product) {
      fetchReviews();
    }
  }, [product]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      setUserProfile(data);
    }
  };

  const parseProductImages = (product) => {
    let images = [];
    
    if (product.images) {
      try {
        const parsedImages = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
        if (Array.isArray(parsedImages) && parsedImages.length > 0) {
          images = parsedImages;
        }
      } catch(e) {
        console.error('Error parsing images:', e);
      }
    }
    
    if (images.length === 0 && product.image_url) {
      images = [product.image_url];
    }
    
    if (images.length === 0) {
      images = ['/images/placeholder.jpg'];
    }
    
    return images;
  };

  const fetchProduct = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (data && !error) {
      setProduct(data);
      
      const images = parseProductImages(data);
      setProductImages(images);
      
      const { data: related } = await supabase
        .from('products')
        .select('*')
        .neq('id', id)
        .limit(4);
      
      if (related) {
        setRelatedProducts(related);
      }
      
      const { data: sizes } = await supabase
        .from('product_sizes')
        .select('*')
        .eq('product_id', id);
      
      if (sizes && sizes.length > 0) {
        setSelectedSize(sizes[0].size);
      } else {
        setSelectedSize('Standard');
      }
    }
    setLoading(false);
  };

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        users:user_id (name, email)
      `)
      .eq('product_id', id)
      .order('created_at', { ascending: false });

    if (data && !error) {
      setReviews(data);
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      setReviewMessage('Please login to submit a review');
      setTimeout(() => setReviewMessage(''), 3000);
      navigate('/login');
      return;
    }

    if (!reviewText.trim()) {
      setReviewMessage('Please write your review');
      setTimeout(() => setReviewMessage(''), 3000);
      return;
    }

    setSubmittingReview(true);
    setReviewMessage('');

    const { error } = await supabase
      .from('reviews')
      .insert({
        product_id: id,
        user_id: user.id,
        rating: reviewRating,
        comment: reviewText
      });

    if (error) {
      setReviewMessage('Failed to submit review. Please try again.');
    } else {
      setReviewMessage('Review submitted successfully!');
      setReviewText('');
      setReviewRating(5);
      await fetchReviews();
      setShowReviews(true);
    }

    setTimeout(() => setReviewMessage(''), 3000);
    setSubmittingReview(false);
  };

  const handleAddToCart = async () => {
    // Check if product is out of stock
    if (product.stock_quantity === 0) {
      return;
    }

    if (!user) {
      navigate('/login');
      return;
    }

    setAddingToCart(true);

    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', user.id)
      .eq('product_id', product.id)
      .eq('size', selectedSize)
      .single();

    if (existingItem) {
      await supabase
        .from('cart_items')
        .update({ quantity: existingItem.quantity + quantity })
        .eq('id', existingItem.id);
    } else {
      await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          product_id: product.id,
          quantity: quantity,
          size: selectedSize
        });
    }

    setAddingToCart(false);
    
    const btn = document.querySelector(`.${styles.addToCartBtn}`);
    const originalText = btn?.innerHTML;
    if (btn) {
      btn.innerHTML = '✓ Added to Cart!';
      setTimeout(() => {
        btn.innerHTML = originalText;
      }, 2000);
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const productName = product?.name || 'Product';
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: productName,
          text: `Check out this beautiful product from Etikoppaka Toys!`,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Share cancelled or failed:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShowShareTooltip(true);
        setTimeout(() => setShowShareTooltip(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
        alert('Press Ctrl+C to copy the link');
      }
    }
  };

  const nextImage = () => {
    if (productImages.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
    }
  };

  const prevImage = () => {
    if (productImages.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
    }
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<FaStar key={i} className={styles.starFilled} />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<FaStarHalfAlt key={i} className={styles.starHalf} />);
      } else {
        stars.push(<FaStar key={i} className={styles.starEmpty} />);
      }
    }
    return stars;
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className={styles.notFoundContainer}>
        <div className={styles.notFound}>
          <div className={styles.notFoundIcon}>🔍</div>
          <h2>Product Not Found</h2>
          <p>The product you're looking for doesn't exist or has been removed.</p>
          <button onClick={() => navigate('/products')} className={styles.backToShopBtn}>
            Back to Shop
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // MOBILE UI (All Images Visible with Horizontal Scroll)
  // ============================================
  if (isMobile) {
    return (
      <div className={styles.mobileProductDetail}>
        {/* Mobile Header */}
        <div className={styles.mobileHeader}>
          <button onClick={() => navigate(-1)} className={styles.mobileBackBtn}>
            <FiArrowLeft />
          </button>
          <h1>Product Details</h1>
          <button className={styles.mobileShareBtn} onClick={handleShare}>
            <FiShare2 />
          </button>
        </div>

        {/* Mobile Image Gallery - All Images Visible */}
        <div className={styles.mobileImageGallery}>
          {/* Horizontal scrollable thumbnails */}
          <div className={styles.mobileImageScroll}>
            {productImages.map((img, idx) => (
              <div 
                key={idx} 
                className={`${styles.mobileImageItem} ${currentImageIndex === idx ? styles.active : ''}`}
                onClick={() => setCurrentImageIndex(idx)}
              >
                <img src={img} alt={`${product.name} ${idx + 1}`} />
              </div>
            ))}
          </div>
          
          {/* Main selected image */}
          <div className={styles.mobileMainImage}>
            <img src={productImages[currentImageIndex]} alt={product.name} />
            {product.is_bulk_order && <span className={styles.mobileBulkBadge}>Bulk Order</span>}
            <button className={styles.mobileShareIcon} onClick={handleShare}>
              <FiShare2 />
            </button>
          </div>
          
          {/* Image indicators */}
          {productImages.length > 1 && (
            <div className={styles.mobileImageIndicators}>
              {productImages.map((_, idx) => (
                <span
                  key={idx}
                  className={`${styles.mobileIndicator} ${currentImageIndex === idx ? styles.active : ''}`}
                  onClick={() => setCurrentImageIndex(idx)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Mobile Product Info */}
        <div className={styles.mobileProductInfo}>
          <h2>{product.name}</h2>
          <div className={styles.mobileRating}>
            <div className={styles.mobileStars}>{renderStars(calculateAverageRating())}</div>
            <span>({reviews.length} reviews)</span>
          </div>
          <div className={styles.mobilePrice}>₹{product.price}</div>
          
          <div className={styles.mobileStock}>
            {product.stock_quantity > 0 ? (
              <span className={styles.inStock}>✓ In Stock</span>
            ) : (
              <span className={styles.outOfStock}>✗ Out of Stock</span>
            )}
          </div>

          <div className={styles.mobileDescription}>
            <p>{product.description || 'This beautiful handcrafted toy is made with natural colors and sustainable wood.'}</p>
          </div>

          {/* Size Selection */}
          <div className={styles.mobileSizeSection}>
            <label>Select Size</label>
            <div className={styles.mobileSizeOptions}>
              {['Small', 'Medium', 'Large', 'Extra Large'].map(size => (
                <button
                  key={size}
                  className={`${styles.mobileSizeBtn} ${selectedSize === size ? styles.active : ''}`}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Selection */}
          <div className={styles.mobileQuantitySection}>
            <label>Quantity</label>
            <div className={styles.mobileQuantityControl}>
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>
                <FiMinus />
              </button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} disabled={product.stock_quantity <= quantity}>
                <FiPlus />
              </button>
            </div>
          </div>

          {/* UPDATED: Mobile Add to Cart Button with Out of Stock styling */}
          <button 
            className={styles.mobileAddToCartBtn}
            onClick={handleAddToCart}
            disabled={addingToCart || product.stock_quantity === 0}
            style={product.stock_quantity === 0 ? { background: '#ccc', cursor: 'not-allowed', opacity: 0.6 } : {}}
          >
            <FiShoppingCart />
            {product.stock_quantity === 0 ? (
              'Out of Stock'
            ) : (
              addingToCart ? 'Adding...' : `Add to Cart • ₹${product.price * quantity}`
            )}
          </button>

          {/* Delivery Info */}
          <div className={styles.mobileDeliveryInfo}>
            <div className={styles.mobileDeliveryItem}>
              <FiTruck />
              <span>Free Shipping on orders above ₹499</span>
            </div>
            <div className={styles.mobileDeliveryItem}>
              <FiDollarSign />
              <span>Cash on Delivery available</span>
            </div>
            <div className={styles.mobileDeliveryItem}>
              <FiRefreshCw />
              <span>7 days easy returns</span>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className={styles.mobileReviews}>
          <div className={styles.mobileReviewsHeader}>
            <h3>Customer Reviews</h3>
            <button onClick={() => setShowReviews(!showReviews)}>
              {showReviews ? 'Cancel' : 'Write a Review'}
            </button>
          </div>

          {showReviews && (
            <div className={styles.mobileWriteReview}>
              <div className={styles.mobileRatingSelect}>
                <label>Your Rating</label>
                <div className={styles.mobileRatingStars}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} onClick={() => setReviewRating(star)}>
                      {star <= reviewRating ? <FaStar className={styles.activeStar} /> : <FaStar className={styles.inactiveStar} />}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                rows="3"
                placeholder="Share your experience with this product..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
              />
              <button onClick={handleSubmitReview} disabled={submittingReview}>
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          )}

          <div className={styles.mobileReviewsList}>
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review.id} className={styles.mobileReviewCard}>
                  <div className={styles.mobileReviewHeader}>
                    <div className={styles.mobileReviewer}>
                      <div className={styles.mobileReviewerAvatar}>
                        {review.users?.name ? review.users.name[0].toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className={styles.mobileReviewerName}>{review.users?.name || 'Anonymous'}</div>
                        <div className={styles.mobileReviewStars}>{renderStars(review.rating)}</div>
                      </div>
                    </div>
                    <span className={styles.mobileReviewDate}>
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p>{review.comment}</p>
                </div>
              ))
            ) : (
              <p className={styles.mobileNoReviews}>No reviews yet. Be the first to review!</p>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className={styles.mobileRelated}>
            <h3>You May Also Like</h3>
            <div className={styles.mobileRelatedScroll}>
              {relatedProducts.map((relatedProduct) => (
                <Link to={`/product/${relatedProduct.id}`} key={relatedProduct.id} className={styles.mobileRelatedCard}>
                  <img src={parseProductImages(relatedProduct)[0] || relatedProduct.image_url || '/images/placeholder.jpg'} alt={relatedProduct.name} />
                  <div>
                    <h4>{relatedProduct.name}</h4>
                    <p>₹{relatedProduct.price}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================
  // DESKTOP UI (Premium Traditional Style)
  // ============================================
  return (
    <div className={styles.productDetailPage}>
      <div className={styles.container}>
        <div className={styles.breadcrumb}>
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/products">Products</Link>
          <span>/</span>
          <span className={styles.current}>{product.name}</span>
        </div>

        <div className={styles.productLayout}>
          {/* Left Column - Image Gallery */}
          <div className={styles.productGallery}>
            <div className={styles.mainImage}>
              <img src={productImages[currentImageIndex]} alt={product.name} />
              {product.is_bulk_order && <span className={styles.bulkBadge}>Bulk Order</span>}
              <div className={styles.shareContainer}>
                <button className={styles.shareBtn} onClick={handleShare}>
                  <FiShare2 />
                </button>
                {showShareTooltip && <span className={styles.shareTooltip}>Link copied!</span>}
              </div>
              {productImages.length > 1 && (
                <>
                  <button className={styles.navBtnPrev} onClick={prevImage}>
                    <FiChevronLeft />
                  </button>
                  <button className={styles.navBtnNext} onClick={nextImage}>
                    <FiChevronRight />
                  </button>
                </>
              )}
            </div>
            {productImages.length > 1 && (
              <div className={styles.thumbnailList}>
                {productImages.map((img, idx) => (
                  <div 
                    key={idx} 
                    className={`${styles.thumbnail} ${currentImageIndex === idx ? styles.active : ''}`}
                    onClick={() => setCurrentImageIndex(idx)}
                  >
                    <img src={img} alt={`${product.name} view ${idx + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Product Info */}
          <div className={styles.productInfo}>
            <h1 className={styles.productName}>{product.name}</h1>
            
            <div className={styles.ratingSection}>
              <div className={styles.stars}>{renderStars(calculateAverageRating())}</div>
              <span className={styles.reviewCount}>({reviews.length} reviews)</span>
            </div>

            <div className={styles.priceSection}>
              <span className={styles.currentPrice}>₹{product.price}</span>
            </div>

            <div className={styles.stockInfo}>
              {product.stock_quantity > 10 ? (
                <span className={styles.inStock}>✓ In Stock</span>
              ) : product.stock_quantity > 0 ? (
                <span className={styles.lowStock}>⚠ Only {product.stock_quantity} left</span>
              ) : (
                <span className={styles.outOfStock}>✗ Out of Stock</span>
              )}
            </div>

            <div className={styles.description}>
              <p>{product.description || 'This beautiful handcrafted toy is made with natural colors and sustainable wood. Each piece is unique and tells a story of traditional Indian craftsmanship.'}</p>
            </div>

            <div className={styles.sizeSection}>
              <div className={styles.sizeHeader}>
                <span>Size</span>
              </div>
              <div className={styles.sizeOptions}>
                {['Small', 'Medium', 'Large', 'Extra Large'].map(size => (
                  <button
                    key={size}
                    className={`${styles.sizeBtn} ${selectedSize === size ? styles.active : ''}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.quantitySection}>
              <div className={styles.quantityHeader}>
                <span>Quantity</span>
              </div>
              <div className={styles.quantityControl}>
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>
                  <FiMinus />
                </button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))} disabled={product.stock_quantity <= quantity}>
                  <FiPlus />
                </button>
              </div>
            </div>

            {/* UPDATED: Desktop Add to Cart Button with Out of Stock styling */}
            <button 
              className={styles.addToCartBtn}
              onClick={handleAddToCart}
              disabled={addingToCart || product.stock_quantity === 0}
              style={product.stock_quantity === 0 ? { background: '#ccc', cursor: 'not-allowed', opacity: 0.6 } : {}}
            >
              <FiShoppingCart />
              {product.stock_quantity === 0 ? (
                'Out of Stock'
              ) : (
                addingToCart ? 'Adding...' : 'Add to Cart'
              )}
            </button>

            <div className={styles.deliveryInfo}>
              <div className={styles.deliveryItem}>
                <FiTruck />
                <div>
                  <strong>Free Shipping</strong>
                  <span>on orders above ₹499</span>
                </div>
              </div>
              <div className={styles.deliveryItem}>
                <FiDollarSign />
                <div>
                  <strong>Cash on Delivery</strong>
                  <span>pay when you receive</span>
                </div>
              </div>
              <div className={styles.deliveryItem}>
                <FiRefreshCw />
                <div>
                  <strong>Easy Returns</strong>
                  <span>7 days policy</span>
                </div>
              </div>
            </div>

            <div className={styles.features}>
              <span><FaLeaf /> Eco-Friendly</span>
              <span><FaHandSpock /> Handcrafted</span>
              <span><FaAward /> GI Tagged</span>
              <span><FiPackage /> Safe Packaging</span>
            </div>
          </div>
        </div>

        {/* Reviews Section - Desktop */}
        <div className={styles.reviewsSection}>
          <div className={styles.reviewsHeader}>
            <div className={styles.reviewsTitle}>
              <FiMessageSquare />
              <h3>Customer Reviews</h3>
            </div>
            <div className={styles.reviewsStats}>
              <div className={styles.avgRating}>
                <span className={styles.avgNumber}>{calculateAverageRating()}</span>
                <div className={styles.avgStars}>{renderStars(calculateAverageRating())}</div>
                <span>{reviews.length} reviews</span>
              </div>
              <button 
                className={styles.writeReviewBtn}
                onClick={() => setShowReviews(!showReviews)}
              >
                {showReviews ? 'Cancel' : 'Write Review'}
              </button>
            </div>
          </div>

          {showReviews && (
            <div className={styles.writeReviewForm}>
              <h4>Write Your Review</h4>
              {reviewMessage && (
                <div className={`${styles.reviewMessage} ${reviewMessage.includes('success') ? styles.success : styles.error}`}>
                  {reviewMessage}
                </div>
              )}
              <div className={styles.ratingInput}>
                <label>Rating</label>
                <div className={styles.ratingStars}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} onClick={() => setReviewRating(star)}>
                      {star <= reviewRating ? <FaStar className={styles.activeStar} /> : <FaStar className={styles.inactiveStar} />}
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.reviewInput}>
                <label>Your Review</label>
                <textarea
                  rows="3"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your experience with this product..."
                />
              </div>
              <button onClick={handleSubmitReview} disabled={submittingReview}>
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          )}

          <div className={styles.reviewsList}>
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review.id} className={styles.reviewCard}>
                  <div className={styles.reviewHeader}>
                    <div className={styles.reviewerInfo}>
                      <div className={styles.reviewerAvatar}>
                        {review.users?.name ? review.users.name[0].toUpperCase() : 'U'}
                      </div>
                      <div>
                        <span className={styles.reviewerName}>{review.users?.name || 'Anonymous'}</span>
                        <div className={styles.reviewStars}>{renderStars(review.rating)}</div>
                      </div>
                    </div>
                    <span className={styles.reviewDate}>
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className={styles.reviewComment}>{review.comment}</p>
                </div>
              ))
            ) : (
              <div className={styles.noReviews}>
                <p>No reviews yet. Be the first to review!</p>
              </div>
            )}
          </div>
        </div>

        {/* Related Products - Desktop */}
        {relatedProducts.length > 0 && (
          <div className={styles.relatedSection}>
            <div className={styles.relatedHeader}>
              <h3>You May Also Like</h3>
            </div>
            <div className={styles.relatedGrid}>
              {relatedProducts.map((relatedProduct) => (
                <div key={relatedProduct.id} className={styles.relatedCard}>
                  <Link to={`/product/${relatedProduct.id}`}>
                    <div className={styles.relatedImage}>
                      <img src={parseProductImages(relatedProduct)[0] || relatedProduct.image_url || '/images/placeholder.jpg'} alt={relatedProduct.name} />
                    </div>
                    <div className={styles.relatedInfo}>
                      <h4>{relatedProduct.name}</h4>
                      <div className={styles.relatedPrice}>₹{relatedProduct.price}</div>
                      <button className={styles.relatedBtn}>View</button>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;