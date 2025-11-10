import React from "react";
import { useNavigate } from "react-router-dom";

export default function Referrals() {
  const navigate = useNavigate();

  const handleOnlineTherapyClick = () => {
    window.open("https://onlinetherapy.hasoffers.com/signup", "_blank");
  };

  return (
    <div style={styles.container}>
      {/* Top ellipse for depth */}
      <div style={styles.topEllipse} />

      {/* Main Content */}
      <div style={styles.content}>
        <h1 style={styles.title}>Referrals</h1>

        <p style={styles.description}>
          Sometimes it's better to speak with another human; when you notice you need deeper support,
          imagine the relief of talking with a caring professional, and click to connect with a trusted
          therapist or doctor.
        </p>

        {/* Online Therapy Card */}
        <div style={styles.card} onClick={handleOnlineTherapyClick}>
          {/* Online Therapy Logo */}
          <div style={styles.logoContainer}>
            <svg width="60" height="60" viewBox="0 0 100 100" fill="none">
              <circle cx="35" cy="35" r="25" fill="#D946EF"/>
              <circle cx="65" cy="65" r="25" fill="#06B6D4"/>
              <circle cx="50" cy="50" r="15" fill="#8B5CF6" opacity="0.8"/>
            </svg>
            <div style={styles.logoText}>
              <span style={styles.onlineText}>online</span>
              <span style={styles.therapyText}>therapy</span>
            </div>
          </div>

          <a href="https://onlinetherapy.hasoffers.com/signup" style={styles.link} target="_blank" rel="noopener noreferrer">
            https://onlinetherapy.hasoffers.com/signup
          </a>
        </div>

        {/* Safety & Support Section */}
        <div style={styles.safetySection}>
          <h2 style={styles.safetyHeading}>Your Safety Matters</h2>
          <p style={styles.safetyText}>
            If you're experiencing abuse or feel unsafe, please know that you're not alone. There are real people ready to help you right now. While Meedi can facilitate conversations, some situations require immediate human support. If you're concerned about your safety or someone else's, please reach out to a crisis helpline, domestic violence hotline, or emergency services. Your wellbeing is what matters most, and there's always someone real to talk to who cares.
          </p>
        </div>
      </div>

      <div style={styles.bottomEllipse} />
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    position: 'relative',
    background: 'linear-gradient(180deg, #EAF7F0 0%, #E8F9F9 100%)',
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
    background: 'radial-gradient(ellipse at center, rgba(125, 211, 192, 0.1) 0%, transparent 70%)',
    zIndex: 0,
  },
  content: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 20px 200px',
    maxWidth: '600px',
    margin: '0 auto',
  },
  title: {
    fontSize: 'clamp(40px, 8vw, 64px)',
    fontWeight: '300',
    color: '#7DD3C0',
    lineHeight: '1.2',
    margin: '0 0 32px 0',
    textAlign: 'center',
  },
  description: {
    fontSize: '16px',
    fontWeight: '300',
    color: '#9CA3AF',
    lineHeight: '1.8',
    textAlign: 'center',
    margin: '0 0 48px 0',
    maxWidth: '520px',
  },
  card: {
    width: '100%',
    maxWidth: '500px',
    background: 'white',
    borderRadius: '20px',
    padding: '40px 32px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    border: '2px solid rgba(125, 211, 192, 0.2)',
    marginBottom: '60px',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  logoText: {
    display: 'flex',
    flexDirection: 'column',
    lineHeight: '1',
  },
  onlineText: {
    fontSize: '24px',
    fontWeight: '400',
    color: '#374151',
  },
  therapyText: {
    fontSize: '32px',
    fontWeight: '600',
    color: '#06B6D4',
  },
  link: {
    fontSize: '16px',
    fontWeight: '400',
    color: '#1F2937',
    textDecoration: 'none',
    textAlign: 'center',
    wordBreak: 'break-all',
  },
  safetySection: {
    width: '100%',
    maxWidth: '540px',
    marginTop: '48px',
    padding: '32px',
    background: 'rgba(255, 255, 255, 0.6)',
    borderRadius: '16px',
    border: '2px solid rgba(255, 107, 107, 0.2)',
  },
  safetyHeading: {
    fontSize: 'clamp(24px, 5vw, 32px)',
    fontWeight: '600',
    color: '#7DD3C0',
    lineHeight: '1.2',
    margin: '0 0 16px 0',
    textAlign: 'center',
  },
  safetyText: {
    fontSize: '16px',
    fontWeight: '400',
    color: '#4B5563',
    lineHeight: '1.8',
    textAlign: 'left',
    margin: 0,
  },
};
