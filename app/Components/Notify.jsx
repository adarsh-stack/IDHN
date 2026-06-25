'use client';

import { useState, useEffect, useRef } from 'react';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const mockLocalBackendNotifications = [
      { id: 1, text: "ALERT: Critical abnormal lab result for Patient UHID-4029.", unread: true, time: "2m ago" },
      { id: 2, text: "INVENTORY: Paracetamol stock is dropping below 10% safety threshold.", unread: true, time: "15m ago" },
      { id: 3, text: "SYSTEM: Automated physical backup successfully exported to Drive D:.", unread: false, time: "1h ago" }
    ];
    setNotifications(mockLocalBackendNotifications);
  }, []);

  const unreadCount = notifications.filter(n => n.unread).length;

  const toggleDropdown = () => setIsOpen(!isOpen);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  return (
    <div style={styles.container} ref={dropdownRef}>
      <button onClick={toggleDropdown} style={styles.bellButton} aria-label="Notifications">
        🔔
        {unreadCount > 0 && (
          <span style={styles.badge}>{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div style={styles.dropdown}>
          <div style={styles.dropdownHeader}>
            <span style={styles.headerTitle}>Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} style={styles.markReadBtn}>
                Mark all as read
              </button>
            )}
          </div>

          <div style={styles.notificationList}>
            {notifications.length === 0 ? (
              <div style={styles.emptyState}>No recent notifications</div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  style={{
                    ...styles.notificationItem,
                    backgroundColor: notif.unread ? '#2d2d2d' : 'transparent'
                  }}
                >
                  <p style={styles.notifText}>{notif.text}</p>
                  <span style={styles.notifTime}>{notif.time}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: 'relative',
    display: 'inline-block',
  },
  bellButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.4rem',
    cursor: 'pointer',
    position: 'relative',
    padding: '4px',
  },
  badge: {
    position: 'absolute',
    top: '-2px',
    right: '-2px',
    backgroundColor: '#ff4d4d',
    color: 'white',
    borderRadius: '50%',
    padding: '2px 6px',
    fontSize: '0.7rem',
    fontWeight: 'bold',
  },
  dropdown: {
    position: 'absolute',
    right: 0,
    top: '40px',
    backgroundColor: '#1f1f1f',
    border: '1px solid #333',
    borderRadius: '8px',
    width: '320px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
    zIndex: 1000,
    overflow: 'hidden',
  },
  dropdownHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    borderBottom: '1px solid #333',
    backgroundColor: '#1a1a1a',
  },
  headerTitle: {
    fontWeight: 'bold',
    fontSize: '0.9rem',
    color: '#fff',
  },
  markReadBtn: {
    background: 'none',
    border: 'none',
    color: '#3b82f6',
    fontSize: '0.75rem',
    cursor: 'pointer',
  },
  notificationList: {
    maxHeight: '280px',
    overflowY: 'auto',
  },
  notificationItem: {
    padding: '12px 14px',
    borderBottom: '1px solid #2a2a2a',
    transition: 'background-color 0.2s',
  },
  notifText: {
    margin: '0 0 4px 0',
    fontSize: '0.85rem',
    color: '#e5e7eb',
    lineHeight: '1.3',
  },
  notifTime: {
    fontSize: '0.7rem',
    color: '#9ca3af',
  },
  emptyState: {
    padding: '20px',
    textAlign: 'center',
    color: '#6b7280',
    fontSize: '0.85rem',
  }
};
