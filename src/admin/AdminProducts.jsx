import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiUpload } from 'react-icons/fi';
import styles from './AdminProducts.module.css';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    images: [],
    stock_quantity: '',
    is_bulk_order: false,
    category: ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Categories list
  const categories = [
    'Traditional Toys',
    'Educational Toys',
    'Decorative Items',
    'Pull Along Toys',
    'Rattles',
    'Puzzles',
    'Animal Figures',
    'Musical Toys',
    'Stacking Toys',
    'Riding Toys'
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && !error) {
      setProducts(data);
    }
    setLoading(false);
  };

  const uploadImage = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `products/${fileName}`;

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
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    if (formData.images.length + files.length > 4) {
      setMessage({ type: 'error', text: 'Maximum 4 images allowed' });
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setUploading(true);
    const uploadedUrls = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please upload only image files' });
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Image size should be less than 5MB' });
        continue;
      }

      const url = await uploadImage(file);
      if (url) {
        uploadedUrls.push(url);
      }
    }

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...uploadedUrls]
    }));
    setUploading(false);
  };

  const removeImage = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      let images = [];
      if (product.images) {
        try {
          images = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
        } catch(e) {
          images = product.image_url ? [product.image_url] : [];
        }
      } else if (product.image_url) {
        images = [product.image_url];
      }
      
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price,
        images: images,
        stock_quantity: product.stock_quantity,
        is_bulk_order: product.is_bulk_order,
        category: product.category || ''
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        images: [],
        stock_quantity: '',
        is_bulk_order: false,
        category: ''
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const productData = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      images: JSON.stringify(formData.images),
      image_url: formData.images[0] || '',
      stock_quantity: parseInt(formData.stock_quantity),
      is_bulk_order: formData.is_bulk_order,
      category: formData.category
    };

    let error;
    if (editingProduct) {
      const { error: updateError } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingProduct.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('products')
        .insert([productData]);
      error = insertError;
    }

    if (error) {
      setMessage({ type: 'error', text: 'Failed to save product' });
    } else {
      setMessage({ type: 'success', text: `Product ${editingProduct ? 'updated' : 'added'} successfully!` });
      fetchProducts();
      setShowModal(false);
    }
    setSaving(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        setMessage({ type: 'error', text: 'Failed to delete product' });
      } else {
        setMessage({ type: 'success', text: 'Product deleted successfully!' });
        fetchProducts();
      }
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return <div className={styles.loadingContainer}><div className={styles.loadingSpinner}></div></div>;
  }

  return (
    <div className={styles.adminProducts}>
      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <div className={styles.header}>
        <h2>Product Management</h2>
        <div className={styles.headerActions}>
          <div className={styles.searchBox}>
            <FiSearch />
            <input
              type="text"
              placeholder="Search by name or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={() => handleOpenModal()} className={styles.addBtn}>
            <FiPlus /> Add Product
          </button>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Bulk Order</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(product => {
              let displayImage = '/placeholder.jpg';
              if (product.images) {
                try {
                  const images = JSON.parse(product.images);
                  if (images && images.length > 0) {
                    displayImage = images[0];
                  }
                } catch(e) {
                  displayImage = product.image_url || '/placeholder.jpg';
                }
              } else if (product.image_url) {
                displayImage = product.image_url;
              }
              
              return (
                <tr key={product.id}>
                  <td>
                    <img src={displayImage} alt={product.name} className={styles.productImage} />
                  </td>
                  <td>{product.name}</td>
                  <td>
                    <span className={styles.categoryBadge}>
                      {product.category || 'Uncategorized'}
                    </span>
                  </td>
                  <td>₹{product.price}</td>
                  <td>
                    <span className={product.stock_quantity > 10 ? styles.inStock : styles.lowStock}>
                      {product.stock_quantity}
                    </span>
                  </td>
                  <td>{product.is_bulk_order ? 'Yes' : 'No'}</td>
                  <td>
                    <button onClick={() => handleOpenModal(product)} className={styles.editBtn}>
                      <FiEdit2 />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className={styles.deleteBtn}>
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className={styles.modal} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={() => setShowModal(false)} className={styles.closeBtn}><FiX /></button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Product Name *</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                  required 
                />
              </div>

              <div className={styles.formGroup}>
                <label>Category *</label>
                <select 
                  value={formData.category} 
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })} 
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                  rows="3" 
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Price (₹) *</label>
                  <input 
                    type="number" 
                    value={formData.price} 
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })} 
                    required 
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Stock Quantity *</label>
                  <input 
                    type="number" 
                    value={formData.stock_quantity} 
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })} 
                    required 
                  />
                </div>
              </div>

              {/* Image Upload Section */}
              <div className={styles.formGroup}>
                <label>Product Images (2-4 images)</label>
                <div className={styles.imageUploadArea}>
                  <div className={styles.imagePreviewGrid}>
                    {formData.images.map((image, index) => (
                      <div key={index} className={styles.imagePreview}>
                        <img src={image} alt={`Preview ${index + 1}`} />
                        <button 
                          type="button" 
                          className={styles.removeImageBtn}
                          onClick={() => removeImage(index)}
                        >
                          <FiX />
                        </button>
                      </div>
                    ))}
                    {formData.images.length < 4 && (
                      <label className={styles.uploadLabel}>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
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
                  <p className={styles.imageHint}>Upload 2-4 images. First image will be the main product image.</p>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkbox}>
                  <input 
                    type="checkbox" 
                    checked={formData.is_bulk_order} 
                    onChange={(e) => setFormData({ ...formData, is_bulk_order: e.target.checked })} 
                  />
                  Available for Bulk Orders
                </label>
              </div>

              <div className={styles.formActions}>
                <button type="button" onClick={() => setShowModal(false)} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" disabled={saving || uploading} className={styles.submitBtn}>
                  {saving ? 'Saving...' : (editingProduct ? 'Update Product' : 'Add Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;