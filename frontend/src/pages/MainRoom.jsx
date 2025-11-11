import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest, API_URL } from "../api/client";
import VoiceRecorder from "../components/VoiceRecorder";
import FloatingMenu from "../components/FloatingMenu";
import SimpleBreathing from "../components/SimpleBreathing";

export default function MainRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [summaries, setSummaries] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [currentSpeakerId, setCurrentSpeakerId] = useState(null);
  const [startError, setStartError] = useState(null);
  const [inviteLink, setInviteLink] = useState("");
  const [showBreathing, setShowBreathing] = useState(false);
  const [breakInfo, setBreakInfo] = useState(null);  // Track who requested the break
  const [otherUserPresent, setOtherUserPresent] = useState(false);  // Is other user in the room?
  const [uploadingFile, setUploadingFile] = useState(false);  // Track file upload state
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);  // Reference for hidden file input
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  useEffect(() => {
    const loadRoom = async () => {
      if (!user) return; // Wait for user to load

      try {
        const summariesData = await apiRequest(`/rooms/${roomId}/main-room/summaries`, "GET", null, token);
        setSummaries(summariesData);

        // Check if other user is present
        const isUser1 = user.id === summariesData.user1_id;
        const otherPresent = isUser1 ? summariesData.user2_present : summariesData.user1_present;
        setOtherUserPresent(otherPresent);

        // Construct invite link from invite_token
        if (summariesData.invite_token) {
          const link = `${window.location.origin}/join/${summariesData.invite_token}`;
          setInviteLink(link);
        }

        try {
          const history = await apiRequest(`/rooms/${roomId}/main-room/messages`, "GET", null, token);

          // Determine which summary to show (opposite user's summary)
          const isUser1 = user.id === summariesData.user1_id;
          const otherUserSummary = isUser1 ? summariesData.user2_summary : summariesData.user1_summary;
          const otherUserName = isUser1 ? summariesData.user2_name : summariesData.user1_name;

          if (history.messages && history.messages.length > 0) {
            // Existing conversation - prepend summary to existing messages
            const messagesWithSummary = [
              {
                role: "summary",
                content: otherUserSummary,
                fromUser: otherUserName
              },
              ...history.messages
            ];
            setMessages(messagesWithSummary);
            setCurrentSpeakerId(history.current_speaker_id);
            setSessionComplete(history.session_complete);
          } else {
            // New session - start with summary + Meedi welcome
            const startData = await apiRequest(`/rooms/${roomId}/main-room/start`, "POST", null, token);

            // Create initial messages with summary (NO duplicate welcome - AI already provides it)
            const initialMessages = [
              {
                role: "summary",
                content: otherUserSummary,
                fromUser: otherUserName
              },
              {
                role: "assistant",
                content: startData.opening_message  // AI's opening already has welcome
              }
            ];

            setMessages(initialMessages);
            setCurrentSpeakerId(startData.current_speaker_id);
          }
        } catch (err) {
          const startData = await apiRequest(`/rooms/${roomId}/main-room/start`, "POST", null, token);

          // Determine which summary to show
          const isUser1 = user.id === summariesData.user1_id;
          const otherUserSummary = isUser1 ? summariesData.user2_summary : summariesData.user1_summary;
          const otherUserName = isUser1 ? summariesData.user2_name : summariesData.user1_name;

          setMessages([
            {
              role: "summary",
              content: otherUserSummary,
              fromUser: otherUserName
            },
            {
              role: "assistant",
              content: startData.opening_message
            }
          ]);
          setCurrentSpeakerId(startData.current_speaker_id);
        }
      } catch (error) {
        console.error("Load error:", error);

        // If coaching not complete, redirect back to coaching page
        if (error.message && error.message.includes("must complete coaching")) {
          navigate(`/rooms/${roomId}/coaching`);
          return;
        }

        setStartError(error.message || "Failed to load. Please refresh.");
      }
      setLoading(false);
    };
    
    loadRoom();
  }, [roomId, token, user]);
  
  useEffect(() => {
    if (loading || !summaries) return;

    const pollMessages = async () => {
      if (!user) return; // Wait for user to load

      try {
        // Poll for presence updates
        const summariesData = await apiRequest(`/rooms/${roomId}/main-room/summaries`, "GET", null, token);
        const isUser1 = user.id === summariesData.user1_id;
        const otherPresent = isUser1 ? summariesData.user2_present : summariesData.user1_present;
        setOtherUserPresent(otherPresent);

        const history = await apiRequest(`/rooms/${roomId}/main-room/messages`, "GET", null, token);

        // Prepend summary to messages (other user's perspective)
        const otherUserSummary = isUser1 ? summariesData.user2_summary : summariesData.user1_summary;
        const otherUserName = isUser1 ? summariesData.user2_name : summariesData.user1_name;

        const messagesWithSummary = history.messages.length > 0 ? [
          {
            role: "summary",
            content: otherUserSummary,
            fromUser: otherUserName
          },
          ...history.messages
        ] : [];

        // Compare without the summary (summary is always prepended fresh)
        const currentMessagesWithoutSummary = messages.filter(m => m.role !== "summary");
        if (JSON.stringify(history.messages) !== JSON.stringify(currentMessagesWithoutSummary)) {
          setMessages(messagesWithSummary);
          setCurrentSpeakerId(history.current_speaker_id);
          setSessionComplete(history.session_complete);
        }

        // Update break info and show modal if someone requested a break
        if (history.break_info) {
          setBreakInfo(history.break_info);
          setShowBreathing(true);
        } else {
          setBreakInfo(null);
          // Don't auto-close - let user click "Ready to Continue"
        }
      } catch (err) {
        console.error("Poll error:", err);
      }
    };

    const interval = setInterval(pollMessages, 3000);
    return () => clearInterval(interval);
  }, [roomId, token, messages, loading, summaries, user]);
  
  // Redirect to celebration when session completes
  useEffect(() => {
    if (sessionComplete) {
      setTimeout(() => {
        navigate(`/rooms/${roomId}/resolution`);
      }, 2000);
    }
  }, [sessionComplete, roomId, navigate]);
  
  const handleSend = async () => {
    if (!userInput.trim() || sending) return;

    const userMessage = userInput.trim();
    setUserInput("");
    setSending(true);

    try {
      const response = await apiRequest(
        `/rooms/${roomId}/main-room/respond`,
        "POST",
        { message: userMessage },
        token
      );

      // Check for breathing break
      if (response.breathing_break) {
        // Show breathing modal for both users
        setBreakInfo({
          type: "breathing",
          message: response.ai_response,
          count: response.breathing_break_count
        });
        setShowBreathing(true);

        setSending(false);
        return;
      }

      // Don't add messages optimistically - let polling fetch them
      // This ensures both users see messages in the same order

      if (response.resolution) {
        setSessionComplete(true);
      } else if (response.next_speaker_id) {
        setCurrentSpeakerId(response.next_speaker_id);
      }

      // Force immediate refresh to show new messages
      const history = await apiRequest(`/rooms/${roomId}/main-room/messages`, "GET", null, token);

      // Prepend summary
      const isUser1 = user.id === summaries.user1_id;
      const otherUserSummary = isUser1 ? summaries.user2_summary : summaries.user1_summary;
      const otherUserName = isUser1 ? summaries.user2_name : summaries.user1_name;

      const messagesWithSummary = [
        {
          role: "summary",
          content: otherUserSummary,
          fromUser: otherUserName
        },
        ...history.messages
      ];

      setMessages(messagesWithSummary);
      setCurrentSpeakerId(history.current_speaker_id);
      setSessionComplete(history.session_complete);

    } catch (error) {
      alert("Error: " + error.message);
      window.location.reload();
    }
    setSending(false);
  };

  const handleVoiceRecording = async (audioBlob, durationSeconds) => {
    setSending(true);

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      const endpoint = `${API_URL}/rooms/${roomId}/main-room/voice-respond`;

      console.log("Uploading voice recording to main room:", endpoint);
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
          const message = typeof errorData.detail === 'object'
            ? errorData.detail.message
            : errorData.detail;
          alert(message || "Voice recording requires a Plus or Pro subscription.");
        } else if (response.status === 500) {
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

      // Force immediate refresh to show new messages
      const history = await apiRequest(`/rooms/${roomId}/main-room/messages`, "GET", null, token);

      // Prepend summary
      const isUser1 = user.id === summaries.user1_id;
      const otherUserSummary = isUser1 ? summaries.user2_summary : summaries.user1_summary;
      const otherUserName = isUser1 ? summaries.user2_name : summaries.user1_name;

      const messagesWithSummary = [
        {
          role: "summary",
          content: otherUserSummary,
          fromUser: otherUserName
        },
        ...history.messages
      ];

      setMessages(messagesWithSummary);
      setCurrentSpeakerId(history.current_speaker_id);
      setSessionComplete(history.session_complete);

      if (result.resolution) {
        setSessionComplete(true);
      }
    } catch (error) {
      console.error("Voice recording error:", error);

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

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert("File too large. Maximum size is 10MB.");
      return;
    }

    // Validate file type
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.txt'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      alert(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
      return;
    }

    setUploadingFile(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const endpoint = `${API_URL}/rooms/${roomId}/main-room/upload-file`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "File upload failed");
      }

      const result = await response.json();
      console.log("File uploaded successfully:", result);

      // Force immediate refresh to show uploaded file
      const history = await apiRequest(`/rooms/${roomId}/main-room/messages`, "GET", null, token);

      // Prepend summary
      const isUser1 = user.id === summaries.user1_id;
      const otherUserSummary = isUser1 ? summaries.user2_summary : summaries.user1_summary;
      const otherUserName = isUser1 ? summaries.user2_name : summaries.user1_name;

      const messagesWithSummary = [
        {
          role: "summary",
          content: otherUserSummary,
          fromUser: otherUserName
        },
        ...history.messages
      ];

      setMessages(messagesWithSummary);
      setCurrentSpeakerId(history.current_speaker_id);
      setSessionComplete(history.session_complete);

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error("File upload error:", error);
      alert("File upload failed: " + error.message);
    } finally {
      setUploadingFile(false);
    }
  };

  // CRITICAL: Guard against null user - must be first check
  if (!user) {
    return <div style={{ textAlign: "center", padding: "60px" }}>Loading user...</div>;
  }

  if (loading) {
    return <div style={{ textAlign: "center", padding: "60px" }}>Loading conversation...</div>;
  }

  if (startError) {
    return (
      <div style={{ textAlign: "center", padding: "60px" }}>
        <p style={{ color: "red", marginBottom: "16px" }}>{startError}</p>
        <button onClick={() => window.location.reload()} style={{ padding: "12px 24px", background: "#3b82f6", color: "white", border: "none", borderRadius: "8px" }}>
          Refresh Page
        </button>
      </div>
    );
  }

  if (!summaries) {
    return <div style={{ textAlign: "center", padding: "60px" }}>Loading...</div>;
  }

  const isMyTurn = currentSpeakerId === user.id;
  const otherPersonName = user.id === summaries.user1_id ? summaries.user2_name : summaries.user1_name;
  const isUser1 = user.id === summaries.user1_id;

  // Show waiting screen if:
  // 1. Other user hasn't joined yet (no messages)
  // 2. OR you're User 2 and User 1 hasn't taken their first turn yet
  const shouldShowWaiting = !otherUserPresent && messages.length === 0;
  const isUser2WaitingForUser1 = !isUser1 && messages.length > 0 && messages.filter(m => m.role === "user").length === 0;

  if (shouldShowWaiting || isUser2WaitingForUser1) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        padding: "40px",
        background: "linear-gradient(180deg, #E8F9F5 0%, #ffffff 100%)",
        fontFamily: "'Nunito', sans-serif",
        textAlign: "center"
      }}>
        <div style={{
          maxWidth: "500px",
          background: "white",
          borderRadius: "20px",
          padding: "48px 32px",
          boxShadow: "0 8px 24px rgba(125, 211, 192, 0.2)",
          border: "2px solid #7DD3C0"
        }}>
          <div style={{
            width: "80px",
            height: "80px",
            margin: "0 auto 24px",
            background: otherUserPresent ? "#10b981" : "#ef4444",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 0 8px ${otherUserPresent ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)"}`,
            animation: "pulse 2s ease-in-out infinite"
          }}>
            <div style={{
              width: "40px",
              height: "40px",
              background: "white",
              borderRadius: "50%"
            }} />
          </div>

          <h2 style={{
            fontSize: "28px",
            fontWeight: "700",
            color: "#1a202c",
            margin: "0 0 16px 0"
          }}>Waiting for {otherPersonName}</h2>

          <p style={{
            fontSize: "16px",
            color: "#6b7280",
            lineHeight: "1.6",
            margin: "0 0 24px 0"
          }}>
            {isUser2WaitingForUser1
              ? `${otherPersonName} is in the room. Waiting for them to take the first turn...`
              : `${otherPersonName} hasn't joined the main room yet. We'll start automatically when they arrive.`
            }
          </p>

          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 24px",
            background: "#F3F4F6",
            borderRadius: "12px",
            fontSize: "14px",
            color: "#6b7280"
          }}>
            <div style={{
              width: "8px",
              height: "8px",
              background: "#10b981",
              borderRadius: "50%",
              animation: "blink 1.5s ease-in-out infinite"
            }} />
            <span>Checking for {otherPersonName}...</span>
          </div>
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
        `}</style>
      </div>
    );
  }

  const mobileStyles = `
    .main-room-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      max-width: 900px;
      margin: 0 auto;
      position: relative;
    }

    .main-messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 16px 20px 80px 20px;
      background: #fff;
      -webkit-overflow-scrolling: touch;
    }

    .main-input-container {
      display: flex;
      gap: 8px;
      align-items: center;
      padding: 8px 16px;
      background: white;
      border-top: 1px solid #e5e7eb;
      position: sticky;
      bottom: 0;
      z-index: 20;
    }

    .input-wrapper {
      flex: 1;
      position: relative;
      display: flex;
      align-items: center;
    }

    .main-chat-input {
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

    .main-chat-input:focus {
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

    .main-send-button {
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

    .main-send-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: #d1d5db;
    }

    .main-send-button:not(:disabled):active {
      background: #6BC5B8;
    }

    .icon-button {
      background: none;
      border: none;
      color: #7DD3C0;
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

    /* Desktop styles */
    @media (min-width: 769px) {
      .main-room-container {
        padding: 20px;
      }

      .main-messages-container {
        padding: 16px;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
        margin-bottom: 16px;
      }

      .main-input-container {
        position: static;
        padding: 0;
        border-top: none;
        gap: 12px;
      }

      .main-chat-input {
        border-radius: 12px;
        min-height: 60px;
        font-size: 14px;
      }

      .main-send-button {
        border-radius: 12px;
        min-width: 60px;
        padding: 12px 20px;
      }
    }

    @media (max-width: 768px) {
      @supports (-webkit-touch-callout: none) {
        .main-input-container {
          padding-bottom: max(8px, env(safe-area-inset-bottom));
        }
      }
    }
  `;

  return (
    <div className="main-room-container">
      <FloatingMenu
        summaries={summaries}
        inviteLink={inviteLink}
        onToggleBreathing={true}
      />

      {/* Presence Indicator */}
      <div style={{
        position: "fixed",
        top: "80px",
        right: "20px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 16px",
        background: "rgba(255, 255, 255, 0.95)",
        borderRadius: "20px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        border: "1px solid #e5e7eb",
        fontSize: "13px",
        fontWeight: "500",
        color: "#6b7280",
        zIndex: 100,
        fontFamily: "'Nunito', sans-serif"
      }}>
        <div style={{
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          background: otherUserPresent ? "#10b981" : "#ef4444",
          boxShadow: `0 0 0 2px ${otherUserPresent ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"}`
        }} />
        <span>{otherPersonName} {otherUserPresent ? "online" : "offline"}</span>
      </div>

      <style>{mobileStyles}</style>

      <div className="main-messages-container">
        {messages.map((msg, idx) => {
          // Determine colors based on user identity
          const isUser1 = msg.userId === summaries.user1_id;
          const isCurrentUser = msg.userId === user.id;
          const userBubbleColor = isUser1 ? "#E8F9F5" : "#F5EFFF";
          const userBorderColor = isUser1 ? "#7DD3C0" : "#CCB2FF";

          return (
            <div
              key={idx}
              style={{
                marginBottom: "16px",
                display: "flex",
                justifyContent: msg.role === "user" && isCurrentUser ? "flex-end" : "flex-start",
                alignItems: "flex-start",
                gap: "12px"
              }}
            >
              {/* Meedi profile picture on left for assistant messages */}
              {msg.role === "assistant" && (
                <img
                  src="/assets/illustrations/Meedi_Profile.svg"
                  alt="Meedi"
                  style={{ width: "40px", height: "40px", flexShrink: 0 }}
                />
              )}

              <div style={{
                maxWidth: msg.role === "summary" ? "85%" : "75%",
                padding: msg.role === "summary" ? "20px" : "14px 18px",
                borderRadius: "12px",
                background: msg.role === "resolution" ? "#dcfce7" :
                            msg.role === "summary" ? "linear-gradient(135deg, #E8F9F5 0%, #D1F2ED 100%)" :
                            msg.role === "assistant" ? "#FFFFFF" :
                            userBubbleColor,
                border: msg.role === "resolution" ? "2px solid #10b981" :
                        msg.role === "summary" ? "2px solid #7DD3C0" :
                        msg.role === "assistant" ? "2px solid #E5E7EB" :
                        `2px solid ${userBorderColor}`,
                color: msg.role === "assistant" ? "#374151" : "#374151",
                whiteSpace: "pre-wrap",
                boxShadow: msg.role === "summary" ? "0 4px 12px rgba(125, 211, 192, 0.2)" : "0 2px 8px rgba(0,0,0,0.04)"
              }}>
                {msg.role === "resolution" && <strong style={{ color: "#10b981" }}>✅ Resolution Reached:</strong>}
                {msg.role === "summary" && (
                  <div style={{ marginBottom: "12px" }}>
                    <strong style={{
                      fontSize: "14px",
                      fontWeight: "700",
                      color: "#6750A4"
                    }}>
                      📋 {msg.fromUser}'s Perspective
                    </strong>
                  </div>
                )}
                {msg.role === "user" && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    {/* Show profile picture if user has one, otherwise show emoji */}
                    {isCurrentUser && user?.profile_picture_url ? (
                      <img
                        src={user.profile_picture_url}
                        alt="User"
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          border: `2px solid ${isUser1 ? "#7DD3C0" : "#CCB2FF"}`,
                          objectFit: "cover"
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: "20px" }}>👤</span>
                    )}
                    <span style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: isUser1 ? "#7DD3C0" : "#6750A4"
                    }}>
                      {isCurrentUser ? "You" : otherPersonName}
                    </span>
                  </div>
                )}
                <div style={{ fontSize: "15px", lineHeight: "1.7" }}>
                  {msg.content}
                </div>
                {msg.role === "user" && msg.audioUrl && msg.userId !== user.id && (
                  <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: `1px solid ${isUser1 ? "#7DD3C0" : "#CCB2FF"}` }}>
                    <audio
                      controls
                      style={{
                        width: "100%",
                        maxWidth: "300px",
                        height: "32px",
                        outline: "none"
                      }}
                      src={msg.audioUrl}
                    >
                      Your browser does not support audio playback.
                    </audio>
                  </div>
                )}
                {msg.role === "user" && msg.attachmentUrl && (
                  <div style={{
                    marginTop: "12px",
                    paddingTop: "12px",
                    borderTop: `1px solid ${isUser1 ? "#7DD3C0" : "#CCB2FF"}`
                  }}>
                    {/* Check if it's an image */}
                    {msg.attachmentFilename && /\.(jpg|jpeg|png|gif)$/i.test(msg.attachmentFilename) ? (
                      <a
                        href={msg.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: "block" }}
                      >
                        <img
                          src={msg.attachmentUrl}
                          alt={msg.attachmentFilename}
                          style={{
                            maxWidth: "100%",
                            maxHeight: "300px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            objectFit: "contain"
                          }}
                        />
                      </a>
                    ) : (
                      /* For documents, show download link */
                      <a
                        href={msg.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "8px 12px",
                          background: "#f3f4f6",
                          borderRadius: "8px",
                          textDecoration: "none",
                          color: "#374151",
                          fontSize: "14px",
                          fontWeight: "500"
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                        </svg>
                        <span>{msg.attachmentFilename}</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {sending && <div style={{ textAlign: "center", padding: "16px", color: "#666" }}>Sending...</div>}
        <div ref={messagesEndRef} />
      </div>
      
      {!sessionComplete ? (
        <>
          {!isMyTurn && (
            <div style={{ textAlign: "center", padding: "12px", background: "#fef3c7", borderRadius: "8px", marginBottom: "8px" }}>
              Waiting for {otherPersonName} to respond...
            </div>
          )}

          <div style={{ position: "relative" }}>
            {/* Pause button - overlaps chat area */}
            <button
              onClick={async () => {
                try {
                  await apiRequest(`/rooms/${roomId}/request-break`, "POST", null, token);
                  setShowBreathing(true);
                } catch (err) {
                  console.error("Break request failed:", err);
                }
              }}
              style={{
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
              }}
              title="Take a breathing break"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1"/>
                <rect x="14" y="4" width="4" height="16" rx="1"/>
              </svg>
              <span>Need a break?</span>
            </button>

            <div className="main-input-container">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />

              {/* Plus icon for file upload */}
              <button
                className="icon-button"
                title="Upload evidence (images, documents)"
                disabled={!isMyTurn || sending || uploadingFile}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadingFile ? (
                  <span style={{ fontSize: "16px" }}>⏳</span>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                )}
              </button>

              {/* Input field with microphone inside */}
              <div className="input-wrapper">
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (isMyTurn) handleSend();
                    }
                  }}
                  placeholder={isMyTurn ? "Type your response..." : "Wait for your turn..."}
                  disabled={!isMyTurn || sending}
                  className="main-chat-input"
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
                    disabled={!isMyTurn || sending}
                    inline={true}
                  />
                </div>
              </div>

              {/* Send button as arrow */}
              <button
                onClick={handleSend}
                disabled={!isMyTurn || sending || !userInput.trim()}
                className="main-send-button"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </button>
            </div>
          </div>
        </>
      ) : (
        <div style={{ textAlign: "center", padding: "24px", background: "#dcfce7", borderRadius: "12px" }}>
          <h3 style={{ margin: "0 0 8px 0" }}>🎉 Session Complete!</h3>
          <p style={{ margin: 0 }}>You've reached an agreement.</p>
        </div>
      )}

      {/* Breathing Modal */}
      {showBreathing && (
        <div style={{
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
        }}>
          <div style={{
            background: "linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%)",
            borderRadius: "16px",
            padding: "32px",
            maxWidth: "600px",
            width: "100%",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
          }}>
            <h2 style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#CCB2FF",
              margin: "0 0 8px 0",
              textAlign: "center",
              fontFamily: "'Nunito', sans-serif"
            }}>Take a Breathing Break</h2>
            <p style={{
              fontSize: "15px",
              fontWeight: "400",
              color: "#CCB2FF",
              margin: "0 0 16px 0",
              textAlign: "center",
              fontFamily: "'Nunito', sans-serif"
            }}>
              {breakInfo?.type === "breathing" ? "Let's take a moment to breathe" : `${breakInfo?.requested_by_name || user.name} needs a moment`}
            </p>

            {/* Custom message from AI or default encouragement */}
            <div style={{
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
            }}>
              {breakInfo?.type === "breathing" && breakInfo?.message ? (
                <>✨ {breakInfo.message}</>
              ) : (
                <>✨ Sometimes it can feel overwhelming, and that's okay. {breakInfo?.requested_by_name || user.name} is still here and wants to resolve this with you. This is a good time to take a breath and re-center yourself.</>
              )}
            </div>

            {/* Additional calm space message for breathing breaks */}
            {breakInfo?.type === "breathing" && (
              <div style={{
                fontSize: "13px",
                lineHeight: "1.5",
                color: "#a78bfa",
                margin: "0 0 20px 0",
                padding: "12px",
                background: "rgba(167, 139, 250, 0.1)",
                borderRadius: "8px",
                textAlign: "center",
                fontFamily: "'Nunito', sans-serif",
                fontStyle: "italic"
              }}>
                This is a calm space to find resolution. Although heated discussions arise from time to time, solid growth is built on communication.
              </div>
            )}

            <SimpleBreathing startCountdown={true} allowRestart={true} hideEncouragement={true} />

            <div style={{
              fontSize: "12px",
              color: "#9CA3AF",
              textAlign: "center",
              fontFamily: "'Nunito', sans-serif",
              opacity: 0.8,
              marginTop: "12px"
            }}>
              Tap the circle to restart the exercise
            </div>

            <button
              onClick={async () => {
                try {
                  await apiRequest(`/rooms/${roomId}/clear-break`, "POST", null, token);
                  setShowBreathing(false);
                  setBreakInfo(null);
                } catch (err) {
                  console.error("Clear break failed:", err);
                  setShowBreathing(false);
                }
              }}
              style={{
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
              }}
            >
              Ready to Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
