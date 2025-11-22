import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api/client";
import { useGamification } from "../context/GamificationContext";
import { HealthScore, StreakCounter, ChallengeList } from "../components/gamification";

export default function SessionsDashboard() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const token = localStorage.getItem("token");
  const { healthScore, performDailyCheckin } = useGamification();

  // Perform daily check-in on load
  useEffect(() => {
    if (token) {
      performDailyCheckin().catch(() => {});
    }
  }, [token]);

  useEffect(() => {
    fetchRooms();
    // Poll for updates every 3 seconds
    const interval = setInterval(fetchRooms, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await apiRequest("/rooms/my-sessions", "GET", null, token);
      // Sort by most recent first, filter out completed sessions
      const activeSessions = response.rooms
        .filter(room => room.phase !== "completed")
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setRooms(activeSessions);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRoomStatus = (room) => {
    const { phase, is_user1, user1_name, user2_name } = room;

    if (is_user1) {
      // User 1 perspective
      switch (phase) {
        case "user1_coaching":
          return {
            emoji: "💭",
            label: "In Coaching",
            color: "#3b82f6",
            description: "Complete your coaching session",
            action: "Continue Coaching",
            canEnter: true
          };
        case "user2_lobby":
          return {
            emoji: "🔴",
            label: "Waiting for Partner",
            color: "#ef4444",
            description: `Waiting for ${user2_name || "other person"} to join`,
            action: "View Invite",
            canEnter: true
          };
        case "user2_coaching":
          return {
            emoji: "🟡",
            label: "Partner in Coaching",
            color: "#f59e0b",
            description: `${user2_name || "Other person"} is completing their coaching`,
            action: "Take a Breath",
            canEnter: false
          };
        case "main_room":
          return {
            emoji: "🟢",
            label: "Ready for Conversation",
            color: "#10b981",
            description: "Both parties ready to begin",
            action: "Enter Main Room",
            canEnter: true
          };
        case "in_session":
          return {
            emoji: "💬",
            label: "In Conversation",
            color: "#8b5cf6",
            description: "Mediation in progress",
            action: "Rejoin Session",
            canEnter: true
          };
        default:
          return {
            emoji: "❓",
            label: "Unknown",
            color: "#6b7280",
            description: "Status unknown",
            action: "View",
            canEnter: true
          };
      }
    } else {
      // User 2 perspective
      switch (phase) {
        case "user2_lobby":
          return {
            emoji: "👋",
            label: "Ready to Join",
            color: "#3b82f6",
            description: `Join ${user1_name}'s mediation`,
            action: "Start Coaching",
            canEnter: true
          };
        case "user2_coaching":
          return {
            emoji: "💭",
            label: "In Coaching",
            color: "#3b82f6",
            description: "Complete your coaching session",
            action: "Continue Coaching",
            canEnter: true
          };
        case "main_room":
          return {
            emoji: "🟢",
            label: "Ready for Conversation",
            color: "#10b981",
            description: "Both parties ready to begin",
            action: "Enter Main Room",
            canEnter: true
          };
        case "in_session":
          return {
            emoji: "💬",
            label: "In Conversation",
            color: "#8b5cf6",
            description: "Mediation in progress",
            action: "Rejoin Session",
            canEnter: true
          };
        default:
          return {
            emoji: "❓",
            label: "Unknown",
            color: "#6b7280",
            description: "Status unknown",
            action: "View",
            canEnter: true
          };
      }
    }
  };

  const handleRoomAction = (room) => {
    const { phase, id, is_user1 } = room;

    if (is_user1) {
      switch (phase) {
        case "user1_coaching":
          navigate(`/coaching/${id}`);
          break;
        case "user2_lobby":
          navigate(`/rooms/${id}/invite`); // Invite share page
          break;
        case "user2_coaching":
          navigate(`/rooms/${id}/invite`); // Show invite page while waiting
          break;
        case "main_room":
        case "in_session":
          navigate(`/main-room/${id}`);
          break;
        default:
          navigate(`/coaching/${id}`);
      }
    } else {
      switch (phase) {
        case "user2_lobby":
        case "user2_coaching":
          navigate(`/coaching/${id}`);
          break;
        case "main_room":
        case "in_session":
          navigate(`/main-room/${id}`);
          break;
        default:
          navigate(`/coaching/${id}`);
      }
    }
  };

  const handleBreathe = (roomId, phase, isUser1) => {
    // Navigate to the appropriate page based on room phase and user role
    if (phase === "main_room" || phase === "in_session") {
      // In main room - go there
      navigate(`/main-room/${roomId}`);
    } else if (isUser1 && (phase === "user2_lobby" || phase === "user2_coaching")) {
      // User 1 waiting for User 2 - go to invite page
      navigate(`/rooms/${roomId}/invite`);
    } else {
      // In coaching - go to coaching page
      navigate(`/coaching/${roomId}`);
    }
  };

  const handleDeleteRoom = async (roomId, roomTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${roomTitle}"? This will permanently delete all data including messages and recordings.`)) {
      return;
    }

    setDeleting(true);
    try {
      await apiRequest(`/rooms/${roomId}`, "DELETE", null, token);
      // Remove from local state
      setRooms(rooms.filter(room => room.id !== roomId));
      setSelectedRooms(selectedRooms.filter(id => id !== roomId));
    } catch (error) {
      alert(`Error deleting room: ${error.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRooms.length === 0) {
      alert("Please select rooms to delete");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedRooms.length} session(s)? This will permanently delete all data including messages and recordings.`)) {
      return;
    }

    setDeleting(true);
    try {
      const response = await apiRequest("/rooms/bulk-delete", "POST", selectedRooms, token);

      // Show results
      if (response.errors && response.errors.length > 0) {
        alert(`Deleted ${response.deleted_count} of ${response.total_requested} rooms. Errors: ${response.errors.join(", ")}`);
      } else {
        alert(`Successfully deleted ${response.deleted_count} room(s)`);
      }

      // Refresh the list
      await fetchRooms();
      setSelectedRooms([]);
    } catch (error) {
      alert(`Error deleting rooms: ${error.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleSelect = (roomId) => {
    if (selectedRooms.includes(roomId)) {
      setSelectedRooms(selectedRooms.filter(id => id !== roomId));
    } else {
      setSelectedRooms([...selectedRooms, roomId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedRooms.length === rooms.length) {
      setSelectedRooms([]);
    } else {
      setSelectedRooms(rooms.map(room => room.id));
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>My Sessions</h1>
        </div>
        <div style={styles.loading}>Loading your sessions...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>My Sessions</h1>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {selectedRooms.length > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={deleting}
              style={{
                ...styles.deleteButton,
                opacity: deleting ? 0.5 : 1,
                cursor: deleting ? "not-allowed" : "pointer"
              }}
            >
              🗑️ Delete ({selectedRooms.length})
            </button>
          )}
          <button onClick={() => navigate("/create")} style={styles.newButton}>
            + New Mediation
          </button>
        </div>
      </div>

      {/* Gamification Stats */}
      <div style={styles.gamificationBar}>
        <div style={styles.gamificationLeft}>
          <HealthScore size={80} showTier={true} showLabel={false} />
        </div>
        <div style={styles.gamificationRight}>
          <StreakCounter compact={true} />
        </div>
      </div>

      {/* Daily Challenges */}
      <div style={{ marginBottom: "24px" }}>
        <ChallengeList compact={true} />
      </div>

      {rooms.length === 0 ? (
        <div style={styles.empty}>
          <p style={styles.emptyText}>No active sessions</p>
          <p style={styles.emptySubtext}>Start a new mediation to begin</p>
        </div>
      ) : (
        <>
          {/* Select All */}
          <div style={styles.selectAllBar}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={rooms.length > 0 && selectedRooms.length === rooms.length}
                onChange={handleSelectAll}
                style={styles.checkbox}
              />
              <span style={{ marginLeft: "8px", fontSize: "14px", fontWeight: "600" }}>
                Select All ({rooms.length})
              </span>
            </label>
          </div>

          <div style={styles.roomsList}>
            {rooms.map((room) => {
              const status = getRoomStatus(room);
              const isSelected = selectedRooms.includes(room.id);
              return (
                <div
                  key={room.id}
                  style={{
                    ...styles.roomCard,
                    border: isSelected ? "2px solid #3b82f6" : "1px solid #e5e7eb"
                  }}
                >
                  {/* Checkbox */}
                  <div style={styles.cardCheckbox}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleToggleSelect(room.id);
                      }}
                      style={styles.checkbox}
                    />
                  </div>

                <div style={styles.roomHeader}>
                  <div style={styles.roomTitle}>
                    <h3 style={styles.roomName}>{room.title}</h3>
                    <div style={{...styles.statusBadge, borderColor: status.color}}>
                      <span style={{fontSize: "16px"}}>{status.emoji}</span>
                      <span style={{color: status.color, fontWeight: 600}}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                  <p style={styles.roomDescription}>{status.description}</p>
                </div>

                <div style={styles.roomInfo}>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>With:</span>
                    <span style={styles.infoValue}>
                      {room.is_user1
                        ? (room.user2_name || "Waiting for partner")
                        : room.user1_name
                      }
                    </span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Started:</span>
                    <span style={styles.infoValue}>
                      {new Date(room.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div style={styles.roomActions}>
                  <button
                    onClick={() => handleRoomAction(room)}
                    disabled={!status.canEnter}
                    style={{
                      ...styles.primaryButton,
                      background: status.canEnter ? status.color : "#e5e7eb",
                      cursor: status.canEnter ? "pointer" : "not-allowed",
                      opacity: status.canEnter ? 1 : 0.5
                    }}
                  >
                    {status.action}
                  </button>

                  {/* Always show breathing exercise option */}
                  <button
                    onClick={() => handleBreathe(room.id, room.phase, room.is_user1)}
                    style={styles.secondaryButton}
                  >
                    🫧 Take a Breath
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteRoom(room.id, room.title);
                    }}
                    disabled={deleting}
                    style={{
                      ...styles.deleteIconButton,
                      cursor: deleting ? "not-allowed" : "pointer",
                      opacity: deleting ? 0.5 : 1
                    }}
                    title="Delete this session"
                  >
                    🗑️
                  </button>
                </div>

                {/* Show notification dot for status changes */}
                {room.status_changed && (
                  <div style={styles.notificationDot} title="Status updated">
                    <span style={styles.pulse}></span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        </>
      )}
      </div>
  );
}

const styles = {
  container: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "20px"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    flexWrap: "wrap",
    gap: "12px"
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    margin: 0,
    color: "#111827"
  },
  newButton: {
    padding: "10px 20px",
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "600"
  },
  gamificationBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
    borderRadius: "16px",
    marginBottom: "24px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
  },
  gamificationLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px"
  },
  gamificationRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  loading: {
    textAlign: "center",
    padding: "40px",
    color: "#6b7280"
  },
  empty: {
    textAlign: "center",
    padding: "60px 20px",
    background: "#f9fafb",
    borderRadius: "12px",
    border: "2px dashed #d1d5db"
  },
  emptyText: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#374151",
    margin: "0 0 8px 0"
  },
  emptySubtext: {
    fontSize: "14px",
    color: "#6b7280",
    margin: 0
  },
  roomsList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },
  roomCard: {
    position: "relative",
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    transition: "box-shadow 0.2s",
    cursor: "pointer"
  },
  roomHeader: {
    marginBottom: "16px"
  },
  roomTitle: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "8px",
    flexWrap: "wrap",
    gap: "8px"
  },
  roomName: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#111827",
    margin: 0
  },
  statusBadge: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    background: "white",
    border: "2px solid",
    borderRadius: "20px",
    fontSize: "14px"
  },
  roomDescription: {
    fontSize: "14px",
    color: "#6b7280",
    margin: "8px 0 0 0"
  },
  roomInfo: {
    display: "flex",
    gap: "24px",
    marginBottom: "16px",
    flexWrap: "wrap"
  },
  infoItem: {
    display: "flex",
    gap: "8px",
    fontSize: "14px"
  },
  infoLabel: {
    color: "#6b7280",
    fontWeight: "500"
  },
  infoValue: {
    color: "#111827",
    fontWeight: "600"
  },
  roomActions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap"
  },
  primaryButton: {
    flex: 1,
    minWidth: "150px",
    padding: "12px 20px",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "600",
    transition: "opacity 0.2s"
  },
  secondaryButton: {
    padding: "12px 20px",
    background: "#f3f4f6",
    color: "#374151",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "600"
  },
  notificationDot: {
    position: "absolute",
    top: "16px",
    right: "16px",
    width: "12px",
    height: "12px",
    background: "#ef4444",
    borderRadius: "50%",
    animation: "pulse 2s infinite"
  },
  pulse: {
    display: "block",
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    background: "inherit",
    animation: "pulse 2s infinite"
  },
  deleteButton: {
    padding: "10px 20px",
    background: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "600",
    transition: "opacity 0.2s"
  },
  deleteIconButton: {
    padding: "12px 16px",
    background: "#fee2e2",
    color: "#dc2626",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    fontSize: "18px",
    transition: "background 0.2s"
  },
  selectAllBar: {
    padding: "12px 16px",
    background: "#f9fafb",
    borderRadius: "8px",
    marginBottom: "16px",
    border: "1px solid #e5e7eb"
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer"
  },
  checkbox: {
    width: "18px",
    height: "18px",
    cursor: "pointer",
    accentColor: "#3b82f6"
  },
  cardCheckbox: {
    position: "absolute",
    top: "20px",
    left: "20px",
    zIndex: 10
  }
};
