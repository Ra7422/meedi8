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
  const [currentLimit, setCurrentLimit] = useState(10); // For pagination
  const [hasMoreContacts, setHasMoreContacts] = useState(true); // Track if more exist
  const [selectedFolder, setSelectedFolder] = useState("all"); // Filter by folder
  const [availableFolders, setAvailableFolders] = useState([]); // List of unique folders

  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false); // Separate loading for "Load More"
  const [error, setError] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    checkExistingSession();
  }, [token]);

  const checkExistingSession = async () => {
    if (!token) {
      setCheckingSession(false);
      return;
    }

    try {
      const response = await apiRequest("/telegram/session-status", "GET", null, token);

      if (response.is_connected) {
        // User already has active session - skip to contacts
        setPhoneNumber(response.phone_number || "");
        setStep(3);
        loadContacts();
      }
    } catch (err) {
      // Session check failed - start from step 1
      console.error("Session check failed:", err);
    } finally {
      setCheckingSession(false);
    }
  };

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
  const loadContacts = async (limit = 10, folderId = null) => {
    setLoading(true);
    setError("");

    console.log(`[TelegramConnect] Loading contacts with limit=${limit}, folder=${folderId}...`);

    try {
      // Build URL with folder_id parameter if specified
      let url = `/telegram/contacts?limit=${limit}`;
      if (folderId !== null) {
        url += `&folder_id=${folderId}`;
      }

      const response = await apiRequest(url, "GET", null, token);
      const newContacts = response.contacts || [];
      const newFolders = response.folders || [];

      setContacts(newContacts);

      // Use folders from API response instead of extracting from contacts
      if (newFolders.length > 0) {
        setAvailableFolders(newFolders.sort((a, b) => a.name.localeCompare(b.name)));
      }

      // If we got fewer contacts than requested, there are no more
      setHasMoreContacts(newContacts.length === limit);
    } catch (err) {
      // If Telegram session expired or not found (404), reset to step 1 to reconnect
      if (err.message && (err.message.includes("session") || err.message.includes("expired") || err.message.includes("404"))) {
        console.log("[TelegramConnect] Telegram session expired, resetting to step 1");
        setStep(1);
        setError("Your Telegram session has expired. Please reconnect.");
      } else {
        setError(err.message || "Failed to load chats");
      }
    } finally {
      setLoading(false);
    }
  };

  // Folders are now fetched directly from the API response
  // (removed old extractFolders function that tried to extract from contacts)

  // Handle folder selection - triggers new API call with folder_id
  const handleFolderSelect = (folderSelection) => {
    setSelectedFolder(folderSelection);
    setCurrentLimit(10); // Reset pagination

    // Convert folder selection to API parameter
    let folderId = null;
    if (folderSelection !== "all") {
      if (folderSelection === "none") {
        folderId = -1; // -1 means "no folder"
      } else {
        // folderSelection is the folder object
        folderId = folderSelection.id;
      }
    }

    loadContacts(10, folderId);
  };

  // Load more contacts (pagination)
  const loadMoreContacts = () => {
    const newLimit = currentLimit + 10;
    setCurrentLimit(newLimit);

    // Determine folder_id from current selection
    let folderId = null;
    if (selectedFolder !== "all") {
      folderId = selectedFolder === "none" ? -1 : selectedFolder.id;
    }

    loadContacts(newLimit, folderId);
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

  // Show loading state while checking session
  if (checkingSession) {
    return (
      <div style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "40px 20px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        textAlign: "center"
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
          color: "#8A8A8F",
          margin: "40px 0"
        }}>
          Checking your connection...
        </p>
        <div style={{
          fontSize: "24px",
          color: "#0088CC"
        }}>
          ⏳
        </div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: "800px",
      margin: "0 auto",
      padding: "40px 20px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
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
          color: "#8A8A8F",
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
          background: "#FFFFFF",
          borderRadius: "16px",
          padding: "32px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
          border: "2px solid #e5e7eb"
        }}>
          <h2 style={{
            fontSize: "24px",
            fontWeight: "700",
            color: "#0088CC",
            margin: "0 0 8px 0"
          }}>
            Step 1: Phone Number
          </h2>
          <p style={{
            fontSize: "15px",
            color: "#8A8A8F",
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
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
              marginBottom: "16px",
              outline: "none",
              transition: "border-color 0.2s"
            }}
            onFocus={(e) => e.target.style.borderColor = "#0088CC"}
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
              background: loading || !phoneNumber.trim() ? "#d1d5db" : "#0088CC",
              border: "none",
              borderRadius: "12px",
              cursor: loading || !phoneNumber.trim() ? "not-allowed" : "pointer",
              transition: "background 0.2s",
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
            }}
            onMouseEnter={(e) => {
              if (!loading && phoneNumber.trim()) {
                e.target.style.background = "#0077B3";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && phoneNumber.trim()) {
                e.target.style.background = "#0088CC";
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
          background: "#FFFFFF",
          borderRadius: "16px",
          padding: "32px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
          border: "2px solid #e5e7eb"
        }}>
          <h2 style={{
            fontSize: "24px",
            fontWeight: "700",
            color: "#0088CC",
            margin: "0 0 8px 0"
          }}>
            Step 2: Verification Code
          </h2>
          <p style={{
            fontSize: "15px",
            color: "#8A8A8F",
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
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
              marginBottom: "16px",
              outline: "none",
              letterSpacing: "0.1em",
              textAlign: "center",
              fontSize: "24px",
              fontWeight: "600"
            }}
            onFocus={(e) => e.target.style.borderColor = "#0088CC"}
            onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
            onKeyDown={(e) => e.key === "Enter" && handleVerifyCode()}
          />

          {/* Password field (only shown if 2FA is enabled) */}
          {needsPassword && (
            <>
              <p style={{
                fontSize: "14px",
                color: "#8A8A8F",
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
                  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                  marginBottom: "16px",
                  outline: "none"
                }}
                onFocus={(e) => e.target.style.borderColor = "#0088CC"}
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
              background: loading || !code.trim() ? "#d1d5db" : "#0088CC",
              border: "none",
              borderRadius: "12px",
              cursor: loading || !code.trim() ? "not-allowed" : "pointer",
              transition: "background 0.2s",
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
            }}
            onMouseEnter={(e) => {
              if (!loading && code.trim()) {
                e.target.style.background = "#0077B3";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && code.trim()) {
                e.target.style.background = "#0088CC";
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
              color: "#8A8A8F",
              background: "transparent",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
            }}
          >
            Back to phone number
          </button>
        </div>
      )}

      {/* Step 3: Contact List */}
      {step === 3 && (
        <div style={{
          background: "#FFFFFF",
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
                color: "#0088CC",
                margin: "0 0 4px 0"
              }}>
                Your Chats
              </h2>
              <p style={{
                fontSize: "14px",
                color: "#8A8A8F",
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
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
              }}
            >
              Disconnect
            </button>
          </div>

          {loading && contacts.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "#8A8A8F"
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
              color: "#8A8A8F"
            }}>
              <div style={{
                fontSize: "24px",
                marginBottom: "12px"
              }}>📱</div>
              <p style={{ margin: 0 }}>No chats found</p>
            </div>
          ) : (
            <>
              {/* Folder Tabs */}
              <div style={{
                display: "flex",
                gap: "8px",
                marginBottom: "16px",
                overflowX: "auto",
                paddingBottom: "8px",
                borderBottom: "1px solid #e5e7eb"
              }}>
                <button
                  onClick={() => handleFolderSelect("all")}
                  disabled={loading}
                  style={{
                    padding: "8px 16px",
                    fontSize: "14px",
                    fontWeight: "600",
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                    color: selectedFolder === "all" ? "#0088CC" : "#8A8A8F",
                    background: selectedFolder === "all" ? "#E3F2FD" : "transparent",
                    border: "none",
                    borderRadius: "8px",
                    cursor: loading ? "wait" : "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.2s",
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  All {loading && selectedFolder === "all" ? "⏳" : ""}
                </button>
                {availableFolders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => handleFolderSelect(folder)}
                    disabled={loading}
                    style={{
                      padding: "8px 16px",
                      fontSize: "14px",
                      fontWeight: "600",
                      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                      color: selectedFolder?.id === folder.id ? "#0088CC" : "#8A8A8F",
                      background: selectedFolder?.id === folder.id ? "#E3F2FD" : "transparent",
                      border: "none",
                      borderRadius: "8px",
                      cursor: loading ? "wait" : "pointer",
                      whiteSpace: "nowrap",
                      transition: "all 0.2s",
                      opacity: loading ? 0.6 : 1
                    }}
                  >
                    📁 {folder.name} {loading && selectedFolder?.id === folder.id ? "⏳" : ""}
                  </button>
                ))}
                {contacts.some(c => !c.folder_name) && (
                  <button
                    onClick={() => handleFolderSelect("none")}
                    disabled={loading}
                    style={{
                      padding: "8px 16px",
                      fontSize: "14px",
                      fontWeight: "600",
                      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                      color: selectedFolder === "none" ? "#0088CC" : "#8A8A8F",
                      background: selectedFolder === "none" ? "#E3F2FD" : "transparent",
                      border: "none",
                      borderRadius: "8px",
                      cursor: loading ? "wait" : "pointer",
                      whiteSpace: "nowrap",
                      transition: "all 0.2s",
                      opacity: loading ? 0.6 : 1
                    }}
                  >
                    No Folder {loading && selectedFolder === "none" ? "⏳" : ""}
                  </button>
                )}
              </div>

              {/* Contacts List */}
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px"
              }}>
              {contacts.map((chat) => (
                <div
                  key={chat.id}
                  style={{
                    padding: "16px",
                    border: "2px solid #e5e7eb",
                    borderRadius: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "border-color 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = "#0088CC"}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = "#e5e7eb"}
                >
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#1a202c",
                      margin: "0 0 4px 0"
                    }}>
                      {chat.name}
                    </h3>
                    <div style={{
                      display: "flex",
                      gap: "8px",
                      fontSize: "13px",
                      color: "#8A8A8F",
                      flexWrap: "wrap"
                    }}>
                      <span>
                        {chat.type === 'user' ? '👤' : chat.type === 'group' ? '👥' : '📢'}
                        {' '}
                        {chat.type}
                      </span>
                      {chat.unread_count > 0 && (
                        <span style={{
                          background: "#DBEAFE",
                          color: "#1E40AF",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontWeight: "600"
                        }}>
                          💬 {chat.unread_count} unread
                        </span>
                      )}
                      {chat.pinned && (
                        <span style={{
                          background: "#FEF9C3",
                          color: "#854D0E",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontWeight: "600"
                        }}>
                          ⭐ Pinned
                        </span>
                      )}
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
                          background: "#0088CC",
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
                      background: "#0088CC",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                      transition: "background 0.2s"
                    }}
                    onMouseEnter={(e) => e.target.style.background = "#0077B3"}
                    onMouseLeave={(e) => e.target.style.background = "#0088CC"}
                  >
                    Download
                  </button>
                </div>
              ))}

              {/* Load More Button */}
              {hasMoreContacts && contacts.length > 0 && (
                <div style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: "20px"
                }}>
                  <button
                    onClick={loadMoreContacts}
                    disabled={loadingMore}
                    style={{
                      padding: "12px 32px",
                      fontSize: "15px",
                      fontWeight: "600",
                      color: loadingMore ? "#9CA3AF" : "#0088CC",
                      background: "#FFFFFF",
                      border: `2px solid ${loadingMore ? "#9CA3AF" : "#0088CC"}`,
                      borderRadius: "8px",
                      cursor: loadingMore ? "not-allowed" : "pointer",
                      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      if (!loadingMore) {
                        e.target.style.background = "#E3F2FD";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loadingMore) {
                        e.target.style.background = "white";
                      }
                    }}
                  >
                    {loadingMore ? "Loading..." : "Load More Contacts"}
                  </button>
                </div>
              )}
              </div>
            </>
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
