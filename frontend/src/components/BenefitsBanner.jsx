import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function BenefitsBanner() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const benefits = [
    'Save time by speaking to Meedi8 with voice messages',
    'Upload screenshots to save explaining',
    'Import Telegram / WhatsApp / Facebook Messenger chat history',
    'Get professional PDF reports of your sessions',
    'Access unlimited mediations and coaching sessions'
  ];

  // Auto-rotate benefits every 5 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % benefits.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [benefits.length]);

  const styles = {
    banner: {
      backgroundColor: '#6750A4',
      color: 'white',
      padding: '12px 16px',
      textAlign: 'center',
      fontSize: '14px',
      fontFamily: "'Nunito', sans-serif",
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      flexWrap: 'wrap',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      position: 'relative',
      zIndex: 10,
    },
    message: {
      fontWeight: '600',
      flex: '1',
      minWidth: '200px',
      animation: 'fadeIn 0.5s ease-in',
    },
    button: {
      backgroundColor: '#7DD3C0',
      color: '#1F7A5C',
      border: 'none',
      borderRadius: '8px',
      padding: '8px 20px',
      fontSize: '14px',
      fontWeight: '700',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontFamily: "'Nunito', sans-serif",
      whiteSpace: 'nowrap',
    },
  };

  return (
    <div style={styles.banner}>
      <div style={styles.message} key={currentIndex}>
        ✨ {benefits[currentIndex]}
      </div>
      <button
        style={styles.button}
        onClick={() => navigate('/subscription')}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#6BC5B8';
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#7DD3C0';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        Get Premium
      </button>

      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-5px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
}
