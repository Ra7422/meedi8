import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import BreathingExercise from "../components/BreathingExercise";

export default function BreathingExercisePage() {
  const navigate = useNavigate();
  const { roomId } = useParams();

  const handleReady = () => {
    if (roomId) {
      // Return to the coaching page or main room
      navigate(`/coaching/${roomId}`);
    } else {
      // Return to sessions dashboard
      navigate("/sessions");
    }
  };

  const handleBack = () => {
    if (roomId) {
      navigate(`/coaching/${roomId}`);
    } else {
      navigate("/sessions");
    }
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      {/* Back button */}
      <button
        onClick={handleBack}
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          padding: "10px 16px",
          background: "rgba(26, 21, 48, 0.8)",
          color: "#e9e7ff",
          border: "1px solid #2a2350",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "600",
          zIndex: 10
        }}
      >
        ← Back to Session
      </button>

      <BreathingExercise onReady={handleReady} />
    </div>
  );
}
