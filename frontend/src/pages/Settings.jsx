import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FloatingMenu from '../components/FloatingMenu';
import { Logo } from '../components/ui';

/**
 * Settings Page
 *
 * Features:
 * - Account information display
 * - Telegram connection/disconnection
 * - Privacy settings
 * - Subscription management
 */
export default function Settings() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [telegramInfo, setTelegramInfo] = useState(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // SSR-safe check
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Check if running on localhost (for development preview)
  const isLocalhost = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // Mock user for localhost preview
  const mockUser = {
    name: 'Demo User',
    email: 'demo@example.com',
    created_at: new Date().toISOString(),
    subscription: { tier: 'FREE' }
  };

  const displayUser = isLocalhost && !user ? mockUser : user;

  useEffect(() => {
    // Skip auth check on localhost for preview
    if (!displayUser && !isLocalhost) {
      navigate('/login');
      return;
    }

    // Check if Telegram is connected
    if (displayUser && displayUser.telegram_id) {
      setTelegramConnected(true);
      setTelegramInfo({
        telegram_id: displayUser.telegram_id,
        telegram_username: displayUser.telegram_username,
        connected_at: displayUser.telegram_connected_at
      });
    }
  }, [displayUser, navigate, isLocalhost]);

  const handleConnectTelegram = () => {
    setShowPrivacyModal(true);
  };

  const handleAcceptPrivacy = async () => {
    setShowPrivacyModal(false);
    setLoading(true);

    try {
      // TODO: Implement phone verification flow
      // For now, just show placeholder
      alert('Telegram connection flow will be implemented once API credentials are available');
    } catch (error) {
      console.error('Error connecting Telegram:', error);
      alert('Failed to connect Telegram. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectTelegram = async () => {
    if (!confirm('Are you sure you want to disconnect Telegram? This will remove access to your message history.')) {
      return;
    }

    setLoading(true);

    try {
      // TODO: Implement disconnect endpoint
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/telegram/disconnect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setTelegramConnected(false);
        setTelegramInfo(null);
        alert('Telegram disconnected successfully');
      } else {
        throw new Error('Failed to disconnect');
      }
    } catch (error) {
      console.error('Error disconnecting Telegram:', error);
      alert('Failed to disconnect Telegram. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!displayUser) return null;

  return (
    <>
      <style>{`
        @media (max-width: 1024px) {
          .settings-three-column-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 768px) {
          .settings-three-column-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <div style={styles.container}>
        <FloatingMenu />

        {/* Header */}
        <div style={styles.header}>
          <Logo size={isMobile ? 120 : 160} />
        </div>

        {/* Main Content */}
        <div style={styles.content}>
          <h1 style={styles.title}>Settings</h1>

          {/* Three Column Grid */}
          <div className="settings-three-column-grid" style={styles.threeColumnGrid}>
            {/* Account Section */}
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Account Information</h2>
              <div style={styles.card}>
              <div style={styles.infoRow}>
                <span style={styles.label}>Name:</span>
                <span style={styles.value}>{displayUser.name || 'Not set'}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.label}>Email:</span>
                <span style={styles.value}>{displayUser.email}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.label}>Member Since:</span>
                <span style={styles.value}>
                  {new Date(displayUser.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Subscription Section */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Subscription</h2>
            <div style={styles.card}>
              <div style={styles.infoRow}>
                <span style={styles.label}>Current Plan:</span>
                <span style={styles.value}>{displayUser.subscription?.tier || 'FREE'}</span>
              </div>
              <button
                onClick={() => navigate('/subscription')}
                style={styles.upgradeButton}
              >
                Manage Subscription
              </button>
            </div>
          </div>

          {/* Telegram Section */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <img
                src="/assets/logos/telegram-logo.svg"
                alt="Telegram"
                style={styles.telegramLogo}
              />
              Telegram Integration
            </h2>
          <div style={styles.card}>
            <p style={styles.description}>
              Connect your Telegram account to enable context-aware coaching based on your actual conversations.
            </p>

            {!telegramConnected ? (
              <>
                <div style={styles.benefitsList}>
                  <div style={styles.benefit}>
                    <span style={styles.benefitIcon}>✓</span>
                    <span>Access your Telegram contacts</span>
                  </div>
                  <div style={styles.benefit}>
                    <span style={styles.benefitIcon}>✓</span>
                    <span>Analyze message history for context</span>
                  </div>
                  <div style={styles.benefit}>
                    <span style={styles.benefitIcon}>✓</span>
                    <span>Get personalized mediation advice</span>
                  </div>
                  <div style={styles.benefit}>
                    <span style={styles.benefitIcon}>🔒</span>
                    <span>Your data stays private and secure</span>
                  </div>
                </div>

                <button
                  onClick={handleConnectTelegram}
                  disabled={loading}
                  style={{
                    ...styles.connectButton,
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Connecting...' : 'Connect Telegram'}
                </button>
              </>
            ) : (
              <div style={styles.connectedInfo}>
                <div style={styles.connectedHeader}>
                  <span style={styles.connectedBadge}>✓ Connected</span>
                </div>

                <div style={styles.telegramDetails}>
                  {telegramInfo.telegram_username && (
                    <div style={styles.infoRow}>
                      <span style={styles.label}>Username:</span>
                      <span style={styles.value}>@{telegramInfo.telegram_username}</span>
                    </div>
                  )}
                  <div style={styles.infoRow}>
                    <span style={styles.label}>Connected:</span>
                    <span style={styles.value}>
                      {new Date(telegramInfo.connected_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleDisconnectTelegram}
                  disabled={loading}
                  style={{
                    ...styles.disconnectButton,
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Disconnecting...' : 'Disconnect Telegram'}
                </button>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Consent Modal */}
      {showPrivacyModal && (
        <div style={styles.modalOverlay} onClick={() => setShowPrivacyModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Privacy & Permissions</h3>

            <div style={styles.modalBody}>
              <p style={styles.modalText}>
                To provide context-aware mediation coaching, Meedi8 needs permission to:
              </p>

              <ul style={styles.permissionsList}>
                <li>Read your Telegram contact list</li>
                <li>Access message history with selected contacts</li>
                <li>Analyze conversation context for coaching</li>
              </ul>

              <div style={styles.privacyPromises}>
                <p style={styles.privacyTitle}>Your Privacy is Protected:</p>
                <ul style={styles.promisesList}>
                  <li>✓ Messages are analyzed only with your explicit consent</li>
                  <li>✓ Data is encrypted and never sold to third parties</li>
                  <li>✓ You can disconnect at any time</li>
                  <li>✓ Only you and your selected mediator see your messages</li>
                </ul>
              </div>

              <p style={styles.modalFooter}>
                By connecting, you agree to our{' '}
                <a href="/privacy" target="_blank" style={styles.link}>Privacy Policy</a>
                {' '}and{' '}
                <a href="/terms" target="_blank" style={styles.link}>Terms of Service</a>.
              </p>
            </div>

            <div style={styles.modalActions}>
              <button
                onClick={() => setShowPrivacyModal(false)}
                style={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={handleAcceptPrivacy}
                style={styles.acceptButton}
              >
                Accept & Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #EAF7F0 0%, #ffffff 100%)',
    fontFamily: "'Nunito', sans-serif",
    paddingBottom: '60px',
  },
  header: {
    padding: '20px 30px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
  },
  title: {
    fontSize: '36px',
    fontWeight: '800',
    color: '#7DD3C0',
    marginBottom: '40px',
    textAlign: 'center',
    fontFamily: "'Nunito', sans-serif",
  },
  section: {
    marginBottom: '30px',
  },
  threeColumnGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
    marginBottom: '30px',
  },
  sectionTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#7DD3C0',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontFamily: "'Nunito', sans-serif",
  },
  telegramLogo: {
    width: '28px',
    height: '28px',
    objectFit: 'contain',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    fontFamily: "'Nunito', sans-serif",
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #e5e7eb',
  },
  label: {
    fontWeight: '700',
    color: '#6b7280',
    fontSize: '15px',
    fontFamily: "'Nunito', sans-serif",
  },
  value: {
    color: '#6b7280',
    fontSize: '15px',
    fontWeight: '600',
    fontFamily: "'Nunito', sans-serif",
  },
  description: {
    color: '#6b7280',
    fontSize: '15px',
    lineHeight: '1.6',
    marginBottom: '20px',
    fontFamily: "'Nunito', sans-serif",
  },
  benefitsList: {
    marginBottom: '24px',
  },
  benefit: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 0',
    fontSize: '15px',
    color: '#6b7280',
    fontFamily: "'Nunito', sans-serif",
  },
  benefitIcon: {
    color: '#7DD3C0',
    fontWeight: '700',
    fontSize: '18px',
  },
  connectButton: {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    fontWeight: '700',
    fontFamily: "'Nunito', sans-serif",
    border: 'none',
    borderRadius: '12px',
    backgroundColor: '#7DD3C0',
    color: 'white',
    transition: 'all 0.2s',
    cursor: 'pointer',
  },
  connectedInfo: {
    marginTop: '16px',
  },
  connectedHeader: {
    marginBottom: '16px',
  },
  connectedBadge: {
    display: 'inline-block',
    padding: '6px 16px',
    borderRadius: '20px',
    backgroundColor: '#D1FAE5',
    color: '#059669',
    fontSize: '14px',
    fontWeight: '600',
  },
  telegramDetails: {
    marginBottom: '20px',
  },
  disconnectButton: {
    width: '100%',
    padding: '12px',
    fontSize: '15px',
    fontWeight: '700',
    fontFamily: "'Nunito', sans-serif",
    border: '2px solid #ef4444',
    borderRadius: '12px',
    backgroundColor: 'white',
    color: '#ef4444',
    transition: 'all 0.2s',
    cursor: 'pointer',
  },
  upgradeButton: {
    marginTop: '16px',
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    fontWeight: '700',
    fontFamily: "'Nunito', sans-serif",
    border: 'none',
    borderRadius: '12px',
    backgroundColor: '#CCB2FF',
    color: 'white',
    transition: 'all 0.2s',
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '16px',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    padding: '32px',
  },
  modalTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '20px',
  },
  modalBody: {
    marginBottom: '24px',
  },
  modalText: {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: '1.6',
    marginBottom: '16px',
  },
  permissionsList: {
    listStyle: 'disc',
    paddingLeft: '24px',
    marginBottom: '20px',
    fontSize: '14px',
    color: '#1f2937',
    lineHeight: '1.8',
  },
  privacyPromises: {
    backgroundColor: '#EAF7F0',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '20px',
  },
  privacyTitle: {
    fontWeight: '600',
    color: '#1f2937',
    fontSize: '14px',
    marginBottom: '12px',
  },
  promisesList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    fontSize: '13px',
    color: '#1f2937',
    lineHeight: '1.8',
  },
  modalFooter: {
    fontSize: '12px',
    color: '#9ca3af',
    lineHeight: '1.6',
  },
  link: {
    color: '#7DD3C0',
    textDecoration: 'underline',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    fontFamily: "'Nunito', sans-serif",
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: 'white',
    color: '#6b7280',
    cursor: 'pointer',
  },
  acceptButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    fontFamily: "'Nunito', sans-serif",
    border: 'none',
    borderRadius: '8px',
    backgroundColor: '#7DD3C0',
    color: 'white',
    cursor: 'pointer',
  },
};
