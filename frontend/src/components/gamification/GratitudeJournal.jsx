import React, { useState, useEffect } from "react";
import { useGamification } from "../../context/GamificationContext";

const PROMPTS = [
  "What made you smile today?",
  "What are you grateful for in your relationship?",
  "What's something your partner did that you appreciated?",
  "What's a small thing that brought you joy?",
  "What's something you're looking forward to?",
  "What challenge helped you grow recently?",
  "What's a memory that makes you feel grateful?",
  "Who made a positive impact on your day?",
];

export default function GratitudeJournal({ onEntryCreated }) {
  const {
    journalEntries,
    journalTotalCount,
    fetchJournal,
    createJournalEntry,
    deleteJournalEntry
  } = useGamification();

  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState("");
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJournal();
    setCurrentPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
  }, []);

  const loadJournal = async () => {
    setLoading(true);
    try {
      await fetchJournal();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      await createJournalEntry(content, currentPrompt);
      setContent("");
      setShowForm(false);
      setCurrentPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
      if (onEntryCreated) onEntryCreated();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (entryId) => {
    if (!confirm("Delete this entry?")) return;
    try {
      await deleteJournalEntry(entryId);
    } catch (err) {
      alert(err.message);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: 16
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8
        }}>
          <span style={{ fontSize: 20 }}>🙏</span>
          <span style={{ fontSize: 16, fontWeight: 600, color: "white" }}>
            Gratitude Journal
          </span>
          {journalTotalCount > 0 && (
            <span style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.5)",
              padding: "2px 6px",
              background: "rgba(255,255,255,0.1)",
              borderRadius: 4
            }}>
              {journalTotalCount} entries
            </span>
          )}
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              padding: "8px 16px",
              background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
              border: "none",
              borderRadius: 8,
              color: "white",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            + New Entry
          </button>
        )}
      </div>

      {/* New entry form */}
      {showForm && (
        <form onSubmit={handleSubmit} style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          padding: 16,
          background: "rgba(139,92,246,0.1)",
          borderRadius: 12,
          border: "1px solid rgba(139,92,246,0.2)"
        }}>
          <div style={{
            fontSize: 13,
            color: "#c4b5fd",
            fontStyle: "italic"
          }}>
            {currentPrompt}
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="I'm grateful for..."
            style={{
              width: "100%",
              minHeight: 80,
              padding: 12,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              color: "white",
              fontSize: 14,
              resize: "vertical"
            }}
            autoFocus
          />
          <div style={{
            display: "flex",
            gap: 8,
            justifyContent: "flex-end"
          }}>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setContent("");
              }}
              style={{
                padding: "8px 16px",
                background: "rgba(255,255,255,0.1)",
                border: "none",
                borderRadius: 8,
                color: "rgba(255,255,255,0.7)",
                fontSize: 13,
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              style={{
                padding: "8px 16px",
                background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
                border: "none",
                borderRadius: 8,
                color: "white",
                fontSize: 13,
                fontWeight: 600,
                cursor: submitting ? "wait" : "pointer",
                opacity: submitting || !content.trim() ? 0.5 : 1
              }}
            >
              {submitting ? "Saving..." : "Save (+3)"}
            </button>
          </div>
        </form>
      )}

      {/* Entries list */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: 8
      }}>
        {loading ? (
          <div style={{
            textAlign: "center",
            color: "rgba(255,255,255,0.5)",
            padding: 20
          }}>
            Loading...
          </div>
        ) : journalEntries.length === 0 ? (
          <div style={{
            textAlign: "center",
            color: "rgba(255,255,255,0.5)",
            padding: 20
          }}>
            No entries yet. Start your gratitude practice!
          </div>
        ) : (
          journalEntries.map(entry => (
            <div
              key={entry.id}
              style={{
                padding: 12,
                background: "rgba(255,255,255,0.05)",
                borderRadius: 8,
                position: "relative"
              }}
            >
              <div style={{
                fontSize: 14,
                color: "white",
                lineHeight: 1.5,
                marginBottom: 8
              }}>
                {entry.content}
              </div>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                <span style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.4)"
                }}>
                  {formatDate(entry.created_at)}
                </span>
                <button
                  onClick={() => handleDelete(entry.id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(255,255,255,0.3)",
                    fontSize: 11,
                    cursor: "pointer",
                    padding: "2px 6px"
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
