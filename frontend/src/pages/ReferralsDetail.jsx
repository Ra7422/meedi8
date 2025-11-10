import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Referrals Detail Page
 * Simple informational page about OnlineTherapy.com
 */
export default function ReferralsDetail() {
  const navigate = useNavigate();

  const therapyCategories = [
    { name: 'Anxiety Therapy', icon: 'anxiety-therapy.png' },
    { name: 'Christian Counseling', icon: 'christian_counseling.png' },
    { name: 'Family Therapist', icon: 'family-therapist.png' },
    { name: 'Marriage Counseling', icon: 'marriage-counseling.png' },
    { name: 'Online Therapy', icon: 'online-therapy.png' },
    { name: 'Social Workers', icon: 'social_workers.png' },
    { name: 'Suicide Prevention', icon: 'suicide-prevention.png' },
    { name: 'Therapy for Veterans', icon: 'therapy_for_veterans.png' },
  ];

  return (
    <div style={styles.container}>
      {/* Top ellipse for depth */}
      <div style={styles.topEllipse} />

      {/* Header with Online Therapy Logo */}
      <div style={styles.header}>
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
      </div>

      {/* Main content */}
      <div style={styles.content}>
        <p style={styles.description}>
          OnlineTherapy.com is an international online therapy directory connecting people with therapists worldwide. Whether you're looking for counseling from the comfort of home, or a therapist seeking resources and guidance to take your practice online, we can help.
        </p>

        {/* Online Counseling Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Online Counseling</h2>
          <p style={styles.sectionText}>
            The Online Therapy Directory exclusively lists the best online therapists in the world. Each online therapist is thoroughly researched to ensure they have sufficient education, experience, and online therapy training to effectively serve clients. Search our database to find an online therapist that meets your needs.
          </p>

          {/* Icons Grid */}
          <div style={styles.iconsGrid}>
            {therapyCategories.map((category, index) => (
              <div key={index} style={styles.iconItem}>
                <img
                  src={`/assets/icons/ot_icon/${category.icon}`}
                  alt={category.name}
                  style={styles.icon}
                />
                <span style={styles.iconLabel}>{category.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* BetterHelp Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>BetterHelp</h2>
          <p style={styles.sectionText}>
            BetterHelp is the largest online therapy platform in the world, offering virtual therapy with licensed and accredited therapists via chat, phone calls, and video calls. With over 30,000 licensed therapists, BetterHelp has one that fits your needs. Now you can focus on what matters most: getting the help you deserve.
          </p>
          <button
            style={styles.ctaButton}
            onClick={() => window.open('https://www.betterhelp.com/', '_blank')}
          >
            Get Started
          </button>
          <p style={styles.disclaimer}>
            As a BetterHelp affiliate, we may receive compensation from BetterHelp if you purchase products or services through the links provided.
          </p>
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
    padding: '20px 30px',
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
  content: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '60px 20px 80px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  description: {
    fontSize: 'clamp(14px, 3vw, 18px)',
    fontWeight: '400',
    color: '#4B5563',
    lineHeight: '1.8',
    margin: 0,
    textAlign: 'center',
  },
  section: {
    width: '100%',
    marginTop: '48px',
    padding: '40px',
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  },
  sectionTitle: {
    fontSize: 'clamp(24px, 5vw, 32px)',
    fontWeight: '700',
    color: '#7DD3C0',
    lineHeight: '1.2',
    margin: '0 0 20px 0',
    textAlign: 'center',
  },
  sectionText: {
    fontSize: 'clamp(14px, 3vw, 16px)',
    fontWeight: '400',
    color: '#4B5563',
    lineHeight: '1.8',
    margin: '0 0 32px 0',
    textAlign: 'center',
  },
  iconsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '24px',
    marginBottom: '32px',
  },
  iconItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  icon: {
    width: '80px',
    height: '80px',
    objectFit: 'contain',
  },
  iconLabel: {
    fontSize: 'clamp(12px, 2.5vw, 14px)',
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  ctaButton: {
    backgroundColor: '#7DD3C0',
    color: 'white',
    fontSize: 'clamp(16px, 3.5vw, 18px)',
    fontWeight: '600',
    padding: '14px 40px',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: "'Nunito', sans-serif",
    display: 'block',
    margin: '0 auto',
  },
  disclaimer: {
    fontSize: 'clamp(12px, 2.5vw, 14px)',
    fontWeight: '400',
    color: '#9CA3AF',
    lineHeight: '1.6',
    margin: '16px 0 0 0',
    textAlign: 'center',
    fontStyle: 'italic',
  },
};
