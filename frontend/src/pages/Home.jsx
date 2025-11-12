import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import heroIllustration from '../assets/illustrations/hero-illustration.png';
import mediationDuo from '../assets/illustrations/mediation-duo.png';
import soloConversation from '../assets/illustrations/solo-conversation.png';

export default function Home() {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const handleMediationClick = () => {
    if (!token) {
      // Save intent to sessionStorage so we can redirect after login
      sessionStorage.setItem('postLoginRedirect', '/create');
      navigate('/login');
    } else {
      navigate('/create');
    }
  };

  const handleSoloClick = () => {
    if (!token) {
      // Save intent to sessionStorage so we can redirect after login
      sessionStorage.setItem('postLoginRedirect', '/solo/start');
      navigate('/login');
    } else {
      navigate('/solo/start');
    }
  };

  const styles = {
    container: {
      minHeight: 'calc(100vh - 60px)',
      background: 'linear-gradient(180deg, #EAF7F0 0%, #ffffff 100%)',
      fontFamily: "'Nunito', sans-serif",
      padding: '40px 20px',
    },
    maxWidth: {
      maxWidth: '1200px',
      margin: '0 auto',
    },
    hero: {
      textAlign: 'center',
      marginBottom: '60px',
    },
    greeting: {
      fontSize: '24px',
      color: '#888',
      marginBottom: '16px',
      fontWeight: '600',
    },
    title: {
      fontSize: 'clamp(36px, 6vw, 56px)',
      fontWeight: '700',
      color: '#6750A4',
      marginBottom: '16px',
      lineHeight: '1.2',
    },
    titleAccent: {
      color: '#7DD3C0',
    },
    subtitle: {
      fontSize: 'clamp(18px, 3vw, 22px)',
      color: '#888',
      marginBottom: '32px',
      maxWidth: '700px',
      margin: '0 auto 32px',
      lineHeight: '1.6',
    },
    heroImage: {
      maxWidth: '400px',
      width: '100%',
      height: 'auto',
      margin: '0 auto',
      display: 'block',
    },
    cardsContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))',
      gap: '32px',
      marginBottom: '60px',
    },
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: '24px',
      padding: '40px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      border: '3px solid',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      textAlign: 'center',
    },
    cardMediation: {
      borderColor: '#7DD3C0',
    },
    cardSolo: {
      borderColor: '#D3C1FF',
    },
    cardImage: {
      width: '200px',
      height: '200px',
      margin: '0 auto 24px',
      objectFit: 'contain',
    },
    cardTitle: {
      fontSize: '28px',
      fontWeight: '700',
      marginBottom: '16px',
      fontFamily: "'Nunito', sans-serif",
    },
    cardTitleMediation: {
      color: '#1F7A5C',
    },
    cardTitleSolo: {
      color: '#6750A4',
    },
    cardDescription: {
      fontSize: '16px',
      color: '#888',
      marginBottom: '24px',
      lineHeight: '1.6',
    },
    cardButton: {
      width: '100%',
      padding: '16px 32px',
      fontSize: '18px',
      fontWeight: '700',
      fontFamily: "'Nunito', sans-serif",
      border: 'none',
      borderRadius: '12px',
      color: 'white',
      cursor: 'pointer',
      transition: 'all 0.2s',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
    buttonMediation: {
      backgroundColor: '#7DD3C0',
    },
    buttonSolo: {
      backgroundColor: '#D3C1FF',
    },
    quickLinks: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginBottom: '40px',
    },
    quickLink: {
      padding: '20px',
      backgroundColor: '#F5EFFF',
      borderRadius: '12px',
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'all 0.2s',
      border: '2px solid transparent',
      textDecoration: 'none',
      display: 'block',
    },
    quickLinkTitle: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#6750A4',
      marginBottom: '8px',
    },
    quickLinkDesc: {
      fontSize: '14px',
      color: '#888',
    },
    footer: {
      textAlign: 'center',
      padding: '40px 20px',
      color: '#888',
      fontSize: '14px',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.maxWidth}>
        {/* Hero Section */}
        <div style={styles.hero}>
          {user && (
            <div style={styles.greeting}>
              Welcome back, {user.name || user.email?.split('@')[0]}!
            </div>
          )}
          <h1 style={styles.title}>
            Transform Conflict into <span style={styles.titleAccent}>Understanding</span>
          </h1>
          <img
            src={heroIllustration}
            alt="Meedi - Your AI Mediator"
            style={styles.heroImage}
          />
          <p style={styles.subtitle}>
            Choose how you'd like Meedi to help you today
          </p>
        </div>

        {/* Main Action Cards */}
        <div style={styles.cardsContainer}>
          {/* Mediation Card */}
          <div
            style={{ ...styles.card, ...styles.cardMediation }}
            onClick={handleMediationClick}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(125, 211, 192, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
            }}
          >
            <img
              src={mediationDuo}
              alt="Two People in Mediation"
              style={styles.cardImage}
            />
            <h2 style={{ ...styles.cardTitle, ...styles.cardTitleMediation }}>
              Start a Mediation
            </h2>
            <p style={styles.cardDescription}>
              Invite someone to resolve a conflict together with Meedi as your friendly, unbiased mediator.
              Perfect for disputes, disagreements, or difficult conversations.
            </p>
            <button
              style={{ ...styles.cardButton, ...styles.buttonMediation }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#6BC5B8';
                e.stopPropagation();
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#7DD3C0';
                e.stopPropagation();
              }}
            >
              Begin Mediation
            </button>
          </div>

          {/* Solo Session Card */}
          <div
            style={{ ...styles.card, ...styles.cardSolo }}
            onClick={handleSoloClick}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(211, 193, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
            }}
          >
            <img
              src={soloConversation}
              alt="Talk to Meedi Solo"
              style={styles.cardImage}
            />
            <h2 style={{ ...styles.cardTitle, ...styles.cardTitleSolo }}>
              Talk to Meedi Solo
            </h2>
            <p style={styles.cardDescription}>
              Process your thoughts and feelings individually. Get clarity on your perspective
              before addressing the situation with others.
            </p>
            <button
              style={{ ...styles.cardButton, ...styles.buttonSolo }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#C4AEFF';
                e.stopPropagation();
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#D3C1FF';
                e.stopPropagation();
              }}
            >
              Start Solo Session
            </button>
          </div>
        </div>

        {/* Quick Links */}
        <div style={styles.quickLinks}>
          <div
            style={styles.quickLink}
            onClick={() => navigate('/profile')}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#D3C1FF';
              e.currentTarget.style.backgroundColor = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.backgroundColor = '#F5EFFF';
            }}
          >
            <div style={styles.quickLinkTitle}>👤 My Profile</div>
            <div style={styles.quickLinkDesc}>View sessions & settings</div>
          </div>

          <div
            style={styles.quickLink}
            onClick={() => navigate('/subscription')}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#D3C1FF';
              e.currentTarget.style.backgroundColor = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.backgroundColor = '#F5EFFF';
            }}
          >
            <div style={styles.quickLinkTitle}>💎 Pricing</div>
            <div style={styles.quickLinkDesc}>Upgrade your plan</div>
          </div>

          <div
            style={styles.quickLink}
            onClick={() => navigate('/about')}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#D3C1FF';
              e.currentTarget.style.backgroundColor = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.backgroundColor = '#F5EFFF';
            }}
          >
            <div style={styles.quickLinkTitle}>ℹ️ How It Works</div>
            <div style={styles.quickLinkDesc}>Learn about Meedi</div>
          </div>

          <div
            style={styles.quickLink}
            onClick={() => navigate('/faq')}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#D3C1FF';
              e.currentTarget.style.backgroundColor = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.backgroundColor = '#F5EFFF';
            }}
          >
            <div style={styles.quickLinkTitle}>❓ FAQ</div>
            <div style={styles.quickLinkDesc}>Common questions</div>
          </div>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <p>No interruptions. No judgement. <strong>Just understanding</strong></p>
        </div>
      </div>
    </div>
  );
}
