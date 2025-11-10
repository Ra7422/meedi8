import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Logo from "../components/ui/Logo";

/**
 * Email Verification Page
 *
 * Features:
 * - Confirms email sent after signup
 * - Allows users to resend verification email
 * - Clean, simple layout matching meedi8 design system
 * - Mobile-responsive with proper scaling
 */
export default function EmailVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Get email from location state (passed from signup page)
  const email = location.state?.email || "your email address";

  // Check if mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const handleResend = async () => {
    setLoading(true);
    setMessage("");

    try {
      // TODO: Implement actual resend logic
      // For now, just simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage("Verification email sent! Please check your inbox.");
    } catch (error) {
      setMessage("Failed to resend email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Top ellipse for depth */}
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
        <h1 style={styles.headline}>
          You're <span style={styles.emphasizedText}>nearly</span><br />
          there!
        </h1>

        {/* Instructions */}
        <p style={styles.instructions}>
          We've sent a confirmation link to<br />
          your email address. Please check<br />
          your inbox (and spam/junk folder)<br />
          to verify your account.
        </p>

        {/* Resend section */}
        <div style={styles.resendSection}>
          <p style={styles.resendLabel}>Didn't receive an email?</p>

          <button
            onClick={handleResend}
            disabled={loading}
            style={{
              ...styles.resendButton,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Sending...' : 'Resend'}
          </button>

          {message && (
            <div style={styles.messageBox}>
              {message}
            </div>
          )}
        </div>

        {/* Email icon illustration */}
        <div style={styles.emailIconContainer}>
          <svg
            width={isMobile ? "200" : "250"}
            height={isMobile ? "180" : "220"}
            viewBox="0 0 250 220"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={styles.emailIcon}
          >
            {/* Envelope background */}
            <rect
              x="25"
              y="60"
              width="200"
              height="140"
              rx="12"
              fill="#E8E8E8"
              opacity="0.6"
            />

            {/* Envelope flap */}
            <path
              d="M25 70 L125 140 L225 70"
              stroke="#7DD3C0"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />

            {/* Success indicator - green circle */}
            <circle
              cx="200"
              cy="80"
              r="25"
              fill="#10B981"
            />

            {/* Checkmark in circle */}
            <path
              d="M190 80 L197 87 L210 72"
              stroke="#FFFFFF"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>
      </div>

      {/* Bottom ellipse for depth */}
      <div style={styles.bottomEllipse} />
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    position: 'relative',
    background: 'linear-gradient(180deg, #EAF7F0 0%, #FFFFFF 100%)',
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
  content: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px 20px 40px',
    maxWidth: '600px',
    margin: '0 auto',
    textAlign: 'center',
  },
  headline: {
    fontSize: 'clamp(40px, 8vw, 56px)',
    fontWeight: '300',
    color: '#7DD3C0',
    lineHeight: '1.2',
    margin: '0 0 40px 0',
  },
  emphasizedText: {
    fontWeight: '700',
  },
  instructions: {
    fontSize: '18px',
    fontWeight: '300',
    color: '#9CA3AF',
    lineHeight: '1.6',
    margin: '0 0 60px 0',
  },
  resendSection: {
    width: '100%',
    maxWidth: '520px',
    marginBottom: '40px',
  },
  resendLabel: {
    fontSize: '16px',
    fontWeight: '400',
    color: '#9CA3AF',
    margin: '0 0 16px 0',
    textAlign: 'right',
  },
  resendButton: {
    width: '100%',
    padding: '16px',
    fontSize: '20px',
    fontWeight: '400',
    fontFamily: "'Nunito', sans-serif",
    border: 'none',
    borderRadius: '12px',
    backgroundColor: '#7DD3C0',
    color: 'white',
    transition: 'all 0.2s',
  },
  messageBox: {
    marginTop: '16px',
    padding: '12px 20px',
    borderRadius: '12px',
    fontSize: '14px',
    backgroundColor: '#E8F5F3',
    color: '#4CD3C2',
  },
  emailIconContainer: {
    marginTop: '20px',
  },
  emailIcon: {
  },
};
