import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api/client";
import WaveDecoration from "../components/WaveDecoration";
import CategoryIcon from "../components/ui/CategoryIcon";

const categories = [
  { id: 'work', label: 'Work' },
  { id: 'family', label: 'Family' },
  { id: 'romance', label: 'Romance' },
  { id: 'money', label: 'Money' },
  { id: 'other', label: 'Other' },
];

export default function CreateRoom() {
  const { token, user, setUser } = useAuth();
  const navigate = useNavigate();

  // Restore saved form data if returning from screening
  const savedData = sessionStorage.getItem('pendingRoomCreation');
  const initialData = savedData ? JSON.parse(savedData) : {};

  const [step, setStep] = useState(initialData.step || 1); // 1 = category selection, 2 = describe issue
  const [title, setTitle] = useState(initialData.title || "");
  const [category, setCategory] = useState(initialData.category || "");
  const [initialIssue, setInitialIssue] = useState(initialData.initialIssue || "");
  const [loading, setLoading] = useState(false);

  // Refresh user data on mount to ensure has_completed_screening is up to date
  useEffect(() => {
    const refreshUserData = async () => {
      if (token) {
        try {
          const updatedUser = await apiRequest('/auth/me', 'GET', null, token);
          setUser(updatedUser);
        } catch (error) {
          console.error('Failed to refresh user data:', error);
        }
      }
    };
    refreshUserData();
  }, [token, setUser]);

  // Clear saved data after restoring
  useEffect(() => {
    if (savedData) {
      sessionStorage.removeItem('pendingRoomCreation');
    }
  }, []);

  // Check if returning from screening and automatically advance to step 2
  useEffect(() => {
    const screeningJustCompleted = sessionStorage.getItem('screeningJustCompleted');
    if (screeningJustCompleted) {
      sessionStorage.removeItem('screeningJustCompleted');
      setStep(2); // Automatically go to "Tell me more" step
    }
  }, []);

  const handleNext = () => {
    if (step === 1) {
      if (!title.trim()) {
        alert("Please add a conversation title");
        return;
      }
      if (!category) {
        alert("Please choose a topic category");
        return;
      }

      // Skip screening - let users start mediating immediately
      // Screening can be done later from profile if needed
      setStep(2);
    } else {
      handleCreate();
    }
  };

  const handleCreate = async () => {
    if (!initialIssue.trim()) {
      alert("Please describe what you'd like to discuss");
      return;
    }

    setLoading(true);
    try {
      const room = await apiRequest("/rooms/", "POST", {
        title,
        category: category.toLowerCase() // Send category to backend
      }, token);
      sessionStorage.setItem(`room_${room.id}_initial`, initialIssue);
      navigate(`/rooms/${room.id}/coaching`);
    } catch (error) {
      alert("Error creating room: " + error.message);
    }
    setLoading(false);
  };

  if (step === 2) {
    // Step 2: Describe the issue
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: '#EAF7F0',
        padding: 'clamp(12px, 3vw, 20px)',
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
            margin: '0 0 24px 0',
            padding: '0 16px',
          }}>
            Tell me more
          </h1>

          <div style={{
            backgroundColor: '#7C6CB6',
            color: 'white',
            padding: '16px 24px',
            borderRadius: '12px',
            fontSize: '18px',
            marginBottom: '24px',
            maxWidth: '520px',
            textAlign: 'center',
          }}>
            What would you like to discuss about {category}?
          </div>

          <textarea
            value={initialIssue}
            onChange={(e) => setInitialIssue(e.target.value)}
            placeholder="Describe the situation in your own words..."
            rows={8}
            disabled={loading}
            style={{
              backgroundColor: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '16px 20px',
              fontSize: '16px',
              width: '100%',
              maxWidth: '520px',
              marginBottom: '32px',
              resize: 'vertical',
            }}
          />

          <button
            onClick={handleNext}
            disabled={loading}
            style={{
              backgroundColor: '#7DD3C0',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '16px 48px',
              fontSize: '20px',
              fontWeight: '400',
              cursor: loading ? 'not-allowed' : 'pointer',
              width: '100%',
              maxWidth: '520px',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Starting...' : 'Start with Meedi'}
          </button>

          <button
            onClick={() => setStep(1)}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              color: '#9CA3AF',
              fontSize: '16px',
              cursor: 'pointer',
              marginTop: '16px',
            }}
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // Step 1: Category selection
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
          fontSize: '40px',
          color: '#7DD3C0',
          fontWeight: '400',
          textAlign: 'center',
          margin: '0 0 16px 0',
        }}>
          <span style={{ fontWeight: '700' }}>Start</span> a Mediation
        </h1>

        {/* Down Arrow */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ marginBottom: '16px' }}>
          <path d="M12 5V19M12 19L19 12M12 19L5 12" stroke="#7DD3C0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>

        <input
          type="text"
          placeholder="Add a Conversation Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            backgroundColor: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '14px 20px',
            fontSize: '16px',
            width: '100%',
            maxWidth: '520px',
            marginBottom: '32px',
            textAlign: 'center',
          }}
        />

        <p style={{
          fontSize: '18px',
          color: '#6B7280',
          marginBottom: '24px',
          fontWeight: '500',
        }}>
          Choose a Topic Category
        </p>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '24px',
          maxWidth: '520px',
          width: '100%',
          padding: '0 16px',
        }}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.label)}
              style={{
                backgroundColor: category === cat.label ? '#7DD3C0' : 'transparent',
                color: category === cat.label ? 'white' : '#6B7280',
                border: `2px solid ${category === cat.label ? '#7DD3C0' : 'transparent'}`,
                borderRadius: '12px',
                padding: '20px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                minHeight: '120px',
                width: window.innerWidth < 480 ? 'calc(50% - 6px)' : 'calc(33.333% - 8px)',
                flex: window.innerWidth < 480 ? '0 0 calc(50% - 6px)' : '0 0 calc(33.333% - 8px)',
              }}
            >
              <CategoryIcon category={cat.id} size={90} />
            </button>
          ))}
        </div>

        <div style={{
          backgroundColor: '#7C6CB6',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '12px',
          fontSize: '18px',
          marginBottom: '32px',
          maxWidth: '400px',
          textAlign: 'center',
        }}>
          What area is the issue?
        </div>

        <button
          onClick={handleNext}
          style={{
            backgroundColor: '#7DD3C0',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '16px 48px',
            fontSize: '20px',
            fontWeight: '400',
            cursor: 'pointer',
            width: '100%',
            maxWidth: '520px',
          }}
        >
          Next
        </button>
      </div>

      {/* Character illustration placeholder - hidden on mobile */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '120px',
        height: '120px',
        opacity: 0.3,
        pointerEvents: 'none',
        display: window.innerWidth < 768 ? 'none' : 'block',
      }}>
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="30" r="15" fill="#C8B6FF" />
          <rect x="35" y="45" width="30" height="40" rx="5" fill="#7DD3C0" />
          <rect x="20" y="55" width="15" height="30" rx="3" fill="#FFB366" />
          <rect x="65" y="55" width="15" height="30" rx="3" fill="#FFB366" />
        </svg>
      </div>
    </div>
  );
}
