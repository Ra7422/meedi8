import React from "react";
import { useNavigate } from "react-router-dom";

export default function SubscriptionCancelled() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      background: 'linear-gradient(180deg, #EAF7F0 0%, #ffffff 100%)',
      overflow: 'hidden',
      fontFamily: "'Nunito', sans-serif",
    }}>
      <div style={{
        maxWidth: "600px",
        margin: "0 auto",
        padding: "80px 20px",
        textAlign: "center",
        position: "relative",
        zIndex: 1
      }}>
        {/* Sad Mascot */}
        <div style={{ marginBottom: "32px", display: "flex", justifyContent: "center" }}>
          <img
            src="/assets/illustrations/meedi4.svg"
            alt="Sad Meedi"
            style={{ width: "140px", height: "auto" }}
          />
        </div>

        <h1 style={{
          fontSize: "clamp(32px, 7vw, 44px)",
          marginBottom: "20px",
          color: "#7DD3C0",
          fontFamily: "'Nunito', sans-serif",
          fontWeight: "700",
          lineHeight: "1.2"
        }}>
          We're Sad to See You Go
        </h1>

        <p style={{
          fontSize: "clamp(16px, 3vw, 18px)",
          color: "#6B7280",
          marginBottom: "40px",
          fontFamily: "'Nunito', sans-serif",
          lineHeight: "1.6"
        }}>
          We understand. Sometimes you need a different kind of support. If you're looking for more personalized help, consider professional online therapy.
        </p>

        <div style={{
          background: "white",
          border: "2px solid #E5E7EB",
          borderRadius: "12px",
          padding: "28px",
          marginBottom: "40px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.06)"
        }}>
          <p style={{
            margin: "0 0 16px 0",
            color: "#4B5563",
            lineHeight: "1.7",
            fontFamily: "'Nunito', sans-serif",
            fontSize: "15px"
          }}>
            You can still use all free features including text-based mediation and your one trial voice conversation.
            When you're ready to unlock unlimited voice recording, visit the subscription page.
          </p>
          <p style={{
            margin: 0,
            color: "#4B5563",
            lineHeight: "1.7",
            fontFamily: "'Nunito', sans-serif",
            fontSize: "15px"
          }}>
            Or, if you need deeper support, visit our <a href="/referrals" style={{ color: "#7DD3C0", fontWeight: "700", textDecoration: "none" }}>referrals page</a> to connect with professional online therapy services.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => navigate("/referrals")}
            style={{
              padding: "16px 32px",
              background: "#7DD3C0",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: "700",
              fontFamily: "'Nunito', sans-serif",
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: "0 4px 12px rgba(125, 211, 192, 0.3)"
            }}
          >
            View Therapy Options
          </button>
          <button
            onClick={() => navigate("/subscription")}
            style={{
              padding: "16px 32px",
              background: "#F3F4F6",
              color: "#374151",
              border: "2px solid #E5E7EB",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: "600",
              fontFamily: "'Nunito', sans-serif",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            View Plans
          </button>
          <button
            onClick={() => navigate("/sessions")}
            style={{
              padding: "16px 32px",
              background: "#F3F4F6",
              color: "#374151",
              border: "2px solid #E5E7EB",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: "600",
              fontFamily: "'Nunito', sans-serif",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            Back to Sessions
          </button>
        </div>
      </div>
    </div>
  );
}
