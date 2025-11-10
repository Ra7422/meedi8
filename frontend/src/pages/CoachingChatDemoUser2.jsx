import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CoachingChatDemoUser2() {
  const navigate = useNavigate();
  const [userInput, setUserInput] = useState("");

  // Demo data
  const user1Name = "Sarah";
  const title = "Weekend Plans Discussion";

  const mobileStyles = `
    .input-container {
      display: flex;
      gap: 8px;
      align-items: center;
      padding: 8px 16px;
      background: white;
      border-top: 1px solid #e5e7eb;
      position: sticky;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 20;
    }

    .icon-button {
      background: none;
      border: none;
      color: #6b7280;
      cursor: pointer;
      padding: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 40px;
      min-height: 40px;
      border-radius: 50%;
      transition: background 0.2s;
    }

    .icon-button:active {
      background: #f3f4f6;
    }

    .input-wrapper {
      flex: 1;
      position: relative;
      display: flex;
      align-items: center;
    }

    .chat-input {
      flex: 1;
      width: 100%;
      padding: 12px 50px 12px 16px;
      border-radius: 24px;
      border: 1px solid #e5e7eb;
      background: #f9fafb;
      font-size: 16px;
      resize: none;
      min-height: 44px;
      max-height: 120px;
      font-family: 'Nunito', sans-serif;
      line-height: 1.4;
    }

    .chat-input:focus {
      outline: none;
      border-color: #7DD3C0;
      background: white;
    }

    .mic-icon-wrapper {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      opacity: 0.5;
      cursor: pointer;
      color: #7DD3C0;
    }

    .send-button {
      background: #7DD3C0;
      color: white;
      border: none;
      min-width: 44px;
      min-height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.2s, opacity 0.2s;
      padding: 0;
    }

    .send-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: #d1d5db;
    }
  `;

  // Demo messages with User 2 (purple chat bubbles)
  const demoMessages = [
    {
      role: "intro",
      content: "I observe that we've had several disagreements about how to spend our weekends lately. I feel frustrated when my suggestions for activities get dismissed without much discussion. I need us to find a better way to plan our time together so we both feel heard and excited about what we're doing.",
      fromUser: user1Name
    },
    {
      role: "assistant",
      content: "Thank you for being here, and for being willing to engage with Sarah's perspective. I can see this matters to both of you.\n\nLet me start by asking: when you read Sarah's message, what feelings come up for you?"
    },
    {
      role: "user",
      content: "I feel defensive at first, because I don't think I dismiss her suggestions. But I also feel a bit guilty because maybe I haven't been paying enough attention."
    },
    {
      role: "assistant",
      content: "That's a really honest reflection. It takes courage to acknowledge both those feelings—the defensiveness and the guilt. Let's explore this a bit more.\n\nCan you think of a recent example where you might have responded to one of Sarah's weekend suggestions? What was going through your mind at the time?"
    },
    {
      role: "user",
      content: "Last weekend she wanted to go hiking, but I was really tired from work and just wanted to relax at home. I think I just said 'maybe another time' without really explaining why."
    }
  ];

  const handleSend = () => {
    if (userInput.trim()) {
      setUserInput("");
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #EAF7F0 0%, #ffffff 100%)',
      padding: '20px',
      fontFamily: "'Nunito', sans-serif",
    }}>
      <style>{mobileStyles}</style>

      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #9CDAD5 0%, #7DD3C0 100%)',
          padding: '20px',
          color: 'white',
          textAlign: 'center',
        }}>
          <h1 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: '700',
          }}>
            Meedi Coaching Session
          </h1>
          <p style={{ margin: '8px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
            {user1Name} wants to resolve <strong style={{ color: '#F5EFFF' }}>{title}</strong>
          </p>
        </div>

        {/* Messages */}
        <div style={{
          padding: '24px',
          maxHeight: '600px',
          overflowY: 'auto',
        }}>
          {demoMessages.map((msg, index) => {
            if (msg.role === "intro") {
              return (
                <div key={index} style={{
                  marginBottom: "24px",
                  padding: "20px",
                  background: "linear-gradient(135deg, #E8F9F5 0%, #D1F2ED 100%)",
                  borderRadius: "12px",
                  border: "2px solid #7DD3C0",
                  boxShadow: "0 4px 12px rgba(125, 211, 192, 0.2)",
                }}>
                  <p style={{
                    fontSize: "14px",
                    fontWeight: "700",
                    color: "#6750A4",
                    marginBottom: "12px",
                  }}>
                    📋 Message from {msg.fromUser}
                  </p>
                  <p style={{
                    fontSize: "15px",
                    lineHeight: "1.7",
                    color: "#374151",
                    margin: 0,
                    fontStyle: "italic",
                  }}>
                    "{msg.content}"
                  </p>
                </div>
              );
            }

            if (msg.role === "assistant") {
              return (
                <div key={index} style={{ marginBottom: "16px" }}>
                  <div style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                  }}>
                    <img
                      src="/assets/illustrations/Meedi_Profile.svg"
                      alt="Meedi"
                      style={{ width: "40px", height: "40px", flexShrink: 0 }}
                    />
                    <div style={{
                      padding: "14px 18px",
                      borderRadius: "12px",
                      background: "#FFFFFF",
                      border: "2px solid #E5E7EB",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                      flex: 1,
                    }}>
                      <p style={{
                        fontSize: "15px",
                        lineHeight: "1.7",
                        color: "#374151",
                        margin: 0,
                      }}>
                        {msg.content}
                      </p>
                    </div>
                  </div>
                </div>
              );
            }

            if (msg.role === "user") {
              return (
                <div key={index} style={{ marginBottom: "16px" }}>
                  <div style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    justifyContent: "flex-end",
                  }}>
                    <div style={{
                      padding: "14px 18px",
                      borderRadius: "12px",
                      background: "#F5EFFF",
                      border: "2px solid #CCB2FF",
                      boxShadow: "0 2px 8px rgba(204, 178, 255, 0.15)",
                      maxWidth: "80%",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                        <span style={{ fontSize: "20px" }}>👤</span>
                        <span style={{ fontSize: "14px", fontWeight: "600", color: "#6750A4" }}>You</span>
                      </div>
                      <p style={{
                        fontSize: "15px",
                        lineHeight: "1.7",
                        color: "#374151",
                        margin: 0,
                      }}>
                        {msg.content}
                      </p>
                    </div>
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>

        {/* Input Area */}
        <div className="input-container">
          {/* Plus icon for file upload */}
          <button
            className="icon-button"
            title="Upload evidence"
            style={{ color: "#7DD3C0" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          </button>

          {/* Input field with microphone inside */}
          <div className="input-wrapper">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Type your response..."
              className="chat-input"
              rows="1"
            />
            {/* Microphone icon inside input */}
            <div className="mic-icon-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
            </div>
          </div>

          {/* Send button as arrow */}
          <button
            disabled={!userInput.trim()}
            className="send-button"
            onClick={handleSend}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>

        {/* Demo Navigation */}
        <div style={{
          padding: "20px",
          background: "rgba(234, 247, 240, 0.5)",
          borderTop: "2px dashed #7DD3C0",
        }}>
          <p style={{
            fontSize: "14px",
            color: "#6750A4",
            fontWeight: "600",
            marginBottom: "12px",
            textAlign: "center",
          }}>
            📋 Demo Navigation - User 2 has purple bubbles (#CCB2FF)
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={() => navigate('/lobby-demo')}
              style={{
                padding: "8px 16px",
                background: "#FFFFFF",
                color: "#6750A4",
                border: "2px solid #CCB2FF",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              ← Lobby Demo
            </button>
            <button
              onClick={() => navigate('/coaching-demo')}
              style={{
                padding: "8px 16px",
                background: "#FFFFFF",
                color: "#7DD3C0",
                border: "2px solid #7DD3C0",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              User 1 (Teal)
            </button>
            <button
              onClick={() => navigate('/coaching-summary-demo')}
              style={{
                padding: "8px 16px",
                background: "#FFFFFF",
                color: "#6750A4",
                border: "2px solid #CCB2FF",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              → Summary Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
