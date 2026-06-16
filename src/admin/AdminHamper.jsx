import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { 
  FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiUpload, 
  FiPackage, FiRefreshCw, FiAlertCircle, FiChevronDown, FiChevronUp, FiList
} from 'react-icons/fi';
import styles from './AdminHamper.module.css';

const AdminHamper = () => {
  const [hampers, setHampers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingHamper, setEditingHamper] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedHamper, setExpandedHamper] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    images: [],
    items: []
  });
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedProductQty, setSelectedProductQty] = useState(1);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef(null);

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
    fetchProducts();
    
    const hampersSubscription = supabase
      .channel('hampers-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'hampers' }, 
        () => fetchHampers()
      )
      .subscribe();

    const productsSubscription = supabase
      .channel('products-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => fetchProducts()
      )
      .subscribe();

    return () => {
      hampersSubscription.unsubscribe();
      productsSubscription.unsubscribe();
    };
  }, []);

  const fetchHampers = async () => {
    setLoading(true);
    try {
      const { data: hampersData, error: hampersError } = await supabase
        .from('hampers')
        .select('*')
        .order('created_at', { ascending: false });

      if (hampersError) throw hampersError;

      if (!hampersData || hampersData.length === 0) {
        setHampers([]);
        setLoading(false);
        return;
      }

      const hamperIds = hampersData.map(h => h.id);
      const { data: itemsData, error: itemsError } = await supabase
        .from('hamper_items')
        .select('*')
        .in('hamper_id', hamperIds);

      if (itemsError) throw itemsError;

      // Fetch products for all items
      const itemsWithProducts = [];
      if (itemsData && itemsData.length > 0) {
        for (const item of itemsData) {
          const { data: productData, error: productError } = await supabase
            .from('products')
            .select('id, name, price, description, images, stock_quantity')
            .eq('id', item.product_id)
            .single();
          
          if (!productError && productData) {
            itemsWithProducts.push({
              ...item,
              products: productData
            });
          }
        }
      }

      const hampersWithItems = hampersData.map(hamper => ({
        ...hamper,
        hamper_items: itemsWithProducts.filter(item => item.hamper_id === hamper.id) || []
      }));

      setHampers(hampersWithItems);
    } catch (err) {
      console.error('Error fetching hampers:', err);
      setMessage({ type: 'error', text: 'Failed to fetch hampers' });
    }
    setLoading(false);
  };

  const fetchProducts = async () => {
    setProductsLoading(true);
    setProductsError(null);
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, description, images, stock_quantity')
        .order('name', { ascending: true });

      if (error) throw error;
      
      if (data && data.length > 0) {
        const formattedProducts = data.map(product => ({
          ...product,
          price: typeof product.price === 'string' ? parseFloat(product.price) : (product.price || 0)
        }));
        setProducts(formattedProducts);
      } else {
        setProducts([]);
        setProductsError('No products found. Please add products first.');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setProductsError(err.message);
      setProducts([]);
    }
    
    setProductsLoading(false);
  };

  const uploadImage = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `hamper_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `hampers/${fileName}`;

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

  const processFiles = async (files) => {
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

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    await processFiles(files);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await processFiles(files);
    }
  };

  const removeImage = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove)
    }));
  };

  const addProductToHamper = () => {
    if (!selectedProductId) {
      setMessage({ type: 'error', text: 'Please select a product' });
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const product = products.find(p => String(p.id) === String(selectedProductId));
    
    if (!product) {
      setMessage({ type: 'error', text: 'Product not found' });
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const existingItem = formData.items.find(item => String(item.product_id) === String(product.id));
    if (existingItem) {
      setMessage({ type: 'error', text: 'Product already added to hamper' });
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    // Get the price - ensure it's a valid number
    const productPrice = typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0;

    const newItem = {
      product_id: product.id,
      product_name: product.name,
      product_price: productPrice,
      quantity: parseInt(selectedProductQty) || 1,
      product: product
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    
    setSelectedProductId('');
    setSelectedProductQty(1);
    
    setMessage({ type: 'success', text: `${product.name} added successfully!` });
    setTimeout(() => setMessage(''), 2000);
  };

  const removeProductFromHamper = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateProductQuantity = (index, quantity) => {
    const newQuantity = parseInt(quantity);
    if (isNaN(newQuantity) || newQuantity < 1) return;
    
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, quantity: newQuantity } : item
      )
    }));
  };

  const calculateTotalPrice = () => {
    const total = formData.items.reduce((total, item) => {
      const price = typeof item.product_price === 'number' ? item.product_price : parseFloat(item.product_price) || 0;
      const qty = typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 0;
      return total + (price * qty);
    }, 0);
    return total;
  };

  const handleOpenModal = (hamper = null) => {
    if (hamper) {
      setEditingHamper(hamper);
      let images = [];
      if (hamper.images) {
        try {
          images = typeof hamper.images === 'string' ? JSON.parse(hamper.images) : hamper.images;
        } catch(e) {
          images = hamper.image_url ? [hamper.image_url] : [];
        }
      } else if (hamper.image_url) {
        images = [hamper.image_url];
      }
      
      const items = (hamper.hamper_items || []).map(item => ({
        product_id: item.product_id,
        product_name: item.products?.name,
        product_price: item.products?.price ? parseFloat(item.products.price) : 0,
        quantity: parseInt(item.quantity) || 1,
        product: item.products
      }));
      
      setFormData({
        name: hamper.name || '',
        description: hamper.description || '',
        price: hamper.price ? String(hamper.price) : '',
        images: images,
        items: items
      });
    } else {
      setEditingHamper(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        images: [],
        items: []
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Hamper name is required' });
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    if (formData.images.length === 0) {
      setMessage({ type: 'error', text: 'Please upload at least one image' });
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    if (formData.items.length === 0) {
      setMessage({ type: 'error', text: 'Please add at least one product to the hamper' });
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setSaving(true);

    const totalPrice = formData.price ? parseFloat(formData.price) : calculateTotalPrice();
    
    const hamperData = {
      name: formData.name,
      description: formData.description,
      price: totalPrice,
      images: JSON.stringify(formData.images),
      image_url: formData.images[0] || '',
      is_active: true
    };

    let error;
    let hamperId;

    if (editingHamper) {
      const { error: updateError } = await supabase
        .from('hampers')
        .update(hamperData)
        .eq('id', editingHamper.id);
      error = updateError;
      hamperId = editingHamper.id;
      
      if (!error) {
        await supabase
          .from('hamper_items')
          .delete()
          .eq('hamper_id', hamperId);
      }
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('hampers')
        .insert([hamperData])
        .select();
      error = insertError;
      hamperId = inserted?.[0]?.id;
    }

    if (!error && hamperId) {
      const hamperItems = formData.items.map(item => ({
        hamper_id: hamperId,
        product_id: item.product_id,
        quantity: item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('hamper_items')
        .insert(hamperItems);

      if (itemsError) {
        console.error('Items error:', itemsError);
        setMessage({ type: 'error', text: 'Failed to save hamper items' });
      } else {
        setMessage({ type: 'success', text: `Hamper ${editingHamper ? 'updated' : 'added'} successfully!` });
        fetchHampers();
        setShowModal(false);
      }
    } else if (error) {
      console.error('Save error:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to save hamper' });
    }

    setSaving(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleDelete = async (hamper) => {
    if (window.confirm(`Are you sure you want to delete "${hamper.name}"?`)) {
      const { error } = await supabase
        .from('hampers')
        .delete()
        .eq('id', hamper.id);

      if (error) {
        setMessage({ type: 'error', text: 'Failed to delete hamper' });
      } else {
        setMessage({ type: 'success', text: 'Hamper deleted successfully!' });
        fetchHampers();
      }
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const filteredHampers = hampers.filter(hamper =>
    hamper.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (hamper.description && hamper.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading hampers...</p>
      </div>
    );
  }

  // Mobile UI
  if (isMobile) {
    return (
      <div className={styles.mobileAdminHamper}>
        {message && (
          <div className={`${styles.mobileMessage} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}

        <div className={styles.mobileHeader}>
          <h2>Gift Hampers</h2>
          <button onClick={() => handleOpenModal()} className={styles.mobileAddBtn}>
            <FiPlus /> Add
          </button>
        </div>

        <div className={styles.mobileSearchBox}>
          <FiSearch />
          <input
            type="text"
            placeholder="Search hampers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className={styles.mobileClearSearch} onClick={() => setSearchTerm('')}>
              <FiX />
            </button>
          )}
        </div>

        <div className={styles.mobileStats}>
          <span>Products available: {products.length}</span>
          <button onClick={fetchProducts} className={styles.mobileRefreshBtn}>
            <FiRefreshCw />
          </button>
        </div>

        <div className={styles.mobileHampersList}>
          {filteredHampers.map((hamper) => {
            let displayImage = '/placeholder.jpg';
            if (hamper.images) {
              try {
                const images = JSON.parse(hamper.images);
                if (images && images.length > 0) {
                  displayImage = images[0];
                }
              } catch(e) {
                displayImage = hamper.image_url || '/placeholder.jpg';
              }
            } else if (hamper.image_url) {
              displayImage = hamper.image_url;
            }
            
            return (
              <div key={hamper.id} className={styles.mobileHamperCard}>
                <div className={styles.mobileHamperHeader}>
                  <img src={displayImage} alt={hamper.name} />
                  <div className={styles.mobileHamperInfo}>
                    <h3>{hamper.name}</h3>
                    <div className={styles.mobileHamperPrice}>₹{hamper.price}</div>
                    <div className={styles.mobileHamperItemCount}>
                      {hamper.hamper_items?.length || 0} items
                    </div>
                  </div>
                  <button 
                    className={styles.mobileExpandBtn}
                    onClick={() => setExpandedHamper(expandedHamper === hamper.id ? null : hamper.id)}
                  >
                    {expandedHamper === hamper.id ? <FiChevronUp /> : <FiChevronDown />}
                  </button>
                </div>
                
                {expandedHamper === hamper.id && (
                  <div className={styles.mobileHamperDetails}>
                    <p className={styles.mobileHamperDesc}>{hamper.description}</p>
                    <div className={styles.mobileHamperItems}>
                      <h4>Items Included:</h4>
                      {hamper.hamper_items?.map((item, idx) => (
                        <div key={idx} className={styles.mobileHamperItem}>
                          <span>• {item.products?.name} x{item.quantity}</span>
                          <span className={styles.mobileItemPrice}>₹{(item.products?.price || 0) * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                    <div className={styles.mobileHamperActions}>
                      <button onClick={() => handleOpenModal(hamper)} className={styles.mobileEditBtn}>
                        <FiEdit2 /> Edit
                      </button>
                      <button onClick={() => handleDelete(hamper)} className={styles.mobileDeleteBtn}>
                        <FiTrash2 /> Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredHampers.length === 0 && (
          <div className={styles.mobileNoResults}>
            <FiPackage />
            <p>No hampers found</p>
            <button onClick={() => handleOpenModal()} className={styles.mobileCreateBtn}>
              Create Your First Hamper
            </button>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className={styles.mobileModal} onClick={() => setShowModal(false)}>
            <div className={styles.mobileModalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.mobileModalHeader}>
                <h3>{editingHamper ? 'Edit Hamper' : 'Add Hamper'}</h3>
                <button onClick={() => setShowModal(false)}><FiX /></button>
              </div>
              <div className={styles.mobileModalBody}>
                <form onSubmit={handleSubmit}>
                  <div className={styles.mobileFormGroup}>
                    <label>Hamper Name *</label>
                    <input
                      type="text"
                      placeholder="Enter hamper name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className={styles.mobileFormGroup}>
                    <label>Description</label>
                    <textarea
                      placeholder="Describe your hamper..."
                      rows="3"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  
                  <div className={styles.mobileFormGroup}>
                    <label>Price (₹) - Optional</label>
                    <input
                      type="number"
                      placeholder="Leave empty to auto-calculate"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                    <small>Leave empty to auto-calculate from products</small>
                  </div>
                  
                  <div className={styles.mobileImageSection}>
                    <label>Images ({formData.images.length}/4) *</label>
                    <div className={styles.mobileImagePreview}>
                      {formData.images.map((img, idx) => (
                        <div key={idx} className={styles.mobileImagePreviewItem}>
                          <img src={img} alt="Preview" />
                          <button type="button" onClick={() => removeImage(idx)}><FiX /></button>
                        </div>
                      ))}
                      {formData.images.length < 4 && (
                        <label className={styles.mobileUploadLabel}>
                          <FiUpload />
                          <input type="file" accept="image/*" multiple onChange={handleImageUpload} hidden />
                          <span>Upload</span>
                        </label>
                      )}
                    </div>
                  </div>
                  
                  <div className={styles.mobileProductsSection}>
                    <label>Products in Hamper *</label>
                    
                    {productsLoading ? (
                      <div className={styles.mobileLoadingProducts}>
                        <div className={styles.spinner}></div>
                        <span>Loading products...</span>
                      </div>
                    ) : productsError ? (
                      <div className={styles.mobileProductsError}>
                        <FiAlertCircle />
                        <span>{productsError}</span>
                        <button onClick={fetchProducts}>Retry</button>
                      </div>
                    ) : (
                      <>
                        <div className={styles.mobileProductSelect}>
                          <select 
                            value={selectedProductId} 
                            onChange={(e) => setSelectedProductId(e.target.value)}
                          >
                            <option value="">Select a product</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} - ₹{p.price}
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            placeholder="Qty"
                            value={selectedProductQty}
                            onChange={(e) => setSelectedProductQty(Math.max(1, parseInt(e.target.value) || 1))}
                            min="1"
                          />
                          <button type="button" onClick={addProductToHamper}>Add</button>
                        </div>
                        
                        <div className={styles.mobileProductsList}>
                          {formData.items.length === 0 ? (
                            <p className={styles.mobileNoProducts}>No products added yet</p>
                          ) : (
                            formData.items.map((item, idx) => (
                              <div key={idx} className={styles.mobileProductItem}>
                                <div className={styles.mobileProductItemInfo}>
                                  <span className={styles.mobileProductItemName}>{item.product_name}</span>
                                  <span className={styles.mobileProductItemPrice}>₹{item.product_price} each</span>
                                </div>
                                <div className={styles.mobileProductItemControls}>
                                  <input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => updateProductQuantity(idx, e.target.value)}
                                    min="1"
                                  />
                                  <button type="button" onClick={() => removeProductFromHamper(idx)}>
                                    <FiTrash2 />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </>
                    )}
                    
                    {formData.items.length > 0 && (
                      <div className={styles.mobileTotalPrice}>
                        <strong>Total: ₹{calculateTotalPrice()}</strong>
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.mobileFormActions}>
                    <button type="button" onClick={() => setShowModal(false)} className={styles.mobileCancelBtn}>
                      Cancel
                    </button>
                    <button type="submit" className={styles.mobileSubmitBtn} disabled={saving || uploading}>
                      {saving ? 'Saving...' : (editingHamper ? 'Update Hamper' : 'Create Hamper')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop UI
  return (
    <div className={styles.adminHamper}>
      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          <FiAlertCircle />
          <span>{message.text}</span>
          <button onClick={() => setMessage('')} className={styles.messageClose}>
            <FiX />
          </button>
        </div>
      )}

      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h2>Gift Hamper Management</h2>
          <p>Create and manage beautiful gift hampers</p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.searchBox}>
            <FiSearch />
            <input
              type="text"
              placeholder="Search hampers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className={styles.clearSearch} onClick={() => setSearchTerm('')}>
                <FiX />
              </button>
            )}
          </div>
          <button onClick={fetchProducts} className={styles.refreshBtn} title="Refresh Products">
            <FiRefreshCw />
          </button>
          <button onClick={() => handleOpenModal()} className={styles.addBtn}>
            <FiPlus /> Add Hamper
          </button>
        </div>
      </div>

      <div className={styles.statsBar}>
        <div className={styles.statItem}>
          <FiPackage />
          <span>Total Hampers: {hampers.length}</span>
        </div>
        <div className={styles.statItem}>
          <FiList />
          <span>Available Products: {products.length}</span>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Description</th>
              <th>Price</th>
              <th>Items</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredHampers.map(hamper => {
              let displayImage = '/placeholder.jpg';
              if (hamper.images) {
                try {
                  const images = JSON.parse(hamper.images);
                  if (images && images.length > 0) {
                    displayImage = images[0];
                  }
                } catch(e) {
                  displayImage = hamper.image_url || '/placeholder.jpg';
                }
              } else if (hamper.image_url) {
                displayImage = hamper.image_url;
              }
              
              return (
                <tr key={hamper.id}>
                  <td className={styles.imageCell}>
                    <img src={displayImage} alt={hamper.name} className={styles.productImage} />
                  </td>
                  <td className={styles.nameCell}>
                    <strong>{hamper.name}</strong>
                  </td>
                  <td className={styles.descCell}>
                    {hamper.description?.substring(0, 60)}...
                  </td>
                  <td className={styles.priceCell}>
                    <span className={styles.priceValue}>₹{hamper.price}</span>
                  </td>
                  <td className={styles.itemsCell}>
                    <span className={styles.itemsBadge}>{hamper.hamper_items?.length || 0} items</span>
                  </td>
                  <td className={styles.actionsCell}>
                    <button onClick={() => handleOpenModal(hamper)} className={styles.editBtn} title="Edit">
                      <FiEdit2 />
                    </button>
                    <button onClick={() => handleDelete(hamper)} className={styles.deleteBtn} title="Delete">
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredHampers.length === 0 && (
        <div className={styles.noResults}>
          <FiPackage className={styles.noResultsIcon} />
          <h3>No hampers found</h3>
          <p>{searchTerm ? `No hampers matching "${searchTerm}"` : 'Get started by creating your first hamper'}</p>
          {!searchTerm && (
            <button onClick={() => handleOpenModal()} className={styles.createFirstBtn}>
              <FiPlus /> Create Your First Hamper
            </button>
          )}
        </div>
      )}

      {/* Modal - Desktop */}
      {showModal && (
        <div className={styles.modal} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{editingHamper ? 'Edit Hamper' : 'Create New Hamper'}</h3>
              <button onClick={() => setShowModal(false)} className={styles.closeBtn}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Hamper Name <span className={styles.required}>*</span></label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    placeholder="Enter hamper name"
                    required 
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Price (₹) <span className={styles.optional}>(Optional)</span></label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={formData.price} 
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })} 
                    placeholder="Auto-calculated if empty"
                  />
                  <small>Leave empty to auto-calculate from products</small>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                  rows="3"
                  placeholder="Describe your hamper..."
                />
              </div>

              {/* Image Upload */}
              <div className={styles.formGroup}>
                <label>Hamper Images <span className={styles.required}>*</span> <span className={styles.optional}>(2-4 images)</span></label>
                <div 
                  className={`${styles.imageUploadArea} ${dragActive ? styles.dragActive : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
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
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          disabled={uploading}
                          style={{ display: 'none' }}
                        />
                        <div className={styles.uploadBox}>
                          {uploading ? (
                            <div className={styles.uploading}>
                              <div className={styles.spinner}></div>
                              <span>Uploading...</span>
                            </div>
                          ) : (
                            <>
                              <FiUpload size={24} />
                              <span>Click or Drag & Drop</span>
                              <small>PNG, JPG up to 5MB</small>
                            </>
                          )}
                        </div>
                      </label>
                    )}
                  </div>
                  <p className={styles.imageHint}>
                    {formData.images.length === 0 
                      ? "Upload 2-4 images. First image will be the main image."
                      : `${formData.images.length} of 4 images uploaded`}
                  </p>
                </div>
              </div>

              {/* Products Selection */}
              <div className={styles.formGroup}>
                <label>Products in Hamper <span className={styles.required}>*</span></label>
                <div className={styles.productSelectionArea}>
                  <div className={styles.addProductRow}>
                    {productsLoading ? (
                      <div className={styles.loadingProducts}>
                        <div className={styles.spinner}></div>
                        <span>Loading products...</span>
                      </div>
                    ) : productsError ? (
                      <div className={styles.productsError}>
                        <FiAlertCircle />
                        <span>{productsError}</span>
                        <button type="button" onClick={fetchProducts}>Retry</button>
                      </div>
                    ) : (
                      <>
                        <select 
                          value={selectedProductId} 
                          onChange={(e) => setSelectedProductId(e.target.value)}
                          className={styles.productSelect}
                        >
                          <option value="">Select a product</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} - ₹{typeof p.price === 'number' ? p.price.toFixed(2) : p.price}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          placeholder="Qty"
                          value={selectedProductQty}
                          onChange={(e) => setSelectedProductQty(Math.max(1, parseInt(e.target.value) || 1))}
                          min="1"
                          className={styles.quantityInput}
                        />
                        <button type="button" onClick={addProductToHamper} className={styles.addProductBtn}>
                          <FiPlus /> Add
                        </button>
                      </>
                    )}
                  </div>

                  <div className={styles.productsTable}>
                    {formData.items.length === 0 ? (
                      <div className={styles.noProductsMsg}>
                        <FiPackage />
                        <p>No products added. Click "Add" to include products in this hamper.</p>
                      </div>
                    ) : (
                      <table className={styles.itemsTable}>
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>Price</th>
                            <th>Total</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {formData.items.map((item, idx) => {
                            const price = typeof item.product_price === 'number' ? item.product_price : parseFloat(item.product_price) || 0;
                            const qty = typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 0;
                            const total = price * qty;
                            return (
                              <tr key={idx}>
                                <td className={styles.productNameCell}>{item.product_name}</td>
                                <td>
                                  <input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => updateProductQuantity(idx, e.target.value)}
                                    min="1"
                                    className={styles.itemQtyInput}
                                  />
                                </td>
                                <td>₹{price.toFixed(2)}</td>
                                <td className={styles.itemTotalCell}>₹{total.toFixed(2)}</td>
                                <td>
                                  <button type="button" onClick={() => removeProductFromHamper(idx)} className={styles.removeItemBtn}>
                                    <FiTrash2 />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                          <tr className={styles.totalRow}>
                            <td colSpan="3"><strong>Total Hamper Value</strong></td>
                            <td colSpan="2"><strong className={styles.totalAmount}>₹{calculateTotalPrice().toFixed(2)}</strong></td>
                          </tr>
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.formActions}>
                <button type="button" onClick={() => setShowModal(false)} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" disabled={saving || uploading} className={styles.submitBtn}>
                  {saving ? 'Saving...' : (editingHamper ? 'Update Hamper' : 'Create Hamper')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHamper;