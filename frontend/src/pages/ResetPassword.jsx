import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiRequest } from "../api/client";
import { Logo } from "../components/ui";
import FloatingMenu from "../components/FloatingMenu";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await apiRequest("/auth/reset-password", "POST", {
        token,
        new_password: password
      });
      setSuccess(true);
    } catch (e) {
      setError(e.message || "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  }

  // No token provided
  if (!token) {
    return (
      <div style={styles.container}>
        <FloatingMenu />
        <div style={styles.topEllipse} />

        <div style={styles.header}>
          <div style={styles.logoContainer}>
            <Logo size={isMobile ? 180 : 240} />
          </div>
        </div>

        <div style={styles.content}>
          <div style={styles.errorCard}>
            <div style={styles.errorIcon}>!</div>
            <h2 style={styles.errorTitle}>Invalid Link</h2>
            <p style={styles.errorText}>
              This password reset link is invalid or has expired.
            </p>
            <button
              onClick={() => navigate('/forgot-password')}
              style={styles.backButton}
            >
              Request New Link
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div style={styles.container}>
        <FloatingMenu />
        <div style={styles.topEllipse} />

        <div style={styles.header}>
          <div style={styles.logoContainer}>
            <Logo size={isMobile ? 180 : 240} />
          </div>
        </div>

        <div style={styles.content}>
          <div style={styles.successCard}>
            <div style={styles.successIcon}>✓</div>
            <h2 style={styles.successTitle}>Password Reset!</h2>
            <p style={styles.successText}>
              Your password has been successfully reset.
            </p>
            <button
              onClick={() => navigate('/login')}
              style={styles.backButton}
            >
              Log In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <FloatingMenu />
      <div style={styles.topEllipse} />

      <div style={styles.header}>
        <div style={styles.logoContainer}>
          <Logo size={isMobile ? 180 : 240} />
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.headline}>
          <h1 style={styles.headlineText}>
            Set new<br />
            <span style={{ fontWeight: '700' }}>password</span>
          </h1>
        </div>

        <p style={styles.subtext}>
          Enter your new password below.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            style={styles.input}
          />

          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
            style={styles.input}
          />

          {error && (
            <div style={styles.errorBox}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitButton,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
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
  header: {
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 30px',
  },
  logoContainer: {},
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
    paddingTop: '40px',
  },
  headline: {
    textAlign: 'center',
    marginBottom: '16px',
  },
  headlineText: {
    fontSize: 'clamp(28px, 5.6vw, 39px)',
    fontWeight: '300',
    color: '#7DD3C0',
    lineHeight: '1.2',
    margin: 0,
  },
  subtext: {
    color: '#6b7280',
    fontSize: '16px',
    textAlign: 'center',
    marginBottom: '24px',
    lineHeight: '1.5',
  },
  form: {
    width: '100%',
    maxWidth: '364px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
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
  errorBox: {
    backgroundColor: '#fee2e2',
    color: '#ef4444',
    padding: '12px 20px',
    borderRadius: '12px',
    fontSize: '14px',
    textAlign: 'center',
  },
  submitButton: {
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
  successCard: {
    textAlign: 'center',
    padding: '40px 20px',
  },
  successIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: '#7DD3C0',
    color: 'white',
    fontSize: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
  },
  successTitle: {
    fontSize: '28px',
    fontWeight: '400',
    color: '#1f2937',
    marginBottom: '16px',
  },
  successText: {
    color: '#4b5563',
    fontSize: '16px',
    lineHeight: '1.5',
    marginBottom: '24px',
  },
  errorCard: {
    textAlign: 'center',
    padding: '40px 20px',
  },
  errorIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: '#ef4444',
    color: 'white',
    fontSize: '32px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
  },
  errorTitle: {
    fontSize: '28px',
    fontWeight: '400',
    color: '#1f2937',
    marginBottom: '16px',
  },
  errorText: {
    color: '#4b5563',
    fontSize: '16px',
    lineHeight: '1.5',
    marginBottom: '24px',
  },
  backButton: {
    padding: '12px 32px',
    fontSize: '16px',
    fontWeight: '400',
    fontFamily: "'Nunito', sans-serif",
    border: 'none',
    borderRadius: '12px',
    backgroundColor: '#7DD3C0',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};
