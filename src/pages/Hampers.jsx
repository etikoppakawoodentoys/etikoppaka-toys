import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { FiSearch, FiFilter, FiGift, FiShoppingCart, FiEye, FiX, FiChevronRight, FiTag, FiStar, FiTruck, FiShield } from 'react-icons/fi';
import styles from './Hampers.module.css';

const Hampers = () => {
  const [hampers, setHampers] = useState([]);
  const [filteredHampers, setFilteredHampers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10000);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchHampers();
  }, []);

  useEffect(() => {
    filterAndSortHampers();
  }, [hampers, searchTerm, sortBy, minPrice, maxPrice]);

  const fetchHampers = async () => {
    setLoading(true);
    try {
      // First fetch all active hampers
      const { data: hampersData, error: hampersError } = await supabase
        .from('hampers')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (hampersError) throw hampersError;

      if (!hampersData || hampersData.length === 0) {
        setHampers([]);
        setLoading(false);
        return;
      }

      // Fetch hamper items for all hampers
      const hamperIds = hampersData.map(h => h.id);
      const { data: itemsData, error: itemsError } = await supabase
        .from('hamper_items')
        .select('*')
        .in('hamper_id', hamperIds);

      if (itemsError) throw itemsError;

      // Fetch products for all items
      const productIds = [...new Set(itemsData?.map(item => item.product_id) || [])];
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

      // Combine the data
      const hampersWithItems = hampersData.map(hamper => {
        const hamperItems = itemsData?.filter(item => item.hamper_id === hamper.id) || [];
        const itemsWithProducts = hamperItems.map(item => ({
          ...item,
          products: productsData.find(p => p.id === item.product_id)
        }));
        
        return {
          ...hamper,
          hamper_items: itemsWithProducts
        };
      });

      setHampers(hampersWithItems);
      
      const prices = hampersWithItems.map(h => h.price);
      const max = Math.max(...prices, 10000);
      setMaxPrice(max);
    } catch (err) {
      console.error('Error fetching hampers:', err);
    }
    setLoading(false);
  };

  const filterAndSortHampers = () => {
    let filtered = [...hampers];

    if (searchTerm) {
      filtered = filtered.filter(hamper =>
        hamper.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (hamper.description && hamper.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    filtered = filtered.filter(hamper =>
      hamper.price >= minPrice && hamper.price <= maxPrice
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

    setFilteredHampers(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSortBy('newest');
    setMinPrice(0);
    if (hampers.length > 0) {
      const prices = hampers.map(h => h.price);
      setMaxPrice(Math.max(...prices, 10000));
    }
  };

  const getHamperImage = (hamper) => {
    if (hamper.images) {
      try {
        const images = JSON.parse(hamper.images);
        if (images && images.length > 0) return images[0];
      } catch(e) {}
    }
    return hamper.image_url || '/images/hamper-placeholder.jpg';
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading gift hampers...</p>
      </div>
    );
  }

  // Mobile UI - Stunning Redesign
  if (isMobile) {
    return (
      <div className={styles.mobileHampersPage}>
        {/* Hero Section */}
        <div className={styles.mobileHero}>
          <div className={styles.mobileHeroContent}>
            <span className={styles.mobileHeroBadge}>✨ Curated with Love</span>
            <h1>Gift Hampers</h1>
            <p>Beautifully crafted gift sets for every occasion</p>
          </div>
          <div className={styles.mobileHeroWave}>
            <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
              <path d="M0,32L48,37.3C96,43,192,53,288,58.7C384,64,480,64,576,58.7C672,53,768,43,864,48C960,53,1056,75,1152,80C1248,85,1344,75,1392,69.3L1440,64L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z" fill="#F8F2E8"/>
            </svg>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className={styles.mobileSearchFilterBar}>
          <div className={styles.mobileSearchBar}>
            <FiSearch />
            <input
              type="text"
              placeholder="Search hampers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className={styles.mobileClearSearch}>
                <FiX />
              </button>
            )}
          </div>
          <button className={styles.mobileFilterBtn} onClick={() => setShowFilters(true)}>
            <FiFilter />
          </button>
        </div>

        {/* Sort Chips */}
        <div className={styles.mobileSortChips}>
          <button 
            className={`${styles.sortChip} ${sortBy === 'newest' ? styles.active : ''}`}
            onClick={() => setSortBy('newest')}
          >
            Newest
          </button>
          <button 
            className={`${styles.sortChip} ${sortBy === 'price_low' ? styles.active : ''}`}
            onClick={() => setSortBy('price_low')}
          >
            Price: Low → High
          </button>
          <button 
            className={`${styles.sortChip} ${sortBy === 'price_high' ? styles.active : ''}`}
            onClick={() => setSortBy('price_high')}
          >
            Price: High → Low
          </button>
        </div>

        {/* Results Count */}
        <div className={styles.mobileResultsCount}>
          <span>{filteredHampers.length} hampers found</span>
        </div>

        {/* Hampers Grid */}
        <div className={styles.mobileHampersGrid}>
          {filteredHampers.map((hamper, index) => (
            <Link to={`/hamper/${hamper.id}`} key={hamper.id} className={styles.mobileHamperCard}>
              <div className={styles.mobileHamperImage}>
                <img src={getHamperImage(hamper)} alt={hamper.name} />
                <div className={styles.mobileHamperBadge}>
                  <FiGift /> Premium
                </div>
                <div className={styles.mobileItemCountBadge}>
                  {hamper.hamper_items?.length || 0} items
                </div>
              </div>
              <div className={styles.mobileHamperInfo}>
                <h3>{hamper.name}</h3>
                <p className={styles.mobileHamperDesc}>{hamper.description?.substring(0, 50)}...</p>
                <div className={styles.mobilePriceRow}>
                  <div className={styles.mobileHamperPrice}>₹{hamper.price}</div>
                  <div className={styles.mobileViewBtn}>
                    View <FiChevronRight />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredHampers.length === 0 && (
          <div className={styles.mobileNoResults}>
            <FiGift />
            <h3>No hampers found</h3>
            <p>Try adjusting your filters</p>
            <button onClick={clearFilters}>Clear All Filters</button>
          </div>
        )}

        {/* Filter Drawer */}
        {showFilters && (
          <div className={styles.mobileFilterDrawer} onClick={() => setShowFilters(false)}>
            <div className={styles.mobileFilterContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.mobileFilterHeader}>
                <h3>Filter Hampers</h3>
                <button onClick={() => setShowFilters(false)}><FiX /></button>
              </div>
              <div className={styles.mobileFilterBody}>
                <div className={styles.mobileFilterGroup}>
                  <h4>Price Range</h4>
                  <div className={styles.mobilePriceRange}>
                    <div className={styles.mobilePriceInput}>
                      <span>₹</span>
                      <input
                        type="number"
                        placeholder="Min"
                        value={minPrice}
                        onChange={(e) => setMinPrice(Number(e.target.value))}
                      />
                    </div>
                    <span className={styles.priceDash}>—</span>
                    <div className={styles.mobilePriceInput}>
                      <span>₹</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(Number(e.target.value))}
                      />
                    </div>
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

  // Desktop UI
  return (
    <div className={styles.hampersPage}>
      <div className={styles.heroBanner}>
        <div className={styles.heroPattern}></div>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <FiGift /> Perfect Gifts
          </div>
          <h1>Gift Hampers</h1>
          <p>Beautifully curated gift sets for every occasion</p>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <FiStar />
              <span>Premium Quality</span>
            </div>
            <div className={styles.heroStat}>
              <FiTruck />
              <span>Free Delivery</span>
            </div>
            <div className={styles.heroStat}>
              <FiShield />
              <span>100% Authentic</span>
            </div>
          </div>
        </div>
        
      </div>

      <div className={styles.container}>
        <div className={styles.filterBar}>
          <div className={styles.searchBox}>
            <FiSearch />
            <input
              type="text"
              placeholder="Search gift hampers..."
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
            <span className={styles.resultCount}>{filteredHampers.length} hampers found</span>
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
            <button onClick={clearFilters} className={styles.clearFiltersBtn}>
              Clear Filters
            </button>
          </div>
        </div>

        {filteredHampers.length === 0 ? (
          <div className={styles.noResults}>
            <FiGift className={styles.noResultsIcon} />
            <h3>No Gift Hampers Found</h3>
            <p>Try adjusting your filters or search term</p>
            <button onClick={clearFilters} className={styles.resetBtn}>
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className={styles.hampersGrid}>
            {filteredHampers.map((hamper, index) => (
              <div key={hamper.id} className={styles.hamperCard} style={{ animationDelay: `${index * 0.05}s` }}>
                <div className={styles.cardImage}>
                  <img src={getHamperImage(hamper)} alt={hamper.name} />
                  <div className={styles.cardBadge}>
                    <FiGift /> Gift Hamper
                  </div>
                  <div className={styles.itemCountBadge}>
                    {hamper.hamper_items?.length || 0} Items
                  </div>
                  <div className={styles.cardOverlay}>
                    <Link to={`/hamper/${hamper.id}`} className={styles.quickViewBtn}>
                      <FiEye /> Quick View
                    </Link>
                  </div>
                </div>
                <div className={styles.cardContent}>
                  <h3>{hamper.name}</h3>
                  <p className={styles.hamperDesc}>{hamper.description?.substring(0, 60)}...</p>
                  <div className={styles.cardFooter}>
                    <div className={styles.priceInfo}>
                      <span className={styles.hamperPrice}>₹{hamper.price}</span>
                    </div>
                    <Link to={`/hamper/${hamper.id}`} className={styles.viewBtn}>
                      View Details <FiChevronRight />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Hampers;