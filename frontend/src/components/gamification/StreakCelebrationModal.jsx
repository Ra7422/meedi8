import React, { useEffect, useState } from "react";
import { useGamification } from "../../context/GamificationContext";

export default function StreakCelebrationModal() {
  const { streakCelebration, dismissStreakCelebration, showStreakCelebration } = useGamification();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (streakCelebration) {
      setVisible(true);
    }
  }, [streakCelebration]);

  // Expose test function globally (remove in production)
  useEffect(() => {
    window.testStreakCelebration = (days) => {
      showStreakCelebration(days);
    };
    return () => {
      delete window.testStreakCelebration;
    };
  }, [showStreakCelebration]);

  if (!streakCelebration || !visible) return null;

  const getMilestoneData = () => {
    switch (streakCelebration.milestone) {
      case 7:
        return {
          title: "Week Warrior!",
          icon: "🔥",
          color: "#22c55e",
          message: "You've maintained your streak for a full week!",
          bonus: "+10"
        };
      case 14:
        return {
          title: "Fortnight Fighter!",
          icon: "⭐",
          color: "#3b82f6",
          message: "Two weeks of consistent dedication!",
          bonus: "+15"
        };
      case 30:
        return {
          title: "Monthly Master!",
          icon: "🏆",
          color: "#eab308",
          message: "An entire month of commitment! Incredible!",
          bonus: "+25"
        };
      case 60:
        return {
          title: "Dedication Hero!",
          icon: "💎",
          color: "#8b5cf6",
          message: "60 days strong! You're unstoppable!",
          bonus: "+40"
        };
      case 90:
        return {
          title: "Legendary Streak!",
          icon: "👑",
          color: "#f59e0b",
          message: "90 days! You've achieved legendary status!",
          bonus: "+60"
        };
      default:
        return {
          title: `${streakCelebration.milestone} Day Streak!`,
          icon: "🔥",
          color: "#22c55e",
          message: "Keep up the great work!",
          bonus: "+5"
        };
    }
  };

  const data = getMilestoneData();

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => {
      dismissStreakCelebration();
    }, 300);
  };

  return (
    <div
      onClick={handleDismiss}
      style={{
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
        zIndex: 10001,
        animation: "streakFadeIn 0.3s ease"
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "32px 40px",
          background: "linear-gradient(135deg, rgba(30, 20, 50, 0.98) 0%, rgba(20, 15, 35, 0.99) 100%)",
          border: `2px solid ${data.color}`,
          borderRadius: 20,
          boxShadow: `0 0 60px ${data.color}40, 0 0 100px ${data.color}20`,
          backdropFilter: "blur(20px)",
          minWidth: 320,
          maxWidth: "90vw",
          animation: "streakPopIn 0.5s ease"
        }}
      >
        {/* Confetti effect */}
        <div style={{
          position: "absolute",
          top: -20,
          left: "50%",
          transform: "translateX(-50%)",
          animation: "confettiBurst 0.5s ease"
        }}>
          <span style={{ fontSize: 24 }}>🎉</span>
        </div>

        {/* Streak badge */}
        <div style={{
          fontSize: 12,
          fontWeight: 600,
          color: data.color,
          textTransform: "uppercase",
          letterSpacing: 3,
          marginBottom: 16
        }}>
          Milestone Reached!
        </div>

        {/* Icon with glow */}
        <div style={{
          fontSize: 72,
          marginBottom: 16,
          filter: `drop-shadow(0 0 20px ${data.color})`,
          animation: "streakIconPulse 1.5s ease infinite"
        }}>
          {data.icon}
        </div>

        {/* Title */}
        <div style={{
          fontSize: 24,
          fontWeight: 700,
          color: "white",
          marginBottom: 8,
          textAlign: "center",
          textShadow: `0 0 20px ${data.color}80`
        }}>
          {data.title}
        </div>

        {/* Streak count */}
        <div style={{
          fontSize: 48,
          fontWeight: 800,
          color: data.color,
          marginBottom: 8,
          textShadow: `0 0 30px ${data.color}`
        }}>
          {streakCelebration.milestone}
        </div>

        <div style={{
          fontSize: 14,
          color: "rgba(255, 255, 255, 0.5)",
          marginBottom: 16
        }}>
          days in a row
        </div>

        {/* Message */}
        <div style={{
          fontSize: 14,
          color: "rgba(255, 255, 255, 0.8)",
          textAlign: "center",
          marginBottom: 20,
          maxWidth: 250
        }}>
          {data.message}
        </div>

        {/* Bonus reward */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 20px",
          background: `linear-gradient(135deg, ${data.color}30 0%, ${data.color}10 100%)`,
          borderRadius: 50,
          border: `1px solid ${data.color}50`
        }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: data.color }}>
            {data.bonus}
          </span>
          <span style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.7)" }}>
            bonus points
          </span>
        </div>

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          style={{
            marginTop: 24,
            padding: "10px 32px",
            fontSize: 14,
            fontWeight: 600,
            color: "white",
            background: "rgba(139, 92, 246, 0.2)",
            border: "1px solid rgba(139, 92, 246, 0.4)",
            borderRadius: 50,
            cursor: "pointer",
            backdropFilter: "blur(8px)",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "rgba(139, 92, 246, 0.3)";
            e.target.style.boxShadow = "0 0 20px rgba(139, 92, 246, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "rgba(139, 92, 246, 0.2)";
            e.target.style.boxShadow = "none";
          }}
        >
          Continue
        </button>
      </div>

      <style>{`
        @keyframes streakFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes streakPopIn {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes streakIconPulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
        @keyframes confettiBurst {
          0% {
            transform: translateX(-50%) scale(0);
            opacity: 0;
          }
          50% {
            transform: translateX(-50%) scale(1.5);
            opacity: 1;
          }
          100% {
            transform: translateX(-50%) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
