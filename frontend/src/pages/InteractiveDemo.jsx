import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../api/client";

export default function InteractiveDemo() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm Meedi, your AI mediation coach. I'll guide you through understanding your perspective on a conflict. What would you like to discuss today?"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [showConversion, setShowConversion] = useState(false);
  const messagesEndRef = useRef(null);
  const MAX_TURNS = 3;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");

    // Add user message immediately
    const newMessages = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);

    // Check if limit reached
    if (turnCount >= MAX_TURNS) {
      setShowConversion(true);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/demo/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          conversation: messages // Send history for context
        })
      });

      if (!response.ok) {
        if (response.status === 429) {
          // Demo limit reached
          setShowConversion(true);
          return;
        }
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // Add AI response
      setMessages([...newMessages, { role: "assistant", content: data.response }]);
      setTurnCount(data.turn_count);

      // Show conversion modal if complete
      if (data.is_complete) {
        setTimeout(() => setShowConversion(true), 1000);
      }
    } catch (error) {
      console.error("Demo error:", error);
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again or create an account to continue."
        }
      ]);
      setShowConversion(true);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const mobileStyles = `
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .demo-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      height: 100dvh;
      background: #f9fafb;
      position: relative;
      overflow: hidden;
    }

    .demo-header {
      margin: 0;
      padding: 16px 20px;
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      border-bottom: 1px solid #e5e7eb;
      background: white;
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .demo-badge {
      background: #fef3c7;
      color: #92400e;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .demo-notice {
      background: #fffbeb;
      border-bottom: 1px solid #fde68a;
      padding: 8px 20px;
      font-size: 13px;
      color: #92400e;
      text-align: center;
    }

    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 16px 20px 80px 20px;
      background: #f9fafb;
      -webkit-overflow-scrolling: touch;
    }

    .message {
      margin-bottom: 16px;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .message-bubble {
      padding: 12px 16px;
      border-radius: 18px;
      max-width: 85%;
      word-wrap: break-word;
      line-height: 1.5;
      font-size: 15px;
    }

    .message.user {
      display: flex;
      justify-content: flex-end;
    }

    .message.user .message-bubble {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-bottom-right-radius: 4px;
    }

    .message.assistant {
      display: flex;
      justify-content: flex-start;
    }

    .message.assistant .message-bubble {
      background: white;
      color: #111827;
      border: 1px solid #e5e7eb;
      border-bottom-left-radius: 4px;
    }

    .loading-indicator {
      display: flex;
      gap: 4px;
      padding: 12px 16px;
    }

    .loading-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #9ca3af;
      animation: bounce 1.4s infinite ease-in-out;
    }

    .loading-dot:nth-child(1) {
      animation-delay: -0.32s;
    }

    .loading-dot:nth-child(2) {
      animation-delay: -0.16s;
    }

    @keyframes bounce {
      0%, 80%, 100% {
        transform: scale(0);
      }
      40% {
        transform: scale(1);
      }
    }

    .input-container {
      display: flex;
      gap: 8px;
      align-items: center;
      padding: 12px 16px;
      background: white;
      border-top: 1px solid #e5e7eb;
      position: sticky;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 20;
    }

    .input-wrapper {
      flex: 1;
      position: relative;
      display: flex;
      align-items: center;
    }

    .chat-input {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #e5e7eb;
      border-radius: 24px;
      font-size: 15px;
      font-family: inherit;
      resize: none;
      outline: none;
      background: #f9fafb;
      max-height: 120px;
      transition: all 0.2s;
    }

    .chat-input:focus {
      border-color: #667eea;
      background: white;
    }

    .send-button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      color: white;
      cursor: pointer;
      padding: 12px 24px;
      border-radius: 24px;
      font-size: 15px;
      font-weight: 600;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .send-button:active {
      transform: scale(0.95);
    }

    .send-button:disabled {
      background: #d1d5db;
      cursor: not-allowed;
    }

    /* Conversion Modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
      animation: fadeIn 0.3s;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal-content {
      background: white;
      border-radius: 16px;
      padding: 32px;
      max-width: 400px;
      width: 100%;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      animation: slideUp 0.3s;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .modal-content h2 {
      margin: 0 0 12px 0;
      font-size: 24px;
      color: #111827;
    }

    .modal-content p {
      margin: 0 0 24px 0;
      color: #6b7280;
      font-size: 15px;
      line-height: 1.6;
    }

    .modal-buttons {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .modal-button {
      padding: 14px 24px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      width: 100%;
    }

    .modal-button.primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .modal-button.primary:active {
      transform: scale(0.98);
    }

    .modal-button.secondary {
      background: white;
      color: #6b7280;
      border: 1px solid #e5e7eb;
    }

    .turn-counter {
      font-size: 13px;
      color: #6b7280;
    }
  `;

  return (
    <>
      <style>{mobileStyles}</style>
      <div className="demo-container">
        <div className="demo-header">
          <span>Interactive Demo</span>
          <div className="demo-badge">
            {MAX_TURNS - turnCount} {MAX_TURNS - turnCount === 1 ? 'turn' : 'turns'} left
          </div>
        </div>
        <div className="demo-notice">
          ⚠️ Demo data will not be saved - Create account to save progress
        </div>

        <div className="messages-container">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`}>
              <div className="message-bubble">{msg.content}</div>
            </div>
          ))}
          {loading && (
            <div className="message assistant">
              <div className="message-bubble">
                <div className="loading-indicator">
                  <div className="loading-dot"></div>
                  <div className="loading-dot"></div>
                  <div className="loading-dot"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-container">
          <div className="input-wrapper">
            <textarea
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              rows={1}
              disabled={loading || showConversion}
            />
          </div>
          <button
            className="send-button"
            onClick={handleSend}
            disabled={!input.trim() || loading || showConversion}
          >
            {loading ? "..." : "Send"}
          </button>
        </div>

        {showConversion && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Demo data will not be saved</h2>
              <p style={{ marginBottom: '16px', color: '#111827', fontSize: '14px' }}>
                Create a free account to save your progress and unlock powerful features.
              </p>

              <div style={{
                background: '#f9fafb',
                padding: '16px',
                borderRadius: '12px',
                marginBottom: '24px',
                fontSize: '14px',
                lineHeight: '1.6'
              }}>
                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'start' }}>
                  <span style={{ marginRight: '8px' }}>⚡</span>
                  <span><strong>Save time by speaking to Meedi</strong> - Voice messages instead of typing</span>
                </div>
                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'start' }}>
                  <span style={{ marginRight: '8px' }}>📸</span>
                  <span><strong>Upload screenshots to save explaining</strong> - Show, don't tell</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'start' }}>
                  <span style={{ marginRight: '8px' }}>💬</span>
                  <span><strong>Import Telegram/WhatsApp history</strong> - Get instant context</span>
                </div>
              </div>

              <div className="modal-buttons">
                <button
                  className="modal-button primary"
                  onClick={() => navigate('/signup?from=demo')}
                >
                  Create Free Account
                </button>
                <button
                  className="modal-button secondary"
                  onClick={() => navigate('/login?from=demo')}
                >
                  Already have an account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
