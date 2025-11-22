import React from "react";
import { useGamification } from "../../context/GamificationContext";

export default function ChallengeList({ compact = false }) {
  const { challenges, challengeStats, claimChallengeReward, loading } = useGamification();

  if (loading || !challenges) {
    return (
      <div style={{
        padding: compact ? "12px" : "16px",
        background: "white",
        borderRadius: "12px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
      }}>
        <div style={{ textAlign: "center", color: "#9ca3af", fontSize: "14px" }}>
          Loading challenges...
        </div>
      </div>
    );
  }

  if (challenges.length === 0) {
    return (
      <div style={{
        padding: compact ? "12px" : "16px",
        background: "white",
        borderRadius: "12px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
      }}>
        <div style={{ textAlign: "center", color: "#9ca3af", fontSize: "14px" }}>
          No challenges available
        </div>
      </div>
    );
  }

  const handleClaim = async (userChallengeId) => {
    try {
      await claimChallengeReward(userChallengeId);
    } catch (err) {
      console.error("Failed to claim reward:", err);
    }
  };

  return (
    <div style={{
      background: "white",
      borderRadius: "12px",
      padding: compact ? "12px" : "16px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: compact ? "8px" : "12px"
      }}>
        <h3 style={{
          margin: 0,
          fontSize: compact ? "14px" : "16px",
          fontWeight: "600",
          color: "#1f2937"
        }}>
          Today's Challenges
        </h3>
        <span style={{
          fontSize: compact ? "12px" : "13px",
          color: "#7c3aed",
          fontWeight: "500"
        }}>
          {challengeStats.completed}/{challengeStats.total}
        </span>
      </div>

      {/* Challenge cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: compact ? "8px" : "10px" }}>
        {challenges.map((challenge) => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            onClaim={handleClaim}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
}

function ChallengeCard({ challenge, onClaim, compact }) {
  const progressPercent = Math.min(100, (challenge.progress / challenge.target) * 100);
  const isComplete = challenge.completed;
  const isClaimed = challenge.claimed;

  return (
    <div style={{
      padding: compact ? "10px" : "12px",
      borderRadius: "8px",
      background: isComplete
        ? (isClaimed ? "#f3f4f6" : "#f0fdf4")
        : "#f9fafb",
      border: `1px solid ${isComplete ? (isClaimed ? "#e5e7eb" : "#86efac") : "#e5e7eb"}`,
      opacity: isClaimed ? 0.7 : 1
    }}>
      {/* Title and reward */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: compact ? "4px" : "6px"
      }}>
        <div>
          <div style={{
            fontSize: compact ? "13px" : "14px",
            fontWeight: "600",
            color: isClaimed ? "#9ca3af" : "#1f2937",
            marginBottom: "2px"
          }}>
            {challenge.title}
          </div>
          <div style={{
            fontSize: compact ? "11px" : "12px",
            color: isClaimed ? "#9ca3af" : "#6b7280"
          }}>
            {challenge.description}
          </div>
        </div>
        <div style={{
          fontSize: compact ? "11px" : "12px",
          fontWeight: "600",
          color: isClaimed ? "#9ca3af" : "#7c3aed",
          whiteSpace: "nowrap"
        }}>
          +{challenge.score_reward}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        height: "6px",
        background: "#e5e7eb",
        borderRadius: "3px",
        overflow: "hidden",
        marginBottom: compact ? "6px" : "8px"
      }}>
        <div style={{
          height: "100%",
          width: `${progressPercent}%`,
          background: isComplete
            ? (isClaimed ? "#9ca3af" : "#22c55e")
            : "#7c3aed",
          borderRadius: "3px",
          transition: "width 0.3s ease"
        }} />
      </div>

      {/* Progress text or claim button */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <span style={{
          fontSize: compact ? "10px" : "11px",
          color: isClaimed ? "#9ca3af" : "#6b7280"
        }}>
          {challenge.progress}/{challenge.target}
        </span>

        {isComplete && !isClaimed ? (
          <button
            onClick={() => onClaim(challenge.id)}
            style={{
              padding: compact ? "4px 8px" : "4px 10px",
              fontSize: compact ? "10px" : "11px",
              fontWeight: "600",
              color: "white",
              background: "#22c55e",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Claim
          </button>
        ) : isClaimed ? (
          <span style={{
            fontSize: compact ? "10px" : "11px",
            color: "#9ca3af"
          }}>
            Claimed
          </span>
        ) : null}
      </div>
    </div>
  );
}
