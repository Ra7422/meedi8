import React, { useEffect, useState } from "react";
import { useGamification } from "../../context/GamificationContext";
import { useNavigate } from "react-router-dom";

const MILESTONES = {
  70: {
    title: "Rising Star!",
    icon: "⭐",
    color: "#3b82f6",
    offer: "3-day PRO trial",
    description: "You've reached 70 points! Unlock PRO features to accelerate your growth."
  },
  80: {
    title: "Golden Path!",
    icon: "🥇",
    color: "#eab308",
    offer: "7-day PRO trial",
    description: "80 points achieved! Experience the full power of PRO features."
  },
  90: {
    title: "Almost Elite!",
    icon: "💎",
    color: "#8b5cf6",
    offer: "50% off first month",
    description: "90 points! You're almost at Platinum. Unlock PRO at half price!"
  }
};

export default function MilestoneOfferModal() {
  const { healthScore } = useGamification();
  const navigate = useNavigate();
  const [milestone, setMilestone] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!healthScore) return;

    const score = healthScore.current_score;

    // Check if we've crossed a milestone
    // Store shown milestones in localStorage to not show again
    const shownMilestones = JSON.parse(localStorage.getItem("shownMilestones") || "[]");

    for (const threshold of [70, 80, 90]) {
      if (score >= threshold && !shownMilestones.includes(threshold)) {
        setMilestone(threshold);
        setVisible(true);
        // Mark as shown
        shownMilestones.push(threshold);
        localStorage.setItem("shownMilestones", JSON.stringify(shownMilestones));
        break;
      }
    }
  }, [healthScore]);

  if (!milestone || !visible) return null;

  const data = MILESTONES[milestone];

  const handleDismiss = () => {
    setVisible(false);
    setMilestone(null);
  };

  const handleClaim = () => {
    // Navigate to subscription page
    navigate("/subscription");
    handleDismiss();
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
        animation: "milestoneFadeIn 0.3s ease"
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
          animation: "milestonePopIn 0.5s ease"
        }}
      >
        {/* Badge */}
        <div style={{
          fontSize: 12,
          fontWeight: 600,
          color: data.color,
          textTransform: "uppercase",
          letterSpacing: 3,
          marginBottom: 16
        }}>
          Score Milestone!
        </div>

        {/* Icon */}
        <div style={{
          fontSize: 64,
          marginBottom: 16,
          filter: `drop-shadow(0 0 20px ${data.color})`,
          animation: "milestoneIconPulse 1.5s ease infinite"
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

        {/* Score */}
        <div style={{
          fontSize: 36,
          fontWeight: 800,
          color: data.color,
          marginBottom: 16
        }}>
          {milestone} pts
        </div>

        {/* Description */}
        <div style={{
          fontSize: 14,
          color: "rgba(255, 255, 255, 0.8)",
          textAlign: "center",
          marginBottom: 20,
          maxWidth: 280
        }}>
          {data.description}
        </div>

        {/* Offer badge */}
        <div style={{
          padding: "12px 24px",
          background: `linear-gradient(135deg, ${data.color}30 0%, ${data.color}10 100%)`,
          borderRadius: 50,
          border: `1px solid ${data.color}50`,
          marginBottom: 24
        }}>
          <span style={{
            fontSize: 16,
            fontWeight: 700,
            color: data.color
          }}>
            🎁 {data.offer}
          </span>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={handleDismiss}
            style={{
              padding: "10px 24px",
              fontSize: 14,
              fontWeight: 600,
              color: "rgba(255, 255, 255, 0.6)",
              background: "transparent",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: 50,
              cursor: "pointer"
            }}
          >
            Maybe Later
          </button>
          <button
            onClick={handleClaim}
            style={{
              padding: "10px 24px",
              fontSize: 14,
              fontWeight: 600,
              color: "white",
              background: `linear-gradient(135deg, ${data.color} 0%, ${data.color}cc 100%)`,
              border: "none",
              borderRadius: 50,
              cursor: "pointer",
              boxShadow: `0 0 20px ${data.color}60`
            }}
          >
            Claim Offer
          </button>
        </div>
      </div>

      <style>{`
        @keyframes milestoneFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes milestonePopIn {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes milestoneIconPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
