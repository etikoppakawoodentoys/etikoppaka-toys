import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { 
  FiUser, FiMail, FiPhone, FiMapPin, FiEdit2, FiSave, FiPlus, FiTrash2, FiStar,
  FiPackage, FiShoppingBag, FiChevronRight, FiClock, FiCheckCircle, FiTruck, FiXCircle,
  FiLogOut, FiHome, FiHeart, FiSettings, FiHelpCircle, FiShield, FiTruck as FiDelivery,
  FiRefreshCw, FiDollarSign
} from 'react-icons/fi';
import styles from './Profile.module.css';

const Profile = () => {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    mobile: '',
    addresses: []
  });
  const [orders, setOrders] = useState([]);
  const [returns, setReturns] = useState([]);
  const [bulkOrders, setBulkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressIndex, setEditingAddressIndex] = useState(null);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('orders');
  const [isMobile, setIsMobile] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchOrders();
    fetchReturns();
    fetchBulkOrders();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        let addresses = [];
        if (data.saved_addresses) {
          if (typeof data.saved_addresses === 'string') {
            try {
              addresses = JSON.parse(data.saved_addresses);
            } catch(e) {
              addresses = [];
            }
          } else if (Array.isArray(data.saved_addresses)) {
            addresses = data.saved_addresses;
          }
        }
        
        setProfile({
          name: data.name || '',
          email: data.email || '',
          mobile: data.mobile || '',
          addresses: addresses
        });
      }
    } catch (error) {
      console.error('Fetch profile error:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('orders')
        .select(`*, order_items (*)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data && !error) setOrders(data);
    } catch (error) {
      console.error('Fetch orders error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReturns = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('returns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error) setReturns(data || []);
    } catch (error) {
      console.error('Fetch returns error:', error);
    }
  };

  const fetchBulkOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('bulk_orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error) setBulkOrders(data || []);
    } catch (error) {
      console.error('Fetch bulk orders error:', error);
    }
  };

  const saveToDatabase = async (updatedProfile) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const addressesToSave = Array.isArray(updatedProfile.addresses) 
        ? JSON.stringify(updatedProfile.addresses) 
        : JSON.stringify([]);
      
      const { error } = await supabase
        .from('users')
        .update({
          name: updatedProfile.name,
          mobile: updatedProfile.mobile,
          saved_addresses: addressesToSave
        })
        .eq('id', user.id);

      if (error) return false;
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const success = await saveToDatabase(profile);
    if (success) {
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setEditing(false);
    } else {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    }
    setTimeout(() => setMessage(''), 3000);
    setSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
    window.location.reload();
  };

  const [addressForm, setAddressForm] = useState({
    name: '', mobile: '', doorNo: '', street: '',
    city: '', state: '', pincode: '', landmark: '', isDefault: false
  });

  const handleAddAddress = async () => {
    if (!addressForm.name || !addressForm.mobile || !addressForm.doorNo || !addressForm.street || !addressForm.city || !addressForm.pincode) {
      setMessage({ type: 'error', text: 'Please fill all required fields' });
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const newAddress = {
      id: Date.now(),
      name: addressForm.name,
      mobile: addressForm.mobile,
      doorNo: addressForm.doorNo,
      street: addressForm.street,
      city: addressForm.city,
      state: addressForm.state || 'Andhra Pradesh',
      pincode: addressForm.pincode,
      landmark: addressForm.landmark,
      isDefault: addressForm.isDefault,
      fullAddress: `${addressForm.doorNo}, ${addressForm.street}${addressForm.landmark ? ', ' + addressForm.landmark : ''}, ${addressForm.city}, ${addressForm.state || 'Andhra Pradesh'}, ${addressForm.pincode}`
    };

    const currentAddresses = Array.isArray(profile.addresses) ? [...profile.addresses] : [];
    let updatedAddresses = [...currentAddresses];
    
    if (addressForm.isDefault) {
      updatedAddresses = updatedAddresses.map(addr => ({ ...addr, isDefault: false }));
    }
    
    if (editingAddressIndex !== null) {
      updatedAddresses[editingAddressIndex] = newAddress;
    } else {
      updatedAddresses.push(newAddress);
    }
    
    const updatedProfile = { ...profile, addresses: updatedAddresses };
    setProfile(updatedProfile);
    
    const success = await saveToDatabase(updatedProfile);
    
    if (success) {
      setMessage({ type: 'success', text: editingAddressIndex !== null ? 'Address updated!' : 'Address added!' });
      setShowAddressForm(false);
      setEditingAddressIndex(null);
      setAddressForm({ name: '', mobile: '', doorNo: '', street: '', city: '', state: '', pincode: '', landmark: '', isDefault: false });
    } else {
      setMessage({ type: 'error', text: 'Failed to save address' });
      await fetchProfile();
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const handleEditAddress = (index) => {
    const addresses = Array.isArray(profile.addresses) ? profile.addresses : [];
    const address = addresses[index];
    if (address) {
      setAddressForm({
        name: address.name || '', mobile: address.mobile || '',
        doorNo: address.doorNo || '', street: address.street || '',
        city: address.city || '', state: address.state || '',
        pincode: address.pincode || '', landmark: address.landmark || '',
        isDefault: address.isDefault || false
      });
      setEditingAddressIndex(index);
      setShowAddressForm(true);
    }
  };

  const handleDeleteAddress = async (index) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      const currentAddresses = Array.isArray(profile.addresses) ? [...profile.addresses] : [];
      const updatedAddresses = currentAddresses.filter((_, i) => i !== index);
      const updatedProfile = { ...profile, addresses: updatedAddresses };
      setProfile(updatedProfile);
      const success = await saveToDatabase(updatedProfile);
      if (success) {
        setMessage({ type: 'success', text: 'Address deleted!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to delete address' });
        await fetchProfile();
      }
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleSetDefaultAddress = async (index) => {
    const currentAddresses = Array.isArray(profile.addresses) ? [...profile.addresses] : [];
    const updatedAddresses = currentAddresses.map((addr, i) => ({ ...addr, isDefault: i === index }));
    const updatedProfile = { ...profile, addresses: updatedAddresses };
    setProfile(updatedProfile);
    const success = await saveToDatabase(updatedProfile);
    if (success) {
      setMessage({ type: 'success', text: 'Default address updated!' });
    } else {
      setMessage({ type: 'error', text: 'Failed to update default address' });
      await fetchProfile();
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const getOrderStatusBadge = (status) => {
    const safeStatus = status || 'pending';
    const config = {
      'pending': { icon: <FiClock size={12} />, label: 'Pending', color: '#F59E0B', bg: '#FEF3C7' },
      'accepted': { icon: <FiCheckCircle size={12} />, label: 'Accepted', color: '#10B981', bg: '#D1FAE5' },
      'shipped': { icon: <FiTruck size={12} />, label: 'Shipped', color: '#3B82F6', bg: '#DBEAFE' },
      'transit': { icon: <FiTruck size={12} />, label: 'In Transit', color: '#8B5CF6', bg: '#EDE9FE' },
      'out_for_delivery': { icon: <FiTruck size={12} />, label: 'Out for Delivery', color: '#EC4899', bg: '#FCE7F3' },
      'delivered': { icon: <FiCheckCircle size={12} />, label: 'Delivered', color: '#059669', bg: '#D1FAE5' },
      'cancelled': { icon: <FiXCircle size={12} />, label: 'Cancelled', color: '#EF4444', bg: '#FEE2E2' }
    };
    const c = config[safeStatus] || config['pending'];
    return (
      <span className={styles.orderStatusBadge} style={{ background: c.bg, color: c.color }}>
        {c.icon} {c.label}
      </span>
    );
  };

  const getReturnStatusBadge = (status) => {
    const config = {
      'pending': { label: 'Pending', color: '#F59E0B', bg: '#FEF3C7', icon: <FiClock size={12} /> },
      'approved': { label: 'Approved', color: '#10B981', bg: '#D1FAE5', icon: <FiCheckCircle size={12} /> },
      'rejected': { label: 'Rejected', color: '#EF4444', bg: '#FEE2E2', icon: <FiXCircle size={12} /> },
      'replacement': { label: 'Replacement Sent', color: '#8B5CF6', bg: '#EDE9FE', icon: <FiPackage size={12} /> },
      'refunded': { label: 'Refunded', color: '#059669', bg: '#D1FAE5', icon: <FiDollarSign size={12} /> },
      'completed': { label: 'Completed', color: '#059669', bg: '#D1FAE5', icon: <FiCheckCircle size={12} /> },
      'picked_up': { label: 'Picked Up', color: '#3B82F6', bg: '#DBEAFE', icon: <FiTruck size={12} /> }
    };
    const c = config[status] || config['pending'];
    return (
      <span className={styles.returnStatusBadge} style={{ background: c.bg, color: c.color }}>
        {c.icon} {c.label}
      </span>
    );
  };

  const getBulkStatusBadge = (status) => {
    const config = {
      'pending':    { label: 'Pending',    color: '#F59E0B', bg: '#FEF3C7', icon: <FiClock size={12} /> },
      'processing': { label: 'Processing', color: '#3B82F6', bg: '#DBEAFE', icon: <FiRefreshCw size={12} /> },
      'quoted':     { label: 'Quoted',     color: '#8B5CF6', bg: '#EDE9FE', icon: <FiDollarSign size={12} /> },
      'approved':   { label: 'Approved',   color: '#10B981', bg: '#D1FAE5', icon: <FiCheckCircle size={12} /> },
      'completed':  { label: 'Completed',  color: '#059669', bg: '#D1FAE5', icon: <FiCheckCircle size={12} /> },
      'cancelled':  { label: 'Cancelled',  color: '#EF4444', bg: '#FEE2E2', icon: <FiXCircle size={12} /> }
    };
    const c = config[status] || config['pending'];
    return (
      <span className={styles.bulkStatusBadge} style={{ background: c.bg, color: c.color }}>
        {c.icon} {c.label}
      </span>
    );
  };

  const indianStates = [
    'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
    'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
    'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
    'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
    'Uttarakhand','West Bengal'
  ];

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
      </div>
    );
  }

  // ============================================
  // MOBILE PROFILE UI
  // ============================================
  if (isMobile) {
    return (
      <div className={styles.mobileProfile}>
        {/* Header */}
        <div className={styles.mobileHeader}>
          <div className={styles.mobileHeaderTop}>
            <button onClick={() => navigate('/')} className={styles.mobileHomeBtn}>
              <FiHome />
            </button>
            <h1>My Profile</h1>
            <button onClick={handleLogout} className={styles.mobileLogoutBtn}>
              <FiLogOut />
            </button>
          </div>

          <div className={styles.mobileProfileCard}>
            <div className={styles.mobileProfileAvatar}>
              {profile.name ? profile.name[0].toUpperCase() : (profile.email ? profile.email[0].toUpperCase() : 'U')}
            </div>
            <div className={styles.mobileProfileInfo}>
              <h3>{profile.name || 'Add Name'}</h3>
              <p>{profile.email}</p>
              <p>{profile.mobile || 'Add mobile number'}</p>
            </div>
            <button onClick={() => setEditing(true)} className={styles.mobileEditBtn}>
              <FiEdit2 /> Edit
            </button>
          </div>
        </div>

        {message && (
          <div className={`${styles.mobileMessage} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}

        {/* Edit Profile Modal */}
        {editing && (
          <div className={styles.mobileModal} onClick={() => setEditing(false)}>
            <div className={styles.mobileModalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.mobileModalHeader}>
                <h3>Edit Profile</h3>
                <button onClick={() => setEditing(false)}>✕</button>
              </div>
              <div className={styles.mobileModalBody}>
                <input type="text" placeholder="Full Name" value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                <input type="tel" placeholder="Mobile Number" value={profile.mobile}
                  onChange={(e) => setProfile({ ...profile, mobile: e.target.value })} />
                <div className={styles.mobileModalActions}>
                  <button onClick={() => setEditing(false)} className={styles.mobileCancelBtn}>Cancel</button>
                  <button onClick={handleSaveProfile} disabled={saving} className={styles.mobileSaveBtn}>
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className={styles.mobileStats}>
          <div className={styles.mobileStat}>
            <FiPackage />
            <span>{orders.length}</span>
            <small>Orders</small>
          </div>
          <div className={styles.mobileStat}>
            <FiMapPin />
            <span>{profile.addresses.length}</span>
            <small>Addresses</small>
          </div>
          <div className={styles.mobileStat}>
            <FiRefreshCw />
            <span>{returns.length}</span>
            <small>Returns</small>
          </div>
          <div className={styles.mobileStat}>
            <FiShoppingBag />
            <span>{bulkOrders.length}</span>
            <small>Bulk</small>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.mobileTabs}>
          <button className={`${styles.mobileTab} ${activeTab === 'orders' ? styles.active : ''}`}
            onClick={() => setActiveTab('orders')}>
            <FiPackage /> Orders
          </button>
          <button className={`${styles.mobileTab} ${activeTab === 'addresses' ? styles.active : ''}`}
            onClick={() => setActiveTab('addresses')}>
            <FiMapPin /> Addresses
          </button>
          <button className={`${styles.mobileTab} ${activeTab === 'returns' ? styles.active : ''}`}
            onClick={() => setActiveTab('returns')}>
            <FiRefreshCw /> Returns
          </button>
          <button className={`${styles.mobileTab} ${activeTab === 'bulk' ? styles.active : ''}`}
            onClick={() => setActiveTab('bulk')}>
            <FiShoppingBag /> Bulk
          </button>
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className={styles.mobileOrdersList}>
            {orders.length === 0 ? (
              <div className={styles.mobileEmptyOrders}>
                <FiShoppingBag size={48} />
                <h4>No orders yet</h4>
                <p>When you place an order, it will appear here</p>
                <Link to="/products" className={styles.mobileShopBtn}>Start Shopping →</Link>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className={styles.mobileOrderItem}>
                  <div className={styles.mobileOrderHeader}>
                    <span className={styles.mobileOrderNumber}>#{order.order_number || 'N/A'}</span>
                    {getOrderStatusBadge(order.status)}
                  </div>
                  <div className={styles.mobileOrderDate}>
                    {order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date not available'}
                  </div>
                  <div className={styles.mobileOrderTotal}>
                    <span>Total:</span>
                    <strong>₹{order.total_amount || 0}</strong>
                  </div>
                  <button onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
                    className={styles.mobileViewOrderBtn}>
                    {selectedOrder === order.id ? 'Hide Details' : 'View Details'} <FiChevronRight />
                  </button>
                  {selectedOrder === order.id && order.order_items && order.order_items.length > 0 && (
                    <div className={styles.mobileOrderDetails}>
                      {order.order_items.map((item, idx) => (
                        <div key={idx} className={styles.mobileOrderDetailItem}>
                          <span>{item.product_name}</span>
                          <span>x{item.quantity}</span>
                          <span>₹{(item.price || 0) * (item.quantity || 0)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Addresses Tab */}
        {activeTab === 'addresses' && (
          <div className={styles.mobileAddressesList}>
            {profile.addresses.map((address, index) => (
              <div key={address.id || index} className={styles.mobileAddressItem}>
                {address.isDefault && <span className={styles.mobileDefaultTag}>Default</span>}
                <div className={styles.mobileAddressContent}>
                  <p><strong>{address.name || 'N/A'}</strong></p>
                  <p>📞 {address.mobile || 'N/A'}</p>
                  <p>🏠 {address.doorNo || ''}, {address.street || ''}</p>
                  {address.landmark && <p>📍 {address.landmark}</p>}
                  <p>📮 {address.city || ''}, {address.state || ''} - {address.pincode || ''}</p>
                </div>
                <div className={styles.mobileAddressActions}>
                  {!address.isDefault && (
                    <button onClick={() => handleSetDefaultAddress(index)}>Set Default</button>
                  )}
                  <button onClick={() => handleEditAddress(index)}>Edit</button>
                  <button onClick={() => handleDeleteAddress(index)}>Delete</button>
                </div>
              </div>
            ))}
            <button onClick={() => {
              setAddressForm({ name: profile.name || '', mobile: profile.mobile || '', doorNo: '', street: '', city: '', state: '', pincode: '', landmark: '', isDefault: profile.addresses.length === 0 });
              setEditingAddressIndex(null);
              setShowAddressForm(true);
            }} className={styles.mobileAddAddressBtn}>
              <FiPlus /> Add New Address
            </button>
          </div>
        )}

        {/* Returns Tab */}
        {activeTab === 'returns' && (
          <div className={styles.mobileReturnsList}>
            {returns.length === 0 ? (
              <div className={styles.mobileEmptyReturns}>
                <FiRefreshCw size={48} />
                <h4>No return requests</h4>
                <p>You haven't requested any returns yet</p>
                <Link to="/products" className={styles.mobileShopBtn}>Continue Shopping →</Link>
              </div>
            ) : (
              returns.map((returnReq) => (
                <div key={returnReq.id} className={styles.mobileReturnItem}>
                  <div className={styles.mobileReturnHeader}>
                    <span className={styles.mobileReturnNumber}>Return #{returnReq.order_number}</span>
                    {getReturnStatusBadge(returnReq.status)}
                  </div>
                  <div className={styles.mobileReturnDate}>
                    {new Date(returnReq.created_at).toLocaleDateString()}
                  </div>
                  <div className={styles.mobileReturnReason}>
                    <strong>Reason:</strong> {returnReq.reason}
                  </div>
                  <div className={styles.mobileReturnResolution}>
                    <strong>Resolution:</strong> {returnReq.resolution_preference}
                  </div>
                  {returnReq.admin_message && (
                    <div className={styles.mobileReturnMessage}>
                      <strong>Admin Response:</strong>
                      <p>{returnReq.admin_message}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Bulk Orders Tab */}
        {activeTab === 'bulk' && (
          <div className={styles.mobileBulkList}>
            {bulkOrders.length === 0 ? (
              <div className={styles.mobileEmptyBulk}>
                <FiShoppingBag size={48} />
                <h4>No bulk order requests</h4>
                <p>Submit a wholesale inquiry to see it here</p>
                <Link to="/bulk-order" className={styles.mobileShopBtn}>Request Bulk Order →</Link>
              </div>
            ) : (
              bulkOrders.map((order) => (
                <div key={order.id} className={styles.mobileBulkItem}>
                  <div className={styles.mobileBulkHeader}>
                    <span className={styles.mobileBulkNumber}>
                      Bulk #{order.order_number || order.id?.slice(0, 8)}
                    </span>
                    {getBulkStatusBadge(order.status)}
                  </div>
                  <div className={styles.mobileBulkDate}>
                    {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                  <div className={styles.mobileBulkDetail}>
                    <strong>Product:</strong> {order.product_interest}
                  </div>
                  <div className={styles.mobileBulkDetail}>
                    <strong>Quantity:</strong> {order.quantity} {order.quantity_unit}
                  </div>
                  {order.budget_range && (
                    <div className={styles.mobileBulkDetail}>
                      <strong>Budget:</strong> {order.budget_range}
                    </div>
                  )}
                  {order.admin_notes && (
                    <div className={styles.mobileBulkAdminNote}>
                      <strong>Admin Response:</strong>
                      <p>{order.admin_notes}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Menu Items */}
        <div className={styles.mobileMenu}>
          <Link to="/orders"><FiPackage /> My Orders</Link>
          <Link to="/bulk-order"><FiShoppingBag /> Bulk Orders</Link>
          <Link to="/shipping"><FiDelivery /> Shipping Policy</Link>
          <Link to="/returns"><FiShield /> Return Policy</Link>
          <Link to="/faq"><FiHelpCircle /> Help & FAQs</Link>
        </div>

        {/* Address Modal */}
        {showAddressForm && (
          <div className={styles.mobileModal} onClick={() => setShowAddressForm(false)}>
            <div className={styles.mobileModalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.mobileModalHeader}>
                <h3>{editingAddressIndex !== null ? 'Edit Address' : 'Add Address'}</h3>
                <button onClick={() => setShowAddressForm(false)}>✕</button>
              </div>
              <div className={styles.mobileModalBody}>
                <input type="text" placeholder="Full Name *" value={addressForm.name}
                  onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })} />
                <input type="tel" placeholder="Mobile Number *" value={addressForm.mobile}
                  onChange={(e) => setAddressForm({ ...addressForm, mobile: e.target.value })} />
                <input type="text" placeholder="Door/House No *" value={addressForm.doorNo}
                  onChange={(e) => setAddressForm({ ...addressForm, doorNo: e.target.value })} />
                <input type="text" placeholder="Street Address *" value={addressForm.street}
                  onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })} />
                <input type="text" placeholder="Landmark" value={addressForm.landmark}
                  onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })} />
                <input type="text" placeholder="City *" value={addressForm.city}
                  onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} />
                <select value={addressForm.state}
                  onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}>
                  {indianStates.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <input type="text" placeholder="PIN Code *" value={addressForm.pincode}
                  onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })} maxLength="6" />
                <label className={styles.mobileCheckbox}>
                  <input type="checkbox" checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })} />
                  Set as default address
                </label>
                <button onClick={handleAddAddress} className={styles.mobileSaveAddressBtn}>
                  {editingAddressIndex !== null ? 'Update Address' : 'Save Address'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================
  // DESKTOP PROFILE UI
  // ============================================
  return (
    <div className={styles.profilePage}>
      <div className={styles.container}>
        <div className={styles.breadcrumb}>
          <Link to="/">Home</Link>
          <span>/</span>
          <span className={styles.current}>My Profile</span>
        </div>

        {message && (
          <div className={`${styles.message} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}

        <div className={styles.profileLayout}>
          {/* Sidebar */}
          <div className={styles.profileSidebar}>
            <div className={styles.sidebarUser}>
              <div className={styles.sidebarAvatar}>
                {profile.name ? profile.name[0].toUpperCase() : (profile.email ? profile.email[0].toUpperCase() : 'U')}
              </div>
              <div className={styles.sidebarUserInfo}>
                <h4>{profile.name || 'Add Name'}</h4>
                <p>{profile.email}</p>
                <p>{profile.mobile || 'Add mobile number'}</p>
              </div>
              <button onClick={() => setEditing(true)} className={styles.sidebarEditBtn}>
                <FiEdit2 /> Edit Profile
              </button>
            </div>

            <div className={styles.sidebarMenu}>
              <button className={`${styles.sidebarMenuItem} ${activeTab === 'orders' ? styles.active : ''}`}
                onClick={() => setActiveTab('orders')}>
                <FiPackage /> My Orders
              </button>
              <button className={`${styles.sidebarMenuItem} ${activeTab === 'addresses' ? styles.active : ''}`}
                onClick={() => setActiveTab('addresses')}>
                <FiMapPin /> Saved Addresses
              </button>
              <button className={`${styles.sidebarMenuItem} ${activeTab === 'returns' ? styles.active : ''}`}
                onClick={() => setActiveTab('returns')}>
                <FiRefreshCw /> My Returns
              </button>
              <button className={`${styles.sidebarMenuItem} ${activeTab === 'bulk' ? styles.active : ''}`}
                onClick={() => setActiveTab('bulk')}>
                <FiShoppingBag /> Bulk Orders
              </button>
              <Link to="/shipping" className={styles.sidebarMenuItem}>
                <FiDelivery /> Shipping Policy
              </Link>
              <Link to="/returns" className={styles.sidebarMenuItem}>
                <FiShield /> Return Policy
              </Link>
              <Link to="/faq" className={styles.sidebarMenuItem}>
                <FiHelpCircle /> Help & FAQs
              </Link>
            </div>

            <button onClick={handleLogout} className={styles.sidebarLogoutBtn}>
              <FiLogOut /> Sign Out
            </button>
          </div>

          {/* Main Content */}
          <div className={styles.profileMain}>

            {/* Orders Section */}
            {activeTab === 'orders' && (
              <div className={styles.ordersSection}>
                <div className={styles.sectionHeader}>
                  <div>
                    <h2>My Orders</h2>
                    <p>Track, return, or buy things again</p>
                  </div>
                </div>
                {orders.length === 0 ? (
                  <div className={styles.noOrders}>
                    <FiShoppingBag size={64} />
                    <h3>No orders yet</h3>
                    <p>When you place an order, it will appear here</p>
                    <Link to="/products" className={styles.shopNowBtn}>Start Shopping →</Link>
                  </div>
                ) : (
                  orders.map((order) => (
                    <div key={order.id} className={styles.orderCard}>
                      <div className={styles.orderCardHeader}>
                        <div className={styles.orderInfo}>
                          <span className={styles.orderDate}>
                            {order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Date not available'}
                          </span>
                          <span className={styles.orderNumber}>ORDER #{order.order_number || 'N/A'}</span>
                        </div>
                        {getOrderStatusBadge(order.status)}
                      </div>
                      <div className={styles.orderCardBody}>
                        {order.order_items && order.order_items.slice(0, 2).map((item, idx) => (
                          <div key={idx} className={styles.orderProduct}>
                            <div className={styles.orderProductInfo}>
                              <div className={styles.orderProductDetails}>
                                <h4>{item.product_name}</h4>
                                <p>Quantity: {item.quantity}</p>
                              </div>
                              <div className={styles.orderProductPrice}>
                                ₹{(item.price || 0) * (item.quantity || 0)}
                              </div>
                            </div>
                          </div>
                        ))}
                        {order.order_items && order.order_items.length > 2 && (
                          <div className={styles.moreItems}>+ {order.order_items.length - 2} more items</div>
                        )}
                      </div>
                      <div className={styles.orderCardFooter}>
                        <div className={styles.orderTotal}>
                          <span>Total Amount:</span>
                          <strong>₹{order.total_amount || 0}</strong>
                        </div>
                        <Link to="/orders" className={styles.viewOrderBtn}>
                          View Order Details <FiChevronRight />
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Addresses Section */}
            {activeTab === 'addresses' && (
              <div className={styles.addressesSection}>
                <div className={styles.sectionHeader}>
                  <div>
                    <h2>Saved Addresses</h2>
                  </div>
                  <button onClick={() => {
                    setAddressForm({ name: profile.name || '', mobile: profile.mobile || '', doorNo: '', street: '', city: '', state: '', pincode: '', landmark: '', isDefault: profile.addresses.length === 0 });
                    setEditingAddressIndex(null);
                    setShowAddressForm(true);
                  }} className={styles.addAddressBtn}>
                    <FiPlus /> Add New Address
                  </button>
                </div>
                {profile.addresses.length === 0 ? (
                  <div className={styles.noAddresses}>
                    <FiMapPin size={48} />
                    <h3>No saved addresses</h3>
                    <p>Add your first address for faster checkout</p>
                  </div>
                ) : (
                  <div className={styles.addressesGrid}>
                    {profile.addresses.map((address, index) => (
                      <div key={address.id || index} className={`${styles.addressCard} ${address.isDefault ? styles.defaultCard : ''}`}>
                        {address.isDefault && <div className={styles.defaultBadge}>Default Address</div>}
                        <div className={styles.addressContent}>
                          <p className={styles.addressName}>{address.name || 'N/A'}</p>
                          <p className={styles.addressPhone}>📞 {address.mobile || 'N/A'}</p>
                          <p className={styles.addressLine}>{address.doorNo || ''}, {address.street || ''}</p>
                          {address.landmark && <p className={styles.addressLandmark}>📍 {address.landmark}</p>}
                          <p className={styles.addressLocation}>{address.city || ''}, {address.state || 'Andhra Pradesh'} - {address.pincode || ''}</p>
                        </div>
                        <div className={styles.addressActions}>
                          {!address.isDefault && (
                            <button onClick={() => handleSetDefaultAddress(index)} className={styles.setDefaultBtn}>Set as Default</button>
                          )}
                          <button onClick={() => handleEditAddress(index)} className={styles.editBtn}>Edit</button>
                          <button onClick={() => handleDeleteAddress(index)} className={styles.deleteBtn}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Returns Section */}
            {activeTab === 'returns' && (
              <div className={styles.returnsSection}>
                <div className={styles.sectionHeader}>
                  <div>
                    <h2>My Returns</h2>
                    <p>Track your return requests</p>
                  </div>
                </div>
                {returns.length === 0 ? (
                  <div className={styles.noReturns}>
                    <FiRefreshCw size={64} />
                    <h3>No return requests</h3>
                    <p>You haven't requested any returns yet</p>
                    <Link to="/products" className={styles.shopNowBtn}>Continue Shopping →</Link>
                  </div>
                ) : (
                  <div className={styles.returnsList}>
                    {returns.map((returnReq) => (
                      <div key={returnReq.id} className={styles.returnCard}>
                        <div className={styles.returnCardHeader}>
                          <div className={styles.returnInfo}>
                            <span className={styles.returnOrderNumber}>Return for Order #{returnReq.order_number}</span>
                            <span className={styles.returnDate}>
                              {new Date(returnReq.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                          </div>
                          {getReturnStatusBadge(returnReq.status)}
                        </div>
                        <div className={styles.returnCardBody}>
                          <div className={styles.returnDetails}>
                            <div className={styles.returnRow}><strong>Reason:</strong><span>{returnReq.reason}</span></div>
                            <div className={styles.returnRow}><strong>Resolution Preference:</strong><span>{returnReq.resolution_preference}</span></div>
                            <div className={styles.returnRow}><strong>Description:</strong><p>{returnReq.issue_description}</p></div>
                            {returnReq.admin_message && (
                              <div className={styles.returnAdminMessage}>
                                <strong>Admin Response:</strong>
                                <p>{returnReq.admin_message}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Bulk Orders Section */}
            {activeTab === 'bulk' && (
              <div className={styles.bulkSection}>
                <div className={styles.sectionHeader}>
                  <div>
                    <h2>My Bulk Order Requests</h2>
                    <p>Track your wholesale inquiries</p>
                  </div>
                  <Link to="/bulk-order" className={styles.addAddressBtn}>
                    <FiPlus /> New Request
                  </Link>
                </div>
                {bulkOrders.length === 0 ? (
                  <div className={styles.noBulkOrders}>
                    <FiShoppingBag size={64} />
                    <h3>No bulk order requests</h3>
                    <p>Submit a wholesale inquiry to get started</p>
                    <Link to="/bulk-order" className={styles.shopNowBtn}>Request Bulk Order →</Link>
                  </div>
                ) : (
                  <div className={styles.bulkOrdersList}>
                    {bulkOrders.map((order) => (
                      <div key={order.id} className={styles.bulkOrderCard}>
                        <div className={styles.bulkOrderCardHeader}>
                          <div className={styles.bulkOrderInfo}>
                            <span className={styles.bulkOrderNumber}>
                              BULK #{order.order_number || order.id?.slice(0, 8).toUpperCase()}
                            </span>
                            <span className={styles.bulkOrderDate}>
                              {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                          </div>
                          {getBulkStatusBadge(order.status)}
                        </div>

                        <div className={styles.bulkOrderCardBody}>
                          <div className={styles.bulkOrderGrid}>
                            <div className={styles.bulkOrderRow}>
                              <strong>Product Interest</strong>
                              <span>{order.product_interest}</span>
                            </div>
                            <div className={styles.bulkOrderRow}>
                              <strong>Quantity</strong>
                              <span>{order.quantity} {order.quantity_unit}</span>
                            </div>
                            {order.budget_range && (
                              <div className={styles.bulkOrderRow}>
                                <strong>Budget Range</strong>
                                <span>{order.budget_range}</span>
                              </div>
                            )}
                            {order.expected_delivery_date && (
                              <div className={styles.bulkOrderRow}>
                                <strong>Expected Delivery</strong>
                                <span>{new Date(order.expected_delivery_date).toLocaleDateString('en-IN')}</span>
                              </div>
                            )}
                            {order.company_name && (
                              <div className={styles.bulkOrderRow}>
                                <strong>Company</strong>
                                <span>{order.company_name}</span>
                              </div>
                            )}
                            {order.additional_requirements && (
                              <div className={styles.bulkOrderRowFull}>
                                <strong>Additional Requirements</strong>
                                <p>{order.additional_requirements}</p>
                              </div>
                            )}
                          </div>

                          {order.admin_notes && (
                            <div className={styles.bulkAdminNote}>
                              <strong>💬 Admin Response</strong>
                              <p>{order.admin_notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Address Modal */}
      {showAddressForm && (
        <div className={styles.modalOverlay} onClick={() => setShowAddressForm(false)}>
          <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{editingAddressIndex !== null ? 'Edit Address' : 'Add New Address'}</h3>
              <button onClick={() => setShowAddressForm(false)} className={styles.modalClose}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Full Name *</label>
                  <input type="text" value={addressForm.name}
                    onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })} />
                </div>
                <div className={styles.formGroup}>
                  <label>Mobile Number *</label>
                  <input type="tel" value={addressForm.mobile}
                    onChange={(e) => setAddressForm({ ...addressForm, mobile: e.target.value })} />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Door/House No *</label>
                  <input type="text" value={addressForm.doorNo}
                    onChange={(e) => setAddressForm({ ...addressForm, doorNo: e.target.value })} />
                </div>
                <div className={styles.formGroup}>
                  <label>Street Address *</label>
                  <input type="text" value={addressForm.street}
                    onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })} />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Landmark</label>
                  <input type="text" value={addressForm.landmark}
                    onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })} />
                </div>
                <div className={styles.formGroup}>
                  <label>City *</label>
                  <input type="text" value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>State</label>
                  <select value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}>
                    <option value="">Select State</option>
                    {indianStates.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>PIN Code *</label>
                  <input type="text" value={addressForm.pincode}
                    onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })} maxLength="6" />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })} />
                  Set as default address
                </label>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button onClick={() => setShowAddressForm(false)} className={styles.cancelBtn}>Cancel</button>
              <button onClick={handleAddAddress} className={styles.saveBtn}>
                <FiSave /> {editingAddressIndex !== null ? 'Update Address' : 'Save Address'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {editing && (
        <div className={styles.modalOverlay} onClick={() => setEditing(false)}>
          <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Edit Profile</h3>
              <button onClick={() => setEditing(false)} className={styles.modalClose}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Full Name</label>
                <input type="text" value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
              </div>
              <div className={styles.formGroup}>
                <label>Email Address</label>
                <input type="email" value={profile.email} disabled className={styles.disabledInput} />
                <p className={styles.fieldNote}>Email cannot be changed</p>
              </div>
              <div className={styles.formGroup}>
                <label>Mobile Number</label>
                <input type="tel" value={profile.mobile}
                  onChange={(e) => setProfile({ ...profile, mobile: e.target.value })} />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button onClick={() => setEditing(false)} className={styles.cancelBtn}>Cancel</button>
              <button onClick={handleSaveProfile} disabled={saving} className={styles.saveBtn}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;