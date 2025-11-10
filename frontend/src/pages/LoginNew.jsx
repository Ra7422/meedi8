import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Logo } from "../components/ui";
import { GoogleLogin } from '@react-oauth/google';
import FacebookLogin from '@greatsumini/react-facebook-login';
// import TelegramLoginButton from 'react-telegram-login'; // Temporarily disabled - React version conflict

/**
 * Login Page - Exact Figma Match
 *
 * Features:
 * - Logo in top-left
 * - Hamburger menu in top-right
 * - Curved wave decorations
 * - Nunito font (light weight)
 * - Large mascot with speech bubble
 * - Placeholder text inside inputs
 */
export default function LoginNew() {
  const { login, googleLogin, facebookLogin, telegramLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);

      // Check if user was trying to join via invite link
      const pendingInvite = sessionStorage.getItem('pendingInvite');
      if (pendingInvite) {
        sessionStorage.removeItem('pendingInvite');
        navigate(`/join/${pendingInvite}`);
      } else {
        navigate('/rooms');
      }
    } catch (e) {
      setError(e.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSuccess(credentialResponse) {
    setError("");
    setLoading(true);
    try {
      await googleLogin(credentialResponse.credential);

      // Check if user was trying to join via invite link
      const pendingInvite = sessionStorage.getItem('pendingInvite');
      if (pendingInvite) {
        sessionStorage.removeItem('pendingInvite');
        navigate(`/join/${pendingInvite}`);
      } else {
        navigate('/rooms');
      }
    } catch (e) {
      setError(e.message || "Google login failed.");
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleError() {
    setError("Google login failed. Please try again.");
  }

  async function handleFacebookSuccess(response) {
    setError("");
    setLoading(true);
    try {
      await facebookLogin(response.accessToken, response.userID);

      // Check if user was trying to join via invite link
      const pendingInvite = sessionStorage.getItem('pendingInvite');
      if (pendingInvite) {
        sessionStorage.removeItem('pendingInvite');
        navigate(`/join/${pendingInvite}`);
      } else {
        navigate('/rooms');
      }
    } catch (e) {
      setError(e.message || "Facebook login failed.");
    } finally {
      setLoading(false);
    }
  }

  function handleFacebookError(error) {
    setError("Facebook login failed. Please try again.");
  }

  async function handleTelegramResponse(response) {
    setError("");
    setLoading(true);
    try {
      await telegramLogin(response);

      // Check if user was trying to join via invite link
      const pendingInvite = sessionStorage.getItem('pendingInvite');
      if (pendingInvite) {
        sessionStorage.removeItem('pendingInvite');
        navigate(`/join/${pendingInvite}`);
      } else {
        navigate('/rooms');
      }
    } catch (e) {
      setError(e.message || "Telegram login failed.");
    } finally {
      setLoading(false);
    }
  }

  // Check if mobile - safe for SSR
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Environment variables for OAuth
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID;
  const TELEGRAM_BOT_NAME = import.meta.env.VITE_TELEGRAM_BOT_NAME;

  // Check if OAuth is properly configured (must have valid credentials AND be in browser context)
  const hasGoogleOAuth = typeof window !== 'undefined' && GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID.length > 20 && !GOOGLE_CLIENT_ID.includes('YOUR_');
  const hasFacebookOAuth = typeof window !== 'undefined' && FACEBOOK_APP_ID && FACEBOOK_APP_ID.length > 10 && !FACEBOOK_APP_ID.includes('YOUR_');
  const hasTelegramOAuth = typeof window !== 'undefined' && TELEGRAM_BOT_NAME && !TELEGRAM_BOT_NAME.includes('YOUR_');

  return (
    <div style={styles.container}>
      {/* Ellipse for depth at top */}
      <div style={styles.topEllipse} />

      {/* Header with Logo and Menu */}
      <div style={styles.header}>
        <div style={styles.logoContainer}>
          <Logo size={isMobile ? 180 : 240} />
        </div>
        <button style={styles.menuButton} onClick={() => setMenuOpen(!menuOpen)}>
          <div style={styles.menuIcon}>
            <div style={styles.menuBar}></div>
            <div style={styles.menuBar}></div>
            <div style={styles.menuBar}></div>
          </div>
        </button>
      </div>

      {/* Dropdown menu */}
      {menuOpen && (
        <div style={styles.menuDropdown}>
          <a href="#how-it-works" style={styles.menuItem}>How It Works</a>
          <a href="#pricing" style={styles.menuItem}>Pricing</a>
          <a href="#faq" style={styles.menuItem}>FAQ</a>
          <a href="#about" style={styles.menuItem}>About Us</a>
        </div>
      )}

      {/* Main content */}
      <div style={styles.content}>
        {/* Headline */}
        <div style={styles.headline}>
          <h1 style={styles.headlineText}>
            <span style={{ fontWeight: '700' }}>Mediation</span><br />
            made calm,<br />
            clear, and fair.
          </h1>
        </div>

        {/* Login form - no white card, just inputs */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            style={styles.input}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            style={styles.input}
          />

          <div style={styles.forgotPassword}>
            <button
              type="button"
              onClick={() => alert('Password reset coming soon')}
              style={styles.forgotButton}
            >
              Forgot Password?
            </button>
          </div>

          {error && (
            <div style={styles.errorBox}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.loginButton,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>

          {/* Divider */}
          <div style={styles.divider}>
            <div style={styles.dividerLine} />
            <span style={styles.dividerText}>Or continue with</span>
            <div style={styles.dividerLine} />
          </div>

          {/* Social Login Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
            {/* Row 1: Google and Facebook */}
            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              {hasGoogleOAuth ? (
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    text="signin_with"
                    shape="rectangular"
                    logo_alignment="left"
                    width="100%"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => alert('Google sign-in coming soon')}
                  style={styles.socialButton}
                >
                  <svg style={styles.socialIcon} viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </button>
              )}

              {hasFacebookOAuth ? (
                <FacebookLogin
                  appId={FACEBOOK_APP_ID}
                  onSuccess={handleFacebookSuccess}
                  onFail={handleFacebookError}
                  onProfileSuccess={(response) => handleFacebookSuccess(response)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 16px',
                    fontSize: '16px',
                    fontWeight: '400',
                    fontFamily: "'Nunito', sans-serif",
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    backgroundColor: 'white',
                    color: '#1f2937',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </FacebookLogin>
              ) : (
                <button
                  type="button"
                  onClick={() => alert('Facebook sign-in coming soon')}
                  style={styles.socialButton}
                >
                  <svg style={styles.socialIcon} viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </button>
              )}
            </div>

            {/* Row 2: X/Twitter and Telegram */}
            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <button
                type="button"
                onClick={() => alert('X/Twitter OAuth coming soon - requires developer account setup')}
                style={{
                  ...styles.socialButton,
                  flex: 1
                }}
              >
                <svg style={styles.socialIcon} viewBox="0 0 24 24" fill="#000000">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                X
              </button>

              {/* Temporarily disabled - React version conflict
              {hasTelegramOAuth ? (
                <div style={{ flex: 1 }}>
                  <TelegramLoginButton
                    botName={TELEGRAM_BOT_NAME}
                    dataOnauth={handleTelegramResponse}
                    buttonSize="large"
                    cornerRadius={12}
                    requestAccess="write"
                  />
                </div>
              ) : (*/}
              {false ? null : (
                <button
                  type="button"
                  onClick={() => alert('Telegram sign-in coming soon')}
                  style={{
                    ...styles.socialButton,
                    flex: 1
                  }}
                >
                  <svg style={styles.socialIcon} viewBox="0 0 24 24" fill="#0088cc">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.14.121.099.155.232.171.325.016.093.036.305.02.47z"/>
                  </svg>
                  Telegram
                </button>
              )}
            </div>
          </div>
        </form>

      </div>

      {/* Mascot with speech bubble - bottom right */}
      <div style={styles.mascotContainer} onClick={() => navigate('/signup')}>
        <img
          src="/assets/illustrations/Login_meedi.svg"
          alt="Character with speech bubble - Click to sign up"
          style={styles.mascot}
        />
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    position: 'relative',
    background: 'linear-gradient(180deg, #EAF7F0 0%, #ffffff 100%)',
    overflow: 'hidden',
    fontFamily: "'Nunito', sans-serif",
  },
  topEllipse: {
    position: 'absolute',
    top: '-100px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '120%',
    height: '200px',
    borderRadius: '50%',
    background: 'radial-gradient(ellipse at center, rgba(76, 211, 194, 0.08) 0%, transparent 70%)',
    zIndex: 0,
  },
  bottomEllipse: {
    position: 'absolute',
    bottom: '-50px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '120%',
    height: '180px',
    borderRadius: '50%',
    background: 'radial-gradient(ellipse at center, rgba(76, 211, 194, 0.06) 0%, transparent 70%)',
    zIndex: 0,
  },
  header: {
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 30px',
  },
  logoContainer: {
    // Logo in top-left
  },
  menuButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '10px',
  },
  menuIcon: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  menuBar: {
    width: '25px',
    height: '3px',
    backgroundColor: '#4cd3c2',
    borderRadius: '2px',
  },
  menuDropdown: {
    position: 'absolute',
    top: '80px',
    right: '30px',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    padding: '10px 0',
    zIndex: 100,
    minWidth: '180px',
  },
  menuItem: {
    display: 'block',
    padding: '12px 20px',
    color: '#1f2937',
    textDecoration: 'none',
    fontSize: '15px',
    fontWeight: '400',
    transition: 'background 0.2s',
  },
  content: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px 20px 40px',
    maxWidth: '364px',
    margin: '0 auto',
    minHeight: 'calc(100vh - 120px)',
    justifyContent: 'flex-start',
    paddingTop: '0px',
  },
  headline: {
    textAlign: 'center',
    marginBottom: '24px',
    marginTop: '0',
  },
  headlineText: {
    fontSize: 'clamp(28px, 5.6vw, 39px)',
    fontWeight: '300',
    color: '#7DD3C0',
    lineHeight: '1.2',
    margin: 0,
  },
  form: {
    width: '100%',
    maxWidth: '364px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '40px',
  },
  input: {
    width: '100%',
    padding: '16px 24px',
    fontSize: '16px',
    fontWeight: '300',
    fontFamily: "'Nunito', sans-serif",
    border: 'none',
    borderRadius: '12px',
    backgroundColor: 'white',
    color: '#1f2937',
    outline: 'none',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  forgotPassword: {
    textAlign: 'right',
    marginTop: '-8px',
  },
  forgotButton: {
    background: 'none',
    border: 'none',
    color: '#9CA3AF',
    fontSize: '14px',
    fontWeight: '300',
    cursor: 'pointer',
    fontFamily: "'Nunito', sans-serif",
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    color: '#ef4444',
    padding: '12px 20px',
    borderRadius: '12px',
    fontSize: '14px',
    textAlign: 'center',
  },
  loginButton: {
    width: '100%',
    padding: '16px',
    fontSize: '20px',
    fontWeight: '400',
    fontFamily: "'Nunito', sans-serif",
    border: 'none',
    borderRadius: '12px',
    backgroundColor: '#7DD3C0',
    color: 'white',
    marginTop: '8px',
    transition: 'all 0.2s',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    textAlign: 'center',
    margin: '24px 0',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    padding: '0 16px',
    color: '#9CA3AF',
    fontSize: '14px',
    fontWeight: '300',
    fontFamily: "'Nunito', sans-serif",
    whiteSpace: 'nowrap',
  },
  socialButtons: {
    display: 'flex',
    gap: '12px',
    width: '100%',
  },
  socialButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 16px',
    fontSize: '16px',
    fontWeight: '400',
    fontFamily: "'Nunito', sans-serif",
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    backgroundColor: 'white',
    color: '#1f2937',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  socialIcon: {
    width: '20px',
    height: '20px',
  },
  mascotContainer: {
    position: 'fixed',
    bottom: '0px',
    right: '0px',
    zIndex: 10,
    cursor: 'pointer',
  },
  mascot: {
    width: 'auto',
    height: 'auto',
    maxWidth: '300px',
  },
  mobileSignup: {
    position: 'relative',
    zIndex: 1,
    marginTop: '32px',
    textAlign: 'center',
  },
  mobileSignupBox: {
    backgroundColor: '#6750A4',
    padding: '20px 32px',
    borderRadius: '20px',
    display: 'inline-block',
  },
  mobileSignupLink: {
    background: 'none',
    border: 'none',
    color: '#FFFFFF',
    fontSize: '15px',
    fontWeight: '400',
    textDecoration: 'underline',
    cursor: 'pointer',
    fontFamily: "'Nunito', sans-serif",
  },
};
