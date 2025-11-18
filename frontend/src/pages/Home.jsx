import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import heroIllustration from '../assets/illustrations/hero-illustration.png';
import mediationDuo from '../assets/illustrations/mediation-duo.png';
import soloConversation from '../assets/illustrations/solo-conversation.png';
import profileIcon from '../assets/icons/Profile_image.png';
import pricingIcon from '../assets/icons/Pricing_icon.png';
import howIcon from '../assets/icons/How_icon.png';
import faqIcon from '../assets/icons/FAQ_icon.png';

export default function Home() {
  const navigate = useNavigate();
  const { user, token, login } = useAuth();
  const [isCreatingGuest, setIsCreatingGuest] = React.useState(false);
  const [isDesktop, setIsDesktop] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth >= 768 : false
  );

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const createGuestAndNavigate = async (destination) => {
    if (isCreatingGuest) return; // Prevent double-clicks

    try {
      setIsCreatingGuest(true);
      console.log('Creating guest account...');

      // Call the create-guest endpoint
      const response = await apiRequest('/auth/create-guest', 'POST');
      console.log('Guest account created:', response);

      // Store the guest token using the AuthContext login function
      login(response.access_token);

      // Navigate to destination
      navigate(destination);
    } catch (error) {
      console.error('Failed to create guest account:', error);
      alert('Failed to start session. Please try again.');
      setIsCreatingGuest(false);
    }
  };

  const handleMediationClick = () => {
    if (!token) {
      // Auto-create guest account and navigate
      createGuestAndNavigate('/create');
    } else {
      navigate('/create');
    }
  };

  const handleSoloClick = () => {
    if (!token) {
      // Auto-create guest account and navigate
      createGuestAndNavigate('/solo/start');
    } else {
      navigate('/solo/start');
    }
  };

  const styles = {
    container: {
      minHeight: 'calc(100vh - 60px)',
      background: 'linear-gradient(180deg, #EAF7F0 0%, #ffffff 100%)',
      fontFamily: "'Nunito', sans-serif",
      padding: '20px 16px',
      '@media (min-width: 768px)': {
        padding: '40px 20px',
      },
    },
    maxWidth: {
      maxWidth: '1200px',
      margin: '0 auto',
    },
    hero: {
      textAlign: 'center',
      marginBottom: '32px',
      '@media (min-width: 768px)': {
        marginBottom: '60px',
      },
    },
    greeting: {
      fontSize: '18px',
      color: '#888',
      marginBottom: '12px',
      fontWeight: '600',
      '@media (min-width: 768px)': {
        fontSize: '24px',
        marginBottom: '16px',
      },
    },
    title: {
      fontSize: 'clamp(28px, 6vw, 56px)',
      fontWeight: '700',
      color: '#6750A4',
      marginBottom: '16px',
      lineHeight: '1.2',
    },
    titleAccent: {
      color: '#7DD3C0',
    },
    subtitle: {
      fontSize: 'clamp(16px, 3vw, 22px)',
      color: '#888',
      marginBottom: '24px',
      maxWidth: '700px',
      margin: '0 auto 24px',
      lineHeight: '1.6',
      '@media (min-width: 768px)': {
        marginBottom: '32px',
      },
    },
    heroImage: {
      maxWidth: '280px',
      width: '100%',
      height: 'auto',
      margin: '0 auto',
      display: 'block',
      '@media (min-width: 768px)': {
        maxWidth: '400px',
      },
    },
    cardsContainer: {
      display: 'flex',
      flexDirection: isDesktop ? 'row' : 'column',
      justifyContent: isDesktop ? 'center' : 'flex-start',
      gap: isDesktop ? '32px' : '24px',
      marginBottom: isDesktop ? '60px' : '40px',
      maxWidth: isDesktop ? '1100px' : '100%',
      margin: isDesktop ? '0 auto 60px auto' : '0 0 40px 0',
    },
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: isDesktop ? '24px' : '16px',
      padding: isDesktop ? '32px' : '24px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      border: '3px solid',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: isDesktop ? '24px' : '20px',
      maxWidth: isDesktop ? '480px' : '100%',
      flex: isDesktop ? '1' : 'none',
    },
    cardMediation: {
      borderColor: '#7DD3C0',
    },
    cardSolo: {
      borderColor: '#D3C1FF',
    },
    cardImage: {
      width: '120px',
      height: '120px',
      flexShrink: 0,
      objectFit: 'contain',
      '@media (min-width: 768px)': {
        width: '180px',
        height: '180px',
      },
    },
    cardContent: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      justifyContent: 'space-between',
      width: '100%',
    },
    cardTitle: {
      fontSize: '22px',
      fontWeight: '700',
      marginBottom: '12px',
      fontFamily: "'Nunito', sans-serif",
      '@media (min-width: 768px)': {
        fontSize: '28px',
        marginBottom: '16px',
      },
    },
    cardTitleMediation: {
      color: '#1F7A5C',
    },
    cardTitleSolo: {
      color: '#6750A4',
    },
    cardDescription: {
      fontSize: '14px',
      color: '#888',
      marginBottom: '20px',
      lineHeight: '1.6',
      '@media (min-width: 768px)': {
        fontSize: '16px',
        marginBottom: '24px',
      },
    },
    cardButton: {
      width: '100%',
      padding: '14px 24px',
      fontSize: '16px',
      fontWeight: '700',
      fontFamily: "'Nunito', sans-serif",
      border: 'none',
      borderRadius: '12px',
      color: 'white',
      cursor: 'pointer',
      transition: 'all 0.2s',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      '@media (min-width: 768px)': {
        padding: '16px 32px',
        fontSize: '18px',
      },
    },
    buttonMediation: {
      backgroundColor: '#7DD3C0',
    },
    buttonSolo: {
      backgroundColor: '#D3C1FF',
    },
    quickLinks: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '16px',
      marginBottom: '32px',
      maxWidth: '600px',
      margin: '0 auto 32px auto',
      '@media (min-width: 768px)': {
        gap: '20px',
        marginBottom: '40px',
        margin: '0 auto 40px auto',
      },
    },
    quickLink: {
      padding: '12px 16px',
      backgroundColor: 'rgba(125, 211, 192, 0.1)',
      borderRadius: '12px',
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'all 0.2s',
      border: '1px solid #7DD3C0',
      textDecoration: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      '@media (min-width: 768px)': {
        padding: '16px 20px',
      },
    },
    quickLinkTitle: {
      fontSize: '14px',
      fontWeight: '700',
      color: '#6750A4',
      marginBottom: '0',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      whiteSpace: 'nowrap',
      '@media (min-width: 768px)': {
        fontSize: '16px',
        gap: '10px',
      },
    },
    quickLinkIcon: {
      width: '32px',
      height: '32px',
      objectFit: 'contain',
      flexShrink: 0,
      '@media (min-width: 768px)': {
        width: '40px',
        height: '40px',
      },
    },
    quickLinkDesc: {
      fontSize: '14px',
      color: '#888',
    },
    footer: {
      textAlign: 'center',
      padding: '32px 16px',
      color: '#888',
      fontSize: '13px',
      '@media (min-width: 768px)': {
        padding: '40px 20px',
        fontSize: '14px',
      },
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
            <div style={styles.cardContent}>
              <div>
                <h2 style={{ ...styles.cardTitle, ...styles.cardTitleMediation }}>
                  Start a Mediation
                </h2>
                <p style={styles.cardDescription}>
                  Invite someone to resolve a conflict together with Meedi as your friendly, unbiased mediator.
                  Perfect for disputes, disagreements, or difficult conversations.
                </p>
              </div>
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
            <div style={styles.cardContent}>
              <div>
                <h2 style={{ ...styles.cardTitle, ...styles.cardTitleSolo }}>
                  Talk to Meedi Solo
                </h2>
                <p style={styles.cardDescription}>
                  Process your thoughts and feelings individually. Get clarity on your perspective
                  before addressing the situation with others.
                </p>
              </div>
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
        </div>

        {/* Quick Links */}
        <div style={styles.quickLinks}>
          <div
            style={styles.quickLink}
            onClick={() => navigate('/profile')}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#7DD3C0';
              e.currentTarget.style.backgroundColor = 'rgba(125, 211, 192, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#7DD3C0';
              e.currentTarget.style.backgroundColor = 'rgba(125, 211, 192, 0.1)';
            }}
          >
            <div style={styles.quickLinkTitle}>
              <img src={profileIcon} alt="" style={styles.quickLinkIcon} />
              My Profile
            </div>
          </div>

          <div
            style={styles.quickLink}
            onClick={() => navigate('/subscription')}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#7DD3C0';
              e.currentTarget.style.backgroundColor = 'rgba(125, 211, 192, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#7DD3C0';
              e.currentTarget.style.backgroundColor = 'rgba(125, 211, 192, 0.1)';
            }}
          >
            <div style={styles.quickLinkTitle}>
              <img src={pricingIcon} alt="" style={styles.quickLinkIcon} />
              Pricing
            </div>
          </div>

          <div
            style={styles.quickLink}
            onClick={() => navigate('/about')}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#7DD3C0';
              e.currentTarget.style.backgroundColor = 'rgba(125, 211, 192, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#7DD3C0';
              e.currentTarget.style.backgroundColor = 'rgba(125, 211, 192, 0.1)';
            }}
          >
            <div style={styles.quickLinkTitle}>
              <img src={howIcon} alt="" style={styles.quickLinkIcon} />
              How It Works
            </div>
          </div>

          <div
            style={styles.quickLink}
            onClick={() => navigate('/faq')}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#7DD3C0';
              e.currentTarget.style.backgroundColor = 'rgba(125, 211, 192, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#7DD3C0';
              e.currentTarget.style.backgroundColor = 'rgba(125, 211, 192, 0.1)';
            }}
          >
            <div style={styles.quickLinkTitle}>
              <img src={faqIcon} alt="" style={styles.quickLinkIcon} />
              FAQ
            </div>
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
