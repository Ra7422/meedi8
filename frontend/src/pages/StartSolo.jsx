import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api/client";
import { soloTheme, soloStyles } from "../styles/soloTheme";

export default function StartSolo() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("personal");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStart = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter what you'd like to reflect on");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Create Solo room
      const response = await apiRequest(
        "/rooms/",
        "POST",
        {
          title: title.trim(),
          category,
          room_type: "solo"
        },
        token
      );

      // Navigate to Solo coaching page
      navigate(`/rooms/${response.id}/solo`);
    } catch (err) {
      console.error("Error creating Solo room:", err);
      setError(err.message || "Failed to start Solo session");
      setLoading(false);
    }
  };

  const styles = {
    container: {
      ...soloStyles.pageContainer,
      alignItems: "center",
      justifyContent: "center",
    },
    card: {
      backgroundColor: soloTheme.colors.backgroundWhite,
      borderRadius: soloTheme.borderRadius.xl,
      padding: "40px",
      maxWidth: "600px",
      width: "100%",
      boxShadow: soloTheme.shadows.lg,
      border: `2px solid ${soloTheme.colors.border}`,
    },
    heading: {
      ...soloStyles.heading,
      marginBottom: "12px",
    },
    subheading: {
      ...soloStyles.subheading,
      textAlign: "center",
      color: soloTheme.colors.textLight,
      marginBottom: "32px",
    },
    form: {
      display: "flex",
      flexDirection: "column",
      gap: "24px",
    },
    label: {
      fontSize: soloTheme.fontSize.md,
      fontWeight: soloTheme.fontWeight.semibold,
      color: soloTheme.colors.textSecondary,
      marginBottom: "8px",
    },
    input: {
      ...soloStyles.input,
      fontSize: soloTheme.fontSize.md,
    },
    textarea: {
      ...soloStyles.input,
      minHeight: "100px",
      resize: "vertical",
      fontFamily: "'Nunito', sans-serif",
    },
    select: {
      ...soloStyles.input,
      cursor: "pointer",
    },
    button: {
      ...soloStyles.buttonPrimary,
      marginTop: "8px",
      opacity: loading ? 0.6 : 1,
      cursor: loading ? "not-allowed" : "pointer",
    },
    error: {
      color: soloTheme.colors.caution,
      fontSize: soloTheme.fontSize.sm,
      textAlign: "center",
      padding: "12px",
      backgroundColor: `${soloTheme.colors.caution}20`,
      borderRadius: soloTheme.borderRadius.md,
    },
    categoryGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: "12px",
    },
    categoryOption: {
      padding: "12px 16px",
      borderRadius: soloTheme.borderRadius.md,
      border: `2px solid ${soloTheme.colors.border}`,
      backgroundColor: soloTheme.colors.backgroundWhite,
      cursor: "pointer",
      textAlign: "center",
      fontSize: soloTheme.fontSize.md,
      fontWeight: soloTheme.fontWeight.medium,
      color: soloTheme.colors.textSecondary,
      transition: "all 0.2s ease",
    },
    categoryOptionSelected: {
      borderColor: soloTheme.colors.primary,
      backgroundColor: soloTheme.colors.primaryPale,
      color: soloTheme.colors.primary,
    },
  };

  const categories = [
    { value: "personal", label: "Personal" },
    { value: "work", label: "Work" },
    { value: "family", label: "Family" },
    { value: "relationship", label: "Relationship" },
    { value: "friendship", label: "Friendship" },
    { value: "other", label: "Other" },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.heading}>Solo Reflection</h1>
        <p style={styles.subheading}>
          Work through your thoughts with a compassionate AI guide
        </p>

        <form onSubmit={handleStart} style={styles.form}>
          <div>
            <label style={styles.label}>
              What would you like to reflect on?
            </label>
            <textarea
              style={styles.textarea}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., My roommate situation, Work stress, Family conflict..."
              disabled={loading}
              autoFocus
            />
          </div>

          <div>
            <label style={styles.label}>Category</label>
            <div style={styles.categoryGrid}>
              {categories.map((cat) => (
                <div
                  key={cat.value}
                  style={{
                    ...styles.categoryOption,
                    ...(category === cat.value ? styles.categoryOptionSelected : {})
                  }}
                  onClick={() => !loading && setCategory(cat.value)}
                >
                  {cat.label}
                </div>
              ))}
            </div>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button
            type="submit"
            style={styles.button}
            disabled={loading}
          >
            {loading ? "Starting..." : "Begin Reflection"}
          </button>
        </form>
      </div>
    </div>
  );
}
