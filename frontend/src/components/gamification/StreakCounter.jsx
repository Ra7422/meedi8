import React from "react";
import { useGamification } from "../../context/GamificationContext";

export default function StreakCounter({ showProtect = false, compact = false }) {
  const { streakData, protectStreak, loading } = useGamification();

  if (loading || !streakData) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: compact ? "4px 8px" : "8px 16px",
        background: "rgba(255,255,255,0.1)",
        borderRadius: 12
      }}>
        <span style={{ fontSize: compact ? 16 : 20 }}>🔥</span>
        <span style={{ color: "rgba(255,255,255,0.5)" }}>...</span>
      </div>
    );
  }

  const { current_streak, longest_streak, is_at_risk, can_protect, streak_protected_until } = streakData;

  // Get fire intensity based on streak length
  const getFireEmoji = () => {
    if (current_streak >= 30) return "🔥"; // Could use custom large fire
    if (current_streak >= 14) return "🔥";
    if (current_streak >= 7) return "🔥";
    return "🔥";
  };

  // Get streak message
  const getStreakMessage = () => {
    if (current_streak === 0) return "Start your streak!";
    if (current_streak === 1) return "1 day";
    return `${current_streak} days`;
  };

  const handleProtect = async () => {
    try {
      await protectStreak();
    } catch (err) {
      alert(err.message);
    }
  };

  const isProtected = streak_protected_until && new Date(streak_protected_until) > new Date();

  if (compact) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        background: is_at_risk ? "rgba(239,68,68,0.1)" : "rgba(251,146,60,0.1)",
        borderRadius: 12,
        border: is_at_risk ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(251,146,60,0.3)"
      }}>
        <span style={{ fontSize: 14 }}>{getFireEmoji()}</span>
        <span style={{
          fontSize: 13,
          fontWeight: 600,
          color: is_at_risk ? "#dc2626" : "#ea580c"
        }}>
          {current_streak}
        </span>
        {isProtected && <span style={{ fontSize: 10 }}>🛡️</span>}
      </div>
    );
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: 8,
      padding: 16,
      background: is_at_risk ? "rgba(239,68,68,0.1)" : "rgba(251,146,60,0.1)",
      borderRadius: 16,
      border: is_at_risk ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(251,146,60,0.2)"
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10
        }}>
          <span style={{ fontSize: 28 }}>{getFireEmoji()}</span>
          <div>
            <div style={{
              fontSize: 20,
              fontWeight: "bold",
              color: is_at_risk ? "#fca5a5" : "#fed7aa"
            }}>
              {getStreakMessage()}
            </div>
            <div style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.5)"
            }}>
              Longest: {longest_streak} days
            </div>
          </div>
        </div>

        {isProtected && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "4px 8px",
            background: "rgba(34,197,94,0.2)",
            borderRadius: 8
          }}>
            <span style={{ fontSize: 12 }}>🛡️</span>
            <span style={{ fontSize: 11, color: "#86efac" }}>Protected</span>
          </div>
        )}
      </div>

      {is_at_risk && !isProtected && (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          background: "rgba(239,68,68,0.15)",
          borderRadius: 8,
          marginTop: 4
        }}>
          <span style={{ fontSize: 13, color: "#fca5a5" }}>
            ⚠️ Streak at risk! Activity needed
          </span>
          {showProtect && can_protect && (
            <button
              onClick={handleProtect}
              style={{
                padding: "4px 10px",
                background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
                border: "none",
                borderRadius: 6,
                color: "white",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              🛡️ Protect
            </button>
          )}
        </div>
      )}

      {showProtect && !can_protect && !isProtected && current_streak > 0 && (
        <div style={{
          fontSize: 11,
          color: "rgba(255,255,255,0.4)",
          textAlign: "center"
        }}>
          Streak protection: PRO feature
        </div>
      )}
    </div>
  );
}
