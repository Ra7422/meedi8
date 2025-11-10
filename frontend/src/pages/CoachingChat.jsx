import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest, API_URL } from "../api/client";
import VoiceRecorder from "../components/VoiceRecorder";
import FileUpload from "../components/FileUpload";
import SimpleBreathing from "../components/SimpleBreathing";
import ShareButtons from "../components/ShareButtons";
import FloatingMenu from "../components/FloatingMenu";

export default function CoachingChat() {
  const { roomId } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [finalized, setFinalized] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedSummary, setEditedSummary] = useState("");
  const [roomReady, setRoomReady] = useState(false);
  const [otherUserName, setOtherUserName] = useState(null);  // For User 2: User 1's name
  const [otherUserSummary, setOtherUserSummary] = useState(null);  // For User 2: User 1's summary
  const [evidenceFiles, setEvidenceFiles] = useState([]);  // Uploaded evidence files
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [hasShared, setHasShared] = useState(false);  // Track if user has shared the link
  const [showSummaryPopup, setShowSummaryPopup] = useState(false);  // For User 2 summary popup
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const loadOrStartCoaching = async () => {
      try {
        // First, try to load existing conversation history
        const historyResponse = await apiRequest(
          `/rooms/${roomId}/coach/turns`,
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
        const initialMessage = sessionStorage.getItem(`room_${roomId}_initial`) || "I'd like to discuss this situation.";

        const response = await apiRequest(
          `/rooms/${roomId}/coach/start`,
          "POST",
          { initial_message: initialMessage },
          token
        );

        // If this is User 2, we have other_user_name and other_user_summary
        if (response.other_user_name && response.other_user_summary) {
          setOtherUserName(response.other_user_name);
          setOtherUserSummary(response.other_user_summary);

          // Show intro message with User 1's perspective
          setMessages([
            { role: "intro", content: response.other_user_summary, fromUser: response.other_user_name },
            { role: "assistant", content: response.ai_question }
          ]);
        } else {
          // User 1 - normal flow
          setMessages([
            { role: "user", content: initialMessage },
            { role: "assistant", content: response.ai_question }
          ]);
        }

        sessionStorage.removeItem(`room_${roomId}_initial`);
      } catch (error) {
        alert("Error starting coaching: " + error.message);
      }
      setLoading(false);
    };

    loadOrStartCoaching();
  }, [roomId, token]);

  // Poll for room phase (User 1 waiting for User 2)
  const [roomPhase, setRoomPhase] = useState("user2_lobby");

  useEffect(() => {
    if (!inviteLink) return;

    const checkRoomStatus = async () => {
      try {
        const response = await apiRequest(`/rooms/${roomId}/lobby`, "GET", null, token);
        setRoomPhase(response.room_phase);
        if (response.room_phase === "main_room") {
          setRoomReady(true);
        }
      } catch (error) {
        // Room not ready yet, keep polling
      }
    };

    checkRoomStatus();
    const interval = setInterval(checkRoomStatus, 3000);
    return () => clearInterval(interval);
  }, [roomId, token, inviteLink]);

  const handleSend = async () => {
    if (!userInput.trim() || sending) return;

    const userMessage = userInput.trim();
    setUserInput("");
    setSending(true);

    try {
      const response = await apiRequest(
        `/rooms/${roomId}/coach/respond`,
        "POST",
        { user_message: userMessage },
        token
      );

      // Fetch updated conversation from server to ensure correct order
      const history = await apiRequest(`/rooms/${roomId}/coach/turns`, "GET", null, token);
      setMessages(history.messages || []);

      if (response.ready_to_finalize) {
        setFinalized(true);
        setEditedSummary(response.polished_summary || "");

        // Auto-finalize to determine if User 1 or User 2
        // User 2 will auto-navigate to main room
        // User 1 will see summary review
        handleAutoFinalize();
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
      const endpoint = `${API_URL}/rooms/${roomId}/coach/voice-respond`;

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
      const history = await apiRequest(`/rooms/${roomId}/coach/turns`, "GET", null, token);
      setMessages(history.messages || []);

      if (result.ready_to_finalize) {
        setFinalized(true);
        setEditedSummary(result.polished_summary || "");
        handleAutoFinalize();
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

  const handleAutoFinalize = async () => {
    try {
      const response = await apiRequest(
        `/rooms/${roomId}/coach/finalize`,
        "POST",
        {},
        token
      );

      if (response.ready_for_main_room) {
        // User 2 - show summary popup instead of navigating immediately
        setShowSummaryPopup(true);
      } else {
        // User 1 - store invite link (will display in finalized section)
        setInviteLink(response.invite_link);
      }
    } catch (error) {
      console.error("Auto-finalize error:", error);
    }
  };

  const handleContinueToMainRoom = () => {
    // For User 2 - navigate to main room after reviewing summary
    navigate(`/rooms/${roomId}/main-room`);
  };

  const handleSaveSummary = async () => {
    try {
      await apiRequest(
        `/rooms/${roomId}/coach/update-summary`,
        "POST",
        { summary: editedSummary },
        token
      );
      setIsEditing(false);
      alert("Summary updated!");
    } catch (error) {
      alert("Error updating summary: " + error.message);
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
    return <div style={{ textAlign: "center", padding: "60px" }}>Loading coaching session...</div>;
  }

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

      <h2 className="coaching-header" style={{
        color: "#7DD3C0",
        fontWeight: "700",
        fontSize: "20px"
      }}>Meedi Coaching Session</h2>

      <div className="messages-container">
        {messages.map((msg, idx) => {
          // Determine if this is User 2 (has otherUserName) or User 1
          const isUser2 = otherUserName !== null;
          const userBubbleColor = isUser2 ? "#F5EFFF" : "#E8F9F5";
          const userBorderColor = isUser2 ? "#CCB2FF" : "#7DD3C0";

          return (
          <div
            key={idx}
            style={{
              marginBottom: "16px",
              padding: "14px 18px",
              borderRadius: "12px",
              background: msg.role === "user" ? userBubbleColor : msg.role === "intro" ? "#fef3c7" : "#FFFFFF",
              border: msg.role === "assistant" ? "2px solid #E5E7EB" : msg.role === "user" ? `2px solid ${userBorderColor}` : msg.role === "intro" ? "1px solid #f59e0b" : "2px solid #E5E7EB",
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
                user?.profile_picture_url ? (
                  <img
                    src={user.profile_picture_url}
                    alt="User"
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      border: "2px solid #7C6CB6",
                      objectFit: "cover"
                    }}
                  />
                ) : (
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
                )
              )}
              <strong style={{
                fontSize: "14px",
                color: msg.role === "user" ? "#1F7A5C" : msg.role === "intro" ? "#92400E" : "#6B7280",
                fontWeight: "700"
              }}>
                {msg.role === "user" ? "You" : msg.role === "intro" ? msg.fromUser : "Meedi"}
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
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {!finalized && (
        <div className="input-container">
          {/* Plus icon for file upload */}
          <button
            onClick={() => document.getElementById('file-input-coaching').click()}
            disabled={sending || uploadingFiles}
            className="icon-button"
            title="Upload evidence"
            style={{ color: "#7DD3C0" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          </button>
          <input
            id="file-input-coaching"
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
              placeholder="Type your response..."
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
        <div style={{ marginTop: "8px", padding: "8px", background: "#f0fdf4", borderRadius: "8px", fontSize: "13px" }}>
          <strong>Evidence uploaded:</strong> {evidenceFiles.map(f => f.filename).join(", ")}
        </div>
      )}

      {finalized && (
        <div style={{
          padding: "20px",
          background: "linear-gradient(180deg, #EAF7F0 0%, #ffffff 100%)",
          borderRadius: "12px"
        }}>
          <h3 style={{
            marginTop: 0,
            fontSize: "28px",
            color: "#7DD3C0",
            fontWeight: "700",
            marginBottom: "24px"
          }}>Your Summary & Invite</h3>

          {/* Summary Display/Edit */}
          <div style={{
            marginBottom: "24px",
            padding: "24px",
            background: "#6750A4",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            border: "2px solid #E5E7EB"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{
                margin: 0,
                color: "#CCB2FF",
                fontSize: "18px",
                fontWeight: "700"
              }}>Your Perspective</h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    padding: "8px 16px",
                    background: "#6750A4",
                    border: "2px solid #CCB2FF",
                    borderRadius: "8px",
                    fontSize: "14px",
                    cursor: "pointer",
                    fontFamily: "'Nunito', sans-serif",
                    fontWeight: "600",
                    color: "#CCB2FF"
                  }}
                >
                  Edit
                </button>
              )}
            </div>
            {isEditing ? (
              <>
                <textarea
                  value={editedSummary}
                  onChange={(e) => setEditedSummary(e.target.value)}
                  style={{
                    width: "100%",
                    minHeight: "140px",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "2px solid #E5E7EB",
                    marginBottom: "12px",
                    fontSize: "15px",
                    fontFamily: "'Nunito', sans-serif",
                    lineHeight: "1.6",
                    resize: "vertical"
                  }}
                />
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={handleSaveSummary}
                    style={{
                      padding: "10px 20px",
                      background: "#7DD3C0",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "14px",
                      cursor: "pointer",
                      fontFamily: "'Nunito', sans-serif",
                      fontWeight: "600"
                    }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    style={{
                      padding: "10px 20px",
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
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <p style={{
                margin: 0,
                whiteSpace: "pre-wrap",
                fontSize: "15px",
                lineHeight: "1.7",
                color: "#9CDAD5"
              }}>{editedSummary}</p>
            )}
          </div>

          {/* Invite Link Section */}
          {inviteLink ? (
            <>
              {/* Breathing Exercise - auto-starts after sharing */}
              {!roomReady && hasShared && (
                <div style={{
                  marginBottom: "24px",
                  padding: "24px",
                  background: "linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%)",
                  borderRadius: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                  border: "1px solid rgba(139, 92, 246, 0.3)"
                }}>
                  <h3 style={{
                    margin: "0 0 16px 0",
                    color: "#7DD3C0",
                    fontSize: "18px",
                    fontWeight: "700",
                    textAlign: "center"
                  }}>
                    While You Wait...
                  </h3>
                  <p style={{
                    margin: "0 0 16px 0",
                    fontSize: "15px",
                    color: "#d1d5db",
                    textAlign: "center",
                    lineHeight: "1.6"
                  }}>
                    Take a moment to center yourself with this breathing exercise
                  </p>
                  <SimpleBreathing startCountdown={hasShared} />
                </div>
              )}

              {/* Traffic Light Status */}
              <div style={{
                padding: "20px",
                background: "#6750A4",
                borderRadius: "12px",
                marginBottom: "20px",
                border: "2px solid #9CDAD5",
                boxShadow: "0 4px 12px rgba(0,0,0,0.06)"
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "10px"
                }}>
                  <img
                    src={
                      roomPhase === "user2_lobby" ? "/assets/icons/red_led.svg" :
                      roomPhase === "user2_coaching" ? "/assets/icons/orange_led.svg" :
                      "/assets/icons/green_led.svg"
                    }
                    alt="Status indicator"
                    style={{ width: "24px", height: "24px" }}
                  />
                  <p style={{
                    margin: 0,
                    fontWeight: "700",
                    fontSize: "18px",
                    color: "#CCB2FF",
                    fontFamily: "'Nunito', sans-serif"
                  }}>
                    {roomPhase === "user2_lobby" && "Waiting for Other Person to Join"}
                    {roomPhase === "user2_coaching" && "Other Person is in Coaching"}
                    {roomPhase === "main_room" && "Ready to Enter Main Room!"}
                  </p>
                </div>
                <p style={{
                  fontSize: "15px",
                  color: "#9CDAD5",
                  margin: 0,
                  fontFamily: "'Nunito', sans-serif",
                  lineHeight: "1.6"
                }}>
                  {roomPhase === "user2_lobby" && "The link has been created. Waiting for them to accept the invite..."}
                  {roomPhase === "user2_coaching" && "They've joined! They're completing their coaching session now..."}
                  {roomPhase === "main_room" && "They've completed their coaching! Click below to start the conversation."}
                </p>
              </div>

              {/* Invite Link with Share Buttons - only show in lobby phase */}
              {roomPhase === "user2_lobby" && (
                <div style={{
                  padding: "24px",
                  background: "#6750A4",
                  borderRadius: "12px",
                  marginBottom: "20px",
                  border: "2px solid #9CDAD5",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
                }}>
                  <h3 style={{
                    marginTop: 0,
                    marginBottom: "16px",
                    fontSize: "18px",
                    color: "#CCB2FF",
                    fontFamily: "'Nunito', sans-serif",
                    fontWeight: "700"
                  }}>
                    📨 Share Invite Link
                  </h3>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "20px"
                  }}>
                    <input
                      type="text"
                      value={inviteLink}
                      readOnly
                      onClick={(e) => e.target.select()}
                      style={{
                        flex: 1,
                        padding: "14px",
                        borderRadius: "12px",
                        border: "2px solid #9CDAD5",
                        background: "rgba(255, 255, 255, 0.1)",
                        color: "#9CDAD5",
                        fontSize: "15px",
                        fontFamily: "'Nunito', sans-serif"
                      }}
                    />
                  </div>

                  <div style={{
                    display: "flex",
                    gap: "16px",
                    justifyContent: "center",
                    alignItems: "center"
                  }}>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(inviteLink);
                        alert("Link copied to clipboard!");
                        setHasShared(true);
                      }}
                      title="Copy Link"
                      style={{
                        width: "48px",
                        height: "48px",
                        background: "rgba(204, 178, 255, 0.2)",
                        border: "2px solid #CCB2FF",
                        borderRadius: "50%",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s"
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#CCB2FF" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                      </svg>
                    </button>

                    <button
                      onClick={() => {
                        const message = `Join me for a mediation session on meedi8: ${inviteLink}`;
                        const smsUrl = `sms:?body=${encodeURIComponent(message)}`;
                        window.location.href = smsUrl;
                        setHasShared(true);
                      }}
                      title="Share via iMessage"
                      style={{
                        width: "48px",
                        height: "48px",
                        background: "rgba(204, 178, 255, 0.2)",
                        border: "2px solid #CCB2FF",
                        borderRadius: "50%",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s"
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#CCB2FF">
                        <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3 .97 4.29L2 22l5.71-.97C9 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.38 0-2.68-.28-3.87-.78l-.28-.15-2.89.49.49-2.89-.15-.28C4.78 14.68 4.5 13.38 4.5 12c0-4.14 3.36-7.5 7.5-7.5s7.5 3.36 7.5 7.5-3.36 7.5-7.5 7.5z"/>
                        <circle cx="8" cy="12" r="1" fill="#CCB2FF"/>
                        <circle cx="12" cy="12" r="1" fill="#CCB2FF"/>
                        <circle cx="16" cy="12" r="1" fill="#CCB2FF"/>
                      </svg>
                    </button>

                    <button
                      onClick={() => {
                        const message = `Join me for a mediation session on meedi8: ${inviteLink}`;
                        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                        window.open(whatsappUrl, '_blank');
                        setHasShared(true);
                      }}
                      title="Share via WhatsApp"
                      style={{
                        width: "48px",
                        height: "48px",
                        background: "rgba(204, 178, 255, 0.2)",
                        border: "2px solid #CCB2FF",
                        borderRadius: "50%",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s"
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#CCB2FF">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </button>

                    <button
                      onClick={() => {
                        const subject = "Join me for a mediation session";
                        const body = `I'd like to invite you to a mediation session on meedi8.\n\nPlease join using this link:\n${inviteLink}`;
                        const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                        window.location.href = mailtoUrl;
                        setHasShared(true);
                      }}
                      title="Share via Email"
                      style={{
                        width: "48px",
                        height: "48px",
                        background: "rgba(204, 178, 255, 0.2)",
                        border: "2px solid #CCB2FF",
                        borderRadius: "50%",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s"
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#CCB2FF" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                    </button>

                    <button
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: 'Join me for a mediation session',
                            text: 'Please join me for a mediation session on meedi8',
                            url: inviteLink
                          }).catch(console.error);
                        } else {
                          navigator.clipboard.writeText(inviteLink);
                          alert("Link copied to clipboard!");
                        }
                        setHasShared(true);
                      }}
                      title="Share"
                      style={{
                        width: "48px",
                        height: "48px",
                        background: "rgba(204, 178, 255, 0.2)",
                        border: "2px solid #CCB2FF",
                        borderRadius: "50%",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s"
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#CCB2FF" strokeWidth="2">
                        <circle cx="18" cy="5" r="3"/>
                        <circle cx="6" cy="12" r="3"/>
                        <circle cx="18" cy="19" r="3"/>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Enter Main Room Button */}
              {roomPhase === "main_room" && (
                <button
                  onClick={() => navigate(`/rooms/${roomId}/main-room`)}
                  style={{
                    padding: "16px 24px",
                    background: "#7DD3C0",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "18px",
                    fontWeight: "700",
                    cursor: "pointer",
                    width: "100%",
                    fontFamily: "'Nunito', sans-serif",
                    boxShadow: "0 4px 12px rgba(125, 211, 192, 0.3)"
                  }}
                >
                  Enter Main Room →
                </button>
              )}
            </>
          ) : (
            <div style={{ padding: "16px", background: "#fef3c7", borderRadius: "8px", textAlign: "center" }}>
              <p style={{ fontSize: "14px", color: "#92400e", margin: 0, fontWeight: "500" }}>
                ⏳ Generating invite link...
              </p>
              <p style={{ fontSize: "13px", color: "#78350f", margin: "8px 0 0 0" }}>
                This will appear in a moment. Once ready, share it with the other person.
              </p>
            </div>
          )}
        </div>
      )}

      {/* User 2 Summary Popup */}
      {showSummaryPopup && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px"
        }}>
          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "32px",
            maxWidth: "600px",
            width: "100%",
            maxHeight: "80vh",
            overflowY: "auto",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)"
          }}>
            <h2 style={{
              fontSize: "28px",
              color: "#6750A4",
              marginBottom: "16px",
              fontFamily: "'Nunito', sans-serif",
              fontWeight: "700"
            }}>
              Your Summary
            </h2>

            <p style={{
              fontSize: "16px",
              color: "#6B7280",
              marginBottom: "24px",
              lineHeight: "1.6"
            }}>
              Here's what Meedi has prepared based on your conversation. You can edit it if needed before continuing to the mediation.
            </p>

            {isEditing ? (
              <textarea
                value={editedSummary}
                onChange={(e) => setEditedSummary(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: "200px",
                  padding: "16px",
                  borderRadius: "12px",
                  border: "2px solid #CCB2FF",
                  fontSize: "15px",
                  fontFamily: "'Nunito', sans-serif",
                  lineHeight: "1.7",
                  resize: "vertical"
                }}
              />
            ) : (
              <div style={{
                padding: "20px",
                background: "#F5EFFF",
                borderRadius: "12px",
                border: "2px solid #CCB2FF",
                marginBottom: "24px"
              }}>
                <p style={{
                  fontSize: "15px",
                  lineHeight: "1.7",
                  color: "#374151",
                  margin: 0,
                  whiteSpace: "pre-wrap"
                }}>
                  {editedSummary}
                </p>
              </div>
            )}

            <div style={{
              display: "flex",
              gap: "12px",
              marginTop: "24px",
              justifyContent: "flex-end"
            }}>
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    style={{
                      padding: "12px 24px",
                      background: "#F3F4F6",
                      color: "#374151",
                      border: "none",
                      borderRadius: "12px",
                      fontSize: "16px",
                      fontWeight: "600",
                      cursor: "pointer",
                      fontFamily: "'Nunito', sans-serif"
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      handleSaveSummary();
                      setIsEditing(false);
                    }}
                    style={{
                      padding: "12px 24px",
                      background: "#6750A4",
                      color: "white",
                      border: "none",
                      borderRadius: "12px",
                      fontSize: "16px",
                      fontWeight: "600",
                      cursor: "pointer",
                      fontFamily: "'Nunito', sans-serif"
                    }}
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    style={{
                      padding: "12px 24px",
                      background: "#F3F4F6",
                      color: "#374151",
                      border: "2px solid #CCB2FF",
                      borderRadius: "12px",
                      fontSize: "16px",
                      fontWeight: "600",
                      cursor: "pointer",
                      fontFamily: "'Nunito', sans-serif"
                    }}
                  >
                    Edit Summary
                  </button>
                  <button
                    onClick={handleContinueToMainRoom}
                    style={{
                      padding: "12px 24px",
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
                    Continue to Mediation
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
