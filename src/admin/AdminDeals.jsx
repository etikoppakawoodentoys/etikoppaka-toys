import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiX, 
  FiCalendar, 
  FiTag, 
  FiDollarSign,
  FiPercent,
  FiClock,
  FiImage,
  FiUpload,
  FiCheckCircle,
  FiAlertCircle
} from 'react-icons/fi';
import styles from './AdminDeals.module.css';

const AdminDeals = () => {
  const [deals, setDeals] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    deal_price: '',
    start_date: '',
    end_date: '',
    is_active: true,
    deal_image: ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchDeals();
    fetchProducts();

    // Real-time subscription for deals
    const dealsSubscription = supabase
      .channel('deals-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deals' }, () => {
        fetchDeals();
      })
      .subscribe();

    return () => {
      dealsSubscription.unsubscribe();
    };
  }, []);

  const fetchDeals = async () => {
    const { data, error } = await supabase
      .from('deals')
      .select(`
        *,
        products (*)
      `)
      .order('created_at', { ascending: false });

    if (data && !error) {
      setDeals(data);
    }
    setLoading(false);
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, image_url, images');

    if (data && !error) {
      setProducts(data);
    }
  };

  const uploadImage = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `deal_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `deals/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please upload an image file' });
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size should be less than 5MB' });
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setUploading(true);
    const imageUrl = await uploadImage(file);
    if (imageUrl) {
      setFormData(prev => ({ ...prev, deal_image: imageUrl }));
      setMessage({ type: 'success', text: 'Image uploaded successfully!' });
      setTimeout(() => setMessage(''), 3000);
    }
    setUploading(false);
  };

  const handleOpenModal = (deal = null) => {
    if (deal) {
      setEditingDeal(deal);
      setFormData({
        product_id: deal.product_id,
        deal_price: deal.deal_price,
        start_date: deal.start_date,
        end_date: deal.end_date,
        is_active: deal.is_active,
        deal_image: deal.products?.image_url || ''
      });
    } else {
      setEditingDeal(null);
      setFormData({
        product_id: '',
        deal_price: '',
        start_date: '',
        end_date: '',
        is_active: true,
        deal_image: ''
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const selectedProduct = products.find(p => p.id === formData.product_id);
    
    const dealData = {
      product_id: formData.product_id,
      deal_price: parseFloat(formData.deal_price),
      start_date: formData.start_date,
      end_date: formData.end_date,
      is_active: formData.is_active
    };

    let error;
    if (editingDeal) {
      const { error: updateError } = await supabase
        .from('deals')
        .update(dealData)
        .eq('id', editingDeal.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('deals')
        .insert([dealData]);
      error = insertError;
    }

    if (error) {
      setMessage({ type: 'error', text: 'Failed to save deal' });
    } else {
      setMessage({ type: 'success', text: `Deal ${editingDeal ? 'updated' : 'added'} successfully!` });
      fetchDeals();
      setShowModal(false);
    }
    setSaving(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleDelete = async (dealId) => {
    if (window.confirm('Are you sure you want to delete this deal?')) {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', dealId);

      if (error) {
        setMessage({ type: 'error', text: 'Failed to delete deal' });
      } else {
        setMessage({ type: 'success', text: 'Deal deleted successfully!' });
        fetchDeals();
      }
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const toggleDealStatus = async (dealId, currentStatus) => {
    const { error } = await supabase
      .from('deals')
      .update({ is_active: !currentStatus })
      .eq('id', dealId);

    if (!error) {
      fetchDeals();
      setMessage({ type: 'success', text: `Deal ${!currentStatus ? 'activated' : 'deactivated'}!` });
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const calculateDiscount = (originalPrice, dealPrice) => {
    return Math.round(((originalPrice - dealPrice) / originalPrice) * 100);
  };

  const isDealExpired = (endDate) => {
    return new Date(endDate) < new Date();
  };

  const getDaysRemaining = (endDate) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.adminDeals}>
      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
          {message.text}
        </div>
      )}

      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2>Deals Management</h2>
          <p className={styles.headerSubtitle}>Manage your discount offers</p>
        </div>
        <button onClick={() => handleOpenModal()} className={styles.addBtn}>
          <FiPlus /> Add New Deal
        </button>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#E8F5E9', color: '#1F5B3A' }}>
            <FiTag />
          </div>
          <div className={styles.statInfo}>
            <span>Total Deals</span>
            <strong>{deals.length}</strong>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#E3F2FD', color: '#3B82F6' }}>
            <FiCheckCircle />
          </div>
          <div className={styles.statInfo}>
            <span>Active Deals</span>
            <strong>{deals.filter(d => d.is_active && !isDealExpired(d.end_date)).length}</strong>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#FFF3E0', color: '#F59E0B' }}>
            <FiClock />
          </div>
          <div className={styles.statInfo}>
            <span>Expired Deals</span>
            <strong>{deals.filter(d => isDealExpired(d.end_date)).length}</strong>
          </div>
        </div>
      </div>

      <div className={styles.dealsGrid}>
        {deals.map(deal => {
          const discount = calculateDiscount(deal.products?.price, deal.deal_price);
          const expired = isDealExpired(deal.end_date);
          const daysLeft = getDaysRemaining(deal.end_date);
          const productImage = deal.products?.images ? 
            (typeof deal.products.images === 'string' ? JSON.parse(deal.products.images)[0] : deal.products.images[0]) : 
            deal.products?.image_url;

          return (
            <div key={deal.id} className={`${styles.dealCard} ${expired ? styles.expired : ''}`}>
              <div className={styles.dealImage}>
                <img src={productImage || '/placeholder.jpg'} alt={deal.products?.name} />
                {!deal.is_active && <div className={styles.inactiveBadge}>Inactive</div>}
                {expired && deal.is_active && <div className={styles.expiredBadge}>Expired</div>}
              </div>
              <div className={styles.dealContent}>
                <div className={styles.dealHeader}>
                  <h3>{deal.products?.name}</h3>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={deal.is_active}
                      onChange={() => toggleDealStatus(deal.id, deal.is_active)}
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>
                <div className={styles.dealBody}>
                  <div className={styles.priceInfo}>
                    <span className={styles.originalPrice}>₹{deal.products?.price}</span>
                    <span className={styles.dealPrice}>₹{deal.deal_price}</span>
                    <span className={styles.discountBadge}>-{discount}%</span>
                  </div>
                  <div className={styles.dateInfo}>
                    <FiCalendar />
                    <span>{new Date(deal.start_date).toLocaleDateString()}</span>
                    <span>→</span>
                    <span>{new Date(deal.end_date).toLocaleDateString()}</span>
                  </div>
                  <div className={styles.savings}>
                    <FiDollarSign />
                    <span>Save ₹{deal.products?.price - deal.deal_price}</span>
                  </div>
                  {!expired && deal.is_active && (
                    <div className={styles.daysLeft}>
                      <FiClock />
                      <span>{daysLeft} days left</span>
                    </div>
                  )}
                </div>
                <div className={styles.dealActions}>
                  <button onClick={() => handleOpenModal(deal)} className={styles.editBtn}>
                    <FiEdit2 /> Edit
                  </button>
                  <button onClick={() => handleDelete(deal.id)} className={styles.deleteBtn}>
                    <FiTrash2 /> Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {deals.length === 0 && (
        <div className={styles.emptyState}>
          <FiTag className={styles.emptyIcon} />
          <h3>No Deals Yet</h3>
          <p>Create your first deal to start offering discounts</p>
          <button onClick={() => handleOpenModal()} className={styles.emptyBtn}>
            <FiPlus /> Create Deal
          </button>
        </div>
      )}

      {showModal && (
        <div className={styles.modal} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{editingDeal ? 'Edit Deal' : 'Add New Deal'}</h3>
              <button onClick={() => setShowModal(false)} className={styles.closeBtn}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Select Product *</label>
                <select name="product_id" value={formData.product_id} onChange={(e) => setFormData({ ...formData, product_id: e.target.value })} required>
                  <option value="">Select a product</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} - ₹{product.price}
                    </option>
                  ))}
                </select>
              </div>

              {/* Image Upload */}
              <div className={styles.formGroup}>
                <label>Deal Image</label>
                <div className={styles.imageUploadArea}>
                  {formData.deal_image ? (
                    <div className={styles.imagePreview}>
                      <img src={formData.deal_image} alt="Deal preview" />
                      <button 
                        type="button" 
                        className={styles.removeImageBtn}
                        onClick={() => setFormData({ ...formData, deal_image: '' })}
                      >
                        <FiX />
                      </button>
                    </div>
                  ) : (
                    <label className={styles.uploadLabel}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                        style={{ display: 'none' }}
                      />
                      <div className={styles.uploadBox}>
                        {uploading ? (
                          <div className={styles.uploading}>Uploading...</div>
                        ) : (
                          <>
                            <FiUpload />
                            <span>Upload Image</span>
                            <small>PNG, JPG up to 5MB</small>
                          </>
                        )}
                      </div>
                    </label>
                  )}
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Deal Price (₹) *</label>
                  <input 
                    type="number" 
                    name="deal_price" 
                    value={formData.deal_price} 
                    onChange={(e) => setFormData({ ...formData, deal_price: e.target.value })} 
                    placeholder="Enter discounted price"
                    required 
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Start Date *</label>
                  <input 
                    type="date" 
                    name="start_date" 
                    value={formData.start_date} 
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} 
                    required 
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>End Date *</label>
                  <input 
                    type="date" 
                    name="end_date" 
                    value={formData.end_date} 
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} 
                    required 
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkbox}>
                  <input 
                    type="checkbox" 
                    name="is_active" 
                    checked={formData.is_active} 
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} 
                  />
                  Active Deal
                </label>
              </div>

              <div className={styles.formActions}>
                <button type="button" onClick={() => setShowModal(false)} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" disabled={saving || uploading} className={styles.submitBtn}>
                  {saving ? 'Saving...' : (editingDeal ? 'Update Deal' : 'Add Deal')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDeals;