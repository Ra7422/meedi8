import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api/client";

export default function Rooms() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await apiRequest("/rooms/", "GET", null, token);
        setRooms(response || []);
      } catch (error) {
        console.error("Error fetching rooms:", error);
      }
      setLoading(false);
    };
    fetchRooms();
  }, [token]);
  
  const getPhaseDisplay = (phase) => {
    const phases = {
      "user1_intake": "Your Turn: Start Coaching",
      "user1_coaching": "In Progress: Your Coaching",
      "user2_lobby": "Waiting: Other Person to Join",
      "user2_coaching": "In Progress: Other Person Coaching",
      "main_room": "Ready: Enter Main Room",
      "resolved": "Complete: Resolution Reached"
    };
    return phases[phase] || phase;
  };
  
  const handleRoomClick = (room) => {
    // Navigate based on phase
    if (room.phase === "main_room" || room.phase === "resolved") {
      navigate(`/rooms/${room.id}/main-room`);
    } else if (room.phase === "user1_intake" || room.phase === "user1_coaching") {
      navigate(`/rooms/${room.id}/coaching`);
    } else if (room.phase === "user2_lobby") {
      navigate(`/rooms/${room.id}/lobby`);
    } else if (room.phase === "user2_coaching") {
      navigate(`/rooms/${room.id}/lobby`);
    }
  };
  
  if (loading) {
    return <div style={{ textAlign: "center", padding: "60px" }}>Loading rooms...</div>;
  }
  
  return (
    <div style={{ maxWidth: "800px", margin: "40px auto", padding: "24px" }}>
      <h1 style={{ marginBottom: "24px" }}>My Rooms</h1>
      
      {rooms.length === 0 ? (
        <p style={{ color: "#666" }}>No rooms yet. Click "New Mediation" to start.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {rooms.map(room => (
            <div
              key={room.id}
              onClick={() => handleRoomClick(room)}
              style={{
                padding: "20px",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                background: "#fff",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                e.currentTarget.style.borderColor = "#3b82f6";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = "#e5e7eb";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }}>
                <div>
                  <h3 style={{ margin: "0 0 8px 0", fontSize: "18px" }}>{room.title || "Untitled"}</h3>
                  <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>
                    Room #{room.id} · Created {new Date(room.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span style={{
                  padding: "4px 12px",
                  borderRadius: "16px",
                  fontSize: "13px",
                  fontWeight: "500",
                  background: room.phase === "main_room" ? "#dcfce7" :
                             room.phase === "resolved" ? "#dbeafe" :
                             "#fef3c7",
                  color: room.phase === "main_room" ? "#166534" :
                         room.phase === "resolved" ? "#1e40af" :
                         "#92400e"
                }}>
                  {getPhaseDisplay(room.phase)}
                </span>
              </div>
              
              {room.phase === "user2_lobby" && (
                <p style={{ margin: 0, fontSize: "14px", color: "#666", fontStyle: "italic" }}>
                  ⏳ Waiting for other person to accept invite and complete coaching...
                </p>
              )}
              
              <p style={{ margin: "12px 0 0 0", fontSize: "13px", color: "#3b82f6", fontWeight: "500" }}>
                Click to continue →
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
