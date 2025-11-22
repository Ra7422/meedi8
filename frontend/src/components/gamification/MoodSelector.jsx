import React, { useState } from "react";
import { useGamification } from "../../context/GamificationContext";

const MOODS = [
  { id: "sunny", emoji: "☀️", label: "Great", color: "#fbbf24" },
  { id: "cloudy", emoji: "⛅", label: "Okay", color: "#9ca3af" },
  { id: "rainy", emoji: "🌧️", label: "Down", color: "#60a5fa" },
  { id: "stormy", emoji: "⛈️", label: "Anxious", color: "#8b5cf6" },
  { id: "foggy", emoji: "🌫️", label: "Confused", color: "#6b7280" },
];

export default function MoodSelector({ onComplete, showNote = true, context = null }) {
  const { createMoodCheckin } = useGamification();
  const [selectedMood, setSelectedMood] = useState(null);
  const [energy, setEnergy] = useState(3);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedMood) return;

    setSubmitting(true);
    try {
      await createMoodCheckin(
        selectedMood,
        energy,
        note || null,
        context
      );
      if (onComplete) onComplete();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: 16,
      padding: 20,
      background: "rgba(255,255,255,0.05)",
      borderRadius: 16
    }}>
      <div style={{
        fontSize: 16,
        fontWeight: 600,
        color: "white",
        textAlign: "center"
      }}>
        How are you feeling?
      </div>

      {/* Mood selection */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        gap: 8
      }}>
        {MOODS.map(mood => (
          <button
            key={mood.id}
            onClick={() => setSelectedMood(mood.id)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              padding: "12px 8px",
              background: selectedMood === mood.id
                ? `${mood.color}33`
                : "rgba(255,255,255,0.05)",
              border: selectedMood === mood.id
                ? `2px solid ${mood.color}`
                : "2px solid transparent",
              borderRadius: 12,
              cursor: "pointer",
              transition: "all 0.2s ease",
              minWidth: 56
            }}
          >
            <span style={{ fontSize: 24 }}>{mood.emoji}</span>
            <span style={{
              fontSize: 10,
              color: selectedMood === mood.id ? mood.color : "rgba(255,255,255,0.6)"
            }}>
              {mood.label}
            </span>
          </button>
        ))}
      </div>

      {/* Energy level */}
      {selectedMood && (
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: 8
        }}>
          <div style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.7)",
            textAlign: "center"
          }}>
            Energy level
          </div>
          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: 8
          }}>
            {[1, 2, 3, 4, 5].map(level => (
              <button
                key={level}
                onClick={() => setEnergy(level)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: energy >= level
                    ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
                    : "rgba(255,255,255,0.1)",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  color: "white",
                  transition: "all 0.2s ease"
                }}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Optional note */}
      {selectedMood && showNote && (
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note (optional)..."
          style={{
            width: "100%",
            minHeight: 60,
            padding: 12,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            color: "white",
            fontSize: 14,
            resize: "vertical"
          }}
        />
      )}

      {/* Submit button */}
      {selectedMood && (
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            padding: "12px 24px",
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            border: "none",
            borderRadius: 12,
            color: "white",
            fontSize: 14,
            fontWeight: 600,
            cursor: submitting ? "wait" : "pointer",
            opacity: submitting ? 0.7 : 1
          }}
        >
          {submitting ? "Saving..." : "Log Mood (+2)"}
        </button>
      )}
    </div>
  );
}
