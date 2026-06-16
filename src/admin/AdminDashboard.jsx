import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { 
  FiPackage, FiShoppingCart, FiTag, FiUsers, FiBarChart2, FiLogOut,
  FiBell, FiDollarSign, FiTrendingUp, FiClock, FiGrid, FiArrowLeft,
  FiInbox, FiCreditCard, FiRefreshCw, FiXCircle, FiMail, FiGift,FiImage,
  FiMenu, FiX, FiChevronRight
} from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import styles from './AdminDashboard.module.css';

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0, totalRevenue: 0, totalProducts: 0, totalCustomers: 0,
    pendingOrders: 0, deliveredOrders: 0, cancelledOrders: 0,
    totalBulkOrders: 0, pendingBulkOrders: 0, paidOrders: 0, codOrders: 0
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

    const ordersSubscription = supabase
      .channel('orders-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        fetchDashboardData();
        if (payload.eventType === 'INSERT') {
          setNotification({ type: 'success', message: `🆕 New order received! Order #${payload.new.order_number}` });
          setTimeout(() => setNotification(null), 5000);
        }
        if (payload.old?.payment_status !== payload.new?.payment_status && payload.new?.payment_status === 'paid') {
          setNotification({ type: 'success', message: `💰 Payment received for Order #${payload.new.order_number}!` });
          setTimeout(() => setNotification(null), 5000);
        }
      })
      .subscribe();

    const bulkOrdersSubscription = supabase
      .channel('bulk-orders-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bulk_orders' }, (payload) => {
        fetchDashboardData();
        setNotification({ type: 'info', message: `📦 New bulk order inquiry from ${payload.new.full_name}` });
        setTimeout(() => setNotification(null), 5000);
      })
      .subscribe();

    const paymentsSubscription = supabase
      .channel('payments-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'razorpay_payments' }, (payload) => {
        fetchDashboardData();
        setNotification({ type: 'success', message: `💳 Payment received! Amount: ₹${(payload.new.amount / 100).toLocaleString()}` });
        setTimeout(() => setNotification(null), 5000);
      })
      .subscribe();

    return () => {
      ordersSubscription.unsubscribe();
      bulkOrdersSubscription.unsubscribe();
      paymentsSubscription.unsubscribe();
    };
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  const checkAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }
      const { data } = await supabase.from('users').select('is_admin').eq('id', user.id).single();
      if (!data?.is_admin) { navigate('/'); return; }
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
      const { data: orders } = await supabase
        .from('orders').select('*, order_items(*)').order('created_at', { ascending: false });

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

        setStats(prev => ({ ...prev, totalOrders, totalRevenue, pendingOrders, deliveredOrders, cancelledOrders, paidOrders, codOrders }));
        setRecentOrders(orders.slice(0, 5));
        setRecentPayments(orders.filter(o => o.razorpay_payment_id).slice(0, 5));

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonth = new Date().getMonth();
        const salesDataArray = [];
        for (let i = 5; i >= 0; i--) {
          const monthIndex = (currentMonth - i + 12) % 12;
          const monthOrders = orders.filter(o => {
            const orderMonth = new Date(o.created_at).getMonth();
            return orderMonth === monthIndex && (o.payment_status === 'paid' || o.status === 'delivered');
          });
          salesDataArray.push({
            name: months[monthIndex],
            sales: monthOrders.reduce((sum, o) => sum + o.total_amount, 0),
            orders: monthOrders.length
          });
        }
        setSalesData(salesDataArray);

        const productSales = {};
        orders.forEach(order => {
          order.order_items?.forEach(item => {
            if (!productSales[item.product_name]) productSales[item.product_name] = { quantity: 0, revenue: 0 };
            productSales[item.product_name].quantity += item.quantity;
            productSales[item.product_name].revenue += item.price * item.quantity;
          });
        });
        setTopProducts(Object.entries(productSales).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.quantity - a.quantity).slice(0, 5));
      }

      const { count: totalProducts } = await supabase.from('products').select('*', { count: 'exact', head: true });
      setStats(prev => ({ ...prev, totalProducts: totalProducts || 0 }));

      const { count: totalCustomers } = await supabase.from('users').select('*', { count: 'exact', head: true });
      setStats(prev => ({ ...prev, totalCustomers: totalCustomers || 0 }));

      const { data: bulkOrders } = await supabase.from('bulk_orders').select('*').order('created_at', { ascending: false });
      if (bulkOrders) {
        setStats(prev => ({ ...prev, totalBulkOrders: bulkOrders.length, pendingBulkOrders: bulkOrders.filter(b => b.status === 'pending').length }));
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
    { path: '/admin/categories', label: 'Categories', icon: <FiGrid /> },
    { path: '/admin/products', label: 'Products', icon: <FiPackage /> },
    { path: '/admin/hampers', label: 'Gift Hampers', icon: <FiGift /> },
    { path: '/admin/orders', label: 'Orders', icon: <FiShoppingCart /> },
    { path: '/admin/returns', label: 'Returns', icon: <FiRefreshCw /> },
    { path: '/admin/bulk-orders', label: 'Bulk Orders', icon: <FiInbox /> },
    { path: '/admin/contact-messages', label: 'Contact Us', icon: <FiMail /> },
    { path: '/admin/deals', label: 'Deals', icon: <FiTag /> },
    { path: '/admin/customers', label: 'Customers', icon: <FiUsers /> },
    { path: '/admin/ads', label: 'Ad Manager', icon: <FiImage /> },
    { path: '/admin/subscribers', label: 'Subscribers', icon: <FiMail /> },,
  ];

  const isDashboard = location.pathname === '/admin';
  const currentPage = menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard';
  const COLORS = ['#9E1B1B', '#1F5B3A', '#C89B3C', '#D9B382'];

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.adminDashboard}>
      {/* Notification Toast */}
      {notification && (
        <div className={`${styles.notificationToast} ${styles[notification.type]}`}>
          {notification.message}
        </div>
      )}

      {/* Mobile Overlay */}
      {mobileSidebarOpen && (
        <div className={styles.mobileOverlay} onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : styles.sidebarCollapsed} ${mobileSidebarOpen ? styles.mobileSidebarOpen : ''}`}>
        {/* Sidebar Header */}
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarLogo}>
            <img src="/logo.png" alt="Logo" className={styles.logoImage} />
            {sidebarOpen && <span className={styles.logoText}>Etikoppaka</span>}
          </div>
          <button className={styles.sidebarToggle} onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>

        {/* Nav Links */}
        <nav className={styles.sidebarNav}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`${styles.sidebarLink} ${isActive ? styles.sidebarLinkActive : ''}`}
                title={!sidebarOpen ? item.label : ''}
              >
                <span className={styles.sidebarIcon}>{item.icon}</span>
                {sidebarOpen && <span className={styles.sidebarLabel}>{item.label}</span>}
                {sidebarOpen && isActive && <FiChevronRight className={styles.activeChevron} />}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className={styles.sidebarFooter}>
          {sidebarOpen && (
            <div className={styles.userInfo}>
              <div className={styles.userAvatar}>{user?.email?.[0].toUpperCase()}</div>
              <div className={styles.userDetails}>
                <strong>{user?.email?.split('@')[0]}</strong>
                <span>Administrator</span>
              </div>
            </div>
          )}
          <button onClick={handleLogout} className={styles.logoutBtn} title="Logout">
            <FiLogOut />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className={`${styles.mainArea} ${sidebarOpen ? styles.mainAreaShifted : styles.mainAreaFull}`}>
        {/* Top Bar */}
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            {/* Mobile hamburger */}
            <button className={styles.mobileMenuBtn} onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}>
              <FiMenu />
            </button>
            <h1 className={styles.pageTitle}>{currentPage}</h1>
          </div>
          <div className={styles.topBarRight}>
            <button onClick={fetchDashboardData} className={styles.refreshBtn}>
              <FiRefreshCw /> <span>Refresh</span>
            </button>
            <button className={styles.notificationBtn}><FiBell /></button>
          </div>
        </header>

        {/* Page Content */}
        <main className={styles.pageContent}>
          {isDashboard && (
            <div className={styles.dashboardContent}>
              {/* Stats Row 1 */}
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statIcon} style={{ background: '#E8F5E9', color: '#1F5B3A' }}><FiShoppingCart /></div>
                  <div className={styles.statInfo}>
                    <h3>Total Orders</h3>
                    <p className={styles.statNumber}>{stats.totalOrders}</p>
                    <span className={styles.statTrend}>All time</span>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statIcon} style={{ background: '#E3F2FD', color: '#3B82F6' }}><FaRupeeSign /></div>
                  <div className={styles.statInfo}>
                    <h3>Total Revenue</h3>
                    <p className={styles.statNumber}>₹{stats.totalRevenue.toLocaleString()}</p>
                    <span className={styles.statTrend}>From paid orders</span>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statIcon} style={{ background: '#D1FAE5', color: '#10B981' }}><FiCreditCard /></div>
                  <div className={styles.statInfo}>
                    <h3>Paid Orders</h3>
                    <p className={styles.statNumber}>{stats.paidOrders}</p>
                    <span className={styles.statTrend}>Online payments</span>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statIcon} style={{ background: '#FEF3E8', color: '#F59E0B' }}><FiClock /></div>
                  <div className={styles.statInfo}>
                    <h3>Pending Orders</h3>
                    <p className={styles.statNumber}>{stats.pendingOrders}</p>
                    <span className={styles.statTrend}>Need attention</span>
                  </div>
                </div>
              </div>

              {/* Stats Row 2 */}
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statIcon} style={{ background: '#FFF3E0', color: '#F59E0B' }}><FiPackage /></div>
                  <div className={styles.statInfo}>
                    <h3>Total Products</h3>
                    <p className={styles.statNumber}>{stats.totalProducts}</p>
                    <span className={styles.statTrend}>In catalog</span>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statIcon} style={{ background: '#FCE4EC', color: '#EC4899' }}><FiUsers /></div>
                  <div className={styles.statInfo}>
                    <h3>Total Customers</h3>
                    <p className={styles.statNumber}>{stats.totalCustomers}</p>
                    <span className={styles.statTrend}>Registered users</span>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statIcon} style={{ background: '#E8EAF6', color: '#8B5CF6' }}><FiInbox /></div>
                  <div className={styles.statInfo}>
                    <h3>Bulk Inquiries</h3>
                    <p className={styles.statNumber}>{stats.totalBulkOrders}</p>
                    <span className={styles.statTrend}>{stats.pendingBulkOrders} pending</span>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statIcon} style={{ background: '#FEE2E2', color: '#9E1B1B' }}><FiXCircle /></div>
                  <div className={styles.statInfo}>
                    <h3>Cancelled</h3>
                    <p className={styles.statNumber}>{stats.cancelledOrders}</p>
                    <span className={styles.statTrend}>Orders</span>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className={styles.chartsRow}>
                <div className={styles.chartCard}>
                  <div className={styles.chartHeader}>
                    <h3>Sales Overview</h3>
                    <p>Monthly revenue trend (₹)</p>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
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
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Delivered', value: stats.deliveredOrders, color: '#1F5B3A' },
                          { name: 'Pending', value: stats.pendingOrders, color: '#F59E0B' },
                          { name: 'Cancelled', value: stats.cancelledOrders, color: '#9E1B1B' }
                        ]}
                        cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label
                      >
                        {[{ color: '#1F5B3A' }, { color: '#F59E0B' }, { color: '#9E1B1B' }].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Orders */}
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
    </div>
  );
};

export default AdminDashboard;