import React from "react";
import { useGamification } from "../../context/GamificationContext";

export default function HealthScore({ size = 120, showTier = true, showLabel = true }) {
  const { healthScore, loading, getTierColor } = useGamification();

  if (loading || !healthScore) {
    return (
      <div style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{
          width: size * 0.3,
          height: size * 0.3,
          borderRadius: "50%",
          border: "3px solid rgba(255,255,255,0.3)",
          borderTopColor: "transparent",
          animation: "spin 1s linear infinite"
        }} />
      </div>
    );
  }

  const score = healthScore.health_score;
  const tier = healthScore.health_tier;
  const tierColor = getTierColor(tier);

  // Calculate stroke dasharray for circular progress
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  // Color gradient based on score
  const getScoreColor = () => {
    if (score >= 90) return "#a855f7"; // Purple (platinum)
    if (score >= 70) return "#eab308"; // Gold
    if (score >= 40) return "#9ca3af"; // Silver
    return "#cd7f32"; // Bronze
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 8
    }}>
      <div style={{ position: "relative", width: size, height: size }}>
        {/* Background circle */}
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getScoreColor()}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>

        {/* Score number in center */}
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center"
        }}>
          <div style={{
            fontSize: size * 0.3,
            fontWeight: "bold",
            color: "white"
          }}>
            {score}
          </div>
          {showLabel && (
            <div style={{
              fontSize: size * 0.1,
              color: "rgba(255, 255, 255, 0.6)",
              textTransform: "uppercase",
              letterSpacing: 1
            }}>
              Score
            </div>
          )}
        </div>
      </div>

      {/* Tier badge with gemstone theme */}
      {showTier && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 12px",
          borderRadius: 12,
          background: `${tierColor}25`,
          border: `1px solid ${tierColor}50`
        }}>
          <span style={{ fontSize: 14 }}>
            {tier === "platinum" ? "💎" : tier === "gold" ? "🔶" : tier === "silver" ? "🔷" : "🟤"}
          </span>
          <span style={{
            fontSize: 12,
            fontWeight: 600,
            color: "white",
            textTransform: "capitalize"
          }}>
            {tier}
          </span>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
