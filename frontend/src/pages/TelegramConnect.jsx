import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api/client";
import TelegramDateRangePicker from "../components/TelegramDateRangePicker";
import TelegramDownloadStatus from "../components/TelegramDownloadStatus";

export default function TelegramConnect() {
  const { token } = useAuth();

  // Step state
  const [step, setStep] = useState(1); // 1: phone, 2: code, 3: contacts

  // Form inputs
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");

  // Data state
  const [contacts, setContacts] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [downloadId, setDownloadId] = useState(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [needsPassword, setNeedsPassword] = useState(false);

  // Handle phone submission - Step 1
  const handleSendCode = async () => {
    if (!phoneNumber.trim()) {
      setError("Please enter a phone number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await apiRequest("/telegram/connect", "POST", { phone_number: phoneNumber }, token);
      setStep(2); // Move to code verification
    } catch (err) {
      setError(err.message || "Failed to send code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle code verification - Step 2
  const handleVerifyCode = async () => {
    if (!code.trim()) {
      setError("Please enter the verification code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const body = {
        phone_number: phoneNumber,
        code: code.trim()
      };

      // Include password if provided (for 2FA users)
      if (password.trim()) {
        body.password = password.trim();
      }

      const response = await apiRequest("/telegram/verify", "POST", body, token);

      // Check if password is needed for 2FA
      if (response.needs_password) {
        setNeedsPassword(true);
        setError("Your account has 2FA enabled. Please enter your password.");
        setLoading(false);
        return;
      }

      // Success - move to contacts
      setStep(3);
      loadContacts();
    } catch (err) {
      setError(err.message || "Verification failed. Please check your code.");

      // If error mentions password, show password field
      if (err.message && err.message.toLowerCase().includes("password")) {
        setNeedsPassword(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // Load contacts/chats - Step 3
  const loadContacts = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest("/telegram/contacts", "GET", null, token);
      setContacts(response.chats || []);
    } catch (err) {
      setError(err.message || "Failed to load chats");
    } finally {
      setLoading(false);
    }
  };

  // Handle chat selection
  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    setShowDatePicker(true);
  };

  // Handle download initiation
  const handleStartDownload = async (chatId, startDate, endDate) => {
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest("/telegram/download", "POST", {
        chat_id: chatId,
        start_date: startDate,
        end_date: endDate
      }, token);

      setDownloadId(response.download_id);
      setShowDatePicker(false);
    } catch (err) {
      setError(err.message || "Failed to start download");
    } finally {
      setLoading(false);
    }
  };

  // Handle disconnect
  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect your Telegram account?")) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      await apiRequest("/telegram/disconnect", "DELETE", null, token);
      // Reset to step 1
      setStep(1);
      setPhoneNumber("");
      setCode("");
      setPassword("");
      setContacts([]);
      setNeedsPassword(false);
    } catch (err) {
      setError(err.message || "Failed to disconnect");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: "800px",
      margin: "0 auto",
      padding: "40px 20px",
      fontFamily: "'Nunito', sans-serif"
    }}>
      {/* Header */}
      <div style={{
        textAlign: "center",
        marginBottom: "40px"
      }}>
        <h1 style={{
          fontSize: "32px",
          fontWeight: "700",
          color: "#1a202c",
          margin: "0 0 12px 0"
        }}>
          Telegram Chat Import
        </h1>
        <p style={{
          fontSize: "16px",
          color: "#6b7280",
          margin: 0
        }}>
          Connect your Telegram account to import chat history
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          background: "#fef2f2",
          border: "2px solid #ef4444",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "24px",
          color: "#991b1b",
          fontSize: "15px"
        }}>
          {error}
        </div>
      )}

      {/* Step 1: Phone Verification */}
      {step === 1 && (
        <div style={{
          background: "white",
          borderRadius: "16px",
          padding: "32px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
          border: "2px solid #e5e7eb"
        }}>
          <h2 style={{
            fontSize: "24px",
            fontWeight: "700",
            color: "#7DD3C0",
            margin: "0 0 8px 0"
          }}>
            Step 1: Phone Number
          </h2>
          <p style={{
            fontSize: "15px",
            color: "#6b7280",
            margin: "0 0 24px 0"
          }}>
            Enter your phone number with country code (e.g., +44 7123456789)
          </p>

          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+44 7123456789"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px 16px",
              fontSize: "16px",
              border: "2px solid #e5e7eb",
              borderRadius: "12px",
              fontFamily: "'Nunito', sans-serif",
              marginBottom: "16px",
              outline: "none",
              transition: "border-color 0.2s"
            }}
            onFocus={(e) => e.target.style.borderColor = "#7DD3C0"}
            onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
            onKeyDown={(e) => e.key === "Enter" && handleSendCode()}
          />

          <button
            onClick={handleSendCode}
            disabled={loading || !phoneNumber.trim()}
            style={{
              width: "100%",
              padding: "16px",
              fontSize: "16px",
              fontWeight: "700",
              color: "white",
              background: loading || !phoneNumber.trim() ? "#d1d5db" : "#7DD3C0",
              border: "none",
              borderRadius: "12px",
              cursor: loading || !phoneNumber.trim() ? "not-allowed" : "pointer",
              transition: "background 0.2s",
              fontFamily: "'Nunito', sans-serif"
            }}
            onMouseEnter={(e) => {
              if (!loading && phoneNumber.trim()) {
                e.target.style.background = "#6BC5B8";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && phoneNumber.trim()) {
                e.target.style.background = "#7DD3C0";
              }
            }}
          >
            {loading ? "Sending..." : "Send Verification Code"}
          </button>
        </div>
      )}

      {/* Step 2: Code Verification */}
      {step === 2 && (
        <div style={{
          background: "white",
          borderRadius: "16px",
          padding: "32px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
          border: "2px solid #e5e7eb"
        }}>
          <h2 style={{
            fontSize: "24px",
            fontWeight: "700",
            color: "#7DD3C0",
            margin: "0 0 8px 0"
          }}>
            Step 2: Verification Code
          </h2>
          <p style={{
            fontSize: "15px",
            color: "#6b7280",
            margin: "0 0 24px 0"
          }}>
            Enter the 6-digit code sent to your Telegram app
          </p>

          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            disabled={loading}
            maxLength={6}
            style={{
              width: "100%",
              padding: "14px 16px",
              fontSize: "16px",
              border: "2px solid #e5e7eb",
              borderRadius: "12px",
              fontFamily: "'Nunito', sans-serif",
              marginBottom: "16px",
              outline: "none",
              letterSpacing: "0.1em",
              textAlign: "center",
              fontSize: "24px",
              fontWeight: "600"
            }}
            onFocus={(e) => e.target.style.borderColor = "#7DD3C0"}
            onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
            onKeyDown={(e) => e.key === "Enter" && handleVerifyCode()}
          />

          {/* Password field (only shown if 2FA is enabled) */}
          {needsPassword && (
            <>
              <p style={{
                fontSize: "14px",
                color: "#6b7280",
                margin: "0 0 8px 0",
                fontWeight: "600"
              }}>
                2FA Password
              </p>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your Telegram password"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  fontSize: "16px",
                  border: "2px solid #e5e7eb",
                  borderRadius: "12px",
                  fontFamily: "'Nunito', sans-serif",
                  marginBottom: "16px",
                  outline: "none"
                }}
                onFocus={(e) => e.target.style.borderColor = "#7DD3C0"}
                onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyCode()}
              />
            </>
          )}

          <button
            onClick={handleVerifyCode}
            disabled={loading || !code.trim()}
            style={{
              width: "100%",
              padding: "16px",
              fontSize: "16px",
              fontWeight: "700",
              color: "white",
              background: loading || !code.trim() ? "#d1d5db" : "#7DD3C0",
              border: "none",
              borderRadius: "12px",
              cursor: loading || !code.trim() ? "not-allowed" : "pointer",
              transition: "background 0.2s",
              fontFamily: "'Nunito', sans-serif"
            }}
            onMouseEnter={(e) => {
              if (!loading && code.trim()) {
                e.target.style.background = "#6BC5B8";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && code.trim()) {
                e.target.style.background = "#7DD3C0";
              }
            }}
          >
            {loading ? "Verifying..." : "Verify Code"}
          </button>

          <button
            onClick={() => setStep(1)}
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "12px",
              fontSize: "14px",
              fontWeight: "600",
              color: "#6b7280",
              background: "transparent",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'Nunito', sans-serif"
            }}
          >
            Back to phone number
          </button>
        </div>
      )}

      {/* Step 3: Contact List */}
      {step === 3 && (
        <div style={{
          background: "white",
          borderRadius: "16px",
          padding: "32px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
          border: "2px solid #e5e7eb"
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px"
          }}>
            <div>
              <h2 style={{
                fontSize: "24px",
                fontWeight: "700",
                color: "#7DD3C0",
                margin: "0 0 4px 0"
              }}>
                Your Chats
              </h2>
              <p style={{
                fontSize: "14px",
                color: "#6b7280",
                margin: 0
              }}>
                {contacts.length} chat{contacts.length !== 1 ? 's' : ''} found
              </p>
            </div>
            <button
              onClick={handleDisconnect}
              disabled={loading}
              style={{
                padding: "10px 16px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#ef4444",
                background: "transparent",
                border: "2px solid #ef4444",
                borderRadius: "8px",
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "'Nunito', sans-serif"
              }}
            >
              Disconnect
            </button>
          </div>

          {loading && contacts.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "#6b7280"
            }}>
              <div style={{
                fontSize: "24px",
                marginBottom: "12px"
              }}>⏳</div>
              <p style={{ margin: 0 }}>Loading chats...</p>
            </div>
          ) : contacts.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "#6b7280"
            }}>
              <div style={{
                fontSize: "24px",
                marginBottom: "12px"
              }}>📱</div>
              <p style={{ margin: 0 }}>No chats found</p>
            </div>
          ) : (
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}>
              {contacts.map((chat) => (
                <div
                  key={chat.chat_id}
                  style={{
                    padding: "16px",
                    border: "2px solid #e5e7eb",
                    borderRadius: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "border-color 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = "#7DD3C0"}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = "#e5e7eb"}
                >
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#1a202c",
                      margin: "0 0 4px 0"
                    }}>
                      {chat.chat_name}
                    </h3>
                    <div style={{
                      display: "flex",
                      gap: "8px",
                      fontSize: "13px",
                      color: "#6b7280",
                      flexWrap: "wrap"
                    }}>
                      <span>
                        {chat.chat_type === 'user' ? '👤' : chat.chat_type === 'group' ? '👥' : '📢'}
                        {' '}
                        {chat.chat_type}
                      </span>
                      {chat.folder_name && (
                        <span style={{
                          background: "#F3F4F6",
                          color: "#4B5563",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontWeight: "500"
                        }}>
                          📁 {chat.folder_name}
                        </span>
                      )}
                      {chat.archived && (
                        <span style={{
                          background: "#FEF3C7",
                          color: "#92400E",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontWeight: "500"
                        }}>
                          📦 Archived
                        </span>
                      )}
                      {chat.unread_count > 0 && (
                        <span style={{
                          background: "#7DD3C0",
                          color: "white",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontWeight: "600"
                        }}>
                          {chat.unread_count} unread
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleSelectChat(chat)}
                    style={{
                      padding: "10px 20px",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "white",
                      background: "#7DD3C0",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontFamily: "'Nunito', sans-serif",
                      transition: "background 0.2s"
                    }}
                    onMouseEnter={(e) => e.target.style.background = "#6BC5B8"}
                    onMouseLeave={(e) => e.target.style.background = "#7DD3C0"}
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Download Status (shown when download is active) */}
      {downloadId && (
        <div style={{ marginTop: "24px" }}>
          <TelegramDownloadStatus
            downloadId={downloadId}
            onClose={() => setDownloadId(null)}
          />
        </div>
      )}

      {/* Date Range Picker Modal */}
      {showDatePicker && selectedChat && (
        <TelegramDateRangePicker
          chat={selectedChat}
          onClose={() => {
            setShowDatePicker(false);
            setSelectedChat(null);
          }}
          onDownload={handleStartDownload}
          loading={loading}
        />
      )}
    </div>
  );
}
