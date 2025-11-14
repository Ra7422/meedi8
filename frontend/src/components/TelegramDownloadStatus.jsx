import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api/client";

export default function TelegramDownloadStatus({ downloadId, onClose }) {
  const { token } = useAuth();
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");

  // Poll for status updates every 3 seconds
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await apiRequest(`/telegram/download/${downloadId}`, "GET", null, token);
        setStatus(response);

        // Stop polling if completed or failed
        if (response.status === "completed" || response.status === "failed") {
          clearInterval(intervalId);
        }
      } catch (err) {
        setError(err.message || "Failed to fetch status");
        clearInterval(intervalId);
      }
    };

    // Initial fetch
    fetchStatus();

    // Set up polling interval
    const intervalId = setInterval(fetchStatus, 3000);

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, [downloadId, token]);

  if (error) {
    return (
      <div style={{
        background: "white",
        borderRadius: "16px",
        padding: "32px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
        border: "2px solid #ef4444",
        fontFamily: "'Nunito', sans-serif"
      }}>
        <div style={{
          textAlign: "center",
          marginBottom: "20px"
        }}>
          <div style={{
            fontSize: "48px",
            marginBottom: "12px"
          }}>❌</div>
          <h3 style={{
            fontSize: "20px",
            fontWeight: "700",
            color: "#ef4444",
            margin: "0 0 8px 0"
          }}>
            Error
          </h3>
          <p style={{
            fontSize: "15px",
            color: "#6b7280",
            margin: 0
          }}>
            {error}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "14px",
            fontSize: "15px",
            fontWeight: "600",
            color: "#6b7280",
            background: "#f3f4f6",
            border: "2px solid #e5e7eb",
            borderRadius: "10px",
            cursor: "pointer",
            fontFamily: "'Nunito', sans-serif"
          }}
        >
          Close
        </button>
      </div>
    );
  }

  if (!status) {
    return (
      <div style={{
        background: "white",
        borderRadius: "16px",
        padding: "32px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
        border: "2px solid #e5e7eb",
        fontFamily: "'Nunito', sans-serif",
        textAlign: "center"
      }}>
        <div style={{
          fontSize: "24px",
          marginBottom: "12px"
        }}>⏳</div>
        <p style={{
          fontSize: "15px",
          color: "#6b7280",
          margin: 0
        }}>
          Loading status...
        </p>
      </div>
    );
  }

  // Determine status color and icon
  const getStatusDisplay = () => {
    switch (status.status) {
      case "processing":
        return {
          color: "#f59e0b",
          icon: "⏳",
          title: "Processing...",
          showProgress: true
        };
      case "completed":
        return {
          color: "#10b981",
          icon: "✅",
          title: "Download Complete",
          showProgress: false
        };
      case "failed":
        return {
          color: "#ef4444",
          icon: "❌",
          title: "Download Failed",
          showProgress: false
        };
      default:
        return {
          color: "#6b7280",
          icon: "❓",
          title: "Unknown Status",
          showProgress: false
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div style={{
      background: "white",
      borderRadius: "16px",
      padding: "32px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
      border: `2px solid ${statusDisplay.color}`,
      fontFamily: "'Nunito', sans-serif"
    }}>
      {/* Status Header */}
      <div style={{
        textAlign: "center",
        marginBottom: "24px"
      }}>
        <div style={{
          fontSize: "48px",
          marginBottom: "12px",
          animation: status.status === "processing" ? "pulse 2s infinite" : "none"
        }}>
          {statusDisplay.icon}
        </div>
        <h3 style={{
          fontSize: "20px",
          fontWeight: "700",
          color: statusDisplay.color,
          margin: "0 0 8px 0"
        }}>
          {statusDisplay.title}
        </h3>
        <p style={{
          fontSize: "14px",
          color: "#6b7280",
          margin: 0
        }}>
          Download ID: {downloadId}
        </p>
      </div>

      {/* Status Details */}
      <div style={{
        background: "#f9fafb",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "20px"
      }}>
        {status.chat_name && (
          <div style={{
            marginBottom: "12px",
            paddingBottom: "12px",
            borderBottom: "1px solid #e5e7eb"
          }}>
            <div style={{
              fontSize: "12px",
              fontWeight: "600",
              color: "#6b7280",
              marginBottom: "4px"
            }}>
              Chat Name
            </div>
            <div style={{
              fontSize: "15px",
              fontWeight: "600",
              color: "#1a202c"
            }}>
              {status.chat_name}
            </div>
          </div>
        )}

        {status.message_count !== undefined && (
          <div style={{
            marginBottom: "12px",
            paddingBottom: "12px",
            borderBottom: "1px solid #e5e7eb"
          }}>
            <div style={{
              fontSize: "12px",
              fontWeight: "600",
              color: "#6b7280",
              marginBottom: "4px"
            }}>
              {status.status === "processing" ? "Messages Downloaded (Live)" : "Messages Downloaded"}
            </div>
            <div style={{
              fontSize: "24px",
              fontWeight: "700",
              color: status.status === "processing" ? "#f59e0b" : "#7DD3C0",
              transition: "color 0.3s ease"
            }}>
              {status.message_count.toLocaleString()}
            </div>
          </div>
        )}

        <div>
          <div style={{
            fontSize: "12px",
            fontWeight: "600",
            color: "#6b7280",
            marginBottom: "4px"
          }}>
            Status
          </div>
          <div style={{
            fontSize: "15px",
            fontWeight: "600",
            color: statusDisplay.color,
            textTransform: "capitalize"
          }}>
            {status.status}
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      {statusDisplay.showProgress && (
        <div style={{
          marginBottom: "20px"
        }}>
          <div style={{
            background: "#e5e7eb",
            height: "8px",
            borderRadius: "4px",
            overflow: "hidden"
          }}>
            <div style={{
              background: "#7DD3C0",
              height: "100%",
              width: "100%",
              animation: "loading 1.5s ease-in-out infinite"
            }} />
          </div>
          <p style={{
            fontSize: "13px",
            color: "#6b7280",
            textAlign: "center",
            marginTop: "8px",
            margin: "8px 0 0 0"
          }}>
            Downloading messages from Telegram...
          </p>
        </div>
      )}

      {/* Error Message */}
      {status.status === "failed" && status.error_message && (
        <div style={{
          background: "#fef2f2",
          border: "1px solid #ef4444",
          borderRadius: "8px",
          padding: "12px",
          marginBottom: "20px",
          fontSize: "14px",
          color: "#991b1b"
        }}>
          {status.error_message}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{
        display: "flex",
        gap: "12px"
      }}>
        {status.status === "completed" && (
          <button
            onClick={() => {
              // Could navigate to a chat view or analysis page
              alert("Chat data downloaded successfully! Feature to view/analyze coming soon.");
            }}
            style={{
              flex: 1,
              padding: "14px",
              fontSize: "15px",
              fontWeight: "700",
              color: "white",
              background: "#7DD3C0",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontFamily: "'Nunito', sans-serif",
              transition: "background 0.2s"
            }}
            onMouseEnter={(e) => e.target.style.background = "#6BC5B8"}
            onMouseLeave={(e) => e.target.style.background = "#7DD3C0"}
          >
            View Messages
          </button>
        )}
        <button
          onClick={onClose}
          style={{
            flex: status.status === "completed" ? 0 : 1,
            padding: "14px",
            paddingLeft: status.status === "completed" ? "20px" : "14px",
            paddingRight: status.status === "completed" ? "20px" : "14px",
            fontSize: "15px",
            fontWeight: "600",
            color: "#6b7280",
            background: "#f3f4f6",
            border: "2px solid #e5e7eb",
            borderRadius: "10px",
            cursor: "pointer",
            fontFamily: "'Nunito', sans-serif",
            transition: "background 0.2s"
          }}
          onMouseEnter={(e) => e.target.style.background = "#e5e7eb"}
          onMouseLeave={(e) => e.target.style.background = "#f3f4f6"}
        >
          {status.status === "processing" ? "Hide" : "Close"}
        </button>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }

        @keyframes loading {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
