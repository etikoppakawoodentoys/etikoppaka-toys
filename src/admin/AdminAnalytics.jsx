import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import styles from './AdminAnalytics.module.css';

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    totalProducts: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    monthlyRevenue: [],
    topProducts: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    // Get total orders
    const { data: orders } = await supabase.from('orders').select('*');
    const { data: customers } = await supabase.from('users').select('id');
    const { data: products } = await supabase.from('products').select('id');
    
    const deliveredOrders = orders?.filter(o => o.status === 'delivered') || [];
    const pendingOrders = orders?.filter(o => o.status === 'pending') || [];
    
    setAnalytics({
      totalOrders: orders?.length || 0,
      totalRevenue: deliveredOrders.reduce((sum, o) => sum + o.total_amount, 0),
      totalCustomers: customers?.length || 0,
      totalProducts: products?.length || 0,
      pendingOrders: pendingOrders.length,
      deliveredOrders: deliveredOrders.length,
      monthlyRevenue: [
        { month: 'Jan', revenue: 12000 },
        { month: 'Feb', revenue: 15000 },
        { month: 'Mar', revenue: 18000 }
      ],
      topProducts: [
        { name: 'Traditional Dancing Doll', sales: 45 },
        { name: 'Elephant Toy Set', sales: 32 },
        { name: 'Pull Along Train', sales: 28 }
      ]
    });
    setLoading(false);
  };

  if (loading) return <div className="loading-spinner"></div>;

  return (
    <div className={styles.adminAnalytics}>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📦</div>
          <div className={styles.statInfo}>
            <h3>Total Orders</h3>
            <p className={styles.statNumber}>{analytics.totalOrders}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>💰</div>
          <div className={styles.statInfo}>
            <h3>Total Revenue</h3>
            <p className={styles.statNumber}>₹{analytics.totalRevenue.toLocaleString()}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>👥</div>
          <div className={styles.statInfo}>
            <h3>Customers</h3>
            <p className={styles.statNumber}>{analytics.totalCustomers}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🛍️</div>
          <div className={styles.statInfo}>
            <h3>Products</h3>
            <p className={styles.statNumber}>{analytics.totalProducts}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>⏳</div>
          <div className={styles.statInfo}>
            <h3>Pending Orders</h3>
            <p className={styles.statNumber}>{analytics.pendingOrders}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statInfo}>
            <h3>Delivered</h3>
            <p className={styles.statNumber}>{analytics.deliveredOrders}</p>
          </div>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3>Monthly Revenue</h3>
          <div className={styles.barChart}>
            {analytics.monthlyRevenue.map(item => (
              <div key={item.month} className={styles.barItem}>
                <div className={styles.barLabel}>{item.month}</div>
                <div className={styles.barWrapper}>
                  <div className={styles.bar} style={{ height: `${(item.revenue / 20000) * 100}%` }}></div>
                </div>
                <div className={styles.barValue}>₹{item.revenue}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3>Top Selling Products</h3>
          <div className={styles.topProducts}>
            {analytics.topProducts.map((product, idx) => (
              <div key={idx} className={styles.productRow}>
                <span className={styles.productRank}>#{idx + 1}</span>
                <span className={styles.productName}>{product.name}</span>
                <span className={styles.productSales}>{product.sales} sold</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;