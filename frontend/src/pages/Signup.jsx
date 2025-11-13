import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Logo } from "../components/ui";

/**
 * Sign Up Page - Matches Login Design
 *
 * Features:
 * - Logo in top-left
 * - Hamburger menu in top-right
 * - Curved wave decorations
 * - Nunito font (light weight)
 * - Large mascot with speech bubble
 * - Placeholder text inside inputs
 */
export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Helper function to handle post-signup redirect
  const handlePostSignupRedirect = () => {
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

    // Default redirect to home page (streamlined free account flow)
    navigate('/');
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!agreedToTerms) {
      setError("Please agree to the Terms & Privacy Policy");
      return;
    }

    setLoading(true);

    try {
      const fullName = `${firstName} ${lastName}`.trim();
      await register(fullName, email, password);
      handlePostSignupRedirect();
    } catch (e) {
      setError(e.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Check if mobile - safe for SSR
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

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
            <span style={{ textDecoration: 'underline', textDecorationColor: '#7DD3C0', textDecorationThickness: '3px', textUnderlineOffset: '4px' }}>You're</span><br />
            <span style={{ fontWeight: '700', textDecoration: 'underline', textDecorationColor: '#7DD3C0', textDecorationThickness: '3px', textUnderlineOffset: '4px' }}>welcome</span> here
          </h1>
        </div>

        {/* Signup form - no white card, just inputs */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            disabled={loading}
            style={styles.input}
          />

          <input
            type="text"
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            disabled={loading}
            style={styles.input}
          />

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

          {/* Terms checkbox */}
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              style={styles.checkbox}
            />
            <span style={styles.checkboxText}>
              By signing up, you agree to our Terms & Privacy Policy.
            </span>
          </label>

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
            {loading ? 'Creating account...' : "Let's get started"}
          </button>

          {/* Divider */}
          <div style={styles.divider}>
            <div style={styles.dividerLine} />
            <span style={styles.dividerText}>Or continue with</span>
            <div style={styles.dividerLine} />
          </div>

          {/* Social Login Buttons */}
          <div style={styles.socialButtons}>
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

            <button
              type="button"
              onClick={() => alert('Apple sign-in coming soon')}
              style={styles.socialButton}
            >
              <svg style={styles.socialIcon} viewBox="0 0 24 24" fill="#000000">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              Apple
            </button>
          </div>
        </form>

      </div>

      {/* Mascot with speech bubble - bottom right */}
      <div style={styles.mascotContainer} onClick={() => navigate('/login')}>
        <img
          src="/assets/illustrations/Sign-up_meedi.svg"
          alt="Character with speech bubble - Click to log in"
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
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '14px',
    color: '#9CA3AF',
    cursor: 'pointer',
    width: '100%',
  },
  checkbox: {
    width: '20px',
    height: '20px',
    cursor: 'pointer',
    accentColor: '#B8A7E5',
    flexShrink: 0,
  },
  checkboxText: {
    lineHeight: '1.4',
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
