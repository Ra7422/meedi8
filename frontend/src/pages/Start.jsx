import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Post-Onboarding Start Page
 *
 * Shown after user completes onboarding, before creating first room
 *
 * Design from: "Start (post-onboarding).png"
 *
 * Features:
 * - Heading: "Ready to Resolve a Situation?"
 * - Teal "Lets begin" button (no apostrophe)
 * - Clipboard/document illustration
 * - Bottom tagline: "No interruptions. No judgement. Just understanding"
 */
export default function Start() {
  const navigate = useNavigate();

  const handleBegin = () => {
    navigate('/create');
  };

  return (
    <div style={styles.container}>
      {/* Top ellipse for depth */}
      <div style={styles.topEllipse} />

      {/* Main content */}
      <div style={styles.content}>
        {/* Heading */}
        <h1 style={styles.heading}>
          Ready to Resolve
          <br />
          a Situation?
        </h1>

        {/* Illustration - clipboard/document */}
        <div style={styles.illustrationContainer}>
          {/* Using a clipboard SVG - will need to add this asset */}
          <svg width="200" height="200" viewBox="0 0 200 200" fill="none" style={styles.illustration}>
            <rect x="40" y="20" width="120" height="160" rx="8" fill="#E5F5F3" stroke="#7DD3C0" strokeWidth="3"/>
            <rect x="70" y="10" width="60" height="20" rx="6" fill="#7DD3C0"/>
            <line x1="60" y1="50" x2="140" y2="50" stroke="#B8A7E5" strokeWidth="3" strokeLinecap="round"/>
            <line x1="60" y1="70" x2="140" y2="70" stroke="#B8A7E5" strokeWidth="3" strokeLinecap="round"/>
            <line x1="60" y1="90" x2="140" y2="90" stroke="#B8A7E5" strokeWidth="3" strokeLinecap="round"/>
            <line x1="60" y1="110" x2="120" y2="110" stroke="#B8A7E5" strokeWidth="3" strokeLinecap="round"/>
          </svg>
        </div>

        {/* Begin button */}
        <button
          onClick={handleBegin}
          style={styles.beginButton}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#6BC5B8'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#7DD3C0'}
        >
          Lets begin
        </button>

        {/* Bottom tagline */}
        <p style={styles.tagline}>
          No interruptions. No judgement.
          <br />
          <span style={{ fontWeight: '700' }}>Just understanding</span>
        </p>
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
  content: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    maxWidth: '600px',
    margin: '0 auto',
    minHeight: 'calc(100vh - 200px)',
    textAlign: 'center',
  },
  heading: {
    fontSize: 'clamp(40px, 8vw, 56px)',
    fontWeight: '700',
    color: '#7DD3C0',
    lineHeight: '1.2',
    margin: '0 0 40px 0',
  },
  illustrationContainer: {
    marginBottom: '40px',
  },
  illustration: {
    width: '100%',
    maxWidth: '200px',
    height: 'auto',
  },
  beginButton: {
    width: '100%',
    maxWidth: '400px',
    padding: '16px 32px',
    fontSize: '24px',
    fontWeight: '600',
    fontFamily: "'Nunito', sans-serif",
    border: 'none',
    borderRadius: '12px',
    backgroundColor: '#7DD3C0',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 12px rgba(125, 211, 192, 0.3)',
    marginBottom: '32px',
  },
  tagline: {
    fontSize: 'clamp(16px, 3.5vw, 20px)',
    color: '#6B7280',
    fontWeight: '400',
    lineHeight: '1.5',
    margin: 0,
    maxWidth: '400px',
  },
};
