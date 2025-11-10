import React, { useState, useRef, useEffect } from "react";
import SimpleBreathing from "../components/SimpleBreathing";

/**
 * MainRoom UI Demo - No backend required
 * Shows the visual design of the main mediation room with sample data
 */
export default function MainRoomDemo() {
  const [userInput, setUserInput] = useState("");
  const [showBreathing, setShowBreathing] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Mock data - showing both users in the main room
  const mockUser = {
    id: 1,
    name: "Sarah",
    profile_picture_url: null // Will show emoji fallback
  };

  const mockSummaries = {
    user1_id: 1,
    user2_id: 2,
    user1_name: "Sarah",
    user2_name: "Mike"
  };

  // Sample messages showing the flow
  const messages = [
    {
      role: "summary",
      content: "I observe that I'm the only one who washes the dishes - when I wash mine, yours sit in the sink for 3+ days. I feel frustrated and disrespected because I need order and consideration in our shared space. At the same time, I imagine you might be overwhelmed with work and not intentionally avoiding the dishes.",
      fromUser: "Mike"
    },
    {
      role: "assistant",
      content: "Welcome to the mediation. I've reviewed both of your perspectives, and I'm here to help you work through this together.\n\nLet's start by making sure you both feel heard. Sarah, I see you're concerned about the dishes and household responsibilities. Mike, you've shared your perspective about feeling overwhelmed.\n\nSarah, could you start by sharing what's most important to you in this situation?"
    },
    {
      role: "user",
      content: "Thanks for facilitating this. I really appreciate Mike sharing his perspective. What's most important to me is feeling like we're partners in taking care of our home. I don't mind doing my share, but when the dishes pile up for days, it makes me feel like I'm carrying all the responsibility.",
      user_id: 1
    },
    {
      role: "assistant",
      content: "Thank you for sharing that, Sarah. I hear that partnership and shared responsibility are really important to you.\n\nMike, what did you hear Sarah say just now? And how does that land for you?"
    },
    {
      role: "user",
      content: "I heard Sarah say she wants to feel like we're partners and that she's carrying too much responsibility. That makes sense, and I can see how it would feel that way. I've been so overwhelmed with my project deadline that I've let things slide. I do want to be a better partner.",
      user_id: 2
    },
    {
      role: "assistant",
      content: "Mike, thank you for that reflection. I can hear that you do care about being a good partner, and you're acknowledging the impact of the deadline.\n\nWhat I'm noticing is that you both value partnership and want the home to feel balanced. Sarah needs order and consideration. Mike, you're dealing with work pressure.\n\nLet's explore: What would partnership around household tasks look like for both of you?"
    }
  ];

  const isUser1 = mockUser.id === mockSummaries.user1_id;
  const currentSpeakerId = 1; // Demo: User 1's turn

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>Main Room Demo</h1>
          <div style={styles.subtitle}>Mediation between Sarah and Mike</div>
        </div>
      </div>

      {/* Messages */}
      <div style={styles.messagesContainer}>
        {messages.map((msg, idx) => {
          const isCurrentUser = msg.user_id === mockUser.id;
          const isSummary = msg.role === "summary";
          const isAssistant = msg.role === "assistant";

          if (isSummary) {
            // Summary card - special styling
            return (
              <div key={idx} style={styles.messageWrapper}>
                <div style={styles.summaryCard}>
                  <div style={styles.summaryHeader}>
                    <strong style={styles.summaryLabel}>
                      📋 {msg.fromUser}'s Perspective
                    </strong>
                  </div>
                  <div style={styles.summaryContent}>{msg.content}</div>
                </div>
              </div>
            );
          }

          if (isAssistant) {
            // AI Mediator message
            return (
              <div key={idx} style={styles.messageWrapper}>
                <div style={styles.assistantMessage}>
                  <div style={styles.meediIcon}>🧘</div>
                  <div style={styles.assistantContent}>{msg.content}</div>
                </div>
              </div>
            );
          }

          // User message
          const isUser1Message = msg.user_id === mockSummaries.user1_id;
          return (
            <div key={idx} style={styles.messageWrapper}>
              <div
                style={{
                  ...styles.userMessage,
                  alignSelf: isCurrentUser ? "flex-end" : "flex-start",
                  background: isUser1Message
                    ? "linear-gradient(135deg, #E8F9F5 0%, #D1F2ED 100%)"
                    : "linear-gradient(135deg, #F5EFFF 0%, #E8DEFF 100%)",
                  border: isUser1Message
                    ? "2px solid #7DD3C0"
                    : "2px solid #CCB2FF"
                }}
              >
                <div style={styles.userMessageHeader}>
                  {isCurrentUser && mockUser.profile_picture_url ? (
                    <img
                      src={mockUser.profile_picture_url}
                      alt="User"
                      style={{
                        ...styles.profilePic,
                        border: `2px solid ${isUser1Message ? "#7DD3C0" : "#CCB2FF"}`
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        ...styles.profilePlaceholder,
                        background: isUser1Message ? "#7DD3C0" : "#CCB2FF"
                      }}
                    >
                      👤
                    </div>
                  )}
                  <span style={styles.userName}>
                    {isUser1Message ? mockSummaries.user1_name : mockSummaries.user2_name}
                  </span>
                </div>
                <div style={styles.userMessageContent}>{msg.content}</div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Matches CoachingChat styling */}
      <div style={{ position: "relative" }}>
        {/* Pause button - overlaps chat area */}
        <button
          onClick={() => setShowBreathing(true)}
          style={styles.pauseButton}
          title="Take a breathing break"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1"/>
            <rect x="14" y="4" width="4" height="16" rx="1"/>
          </svg>
          <span>Need a break?</span>
        </button>

        <div style={styles.inputContainer}>
        {currentSpeakerId !== mockUser.id ? (
          <div style={styles.waitingMessage}>
            Waiting for {isUser1 ? mockSummaries.user2_name : mockSummaries.user1_name}'s response...
          </div>
        ) : (
          <>
            {/* Plus icon for file upload */}
            <button
              type="button"
              style={styles.iconButton}
              title="Upload evidence"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
            </button>

            {/* Input wrapper with microphone inside */}
            <div style={styles.inputWrapper}>
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type your response..."
                style={styles.chatInput}
                rows={1}
              />
              {/* Microphone icon inside input */}
              <div style={styles.micIconWrapper}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" opacity="0.5">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              </div>
            </div>

            {/* Send button as arrow */}
            <button
              type="button"
              style={styles.sendButton}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </>
        )}
        </div>
      </div>

      {/* Breathing Modal */}
      {showBreathing && (
        <div style={styles.breathingOverlay}>
          <div style={styles.breathingModal}>
            <h2 style={styles.breathingTitle}>Take a Breathing Break</h2>
            <p style={styles.breathingSubtitle}>
              {mockUser.name} needs a moment
            </p>

            {/* Custom encouragement message for main room breaks */}
            <div style={styles.breathingEncouragement}>
              ✨ Sometimes it can feel overwhelming, and that's okay. {mockUser.name} is still here and wants to resolve this with you. This is a good time to take a breath and re-center yourself.
            </div>

            <SimpleBreathing startCountdown={true} allowRestart={true} hideEncouragement={true} />

            <div style={styles.breathingHint}>
              Tap the circle to restart the exercise
            </div>

            <button
              onClick={() => setShowBreathing(false)}
              style={styles.readyButton}
            >
              Ready to Continue
            </button>
          </div>
        </div>
      )}

      {/* Demo Info */}
      <div style={styles.demoInfo}>
        ℹ️ This is a UI demo with mock data - no backend connection
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: "linear-gradient(180deg, #EAF7F0 0%, #ffffff 100%)",
    fontFamily: "'Nunito', sans-serif"
  },
  header: {
    background: "white",
    borderBottom: "2px solid #E8F9F5",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
  },
  headerContent: {
    maxWidth: "900px",
    margin: "0 auto"
  },
  title: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#7DD3C0",
    margin: "0 0 8px 0"
  },
  subtitle: {
    fontSize: "16px",
    fontWeight: "300",
    color: "#6B7280"
  },
  messagesContainer: {
    flex: 1,
    overflowY: "auto",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    maxWidth: "900px",
    margin: "0 auto",
    width: "100%"
  },
  messageWrapper: {
    display: "flex",
    flexDirection: "column"
  },
  summaryCard: {
    maxWidth: "85%",
    alignSelf: "center",
    padding: "20px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #E8F9F5 0%, #D1F2ED 100%)",
    border: "2px solid #7DD3C0",
    boxShadow: "0 4px 12px rgba(125, 211, 192, 0.2)"
  },
  summaryHeader: {
    marginBottom: "12px"
  },
  summaryLabel: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#6750A4"
  },
  summaryContent: {
    fontSize: "15px",
    lineHeight: "1.6",
    color: "#1f2937",
    fontWeight: "400"
  },
  assistantMessage: {
    maxWidth: "75%",
    alignSelf: "flex-start",
    background: "white",
    border: "2px solid #E5E7EB",
    borderRadius: "12px",
    padding: "14px 18px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
  },
  meediIcon: {
    fontSize: "20px",
    marginBottom: "8px"
  },
  assistantContent: {
    fontSize: "15px",
    lineHeight: "1.6",
    color: "#1f2937",
    whiteSpace: "pre-wrap"
  },
  userMessage: {
    maxWidth: "75%",
    padding: "14px 18px",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
  },
  userMessageHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px"
  },
  profilePic: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    objectFit: "cover"
  },
  profilePlaceholder: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px"
  },
  userName: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#1f2937"
  },
  userMessageContent: {
    fontSize: "15px",
    lineHeight: "1.6",
    color: "#1f2937",
    fontWeight: "400"
  },
  inputContainer: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    padding: "20px",
    background: "white",
    borderTop: "1px solid #e5e7eb",
    maxWidth: "900px",
    margin: "0 auto",
    width: "100%"
  },
  waitingMessage: {
    width: "100%",
    padding: "16px",
    textAlign: "center",
    background: "#F9FAFB",
    borderRadius: "12px",
    color: "#6B7280",
    fontSize: "15px",
    fontStyle: "italic"
  },
  iconButton: {
    background: "none",
    border: "none",
    color: "#7DD3C0",
    cursor: "pointer",
    padding: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "40px",
    minHeight: "40px",
    borderRadius: "50%",
    transition: "background 0.2s"
  },
  inputWrapper: {
    flex: 1,
    position: "relative",
    display: "flex",
    alignItems: "center"
  },
  chatInput: {
    flex: 1,
    width: "100%",
    padding: "12px 50px 12px 16px",
    borderRadius: "24px",
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
    fontSize: "16px",
    resize: "none",
    minHeight: "44px",
    maxHeight: "120px",
    fontFamily: "'Nunito', sans-serif",
    lineHeight: "1.4",
    outline: "none"
  },
  micIconWrapper: {
    position: "absolute",
    right: "8px",
    top: "50%",
    transform: "translateY(-50%)",
    opacity: 0.5,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#6b7280"
  },
  sendButton: {
    background: "#7DD3C0",
    color: "white",
    border: "none",
    minWidth: "44px",
    minHeight: "44px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "background 0.2s",
    padding: 0
  },
  pauseButton: {
    position: "absolute",
    top: "-32px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "rgba(107, 114, 128, 0.8)",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "20px",
    padding: "8px 16px",
    color: "white",
    fontSize: "13px",
    fontWeight: "500",
    fontFamily: "'Nunito', sans-serif",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.2s",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    zIndex: 10,
    whiteSpace: "nowrap"
  },
  breathingOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.7)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000,
    padding: "20px"
  },
  breathingModal: {
    background: "linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%)",
    borderRadius: "16px",
    padding: "32px",
    maxWidth: "600px",
    width: "100%",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
  },
  breathingTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#CCB2FF",
    margin: "0 0 8px 0",
    textAlign: "center",
    fontFamily: "'Nunito', sans-serif"
  },
  breathingSubtitle: {
    fontSize: "15px",
    fontWeight: "400",
    color: "#CCB2FF",
    margin: "0 0 16px 0",
    textAlign: "center",
    fontFamily: "'Nunito', sans-serif"
  },
  breathingEncouragement: {
    fontSize: "14px",
    lineHeight: "1.6",
    color: "#c4b5fd",
    margin: "0 0 20px 0",
    padding: "12px 16px",
    background: "rgba(139, 92, 246, 0.1)",
    borderRadius: "8px",
    border: "1px solid rgba(139, 92, 246, 0.3)",
    textAlign: "center",
    fontFamily: "'Nunito', sans-serif"
  },
  breathingHint: {
    fontSize: "12px",
    color: "#9CA3AF",
    textAlign: "center",
    fontFamily: "'Nunito', sans-serif",
    opacity: 0.8,
    marginTop: "12px"
  },
  readyButton: {
    width: "100%",
    padding: "16px",
    fontSize: "16px",
    fontWeight: "600",
    fontFamily: "'Nunito', sans-serif",
    background: "#7DD3C0",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.2s",
    marginTop: "24px"
  },
  demoInfo: {
    position: "fixed",
    bottom: "20px",
    left: "20px",
    padding: "12px 16px",
    background: "#6750A4",
    color: "white",
    borderRadius: "8px",
    fontSize: "13px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    zIndex: 1000
  }
};
