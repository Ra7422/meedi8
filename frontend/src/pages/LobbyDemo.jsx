import React from "react";
import { useNavigate } from "react-router-dom";

export default function LobbyDemo() {
  const navigate = useNavigate();

  // Demo data
  const lobbyInfo = {
    user1_name: "Sarah",
    title: "Weekend Plans Discussion",
    user1_issue: "I observe that we've had several disagreements about how to spend our weekends lately. I feel frustrated when my suggestions for activities get dismissed without much discussion. I need us to find a better way to plan our time together so we both feel heard and excited about what we're doing."
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #EAF7F0 0%, #ffffff 100%)',
      padding: '20px',
      fontFamily: "'Nunito', sans-serif",
    }}>
      <div style={{ maxWidth: "700px", margin: "40px auto", padding: "24px" }}>
        <h1 style={{
          fontSize: 'clamp(32px, 6vw, 44px)',
          color: '#7DD3C0',
          fontWeight: '700',
          marginBottom: '16px',
          textAlign: 'center',
        }}>
          You've Been Invited to a Mediation
        </h1>

        <p style={{
          fontSize: "18px",
          color: "#6B7280",
          marginBottom: "32px",
          textAlign: "center",
          lineHeight: "1.6",
        }}>
          <strong style={{ color: '#6750A4' }}>{lobbyInfo.user1_name}</strong> would like to discuss:{" "}
          <strong style={{ color: '#6750A4' }}>{lobbyInfo.title}</strong>
        </p>

        <div style={{
          background: "#FFFFFF",
          padding: "24px",
          borderRadius: "12px",
          marginBottom: "32px",
          border: "2px solid #E5E7EB",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        }}>
          <p style={{
            fontSize: "14px",
            fontWeight: "600",
            marginBottom: "16px",
            color: "#6750A4",
          }}>
            Message from {lobbyInfo.user1_name}:
          </p>
          <div style={{
            fontSize: "15px",
            lineHeight: "1.7",
            whiteSpace: "pre-wrap",
            color: "#1f2937",
            fontStyle: "italic",
            paddingLeft: "16px",
            borderLeft: "3px solid #7DD3C0",
          }}>
            "{lobbyInfo.user1_issue}"
          </div>
        </div>

        <div style={{
          background: "linear-gradient(135deg, #CCB2FF 0%, #9CDAD5 100%)",
          padding: "24px",
          borderRadius: "12px",
          marginBottom: "32px",
          border: "2px solid #CCB2FF",
          boxShadow: "0 4px 12px rgba(204, 178, 255, 0.3)",
        }}>
          <p style={{
            fontSize: "16px",
            lineHeight: "1.6",
            margin: 0,
            color: "#FFFFFF",
            fontWeight: "600",
          }}>
            ✨ <strong>Your turn:</strong> You'll work with Meedi, your AI coach, to prepare your response. Together, we can work through this and find a way forward.
          </p>
        </div>

        <button
          onClick={() => navigate('/coaching-demo-user2')}
          style={{
            width: "100%",
            padding: "18px",
            background: "#7DD3C0",
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontSize: "20px",
            fontWeight: "700",
            cursor: "pointer",
            transition: "all 0.2s",
            boxShadow: "0 4px 12px rgba(125, 211, 192, 0.3)",
            fontFamily: "'Nunito', sans-serif",
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "#6AC3B0";
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 6px 16px rgba(125, 211, 192, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "#7DD3C0";
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 4px 12px rgba(125, 211, 192, 0.3)";
          }}
        >
          Start My AI Coaching
        </button>

        {/* Demo Navigation */}
        <div style={{
          marginTop: "40px",
          padding: "20px",
          background: "rgba(255, 255, 255, 0.8)",
          borderRadius: "12px",
          border: "2px dashed #CCB2FF",
        }}>
          <p style={{
            fontSize: "14px",
            color: "#6750A4",
            fontWeight: "600",
            marginBottom: "12px",
            textAlign: "center",
          }}>
            📋 Demo Navigation
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={() => navigate('/coaching-demo-user2')}
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
              → User 2 Coaching (Purple #CCB2FF)
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
              User 1 Coaching (Teal)
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
