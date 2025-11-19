import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import heroIllustration from '../assets/illustrations/hero-illustration.png';
import FloatingMenu from '../components/FloatingMenu';

export default function Home() {
  const navigate = useNavigate();
  const { user, token, setToken } = useAuth();
  const [conflictDescription, setConflictDescription] = React.useState('');
  const [isCreatingSession, setIsCreatingSession] = React.useState(false);

  const handleStartSession = async () => {
    if (!conflictDescription.trim()) {
      alert('Please describe your situation to get started');
      return;
    }

    if (isCreatingSession) return; // Prevent double-clicks

    try {
      setIsCreatingSession(true);

      // Create guest account if not logged in
      if (!token) {
        console.log('Creating guest account...');
        const response = await apiRequest('/auth/create-guest', 'POST');
        console.log('Guest account created:', response);

        // CRITICAL: Write token to localStorage FIRST before navigating
        // This ensures the token is available when PrivateRoute checks
        localStorage.setItem('token', response.access_token);

        // Store conflict description for next page
        sessionStorage.setItem('initialConflictDescription', conflictDescription);

        // Now set in React state (this will trigger useEffect but localStorage is already set)
        setToken(response.access_token);

        // Use window.location to do full page reload with fresh token from localStorage
        window.location.href = '/create-solo-session';
      } else {
        // User is already logged in, store description and navigate
        sessionStorage.setItem('initialConflictDescription', conflictDescription);
        navigate('/create-solo-session');
      }
    } catch (error) {
      console.error('Failed to start session:', error);
      alert('Failed to start session. Please try again.');
      setIsCreatingSession(false);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #EAF7F0 0%, #ffffff 100%)',
      fontFamily: "'Nunito', sans-serif",
      padding: '20px 16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    },
    maxWidth: {
      maxWidth: '700px',
      width: '100%',
    },
    hero: {
      textAlign: 'center',
      marginBottom: '40px',
    },
    greeting: {
      fontSize: '18px',
      color: '#888',
      marginBottom: '12px',
      fontWeight: '600',
    },
    title: {
      fontSize: 'clamp(32px, 6vw, 56px)',
      fontWeight: '700',
      color: '#6750A4',
      marginBottom: '16px',
      lineHeight: '1.2',
    },
    titleAccent: {
      color: '#7DD3C0',
    },
    subtitle: {
      fontSize: 'clamp(16px, 3vw, 20px)',
      color: '#888',
      marginBottom: '24px',
      lineHeight: '1.6',
    },
    heroImage: {
      maxWidth: '200px',
      width: '100%',
      height: 'auto',
      margin: '24px auto',
      display: 'block',
    },
    inputContainer: {
      width: '100%',
      marginBottom: '24px',
    },
    label: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '12px',
      display: 'block',
    },
    textarea: {
      width: '100%',
      backgroundColor: 'white',
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      padding: '16px',
      fontSize: '16px',
      resize: 'vertical',
      minHeight: '150px',
      fontFamily: "'Nunito', sans-serif",
      transition: 'border-color 0.2s',
    },
    button: {
      width: '100%',
      padding: '16px 32px',
      fontSize: '20px',
      fontWeight: '700',
      fontFamily: "'Nunito', sans-serif",
      border: 'none',
      borderRadius: '12px',
      color: 'white',
      backgroundColor: '#7DD3C0',
      cursor: isCreatingSession ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s',
      boxShadow: '0 4px 12px rgba(125, 211, 192, 0.3)',
      opacity: isCreatingSession ? 0.7 : 1,
    },
    footer: {
      textAlign: 'center',
      padding: '32px 16px',
      color: '#888',
      fontSize: '14px',
      marginTop: '40px',
    },
  };

  return (
    <>
      <FloatingMenu />
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
            <p style={styles.subtitle}>
              Let's start by understanding your situation
            </p>
            <img
              src={heroIllustration}
              alt="Meedi - Your AI Mediator"
              style={styles.heroImage}
            />
          </div>

          {/* Conflict Description Input */}
          <div style={styles.inputContainer}>
            <label htmlFor="conflict-description" style={styles.label}>
              Tell me what's going on
            </label>
            <textarea
              id="conflict-description"
              value={conflictDescription}
              onChange={(e) => setConflictDescription(e.target.value)}
              placeholder="Describe your situation in your own words... What's been happening? How does it make you feel?"
              style={styles.textarea}
              onFocus={(e) => e.currentTarget.style.borderColor = '#7DD3C0'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
              disabled={isCreatingSession}
            />
          </div>

          {/* Start Button */}
          <button
            onClick={handleStartSession}
            disabled={isCreatingSession}
            style={styles.button}
            onMouseEnter={(e) => !isCreatingSession && (e.currentTarget.style.transform = 'scale(1.02)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {isCreatingSession ? 'Starting your session...' : 'Start Session'}
          </button>

          {/* Footer */}
          <div style={styles.footer}>
            <p>No interruptions. No judgement. <strong>Just understanding</strong></p>
          </div>
        </div>
      </div>
    </>
  );
}
