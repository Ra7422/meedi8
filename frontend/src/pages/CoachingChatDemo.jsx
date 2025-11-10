import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CoachingChatDemo() {
  const navigate = useNavigate();
  const [userInput, setUserInput] = useState("");

  // Sample conversation data
  const demoMessages = [
    {
      role: "assistant",
      content: "Hi there! I'm Meedi, your AI mediator. I'm here to help you prepare for a productive conversation. To start, can you tell me what brings you here today? What's the main issue or situation you'd like to discuss?"
    },
    {
      role: "user",
      content: "My partner and I have been arguing about money. They spend too much on things we don't need, and it's causing stress in our relationship."
    },
    {
      role: "assistant",
      content: "Thank you for sharing that. Money disagreements can be really challenging. Let me ask - when these arguments happen, how do you typically feel? Are there specific emotions that come up for you?"
    },
    {
      role: "user",
      content: "I feel frustrated and worried. I'm concerned about our future and whether we'll be able to save for important things like a house or retirement."
    },
    {
      role: "assistant",
      content: "I can hear that this is causing you significant worry about your future together. That's completely understandable. Can you tell me about a recent specific example when this happened? What was purchased, and what was your reaction?"
    },
    {
      role: "user",
      content: "Last week they bought a new gaming console even though we agreed to save money this month. I got really upset and we ended up not talking for two days."
    },
    {
      role: "assistant",
      content: "That sounds like a difficult situation. When you're in this conversation with them, what would be your ideal outcome? What would make you feel like the conversation was successful?"
    }
  ];

  const mobileStyles = `
    .coaching-header {
      margin: 0;
      padding: 16px 20px;
      font-size: 18px;
      border-bottom: 1px solid #e5e7eb;
      background: white;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 16px 20px 80px 20px;
      background: #f9fafb;
      -webkit-overflow-scrolling: touch;
    }

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

    .send-button:not(:disabled):active {
      background: #6BC5B8;
    }

    /* Desktop styles */
    @media (min-width: 769px) {
      .coaching-header {
        padding: 20px 24px;
        position: static;
        font-size: 24px;
      }

      .messages-container {
        padding: 20px 24px 20px 24px;
        border-radius: 12px;
        margin-bottom: 20px;
      }

      .input-container {
        position: static;
        padding: 0;
        border-top: none;
        background: transparent;
        gap: 12px;
      }

      .chat-input {
        border-radius: 12px;
        min-height: 60px;
        font-size: 14px;
      }

      .send-button {
        border-radius: 12px;
        min-width: 60px;
        padding: 12px 20px;
      }
    }
  `;

  return (
    <div style={{
      maxWidth: "800px",
      margin: "0 auto",
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      position: "relative",
      fontFamily: "'Nunito', sans-serif"
    }}>
      <style>{mobileStyles}</style>

      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 20px",
        borderBottom: "2px solid #E5E7EB",
        background: "white"
      }}>
        <h2 style={{
          margin: 0,
          fontSize: "20px",
          color: "#7DD3C0",
          fontWeight: "700"
        }}>
          Meedi Coaching Session (Demo)
        </h2>
        <button
          onClick={() => navigate("/")}
          style={{
            padding: "8px 16px",
            background: "#F3F4F6",
            border: "2px solid #E5E7EB",
            borderRadius: "8px",
            fontSize: "14px",
            cursor: "pointer",
            fontFamily: "'Nunito', sans-serif",
            fontWeight: "600",
            color: "#6B7280"
          }}
        >
          Exit Demo
        </button>
      </div>

      <div className="messages-container" style={{ paddingBottom: "80px" }}>
        {demoMessages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              marginBottom: "16px",
              padding: "14px 18px",
              borderRadius: "12px",
              background: msg.role === "user" ? "#E8F9F5" : "#FFFFFF",
              border: msg.role === "assistant" ? "2px solid #E5E7EB" : "2px solid #7DD3C0",
              maxWidth: "85%",
              marginLeft: msg.role === "user" ? "auto" : "0",
              marginRight: msg.role === "user" ? "0" : "auto",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
            }}
          >
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "8px"
            }}>
              {msg.role === "assistant" && (
                <div style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "#E8F9F5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  border: "2px solid #7DD3C0"
                }}>
                  <img
                    src="/assets/illustrations/Meedi_Profile.svg"
                    alt="Meedi"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover"
                    }}
                  />
                </div>
              )}
              {msg.role === "user" && (
                <div style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "#EDE9FE",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  border: "2px solid #7C6CB6"
                }}>
                  👤
                </div>
              )}
              <strong style={{
                fontSize: "14px",
                color: msg.role === "user" ? "#1F7A5C" : "#6B7280",
                fontWeight: "700"
              }}>
                {msg.role === "user" ? "You" : "Meedi"}
              </strong>
            </div>
            <p style={{
              margin: 0,
              whiteSpace: "pre-wrap",
              lineHeight: "1.6",
              color: "#374151",
              fontSize: "15px"
            }}>
              {msg.content}
            </p>
          </div>
        ))}
      </div>

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
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>

      {/* Next button to go to summary page */}
        <div style={{
          position: "fixed",
          bottom: "80px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 100
        }}>
          <button
            onClick={() => navigate("/coaching-summary-demo")}
            style={{
              padding: "14px 32px",
              background: "#7DD3C0",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: "700",
              cursor: "pointer",
              fontFamily: "'Nunito', sans-serif",
              boxShadow: "0 4px 12px rgba(125, 211, 192, 0.3)"
            }}
          >
            Next →
          </button>
        </div>

      {/* Demo Note */}
      <div style={{
        position: "fixed",
        top: "80px",
        right: "20px",
        background: "#FEF3E2",
        border: "2px solid #F59E0B",
        borderRadius: "12px",
        padding: "12px 16px",
        fontSize: "13px",
        color: "#92400E",
        maxWidth: "250px",
        zIndex: 100,
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
      }}>
        <strong>📌 Demo Mode</strong>
        <p style={{ margin: "4px 0 0 0", fontSize: "12px" }}>
          This is a sample conversation showing the coaching chat layout.
        </p>
      </div>
    </div>
  );
}
