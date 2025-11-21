import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api/client";

/**
 * Compact Telegram Import Modal - Optimized for 400px width
 *
 * Features:
 * - Icon-based UI to save space
 * - Compact button ratios
 * - Fixed download progress indicator (always visible)
 * - "Discuss" link after download completes
 * - Minimal padding and optimized spacing
 */
export default function TelegramImportModalCompact({ isOpen, onClose, onImportComplete, roomId }) {
  const { token } = useAuth();

  // Step state
  const [step, setStep] = useState(0); // 0: QR+phone, 1: phone entry, 2: code, 3: contacts

  // Form inputs
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");

  // QR login state
  const [qrCode, setQrCode] = useState(null);
  const [qrLoginId, setQrLoginId] = useState(null);
  const [qrStatus, setQrStatus] = useState(null);
  const [qr2FAPassword, setQr2FAPassword] = useState("");
  const [qrCountdown, setQrCountdown] = useState(30);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Data state
  const [contacts, setContacts] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [downloadId, setDownloadId] = useState(null);
  const [downloadStatus, setDownloadStatus] = useState(null);
  const [downloadedMessages, setDownloadedMessages] = useState(null);
  const [currentLimit, setCurrentLimit] = useState(10);
  const [hasMoreContacts, setHasMoreContacts] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState("all");
  const [availableFolders, setAvailableFolders] = useState([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [previewChatId, setPreviewChatId] = useState(null);
  const [previewMessages, setPreviewMessages] = useState([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    if (isOpen) {
      checkExistingSession();
    }
  }, [isOpen, token]);

  // Poll download status
  useEffect(() => {
    if (downloadId && downloadStatus?.status !== "completed" && downloadStatus?.status !== "failed") {
      const interval = setInterval(async () => {
        try {
          const status = await apiRequest(`/telegram/downloads/${downloadId}`, "GET", null, token);
          setDownloadStatus(status);

          if (status.status === "completed") {
            // Fetch the downloaded messages
            const messages = await apiRequest(`/telegram/downloads/${downloadId}/messages`, "GET", null, token);
            setDownloadedMessages(messages);
          }
        } catch (err) {
          console.error("Failed to fetch download status:", err);
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [downloadId, downloadStatus, token]);

  // Reload contacts when folder selection or limit changes
  useEffect(() => {
    if (step === 3 && token) {
      loadContacts();
    }
  }, [selectedFolder, currentLimit]);

  // Poll QR login status
  useEffect(() => {
    if (qrLoginId && step === 0 && qrStatus !== 'success' && qrStatus !== '2fa_required') {
      const interval = setInterval(async () => {
        try {
          const response = await apiRequest(`/telegram/qr-login/status/${qrLoginId}`, "GET", null, token);
          setQrStatus(response.status);

          if (response.status === 'success') {
            setStep(3);
            loadContacts();
          } else if (response.status === 'expired') {
            setQrCountdown(0);
          }
        } catch (err) {
          console.error("Failed to check QR status:", err);
        }
      }, 2500);

      return () => clearInterval(interval);
    }
  }, [qrLoginId, qrStatus, step, token]);

  // Countdown timer for QR code
  useEffect(() => {
    if (qrCode && qrCountdown > 0 && step === 0) {
      const timer = setTimeout(() => {
        setQrCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [qrCode, qrCountdown, step]);

  // Auto-initiate QR login when modal opens (if no session or session expired)
  useEffect(() => {
    if (isOpen && !checkingSession && step === 0 && !qrCode && token) {
      handleInitiateQRLogin();
    }
  }, [isOpen, checkingSession, step, qrCode, token]);

  const checkExistingSession = async () => {
    if (!token) {
      setCheckingSession(false);
      return;
    }

    try {
      const response = await apiRequest("/telegram/session-status", "GET", null, token);
      if (response.is_connected) {
        setPhoneNumber(response.phone_number || "");
        setStep(3);
        loadContacts();
      }
      // If not connected, step stays at 0 and QR will auto-initiate
    } catch (err) {
      // Check if this is a session expired error - show warning but still allow QR
      if (err.message?.includes("expired") || err.message?.includes("invalid") || err.status === 404) {
        setSessionExpired(true);
      }
      // Step stays at 0, QR will auto-initiate
      console.error("Session check failed:", err);
    } finally {
      setCheckingSession(false);
    }
  };

  const handleSendCode = async () => {
    if (!phoneNumber.trim()) {
      setError("Please enter phone number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await apiRequest("/telegram/connect", "POST", { phone_number: phoneNumber }, token);
      setStep(2);
    } catch (err) {
      setError(err.message || "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code.trim()) {
      setError("Please enter code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await apiRequest("/telegram/verify", "POST", {
        phone_number: phoneNumber,
        code: code,
        password: needsPassword ? password : undefined
      }, token);

      setStep(3);
      loadContacts();
    } catch (err) {
      if (err.message?.includes("Password required")) {
        setNeedsPassword(true);
        setError("2FA enabled. Enter password");
      } else {
        setError(err.message || "Invalid code");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateQRLogin = async () => {
    setLoading(true);
    setError("");
    setQrStatus(null);
    setSessionExpired(false);

    try {
      const response = await apiRequest("/telegram/qr-login/initiate", "POST", null, token);
      setQrCode(response.qr_code);
      setQrLoginId(response.login_id);
      setQrCountdown(30);
      setStep(0);
    } catch (err) {
      setError(err.message || "Failed to generate QR code");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshQR = async () => {
    setLoading(true);
    setError("");
    setQrStatus(null);

    try {
      if (qrLoginId) {
        // Try to refresh the existing QR code first using recreate()
        try {
          const response = await apiRequest(`/telegram/qr-login/refresh/${qrLoginId}`, "POST", null, token);
          setQrCode(response.qr_code);
          setQrCountdown(30);
          setLoading(false);
          return;
        } catch (e) {
          // If refresh fails (session expired), fall back to creating new
          try {
            await apiRequest(`/telegram/qr-login/${qrLoginId}`, "DELETE", null, token);
          } catch (deleteErr) {
            // Ignore cleanup errors
          }
        }
      }

      // Create new QR login session
      const response = await apiRequest("/telegram/qr-login/initiate", "POST", null, token);
      setQrCode(response.qr_code);
      setQrLoginId(response.login_id);
      setQrCountdown(30);
    } catch (err) {
      setError(err.message || "Failed to refresh QR code");
    } finally {
      setLoading(false);
    }
  };

  const handleQR2FA = async () => {
    if (!qr2FAPassword.trim()) {
      setError("Please enter your 2FA password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await apiRequest(`/telegram/qr-login/2fa/${qrLoginId}`, "POST", {
        password: qr2FAPassword
      }, token);

      setStep(3);
      loadContacts();
    } catch (err) {
      setError(err.message || "Invalid 2FA password");
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    setLoading(true);
    setError("");

    try {
      const folderIdParam = selectedFolder === "all" ? null : (selectedFolder === "none" ? -1 : parseInt(selectedFolder));
      const response = await apiRequest(
        `/telegram/contacts?limit=${currentLimit}${folderIdParam !== null ? `&folder_id=${folderIdParam}` : ''}`,
        "GET",
        null,
        token
      );

      setContacts(response.contacts || []);

      // Extract unique folders
      const folders = response.folders || [];
      setAvailableFolders(folders);

      setHasMoreContacts((response.contacts || []).length >= currentLimit);
    } catch (err) {
      const errorMsg = err.message || "Failed to load contacts";
      // Check if session expired
      if (errorMsg.includes("expired") || errorMsg.includes("invalid") || err.status === 404) {
        setSessionExpired(true);
        setStep(0); // Go back to QR code step
        setError("");
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartDownload = async (chatId, chatName, startDate, endDate) => {
    try {
      const response = await apiRequest("/telegram/download", "POST", {
        chat_id: chatId,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      }, token);

      setDownloadId(response.download_id);
      setDownloadStatus({ status: "processing", message_count: 0, chat_name: chatName });
      setShowDatePicker(false);
    } catch (err) {
      setError(err.message || "Failed to start download");
    }
  };

  const handleViewInChat = () => {
    console.log("[TelegramModal] Discuss clicked");
    console.log("[TelegramModal] onImportComplete:", !!onImportComplete);
    console.log("[TelegramModal] downloadedMessages:", downloadedMessages);

    if (onImportComplete && downloadedMessages) {
      console.log("[TelegramModal] Calling onImportComplete with data");
      // Pass the full download data to parent
      onImportComplete({
        download_id: downloadedMessages.download_id,
        chat_name: downloadedMessages.chat_name,
        chat_type: downloadedMessages.chat_type,
        message_count: downloadedMessages.message_count,
        messages: downloadedMessages.messages
      });
    } else {
      console.error("[TelegramModal] Cannot proceed - missing data or callback");
    }
    // Modal will be closed by parent after backend processing
  };

  const handlePreviewMessages = async (chatId, chatName, e) => {
    e.stopPropagation(); // Prevent selecting the chat

    if (previewChatId === chatId) {
      // Close preview if already open
      setPreviewChatId(null);
      setPreviewMessages([]);
      return;
    }

    setLoadingPreview(true);
    setPreviewChatId(chatId);
    setPreviewMessages([]);

    try {
      const response = await apiRequest(
        `/telegram/messages/preview/${chatId}?limit=20`,
        "GET",
        null,
        token
      );
      setPreviewMessages(response.messages || []);
    } catch (err) {
      setError(`Failed to load preview: ${err.message}`);
      setPreviewChatId(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  if (!isOpen) return null;

  if (checkingSession) {
    return (
      <ModalWrapper onClose={onClose}>
        <div style={{ textAlign: "center", padding: "20px" }}>
          <div style={{ fontSize: "20px", fontFamily: "monospace" }}>&#9201;</div>
          <p style={{ fontSize: "12px", color: "#8A8A8F", margin: "8px 0 0 0" }}>
            Checking connection...
          </p>
        </div>
      </ModalWrapper>
    );
  }

  return (
    <ModalWrapper
      onClose={onClose}
      onRefresh={handleRefreshQR}
      showRefresh={(step === 0 && !loading) || sessionExpired}
    >
      {/* Fixed Download Progress Indicator */}
      {downloadId && (
        <div style={{
          position: "sticky",
          top: 0,
          background: downloadStatus?.status === "completed" ? "#ecfdf5" : "#fef3c7",
          border: `1px solid ${downloadStatus?.status === "completed" ? "#10b981" : "#f59e0b"}`,
          borderRadius: "8px",
          padding: "8px 10px",
          marginBottom: "12px",
          fontSize: "11px",
          zIndex: 10
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: "600", color: "#1a202c", marginBottom: "2px" }}>
                {downloadStatus?.chat_name || "Downloading..."}
              </div>
              <div style={{ color: "#6b7280" }}>
                {downloadStatus?.status === "completed" ? (
                  <><span style={{ fontFamily: "monospace" }}>&#10003;</span> {downloadStatus.message_count} messages</>
                ) : downloadStatus?.status === "failed" ? (
                  <><span style={{ fontFamily: "monospace" }}>&#10007;</span> Failed</>
                ) : (
                  <><span style={{ fontFamily: "monospace" }}>&#9201;</span> {downloadStatus?.message_count || 0} messages...</>
                )}
              </div>
            </div>
            {downloadStatus?.status === "completed" && (
              <button
                onClick={handleViewInChat}
                style={{
                  padding: "6px 12px",
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "white",
                  background: "#10b981",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
              >
                Discuss
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div style={{
          background: "#fef2f2",
          border: "1px solid #ef4444",
          borderRadius: "6px",
          padding: "8px",
          marginBottom: "12px",
          color: "#991b1b",
          fontSize: "11px"
        }}>
          {error}
        </div>
      )}

      {/* Step 0: QR Code + Phone Input */}
      {step === 0 && (
        <div>
          {/* Session Expired Warning */}
          {sessionExpired && (
            <div style={{
              background: "#fef3c7",
              border: "1px solid #f59e0b",
              borderRadius: "6px",
              padding: "8px 10px",
              marginBottom: "12px",
              fontSize: "11px",
              color: "#92400e"
            }}>
              <span style={{ marginRight: "6px" }}>&#9888;</span>
              Your Telegram session has expired. Please reconnect.
            </div>
          )}

          {/* 2FA Password Input for QR login */}
          {qrStatus === '2fa_required' ? (
            <div>
              <h3 style={{ fontSize: "14px", fontWeight: "600", margin: "0 0 12px 0" }}>
                Two-Factor Authentication
              </h3>
              <p style={{ fontSize: "11px", color: "#6b7280", margin: "0 0 12px 0" }}>
                Please enter your 2FA password to complete login.
              </p>
              <input
                type="password"
                value={qr2FAPassword}
                onChange={(e) => setQr2FAPassword(e.target.value)}
                placeholder="2FA Password"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "10px",
                  fontSize: "13px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  marginBottom: "10px",
                  outline: "none",
                  boxSizing: "border-box"
                }}
                onKeyDown={(e) => e.key === "Enter" && handleQR2FA()}
              />
              <button
                onClick={handleQR2FA}
                disabled={loading || !qr2FAPassword.trim()}
                style={{
                  width: "100%",
                  padding: "10px",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "white",
                  background: loading || !qr2FAPassword.trim() ? "#d1d5db" : "#0088CC",
                  border: "none",
                  borderRadius: "6px",
                  cursor: loading || !qr2FAPassword.trim() ? "not-allowed" : "pointer"
                }}
              >
                {loading ? "Verifying..." : "Continue"}
              </button>
            </div>
          ) : (
            <div>
              <h3 style={{ fontSize: "14px", fontWeight: "600", margin: "0 0 8px 0" }}>
                Connect Telegram
              </h3>
              <p style={{ fontSize: "11px", color: "#6b7280", margin: "0 0 12px 0" }}>
                Scan with your phone camera or Telegram app
              </p>

              {/* QR Code Display */}
              <div style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "8px"
              }}>
                {qrCode ? (
                  <div style={{ position: "relative" }}>
                    <img
                      src={qrCode}
                      alt="Telegram QR Code"
                      style={{
                        width: "180px",
                        height: "180px",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        opacity: qrCountdown === 0 ? 0.3 : 1
                      }}
                    />
                    {qrCountdown === 0 && (
                      <div style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        background: "rgba(0,0,0,0.8)",
                        color: "white",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "600",
                        textAlign: "center",
                        cursor: "pointer"
                      }} onClick={handleRefreshQR}>
                        Expired - tap to refresh
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{
                    width: "180px",
                    height: "180px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#f3f4f6",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "#6b7280"
                  }}>
                    {loading ? "Generating..." : "Loading..."}
                  </div>
                )}
              </div>

              {/* Countdown Timer */}
              {qrCode && qrCountdown > 0 && (
                <div style={{
                  textAlign: "center",
                  fontSize: "11px",
                  color: qrCountdown <= 10 ? "#ef4444" : "#6b7280",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px"
                }}>
                  <span style={{ fontFamily: "monospace" }}>&#9201;</span>
                  {qrCountdown}s remaining
                </div>
              )}

              {/* Divider */}
              <div style={{
                display: "flex",
                alignItems: "center",
                margin: "12px 0",
                gap: "8px"
              }}>
                <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }} />
                <span style={{ fontSize: "10px", color: "#8A8A8F" }}>or use phone number</span>
                <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }} />
              </div>

              {/* Phone Number Input */}
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+44 7123456789"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "10px",
                  fontSize: "13px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  marginBottom: "10px",
                  outline: "none",
                  boxSizing: "border-box"
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
                  padding: "10px",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "white",
                  background: loading || !phoneNumber.trim() ? "#d1d5db" : "#0088CC",
                  border: "none",
                  borderRadius: "6px",
                  cursor: loading || !phoneNumber.trim() ? "not-allowed" : "pointer"
                }}
              >
                {loading ? "Sending..." : "Send Code"}
              </button>
            </div>
          )}
        </div>
      )}


      {/* Step 2: Verification Code */}
      {step === 2 && (
        <div>
          <h3 style={{ fontSize: "14px", fontWeight: "600", margin: "0 0 12px 0" }}>
            Enter Verification Code
          </h3>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="12345"
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px",
              fontSize: "13px",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              marginBottom: "10px",
              outline: "none",
              boxSizing: "border-box"
            }}
            onFocus={(e) => e.target.style.borderColor = "#0088CC"}
            onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
            onKeyDown={(e) => e.key === "Enter" && handleVerifyCode()}
          />
          {needsPassword && (
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="2FA Password"
              disabled={loading}
              style={{
                width: "100%",
                padding: "10px",
                fontSize: "13px",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                marginBottom: "10px",
                outline: "none",
                boxSizing: "border-box"
              }}
              onFocus={(e) => e.target.style.borderColor = "#0088CC"}
              onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
              onKeyDown={(e) => e.key === "Enter" && handleVerifyCode()}
            />
          )}
          <button
            onClick={handleVerifyCode}
            disabled={loading || !code.trim() || (needsPassword && !password.trim())}
            style={{
              width: "100%",
              padding: "10px",
              fontSize: "13px",
              fontWeight: "600",
              color: "white",
              background: loading || !code.trim() ? "#d1d5db" : "#0088CC",
              border: "none",
              borderRadius: "6px",
              cursor: loading || !code.trim() ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
        </div>
      )}

      {/* Step 3: Contacts */}
      {step === 3 && (
        <div>
          <h3 style={{ fontSize: "14px", fontWeight: "600", margin: "0 0 12px 0" }}>
            Select Contact
          </h3>

          {/* Folder Filter */}
          {availableFolders.length > 0 && (
            <div style={{ marginBottom: "12px", overflowX: "auto", whiteSpace: "nowrap", paddingBottom: "4px" }}>
              <button
                onClick={() => {
                  setSelectedFolder("all");
                  setCurrentLimit(10);
                }}
                style={{
                  padding: "6px 12px",
                  fontSize: "11px",
                  fontWeight: "600",
                  color: selectedFolder === "all" ? "white" : "#0088CC",
                  background: selectedFolder === "all" ? "#0088CC" : "white",
                  border: "1px solid #0088CC",
                  borderRadius: "6px",
                  cursor: "pointer",
                  marginRight: "6px"
                }}
              >
                All
              </button>
              {availableFolders.map(folder => (
                <button
                  key={folder.id}
                  onClick={() => {
                    setSelectedFolder(String(folder.id));
                    setCurrentLimit(10);
                  }}
                  style={{
                    padding: "6px 12px",
                    fontSize: "11px",
                    fontWeight: "600",
                    color: selectedFolder === String(folder.id) ? "white" : "#0088CC",
                    background: selectedFolder === String(folder.id) ? "#0088CC" : "white",
                    border: "1px solid #0088CC",
                    borderRadius: "6px",
                    cursor: "pointer",
                    marginRight: "6px"
                  }}
                >
                  <span style={{ fontFamily: "monospace" }}>&#128193;</span> {folder.name}
                </button>
              ))}
            </div>
          )}

          {/* Contacts List */}
          <div style={{ maxHeight: "300px", overflowY: "auto" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "20px", color: "#8A8A8F", fontSize: "12px" }}>
                Loading...
              </div>
            ) : contacts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px", color: "#8A8A8F", fontSize: "12px" }}>
                No contacts found
              </div>
            ) : (
              contacts.map(contact => (
                <div key={contact.id}>
                  <div
                    onClick={() => setSelectedChat(contact)}
                    style={{
                      padding: "10px",
                      background: selectedChat?.id === contact.id ? "#e0f2fe" : "white",
                      border: `1px solid ${selectedChat?.id === contact.id ? "#0088CC" : "#e5e7eb"}`,
                      borderRadius: "6px",
                      marginBottom: previewChatId === contact.id ? "0" : "8px",
                      cursor: "pointer",
                      fontSize: "12px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottomLeftRadius: previewChatId === contact.id ? "0" : "6px",
                      borderBottomRightRadius: previewChatId === contact.id ? "0" : "6px"
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "600", color: "#1a202c", marginBottom: "2px" }}>
                        {contact.name}
                      </div>
                      {contact.folder_name && (
                        <div style={{ fontSize: "10px", color: "#6b7280" }}>
                          <span style={{ fontFamily: "monospace" }}>&#128193;</span> {contact.folder_name}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => handlePreviewMessages(contact.id, contact.name, e)}
                      style={{
                        background: previewChatId === contact.id ? "#0088CC" : "#f3f4f6",
                        border: "none",
                        borderRadius: "4px",
                        width: "28px",
                        height: "28px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        fontSize: "14px",
                        transition: "all 0.2s"
                      }}
                      title="Preview messages"
                    >
                      {loadingPreview && previewChatId === contact.id ? <span style={{ fontFamily: "monospace" }}>&#9201;</span> : <span style={{ fontFamily: "monospace" }}>&#9673;</span>}
                    </button>
                  </div>

                  {/* Message Preview Dropdown */}
                  {previewChatId === contact.id && (
                    <div style={{
                      background: "#fafafa",
                      border: "1px solid #e5e7eb",
                      borderTop: "none",
                      borderBottomLeftRadius: "6px",
                      borderBottomRightRadius: "6px",
                      padding: "8px",
                      marginBottom: "8px",
                      maxHeight: "200px",
                      overflowY: "auto",
                      fontSize: "10px"
                    }}>
                      {loadingPreview ? (
                        <div style={{ textAlign: "center", padding: "10px", color: "#8A8A8F" }}>
                          Loading messages...
                        </div>
                      ) : previewMessages.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "10px", color: "#8A8A8F" }}>
                          No messages found
                        </div>
                      ) : (
                        previewMessages.map((msg, idx) => (
                          <div key={idx} style={{
                            padding: "6px",
                            background: "white",
                            borderRadius: "4px",
                            marginBottom: "4px",
                            borderLeft: `2px solid ${msg.is_outgoing ? "#0088CC" : "#6b7280"}`
                          }}>
                            <div style={{ fontWeight: "600", color: "#1a202c", marginBottom: "2px", fontSize: "10px" }}>
                              {msg.sender_name}
                            </div>
                            <div style={{ color: "#6b7280", fontSize: "9px", marginBottom: "2px" }}>
                              {new Date(msg.date).toLocaleDateString()}
                            </div>
                            <div style={{ color: "#374151", fontSize: "10px" }}>
                              {msg.text_preview}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {hasMoreContacts && !loading && (
            <button
              onClick={() => {
                setCurrentLimit(prev => prev + 10);
              }}
              style={{
                width: "100%",
                padding: "8px",
                fontSize: "11px",
                fontWeight: "600",
                color: "#0088CC",
                background: "white",
                border: "1px solid #0088CC",
                borderRadius: "6px",
                cursor: "pointer",
                marginTop: "12px"
              }}
            >
              Load More
            </button>
          )}

          {selectedChat && (
            <div style={{ marginTop: "16px" }}>
              <SimpleDateRangePicker
                chatId={selectedChat.id}
                chatName={selectedChat.name}
                onStartDownload={handleStartDownload}
                token={token}
              />
            </div>
          )}
        </div>
      )}
    </ModalWrapper>
  );
}

// Modal Wrapper Component
function ModalWrapper({ children, onClose, onRefresh, showRefresh }) {
  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      padding: "20px"
    }}>
      <div style={{
        background: "#F5F7FA",
        borderRadius: "12px",
        maxWidth: "400px",
        width: "100%",
        maxHeight: "80vh",
        overflow: "auto",
        position: "relative",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)"
      }}>
        {/* Refresh button */}
        {showRefresh && onRefresh && (
          <button
            onClick={onRefresh}
            title="Refresh QR Code"
            style={{
              position: "absolute",
              top: "8px",
              right: "44px",
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "50%",
              width: "28px",
              height: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              cursor: "pointer",
              color: "#8A8A8F",
              zIndex: 10,
              transition: "all 0.2s",
              fontWeight: "400",
              lineHeight: 1,
              padding: 0,
              fontFamily: "monospace"
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "#3b82f6";
              e.target.style.borderColor = "#3b82f6";
              e.target.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "white";
              e.target.style.borderColor = "#e5e7eb";
              e.target.style.color = "#8A8A8F";
            }}
          >
            &#8635;
          </button>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "50%",
            width: "28px",
            height: "28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            cursor: "pointer",
            color: "#8A8A8F",
            zIndex: 10,
            transition: "all 0.2s",
            fontWeight: "300",
            lineHeight: 1,
            padding: 0
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "#ef4444";
            e.target.style.borderColor = "#ef4444";
            e.target.style.color = "white";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "white";
            e.target.style.borderColor = "#e5e7eb";
            e.target.style.color = "#8A8A8F";
          }}
        >
          ×
        </button>

        {/* Content */}
        <div style={{ padding: "12px", paddingTop: "40px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// Simple Date Range Picker with Calendar Icon
function SimpleDateRangePicker({ chatId, chatName, onStartDownload, token }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleDownload = () => {
    if (!startDate || !endDate) {
      alert("Please select both start and end dates");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      alert("Start date must be before end date");
      return;
    }

    onStartDownload(chatId, chatName, start, end);
  };

  return (
    <div>
      <h4 style={{ fontSize: "12px", fontWeight: "600", margin: "0 0 8px 0" }}>
        <span style={{ fontFamily: "monospace" }}>&#128197;</span> Select Date Range
      </h4>

      <div style={{ marginBottom: "8px" }}>
        <label style={{ fontSize: "10px", color: "#6b7280", display: "block", marginBottom: "4px" }}>
          From
        </label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          style={{
            width: "100%",
            padding: "8px",
            fontSize: "12px",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            outline: "none",
            boxSizing: "border-box"
          }}
        />
      </div>

      <div style={{ marginBottom: "12px" }}>
        <label style={{ fontSize: "10px", color: "#6b7280", display: "block", marginBottom: "4px" }}>
          To
        </label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          style={{
            width: "100%",
            padding: "8px",
            fontSize: "12px",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            outline: "none",
            boxSizing: "border-box"
          }}
        />
      </div>

      <button
        onClick={handleDownload}
        disabled={!startDate || !endDate}
        style={{
          width: "100%",
          padding: "10px",
          fontSize: "13px",
          fontWeight: "600",
          color: "white",
          background: (!startDate || !endDate) ? "#d1d5db" : "#10b981",
          border: "none",
          borderRadius: "6px",
          cursor: (!startDate || !endDate) ? "not-allowed" : "pointer"
        }}
      >
        <span style={{ fontFamily: "monospace" }}>&#8595;</span> Download Messages
      </button>
    </div>
  );
}
