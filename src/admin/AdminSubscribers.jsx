// src/admin/AdminSubscribers.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import {
  FiMail,
  FiUsers,
  FiCalendar,
  FiSearch,
  FiDownload,
  FiTrash2,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
  FiTrendingUp,
  FiUserPlus,
  FiClock,
  FiRefreshCw
} from 'react-icons/fi';
import styles from './AdminSubscribers.module.css';

const AdminSubscribers = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    newThisMonth: 0,
    lastSubscribed: null,
    totalSubscriptions: 0
  });
  const [selectedSubscriber, setSelectedSubscriber] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

  // Fetch subscribers
  useEffect(() => {
    fetchSubscribers();
    fetchStats();

    // Real-time subscription for new subscribers
    const channel = supabase
      .channel('subscribers-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'newsletter_subscribers' }, (payload) => {
        setSubscribers(prev => [payload.new, ...prev]);
        fetchStats(); // update stats
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'newsletter_subscribers' }, () => {
        fetchSubscribers();
        fetchStats();
      })
      .subscribe();

    return () => channel.unsubscribe();
  }, []);

  const fetchSubscribers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .order('subscribed_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscribers:', error);
      setActionMessage({ type: 'error', text: 'Failed to load subscribers: ' + error.message });
    } else {
      setSubscribers(data || []);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    // Total count
    const { count: total, error: countError } = await supabase
      .from('newsletter_subscribers')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error counting subscribers:', countError);
      return;
    }

    // New this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const { count: newThisMonth } = await supabase
      .from('newsletter_subscribers')
      .select('*', { count: 'exact', head: true })
      .gte('subscribed_at', startOfMonth.toISOString());

    // Last subscriber
    const { data: last } = await supabase
      .from('newsletter_subscribers')
      .select('subscribed_at')
      .order('subscribed_at', { ascending: false })
      .limit(1);

    setStats({
      total: total || 0,
      newThisMonth: newThisMonth || 0,
      lastSubscribed: last && last.length > 0 ? last[0].subscribed_at : null,
      totalSubscriptions: total || 0
    });
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredSubscribers = subscribers.filter(sub =>
    sub.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (email) => {
    setDeleting(true);
    const { error } = await supabase
      .from('newsletter_subscribers')
      .delete()
      .eq('email', email);

    if (error) {
      setActionMessage({ type: 'error', text: 'Failed to delete: ' + error.message });
    } else {
      setActionMessage({ type: 'success', text: 'Subscriber removed successfully!' });
      // Remove from local state
      setSubscribers(prev => prev.filter(sub => sub.email !== email));
      fetchStats();
    }
    setDeleting(false);
    setShowDeleteModal(false);
    setSelectedSubscriber(null);
    setTimeout(() => setActionMessage({ type: '', text: '' }), 3000);
  };

  const exportCSV = () => {
    if (subscribers.length === 0) {
      setActionMessage({ type: 'warning', text: 'No subscribers to export.' });
      setTimeout(() => setActionMessage({ type: '', text: '' }), 3000);
      return;
    }

    const headers = ['Email', 'Subscribed Date'];
    const rows = subscribers.map(sub => [
      sub.email,
      new Date(sub.subscribed_at).toLocaleString()
    ]);

    let csvContent = headers.join(',') + '\n' + rows.map(row => row.join(',')).join('\n');

    // Add BOM for UTF-8
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `subscribers_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.adminSubscribers}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2>Newsletter Subscribers</h2>
          <p className={styles.headerSubtitle}>Manage your email subscribers</p>
        </div>
        <div className={styles.headerActions}>
          <button onClick={exportCSV} className={styles.exportBtn}>
            <FiDownload /> Export CSV
          </button>
          <button onClick={() => { fetchSubscribers(); fetchStats(); }} className={styles.refreshBtn}>
            <FiRefreshCw />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#E8F5E9', color: '#1F5B3A' }}>
            <FiUsers />
          </div>
          <div className={styles.statInfo}>
            <span>Total Subscribers</span>
            <strong>{stats.total}</strong>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#E3F2FD', color: '#3B82F6' }}>
            <FiUserPlus />
          </div>
          <div className={styles.statInfo}>
            <span>New This Month</span>
            <strong>{stats.newThisMonth}</strong>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#FFF3E0', color: '#F59E0B' }}>
            <FiClock />
          </div>
          <div className={styles.statInfo}>
            <span>Last Subscribed</span>
            <strong>
              {stats.lastSubscribed
                ? new Date(stats.lastSubscribed).toLocaleDateString()
                : 'Never'}
            </strong>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#FCE4EC', color: '#EC4899' }}>
            <FiTrendingUp />
          </div>
          <div className={styles.statInfo}>
            <span>Growth Rate</span>
            <strong>
              {stats.total > 0
                ? Math.round((stats.newThisMonth / stats.total) * 100) + '%'
                : '0%'}
            </strong>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className={styles.searchBar}>
        <div className={styles.searchBox}>
          <FiSearch />
          <input
            type="text"
            placeholder="Search by email..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        <div className={styles.resultsCount}>
          {filteredSubscribers.length} subscriber{filteredSubscribers.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Message */}
      {actionMessage.text && (
        <div className={`${styles.message} ${styles[actionMessage.type]}`}>
          {actionMessage.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
          {actionMessage.text}
        </div>
      )}

      {/* Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Email</th>
              <th>Subscribed Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubscribers.map(sub => (
              <tr key={sub.email}>
                <td>
                  <div className={styles.emailCell}>
                    <FiMail className={styles.emailIcon} />
                    <span>{sub.email}</span>
                  </div>
                </td>
                <td>
                  <div className={styles.dateCell}>
                    <FiCalendar />
                    <span>{new Date(sub.subscribed_at).toLocaleString()}</span>
                  </div>
                </td>
                <td>
                  <button
                    onClick={() => {
                      setSelectedSubscriber(sub);
                      setShowDeleteModal(true);
                    }}
                    className={styles.deleteBtn}
                    title="Remove subscriber"
                  >
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredSubscribers.length === 0 && (
        <div className={styles.emptyState}>
          <FiMail className={styles.emptyIcon} />
          <h3>No Subscribers Found</h3>
          <p>
            {searchTerm
              ? 'Try adjusting your search'
              : 'Your newsletter list is empty. Encourage customers to subscribe!'}
          </p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedSubscriber && (
        <div className={styles.modal} onClick={() => setShowDeleteModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Confirm Removal</h3>
              <button onClick={() => setShowDeleteModal(false)} className={styles.closeBtn}>
                <FiX />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.deleteIcon}>
                <FiAlertCircle />
              </div>
              <p>
                Are you sure you want to remove <strong>{selectedSubscriber.email}</strong> from the subscribers list?
              </p>
              <p className={styles.deleteNote}>This action cannot be undone.</p>
            </div>
            <div className={styles.modalFooter}>
              <button onClick={() => setShowDeleteModal(false)} className={styles.cancelBtn}>
                Cancel
              </button>
              <button
                onClick={() => handleDelete(selectedSubscriber.email)}
                className={styles.confirmDeleteBtn}
                disabled={deleting}
              >
                {deleting ? 'Removing...' : 'Yes, Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubscribers;