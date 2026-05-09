import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { 
  FiUsers, 
  FiMail, 
  FiPhone, 
  FiCalendar, 
  FiDollarSign, 
  FiPackage, 
  FiSearch,
  FiEye,
  FiX,
  FiUserCheck,
  FiUserX,
  FiTrendingUp,
  FiMapPin,
  FiShoppingBag,
  FiAward
} from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import styles from './AdminCustomers.module.css';

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    newThisMonth: 0
  });

  useEffect(() => {
    fetchCustomers();
    fetchStats();

    const customersSubscription = supabase
      .channel('customers-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        fetchCustomers();
        fetchStats();
      })
      .subscribe();

    const ordersSubscription = supabase
      .channel('orders-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        if (selectedCustomer) {
          fetchCustomerOrders(selectedCustomer.id);
        }
        fetchStats();
      })
      .subscribe();

    return () => {
      customersSubscription.unsubscribe();
      ordersSubscription.unsubscribe();
    };
  }, []);

  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && !error) {
      const customersWithOrders = await Promise.all(
        data.map(async (customer) => {
          const { count: orderCount } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', customer.id);

          const { data: orders } = await supabase
            .from('orders')
            .select('total_amount')
            .eq('user_id', customer.id)
            .eq('status', 'delivered');

          const totalSpent = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;

          let savedAddresses = [];
          if (customer.saved_addresses) {
            if (typeof customer.saved_addresses === 'string') {
              try {
                savedAddresses = JSON.parse(customer.saved_addresses);
              } catch(e) {
                savedAddresses = [];
              }
            } else if (Array.isArray(customer.saved_addresses)) {
              savedAddresses = customer.saved_addresses;
            }
          }

          return {
            ...customer,
            orderCount: orderCount || 0,
            totalSpent,
            saved_addresses: savedAddresses
          };
        })
      );
      setCustomers(customersWithOrders);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    const { count: totalCustomers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count: totalOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    const { data: deliveredOrders } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('status', 'delivered');

    const totalRevenue = deliveredOrders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: newThisMonth } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString());

    setStats({
      totalCustomers: totalCustomers || 0,
      totalOrders: totalOrders || 0,
      totalRevenue,
      newThisMonth: newThisMonth || 0
    });
  };

  const fetchCustomerOrders = async (userId) => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data && !error) {
      setCustomerOrders(data);
    }
  };

  const handleViewDetails = async (customer) => {
    setSelectedCustomer(customer);
    await fetchCustomerOrders(customer.id);
    setShowDetailsModal(true);
  };

  const filteredCustomers = customers.filter(customer =>
    (customer.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (customer.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (customer.mobile?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.adminCustomers}>
      {/* Header with Stats */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2>Customer Management</h2>
          <p className={styles.headerSubtitle}>Manage and view customer details</p>
        </div>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: '#E8F5E9', color: '#1F5B3A' }}>
              <FiUsers />
            </div>
            <div className={styles.statInfo}>
              <span>Total Customers</span>
              <strong>{stats.totalCustomers}</strong>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: '#E3F2FD', color: '#3B82F6' }}>
              <FiPackage />
            </div>
            <div className={styles.statInfo}>
              <span>Total Orders</span>
              <strong>{stats.totalOrders}</strong>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: '#FFF3E0', color: '#F59E0B' }}>
              <FaRupeeSign />
            </div>
            <div className={styles.statInfo}>
              <span>Total Revenue</span>
              <strong>₹{stats.totalRevenue.toLocaleString()}</strong>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: '#FCE4EC', color: '#EC4899' }}>
              <FiTrendingUp />
            </div>
            <div className={styles.statInfo}>
              <span>New This Month</span>
              <strong>{stats.newThisMonth}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className={styles.searchBar}>
        <div className={styles.searchBox}>
          <FiSearch />
          <input
            type="text"
            placeholder="Search by name, email or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Contact</th>
              <th>Orders</th>
              <th>Total Spent</th>
              <th>Joined</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map(customer => (
              <tr key={customer.id}>
                <td>
                  <div className={styles.customerInfo}>
                    <div className={styles.customerAvatar}>
                      {customer.name ? customer.name[0].toUpperCase() : customer.email[0].toUpperCase()}
                    </div>
                    <div>
                      <div className={styles.customerName}>{customer.name || 'N/A'}</div>
                      <div className={styles.customerEmail}><FiMail /> {customer.email}</div>
                    </div>
                  </div>
                </td>
                <tr>
                  <div className={styles.contactInfo}>
                    <div><FiPhone /> {customer.mobile || 'Not provided'}</div>
                  </div>
                </tr>
                <td>
                  <div className={styles.orderCount}>
                    <FiPackage />
                    <span>{customer.orderCount || 0}</span>
                  </div>
                </td>
                <td>
                  <div className={styles.totalSpent}>
                    <FaRupeeSign />
                    <span>{(customer.totalSpent || 0).toLocaleString()}</span>
                  </div>
                </td>
                <td>
                  <div className={styles.joinDate}>
                    <FiCalendar />
                    <span>{new Date(customer.created_at).toLocaleDateString()}</span>
                  </div>
                </td>
                <td>
                  <span className={customer.is_admin ? styles.adminBadge : styles.customerBadge}>
                    {customer.is_admin ? 'Admin' : 'Customer'}
                  </span>
                </td>
                <td>
                  <button 
                    onClick={() => handleViewDetails(customer)} 
                    className={styles.viewBtn}
                    title="View Details"
                  >
                    <FiEye />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredCustomers.length === 0 && (
        <div className={styles.emptyState}>
          <FiUsers className={styles.emptyIcon} />
          <h3>No Customers Found</h3>
          <p>Try adjusting your search</p>
        </div>
      )}

      {/* Customer Details Modal */}
      {showDetailsModal && selectedCustomer && (
        <div className={styles.modal} onClick={() => setShowDetailsModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Customer Details</h3>
              <button onClick={() => setShowDetailsModal(false)} className={styles.closeBtn}>
                <FiX />
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Customer Profile */}
              <div className={styles.profileSection}>
                <div className={styles.profileAvatar}>
                  {selectedCustomer.name ? selectedCustomer.name[0].toUpperCase() : selectedCustomer.email[0].toUpperCase()}
                </div>
                <div className={styles.profileInfo}>
                  <h4>{selectedCustomer.name || 'N/A'}</h4>
                  <p><FiMail /> {selectedCustomer.email}</p>
                  <p><FiPhone /> {selectedCustomer.mobile || 'Not provided'}</p>
                  <p><FiCalendar /> Joined: {new Date(selectedCustomer.created_at).toLocaleDateString()}</p>
                  <span className={selectedCustomer.is_admin ? styles.adminBadge : styles.customerBadge}>
                    {selectedCustomer.is_admin ? 'Admin' : 'Customer'}
                  </span>
                </div>
              </div>

              {/* Customer Stats */}
              <div className={styles.customerStats}>
                <div className={styles.customerStatCard}>
                  <FiShoppingBag />
                  <div>
                    <span>Total Orders</span>
                    <strong>{customerOrders.length}</strong>
                  </div>
                </div>
                <div className={styles.customerStatCard}>
                  <FaRupeeSign />
                  <div>
                    <span>Total Spent</span>
                    <strong>₹{customerOrders.reduce((sum, order) => sum + order.total_amount, 0).toLocaleString()}</strong>
                  </div>
                </div>
                <div className={styles.customerStatCard}>
                  <FiPackage />
                  <div>
                    <span>Avg Order Value</span>
                    <strong>₹{customerOrders.length > 0 ? Math.round(customerOrders.reduce((sum, order) => sum + order.total_amount, 0) / customerOrders.length).toLocaleString() : 0}</strong>
                  </div>
                </div>
              </div>

              {/* Saved Addresses */}
              {selectedCustomer.saved_addresses && selectedCustomer.saved_addresses.length > 0 && (
                <div className={styles.addressesSection}>
                  <h4><FiMapPin /> Saved Addresses</h4>
                  <div className={styles.addressesList}>
                    {selectedCustomer.saved_addresses.map((address, index) => (
                      <div key={index} className={styles.addressCard}>
                        <p><strong>{address.name}</strong></p>
                        <p>{address.doorNo}, {address.street}</p>
                        <p>{address.city}, {address.state} - {address.pincode}</p>
                        <p>📞 {address.mobile}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Orders */}
              <div className={styles.ordersSection}>
                <h4><FiPackage /> Recent Orders</h4>
                {customerOrders.length > 0 ? (
                  <div className={styles.ordersList}>
                    {customerOrders.slice(0, 5).map(order => (
                      <div key={order.id} className={styles.orderCard}>
                        <div className={styles.orderHeader}>
                          <span className={styles.orderNumber}>#{order.order_number}</span>
                          <span className={`${styles.orderStatus} ${styles[order.status]}`}>
                            {order.status?.toUpperCase().replace(/_/g, ' ') || 'PENDING'}
                          </span>
                        </div>
                        <div className={styles.orderDetails}>
                          <span>📅 {new Date(order.created_at).toLocaleDateString()}</span>
                          <span>💰 ₹{order.total_amount}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.noOrders}>No orders yet</p>
                )}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button onClick={() => setShowDetailsModal(false)} className={styles.closeModalBtn}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;