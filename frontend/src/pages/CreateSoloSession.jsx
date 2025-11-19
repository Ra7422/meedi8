import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import WaveDecoration from '../components/WaveDecoration';
import paywallIllustration from '../assets/illustrations/paywall-meedi.png';

export default function CreateSoloSession() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [conflictDescription, setConflictDescription] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCategorySelection, setShowCategorySelection] = useState(false);
  const [paywallModal, setPaywallModal] = useState(null);

  const categories = [
    { id: 'work', label: 'Work' },
    { id: 'family', label: 'Family' },
    { id: 'romance', label: 'Romance' },
    { id: 'money', label: 'Money' },
    { id: 'friendship', label: 'Friendship' },
    { id: 'other', label: 'Other' },
  ];

  useEffect(() => {
    // Get the conflict description from sessionStorage
    const description = sessionStorage.getItem('initialConflictDescription');

    if (!description) {
      console.error('No conflict description found');
      navigate('/');
      return;
    }

    if (!token) {
      console.error('No auth token found');
      navigate('/');
      return;
    }

    setConflictDescription(description);
    setShowCategorySelection(true);
  }, [token, navigate]);

  const handleCreateSession = async () => {
    if (!category) {
      alert('Please select a category');
      return;
    }

    if (loading) return;

    setLoading(true);

    try {
      console.log('Creating mediation room...');

      // Create a mediation room (same as CreateRoom.jsx)
      const response = await apiRequest('/rooms/', 'POST', {
        title: 'Coaching Session',
        category: category.toLowerCase()
      }, token);

      console.log('Room created:', response);

      // Store the conflict description for CoachingChat to pick up
      sessionStorage.setItem(`room_${response.id}_initial`, conflictDescription);

      // Clear the temporary storage
      sessionStorage.removeItem('initialConflictDescription');

      // Navigate to the mediation coaching page (same flow as CreateRoom.jsx)
      navigate(`/rooms/${response.id}/coaching`);
    } catch (err) {
      console.error('Failed to create session:', err);

      // Handle paywall errors (402 Payment Required)
      if (err.paywallError) {
        const details = err.details || {};
        setPaywallModal({
          message: err.message,
          tier: details.tier,
          limit: details.limit,
          currentCount: details.current_count
        });
      } else {
        alert('Failed to create session: ' + err.message);
      }

      setLoading(false);
    }
  };

  if (!showCategorySelection) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: '#EAF7F0',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <WaveDecoration />
        <div style={{
          textAlign: 'center',
          maxWidth: '500px',
          position: 'relative',
          zIndex: 1,
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            border: '4px solid #7DD3C0',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            margin: '0 auto 24px',
            animation: 'spin 1s linear infinite',
          }}></div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#6750A4',
            marginBottom: '12px',
          }}>
            Preparing your coaching session...
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#666',
          }}>
            Meedi is getting ready to help you work through this
          </p>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: '#EAF7F0',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <WaveDecoration />

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flex: 1,
        position: 'relative',
        zIndex: 1,
      }}>
        <h1 style={{
          fontSize: 'clamp(28px, 6vw, 40px)',
          color: '#7DD3C0',
          fontWeight: '400',
          textAlign: 'center',
          margin: '0 0 16px 0',
        }}>
          Communication Style
        </h1>

        {/* Down Arrow */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ marginBottom: '24px' }}>
          <path d="M7 10L12 15L17 10" stroke="#7DD3C0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>

        {/* Category Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '16px',
          width: '100%',
          maxWidth: '520px',
          marginBottom: '32px',
        }}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => !loading && setCategory(cat.id)}
              disabled={loading}
              style={{
                backgroundColor: category === cat.id ? '#7C6CB6' : 'white',
                color: category === cat.id ? 'white' : '#333',
                border: 'none',
                borderRadius: '12px',
                padding: '1px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                aspectRatio: '1',
                opacity: loading ? 0.6 : 1,
                overflow: 'hidden',
              }}
            >
              <img
                src={`/assets/icons/${cat.id}.svg`}
                alt={`${cat.label} icon`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            </button>
          ))}
        </div>

        {/* Start Button */}
        <button
          onClick={handleCreateSession}
          disabled={loading || !category}
          style={{
            backgroundColor: '#7DD3C0',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '16px 48px',
            fontSize: '20px',
            fontWeight: '400',
            cursor: (loading || !category) ? 'not-allowed' : 'pointer',
            width: '100%',
            maxWidth: '520px',
            opacity: (loading || !category) ? 0.6 : 1,
          }}
        >
          {loading ? 'Starting...' : 'Start Coaching'}
        </button>
      </div>

      {/* Paywall Modal */}
      {paywallModal && (
        <>
          <div
            onClick={() => setPaywallModal(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 999,
              animation: 'fadeIn 0.2s ease'
            }}
          />

          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '500px',
            width: 'calc(100% - 40px)',
            zIndex: 1000,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            animation: 'slideUp 0.3s ease',
            fontFamily: "'Nunito', sans-serif",
            overflow: 'hidden',
          }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#6750A4', marginBottom: '12px', margin: 0 }}>
                Room Limit Reached
              </h2>
              <p style={{ fontSize: '16px', color: '#666', lineHeight: '1.6', margin: '12px 0 0 0' }}>
                {paywallModal.message}
              </p>
            </div>

              <div style={{
                backgroundColor: '#7ED957',
                padding: '16px',
                paddingBottom: '250px',
                borderRadius: '12px',
                marginBottom: '24px',
                fontSize: '14px',
                color: 'white',
                position: 'relative',
              }}>
                <strong>I'd love to help you resolve the issue, please:</strong>
                <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                  <li>Delete an existing session from your Sessions page</li>
                  <li>Upgrade to PLUS or PRO for<br />unlimited rooms</li>
                </ul>
                {/* Meedi illustration inside green card */}
                <img
                  src={paywallIllustration}
                  alt=""
                  style={{
                    position: 'absolute',
                    bottom: '40px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '200px',
                    height: '200px',
                    pointerEvents: 'none',
                  }}
                />
                <p style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  margin: 0,
                  fontSize: '12px',
                  color: 'white',
                  fontWeight: '600',
                }}>
                  Less than 30p per day
                </p>
              </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => navigate('/sessions')}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  fontSize: '16px',
                  fontWeight: '700',
                  fontFamily: "'Nunito', sans-serif",
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  backgroundColor: '#7DD3C0',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(125, 211, 192, 0.3)',
                }}
              >
                Go to Sessions
              </button>

              <button
                onClick={() => navigate('/subscription')}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  fontSize: '16px',
                  fontWeight: '700',
                  fontFamily: "'Nunito', sans-serif",
                  border: '2px solid #7DD3C0',
                  borderRadius: '12px',
                  color: '#7DD3C0',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Upgrade Plan
              </button>

              <button
                onClick={() => {
                  setPaywallModal(null);
                  navigate('/');
                }}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  fontSize: '15px',
                  fontWeight: '600',
                  fontFamily: "'Nunito', sans-serif",
                  border: 'none',
                  borderRadius: '12px',
                  color: '#666',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Go Back Home
              </button>
            </div>
          </div>

          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }

            @keyframes slideUp {
              from {
                opacity: 0;
                transform: translate(-50%, -45%);
              }
              to {
                opacity: 1;
                transform: translate(-50%, -50%);
              }
            }
          `}</style>
        </>
      )}
    </div>
  );
}
