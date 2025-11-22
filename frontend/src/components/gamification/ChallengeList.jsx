import React from "react";
import { useGamification } from "../../context/GamificationContext";

export default function ChallengeList({ compact = false }) {
  const { challenges, challengeStats, claimChallengeReward, loading } = useGamification();

  if (loading || !challenges) {
    return (
      <div style={{
        padding: compact ? "12px" : "16px",
        background: "rgba(139, 92, 246, 0.1)",
        borderRadius: "12px",
        border: "1px solid rgba(139, 92, 246, 0.3)"
      }}>
        <div style={{ textAlign: "center", color: "rgba(255, 255, 255, 0.5)", fontSize: "14px" }}>
          Loading challenges...
        </div>
      </div>
    );
  }

  if (challenges.length === 0) {
    return (
      <div style={{
        padding: compact ? "12px" : "16px",
        background: "rgba(139, 92, 246, 0.1)",
        borderRadius: "12px",
        border: "1px solid rgba(139, 92, 246, 0.3)"
      }}>
        <div style={{ textAlign: "center", color: "rgba(255, 255, 255, 0.5)", fontSize: "14px" }}>
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
      background: "rgba(139, 92, 246, 0.1)",
      borderRadius: "12px",
      padding: compact ? "12px" : "16px",
      border: "1px solid rgba(139, 92, 246, 0.3)",
      boxShadow: "0 0 20px rgba(139, 92, 246, 0.2)"
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
          color: "white"
        }}>
          Today's Challenges
        </h3>
        <span style={{
          fontSize: compact ? "12px" : "13px",
          color: "#a78bfa",
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
        ? (isClaimed ? "rgba(100, 100, 100, 0.1)" : "rgba(34, 197, 94, 0.15)")
        : "rgba(139, 92, 246, 0.08)",
      border: `1px solid ${isComplete ? (isClaimed ? "rgba(100, 100, 100, 0.3)" : "rgba(34, 197, 94, 0.4)") : "rgba(139, 92, 246, 0.3)"}`,
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
            color: isClaimed ? "rgba(255, 255, 255, 0.4)" : "white",
            marginBottom: "2px"
          }}>
            {challenge.title}
          </div>
          <div style={{
            fontSize: compact ? "11px" : "12px",
            color: isClaimed ? "rgba(255, 255, 255, 0.3)" : "rgba(255, 255, 255, 0.6)"
          }}>
            {challenge.description}
          </div>
        </div>
        <div style={{
          fontSize: compact ? "11px" : "12px",
          fontWeight: "600",
          color: isClaimed ? "rgba(255, 255, 255, 0.3)" : "#a78bfa",
          whiteSpace: "nowrap"
        }}>
          +{challenge.score_reward}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        height: "6px",
        background: "rgba(139, 92, 246, 0.2)",
        borderRadius: "3px",
        overflow: "hidden",
        marginBottom: compact ? "6px" : "8px"
      }}>
        <div style={{
          height: "100%",
          width: `${progressPercent}%`,
          background: isComplete
            ? (isClaimed ? "rgba(255, 255, 255, 0.3)" : "#22c55e")
            : "#8b5cf6",
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
          color: isClaimed ? "rgba(255, 255, 255, 0.3)" : "rgba(255, 255, 255, 0.5)"
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
              background: "rgba(34, 197, 94, 0.3)",
              border: "1px solid rgba(34, 197, 94, 0.5)",
              borderRadius: "50px",
              cursor: "pointer",
              boxShadow: "0 0 10px rgba(34, 197, 94, 0.4)"
            }}
          >
            Claim
          </button>
        ) : isClaimed ? (
          <span style={{
            fontSize: compact ? "10px" : "11px",
            color: "rgba(255, 255, 255, 0.3)"
          }}>
            Claimed
          </span>
        ) : null}
      </div>
    </div>
  );
}
