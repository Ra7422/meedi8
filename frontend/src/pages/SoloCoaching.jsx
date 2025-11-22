import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest, API_URL } from "../api/client";
import VoiceRecorder from "../components/VoiceRecorder";
import AttachmentMenu from "../components/AttachmentMenu";
import TelegramImportModal from "../components/TelegramImportModal";
import GuestConversionModal from "../components/GuestConversionModal";
import FloatingMenu from "../components/FloatingMenu";

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
  const [showTelegramImport, setShowTelegramImport] = useState(false);
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
          setTimeout(() => setShowGuestModal(true), 1000);
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
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      const response = await fetch(`${API_URL}/rooms/${roomId}/solo/respond`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 402) {
          const message = typeof errorData.detail === 'object'
            ? errorData.detail.message
            : errorData.detail;
          alert(message || "Voice recording requires a Plus or Pro subscription.");
        } else {
          alert(`Voice recording failed: ${errorData.detail || response.status}`);
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

        if (user?.is_guest) {
          setTimeout(() => setShowGuestModal(true), 1000);
        }
      }
    } catch (error) {
      alert("Voice recording failed: " + error.message);
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
      alert("Session saved!");
      navigate('/sessions');
    } catch (error) {
      alert("Error saving: " + error.message);
    }
  };

  const handleFileSelect = async (file) => {
    setUploadingFiles(true);
    try {
      const formData = new FormData();
      formData.append('files', file);

      const response = await fetch(`${API_URL}/rooms/${roomId}/upload-evidence`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      const result = await response.json();
      setEvidenceFiles(prev => [...prev, ...result.files]);
      alert("File uploaded successfully!");
    } catch (error) {
      alert("Failed to upload: " + error.message);
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleTelegramImport = async (downloadId, chatName, messageCount) => {
    try {
      const response = await apiRequest(
        `/rooms/${roomId}/import-telegram`,
        "POST",
        {
          download_id: downloadId,
          chat_name: chatName,
          message_count: messageCount
        },
        token
      );

      // Refresh conversation
      const history = await apiRequest(`/rooms/${roomId}/solo/turns`, "GET", null, token);
      setMessages(history.messages || []);

      setShowTelegramImport(false);
      alert("Telegram messages imported successfully!");
    } catch (error) {
      alert("Failed to import: " + error.message);
    }
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "60px" }}>Loading Solo session...</div>;
  }

  // Purple user bubble color
  const userBubbleColor = "#EDE9FE";

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%)",
      display: "flex",
      flexDirection: "column"
    }}>
      <FloatingMenu />

      {/* Header */}
      <h2 className="coaching-header" style={{
        margin: 0,
        padding: "20px 24px",
        fontSize: "24px",
        fontWeight: "700",
        color: "#7DD3C0",
        textAlign: "center",
        fontFamily: "'Nunito', sans-serif",
        textShadow: "0 0 20px rgba(125, 211, 192, 0.3)"
      }}>
        Solo Reflection
      </h2>

      {/* Messages */}
      <div className="messages-container" style={{
        flex: 1,
        overflowY: "auto",
        padding: "16px 20px 100px 20px",
        maxWidth: "800px",
        margin: "0 auto",
        width: "100%"
      }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              marginBottom: "16px",
              padding: "14px 18px",
              borderRadius: "16px",
              background: msg.role === "user" ? userBubbleColor : "#FFFFFF",
              maxWidth: "85%",
              marginLeft: msg.role === "user" ? "auto" : "0",
              marginRight: msg.role === "user" ? "0" : "auto",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
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
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
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
                      border: "2px solid #C8B6FF",
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
                    border: "2px solid #C8B6FF"
                  }}>
                    👤
                  </div>
                )
              )}
              <strong style={{
                fontSize: "14px",
                color: msg.role === "user" ? "#6B21A8" : "#1F2937",
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
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {!finalized && (
        <div className="input-container">
          {/* Attachment menu */}
          <AttachmentMenu
            onFileSelect={handleFileSelect}
            onTelegramImport={() => setShowTelegramImport(true)}
            disabled={sending}
            uploading={uploadingFiles}
            isGuest={user?.email?.startsWith('guest_')}
            isPremium={true}
          />

          {/* Input with mic */}
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
            />
            <div className="mic-icon-wrapper">
              <VoiceRecorder
                onRecordingComplete={handleVoiceRecording}
                disabled={sending}
                inline={true}
                isGuest={user?.email?.startsWith('guest_')}
                isPremium={true}
              />
            </div>
          </div>

          {/* Send button */}
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

      {/* Evidence files */}
      {evidenceFiles.length > 0 && !finalized && (
        <div style={{
          margin: "8px 20px",
          padding: "8px 12px",
          background: "rgba(125, 211, 192, 0.2)",
          borderRadius: "8px",
          fontSize: "13px",
          color: "#7DD3C0"
        }}>
          <strong>Uploaded:</strong> {evidenceFiles.map(f => f.filename).join(", ")}
        </div>
      )}

      {/* Clarity Summary */}
      {finalized && claritySummary && (
        <div style={{
          padding: "24px",
          margin: "20px",
          background: "rgba(103, 80, 164, 0.9)",
          borderRadius: "16px",
          border: "2px solid #9CDAD5"
        }}>
          <h3 style={{
            marginTop: 0,
            fontSize: "24px",
            color: "#CCB2FF",
            fontWeight: "700",
            marginBottom: "20px",
            textAlign: "center"
          }}>Your Clarity Summary</h3>

          {/* Key Insights */}
          {claritySummary.key_insights && claritySummary.key_insights.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ color: "#9CDAD5", fontSize: "18px", marginBottom: "12px" }}>
                Key Insights
              </h4>
              {claritySummary.key_insights.map((insight, idx) => (
                <div key={idx} style={{
                  padding: "12px 16px",
                  background: "rgba(156, 218, 213, 0.1)",
                  borderRadius: "8px",
                  marginBottom: "8px",
                  color: "#E5E7EB",
                  fontSize: "14px",
                  borderLeft: "3px solid #9CDAD5"
                }}>
                  {insight}
                </div>
              ))}
            </div>
          )}

          {/* Suggested Actions */}
          {claritySummary.suggested_actions && claritySummary.suggested_actions.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ color: "#9CDAD5", fontSize: "18px", marginBottom: "12px" }}>
                Next Steps
              </h4>
              {claritySummary.suggested_actions.map((action, idx) => (
                <div key={idx} style={{
                  padding: "12px 16px",
                  background: "rgba(204, 178, 255, 0.1)",
                  borderRadius: "8px",
                  marginBottom: "8px",
                  color: "#E5E7EB",
                  fontSize: "14px",
                  borderLeft: "3px solid #CCB2FF"
                }}>
                  {action}
                </div>
              ))}
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleFinalize}
            style={{
              width: "100%",
              padding: "16px 24px",
              background: "#7DD3C0",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontSize: "18px",
              fontWeight: "700",
              cursor: "pointer",
              fontFamily: "'Nunito', sans-serif",
              boxShadow: "0 4px 12px rgba(125, 211, 192, 0.3)"
            }}
          >
            Save & Continue
          </button>
        </div>
      )}

      {/* Telegram Import Modal */}
      <TelegramImportModal
        isOpen={showTelegramImport}
        onClose={() => setShowTelegramImport(false)}
        onImport={handleTelegramImport}
        roomId={roomId}
      />

      {/* Guest Conversion Modal */}
      <GuestConversionModal
        isOpen={showGuestModal}
        onClose={() => setShowGuestModal(false)}
      />
    </div>
  );
}
