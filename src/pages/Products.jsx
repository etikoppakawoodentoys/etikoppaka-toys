import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { FiSearch, FiFilter, FiGrid, FiList, FiArrowRight, FiHeart, FiEye, FiX, FiStar, FiChevronRight, FiGift } from 'react-icons/fi';
import { FaStar, FaStarHalfAlt } from 'react-icons/fa';
import styles from './Products.module.css';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
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
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchTerm, selectedCategory, minPrice, maxPrice, sortBy]);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && !error) {
      setProducts(data);
      setFilteredProducts(data);
      
      const prices = data.map(p => p.price);
      const max = Math.max(...prices);
      setMaxPrice(max);
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('name')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (data && !error) {
    const categoryNames = ['All', ...data.map(cat => cat.name)];
    setCategories(categoryNames);
  } else {
    // Fallback categories
    setCategories(['All', 'Traditional Toys', 'Educational Toys', 'Kids', 'Decorative Items', 'Pull Along Toys', 'Rattles', 'Puzzles', 'Animal Figures']);
  }
};

  const filterAndSortProducts = () => {
    let filtered = [...products];

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(product => product.category === selectedCategory);
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
    setSelectedCategory('All');
    const prices = products.map(p => p.price);
    setMinPrice(0);
    setMaxPrice(Math.max(...prices));
    setSortBy('newest');
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
        <p>Loading beautiful toys...</p>
      </div>
    );
  }

  // ============================================
  // MOBILE UI (2 Products Per Row with Sold Out)
  // ============================================
  if (isMobile) {
    return (
      <div className={styles.mobileProductsPage}>
        {/* Hamper Branding Section - Mobile */}
        <Link to="/hampers" className={styles.mobileHamperBranding}>
          <div className={styles.mobileHamperIcon}>
            <FiGift />
          </div>
          <div className={styles.mobileHamperContent}>
            <span className={styles.mobileHamperTag}>✨ Special Offer</span>
            <h3>Select Hamper for Your Loved Ones</h3>
            <p>Curated gift sets for every occasion 🎁</p>
          </div>
          <div className={styles.mobileHamperArrow}>
            <FiChevronRight />
          </div>
        </Link>

        <div className={styles.mobileHeader}>
          <h1>Our Collection</h1>
          <button className={styles.filterChip} onClick={() => setShowFilters(true)}>
            <FiFilter /> Filter
          </button>
        </div>

        <div className={styles.mobileSearchBar}>
          <FiSearch />
          <input
            type="text"
            placeholder="Search for traditional toys..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className={styles.mobileCategories}>
          {categories.map(category => (
            <button
              key={category}
              className={`${styles.mobileCategoryChip} ${selectedCategory === category ? styles.active : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <div className={styles.mobileSortBar}>
          <button className={sortBy === 'newest' ? styles.active : ''} onClick={() => setSortBy('newest')}>
            Newest
          </button>
          <button className={sortBy === 'price_low' ? styles.active : ''} onClick={() => setSortBy('price_low')}>
            Price: Low
          </button>
          <button className={sortBy === 'price_high' ? styles.active : ''} onClick={() => setSortBy('price_high')}>
            Price: High
          </button>
        </div>

        <div className={styles.mobileProductsGrid}>
          {filteredProducts.map((product) => (
            <Link 
              to={`/product/${product.id}`} 
              key={product.id} 
              className={styles.mobileProductCard}
            >
              <div className={styles.mobileProductImage}>
                <img src={getProductImage(product)} alt={product.name} />
                {product.is_bulk_order && <span className={styles.mobileBulkBadge}>Bulk</span>}
                {product.stock_quantity === 0 && (
                  <span className={styles.mobileSoldOutBadge}>Sold Out</span>
                )}
              </div>
              <div className={styles.mobileProductInfo}>
                <h3>{product.name}</h3>
                <div className={styles.mobileProductPrice}>₹{product.price}</div>
                <p className={styles.mobileProductDesc}>{product.description?.substring(0, 40)}...</p>
              </div>
            </Link>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className={styles.mobileNoResults}>
            <p>No products found</p>
            <button onClick={clearFilters}>Clear Filters</button>
          </div>
        )}

        {showFilters && (
          <div className={styles.mobileFilterDrawer} onClick={() => setShowFilters(false)}>
            <div className={styles.mobileFilterContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.mobileFilterHeader}>
                <h3>Filters</h3>
                <button onClick={() => setShowFilters(false)}><FiX /></button>
              </div>
              <div className={styles.mobileFilterBody}>
                <div className={styles.mobileFilterGroup}>
                  <h4>Categories</h4>
                  {categories.map(cat => (
                    <label key={cat} className={styles.mobileFilterLabel}>
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory === cat}
                        onChange={() => setSelectedCategory(cat)}
                      />
                      <span>{cat}</span>
                    </label>
                  ))}
                </div>
                <div className={styles.mobileFilterGroup}>
                  <h4>Price Range</h4>
                  <div className={styles.mobilePriceInputs}>
                    <input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(Number(e.target.value))}
                    />
                    <span>-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                    />
                  </div>
                </div>
                <button className={styles.mobileApplyBtn} onClick={() => setShowFilters(false)}>
                  Apply Filters
                </button>
                <button className={styles.mobileClearBtn} onClick={clearFilters}>
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================
  // DESKTOP UI (Premium with Sold Out)
  // ============================================
  return (
    <div className={styles.productsPage}>
      {/* Hamper Branding Section - Desktop */}
      <Link to="/hampers" className={styles.hamperBranding}>
        <div className={styles.hamperBrandingBg}></div>
        <div className={styles.hamperBrandingContent}>
          <div className={styles.hamperBrandingIcon}>
            <FiGift />
            <span className={styles.hamperBrandingBadge}>🎁 Gift Special</span>
          </div>
          <div className={styles.hamperBrandingText}>
            <h2>Select Hamper for <span>Your Loved Ones</span></h2>
            <p>Beautifully curated gift hampers perfect for birthdays, anniversaries, festivals & special occasions</p>
            <div className={styles.hamperFeatures}>
              <span>✨ Premium Quality</span>
              <span>🎀 Customizable</span>
              <span>🚚 Free Delivery</span>
              <span>💝 Best Prices</span>
            </div>
          </div>
          <div className={styles.hamperBrandingBtn}>
            Explore Hampers <FiChevronRight />
          </div>
        </div>
        <div className={styles.hamperBrandingDecor}>
          <div className={styles.decorCircle1}></div>
          <div className={styles.decorCircle2}></div>
          <div className={styles.decorStar}>⭐</div>
          <div className={styles.decorStar2}>✨</div>
        </div>
      </Link>

      <div className={styles.heroBanner}>
        <div className={styles.heroPattern}></div>
        <div className={styles.bannerContent}>
          <div className={styles.bannerBadge}>Handcrafted with Love</div>
          <h1 className={styles.bannerTitle}>Our Collection</h1>
          <p className={styles.bannerSubtitle}>Discover the beauty of traditional craftsmanship</p>
          <div className={styles.bannerScroll}>
            <span>Scroll to explore</span>
            <div className={styles.scrollDot}></div>
          </div>
        </div>
        <div className={styles.bannerWave}>
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path d="M0,32L48,37.3C96,43,192,53,288,58.7C384,64,480,64,576,58.7C672,53,768,43,864,48C960,53,1056,75,1152,80C1248,85,1344,75,1392,69.3L1440,64L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z" fill="#F8F2E8"></path>
          </svg>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.filterBar}>
          <div className={styles.searchBox}>
            <FiSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search for traditional toys..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className={styles.clearSearch} onClick={() => setSearchTerm('')}>
                <FiX />
              </button>
            )}
          </div>
          
          <div className={styles.filterStats}>
            <span className={styles.productCount}>
              {filteredProducts.length} products found
            </span>
          </div>
          
          <div className={styles.sortWrapper}>
            <label>Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.sortSelect}
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="name_asc">Name: A to Z</option>
            </select>
          </div>
        </div>

        <div className={styles.productsLayout}>
          <aside className={styles.filtersSidebar}>
            <div className={styles.filterHeader}>
              <h3>Filters</h3>
              <button onClick={clearFilters} className={styles.resetFilters}>
                Reset All
              </button>
            </div>

            <div className={styles.filterGroup}>
              <h4>Categories</h4>
              <div className={styles.categoryList}>
                {categories.map(category => (
                  <label key={category} className={styles.categoryItem}>
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === category}
                      onChange={() => setSelectedCategory(category)}
                    />
                    <span className={styles.categoryName}>{category}</span>
                    <span className={styles.categoryCount}>
                      {category === 'All' ? products.length : products.filter(p => p.category === category).length}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.filterGroup}>
              <h4>Price Range</h4>
              <div className={styles.priceRange}>
                <div className={styles.priceInputs}>
                  <div className={styles.priceInputWrapper}>
                    <span>₹</span>
                    <input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(Number(e.target.value))}
                    />
                  </div>
                  <span className={styles.priceDash}>—</span>
                  <div className={styles.priceInputWrapper}>
                    <span>₹</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className={styles.sliderContainer}>
                  <input
                    type="range"
                    min="0"
                    max={Math.max(...products.map(p => p.price), 5000)}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className={styles.priceSlider}
                    style={{ background: `linear-gradient(90deg, #1F5B3A 0%, #1F5B3A ${(maxPrice / Math.max(...products.map(p => p.price), 5000)) * 100}%, #E8DCC8 ${(maxPrice / Math.max(...products.map(p => p.price), 5000)) * 100}%)` }}
                  />
                </div>
                <div className={styles.priceValues}>
                  <span>₹{minPrice}</span>
                  <span>₹{maxPrice}</span>
                </div>
              </div>
            </div>
          </aside>

          <div className={styles.productsContent}>
            {filteredProducts.length === 0 ? (
              <div className={styles.noResults}>
                <div className={styles.noResultsIcon}>🔍</div>
                <h3>No products found</h3>
                <p>Try adjusting your filters or search term</p>
                <button onClick={clearFilters} className={styles.resetBtn}>
                  Clear All Filters
                </button>
              </div>
            ) : (
              <>
                <div className={styles.productsHeader}>
                  <div className={styles.viewOptions}>
                    <button className={styles.gridView}>
                      <FiGrid />
                    </button>
                  </div>
                  <div className={styles.filterInfo}>
                    <span>Showing {filteredProducts.length} of {products.length} products</span>
                  </div>
                </div>

                <div className={styles.productsGrid}>
                  {filteredProducts.map((product, index) => (
                    <div key={product.id} className={styles.productCard} style={{ animationDelay: `${index * 0.05}s` }}>
                      <div className={styles.cardImage}>
                        <img src={getProductImage(product)} alt={product.name} />
                        <div className={styles.cardOverlay}>
                          <Link to={`/product/${product.id}`} className={styles.quickView}>
                            <FiEye /> Quick View
                          </Link>
                        </div>
                        {product.is_bulk_order && <span className={styles.bulkBadge}>Bulk Order</span>}
                        {product.category && <span className={styles.categoryBadge}>{product.category}</span>}
                        {product.stock_quantity === 0 && (
                          <div className={styles.soldOutBadge}>Sold Out</div>
                        )}
                      </div>
                      <div className={styles.cardContent}>
                        <h3>{product.name}</h3>
                        <p className={styles.productDesc}>{product.description?.substring(0, 60)}...</p>
                        <div className={styles.cardFooter}>
                          <div className={styles.priceInfo}>
                            <span className={styles.productPrice}>₹{product.price}</span>
                            {product.old_price && <span className={styles.oldPrice}>₹{product.old_price}</span>}
                          </div>
                          {product.stock_quantity > 0 ? (
                            <Link to={`/product/${product.id}`} className={styles.viewBtn}>
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;