import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { 
  FiUser, FiMail, FiPhone, FiMapPin, FiEdit2, FiSave, FiPlus, FiTrash2, FiStar,
  FiPackage, FiShoppingBag, FiChevronRight, FiClock, FiCheckCircle, FiTruck, FiXCircle,
  FiLogOut
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressIndex, setEditingAddressIndex] = useState(null);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [isMobile, setIsMobile] = useState(false);
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
        .select(`
          *,
          order_items (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data && !error) {
        setOrders(data);
      }
    } catch (error) {
      console.error('Fetch orders error:', error);
    } finally {
      setLoading(false);
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

      if (error) {
        console.error('Save error:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Save to database error:', error);
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
    name: '',
    mobile: '',
    doorNo: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
    isDefault: false
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
      setAddressForm({
        name: '',
        mobile: '',
        doorNo: '',
        street: '',
        city: '',
        state: '',
        pincode: '',
        landmark: '',
        isDefault: false
      });
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
        name: address.name || '',
        mobile: address.mobile || '',
        doorNo: address.doorNo || '',
        street: address.street || '',
        city: address.city || '',
        state: address.state || '',
        pincode: address.pincode || '',
        landmark: address.landmark || '',
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
    const updatedAddresses = currentAddresses.map((addr, i) => ({
      ...addr,
      isDefault: i === index
    }));
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
    const config = {
      'pending': { icon: <FiClock />, color: '#F59E0B', bg: '#FEF3C7' },
      'accepted': { icon: <FiCheckCircle />, color: '#10B981', bg: '#D1FAE5' },
      'shipped': { icon: <FiTruck />, color: '#3B82F6', bg: '#DBEAFE' },
      'transit': { icon: <FiTruck />, color: '#8B5CF6', bg: '#EDE9FE' },
      'out_for_delivery': { icon: <FiTruck />, color: '#EC4899', bg: '#FCE7F3' },
      'delivered': { icon: <FiCheckCircle />, color: '#059669', bg: '#D1FAE5' },
      'cancelled': { icon: <FiXCircle />, color: '#EF4444', bg: '#FEE2E2' }
    };
    const c = config[status] || config['pending'];
    return <span className={styles.orderStatusBadge} style={{ background: c.bg, color: c.color }}>{c.icon} {status.toUpperCase()}</span>;
  };

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
        {/* Mobile Header */}
        <div className={styles.mobileHeader}>
          <button onClick={() => navigate(-1)} className={styles.mobileBackBtn}>←</button>
          <h1>My Profile</h1>
          <div className={styles.mobilePlaceholder}></div>
        </div>

        {/* Tab Switcher */}
        <div className={styles.mobileTabs}>
          <button 
            className={`${styles.mobileTab} ${activeTab === 'profile' ? styles.active : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <FiUser /> Profile
          </button>
          <button 
            className={`${styles.mobileTab} ${activeTab === 'orders' ? styles.active : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <FiPackage /> Orders
          </button>
          <button 
            className={`${styles.mobileTab} ${activeTab === 'addresses' ? styles.active : ''}`}
            onClick={() => setActiveTab('addresses')}
          >
            <FiMapPin /> Addresses
          </button>
        </div>

        {message && (
          <div className={`${styles.mobileMessage} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className={styles.mobileProfileCard}>
            <div className={styles.mobileProfileInfo}>
              <div className={styles.mobileProfileAvatar}>
                {profile.name ? profile.name[0].toUpperCase() : profile.email[0].toUpperCase()}
              </div>
              <div className={styles.mobileProfileDetails}>
                <h3>{profile.name || 'Add Name'}</h3>
                <p>{profile.email}</p>
                <p>{profile.mobile || 'Add mobile number'}</p>
              </div>
            </div>
            
            <button onClick={() => setEditing(true)} className={styles.mobileEditProfileBtn}>
              <FiEdit2 /> Edit Profile
            </button>

            {/* Logout Button */}
            <button onClick={handleLogout} className={styles.mobileLogoutBtn}>
              <FiLogOut /> Logout
            </button>

            {editing && (
              <div className={styles.mobileEditForm}>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
                <input
                  type="tel"
                  placeholder="Mobile Number"
                  value={profile.mobile}
                  onChange={(e) => setProfile({ ...profile, mobile: e.target.value })}
                />
                <div className={styles.mobileEditActions}>
                  <button onClick={() => setEditing(false)} className={styles.mobileCancelBtn}>Cancel</button>
                  <button onClick={handleSaveProfile} disabled={saving} className={styles.mobileSaveBtn}>
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className={styles.mobileOrdersList}>
            {orders.length === 0 ? (
              <div className={styles.mobileEmptyOrders}>
                <FiShoppingBag />
                <p>No orders yet</p>
                <Link to="/products">Start Shopping →</Link>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className={styles.mobileOrderItem}>
                  <div className={styles.mobileOrderHeader}>
                    <span className={styles.mobileOrderNumber}>#{order.order_number}</span>
                    {getOrderStatusBadge(order.status)}
                  </div>
                  <div className={styles.mobileOrderDate}>
                    {new Date(order.created_at).toLocaleDateString()}
                  </div>
                  <div className={styles.mobileOrderTotal}>
                    <span>Total:</span>
                    <strong>₹{order.total_amount}</strong>
                  </div>
                  <Link to={`/orders`} className={styles.mobileViewOrderBtn}>
                    View Details <FiChevronRight />
                  </Link>
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
                  <p><strong>{address.name}</strong></p>
                  <p>{address.mobile}</p>
                  <p>{address.doorNo}, {address.street}</p>
                  <p>{address.city}, {address.state} - {address.pincode}</p>
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
              setAddressForm({
                name: '',
                mobile: '',
                doorNo: '',
                street: '',
                city: '',
                state: '',
                pincode: '',
                landmark: '',
                isDefault: profile.addresses.length === 0
              });
              setEditingAddressIndex(null);
              setShowAddressForm(true);
            }} className={styles.mobileAddAddressBtn}>
              <FiPlus /> Add New Address
            </button>
          </div>
        )}

        {/* Address Modal */}
        {showAddressForm && (
          <div className={styles.mobileModal} onClick={() => setShowAddressForm(false)}>
            <div className={styles.mobileModalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.mobileModalHeader}>
                <h3>{editingAddressIndex !== null ? 'Edit Address' : 'Add Address'}</h3>
                <button onClick={() => setShowAddressForm(false)}>✕</button>
              </div>
              <div className={styles.mobileModalBody}>
                <input type="text" placeholder="Full Name *" value={addressForm.name} onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })} />
                <input type="tel" placeholder="Mobile Number *" value={addressForm.mobile} onChange={(e) => setAddressForm({ ...addressForm, mobile: e.target.value })} />
                <input type="text" placeholder="Door/House No *" value={addressForm.doorNo} onChange={(e) => setAddressForm({ ...addressForm, doorNo: e.target.value })} />
                <input type="text" placeholder="Street Address *" value={addressForm.street} onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })} />
                <input type="text" placeholder="Landmark" value={addressForm.landmark} onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })} />
                <input type="text" placeholder="City *" value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} />
                <select value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}>
                  <option value="">Select State</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Telangana">Telangana</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Kerala">Kerala</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Delhi">Delhi</option>
                </select>
                <input type="text" placeholder="PIN Code *" value={addressForm.pincode} onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })} maxLength="6" />
                <label className={styles.mobileCheckbox}>
                  <input type="checkbox" checked={addressForm.isDefault} onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })} />
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
        <h1 className={styles.pageTitle}>My Profile</h1>

        {message && (
          <div className={`${styles.message} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}

        <div className={styles.profileLayout}>
          {/* Profile Information Card */}
          <div className={styles.profileCard}>
            <div className={styles.cardHeader}>
              <h2><FiUser /> Personal Information</h2>
              {!editing && (
                <button onClick={() => setEditing(true)} className={styles.editBtn}>
                  <FiEdit2 /> Edit Profile
                </button>
              )}
            </div>
            <div className={styles.profileForm}>
              <div className={styles.formGroup}>
                <label>Full Name</label>
                <input type="text" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} disabled={!editing} className={!editing ? styles.readonly : ''} />
              </div>
              <div className={styles.formGroup}>
                <label>Email Address</label>
                <input type="email" value={profile.email} disabled className={styles.readonly} />
                <p className={styles.fieldNote}>Email cannot be changed</p>
              </div>
              <div className={styles.formGroup}>
                <label>Mobile Number</label>
                <input type="tel" value={profile.mobile} onChange={(e) => setProfile({ ...profile, mobile: e.target.value })} disabled={!editing} className={!editing ? styles.readonly : ''} />
              </div>
              {editing && (
                <div className={styles.formActions}>
                  <button onClick={() => setEditing(false)} className={styles.cancelBtn}>Cancel</button>
                  <button onClick={handleSaveProfile} disabled={saving} className={styles.saveBtn}><FiSave /> {saving ? 'Saving...' : 'Save Changes'}</button>
                </div>
              )}
            </div>
          </div>

          {/* Addresses Card */}
          <div className={styles.profileCard}>
            <div className={styles.cardHeader}>
              <h2><FiMapPin /> Saved Addresses</h2>
              <button onClick={() => {
                setAddressForm({
                  name: '',
                  mobile: '',
                  doorNo: '',
                  street: '',
                  city: '',
                  state: '',
                  pincode: '',
                  landmark: '',
                  isDefault: profile.addresses.length === 0
                });
                setEditingAddressIndex(null);
                setShowAddressForm(true);
              }} className={styles.addAddressBtn}>
                <FiPlus /> Add New Address
              </button>
            </div>
            {profile.addresses.length === 0 ? (
              <div className={styles.noAddresses}><p>No saved addresses yet.</p></div>
            ) : (
              <div className={styles.addressesList}>
                {profile.addresses.map((address, index) => (
                  <div key={address.id || index} className={`${styles.addressCard} ${address.isDefault ? styles.defaultAddress : ''}`}>
                    {address.isDefault && <span className={styles.defaultBadge}>Default</span>}
                    <div className={styles.addressContent}>
                      <p><strong>{address.name}</strong></p>
                      <p>📞 {address.mobile}</p>
                      <p>🏠 {address.doorNo}, {address.street}</p>
                      {address.landmark && <p>📍 Landmark: {address.landmark}</p>}
                      <p>🏙️ {address.city}, {address.state || 'Andhra Pradesh'} - {address.pincode}</p>
                    </div>
                    <div className={styles.addressActions}>
                      {!address.isDefault && <button onClick={() => handleSetDefaultAddress(index)} className={styles.setDefaultBtn}><FiStar /> Set as Default</button>}
                      <button onClick={() => handleEditAddress(index)} className={styles.editAddressBtn}><FiEdit2 /></button>
                      <button onClick={() => handleDeleteAddress(index)} className={styles.deleteAddressBtn}><FiTrash2 /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Orders Section - Desktop */}
          <div className={styles.profileCard}>
            <div className={styles.cardHeader}>
              <h2><FiPackage /> My Orders</h2>
              <Link to="/orders" className={styles.viewAllOrdersBtn}>View All →</Link>
            </div>
            {orders.length === 0 ? (
              <div className={styles.noOrders}><p>No orders yet.</p><Link to="/products">Start Shopping</Link></div>
            ) : (
              <div className={styles.ordersList}>
                {orders.slice(0, 3).map((order) => (
                  <div key={order.id} className={styles.orderItem}>
                    <div className={styles.orderItemHeader}>
                      <span className={styles.orderNumber}>#{order.order_number}</span>
                      {getOrderStatusBadge(order.status)}
                    </div>
                    <div className={styles.orderItemDate}>{new Date(order.created_at).toLocaleDateString()}</div>
                    <div className={styles.orderItemTotal}>₹{order.total_amount}</div>
                    <Link to="/orders" className={styles.viewOrderBtn}>View Details →</Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Address Modal - Desktop */}
      {showAddressForm && (
        <div className={styles.modal} onClick={() => setShowAddressForm(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{editingAddressIndex !== null ? 'Edit Address' : 'Add New Address'}</h3>
              <button onClick={() => setShowAddressForm(false)} className={styles.closeBtn}>✕</button>
            </div>
            <div className={styles.addressForm}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}><label>Full Name *</label><input type="text" value={addressForm.name} onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })} /></div>
                <div className={styles.formGroup}><label>Mobile Number *</label><input type="tel" value={addressForm.mobile} onChange={(e) => setAddressForm({ ...addressForm, mobile: e.target.value })} /></div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}><label>Door/House No *</label><input type="text" value={addressForm.doorNo} onChange={(e) => setAddressForm({ ...addressForm, doorNo: e.target.value })} /></div>
                <div className={styles.formGroup}><label>Street Address *</label><input type="text" value={addressForm.street} onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })} /></div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}><label>Landmark</label><input type="text" value={addressForm.landmark} onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })} /></div>
                <div className={styles.formGroup}><label>City *</label><input type="text" value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} /></div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}><label>State</label><select value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}><option value="">Select State</option><option value="Andhra Pradesh">Andhra Pradesh</option><option value="Telangana">Telangana</option><option value="Karnataka">Karnataka</option><option value="Tamil Nadu">Tamil Nadu</option><option value="Kerala">Kerala</option><option value="Maharashtra">Maharashtra</option><option value="Delhi">Delhi</option></select></div>
                <div className={styles.formGroup}><label>PIN Code *</label><input type="text" value={addressForm.pincode} onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })} maxLength="6" /></div>
              </div>
              <div className={styles.formGroup}><label className={styles.checkbox}><input type="checkbox" checked={addressForm.isDefault} onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })} /> Set as default address</label></div>
              <div className={styles.modalActions}><button onClick={() => setShowAddressForm(false)} className={styles.cancelBtn}>Cancel</button><button onClick={handleAddAddress} className={styles.saveBtn}><FiSave /> {editingAddressIndex !== null ? 'Update Address' : 'Save Address'}</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;