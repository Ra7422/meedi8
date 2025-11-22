import React, { useEffect, useState } from "react";
import { useGamification } from "../../context/GamificationContext";

export default function ScoreEventToast() {
  const { scoreToast } = useGamification();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (scoreToast) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 2800);
      return () => clearTimeout(timer);
    }
  }, [scoreToast]);

  if (!scoreToast || !visible) return null;

  const getTypeColor = () => {
    switch (scoreToast.type) {
      case "breathing": return "#8b5cf6";
      case "gratitude": return "#a855f7";
      case "mood": return "#8b5cf6";
      case "checkin": return "#22c55e";
      default: return "#8b5cf6";
    }
  };

  const getTypeEmoji = () => {
    switch (scoreToast.type) {
      case "breathing": return "🫧";
      case "gratitude": return "💜";
      case "mood": return "🌤️";
      case "checkin": return "💎";
      default: return "✨";
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 20,
      right: 20,
      zIndex: 9999,
      animation: "slideIn 0.3s ease, slideOut 0.3s ease 2.5s forwards"
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        background: `linear-gradient(135deg, rgba(30, 20, 50, 0.95) 0%, rgba(20, 15, 35, 0.98) 100%)`,
        border: `1px solid ${getTypeColor()}66`,
        borderRadius: 12,
        boxShadow: `0 4px 25px ${getTypeColor()}55`,
        backdropFilter: "blur(10px)"
      }}>
        <span style={{ fontSize: 24 }}>{getTypeEmoji()}</span>
        <div>
          <div style={{
            fontSize: 13,
            fontWeight: 600,
            color: "white"
          }}>
            {scoreToast.message}
          </div>
          <div style={{
            fontSize: 16,
            fontWeight: "bold",
            color: "#22c55e"
          }}>
            {scoreToast.score}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
