import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { 
  FiEye, FiCheckCircle, FiClock, 
  FiSearch, FiFilter, FiRefreshCw,
  FiMessageSquare
} from 'react-icons/fi';
import styles from './AdminContactMessages.module.css';

const AdminContactMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [adminResponse, setAdminResponse] = useState('');
  const [updating, setUpdating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    read: 0,
    replied: 0,
    resolved: 0
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchMessages();
    
    // Real-time subscription
    const messagesSubscription = supabase
      .channel('contact-messages-channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'contact_us' }, 
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
    };
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contact_us')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMessages(data || []);
      
      setStats({
        total: data?.length || 0,
        pending: data?.filter(m => m.status === 'pending').length || 0,
        read: data?.filter(m => m.status === 'read').length || 0,
        replied: data?.filter(m => m.status === 'replied').length || 0,
        resolved: data?.filter(m => m.status === 'resolved').length || 0
      });
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateMessageStatus = async (messageId, newStatus, response = null) => {
    setUpdating(true);
    try {
      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };
      
      if (response) {
        updateData.admin_response = response;
        updateData.responded_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('contact_us')
        .update(updateData)
        .eq('id', messageId);

      if (error) throw error;

      await fetchMessages();
      setShowModal(false);
      setSelectedMessage(null);
      setAdminResponse('');
    } catch (error) {
      console.error('Error updating message:', error);
      alert('Failed to update message status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { label: 'Pending', color: '#F59E0B', bg: '#FEF3C7', icon: <FiClock size={12} /> },
      read: { label: 'Read', color: '#3B82F6', bg: '#DBEAFE', icon: <FiEye size={12} /> },
      replied: { label: 'Replied', color: '#8B5CF6', bg: '#EDE9FE', icon: <FiMessageSquare size={12} /> },
      resolved: { label: 'Resolved', color: '#10B981', bg: '#D1FAE5', icon: <FiCheckCircle size={12} /> }
    };
    const c = config[status] || config.pending;
    return (
      <span className={styles.statusBadge} style={{ background: c.bg, color: c.color }}>
        {c.icon} {c.label}
      </span>
    );
  };

  const filteredMessages = messages.filter(m => {
    const matchesSearch = m.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.message?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className={styles.loadingContainer}><div className={styles.loadingSpinner}></div></div>;
  }

  // Mobile UI
  if (isMobile) {
    return (
      <div className={styles.mobileAdminMessages}>
        <div className={styles.mobileHeader}>
          <h2>Contact Messages</h2>
          <button onClick={fetchMessages} className={styles.refreshBtn}><FiRefreshCw /></button>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}><span>Total</span><strong>{stats.total}</strong></div>
          <div className={styles.statCard} style={{ background: '#FEF3C7' }}><span>Pending</span><strong>{stats.pending}</strong></div>
          <div className={styles.statCard} style={{ background: '#D1FAE5' }}><span>Resolved</span><strong>{stats.resolved}</strong></div>
        </div>

        <div className={styles.mobileFilters}>
          <div className={styles.searchBox}>
            <FiSearch />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <div className={styles.mobileMessagesList}>
          {filteredMessages.map(msg => (
            <div key={msg.id} className={styles.mobileMessageCard}>
              <div className={styles.mobileMessageHeader}>
                <strong>{msg.full_name}</strong>
                {getStatusBadge(msg.status)}
              </div>
              <div className={styles.mobileMessageSubject}>{msg.subject}</div>
              <div className={styles.mobileMessageDate}>
                {new Date(msg.created_at).toLocaleDateString()}
              </div>
              <button onClick={() => {
                setSelectedMessage(msg);
                setAdminResponse(msg.admin_response || '');
                setShowModal(true);
              }} className={styles.mobileViewBtn}>
                <FiEye /> View
              </button>
            </div>
          ))}
        </div>

        {/* Mobile Modal */}
        {showModal && selectedMessage && (
          <div className={styles.mobileModal}>
            <div className={styles.mobileModalContent}>
              <div className={styles.mobileModalHeader}>
                <h3>Message Details</h3>
                <button onClick={() => setShowModal(false)}>✕</button>
              </div>
              <div className={styles.mobileModalBody}>
                <div className={styles.detailRow}><strong>From:</strong> {selectedMessage.full_name}</div>
                <div className={styles.detailRow}><strong>Email:</strong> {selectedMessage.email}</div>
                <div className={styles.detailRow}><strong>Phone:</strong> {selectedMessage.phone || 'N/A'}</div>
                <div className={styles.detailRow}><strong>Subject:</strong> {selectedMessage.subject}</div>
                <div className={styles.detailRow}><strong>Message:</strong> {selectedMessage.message}</div>
                <div className={styles.formGroup}>
                  <label>Admin Response</label>
                  <textarea
                    rows="3"
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    placeholder="Type your response here..."
                  />
                </div>
              </div>
              <div className={styles.mobileModalFooter}>
                <button 
                  onClick={() => updateMessageStatus(selectedMessage.id, 'resolved', adminResponse)} 
                  className={styles.resolveBtn} 
                  disabled={updating}
                >
                  <FiCheckCircle /> Mark Resolved
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop UI
  return (
    <div className={styles.adminMessages}>
      <div className={styles.header}>
        <h2>Contact Messages</h2>
        <p>Manage customer inquiries and support requests</p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}><div className={styles.statIcon}>📧</div><div><h3>Total</h3><span>{stats.total}</span></div></div>
        <div className={styles.statCard}><div className={styles.statIcon}>⏳</div><div><h3>Pending</h3><span>{stats.pending}</span></div></div>
        <div className={styles.statCard}><div className={styles.statIcon}>👁️</div><div><h3>Read</h3><span>{stats.read}</span></div></div>
        <div className={styles.statCard}><div className={styles.statIcon}>✉️</div><div><h3>Replied</h3><span>{stats.replied}</span></div></div>
        <div className={styles.statCard}><div className={styles.statIcon}>✅</div><div><h3>Resolved</h3><span>{stats.resolved}</span></div></div>
      </div>

      <div className={styles.filtersBar}>
        <div className={styles.searchBox}>
          <FiSearch />
          <input
            type="text"
            placeholder="Search by name, email, subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className={styles.filterGroup}>
          <FiFilter />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
        <button onClick={fetchMessages} className={styles.refreshBtn}><FiRefreshCw /> Refresh</button>
      </div>

      <div className={styles.messagesTable}>
        <table>
          <thead>
            <tr><th>Customer</th><th>Subject</th><th>Message</th><th>Status</th><th>Date</th><th>Action</th></tr>
          </thead>
          <tbody>
            {filteredMessages.map(msg => (
              <tr key={msg.id}>
                <td>
                  <strong>{msg.full_name}</strong>
                  <br />
                  <small>{msg.email}</small>
                  {msg.phone && (
                    <>
                      <br />
                      <small>📞 {msg.phone}</small>
                    </>
                  )}
                </td>
                <td>{msg.subject}</td>
                <td className={styles.messageCell}>{msg.message?.substring(0, 60)}...</td>
                <td>{getStatusBadge(msg.status)}</td>
                <td>{new Date(msg.created_at).toLocaleDateString()}</td>
                <td>
                  <button 
                    onClick={() => {
                      setSelectedMessage(msg);
                      setAdminResponse(msg.admin_response || '');
                      setShowModal(true);
                    }} 
                    className={styles.viewBtn}
                  >
                    <FiEye /> View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Desktop Modal */}
      {showModal && selectedMessage && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Message Details</h3>
              <button onClick={() => setShowModal(false)} className={styles.closeBtn}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.infoGrid}>
                <div className={styles.infoCard}>
                  <h4>Customer Information</h4>
                  <p><strong>Name:</strong> {selectedMessage.full_name}</p>
                  <p><strong>Email:</strong> <a href={`mailto:${selectedMessage.email}`}>{selectedMessage.email}</a></p>
                  <p><strong>Phone:</strong> {selectedMessage.phone || 'Not provided'}</p>
                  <p><strong>Date:</strong> {new Date(selectedMessage.created_at).toLocaleString()}</p>
                </div>
                <div className={styles.infoCard}>
                  <h4>Message Details</h4>
                  <p><strong>Subject:</strong> {selectedMessage.subject}</p>
                  <p><strong>Message:</strong> {selectedMessage.message}</p>
                </div>
              </div>
              <div className={styles.infoCard}>
                <h4>Admin Response</h4>
                <textarea
                  rows="4"
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="Type your response here. This will be sent to the customer via email."
                />
                {selectedMessage.admin_response && (
                  <div className={styles.previousResponse}>
                    <strong>Previous Response:</strong>
                    <p>{selectedMessage.admin_response}</p>
                  </div>
                )}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button 
                onClick={() => updateMessageStatus(selectedMessage.id, 'replied', adminResponse)} 
                className={styles.replyBtn} 
                disabled={updating}
              >
                <FiMessageSquare /> Mark as Replied
              </button>
              <button 
                onClick={() => updateMessageStatus(selectedMessage.id, 'resolved', adminResponse)} 
                className={styles.resolveBtn} 
                disabled={updating}
              >
                <FiCheckCircle /> Mark Resolved
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContactMessages;