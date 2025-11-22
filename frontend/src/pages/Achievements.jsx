import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGamification } from "../context/GamificationContext";
import { useAuth } from "../context/AuthContext";

export default function Achievements() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { achievements, achievementStats, fetchAchievements } = useGamification();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchAchievements().finally(() => setLoading(false));
    }
  }, [token]);

  // Group achievements by category
  const categories = ["all", ...new Set(achievements.map(a => a.category))];

  const filteredAchievements = selectedCategory === "all"
    ? achievements
    : achievements.filter(a => a.category === selectedCategory);

  // Separate earned and unearned for better display
  const earnedAchievements = filteredAchievements.filter(a => a.earned);
  const unearnedAchievements = filteredAchievements.filter(a => !a.earned);

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case "legendary": return "#a855f7";
      case "epic": return "#8b5cf6";
      case "rare": return "#3b82f6";
      default: return "#22c55e";
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8fafc",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🏆</div>
          <p style={{ color: "#6b7280" }}>Loading achievements...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f8fafc",
      padding: "20px",
    }}>
      {/* Header */}
      <div style={{
        maxWidth: "800px",
        margin: "0 auto",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              padding: "8px",
            }}
          >
            ←
          </button>
          <h1 style={{
            margin: 0,
            fontSize: "24px",
            fontWeight: "700",
            color: "#1f2937",
          }}>
            Achievements
          </h1>
          <div style={{ width: "40px" }} />
        </div>

        {/* Progress Summary */}
        <div style={{
          background: "white",
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          textAlign: "center",
        }}>
          <div style={{
            fontSize: "48px",
            fontWeight: "700",
            color: "#7c3aed",
            marginBottom: "8px",
          }}>
            {achievementStats.earned}/{achievementStats.total}
          </div>
          <p style={{
            color: "#6b7280",
            margin: 0,
            fontSize: "14px",
          }}>
            Badges Earned
          </p>
          <div style={{
            marginTop: "16px",
            height: "8px",
            background: "#e5e7eb",
            borderRadius: "4px",
            overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              width: `${(achievementStats.earned / achievementStats.total) * 100}%`,
              background: "linear-gradient(90deg, #7c3aed, #a855f7)",
              borderRadius: "4px",
              transition: "width 0.5s ease",
            }} />
          </div>
        </div>

        {/* Category Filter */}
        <div style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          paddingBottom: "8px",
          marginBottom: "24px",
        }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                border: "none",
                background: selectedCategory === cat ? "#7c3aed" : "white",
                color: selectedCategory === cat ? "white" : "#6b7280",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                whiteSpace: "nowrap",
                textTransform: "capitalize",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Earned Achievements */}
        {earnedAchievements.length > 0 && (
          <div style={{ marginBottom: "32px" }}>
            <h2 style={{
              fontSize: "16px",
              fontWeight: "600",
              color: "#374151",
              marginBottom: "16px",
            }}>
              Earned ({earnedAchievements.length})
            </h2>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: "16px",
            }}>
              {earnedAchievements.map(achievement => (
                <div
                  key={achievement.id}
                  style={{
                    background: "white",
                    borderRadius: "12px",
                    padding: "16px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    borderLeft: `4px solid ${getRarityColor(achievement.rarity)}`,
                    position: "relative",
                  }}
                >
                  <div style={{
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    fontSize: "12px",
                    color: "#22c55e",
                  }}>
                    ✓
                  </div>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>
                    {achievement.icon}
                  </div>
                  <div style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#1f2937",
                    marginBottom: "4px",
                  }}>
                    {achievement.name}
                  </div>
                  <div style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    marginBottom: "8px",
                    lineHeight: "1.4",
                  }}>
                    {achievement.description}
                  </div>
                  <div style={{
                    fontSize: "11px",
                    color: getRarityColor(achievement.rarity),
                    fontWeight: "600",
                    display: "flex",
                    justifyContent: "space-between",
                  }}>
                    <span style={{ textTransform: "capitalize" }}>{achievement.rarity}</span>
                    <span>+{achievement.xp_reward} XP</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unearned Achievements */}
        {unearnedAchievements.length > 0 && (
          <div>
            <h2 style={{
              fontSize: "16px",
              fontWeight: "600",
              color: "#374151",
              marginBottom: "16px",
            }}>
              {earnedAchievements.length > 0 ? "Still to Earn" : "Available Badges"} ({unearnedAchievements.length})
            </h2>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: "16px",
            }}>
              {unearnedAchievements.map(achievement => (
                <div
                  key={achievement.id}
                  style={{
                    background: achievement.visibility_tier === "silhouette" ? "#fef3c7" : "#f3f4f6",
                    borderRadius: "12px",
                    padding: "16px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    borderLeft: `4px solid ${achievement.visibility_tier === "silhouette" ? "#f59e0b" : "#d1d5db"}`,
                    opacity: achievement.visibility_tier === "silhouette" ? 0.9 : 0.7,
                  }}
                >
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>
                    {achievement.icon}
                  </div>
                  <div style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: achievement.visibility_tier === "silhouette" ? "#92400e" : "#6b7280",
                    marginBottom: "4px",
                  }}>
                    {achievement.name}
                  </div>
                  <div style={{
                    fontSize: "12px",
                    color: achievement.visibility_tier === "silhouette" ? "#a16207" : "#9ca3af",
                    marginBottom: "8px",
                    lineHeight: "1.4",
                    fontStyle: achievement.visibility_tier === "silhouette" ? "italic" : "normal",
                  }}>
                    {achievement.description}
                  </div>
                  <div style={{
                    fontSize: "11px",
                    color: "#9ca3af",
                    fontWeight: "600",
                    display: "flex",
                    justifyContent: "space-between",
                  }}>
                    <span style={{ textTransform: "capitalize" }}>{achievement.rarity}</span>
                    <span>+{achievement.xp_reward} XP</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {filteredAchievements.length === 0 && (
          <div style={{
            textAlign: "center",
            padding: "40px",
            color: "#6b7280",
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎯</div>
            <p>No achievements in this category</p>
          </div>
        )}
      </div>
    </div>
  );
}
