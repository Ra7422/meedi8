import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';

export default function CreateSoloSession() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const createSession = async () => {
      try {
        // Get the conflict description from sessionStorage
        const conflictDescription = sessionStorage.getItem('initialConflictDescription');

        if (!conflictDescription) {
          console.error('No conflict description found');
          navigate('/');
          return;
        }

        if (!token) {
          console.error('No auth token found');
          navigate('/');
          return;
        }

        console.log('Creating solo coaching room...');

        // Create a solo coaching room
        const response = await apiRequest('/rooms', 'POST', {
          title: 'Solo Coaching Session',
          category: 'other',
          initial_issue: conflictDescription,
          room_type: 'solo'
        }, token);

        console.log('Solo room created:', response);

        // Clear the stored description
        sessionStorage.removeItem('initialConflictDescription');

        // Navigate to the solo coaching page
        window.location.href = `/rooms/${response.id}/solo`;
      } catch (err) {
        console.error('Failed to create solo session:', err);
        setError(err.message || 'Failed to create session');

        // Redirect back to home after a short delay
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    };

    createSession();
  }, [token, navigate]);

  if (error) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #EAF7F0 0%, #ffffff 100%)',
        fontFamily: "'Nunito', sans-serif",
        padding: '20px',
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '500px',
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px',
          }}>⚠️</div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#ef4444',
            marginBottom: '12px',
          }}>
            Oops! Something went wrong
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#666',
            marginBottom: '24px',
          }}>
            {error}
          </p>
          <p style={{
            fontSize: '14px',
            color: '#999',
          }}>
            Redirecting you back to the home page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #EAF7F0 0%, #ffffff 100%)',
      fontFamily: "'Nunito', sans-serif",
      padding: '20px',
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '500px',
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
