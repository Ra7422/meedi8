import React, { useEffect, useState } from "react";
import { useGamification } from "../../context/GamificationContext";

export default function AchievementToast() {
  const { achievementToast } = useGamification();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (achievementToast) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 4800);
      return () => clearTimeout(timer);
    }
  }, [achievementToast]);

  if (!achievementToast || !visible) return null;

  const getRarityColor = () => {
    switch (achievementToast.rarity) {
      case "legendary": return "#a855f7";
      case "epic": return "#8b5cf6";
      case "rare": return "#3b82f6";
      default: return "#22c55e";
    }
  };

  const getRarityGlow = () => {
    switch (achievementToast.rarity) {
      case "legendary": return "0 0 30px rgba(168, 85, 247, 0.5)";
      case "epic": return "0 0 25px rgba(139, 92, 246, 0.4)";
      case "rare": return "0 0 20px rgba(59, 130, 246, 0.3)";
      default: return "0 0 15px rgba(34, 197, 94, 0.3)";
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      zIndex: 10000,
      animation: "achievementPopIn 0.5s ease"
    }}>
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "24px 32px",
        background: `linear-gradient(135deg, ${getRarityColor()}22 0%, ${getRarityColor()}11 100%)`,
        border: `2px solid ${getRarityColor()}`,
        borderRadius: 16,
        boxShadow: getRarityGlow(),
        backdropFilter: "blur(10px)",
        minWidth: 280
      }}>
        {/* Achievement unlocked header */}
        <div style={{
          fontSize: 12,
          fontWeight: 600,
          color: getRarityColor(),
          textTransform: "uppercase",
          letterSpacing: 2,
          marginBottom: 12
        }}>
          Achievement Unlocked!
        </div>

        {/* Icon */}
        <div style={{
          fontSize: 48,
          marginBottom: 12,
          animation: "achievementBounce 0.6s ease 0.3s"
        }}>
          {achievementToast.icon}
        </div>

        {/* Name */}
        <div style={{
          fontSize: 18,
          fontWeight: 700,
          color: "white",
          marginBottom: 4,
          textAlign: "center"
        }}>
          {achievementToast.name}
        </div>

        {/* Description */}
        <div style={{
          fontSize: 13,
          color: "rgba(255,255,255,0.7)",
          textAlign: "center",
          marginBottom: 12
        }}>
          {achievementToast.description}
        </div>

        {/* XP reward */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          background: "rgba(34, 197, 94, 0.2)",
          borderRadius: 8,
          border: "1px solid rgba(34, 197, 94, 0.3)"
        }}>
          <span style={{ fontSize: 14 }}>+{achievementToast.xp_reward}</span>
          <span style={{ fontSize: 12, color: "#86efac" }}>XP</span>
        </div>

        {/* Rarity badge */}
        <div style={{
          marginTop: 8,
          fontSize: 10,
          color: getRarityColor(),
          textTransform: "uppercase",
          letterSpacing: 1
        }}>
          {achievementToast.rarity}
        </div>
      </div>

      <style>{`
        @keyframes achievementPopIn {
          0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 0;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1);
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
        }
        @keyframes achievementBounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
}
