import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest, API_URL } from "../api/client";
import VoiceRecorder from "../components/VoiceRecorder";
import FileUpload from "../components/FileUpload";
import FloatingMenu from "../components/FloatingMenu";
import GuestConversionModal from "../components/GuestConversionModal";
import { soloTheme, soloStyles, getActionButtonStyle } from "../styles/soloTheme";

export default function SoloCoaching() {
  const { roomId } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [finalized, setFinalized] = useState(false);
  const [claritySummary, setClaritySummary] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSummary, setEditedSummary] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const loadOrStartCoaching = async () => {
      try {
        // First, try to load existing conversation history
        const historyResponse = await apiRequest(
          `/rooms/${roomId}/solo/turns`,
          "GET",
          null,
          token
        );

        if (historyResponse.messages && historyResponse.messages.length > 0) {
          // Existing conversation found - load it
          setMessages(historyResponse.messages);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.log("No existing conversation, starting new session");
      }

      // No existing conversation - start new coaching session
      try {
        const initialMessage = sessionStorage.getItem(`room_${roomId}_initial`) || "I'd like to work through this situation.";

        const response = await apiRequest(
          `/rooms/${roomId}/solo/start`,
          "POST",
          { initial_message: initialMessage },
          token
        );

        setMessages([
          { role: "user", content: initialMessage },
          { role: "assistant", content: response.ai_response }
        ]);

        sessionStorage.removeItem(`room_${roomId}_initial`);
      } catch (error) {
        alert("Error starting Solo session: " + error.message);
      }
      setLoading(false);
    };

    loadOrStartCoaching();
  }, [roomId, token]);

  const handleSend = async () => {
    if (!userInput.trim() || sending) return;

    const userMessage = userInput.trim();
    setUserInput("");
    setSending(true);

    try {
      // Create FormData for the request
      const formData = new FormData();
      formData.append('text', userMessage);

      // Send as multipart/form-data
      const res = await fetch(`${API_URL}/rooms/${roomId}/solo/respond`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `API ${res.status}`);
      }

      const response = await res.json();

      // Fetch updated conversation from server to ensure correct order
      const history = await apiRequest(`/rooms/${roomId}/solo/turns`, "GET", null, token);
      setMessages(history.messages || []);

      if (response.clarity_summary) {
        setFinalized(true);
        setClaritySummary(response.clarity_summary);
        setEditedSummary(JSON.stringify(response.clarity_summary, null, 2));

        // Show guest conversion modal if user is a guest
        if (user?.is_guest) {
          setTimeout(() => setShowGuestModal(true), 1000); // Small delay for better UX
        }
      }
    } catch (error) {
      alert("Error: " + error.message);
    }
    setSending(false);
  };

  const handleVoiceRecording = async (audioBlob, durationSeconds) => {
    setSending(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      // Upload to voice endpoint
      const endpoint = `${API_URL}/rooms/${roomId}/solo/respond`;

      console.log("Uploading voice recording to:", endpoint);
      console.log("Audio blob size:", audioBlob.size, "bytes");

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 402) {
          // Payment required - show upgrade message
          const message = typeof errorData.detail === 'object'
            ? errorData.detail.message
            : errorData.detail;
          alert(message || "Voice recording requires a Plus or Pro subscription. You have 1 free trial - this will use it.");
        } else if (response.status === 500) {
          // Server error - likely API key issue
          alert("Server error processing voice recording. Please try text input or contact support.");
          console.error("Voice recording error:", errorData);
        } else {
          const message = typeof errorData.detail === 'string'
            ? errorData.detail
            : JSON.stringify(errorData);
          alert(`Voice recording failed: ${message}`);
          console.error("Voice recording error:", errorData);
        }
        setSending(false);
        return;
      }

      const result = await response.json();

      // Fetch updated conversation from server
      const history = await apiRequest(`/rooms/${roomId}/solo/turns`, "GET", null, token);
      setMessages(history.messages || []);

      if (result.clarity_summary) {
        setFinalized(true);
        setClaritySummary(result.clarity_summary);
        setEditedSummary(JSON.stringify(result.clarity_summary, null, 2));

        // Show guest conversion modal if user is a guest
        if (user?.is_guest) {
          setTimeout(() => setShowGuestModal(true), 1000); // Small delay for better UX
        }
      }
    } catch (error) {
      console.error("Voice recording error:", error);

      // More detailed error message
      let errorMsg = "Voice recording failed: ";
      if (error.message === "Load failed" || error.message === "Failed to fetch") {
        errorMsg += "Cannot connect to server. ";
        errorMsg += `Trying to reach: ${API_URL}. `;
        errorMsg += "Check that the backend is running and accessible.";
      } else {
        errorMsg += error.message;
      }

      alert(errorMsg);
    } finally {
      setSending(false);
    }
  };

  const handleFinalize = async () => {
    try {
      await apiRequest(
        `/rooms/${roomId}/solo/finalize`,
        "POST",
        { clarity_summary: claritySummary },
        token
      );
      alert("Clarity summary saved!");
      navigate('/rooms');
    } catch (error) {
      alert("Error saving summary: " + error.message);
    }
  };

  const handleFileSelect = async (files) => {
    setUploadingFiles(true);
    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`files`, file);
      });

      const response = await fetch(`${API_URL}/rooms/${roomId}/upload-evidence`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error("Failed to upload files");
      }

      const result = await response.json();
      setEvidenceFiles(prev => [...prev, ...result.files]);
      alert(`${files.length} file(s) uploaded successfully!`);
    } catch (error) {
      console.error("File upload error:", error);
      alert("Failed to upload files: " + error.message);
    } finally {
      setUploadingFiles(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "60px", color: soloTheme.colors.textSecondary }}>Loading Solo session...</div>;
  }

  const mobileStyles = `
    .solo-header {
      margin: 0;
      padding: 16px 20px;
      font-size: 18px;
      border-bottom: 1px solid ${soloTheme.colors.border};
      background: white;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 16px 20px 80px 20px;
      background: ${soloTheme.colors.backgroundPrimary};
      -webkit-overflow-scrolling: touch;
    }

    .input-container {
      display: flex;
      gap: 8px;
      align-items: center;
      padding: 8px 16px;
      background: white;
      border-top: 1px solid ${soloTheme.colors.border};
      position: sticky;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 20;
    }

    .icon-button {
      background: none;
      border: none;
      color: ${soloTheme.colors.primary};
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
      background: ${soloTheme.colors.primaryPale};
    }

    .icon-button:disabled {
      opacity: 0.3;
      cursor: not-allowed;
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
      border: 1px solid ${soloTheme.colors.border};
      background: ${soloTheme.colors.backgroundPrimary};
      font-size: 16px;
      resize: none;
      min-height: 44px;
      max-height: 120px;
      font-family: 'Nunito', sans-serif;
      line-height: 1.4;
      color: ${soloTheme.colors.textSecondary};
    }

    .chat-input:focus {
      outline: none;
      border-color: ${soloTheme.colors.primary};
      background: white;
    }

    .mic-icon-wrapper {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      opacity: 0.5;
    }

    .send-button {
      background: ${soloTheme.colors.primary};
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
      background: ${soloTheme.colors.secondary};
    }

    /* Desktop styles */
    @media (min-width: 769px) {
      .solo-header {
        padding: 16px 24px;
        position: static;
      }

      .messages-container {
        padding: 16px 24px 20px 24px;
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

    /* Ensure proper spacing on mobile when keyboard is open */
    @media (max-width: 768px) {
      @supports (-webkit-touch-callout: none) {
        /* iOS specific */
        .input-container {
          padding-bottom: max(8px, env(safe-area-inset-bottom));
        }
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
      position: "relative"
    }}>
      <FloatingMenu />
      <style>{mobileStyles}</style>

      <h2 className="solo-header" style={{
        color: soloTheme.colors.textPrimary,
        fontWeight: "700",
        fontSize: "20px"
      }}>Solo Reflection Session</h2>

      <div className="messages-container">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              marginBottom: "16px",
              padding: "14px 18px",
              borderRadius: "12px",
              background: msg.role === "user" ? soloTheme.colors.userMessageBg : soloTheme.colors.aiMessageBg,
              border: msg.role === "assistant" ? "none" : `1px solid ${soloTheme.colors.border}`,
              maxWidth: "85%",
              marginLeft: msg.role === "user" ? "auto" : "0",
              marginRight: msg.role === "user" ? "0" : "auto",
              boxShadow: soloTheme.shadows.sm
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
                  background: soloTheme.colors.primaryPale,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  border: `2px solid ${soloTheme.colors.primary}`
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
                user?.profile_picture_url ? (
                  <img
                    src={user.profile_picture_url}
                    alt="User"
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      border: `2px solid ${soloTheme.colors.primary}`,
                      objectFit: "cover"
                    }}
                  />
                ) : (
                  <div style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: soloTheme.colors.primaryPale,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                    border: `2px solid ${soloTheme.colors.primary}`
                  }}>
                    👤
                  </div>
                )
              )}
              <strong style={{
                fontSize: "14px",
                color: msg.role === "user" ? soloTheme.colors.textPrimary : soloTheme.colors.textSecondary,
                fontWeight: "700"
              }}>
                {msg.role === "user" ? "You" : "Meedi"}
              </strong>
            </div>
            <p style={{
              margin: 0,
              whiteSpace: "pre-wrap",
              lineHeight: "1.6",
              color: soloTheme.colors.textSecondary,
              fontSize: "15px"
            }}>
              {msg.content}
            </p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {!finalized && (
        <div className="input-container">
          {/* Plus icon for file upload */}
          <button
            onClick={() => document.getElementById('file-input-solo').click()}
            disabled={sending || uploadingFiles}
            className="icon-button"
            title="Upload evidence"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          </button>
          <input
            id="file-input-solo"
            type="file"
            accept="image/*,.pdf,.doc,.docx,.txt"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              if (files.length > 0) {
                handleFileSelect(files);
              }
              e.target.value = "";
            }}
            style={{ display: "none" }}
          />

          {/* Input field with microphone inside */}
          <div className="input-wrapper">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Share your thoughts..."
              className="chat-input"
              disabled={sending}
              rows="1"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
            {/* Microphone icon inside input */}
            <div className="mic-icon-wrapper">
              <VoiceRecorder
                onRecordingComplete={handleVoiceRecording}
                disabled={sending}
                inline={true}
              />
            </div>
          </div>

          {/* Send button as arrow */}
          <button
            onClick={handleSend}
            disabled={sending || !userInput.trim()}
            className="send-button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      )}

      {/* Show uploaded evidence files */}
      {evidenceFiles.length > 0 && !finalized && (
        <div style={{ marginTop: "8px", padding: "8px", background: soloTheme.colors.primaryPale, borderRadius: "8px", fontSize: "13px" }}>
          <strong>Evidence uploaded:</strong> {evidenceFiles.map(f => f.filename).join(", ")}
        </div>
      )}

      {finalized && claritySummary && (
        <div style={{
          padding: "20px",
          background: `linear-gradient(180deg, ${soloTheme.colors.backgroundPrimary} 0%, #ffffff 100%)`,
          borderRadius: "12px"
        }}>
          <h3 style={{
            marginTop: 0,
            fontSize: "28px",
            color: soloTheme.colors.textPrimary,
            fontWeight: "700",
            marginBottom: "24px",
            textAlign: "center"
          }}>Your Clarity Summary</h3>

          {/* Clarity Summary Display */}
          <div style={{
            ...soloStyles.claritySummary,
            marginBottom: "24px"
          }}>
            {/* Key Insights Section */}
            {claritySummary.key_insights && claritySummary.key_insights.length > 0 && (
              <div style={{ marginBottom: "24px" }}>
                <h4 style={{
                  color: soloTheme.colors.textPrimary,
                  fontSize: "20px",
                  fontWeight: "700",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <span>💡</span> Key Insights
                </h4>
                {claritySummary.key_insights.map((insight, idx) => (
                  <div key={idx} style={soloStyles.clarityInsightItem}>
                    {insight}
                  </div>
                ))}
              </div>
            )}

            {/* Suggested Actions Section */}
            {claritySummary.suggested_actions && claritySummary.suggested_actions.length > 0 && (
              <div style={{ marginBottom: "24px" }}>
                <h4 style={{
                  color: soloTheme.colors.textPrimary,
                  fontSize: "20px",
                  fontWeight: "700",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <span>✨</span> Suggested Next Steps
                </h4>
                {claritySummary.suggested_actions.map((action, idx) => (
                  <div key={idx} style={soloStyles.claritySuggestionItem}>
                    {action}
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons Section */}
            {claritySummary.actions && claritySummary.actions.length > 0 && (
              <div>
                <h4 style={{
                  color: soloTheme.colors.textPrimary,
                  fontSize: "20px",
                  fontWeight: "700",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <span>🎯</span> You Could...
                </h4>
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px"
                }}>
                  {claritySummary.actions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        // Handle action button clicks
                        if (action.type === 'invite_to_mediation') {
                          navigate('/create');
                        } else {
                          alert(`Action: ${action.label}\n\n${action.description || 'This action is suggested based on your reflection.'}`);
                        }
                      }}
                      style={{
                        ...getActionButtonStyle(action.type),
                        width: "100%",
                        fontFamily: "'Nunito', sans-serif",
                        textAlign: "left"
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontWeight: "600", fontSize: "16px" }}>
                          {action.label}
                        </span>
                        {action.description && (
                          <span style={{
                            fontSize: "13px",
                            opacity: 0.9,
                            fontWeight: "400"
                          }}>
                            {action.description}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Save and Continue Button */}
          <button
            onClick={handleFinalize}
            style={{
              ...soloStyles.buttonPrimary,
              width: "100%",
              fontSize: "18px",
              fontWeight: "700",
              fontFamily: "'Nunito', sans-serif",
              boxShadow: soloTheme.shadows.md
            }}
          >
            Save & Return to Rooms
          </button>
        </div>
      )}

      {/* Guest Conversion Modal */}
      <GuestConversionModal
        isOpen={showGuestModal}
        onClose={() => setShowGuestModal(false)}
      />
    </div>
  );
}
