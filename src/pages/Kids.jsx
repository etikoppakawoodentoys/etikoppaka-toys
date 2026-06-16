import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { 
  FiSearch, 
  FiArrowRight, 
  FiEye, 
  FiHeart, 
  FiFilter, 
  FiX, 
  FiShoppingBag,
  FiStar,
  FiTruck,
  FiShield,
  FiSmile,
  FiBookOpen,
  FiLock,
  FiTrendingUp,
  FiZap,
  FiChevronRight,
  FiPackage,
  FiRefreshCw,
  FiSliders
} from 'react-icons/fi';
import { 
  FaChild, 
  FaStar, 
  FaStarHalfAlt, 
  FaPaintBrush, 
  FaHandHoldingHeart,
  FaDumbbell,
  FaLeaf
} from 'react-icons/fa';
import { GiToyMallet } from 'react-icons/gi';
import styles from './Kids.module.css';

const Kids = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [isMobile, setIsMobile] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [tempMinPrice, setTempMinPrice] = useState(0);
  const [tempMaxPrice, setTempMaxPrice] = useState(5000);
  const [pageEntered, setPageEntered] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    setTimeout(() => setPageEntered(true), 100);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchKidsProducts();
  }, []);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchTerm, sortBy, minPrice, maxPrice]);

  const fetchKidsProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', 'Kids')
      .order('created_at', { ascending: false });

    if (data && !error) {
      setProducts(data);
      setFilteredProducts(data);
      
      const prices = data.map(p => p.price);
      const max = Math.max(...prices, 5000);
      setMaxPrice(max);
      setTempMaxPrice(max);
    }
    setLoading(false);
  };

  const filterAndSortProducts = () => {
    let filtered = [...products];

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    filtered = filtered.filter(product =>
      product.price >= minPrice && product.price <= maxPrice
    );

    switch (sortBy) {
      case 'price_low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'name_asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
    }

    setFilteredProducts(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSortBy('newest');
    setMinPrice(0);
    const prices = products.map(p => p.price);
    const max = Math.max(...prices, 5000);
    setMaxPrice(max);
    setTempMinPrice(0);
    setTempMaxPrice(max);
  };

  const applyFilters = () => {
    setMinPrice(tempMinPrice);
    setMaxPrice(tempMaxPrice);
    setShowFilters(false);
  };

  const openFilterDrawer = () => {
    setTempMinPrice(minPrice);
    setTempMaxPrice(maxPrice);
    setShowFilters(true);
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
        <div className={styles.loadingWrapper}>
          <div className={styles.loadingSpinner}>
            <div className={styles.spinnerRing}></div>
            <div className={styles.spinnerRing}></div>
            <div className={styles.spinnerRing}></div>
          </div>
          <p className={styles.loadingText}>✨ Loading magical toys... ✨</p>
        </div>
      </div>
    );
  }

  // Mobile UI
  if (isMobile) {
    return (
      <div className={`${styles.mobileKidsPage} ${pageEntered ? styles.pageEntered : ''}`}>
        {/* Confetti Effect */}
        <div className={styles.confettiContainer}>
          <div className={styles.confetti}></div>
          <div className={styles.confetti}></div>
          <div className={styles.confetti}></div>
          <div className={styles.confetti}></div>
          <div className={styles.confetti}></div>
          <div className={styles.confetti}></div>
          <div className={styles.confetti}></div>
          <div className={styles.confetti}></div>
        </div>

        {/* Hero Section */}
        <div className={styles.mobileHero}>
          <div className={styles.heroAnimation}>
            <div className={styles.floatingIcon1}>🧸</div>
            <div className={styles.floatingIcon2}>🎨</div>
            <div className={styles.floatingIcon3}>🎭</div>
            <div className={styles.floatingIcon4}>🎈</div>
            <div className={styles.floatingIcon5}>🚀</div>
            <div className={styles.floatingIcon6}>🦕</div>
          </div>
          <div className={styles.mobileHeroContent}>
            <div className={styles.heroIconCircle}>
              <FaChild />
            </div>
            <div className={styles.heroTextWrapper}>
              <span className={styles.heroSmallText}>🎪 Welcome Little Explorers! 🎪</span>
              <h1 className={styles.heroTitle}>
                <span className={styles.gradientText}>Magical</span> World of <span className={styles.gradientText2}>Wonder</span>
              </h1>
              <p className={styles.heroDescription}>
                ✨ Where every toy sparks <strong>imagination, joy & endless giggles!</strong> ✨
              </p>
            </div>
          </div>
          <div className={styles.heroWaveBottom}>
            <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
              <path d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,64C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z" fill="#F8F2E8"/>
            </svg>
          </div>
        </div>

        {/* Search Bar */}
        <div className={styles.mobileSearchBar}>
          <div className={styles.searchIconWrapper}>
            <FiSearch />
          </div>
          <input
            type="text"
            placeholder="Find your magic toy..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className={styles.clearSearchBtn} onClick={() => setSearchTerm('')}>
              <FiX />
            </button>
          )}
         
        </div>

        {/* Active Filters Display */}
        {(minPrice > 0 || maxPrice < 5000) && (
          <div className={styles.activeFilters}>
            <span className={styles.activeFilterLabel}>Active Filter:</span>
            <span className={styles.activeFilterValue}>₹{minPrice} - ₹{maxPrice}</span>
            <button onClick={clearFilters} className={styles.clearActiveFilter}>
              <FiX /> Clear
            </button>
          </div>
        )}

        {/* Sort Options */}
        <div className={styles.mobileSortBar}>
          <button className={sortBy === 'newest' ? styles.active : ''} onClick={() => setSortBy('newest')}>
            <FiZap /> Newest
          </button>
          <button className={sortBy === 'price_low' ? styles.active : ''} onClick={() => setSortBy('price_low')}>
            ₹ Low to High
          </button>
          <button className={sortBy === 'price_high' ? styles.active : ''} onClick={() => setSortBy('price_high')}>
            ₹ High to Low
          </button>
          <button className={sortBy === 'name_asc' ? styles.active : ''} onClick={() => setSortBy('name_asc')}>
            A to Z
          </button>
        </div>

     {/* Products Count - Fun & Playful */}
<div className={styles.mobileProductCount}>
  <div className={styles.funCountCard}>
    <div className={styles.funCountLeft}>
      <span className={styles.countEmoji}>🎪</span>
      <div className={styles.funCountText}>
        <span className={styles.countNumber}>{filteredProducts.length}</span>
        <span className={styles.countLabel}>Toys for little dreams</span>
      </div>
    </div>
    <div className={styles.funCountBadge}>
      <span>✨</span>
      <span>new</span>
    </div>
  </div>
</div>

        {/* Products Grid */}
        <div className={styles.mobileProductsGrid}>
          {filteredProducts.map((product, idx) => (
            <Link to={`/product/${product.id}`} key={product.id} className={styles.mobileProductCard}>
              <div className={styles.mobileProductImage}>
                <img src={getProductImage(product)} alt={product.name} />
                {product.stock_quantity === 0 && (
                  <div className={styles.mobileSoldOutBadge}>Sold Out</div>
                )}
                <div className={styles.mobileKidsTag}>
                  <FaChild />
                </div>
                {product.is_bulk_order && (
                  <div className={styles.mobileBulkTag}>Bulk</div>
                )}
              </div>
              <div className={styles.mobileProductInfo}>
                <h3 className={styles.productTitle}>{product.name}</h3>
                
                <div className={styles.mobilePriceRow}>
                  <span className={styles.mobileProductPrice}>₹{product.price}</span>
                  {product.old_price && (
                    <span className={styles.mobileOldPrice}>₹{product.old_price}</span>
                  )}
                </div>
                <button className={styles.quickViewBtn}>
                  <FiEye /> Quick View
                </button>
              </div>
            </Link>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className={styles.mobileNoResults}>
            <div className={styles.noResultsIcon}>
              <GiToyMallet />
            </div>
            <h3>No Toys Found</h3>
            <p>Try adjusting your search or filters</p>
            <button onClick={clearFilters} className={styles.mobileClearBtn}>
              <FiRefreshCw /> Clear Filters
            </button>
          </div>
        )}

        {/* Benefits Section */}
        <div className={styles.mobileBenefits}>
          <h3>Why Parents Love Us</h3>
          <div className={styles.mobileBenefitsGrid}>
            <div className={styles.mobileBenefitCard}>
              <div className={styles.mobileBenefitIcon}><FiShield /></div>
              <div className={styles.benefitContent}>
                <h4>Child Safe</h4>
                <p>Non-toxic materials</p>
              </div>
            </div>
            <div className={styles.mobileBenefitCard}>
              <div className={styles.mobileBenefitIcon}><FaLeaf /></div>
              <div className={styles.benefitContent}>
                <h4>Eco-Friendly</h4>
                <p>Natural wood</p>
              </div>
            </div>
            <div className={styles.mobileBenefitCard}>
              <div className={styles.mobileBenefitIcon}><FiBookOpen /></div>
              <div className={styles.benefitContent}>
                <h4>Educational</h4>
                <p>Learn & play</p>
              </div>
            </div>
            <div className={styles.mobileBenefitCard}>
              <div className={styles.mobileBenefitIcon}><FiSmile /></div>
              <div className={styles.benefitContent}>
                <h4>100% Fun</h4>
                <p>Guaranteed joy</p>
              </div>
            </div>
          </div>
        </div>

        {/* Promo Banner */}
        <div className={styles.promoBanner}>
          <div className={styles.promoContent}>
            <div className={styles.promoIcon}>🎁</div>
            <div className={styles.promoText}>
              <h4>Free Shipping</h4>
              <p>on orders above ₹499</p>
            </div>
            <Link to="/products" className={styles.promoLink}>
              Shop <FiChevronRight />
            </Link>
          </div>
        </div>

        {/* Filter Drawer - Fixed */}
        {showFilters && (
          <div className={styles.mobileFilterDrawer} onClick={() => setShowFilters(false)}>
            <div className={styles.mobileFilterContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.mobileFilterHeader}>
                <h3><FiSliders /> Filter Toys</h3>
                <button onClick={() => setShowFilters(false)}><FiX /></button>
              </div>
              <div className={styles.mobileFilterBody}>
                <div className={styles.mobileFilterGroup}>
                  <h4>Price Range (₹)</h4>
                  <div className={styles.mobilePriceInputs}>
                    <input
                      type="number"
                      placeholder="Min"
                      value={tempMinPrice}
                      onChange={(e) => setTempMinPrice(Number(e.target.value))}
                    />
                    <span>—</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={tempMaxPrice}
                      onChange={(e) => setTempMaxPrice(Number(e.target.value))}
                    />
                  </div>
                  <div className={styles.priceSliderContainer}>
                    <input
                      type="range"
                      min="0"
                      max={Math.max(...products.map(p => p.price), 5000)}
                      value={tempMaxPrice}
                      onChange={(e) => setTempMaxPrice(Number(e.target.value))}
                      className={styles.priceSlider}
                    />
                    <div className={styles.priceRangeDisplay}>
                      <span>₹{tempMinPrice}</span>
                      <span>to</span>
                      <span>₹{tempMaxPrice}</span>
                    </div>
                  </div>
                </div>
                <div className={styles.filterActions}>
                  <button className={styles.mobileClearFiltersBtn} onClick={clearFilters}>
                    Clear All
                  </button>
                  <button className={styles.mobileApplyBtn} onClick={applyFilters}>
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop UI
  return (
    <div className={styles.kidsPage}>
      <div className={styles.heroBanner}>
        <div className={styles.heroPattern}></div>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <FaChild />
            Premium Quality for Little Ones
          </div>
          <h1 className={styles.heroTitle}>
            Thoughtfully Curated <span className={styles.highlight}>Kids Collection</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Where timeless craftsmanship meets child-safe materials. Each toy is designed to 
            nurture creativity, enhance motor skills, and create lasting memories.
          </p>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <FaPaintBrush />
              <div>
                <strong>Skill Development</strong>
                <p>Enhances creativity & learning</p>
              </div>
            </div>
            <div className={styles.heroStat}>
              <FiShield />
              <div>
                <strong>Safety Certified</strong>
                <p>Non-toxic & child-safe materials</p>
              </div>
            </div>
            <div className={styles.heroStat}>
              <FaHandHoldingHeart />
              <div>
                <strong>Heirloom Quality</strong>
                <p>Built to last generations</p>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.heroWave}>
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path d="M0,32L48,37.3C96,43,192,53,288,58.7C384,64,480,64,576,58.7C672,53,768,43,864,48C960,53,1056,75,1152,80C1248,85,1344,75,1392,69.3L1440,64L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z" fill="#F8F2E8"/>
          </svg>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.filterBar}>
          <div className={styles.searchBox}>
            <FiSearch />
            <input
              type="text"
              placeholder="Search by toy name, age group, or skill type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className={styles.clearSearch} onClick={() => setSearchTerm('')}>
                <FiX />
              </button>
            )}
          </div>
          
          <div className={styles.productStats}>
            <GiToyMallet />
            <span>{filteredProducts.length} Premium Products</span>
          </div>
          
          <div className={styles.sortWrapper}>
            <label>Sort by:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">Newest Arrivals</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="name_asc">Name: A to Z</option>
            </select>
          </div>
        </div>

        <div className={styles.priceFilterSection}>
          <div className={styles.priceRange}>
            <span>Price Range:</span>
            <div className={styles.priceInputs}>
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(Number(e.target.value))}
              />
              <span>to</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
              />
            </div>
            <button onClick={clearFilters} className={styles.clearFiltersBtn}>
              Clear Filters
            </button>
          </div>
        </div>

        <div className={styles.resultsInfo}>
          Showing <strong>{filteredProducts.length}</strong> of <strong>{products.length}</strong> premium toys
        </div>

        {filteredProducts.length === 0 ? (
          <div className={styles.noResults}>
            <div className={styles.noResultsIcon}>
              <GiToyMallet />
            </div>
            <h3>No Products Found</h3>
            <p>We couldn't find any products matching your criteria.</p>
            <button onClick={clearFilters} className={styles.resetBtn}>
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className={styles.productsGrid}>
            {filteredProducts.map((product) => (
              <div key={product.id} className={styles.productCard}>
                <div className={styles.cardImage}>
                  <img src={getProductImage(product)} alt={product.name} />
                  <div className={styles.cardOverlay}>
                    <Link to={`/product/${product.id}`} className={styles.quickViewBtn}>
                      <FiEye /> Quick View
                    </Link>
                  </div>
                  {product.is_bulk_order && <span className={styles.bulkBadge}>Bulk Order Available</span>}
                  {product.stock_quantity === 0 && (
                    <div className={styles.soldOutBadge}>Sold Out</div>
                  )}
                  <div className={styles.kidsBadge}>
                    <FaChild /> Kids Collection
                  </div>
                </div>
                <div className={styles.cardContent}>
                  <h3>{product.name}</h3>
                  <p className={styles.productDesc}>{product.description?.substring(0, 70)}...</p>
                  <div className={styles.cardFooter}>
                    <div className={styles.priceInfo}>
                      <span className={styles.productPrice}>₹{product.price}</span>
                    </div>
                    {product.stock_quantity > 0 ? (
                      <Link to={`/product/${product.id}`} className={styles.shopBtn}>
                        Shop Now <FiArrowRight />
                      </Link>
                    ) : (
                      <span className={styles.outOfStockBtn}>Out of Stock</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={styles.benefitsSection}>
          <h2>Why Parents Trust Our Kids Collection</h2>
          <div className={styles.benefitsGrid}>
            <div className={styles.benefitCard}>
              <div className={styles.benefitIcon}><FaPaintBrush /></div>
              <h4>Developmental Focus</h4>
              <p>Designed by experts to enhance motor skills, cognitive development, and creative thinking</p>
            </div>
            <div className={styles.benefitCard}>
              <div className={styles.benefitIcon}><FiShield /></div>
              <h4>Premium Safety Standards</h4>
              <p>ISO certified, non-toxic paints, smooth rounded edges, and durable construction</p>
            </div>
            <div className={styles.benefitCard}>
              <div className={styles.benefitIcon}><FaLeaf /></div>
              <h4>Sustainable & Eco-Friendly</h4>
              <p>Made from sustainably sourced wood with natural, chemical-free colors</p>
            </div>
            <div className={styles.benefitCard}>
              <div className={styles.benefitIcon}><FaHandHoldingHeart /></div>
              <h4>Heirloom Quality</h4>
              <p>Generations-old craftsmanship ensuring toys that last a lifetime</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Kids;