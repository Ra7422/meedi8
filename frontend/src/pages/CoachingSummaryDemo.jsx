import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SimpleBreathing from "../components/SimpleBreathing";

export default function CoachingSummaryDemo() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedSummary, setEditedSummary] = useState("I'm concerned about our spending habits, particularly recent purchases like the gaming console that we agreed not to buy. I feel frustrated and worried about our financial future - specifically our ability to save for major goals like buying a house and planning for retirement. When these disagreements happen, we often stop communicating for days, which makes the problem worse. I want us to find a way to work together on our finances and communicate better when we disagree.");
  const [hasShared, setHasShared] = useState(false);
  const [roomPhase, setRoomPhase] = useState("user2_lobby"); // Can toggle to "user2_coaching" or "main_room"

  const handleShare = () => {
    setHasShared(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText("http://localhost:5173/join/abc123xyz");
    alert("Link copied to clipboard!");
    handleShare();
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #EAF7F0 0%, #ffffff 100%)",
      fontFamily: "'Nunito', sans-serif",
      padding: "20px"
    }}>
      <div style={{
        maxWidth: "3200px",
        margin: "0 auto",
        padding: "0 40px"
      }}>
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px"
        }}>
          <h1 style={{
            margin: 0,
            fontSize: "28px",
            color: "#7DD3C0",
            fontWeight: "700"
          }}>
            Your Summary & Invite
          </h1>
          <button
            onClick={() => navigate("/coaching-demo")}
            style={{
              padding: "8px 16px",
              background: "#F3F4F6",
              border: "2px solid #E5E7EB",
              borderRadius: "8px",
              fontSize: "14px",
              cursor: "pointer",
              fontFamily: "'Nunito', sans-serif",
              fontWeight: "600",
              color: "#6B7280"
            }}
          >
            ← Back
          </button>
        </div>

        {/* Summary Card */}
        <div style={{
          marginBottom: "24px",
          padding: "24px",
          background: "#6750A4",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          border: "2px solid #E5E7EB"
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px"
          }}>
            <h3 style={{
              margin: 0,
              color: "#CCB2FF",
              fontSize: "18px",
              fontWeight: "700"
            }}>
              Your Perspective
            </h3>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  padding: "8px 16px",
                  background: "#6750A4",
                  border: "2px solid #CCB2FF",
                  borderRadius: "8px",
                  fontSize: "14px",
                  cursor: "pointer",
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: "600",
                  color: "#CCB2FF"
                }}
              >
                Edit
              </button>
            )}
          </div>
          {isEditing ? (
            <>
              <textarea
                value={editedSummary}
                onChange={(e) => setEditedSummary(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: "140px",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "2px solid #E5E7EB",
                  marginBottom: "12px",
                  fontSize: "15px",
                  fontFamily: "'Nunito', sans-serif",
                  lineHeight: "1.6",
                  resize: "vertical"
                }}
              />
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setIsEditing(false)}
                  style={{
                    padding: "10px 20px",
                    background: "#7DD3C0",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    cursor: "pointer",
                    fontFamily: "'Nunito', sans-serif",
                    fontWeight: "600"
                  }}
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  style={{
                    padding: "10px 20px",
                    background: "#F3F4F6",
                    border: "2px solid #E5E7EB",
                    borderRadius: "8px",
                    fontSize: "14px",
                    cursor: "pointer",
                    fontFamily: "'Nunito', sans-serif",
                    fontWeight: "600",
                    color: "#6B7280"
                  }}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <p style={{
              margin: 0,
              whiteSpace: "pre-wrap",
              fontSize: "15px",
              lineHeight: "1.7",
              color: "#9CDAD5"
            }}>
              {editedSummary}
            </p>
          )}
        </div>

        {/* Breathing Exercise - shows after sharing */}
        {hasShared && roomPhase !== "main_room" && (
          <div style={{
            marginBottom: "24px",
            padding: "24px",
            background: "linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%)",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            border: "1px solid rgba(139, 92, 246, 0.3)"
          }}>
            <h3 style={{
              margin: "0 0 16px 0",
              color: "#7DD3C0",
              fontSize: "18px",
              fontWeight: "700",
              textAlign: "center"
            }}>
              While You Wait...
            </h3>
            <p style={{
              margin: "0 0 16px 0",
              fontSize: "15px",
              color: "#d1d5db",
              textAlign: "center",
              lineHeight: "1.6"
            }}>
              Take a moment to center yourself with this breathing exercise
            </p>
            <SimpleBreathing startCountdown={hasShared} />
          </div>
        )}

        {/* Traffic Light Status */}
        <div style={{
          padding: "20px",
          background: "#6750A4",
          borderRadius: "12px",
          marginBottom: "20px",
          border: "2px solid #9CDAD5",
          boxShadow: "0 4px 12px rgba(0,0,0,0.06)"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "10px"
          }}>
            <img
              src={
                roomPhase === "user2_lobby" ? "/assets/icons/red_led.svg" :
                roomPhase === "user2_coaching" ? "/assets/icons/orange_led.svg" :
                "/assets/icons/green_led.svg"
              }
              alt="Status indicator"
              style={{ width: "24px", height: "24px" }}
            />
            <p style={{
              margin: 0,
              fontWeight: "700",
              fontSize: "18px",
              color: "#CCB2FF",
              fontFamily: "'Nunito', sans-serif"
            }}>
              {roomPhase === "user2_lobby" && "Waiting for Other Person to Join"}
              {roomPhase === "user2_coaching" && "Other Person is in Coaching"}
              {roomPhase === "main_room" && "Ready to Enter Main Room!"}
            </p>
          </div>
          <p style={{
            fontSize: "15px",
            color: "#9CDAD5",
            margin: 0,
            fontFamily: "'Nunito', sans-serif",
            lineHeight: "1.6"
          }}>
            {roomPhase === "user2_lobby" && "The link has been created. Waiting for them to accept the invite..."}
            {roomPhase === "user2_coaching" && "They've joined! They're completing their coaching session now..."}
            {roomPhase === "main_room" && "They've completed their coaching! Click below to start the conversation."}
          </p>
        </div>

        {/* Invite Link Section - only show in lobby phase */}
        {roomPhase === "user2_lobby" && (
          <div style={{
            padding: "24px",
            background: "#6750A4",
            borderRadius: "12px",
            marginBottom: "20px",
            border: "2px solid #9CDAD5",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
          }}>
          <h3 style={{
            marginTop: 0,
            marginBottom: "16px",
            fontSize: "18px",
            color: "#CCB2FF",
            fontFamily: "'Nunito', sans-serif",
            fontWeight: "700"
          }}>
            📨 Share Invite Link
          </h3>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "20px"
          }}>
            <input
              type="text"
              value="http://localhost:5173/join/abc123xyz"
              readOnly
              onClick={(e) => e.target.select()}
              style={{
                flex: 1,
                padding: "14px",
                borderRadius: "12px",
                border: "2px solid #9CDAD5",
                background: "rgba(255, 255, 255, 0.1)",
                color: "#9CDAD5",
                fontSize: "15px",
                fontFamily: "'Nunito', sans-serif"
              }}
            />
          </div>

          <div style={{
            display: "flex",
            gap: "16px",
            justifyContent: "center",
            alignItems: "center"
          }}>
            <button
              onClick={copyToClipboard}
              title="Copy Link"
              style={{
                width: "48px",
                height: "48px",
                background: "rgba(204, 178, 255, 0.2)",
                border: "2px solid #CCB2FF",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s"
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#CCB2FF" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            </button>

            <button
              onClick={handleShare}
              title="Share via iMessage"
              style={{
                width: "48px",
                height: "48px",
                background: "rgba(204, 178, 255, 0.2)",
                border: "2px solid #CCB2FF",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s"
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#CCB2FF">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3 .97 4.29L2 22l5.71-.97C9 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.38 0-2.68-.28-3.87-.78l-.28-.15-2.89.49.49-2.89-.15-.28C4.78 14.68 4.5 13.38 4.5 12c0-4.14 3.36-7.5 7.5-7.5s7.5 3.36 7.5 7.5-3.36 7.5-7.5 7.5z"/>
                <circle cx="8" cy="12" r="1" fill="#CCB2FF"/>
                <circle cx="12" cy="12" r="1" fill="#CCB2FF"/>
                <circle cx="16" cy="12" r="1" fill="#CCB2FF"/>
              </svg>
            </button>

            <button
              onClick={handleShare}
              title="Share via WhatsApp"
              style={{
                width: "48px",
                height: "48px",
                background: "rgba(204, 178, 255, 0.2)",
                border: "2px solid #CCB2FF",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s"
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#CCB2FF">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </button>

            <button
              onClick={handleShare}
              title="Share via Email"
              style={{
                width: "48px",
                height: "48px",
                background: "rgba(204, 178, 255, 0.2)",
                border: "2px solid #CCB2FF",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s"
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#CCB2FF" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </button>

            <button
              onClick={handleShare}
              title="Share"
              style={{
                width: "48px",
                height: "48px",
                background: "rgba(204, 178, 255, 0.2)",
                border: "2px solid #CCB2FF",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s"
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#CCB2FF" strokeWidth="2">
                <circle cx="18" cy="5" r="3"/>
                <circle cx="6" cy="12" r="3"/>
                <circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
            </button>
          </div>
        </div>
        )}

        {/* Enter Main Room Button (only when ready) */}
        {roomPhase === "main_room" && (
          <button
            style={{
              padding: "16px 24px",
              background: "#7DD3C0",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontSize: "18px",
              fontWeight: "700",
              cursor: "pointer",
              width: "100%",
              fontFamily: "'Nunito', sans-serif",
              boxShadow: "0 4px 12px rgba(125, 211, 192, 0.3)"
            }}
          >
            Enter Main Room →
          </button>
        )}

        {/* Demo Controls */}
        <div style={{
          marginTop: "32px",
          padding: "20px",
          background: "#FEF3E2",
          border: "2px solid #F59E0B",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.06)"
        }}>
          <h4 style={{
            margin: "0 0 12px 0",
            fontSize: "16px",
            color: "#92400E",
            fontWeight: "700"
          }}>
            📌 Demo Controls
          </h4>
          <p style={{
            margin: "0 0 12px 0",
            fontSize: "14px",
            color: "#78350F"
          }}>
            Toggle the room status to see different states:
          </p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              onClick={() => setRoomPhase("user2_lobby")}
              style={{
                padding: "8px 16px",
                background: roomPhase === "user2_lobby" ? "#EF4444" : "#F3F4F6",
                color: roomPhase === "user2_lobby" ? "white" : "#6B7280",
                border: "none",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                fontFamily: "'Nunito', sans-serif"
              }}
            >
              🔴 Waiting
            </button>
            <button
              onClick={() => setRoomPhase("user2_coaching")}
              style={{
                padding: "8px 16px",
                background: roomPhase === "user2_coaching" ? "#F59E0B" : "#F3F4F6",
                color: roomPhase === "user2_coaching" ? "white" : "#6B7280",
                border: "none",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                fontFamily: "'Nunito', sans-serif"
              }}
            >
              🟡 Coaching
            </button>
            <button
              onClick={() => setRoomPhase("main_room")}
              style={{
                padding: "8px 16px",
                background: roomPhase === "main_room" ? "#7DD3C0" : "#F3F4F6",
                color: roomPhase === "main_room" ? "white" : "#6B7280",
                border: "none",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                fontFamily: "'Nunito', sans-serif"
              }}
            >
              🟢 Ready
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
