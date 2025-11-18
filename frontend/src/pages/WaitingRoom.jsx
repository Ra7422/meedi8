import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api/client";
import SimpleBreathing from "../components/SimpleBreathing";
import ShareButtons from "../components/ShareButtons";
import FloatingMenu from "../components/FloatingMenu";
import { Logo } from "../components/ui";
import SpeechBubble from "../components/ui/SpeechBubble";
import CategoryIcon from "../components/ui/CategoryIcon";

const categories = [
  { id: 'work', label: 'Work' },
  { id: 'family', label: 'Family' },
  { id: 'romance', label: 'Romance' },
  { id: 'money', label: 'Money' },
  { id: 'other', label: 'Other' },
];

export default function WaitingRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [roomData, setRoomData] = useState(null);
  const [inviteLink, setInviteLink] = useState("");
  const [hasShared, setHasShared] = useState(false);

  // Room Setup State
  const [step, setStep] = useState(1); // 1 = setup, 2 = describe issue, 3 = waiting
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'What would you like to discuss?' }
  ]);
  const [currentMessage, setCurrentMessage] = useState("");

  useEffect(() => {
    loadRoomData();
  }, [roomId, token]);

  // Poll to check if User 2 has joined
  useEffect(() => {
    if (!roomData) return;

    const pollRoomStatus = async () => {
      try {
        const response = await apiRequest(`/rooms/${roomId}/status`, "GET", null, token);

        // If room phase has moved beyond user2_lobby, navigate to main room
        if (response.phase === "main_room" || response.phase === "in_session") {
          navigate(`/main-room/${roomId}`);
        }
      } catch (error) {
        console.error("Error polling room status:", error);
      }
    };

    const interval = setInterval(pollRoomStatus, 3000);
    return () => clearInterval(interval);
  }, [roomId, token, navigate, roomData]);

  const loadRoomData = async () => {
    try {
      // Get the room data including invite token
      const response = await apiRequest(`/rooms/${roomId}`, "GET", null, token);
      setRoomData(response);

      // Construct invite link
      if (response.invite_token) {
        // Use production domain for invite links (required for Telegram OAuth)
        const link = `https://meedi8.com/join/${response.invite_token}`;
        setInviteLink(link);
      }
    } catch (error) {
      console.error("Error loading room:", error);
      alert("Error loading room data");
    } finally {
      setLoading(false);
    }
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

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
      setStep(2);
    } else if (step === 2) {
      // Move to waiting step
      setStep(3);
    }
  };

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;

    setMessages([...messages, { role: 'user', content: currentMessage }]);
    setCurrentMessage("");

    // Simulate AI response (in real app, this would call backend)
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Tell me more about that. What happened?'
      }]);
    }, 1000);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (!roomData) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>Error loading room data</div>
      </div>
    );
  }

  // Step 1: Room Setup - Title and Category
  if (step === 1) {
    return (
      <div style={styles.container}>
        {/* Ellipses for depth */}
        <div style={styles.topEllipse} />

        {/* Header with Logo */}
        <div style={styles.header}>
          <div style={styles.logoContainer}>
            <Logo size={isMobile ? 180 : 240} />
          </div>
        </div>

        {/* Decorative wave */}
        <svg style={styles.wave} viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path
            d="M0,40 Q360,80 720,40 T1440,40 L1440,0 L0,0 Z"
            fill="#7DD3C0"
            opacity="0.1"
          />
        </svg>

        {/* Main Content */}
        <div style={styles.content}>
          <h1 style={styles.headline}>Start a Mediation</h1>

          <input
            type="text"
            placeholder="Add a Conversation Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={styles.titleInput}
          />

          <p style={styles.categoryLabel}>Choose a Topic Category</p>

          <div style={styles.categoryGrid}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                style={{
                  ...styles.categoryButton,
                  backgroundColor: category === cat.id ? '#7DD3C0' : 'white',
                  color: category === cat.id ? 'white' : '#6B7280',
                  border: `2px solid ${category === cat.id ? '#7DD3C0' : '#E5E7EB'}`,
                }}
              >
                <CategoryIcon category={cat.id} size={isMobile ? 40 : 48} />
                <span style={styles.categoryText}>{cat.label}</span>
              </button>
            ))}
          </div>

          <button onClick={handleNext} style={styles.nextButton}>
            Next
          </button>
        </div>

        {/* Mascot with Speech Bubble */}
        <div style={styles.mascotContainer}>
          <SpeechBubble style={{
            ...styles.speechBubble,
            width: isMobile ? '161px' : '230px',
            height: isMobile ? '89px' : '127px',
          }}>
            <div style={{ color: '#9CDAD5', fontSize: isMobile ? '14px' : '18px', fontWeight: '400', textAlign: 'center' }}>
              What area is the issue?
            </div>
          </SpeechBubble>
          <img
            src="/assets/illustrations/lifesavers-sitting.svg"
            alt="Character"
            style={{
              ...styles.mascot,
              width: isMobile ? '129px' : '184px',
              height: isMobile ? '105px' : '150px',
            }}
          />
        </div>

        <div style={styles.bottomEllipse} />
      </div>
    );
  }

  // Step 2: Describe the Issue
  if (step === 2) {
    return (
      <div style={styles.container}>
        <div style={styles.topEllipse} />

        <div style={styles.header}>
          <div style={styles.logoContainer}>
            <Logo size={isMobile ? 180 : 240} />
          </div>
        </div>

        <svg style={styles.wave} viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path
            d="M0,40 Q360,80 720,40 T1440,40 L1440,0 L0,0 Z"
            fill="#7DD3C0"
            opacity="0.1"
          />
        </svg>

        <div style={styles.content}>
          <p style={styles.conversationTitle}>[{title}]</p>
          <h1 style={styles.headline}>Describe the Issue</h1>

          {/* Chat-like interface */}
          <div style={styles.chatContainer}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  ...styles.messageBubble,
                  backgroundColor: msg.role === 'assistant' ? '#C8B6FF' : '#3B82F6',
                  alignSelf: msg.role === 'assistant' ? 'flex-start' : 'flex-end',
                  marginLeft: msg.role === 'assistant' ? '0' : 'auto',
                  marginRight: msg.role === 'user' ? '0' : 'auto',
                }}
              >
                <p style={styles.messageText}>{msg.content}</p>
              </div>
            ))}
          </div>

          {/* Message input */}
          <div style={styles.messageInputContainer}>
            <input
              type="text"
              placeholder="Message"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              style={styles.messageInput}
            />
            <button onClick={handleSendMessage} style={styles.sendButton}>
              Send
            </button>
          </div>

          <button
            onClick={handleNext}
            style={{...styles.nextButton, marginTop: '20px'}}
          >
            Continue to Waiting Room
          </button>
        </div>

        <div style={styles.mascotContainer}>
          <SpeechBubble style={{
            ...styles.speechBubble,
            width: isMobile ? '154px' : '220px',
            height: isMobile ? '85px' : '122px',
          }}>
            <div style={{ color: '#9CDAD5', fontSize: isMobile ? '12px' : '16px', fontWeight: '400', textAlign: 'center', lineHeight: '1.3' }}>
              Be as detailed as you can
            </div>
          </SpeechBubble>
          <img
            src="/assets/illustrations/lifesavers-sitting.svg"
            alt="Character"
            style={{
              ...styles.mascot,
              width: isMobile ? '129px' : '184px',
              height: isMobile ? '105px' : '150px',
            }}
          />
        </div>

        <div style={styles.bottomEllipse} />
      </div>
    );
  }

  // Step 3: Waiting for Partner (Original WaitingRoom content)
  return (
    <div style={styles.container}>
      <div style={styles.topEllipse} />

      <div style={styles.header}>
        <div style={styles.logoContainer}>
          <Logo size={isMobile ? 180 : 240} />
        </div>
      </div>

      <FloatingMenu />

      <div style={styles.waitingContent}>
        <div style={styles.waitingHeader}>
          <h1 style={styles.waitingTitle}>Waiting for Your Partner</h1>
          <p style={styles.waitingSubtitle}>
            Share the link below to invite them to join the mediation
          </p>
        </div>

        <div style={styles.inviteSection}>
          <h2 style={styles.sectionTitle}>Share Invitation</h2>
          <p style={styles.inviteText}>
            Send this link to the other person so they can join:
          </p>

          {inviteLink && (
            <ShareButtons
              inviteLink={inviteLink}
              onShare={() => setHasShared(true)}
            />
          )}
        </div>

        <div style={styles.summarySection}>
          <h2 style={styles.sectionTitle}>Your Perspective Summary</h2>
          <div style={styles.summaryBox}>
            <p style={styles.summaryText}>
              {roomData.user1_summary || "Your summary will appear here"}
            </p>
          </div>
          <p style={styles.summaryNote}>
            This summary was created from your coaching session. The other person
            will see this when you begin the mediation together.
          </p>
        </div>

        <div style={styles.breathingSection}>
          <h2 style={styles.sectionTitle}>Take a Breath While You Wait</h2>
          <p style={styles.breathingText}>
            Center yourself for a calm, productive conversation
          </p>
          <div style={styles.breathingContainer}>
            <SimpleBreathing startCountdown={hasShared} allowRestart={true} />
          </div>
        </div>

        <div style={styles.statusIndicator}>
          <div style={styles.pulsingDot}></div>
          <span style={styles.statusText}>Waiting for partner to join...</span>
        </div>
      </div>

      <div style={styles.bottomEllipse} />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 30px',
  },
  logoContainer: {
    // Logo positioning
  },
  wave: {
    position: 'absolute',
    top: '100px',
    left: 0,
    width: '100%',
    height: '120px',
    zIndex: 0,
  },
  content: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px 20px 180px',
    maxWidth: '600px',
    margin: '0 auto',
    minHeight: 'calc(100vh - 120px)',
    justifyContent: 'flex-start',
  },
  headline: {
    fontSize: 'clamp(32px, 6vw, 48px)',
    fontWeight: '300',
    color: '#7DD3C0',
    lineHeight: '1.2',
    margin: '0 0 24px 0',
    textAlign: 'center',
  },
  conversationTitle: {
    fontSize: '16px',
    fontWeight: '400',
    color: '#9CA3AF',
    margin: '0 0 8px 0',
    textAlign: 'center',
  },
  titleInput: {
    width: '100%',
    maxWidth: '520px',
    padding: '16px 24px',
    fontSize: '16px',
    fontWeight: '300',
    fontFamily: "'Nunito', sans-serif",
    border: 'none',
    borderRadius: '12px',
    backgroundColor: 'white',
    color: '#1f2937',
    outline: 'none',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    textAlign: 'center',
    marginBottom: '32px',
  },
  categoryLabel: {
    fontSize: '18px',
    fontWeight: '400',
    color: '#9CA3AF',
    marginBottom: '20px',
    textAlign: 'center',
  },
  categoryGrid: {
    display: 'grid',
    gridTemplateColumns: window.innerWidth < 480 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
    gap: '12px',
    marginBottom: '40px',
    width: '100%',
    maxWidth: '520px',
  },
  categoryButton: {
    padding: '16px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderRadius: '12px',
    transition: 'all 0.2s ease',
    minHeight: '100px',
    fontFamily: "'Nunito', sans-serif",
  },
  categoryText: {
    fontSize: '14px',
    fontWeight: '500',
  },
  nextButton: {
    width: '100%',
    maxWidth: '520px',
    padding: '16px',
    fontSize: '20px',
    fontWeight: '400',
    fontFamily: "'Nunito', sans-serif",
    border: 'none',
    borderRadius: '12px',
    backgroundColor: '#7DD3C0',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  chatContainer: {
    width: '100%',
    maxWidth: '520px',
    minHeight: '300px',
    maxHeight: '400px',
    overflowY: 'auto',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '12px',
    border: '3px solid #7DD3C0',
    marginBottom: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: '12px 16px',
    borderRadius: '12px',
    color: 'white',
  },
  messageText: {
    fontSize: '15px',
    fontWeight: '400',
    margin: 0,
    lineHeight: '1.4',
  },
  messageInputContainer: {
    width: '100%',
    maxWidth: '520px',
    display: 'flex',
    gap: '8px',
    marginBottom: '8px',
  },
  messageInput: {
    flex: 1,
    padding: '16px 20px',
    fontSize: '16px',
    fontWeight: '300',
    fontFamily: "'Nunito', sans-serif",
    border: '2px solid #7DD3C0',
    borderRadius: '12px',
    backgroundColor: 'white',
    color: '#1f2937',
    outline: 'none',
  },
  sendButton: {
    padding: '16px 32px',
    fontSize: '16px',
    fontWeight: '400',
    fontFamily: "'Nunito', sans-serif",
    border: 'none',
    borderRadius: '12px',
    backgroundColor: '#7DD3C0',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  mascotContainer: {
    position: 'fixed',
    bottom: '0px',
    right: '10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    zIndex: 10,
  },
  speechBubble: {
    marginBottom: '-20px',
    marginRight: '30px',
  },
  mascot: {
    position: 'relative',
    zIndex: 1,
  },
  // Waiting Room (Step 3) specific styles
  waitingContent: {
    position: 'relative',
    zIndex: 1,
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
  },
  waitingHeader: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  waitingTitle: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#7DD3C0',
    margin: '0 0 12px 0',
  },
  waitingSubtitle: {
    fontSize: '16px',
    fontWeight: '300',
    color: '#6b7280',
    margin: 0,
  },
  inviteSection: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '2px solid #7DD3C0',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 12px 0',
  },
  inviteText: {
    fontSize: '14px',
    fontWeight: '300',
    color: '#6b7280',
    margin: '0 0 16px 0',
  },
  summarySection: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  summaryBox: {
    background: '#f9fafb',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '12px',
    border: '1px solid #e5e7eb',
  },
  summaryText: {
    fontSize: '15px',
    fontWeight: '300',
    lineHeight: '1.6',
    color: '#374151',
    margin: 0,
    whiteSpace: 'pre-wrap',
  },
  summaryNote: {
    fontSize: '13px',
    fontWeight: '300',
    color: '#6b7280',
    margin: 0,
    fontStyle: 'italic',
  },
  breathingSection: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  breathingText: {
    fontSize: '14px',
    fontWeight: '300',
    color: '#6b7280',
    margin: '0 0 16px 0',
  },
  breathingContainer: {
    background: '#f0f9ff',
    borderRadius: '8px',
    padding: '20px',
    border: '1px solid #bae6fd',
  },
  statusIndicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '16px',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  pulsingDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: '#f59e0b',
    animation: 'pulse 2s infinite',
  },
  statusText: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#f59e0b',
  },
  loading: {
    textAlign: 'center',
    padding: '60px',
    fontSize: '18px',
    fontWeight: '300',
    color: '#6b7280',
  },
  error: {
    textAlign: 'center',
    padding: '60px',
    fontSize: '18px',
    fontWeight: '400',
    color: '#ef4444',
  },
};
