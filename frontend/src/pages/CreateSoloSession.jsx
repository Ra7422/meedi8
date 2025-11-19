import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import { soloTheme, soloStyles } from '../styles/soloTheme';

export default function CreateSoloSession() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [conflictDescription, setConflictDescription] = useState('');
  const [category, setCategory] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [showCategorySelection, setShowCategorySelection] = useState(false);

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
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      console.log('Creating solo coaching room...');

      // Create a solo coaching room
      const response = await apiRequest('/rooms/', 'POST', {
        title: 'Solo Coaching Session',
        category,
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
      setLoading(false);
    }
  };

  const categories = [
    { value: "personal", label: "Personal" },
    { value: "work", label: "Work" },
    { value: "family", label: "Family" },
    { value: "relationship", label: "Relationship" },
    { value: "friendship", label: "Friendship" },
    { value: "other", label: "Other" },
  ];

  const styles = {
    container: {
      ...soloStyles.pageContainer,
      alignItems: "center",
      justifyContent: "center",
    },
    card: {
      backgroundColor: soloTheme.colors.backgroundWhite,
      borderRadius: soloTheme.borderRadius.xl,
      padding: "40px",
      maxWidth: "600px",
      width: "100%",
      boxShadow: soloTheme.shadows.lg,
      border: `2px solid ${soloTheme.colors.border}`,
    },
    heading: {
      ...soloStyles.heading,
      marginBottom: "12px",
    },
    subheading: {
      ...soloStyles.subheading,
      textAlign: "center",
      color: soloTheme.colors.textLight,
      marginBottom: "32px",
    },
    label: {
      fontSize: soloTheme.fontSize.md,
      fontWeight: soloTheme.fontWeight.semibold,
      color: soloTheme.colors.textSecondary,
      marginBottom: "16px",
      display: "block",
    },
    categoryGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: "12px",
      marginBottom: "24px",
    },
    categoryOption: {
      padding: "16px",
      borderRadius: soloTheme.borderRadius.md,
      border: `2px solid ${soloTheme.colors.border}`,
      backgroundColor: soloTheme.colors.backgroundWhite,
      cursor: "pointer",
      textAlign: "center",
      fontSize: soloTheme.fontSize.md,
      fontWeight: soloTheme.fontWeight.medium,
      color: soloTheme.colors.textSecondary,
      transition: "all 0.2s ease",
    },
    categoryOptionSelected: {
      borderColor: soloTheme.colors.primary,
      backgroundColor: soloTheme.colors.primaryPale,
      color: soloTheme.colors.primary,
    },
    button: {
      ...soloStyles.buttonPrimary,
      width: "100%",
      opacity: loading ? 0.6 : 1,
      cursor: loading ? "not-allowed" : "pointer",
    },
    error: {
      color: soloTheme.colors.caution,
      fontSize: soloTheme.fontSize.sm,
      textAlign: "center",
      padding: "12px",
      backgroundColor: `${soloTheme.colors.caution}20`,
      borderRadius: soloTheme.borderRadius.md,
      marginBottom: "16px",
    },
  };

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={{
            textAlign: 'center',
            fontSize: '48px',
            marginBottom: '16px',
          }}>⚠️</div>
          <h2 style={{
            ...styles.heading,
            color: '#ef4444',
            textAlign: 'center',
          }}>
            Oops! Something went wrong
          </h2>
          <p style={{
            textAlign: 'center',
            color: '#666',
            marginBottom: '24px',
          }}>
            {error}
          </p>
          <button
            onClick={() => navigate('/')}
            style={styles.button}
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (!showCategorySelection) {
    return (
      <div style={styles.container}>
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
          <h2 style={styles.heading}>
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
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.heading}>What type of situation is this?</h1>
        <p style={styles.subheading}>
          This helps Meedi understand the context better
        </p>

        <div>
          <label style={styles.label}>Select a category</label>
          <div style={styles.categoryGrid}>
            {categories.map((cat) => (
              <div
                key={cat.value}
                style={{
                  ...styles.categoryOption,
                  ...(category === cat.value ? styles.categoryOptionSelected : {})
                }}
                onClick={() => !loading && setCategory(cat.value)}
              >
                {cat.label}
              </div>
            ))}
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <button
          onClick={handleCreateSession}
          style={styles.button}
          disabled={loading}
        >
          {loading ? "Starting your session..." : "Start Coaching"}
        </button>
      </div>
    </div>
  );
}
