import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Logo } from "../components/ui";
import { GoogleLogin } from '@react-oauth/google';
import FacebookLogin from '@greatsumini/react-facebook-login';
import FloatingMenu from "../components/FloatingMenu";
import TelegramLoginButton from '../components/TelegramLoginButton';

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

  // Helper function to handle post-login redirect
  const handlePostLoginRedirect = () => {
    // Check for pending invite (highest priority)
    const pendingInvite = sessionStorage.getItem('pendingInvite');
    if (pendingInvite) {
      sessionStorage.removeItem('pendingInvite');
      navigate(`/join/${pendingInvite}`);
      return;
    }

    // Check for post-login redirect (e.g., from Home page button click)
    const postLoginRedirect = sessionStorage.getItem('postLoginRedirect');
    if (postLoginRedirect) {
      sessionStorage.removeItem('postLoginRedirect');
      navigate(postLoginRedirect);
      return;
    }

    // Default redirect to home
    navigate('/');
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      handlePostLoginRedirect();
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
      handlePostLoginRedirect();
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
      handlePostLoginRedirect();
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
      handlePostLoginRedirect();
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
      {/* FloatingMenu component */}
      <FloatingMenu />

      {/* Ellipse for depth at top */}
      <div style={styles.topEllipse} />

      {/* Header with Logo */}
      <div style={styles.header}>
        <div style={styles.logoContainer}>
          <Logo size={isMobile ? 180 : 240} />
        </div>
      </div>

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

          {/* Social Login Buttons - Horizontal Row */}
          <div style={{ display: 'flex', gap: '16px', width: '100%', justifyContent: 'center', alignItems: 'center' }}>
            {/* Google Login */}
            {hasGoogleOAuth && (
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  type="icon"
                  shape="circle"
                  size="large"
                />
              </div>
            )}

            {/* Telegram Login - Custom Icon Button */}
            <button
              type="button"
              onClick={() => {
                // Trigger the hidden Telegram widget
                const telegramContainer = document.getElementById('telegram-login-container');
                if (telegramContainer) {
                  const iframe = telegramContainer.querySelector('iframe');
                  if (iframe) {
                    // Simulate click on the Telegram iframe
                    iframe.contentWindow?.postMessage('click', '*');
                    // Fallback: try to trigger the button inside
                    const button = telegramContainer.querySelector('button');
                    if (button) button.click();
                  }
                }
              }}
              style={styles.telegramIconButton}
              title="Sign in with Telegram"
            >
              <img
                src="/assets/illustrations/Telegram_logo.svg"
                alt="Telegram"
                style={{ width: '48px', height: '48px' }}
              />
            </button>

            {/* Hidden Telegram Widget */}
            <div id="telegram-login-container" style={{ position: 'absolute', left: '-9999px', opacity: 0 }}>
              <TelegramLoginButton
                botName="meedi8_bot"
                dataOnauth={handleTelegramResponse}
                buttonSize="large"
                cornerRadius={20}
                requestAccess={true}
                usePic={false}
              />
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

      {/* Override Google button border radius */}
      <style>{`
        div[data-plugin-name="Sign in with Google"] > div {
          border-radius: 12px !important;
        }
        iframe[src*="accounts.google.com/gsi/button"] {
          border-radius: 12px !important;
        }
      `}</style>
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
    border: '1px solid #FFFFFF',
    borderRadius: '6px',
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
  iconButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '60px',
    height: '60px',
    border: '1px solid #e5e7eb',
    borderRadius: '50%',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  iconSvg: {
    width: '32px',
    height: '32px',
  },
  telegramIconButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '58px',
    height: '58px',
    border: 'none',
    borderRadius: '50%',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.2s',
    padding: 0,
    flexShrink: 0,
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
