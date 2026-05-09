import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { 
  FiArrowRight, 
  FiTag, 
  FiShoppingBag, 
  FiHeart, 
  FiStar, 
  FiTruck, 
  FiShield,
  FiAward,
  FiPackage,
  FiClock,
  FiSearch,
  FiMenu,
  FiX,
  FiChevronRight,
  FiHome,
  FiUser,
  FiShoppingCart,
  FiAlertCircle
} from 'react-icons/fi';
import { FaLeaf, FaPaintBrush, FaHandSpock, FaAward } from 'react-icons/fa';
import styles from './Home.module.css';

const Home = () => {
  const [deals, setDeals] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    
    const { data: dealsData } = await supabase
      .from('deals')
      .select(`
        *,
        products (*)
      `)
      .eq('is_active', true)
      .lte('start_date', new Date().toISOString().split('T')[0])
      .gte('end_date', new Date().toISOString().split('T')[0])
      .order('created_at', { ascending: false })
      .limit(4);
    
    if (dealsData) setDeals(dealsData);
    
    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(8);
    
    if (productsData) setFeaturedProducts(productsData);
    
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  // ============================================
  // MOBILE UI (Working Search Functionality)
  // ============================================
  if (isMobile) {
    const filteredFeaturedProducts = featuredProducts.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const filteredDeals = deals.filter(deal =>
      deal.products?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className={styles.mobileHome}>
        {/* Search Bar on Top */}
        <div className={styles.mobileSearchBar}>
          <FiSearch />
          <input 
            type="text" 
            placeholder="Search for traditional toys..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {searchQuery && (
          <div className={styles.mobileSearchResults}>
            <p>Showing results for: <strong>"{searchQuery}"</strong></p>
            <p>{filteredFeaturedProducts.length + filteredDeals.length} products found</p>
          </div>
        )}

        {!searchQuery && (
          <>
            <div className={styles.mobileHero}>
              <img 
                src="/brand.png" 
                alt="Etikoppaka Toys Brand" 
                className={styles.mobileHeroPoster}
              />
            </div>
            <div className={styles.mobileHeroTextSection}>
              <h1 className={styles.animateText}>Traditional Handcrafted Toys</h1>
              <p className={styles.animateTextDelay}>Natural colors | Eco-friendly | GI Tagged</p>
              <Link to="/products" className={styles.mobileHeroBtn}>
                Explore Collection →
              </Link>
            </div>
          </>
        )}

        {!searchQuery && (
          <div className={styles.mobileFeatures}>
            <div className={styles.mobileFeature}>
              <FiTruck />
              <span>Free Shipping</span>
            </div>
            <div className={styles.mobileFeature}>
              <FiShield />
              <span>Safe COD</span>
            </div>
            <div className={styles.mobileFeature}>
              <FiClock />
              <span>Fast Delivery</span>
            </div>
          </div>
        )}

        {(searchQuery ? filteredDeals.length > 0 : deals.length > 0) && (
          <div className={styles.mobileSection}>
            <div className={styles.mobileSectionHeader}>
              <h2>🔥 Hot Deals</h2>
              {!searchQuery && <Link to="/deals">View All <FiChevronRight /></Link>}
            </div>
            <div className={styles.mobileHorizontalScroll}>
              {(searchQuery ? filteredDeals : deals).map((deal) => (
                <Link to={`/product/${deal.product_id}`} key={deal.id} className={styles.mobileProductCard}>
                  <div className={styles.mobileProductImage}>
                    <img src={deal.products?.image_url || '/placeholder.jpg'} alt={deal.products?.name} />
                    <span className={styles.mobileDiscountBadge}>
                      -{Math.round(((deal.products?.price - deal.deal_price) / deal.products?.price) * 100)}%
                    </span>
                    {deal.products?.stock_quantity === 0 && (
                      <span className={styles.mobileSoldOutBadge}>Sold Out</span>
                    )}
                  </div>
                  <h3>{deal.products?.name}</h3>
                  <div className={styles.mobilePrice}>
                    <span className={styles.mobileOriginalPrice}>₹{deal.products?.price}</span>
                    <span className={styles.mobileDealPrice}>₹{deal.deal_price}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className={styles.mobileSection}>
          <div className={styles.mobileSectionHeader}>
            <h2>✨ Featured Collection</h2>
            {!searchQuery && <Link to="/products">View All <FiChevronRight /></Link>}
          </div>
          {filteredFeaturedProducts.length === 0 && searchQuery ? (
            <div className={styles.mobileNoResults}>
              <p>No products found for "{searchQuery}"</p>
              <button onClick={() => setSearchQuery('')} className={styles.mobileClearSearchBtn}>
                Clear Search
              </button>
            </div>
          ) : (
            <div className={styles.mobileProductsGrid3Col}>
              {(searchQuery ? filteredFeaturedProducts : featuredProducts.slice(0, 6)).map((product) => (
                <Link to={`/product/${product.id}`} key={product.id} className={styles.mobileProductCard3Col}>
                  <div className={styles.mobileProductImage3Col}>
                    <img src={product.image_url || '/placeholder.jpg'} alt={product.name} />
                    {product.stock_quantity === 0 && (
                      <span className={styles.mobileSoldOutBadge}>Sold Out</span>
                    )}
                  </div>
                  <h3>{product.name}</h3>
                  <div className={styles.mobilePrice3Col}>₹{product.price}</div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {!searchQuery && (
          <div className={styles.mobileAbout}>
            <div className={styles.mobileAboutContent}>
              <span className={styles.mobileAboutTag}>Our Heritage</span>
              <h3>The Legacy of Etikoppaka Toys</h3>
              <p>
                Etikoppaka Toys are traditional handcrafted wooden toys originating from the village of 
                Etikoppaka in Andhra Pradesh, India. Known for their smooth finish, vibrant natural colors, 
                and eco-friendly craftsmanship, these toys are made using softwood called Ankudu and colored 
                with natural dyes derived from seeds, roots, bark, and leaves.
              </p>
              <div className={styles.mobileAboutFeatures}>
                <div className={styles.mobileAboutFeature}><span>✓</span> GI Certified</div>
                <div className={styles.mobileAboutFeature}><span>✓</span> Natural Colors</div>
                <div className={styles.mobileAboutFeature}><span>✓</span> Eco-Friendly</div>
                <div className={styles.mobileAboutFeature}><span>✓</span> Handcrafted</div>
              </div>
            </div>
          </div>
        )}

        {!searchQuery && (
          <div className={styles.mobileBenefits}>
            <div className={styles.mobileBenefitsHeader}>
              <span className={styles.mobileBenefitsTag}>Why Choose Us</span>
              <h3>What Makes Our Toys Special</h3>
            </div>
            <div className={styles.mobileBenefitsGrid}>
              <div className={styles.mobileBenefitCard}>
                <div className={styles.mobileBenefitIcon}><FaLeaf /></div>
                <div className={styles.mobileBenefitContent}>
                  <strong>Eco-Friendly</strong>
                  <span>Made from sustainable Ankudu wood</span>
                </div>
              </div>
              <div className={styles.mobileBenefitCard}>
                <div className={styles.mobileBenefitIcon}><FaPaintBrush /></div>
                <div className={styles.mobileBenefitContent}>
                  <strong>Natural Colors</strong>
                  <span>100% natural dyes from seeds & minerals</span>
                </div>
              </div>
              <div className={styles.mobileBenefitCard}>
                <div className={styles.mobileBenefitIcon}><FaHandSpock /></div>
                <div className={styles.mobileBenefitContent}>
                  <strong>Handcrafted</strong>
                  <span>Skilled artisans since generations</span>
                </div>
              </div>
              <div className={styles.mobileBenefitCard}>
                <div className={styles.mobileBenefitIcon}><FiAward /></div>
                <div className={styles.mobileBenefitContent}>
                  <strong>GI Tagged</strong>
                  <span>Recognized traditional craft of India</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={styles.mobileBottomNav}>
          <Link to="/" className={styles.mobileNavItem}>
            <FiHome />
            <span>Home</span>
          </Link>
          <Link to="/products" className={styles.mobileNavItem}>
            <FiShoppingBag />
            <span>Shop</span>
          </Link>
          <Link to="/deals" className={styles.mobileNavItem}>
            <FiTag />
            <span>Deals</span>
          </Link>
          <Link to="/cart" className={styles.mobileNavItem}>
            <FiShoppingCart />
            <span>Cart</span>
          </Link>
          <Link to="/profile" className={styles.mobileNavItem}>
            <FiUser />
            <span>Profile</span>
          </Link>
        </div>

        {mobileMenuOpen && (
          <div className={styles.mobileDrawer} onClick={() => setMobileMenuOpen(false)}>
            <div className={styles.mobileDrawerContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.mobileDrawerHeader}>
                <img src="/logo.png" alt="Logo" className={styles.drawerLogo} />
                <button onClick={() => setMobileMenuOpen(false)}><FiX /></button>
              </div>
              <div className={styles.mobileDrawerLinks}>
                <Link to="/" onClick={() => setMobileMenuOpen(false)}>Home</Link>
                <Link to="/products" onClick={() => setMobileMenuOpen(false)}>Products</Link>
                <Link to="/deals" onClick={() => setMobileMenuOpen(false)}>Deals</Link>
                <Link to="/orders" onClick={() => setMobileMenuOpen(false)}>My Orders</Link>
                <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>Profile</Link>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Login / Signup</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================
  // DESKTOP UI (With Sold Out Badges)
  // ============================================
  return (
    <div className={styles.home}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBgEffects}>
          <div className={styles.effect1}></div>
          <div className={styles.effect2}></div>
          <div className={styles.effect3}></div>
        </div>
        
        <div className={styles.heroContainer}>
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <FiAward /> Since 1900s | GI Tagged Craft
            </div>
            <h1 className={styles.heroTitle}>
              Traditional Handcrafted
              <span className={styles.highlight}> Etikoppaka</span>
              <br />Wooden Toys
            </h1>
            <p className={styles.heroSubtitle}>
              Colored with nature, crafted with love. Each piece tells a story of Indian heritage.
              Eco-friendly, non-toxic, and absolutely beautiful.
            </p>
            <div className={styles.heroButtons}>
              <Link to="/products" className={styles.btnPrimary}>
                Explore Collection <FiArrowRight className={styles.btnIcon} />
              </Link>
              <Link to="/deals" className={styles.btnSecondary}>
                Shop Deals <FiTag className={styles.btnIcon} />
              </Link>
            </div>
            <div className={styles.heroStats}>
              <div className={styles.stat}>
                <span className={styles.statNumber}>1000+</span>
                <span>Happy Families</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNumber}>50+</span>
                <span>Traditional Designs</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNumber}>100%</span>
                <span>Natural Colors</span>
              </div>
            </div>
          </div>

          <div className={styles.heroImageContainer}>
            <div className={styles.heroImageWrapper}>
              <img 
                src="/hero.png" 
                alt="Etikoppaka Toys Heritage" 
                className={styles.heroImage}
              />
              <div className={styles.heroImageOverlay}></div>
              <div className={styles.heroImageGlow}></div>
            </div>
            <div className={styles.heroImageDecoration}>
              <div className={styles.heroDecoCircle}></div>
              <div className={styles.heroDecoDot1}>✨</div>
              <div className={styles.heroDecoDot2}>🎨</div>
              <div className={styles.heroDecoDot3}>🌟</div>
            </div>
          </div>
        </div>

        <div className={styles.floatingToys}>
          <div className={styles.toy} style={{ '--i': 0, top: '15%', left: '5%' }}>🎨</div>
          <div className={styles.toy} style={{ '--i': 1, top: '70%', left: '8%' }}>🐘</div>
          <div className={styles.toy} style={{ '--i': 2, top: '20%', right: '5%' }}>🚂</div>
          <div className={styles.toy} style={{ '--i': 3, bottom: '10%', right: '12%' }}>🪁</div>
          <div className={styles.toy} style={{ '--i': 4, top: '40%', right: '18%' }}>🐦</div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className={styles.container}>
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}><FaLeaf /></div>
              <h3>Eco-Friendly</h3>
              <p>Made from sustainable Ankudu wood, protecting our forests</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}><FaPaintBrush /></div>
              <h3>Natural Colors</h3>
              <p>Colors derived from seeds, lac & minerals - 100% safe</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}><FaHandSpock /></div>
              <h3>Handcrafted</h3>
              <p>Each piece meticulously crafted by skilled artisans</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}><FaAward /></div>
              <h3>GI Tagged</h3>
              <p>Recognized traditional craft of India since generations</p>
            </div>
          </div>
        </div>
      </section>

      {/* Deals Section */}
      {deals.length > 0 && (
        <section className={styles.deals}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTag}>Limited Time Offers</span>
              <h2 className={styles.sectionTitle}>🔥 Deals of the Day</h2>
              <p className={styles.sectionSubtitle}>Grab these amazing offers before they're gone!</p>
            </div>
            <div className={styles.dealsGrid}>
              {deals.map((deal, index) => (
                <div key={deal.id} className={styles.dealCard} style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className={styles.discountBadge}>
                    -{Math.round(((deal.products?.price - deal.deal_price) / deal.products?.price) * 100)}%
                  </div>
                  <div className={styles.cardImage}>
                    <img src={deal.products?.image_url || '/placeholder.jpg'} alt={deal.products?.name} />
                    <div className={styles.cardOverlay}>
                      <Link to={`/product/${deal.product_id}`} className={styles.quickView}>Quick View</Link>
                    </div>
                    {deal.products?.stock_quantity === 0 && (
                      <div className={styles.soldOutBadge}>Sold Out</div>
                    )}
                  </div>
                  <div className={styles.cardContent}>
                    <h3>{deal.products?.name}</h3>
                    <div className={styles.price}>
                      <span className={styles.originalPrice}>₹{deal.products?.price}</span>
                      <span className={styles.dealPrice}>₹{deal.deal_price}</span>
                    </div>
                    {deal.products?.stock_quantity > 0 ? (
                      <Link to={`/product/${deal.product_id}`} className={styles.viewBtn}>
                        Shop Now <FiArrowRight />
                      </Link>
                    ) : (
                      <span className={styles.outOfStockBtn}>Out of Stock</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Products Section */}
      <section className={styles.products}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>Our Collection</span>
            <h2 className={styles.sectionTitle}>Beautiful Handcrafted Toys</h2>
            <p className={styles.sectionSubtitle}>Each piece is a masterpiece of traditional craftsmanship</p>
          </div>
          <div className={styles.productsGrid}>
            {featuredProducts.map((product, index) => (
              <div key={product.id} className={styles.productCard} style={{ animationDelay: `${index * 0.1}s` }}>
                <div className={styles.cardImage}>
                  <img src={product.image_url || '/placeholder.jpg'} alt={product.name} />
                  <div className={styles.cardOverlay}>
                    <Link to={`/product/${product.id}`} className={styles.quickView}>Quick View</Link>
                  </div>
                  {product.is_bulk_order && <span className={styles.bulkBadge}>Bulk Order</span>}
                  {product.stock_quantity === 0 && (
                    <div className={styles.soldOutBadge}>Sold Out</div>
                  )}
                </div>
                <div className={styles.cardContent}>
                  <h3>{product.name}</h3>
                  <p className={styles.productDesc}>{product.description?.substring(0, 60)}...</p>
                  <div className={styles.productFooter}>
                    <span className={styles.productPrice}>₹{product.price}</span>
                    {product.stock_quantity > 0 ? (
                      <Link to={`/product/${product.id}`} className={styles.viewIcon}>
                        <FiArrowRight />
                      </Link>
                    ) : (
                      <span className={styles.outOfStockBtn}>Out of Stock</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.viewMore}>
            <Link to="/products" className={styles.viewMoreBtn}>
              View All Products <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className={styles.about}>
        <div className={styles.container}>
          <div className={styles.aboutContent}>
            <div className={styles.aboutText}>
              <span className={styles.sectionTag}>Our Legacy</span>
              <h2 className={styles.aboutTitle}>The Art of Etikoppaka</h2>
              <p className={styles.aboutDesc}>
                Etikoppaka, a small village in Andhra Pradesh, is renowned for its traditional wooden toys 
                crafted from locally sourced Ankudu wood and colored with natural dyes extracted from seeds, 
                lac, and minerals.
              </p>
              <p className={styles.aboutDesc}>
                Each toy is a masterpiece of craftsmanship, passed down through generations. Our toys are 
                not just playthings; they're a piece of Indian heritage that you can cherish forever.
              </p>
              <div className={styles.aboutFeatures}>
                <div className={styles.aboutFeature}><span>✓</span> GI Certified Traditional Craft</div>
                <div className={styles.aboutFeature}><span>✓</span> 100% Natural & Non-toxic</div>
                <div className={styles.aboutFeature}><span>✓</span> Sustainable & Eco-friendly</div>
                <div className={styles.aboutFeature}><span>✓</span> Supports Local Artisans</div>
              </div>
              <Link to="/about" className={styles.aboutBtn}>
                Learn More About Our Story <FiArrowRight />
              </Link>
            </div>

            <div className={styles.aboutImage}>
              <div className={styles.aboutImageWrapper}>
                <img 
                  src="/about.png" 
                  alt="Etikoppaka Toys Craftsmanship" 
                  className={styles.aboutPoster}
                />
                <div className={styles.aboutImageOverlay}></div>
                <div className={styles.aboutImageGlow}></div>
              </div>
              <div className={styles.aboutDecoration}>
                <div className={styles.decorationCircle}></div>
                <div className={styles.decorationDot1}>🎨</div>
                <div className={styles.decorationDot2}>✨</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className={styles.benefits}>
        <div className={styles.container}>
          <div className={styles.benefitsGrid}>
            <div className={styles.benefitCard}>
              <FiTruck className={styles.benefitIcon} />
              <h3>Free Shipping</h3>
              <p>On orders above ₹499</p>
            </div>
            <div className={styles.benefitCard}>
              <FiShield className={styles.benefitIcon} />
              <h3>Secure Payments</h3>
              <p>100% secure transactions</p>
            </div>
            <div className={styles.benefitCard}>
              <FiPackage className={styles.benefitIcon} />
              <h3>Easy Returns</h3>
              <p>7 days return policy</p>
            </div>
            <div className={styles.benefitCard}>
              <FiClock className={styles.benefitIcon} />
              <h3>Fast Delivery</h3>
              <p>Pan India shipping</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;