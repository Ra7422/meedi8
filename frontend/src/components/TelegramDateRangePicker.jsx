import React, { useState } from "react";

export default function TelegramDateRangePicker({ chat, onClose, onDownload, loading }) {
  // Calculate default dates (last 30 days)
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  // Format dates as YYYY-MM-DD for input
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [startDate, setStartDate] = useState(formatDate(thirtyDaysAgo));
  const [endDate, setEndDate] = useState(formatDate(today));
  const [error, setError] = useState("");

  const handleDownload = () => {
    // Validation
    if (!startDate || !endDate) {
      setError("Please select both start and end dates");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      setError("Start date must be before end date");
      return;
    }

    if (end > today) {
      setError("End date cannot be in the future");
      return;
    }

    setError("");
    onDownload(chat.chat_id, startDate, endDate);
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0, 0, 0, 0.5)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2000,
      padding: "20px",
      fontFamily: "'Nunito', sans-serif"
    }}>
      <div style={{
        background: "white",
        borderRadius: "16px",
        padding: "32px",
        maxWidth: "500px",
        width: "100%",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)"
      }}>
        {/* Header */}
        <div style={{
          marginBottom: "24px"
        }}>
          <h2 style={{
            fontSize: "24px",
            fontWeight: "700",
            color: "#7DD3C0",
            margin: "0 0 8px 0"
          }}>
            Download Chat History
          </h2>
          <p style={{
            fontSize: "15px",
            color: "#6b7280",
            margin: 0
          }}>
            {chat.chat_name}
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{
            background: "#fef2f2",
            border: "2px solid #ef4444",
            borderRadius: "8px",
            padding: "12px",
            marginBottom: "20px",
            color: "#991b1b",
            fontSize: "14px"
          }}>
            {error}
          </div>
        )}

        {/* Date Range Inputs */}
        <div style={{
          marginBottom: "24px"
        }}>
          <label style={{
            display: "block",
            fontSize: "14px",
            fontWeight: "600",
            color: "#374151",
            marginBottom: "8px"
          }}>
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            max={formatDate(today)}
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px 16px",
              fontSize: "15px",
              border: "2px solid #e5e7eb",
              borderRadius: "8px",
              fontFamily: "'Nunito', sans-serif",
              marginBottom: "16px",
              outline: "none"
            }}
            onFocus={(e) => e.target.style.borderColor = "#7DD3C0"}
            onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
          />

          <label style={{
            display: "block",
            fontSize: "14px",
            fontWeight: "600",
            color: "#374151",
            marginBottom: "8px"
          }}>
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            max={formatDate(today)}
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px 16px",
              fontSize: "15px",
              border: "2px solid #e5e7eb",
              borderRadius: "8px",
              fontFamily: "'Nunito', sans-serif",
              outline: "none"
            }}
            onFocus={(e) => e.target.style.borderColor = "#7DD3C0"}
            onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
          />
        </div>

        {/* Date Range Preview */}
        <div style={{
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "12px",
          marginBottom: "24px",
          fontSize: "13px",
          color: "#6b7280"
        }}>
          <strong>Date Range:</strong> {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
          <br />
          <span style={{ fontSize: "12px", color: "#9ca3af" }}>
            Default: Last 30 days
          </span>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: "flex",
          gap: "12px"
        }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1,
              padding: "14px",
              fontSize: "15px",
              fontWeight: "600",
              color: "#6b7280",
              background: "#f3f4f6",
              border: "2px solid #e5e7eb",
              borderRadius: "10px",
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'Nunito', sans-serif",
              transition: "background 0.2s"
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.background = "#e5e7eb";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.background = "#f3f4f6";
              }
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={loading}
            style={{
              flex: 1,
              padding: "14px",
              fontSize: "15px",
              fontWeight: "700",
              color: "white",
              background: loading ? "#d1d5db" : "#7DD3C0",
              border: "none",
              borderRadius: "10px",
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'Nunito', sans-serif",
              transition: "background 0.2s"
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.background = "#6BC5B8";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.background = "#7DD3C0";
              }
            }}
          >
            {loading ? "Starting..." : "Download Chat"}
          </button>
        </div>
      </div>
    </div>
  );
}
