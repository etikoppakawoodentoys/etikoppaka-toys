import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { 
  FiPackage, 
  FiShoppingCart, 
  FiTag, 
  FiUsers, 
  FiBarChart2, 
  FiLogOut,
  FiBell,
  FiDollarSign,
  FiTrendingUp,
  FiClock,
  FiGrid,
  FiArrowLeft,
  FiInbox,
  FiCreditCard,
  FiRefreshCw,
  FiXCircle
} from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import styles from './AdminDashboard.module.css';

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalCustomers: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    totalBulkOrders: 0,
    pendingBulkOrders: 0,
    paidOrders: 0,
    codOrders: 0
  });
  const [salesData, setSalesData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [recentBulkOrders, setRecentBulkOrders] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [notification, setNotification] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    checkAdmin();
    fetchDashboardData();
    
    // Set up real-time subscriptions for orders and payments
    const ordersSubscription = supabase
      .channel('orders-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        console.log('Real-time order update:', payload);
        fetchDashboardData(); // Refresh dashboard data
        
        // Show notification for new orders
        if (payload.eventType === 'INSERT') {
          setNotification({
            type: 'success',
            message: `🆕 New order received! Order #${payload.new.order_number}`
          });
          setTimeout(() => setNotification(null), 5000);
        }
        
        // Show notification for payment status changes
        if (payload.old?.payment_status !== payload.new?.payment_status && payload.new?.payment_status === 'paid') {
          setNotification({
            type: 'success',
            message: `💰 Payment received for Order #${payload.new.order_number}!`
          });
          setTimeout(() => setNotification(null), 5000);
        }
      })
      .subscribe();

    // Real-time subscription for bulk orders
    const bulkOrdersSubscription = supabase
      .channel('bulk-orders-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bulk_orders' }, (payload) => {
        console.log('New bulk order:', payload);
        fetchDashboardData();
        setNotification({
          type: 'info',
          message: `📦 New bulk order inquiry from ${payload.new.full_name}`
        });
        setTimeout(() => setNotification(null), 5000);
      })
      .subscribe();

    // Real-time subscription for payments
    const paymentsSubscription = supabase
      .channel('payments-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'razorpay_payments' }, (payload) => {
        console.log('New payment recorded:', payload);
        fetchDashboardData();
        setNotification({
          type: 'success',
          message: `💳 Payment received! Amount: ₹${(payload.new.amount / 100).toLocaleString()}`
        });
        setTimeout(() => setNotification(null), 5000);
      })
      .subscribe();

    return () => {
      ordersSubscription.unsubscribe();
      bulkOrdersSubscription.unsubscribe();
      paymentsSubscription.unsubscribe();
    };
  }, []);

  const checkAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!data?.is_admin) {
        navigate('/');
        return;
      }

      setUser(user);
    } catch (error) {
      console.error('Admin check error:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch orders with payment status
      const { data: orders } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });

      if (orders) {
        const totalOrders = orders.length;
        const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
        const pendingOrders = orders.filter(o => o.status === 'pending').length;
        const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
        const paidOrders = orders.filter(o => o.payment_status === 'paid').length;
        const codOrders = orders.filter(o => o.payment_method === 'COD' && o.payment_status !== 'paid').length;
        const totalRevenue = orders
          .filter(o => o.payment_status === 'paid' || o.status === 'delivered')
          .reduce((sum, o) => sum + o.total_amount, 0);

        setStats(prev => ({
          ...prev,
          totalOrders,
          totalRevenue,
          pendingOrders,
          deliveredOrders,
          cancelledOrders,
          paidOrders,
          codOrders
        }));

        // Recent orders
        setRecentOrders(orders.slice(0, 5));

        // Get recent payments
        const paidOrdersList = orders.filter(o => o.razorpay_payment_id).slice(0, 5);
        setRecentPayments(paidOrdersList);

        // Sales data for chart
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonth = new Date().getMonth();
        const salesDataArray = [];
        
        for (let i = 5; i >= 0; i--) {
          const monthIndex = (currentMonth - i + 12) % 12;
          const monthOrders = orders.filter(o => {
            const orderMonth = new Date(o.created_at).getMonth();
            return orderMonth === monthIndex && (o.payment_status === 'paid' || o.status === 'delivered');
          });
          const monthlyRevenue = monthOrders.reduce((sum, o) => sum + o.total_amount, 0);
          salesDataArray.push({
            name: months[monthIndex],
            sales: monthlyRevenue,
            orders: monthOrders.length
          });
        }
        setSalesData(salesDataArray);

        // Top products
        const productSales = {};
        orders.forEach(order => {
          if (order.order_items) {
            order.order_items.forEach(item => {
              if (!productSales[item.product_name]) {
                productSales[item.product_name] = { quantity: 0, revenue: 0 };
              }
              productSales[item.product_name].quantity += item.quantity;
              productSales[item.product_name].revenue += item.price * item.quantity;
            });
          }
        });
        
        const topProductsList = Object.entries(productSales)
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5);
        setTopProducts(topProductsList);
      }

      // Fetch products count
      const { count: totalProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
      setStats(prev => ({ ...prev, totalProducts: totalProducts || 0 }));

      // Fetch customers count
      const { count: totalCustomers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      setStats(prev => ({ ...prev, totalCustomers: totalCustomers || 0 }));

      // Fetch bulk orders
      const { data: bulkOrders } = await supabase
        .from('bulk_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (bulkOrders) {
        const totalBulkOrders = bulkOrders.length;
        const pendingBulkOrders = bulkOrders.filter(b => b.status === 'pending').length;
        
        setStats(prev => ({
          ...prev,
          totalBulkOrders,
          pendingBulkOrders
        }));
        
        setRecentBulkOrders(bulkOrders.slice(0, 5));
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
    window.location.reload();
  };

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: <FiBarChart2 /> },
    { path: '/admin/products', label: 'Products', icon: <FiPackage /> },
    { path: '/admin/orders', label: 'Orders', icon: <FiShoppingCart /> },
    { path: '/admin/bulk-orders', label: 'Bulk Orders', icon: <FiInbox /> },
    { path: '/admin/deals', label: 'Deals', icon: <FiTag /> },
    { path: '/admin/customers', label: 'Customers', icon: <FiUsers /> },
  ];

  const isDashboard = location.pathname === '/admin';
  const currentPage = menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard';

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
      </div>
    );
  }

  const COLORS = ['#9E1B1B', '#1F5B3A', '#C89B3C', '#D9B382'];

  return (
    <div className={styles.adminDashboard}>
      {/* Notification Toast */}
      {notification && (
        <div className={`${styles.notificationToast} ${styles[notification.type]}`}>
          {notification.message}
        </div>
      )}

      {/* Top Navigation Bar */}
      <nav className={styles.topNav}>
        <div className={styles.navContainer}>
          <div className={styles.logo}>
            <img src="/logo.png" alt="Etikoppaka Toys" className={styles.logoImage} />
            <span>Etikoppaka Admin</span>
          </div>
          
          <div className={styles.navLinks}>
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`${styles.navLink} ${location.pathname === item.path ? styles.active : ''}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          <div className={styles.navRight}>
            <button className={styles.notificationBtn}>
              <FiBell />
            </button>
            <div className={styles.userMenu}>
              <div className={styles.userAvatar}>
                {user?.email?.[0].toUpperCase()}
              </div>
              <div className={styles.userDropdown}>
                <div className={styles.userInfo}>
                  <strong>{user?.email?.split('@')[0]}</strong>
                  <span>Administrator</span>
                </div>
                <button onClick={handleLogout} className={styles.logoutBtn}>
                  <FiLogOut /> Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          {location.pathname !== '/admin' && (
            <button onClick={() => navigate('/admin')} className={styles.backBtn}>
              <FiArrowLeft /> Back to Dashboard
            </button>
          )}
          <h1 className={styles.pageTitle}>{currentPage}</h1>
        </div>
        <div className={styles.pageHeaderRight}>
          <button onClick={fetchDashboardData} className={styles.refreshBtn}>
            <FiRefreshCw /> Refresh
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {isDashboard && (
          <div className={styles.dashboardContent}>
            {/* Stats Cards */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: '#E8F5E9', color: '#1F5B3A' }}>
                  <FiShoppingCart />
                </div>
                <div className={styles.statInfo}>
                  <h3>Total Orders</h3>
                  <p className={styles.statNumber}>{stats.totalOrders}</p>
                  <span className={styles.statTrend}>All time</span>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: '#E3F2FD', color: '#3B82F6' }}>
                  <FaRupeeSign />
                </div>
                <div className={styles.statInfo}>
                  <h3>Total Revenue</h3>
                  <p className={styles.statNumber}>₹{stats.totalRevenue.toLocaleString()}</p>
                  <span className={styles.statTrend}>From paid orders</span>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: '#D1FAE5', color: '#10B981' }}>
                  <FiCreditCard />
                </div>
                <div className={styles.statInfo}>
                  <h3>Paid Orders</h3>
                  <p className={styles.statNumber}>{stats.paidOrders}</p>
                  <span className={styles.statTrend}>Online payments</span>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: '#FEF3E8', color: '#F59E0B' }}>
                  <FiClock />
                </div>
                <div className={styles.statInfo}>
                  <h3>Pending Orders</h3>
                  <p className={styles.statNumber}>{stats.pendingOrders}</p>
                  <span className={styles.statTrend}>Need attention</span>
                </div>
              </div>
            </div>

            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: '#FFF3E0', color: '#F59E0B' }}>
                  <FiPackage />
                </div>
                <div className={styles.statInfo}>
                  <h3>Total Products</h3>
                  <p className={styles.statNumber}>{stats.totalProducts}</p>
                  <span className={styles.statTrend}>In catalog</span>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: '#FCE4EC', color: '#EC4899' }}>
                  <FiUsers />
                </div>
                <div className={styles.statInfo}>
                  <h3>Total Customers</h3>
                  <p className={styles.statNumber}>{stats.totalCustomers}</p>
                  <span className={styles.statTrend}>Registered users</span>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: '#E8EAF6', color: '#8B5CF6' }}>
                  <FiInbox />
                </div>
                <div className={styles.statInfo}>
                  <h3>Bulk Inquiries</h3>
                  <p className={styles.statNumber}>{stats.totalBulkOrders}</p>
                  <span className={styles.statTrend}>{stats.pendingBulkOrders} pending</span>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: '#FEE2E2', color: '#9E1B1B' }}>
                  <FiXCircle />
                </div>
                <div className={styles.statInfo}>
                  <h3>Cancelled</h3>
                  <p className={styles.statNumber}>{stats.cancelledOrders}</p>
                  <span className={styles.statTrend}>Orders</span>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className={styles.chartsRow}>
              <div className={styles.chartCard}>
                <div className={styles.chartHeader}>
                  <h3>Sales Overview</h3>
                  <p>Monthly revenue trend (₹)</p>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={salesData}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1F5B3A" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#1F5B3A" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                    <Area type="monotone" dataKey="sales" stroke="#1F5B3A" fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className={styles.chartCard}>
                <div className={styles.chartHeader}>
                  <h3>Order Status</h3>
                  <p>Distribution by status</p>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Delivered', value: stats.deliveredOrders, color: '#1F5B3A' },
                        { name: 'Pending', value: stats.pendingOrders, color: '#F59E0B' },
                        { name: 'Cancelled', value: stats.cancelledOrders, color: '#9E1B1B' }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label
                    >
                      {[
                        { name: 'Delivered', value: stats.deliveredOrders, color: '#1F5B3A' },
                        { name: 'Pending', value: stats.pendingOrders, color: '#F59E0B' },
                        { name: 'Cancelled', value: stats.cancelledOrders, color: '#9E1B1B' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Orders Table */}
            <div className={styles.recentOrdersCard}>
              <div className={styles.recentOrdersHeader}>
                <h3>Recent Orders</h3>
                <Link to="/admin/orders" className={styles.viewAllLink}>View All →</Link>
              </div>
              <div className={styles.ordersTable}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Amount</th>
                      <th>Payment</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td>#{order.order_number}</td>
                        <td>₹{order.total_amount}</td>
                        <td>
                          <span className={`${styles.paymentBadge} ${order.payment_status === 'paid' ? styles.paid : styles.pending}`}>
                            {order.payment_status === 'paid' ? '✅ Paid' : '⏳ Pending'}
                          </span>
                        </td>
                        <td>
                          <span className={`${styles.statusBadge} ${styles[order.status]}`}>
                            {order.status.toUpperCase().replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td>{new Date(order.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Bulk Orders */}
            {recentBulkOrders.length > 0 && (
              <div className={styles.recentOrdersCard}>
                <div className={styles.recentOrdersHeader}>
                  <h3>Recent Bulk Order Inquiries</h3>
                  <Link to="/admin/bulk-orders" className={styles.viewAllLink}>View All →</Link>
                </div>
                <div className={styles.ordersTable}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Inquiry #</th>
                        <th>Customer</th>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentBulkOrders.map((order) => (
                        <tr key={order.id}>
                          <td>#{order.order_number}</td>
                          <td>{order.full_name}</td>
                          <td>{order.product_interest?.substring(0, 30)}...</td>
                          <td>{order.quantity} {order.quantity_unit}</td>
                          <td>
                            <span className={`${styles.statusBadge} ${styles[order.status]}`}>
                              {order.status.toUpperCase()}
                            </span>
                          </td>
                          <td>{new Date(order.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        <div className={styles.contentArea}>
          <Outlet context={{ refreshStats: fetchDashboardData }} />
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;