import React, { useState, useEffect } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api/client";

export default function InviteShare() {
  const location = useLocation();
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const inviteLink = location.state?.inviteLink || "";
  const [roomPhase, setRoomPhase] = useState("user2_lobby"); // default to waiting
  const [loading, setLoading] = useState(true);

  // Poll for room status
  useEffect(() => {
    const checkRoomStatus = async () => {
      try {
        const response = await apiRequest(`/rooms/${roomId}/lobby`, "GET", null, token);
        setRoomPhase(response.room_phase);
      } catch (error) {
        console.error("Error checking room status:", error);
      }
      setLoading(false);
    };

    checkRoomStatus();
    const interval = setInterval(checkRoomStatus, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, [roomId, token]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    alert("Link copied!");
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`Let's discuss something: ${inviteLink}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareEmail = () => {
    const subject = encodeURIComponent("Let's discuss something");
    const body = encodeURIComponent(`Join here: ${inviteLink}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const enterRoom = () => {
    if (roomPhase === "main_room") {
      navigate(`/rooms/${roomId}/main-room`);
    }
  };

  // Determine button state based on room phase
  const getButtonState = () => {
    if (roomPhase === "user2_lobby") {
      return {
        color: "#ef4444", // red
        text: "⏳ Waiting for Other Person to Join",
        disabled: true,
        description: "The link has been created. Waiting for the other person to accept the invite..."
      };
    } else if (roomPhase === "user2_coaching") {
      return {
        color: "#f59e0b", // amber
        text: "⏳ Other Person is in Coaching",
        disabled: true,
        description: "They've joined! They're completing their coaching session now..."
      };
    } else if (roomPhase === "main_room") {
      return {
        color: "#10b981", // green
        text: "🚀 Enter Main Room",
        disabled: false,
        description: "Both of you are ready! Click to enter the main room and start the conversation."
      };
    }
    return {
      color: "#6b7280",
      text: "Loading...",
      disabled: true,
      description: ""
    };
  };

  const buttonState = getButtonState();

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      background: 'linear-gradient(180deg, #EAF7F0 0%, #ffffff 100%)',
      overflow: 'hidden',
      fontFamily: "'Nunito', sans-serif",
    }}>
      <div style={{ maxWidth: "600px", margin: "60px auto", padding: "24px", textAlign: "center", position: "relative", zIndex: 1 }}>
        <h1 style={{
          marginBottom: "16px",
          fontFamily: "'Nunito', sans-serif",
          fontSize: "clamp(32px, 6vw, 48px)",
          color: "#7DD3C0",
          fontWeight: "700"
        }}>You're Ready!</h1>
        <p style={{
          fontSize: "clamp(16px, 3vw, 18px)",
          color: "#6B7280",
          marginBottom: "40px",
          fontFamily: "'Nunito', sans-serif",
          lineHeight: "1.6"
        }}>
          Share this link with the other person, then enter the room.
        </p>
      
      <div style={{
        background: "white",
        padding: "24px",
        borderRadius: "12px",
        marginBottom: "32px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
      }}>
        <p style={{
          fontSize: "16px",
          marginBottom: "12px",
          color: "#6B7280",
          fontWeight: "500"
        }}>Share this link:</p>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <input
            type="text"
            value={inviteLink}
            readOnly
            style={{
              flex: 1,
              minWidth: "200px",
              padding: "12px",
              border: "2px solid #E5E7EB",
              borderRadius: "12px",
              background: "#F9FAFB",
              fontSize: "14px",
              fontFamily: "'Nunito', sans-serif"
            }}
          />
          <button onClick={copyToClipboard} style={{
            padding: "12px 24px",
            background: "#7DD3C0",
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontFamily: "'Nunito', sans-serif",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.2s"
          }}>
            Copy
          </button>
        </div>
      </div>
      
      <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginBottom: "32px", flexWrap: "wrap" }}>
        <button onClick={shareWhatsApp} style={{
          padding: "14px 28px",
          background: "#25D366",
          color: "white",
          border: "none",
          borderRadius: "12px",
          fontFamily: "'Nunito', sans-serif",
          fontSize: "16px",
          fontWeight: "600",
          cursor: "pointer",
          transition: "all 0.2s",
          boxShadow: "0 2px 8px rgba(37, 211, 102, 0.3)"
        }}>
          📱 WhatsApp
        </button>
        <button onClick={shareEmail} style={{
          padding: "14px 28px",
          background: "#7C6CB6",
          color: "white",
          border: "none",
          borderRadius: "12px",
          fontFamily: "'Nunito', sans-serif",
          fontSize: "16px",
          fontWeight: "600",
          cursor: "pointer",
          transition: "all 0.2s",
          boxShadow: "0 2px 8px rgba(124, 108, 182, 0.3)"
        }}>
          ✉️ Email
        </button>
      </div>
      
      <div style={{
        background: roomPhase === "main_room" ? "#E8F9F5" : "#FEF3E2",
        padding: "24px",
        borderRadius: "12px",
        marginBottom: "24px",
        border: `2px solid ${buttonState.color}`,
        boxShadow: "0 4px 12px rgba(0,0,0,0.06)"
      }}>
        <p style={{
          fontSize: "18px",
          margin: "0 0 12px 0",
          fontWeight: "700",
          fontFamily: "'Nunito', sans-serif",
          color: "#374151"
        }}>
          {roomPhase === "main_room" ? "✅ Ready to Start!" : "⏳ Status Update"}
        </p>
        <p style={{
          fontSize: "15px",
          margin: 0,
          color: "#4B5563",
          fontFamily: "'Nunito', sans-serif",
          lineHeight: "1.6"
        }}>
          {buttonState.description}
        </p>
      </div>

        <button
          onClick={enterRoom}
          disabled={buttonState.disabled}
          style={{
            width: "100%",
            padding: "18px",
            background: buttonState.disabled ? "#D1D5DB" : "#7DD3C0",
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontSize: "20px",
            fontWeight: "700",
            fontFamily: "'Nunito', sans-serif",
            cursor: buttonState.disabled ? "not-allowed" : "pointer",
            opacity: buttonState.disabled ? 0.6 : 1,
            transition: "all 0.3s ease",
            boxShadow: buttonState.disabled ? "none" : "0 4px 12px rgba(125, 211, 192, 0.3)"
          }}
        >
          {buttonState.text}
        </button>
      </div>
    </div>
  );
}
