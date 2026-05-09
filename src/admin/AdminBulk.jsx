import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import styles from './AdminBulk.module.css';

const AdminBulk = () => {
  const [bulkProducts, setBulkProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  React.useEffect(() => {
    fetchBulkProducts();
  }, []);

  const fetchBulkProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('is_bulk_order', true);
    
    if (data) setBulkProducts(data);
  };

  const handleBulkOrder = (product) => {
    alert(`Bulk order enquiry for ${product.name}\n\nPlease contact us at bulk@etikoppakatoys.com or call +91 98765 43210 for bulk pricing and customized orders.`);
  };

  return (
    <div className={styles.adminBulk}>
      <div className={styles.header}>
        <h2>Bulk Orders</h2>
        <p>Products available for bulk purchase</p>
      </div>

      <div className={styles.bulkGrid}>
        {bulkProducts.map(product => (
          <div key={product.id} className={styles.bulkCard}>
            <img src={product.image_url || '/images/placeholder.jpg'} alt={product.name} />
            <div className={styles.bulkInfo}>
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <div className={styles.price}>₹{product.price} per piece</div>
              <button onClick={() => handleBulkOrder(product)} className={styles.enquiryBtn}>
                Enquire for Bulk Order →
              </button>
            </div>
          </div>
        ))}
      </div>

      {bulkProducts.length === 0 && (
        <div className={styles.noProducts}>
          <p>No products marked for bulk orders yet.</p>
          <p>Go to Products section and mark products as "Available for Bulk Orders".</p>
        </div>
      )}
    </div>
  );
};

export default AdminBulk;