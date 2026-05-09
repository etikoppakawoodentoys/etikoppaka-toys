import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { FiClock, FiTag, FiZap, FiGift, FiArrowRight, FiShoppingBag } from 'react-icons/fi';
import { FaFire } from 'react-icons/fa';
import styles from './Deals.module.css';

const Deals = () => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredDeal, setHoveredDeal] = useState(null);
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
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    const { data, error } = await supabase
      .from('deals')
      .select(`
        *,
        products (*)
      `)
      .eq('is_active', true)
      .lte('start_date', new Date().toISOString().split('T')[0])
      .gte('end_date', new Date().toISOString().split('T')[0])
      .order('created_at', { ascending: false });

    if (data && !error) {
      setDeals(data);
    }
    setLoading(false);
  };

  const calculateDiscount = (originalPrice, dealPrice) => {
    return Math.round(((originalPrice - dealPrice) / originalPrice) * 100);
  };

  const getTimeRemaining = (endDate) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end - now;
    
    if (diff <= 0) return { text: 'Expired', isExpired: true };
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return { text: `${days}d ${hours}h`, isExpired: false };
    if (hours > 0) return { text: `${hours}h ${minutes}m`, isExpired: false };
    return { text: `${minutes}m`, isExpired: false };
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
        <p>Loading amazing deals...</p>
      </div>
    );
  }

  // ============================================
  // MOBILE UI (Swiggy/Zomato/Zepto Style)
  // ============================================
  if (isMobile) {
    return (
      <div className={styles.mobileDealsPage}>
        {/* Mobile Header */}
        <div className={styles.mobileHeader}>
          <h1>Hot Deals 🔥</h1>
          <p>Limited time offers</p>
        </div>

        {/* Mobile Deals List */}
        <div className={styles.mobileDealsList}>
          {deals.length === 0 ? (
            <div className={styles.mobileNoDeals}>
              <FiGift />
              <p>No active deals</p>
              <Link to="/products">Shop Now →</Link>
            </div>
          ) : (
            deals.map((deal) => {
              const timeRemaining = getTimeRemaining(deal.end_date);
              const discount = calculateDiscount(deal.products?.price, deal.deal_price);
              
              return (
                <Link to={`/product/${deal.product_id}`} key={deal.id} className={styles.mobileDealCard}>
                  <div className={styles.mobileDealImage}>
                    <img src={getProductImage(deal.products)} alt={deal.products?.name} />
                    <div className={styles.mobileDiscountBadge}>-{discount}%</div>
                    {!timeRemaining.isExpired && (
                      <div className={styles.mobileTimerBadge}>
                        <FiClock /> {timeRemaining.text}
                      </div>
                    )}
                  </div>
                  <div className={styles.mobileDealInfo}>
                    <h3>{deal.products?.name}</h3>
                    <div className={styles.mobilePrice}>
                      <span className={styles.mobileOriginalPrice}>₹{deal.products?.price}</span>
                      <span className={styles.mobileDealPrice}>₹{deal.deal_price}</span>
                    </div>
                    <div className={styles.mobileSavings}>
                      Save ₹{deal.products?.price - deal.deal_price}
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {/* Mobile Banner */}
        {deals.length > 0 && (
          <div className={styles.mobileBanner}>
            <div className={styles.mobileBannerIcon}>🎨</div>
            <div className={styles.mobileBannerText}>
              <strong>Free Shipping</strong>
              <span>on orders above ₹499</span>
            </div>
            <Link to="/products">Shop →</Link>
          </div>
        )}
      </div>
    );
  }

  // ============================================
  // DESKTOP UI (Premium Traditional Style)
  // ============================================
  return (
    <div className={styles.dealsPage}>
      {/* Hero Section */}
      <div className={styles.heroSection}>
        <div className={styles.heroPattern}></div>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <FaFire className={styles.fireIcon} />
            Limited Time Offers
          </div>
          <h1 className={styles.heroTitle}>
            Don't Miss These <span className={styles.highlight}>Amazing Deals!</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Grab your favorite traditional toys at unbeatable prices. 
            Hurry, these offers won't last forever!
          </p>
        </div>
        <div className={styles.heroDecoration}>
          <div className={styles.floatingIcon1}>🎁</div>
          <div className={styles.floatingIcon2}>🏷️</div>
          <div className={styles.floatingIcon3}>⭐</div>
        </div>
      </div>

      <div className={styles.container}>
        {deals.length === 0 ? (
          <div className={styles.noDeals}>
            <div className={styles.noDealsIcon}>
              <FiGift />
            </div>
            <h2>No Active Deals</h2>
            <p>Check back soon for amazing offers!</p>
            <Link to="/products" className={styles.shopBtn}>
              Explore Products <FiArrowRight />
            </Link>
          </div>
        ) : (
          <>
            <div className={styles.dealsHeader}>
              <div className={styles.headerLeft}>
                <FiZap className={styles.zapIcon} />
                <h2 className={styles.sectionTitle}>Hot Deals</h2>
              </div>
              <div className={styles.headerRight}>
                <span>{deals.length} active offers</span>
              </div>
            </div>

            <div className={styles.dealsGrid}>
              {deals.map((deal, index) => {
                const timeRemaining = getTimeRemaining(deal.end_date);
                const discount = calculateDiscount(deal.products?.price, deal.deal_price);
                
                return (
                  <div 
                    key={deal.id} 
                    className={`${styles.dealCard} ${hoveredDeal === deal.id ? styles.hovered : ''}`}
                    onMouseEnter={() => setHoveredDeal(deal.id)}
                    onMouseLeave={() => setHoveredDeal(null)}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className={styles.cardBadges}>
                      <div className={styles.discountBadge}>
                        <FiTag className={styles.discountIcon} />
                        {discount}% OFF
                      </div>
                      {!timeRemaining.isExpired && (
                        <div className={styles.timerBadge}>
                          <FiClock />
                          {timeRemaining.text} left
                        </div>
                      )}
                    </div>

                    <div className={styles.cardImage}>
                      <img src={getProductImage(deal.products)} alt={deal.products?.name} />
                      <div className={styles.imageOverlay}>
                        <div className={styles.quickActions}>
                          <Link to={`/product/${deal.product_id}`} className={styles.quickViewBtn}>
                            Quick View
                          </Link>
                        </div>
                      </div>
                    </div>

                    <div className={styles.cardContent}>
                      <h3 className={styles.productTitle}>{deal.products?.name}</h3>
                      <p className={styles.productDesc}>{deal.products?.description?.substring(0, 70)}...</p>
                      
                      <div className={styles.priceSection}>
                        <div className={styles.priceRow}>
                          <span className={styles.originalPrice}>₹{deal.products?.price}</span>
                          <span className={styles.dealPrice}>₹{deal.deal_price}</span>
                        </div>
                        <div className={styles.savings}>
                          You save <strong>₹{deal.products?.price - deal.deal_price}</strong>
                        </div>
                      </div>

                      <div className={styles.stockInfo}>
                        <div className={styles.stockBar}>
                          <div 
                            className={styles.stockFill} 
                            style={{ width: `${Math.min(100, (deal.products?.stock_quantity / 50) * 100)}%` }}
                          />
                        </div>
                        <span className={styles.stockText}>
                          Only {deal.products?.stock_quantity} left in stock
                        </span>
                      </div>

                      <Link to={`/product/${deal.product_id}`} className={styles.shopNowBtn}>
                        <FiShoppingBag />
                        Shop Now
                        <FiArrowRight className={styles.btnArrow} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Featured Deal Banner */}
            {deals.length > 0 && (
              <div className={styles.featuredBanner}>
                <div className={styles.bannerContent}>
                  <div className={styles.bannerIcon}>🎨</div>
                  <div className={styles.bannerText}>
                    <h3>Free Shipping on Orders Over ₹499</h3>
                    <p>Use code: FREESHIP at checkout</p>
                  </div>
                  <Link to="/products" className={styles.bannerBtn}>
                    Shop Now <FiArrowRight />
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Deals;