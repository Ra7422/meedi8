import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../ui';

/**
 * Universal Page Header Component
 *
 * Features:
 * - Logo in top-left
 * - Hamburger menu in top-right
 * - Menu bar matches page background with white text links
 * - No underlines on links
 * - Dropdown menu with navigation
 */
export default function PageHeader({ backgroundColor = 'transparent', showMenu = true, menuTextColor = '#FFFFFF' }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Check if mobile - safe for SSR
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const menuItems = [
    { label: 'Home', path: '/sessions' },
    { label: 'How It Works', path: '/onboarding' },
    { label: 'Pricing', path: '/subscription' },
    { label: 'FAQ', path: '/faq' },
    { label: 'About Us', path: '/about' },
    { label: 'Referrals', path: '/referrals' },
  ];

  return (
    <div style={{
      ...styles.header,
      backgroundColor: backgroundColor
    }}>
      <div style={styles.logoContainer}>
        <Logo size={isMobile ? 180 : 240} />
      </div>

      {showMenu && (
        <>
          <button
            style={styles.menuButton}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <div style={styles.menuIcon}>
              <div style={{...styles.menuBar, backgroundColor: menuTextColor}}></div>
              <div style={{...styles.menuBar, backgroundColor: menuTextColor}}></div>
              <div style={{...styles.menuBar, backgroundColor: menuTextColor}}></div>
            </div>
          </button>

          {menuOpen && (
            <div style={styles.menuDropdown}>
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    navigate(item.path);
                    setMenuOpen(false);
                  }}
                  style={styles.menuItem}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

const styles = {
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
    backgroundColor: '#FFFFFF',
    borderRadius: '2px',
  },
  menuDropdown: {
    position: 'absolute',
    top: '80px',
    right: '30px',
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    padding: '10px 0',
    zIndex: 100,
    minWidth: '180px',
    backdropFilter: 'blur(10px)',
  },
  menuItem: {
    display: 'block',
    width: '100%',
    padding: '12px 20px',
    color: '#1f2937',
    textDecoration: 'none',
    fontSize: '15px',
    fontWeight: '400',
    fontFamily: "'Nunito', sans-serif",
    background: 'none',
    border: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
};
