import React, { useState, useEffect } from "react";
import { apiRequest } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function TelegramDownloadHistory({ onClose }) {
  const { token } = useAuth();
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDownloadHistory();
  }, []);

  const fetchDownloadHistory = async () => {
    try {
      setLoading(true);
      const response = await apiRequest("/telegram/downloads", "GET", null, token);
      setDownloads(response.downloads || []);
    } catch (err) {
      setError(err.message || "Failed to load download history");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "#10b981"; // green
      case "processing":
        return "#f59e0b"; // amber
      case "failed":
        return "#ef4444"; // red
      default:
        return "#6b7280"; // gray
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "processing":
        return "Processing...";
      case "failed":
        return "Failed";
      case "pending":
        return "Pending";
      default:
        return status;
    }
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
        maxWidth: "800px",
        width: "100%",
        maxHeight: "90vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)"
      }}>
        {/* Header */}
        <div style={{
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <h2 style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#7DD3C0",
              margin: "0 0 8px 0"
            }}>
              Download History
            </h2>
            <p style={{
              fontSize: "15px",
              color: "#6b7280",
              margin: 0
            }}>
              View all your Telegram chat downloads
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              fontSize: "28px",
              color: "#6b7280",
              cursor: "pointer",
              padding: "0",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "8px",
              transition: "background 0.2s"
            }}
            onMouseEnter={(e) => e.target.style.background = "#f3f4f6"}
            onMouseLeave={(e) => e.target.style.background = "transparent"}
          >
            ×
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{
            textAlign: "center",
            padding: "40px",
            color: "#6b7280"
          }}>
            Loading download history...
          </div>
        )}

        {/* Error State */}
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

        {/* Downloads List */}
        {!loading && !error && (
          <div style={{
            flex: 1,
            overflowY: "auto",
            marginBottom: "16px"
          }}>
            {downloads.length === 0 ? (
              <div style={{
                textAlign: "center",
                padding: "40px",
                color: "#6b7280"
              }}>
                <p style={{ fontSize: "16px", marginBottom: "8px" }}>No downloads yet</p>
                <p style={{ fontSize: "14px" }}>
                  Start downloading chat histories to see them here
                </p>
              </div>
            ) : (
              downloads.map((download) => (
                <div
                  key={download.id}
                  style={{
                    background: "#f9fafb",
                    border: "2px solid #e5e7eb",
                    borderRadius: "12px",
                    padding: "16px",
                    marginBottom: "12px",
                    transition: "border-color 0.2s"
                  }}
                >
                  {/* Download Header */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "12px"
                  }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontSize: "16px",
                        fontWeight: "700",
                        color: "#374151",
                        margin: "0 0 4px 0"
                      }}>
                        {download.chat_name || `Chat #${download.id}`}
                      </h3>
                      <p style={{
                        fontSize: "13px",
                        color: "#6b7280",
                        margin: "0"
                      }}>
                        {download.chat_type && (
                          <span style={{
                            background: "#e5e7eb",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            marginRight: "8px",
                            fontSize: "12px"
                          }}>
                            {download.chat_type}
                          </span>
                        )}
                        Downloaded {formatDate(download.created_at)}
                      </p>
                    </div>
                    <span style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: getStatusColor(download.status),
                      background: `${getStatusColor(download.status)}20`,
                      padding: "4px 12px",
                      borderRadius: "6px"
                    }}>
                      {getStatusLabel(download.status)}
                    </span>
                  </div>

                  {/* Date Range */}
                  <div style={{
                    fontSize: "13px",
                    color: "#6b7280",
                    marginBottom: "8px"
                  }}>
                    <strong>Date Range:</strong> {formatDate(download.start_date)} - {formatDate(download.end_date)}
                  </div>

                  {/* Stats */}
                  <div style={{
                    display: "flex",
                    gap: "16px",
                    fontSize: "13px",
                    color: "#6b7280"
                  }}>
                    <div>
                      <strong>Messages:</strong> {download.message_count.toLocaleString()}
                    </div>
                    <div>
                      <strong>Media:</strong> {download.media_count.toLocaleString()}
                    </div>
                  </div>

                  {/* Error Message */}
                  {download.error_message && (
                    <div style={{
                      marginTop: "12px",
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      borderRadius: "6px",
                      padding: "8px",
                      fontSize: "12px",
                      color: "#991b1b"
                    }}>
                      <strong>Error:</strong> {download.error_message}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Close Button */}
        <div style={{
          borderTop: "2px solid #e5e7eb",
          paddingTop: "16px"
        }}>
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
              fontFamily: "'Nunito', sans-serif",
              transition: "background 0.2s"
            }}
            onMouseEnter={(e) => e.target.style.background = "#e5e7eb"}
            onMouseLeave={(e) => e.target.style.background = "#f3f4f6"}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
