import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api/client";

export default function Lobby() {
  const { inviteToken } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [lobbyInfo, setLobbyInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  
  useEffect(() => {
    const fetchLobbyInfo = async () => {
      try {
        const info = await apiRequest(`/rooms/join/${inviteToken}`, "GET");
        setLobbyInfo(info);
      } catch (error) {
        alert("Invalid or expired invite link");
      }
      setLoading(false);
    };
    fetchLobbyInfo();
  }, [inviteToken]);
  
  const handleJoin = async () => {
    if (!token) {
      sessionStorage.setItem("pendingInvite", inviteToken);
      navigate("/login");
      return;
    }
    
    setJoining(true);
    try {
      await apiRequest(`/rooms/${lobbyInfo.room_id}/join`, "POST", null, token);
      
      // Clean the message: remove disclaimer, handle old "You" format
      let cleanedMessage = lobbyInfo.user1_issue
        .replace(/— This is coaching, not therapy or legal advice\./g, '')
        .replace(/This is coaching, not therapy or legal advice\./g, '')
        .trim();
      
      // If it's in old "You observe" format, transform to first person
      if (cleanedMessage.includes('You observe') || cleanedMessage.includes('You feel')) {
        cleanedMessage = cleanedMessage
          .replace(/\bYou observe\b/g, 'I observe')
          .replace(/\bYou feel\b/g, 'I feel')
          .replace(/\bYou need\b/g, 'I need')
          .replace(/\bYou've\b/g, "I've")
          .replace(/\bYou're\b/g, "I'm")
          .replace(/\byour\b/g, 'my');
      }
      
      const initialMessage = `Welcome to this mediation space. ${lobbyInfo.user1_name} cares about your relationship and wants to work through something that's been on their mind. They've taken time to reflect with an AI coach, and they'd like you to have the same opportunity before you both talk together.

Here's what ${lobbyInfo.user1_name} wants to share with you:

"${cleanedMessage}"

Now I'd like to help you prepare your own perspective so you can respond thoughtfully. Together, we can work through this and find a way forward.`;
      
      sessionStorage.setItem(`room_${lobbyInfo.room_id}_initial`, initialMessage);
      
      navigate(`/rooms/${lobbyInfo.room_id}/coaching`);
    } catch (error) {
      alert("Error joining: " + error.message);
    }
    setJoining(false);
  };
  
  // Clean for display too
  const cleanedSummary = lobbyInfo ? lobbyInfo.user1_issue
    .replace(/— This is coaching, not therapy or legal advice\./g, '')
    .replace(/This is coaching, not therapy or legal advice\./g, '')
    .trim()
    .replace(/\bYou observe\b/g, 'I observe')
    .replace(/\bYou feel\b/g, 'I feel')
    .replace(/\bYou need\b/g, 'I need')
    .replace(/\bYou've\b/g, "I've")
    .replace(/\bYou're\b/g, "I'm")
    .replace(/\byour\b/g, 'my')
    : '';
  
  if (loading) {
    return <div style={{ textAlign: "center", padding: "60px" }}>Loading...</div>;
  }
  
  if (!lobbyInfo) {
    return <div style={{ textAlign: "center", padding: "60px" }}>Invalid invite link</div>;
  }
  
  return (
    <div style={{ maxWidth: "700px", margin: "40px auto", padding: "24px" }}>
      <h1 style={{ marginBottom: "16px" }}>You've Been Invited to a Mediation</h1>
      <p style={{ fontSize: "18px", color: "#666", marginBottom: "32px" }}>
        <strong>{lobbyInfo.user1_name}</strong> would like to discuss: <strong>{lobbyInfo.title}</strong>
      </p>
      
      <div style={{ background: "#f9fafb", padding: "24px", borderRadius: "12px", marginBottom: "32px", border: "1px solid #e5e7eb" }}>
        <p style={{ fontSize: "14px", fontWeight: "600", marginBottom: "16px", color: "#374151" }}>
          Message from {lobbyInfo.user1_name}:
        </p>
        <div style={{ fontSize: "15px", lineHeight: "1.7", whiteSpace: "pre-wrap", color: "#1f2937", fontStyle: "italic" }}>
          "{cleanedSummary}"
        </div>
      </div>
      
      <div style={{ background: "#dbeafe", padding: "20px", borderRadius: "12px", marginBottom: "32px", border: "1px solid #93c5fd" }}>
        <p style={{ fontSize: "16px", lineHeight: "1.6", margin: 0 }}>
          ✨ <strong>Your turn:</strong> You'll work with an AI coach to prepare your response. Together, we can work through this and find a way forward.
        </p>
      </div>
      
      {!token && (
        <p style={{ textAlign: "center", marginBottom: "16px", color: "#666" }}>
          Please log in to continue
        </p>
      )}
      
      <button
        onClick={handleJoin}
        disabled={joining}
        style={{ width: "100%", padding: "16px", background: "#3b82f6", color: "white", border: "none", borderRadius: "8px", fontSize: "18px", fontWeight: "bold", cursor: joining ? "not-allowed" : "pointer", opacity: joining ? 0.5 : 1 }}
      >
        {joining ? "Joining..." : token ? "Start My AI Coaching" : "Log In to Join"}
      </button>
    </div>
  );
}
