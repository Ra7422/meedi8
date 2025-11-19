import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function GuestConversionModal({ isOpen, onClose }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSignup = () => {
    // Navigate to login page which has social login options
    navigate('/login');
  };

  const handleContinueAsGuest = () => {
    onClose();
    // Navigate to home
    navigate('/');
  };

  const styles = {
    backdrop: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px',
      animation: 'fadeIn 0.2s ease'
    },
    modal: {
      backgroundColor: 'white',
      borderRadius: '16px',
      maxWidth: '500px',
      width: '100%',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
      animation: 'slideUp 0.3s ease',
      fontFamily: "'Nunito', sans-serif"
    },
    header: {
      padding: '32px 32px 24px',
      textAlign: 'center',
      borderBottom: '1px solid #e5e7eb'
    },
    icon: {
      fontSize: '48px',
      marginBottom: '16px'
    },
    title: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#6750A4',
      marginBottom: '12px',
      margin: 0
    },
    subtitle: {
      fontSize: '16px',
      color: '#666',
      lineHeight: '1.5',
      margin: 0
    },
    body: {
      padding: '24px 32px'
    },
    benefits: {
      listStyle: 'none',
      padding: 0,
      margin: 0
    },
    benefit: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      marginBottom: '16px',
      fontSize: '15px',
      color: '#374151'
    },
    benefitIcon: {
      fontSize: '20px',
      flexShrink: 0,
      marginTop: '2px'
    },
    benefitText: {
      lineHeight: '1.6'
    },
    footer: {
      padding: '24px 32px 32px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    },
    primaryButton: {
      width: '100%',
      padding: '14px 24px',
      fontSize: '16px',
      fontWeight: '700',
      fontFamily: "'Nunito', sans-serif",
      border: 'none',
      borderRadius: '12px',
      color: 'white',
      backgroundColor: '#7DD3C0',
      cursor: 'pointer',
      transition: 'all 0.2s',
      boxShadow: '0 4px 12px rgba(125, 211, 192, 0.3)'
    },
    secondaryButton: {
      width: '100%',
      padding: '14px 24px',
      fontSize: '15px',
      fontWeight: '600',
      fontFamily: "'Nunito', sans-serif",
      border: 'none',
      borderRadius: '12px',
      color: '#666',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      transition: 'all 0.2s'
    }
  };

  return (
    <>
      <div style={styles.backdrop} onClick={handleContinueAsGuest}>
        <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.icon}>💾</div>
            <h2 style={styles.title}>Save Your Progress</h2>
            <p style={styles.subtitle}>
              Don't lose this valuable insight
            </p>
          </div>

          {/* Body */}
          <div style={styles.body}>
            <ul style={styles.benefits}>
              <li style={styles.benefit}>
                <span style={styles.benefitIcon}>✅</span>
                <span style={styles.benefitText}>
                  <strong>Keep your chat history</strong> - Access your conversations anytime
                </span>
              </li>
              <li style={styles.benefit}>
                <span style={styles.benefitIcon}>📊</span>
                <span style={styles.benefitText}>
                  <strong>Track your progress</strong> - See how conflicts are resolved over time
                </span>
              </li>
              <li style={styles.benefit}>
                <span style={styles.benefitIcon}>🔄</span>
                <span style={styles.benefitText}>
                  <strong>Continue where you left off</strong> - No need to start over each time
                </span>
              </li>
              <li style={styles.benefit}>
                <span style={styles.benefitIcon}>🎯</span>
                <span style={styles.benefitText}>
                  <strong>Unlock more rooms</strong> - Create multiple mediation sessions
                </span>
              </li>
            </ul>
          </div>

          {/* Footer */}
          <div style={styles.footer}>
            <button
              onClick={handleSignup}
              style={styles.primaryButton}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(125, 211, 192, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(125, 211, 192, 0.3)';
              }}
            >
              Save My Session
            </button>
            <button
              onClick={handleContinueAsGuest}
              style={styles.secondaryButton}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#374151';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#666';
              }}
            >
              Continue as guest
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
