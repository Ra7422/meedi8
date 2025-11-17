import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api/client";
import TelegramDateRangePicker from "./TelegramDateRangePicker";
import TelegramDownloadStatus from "./TelegramDownloadStatus";

/**
 * TelegramImportModal - Embeddable Telegram chat import interface
 *
 * Props:
 * - isOpen: boolean - Controls modal visibility
 * - onClose: function - Callback when modal is closed
 * - onImportComplete: function - Callback when import finishes (optional)
 * - roomId: number - The room/context to import into (optional)
 */
export default function TelegramImportModal({ isOpen, onClose, onImportComplete, roomId }) {
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
  const [currentLimit, setCurrentLimit] = useState(10);
  const [hasMoreContacts, setHasMoreContacts] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState("all");
  const [availableFolders, setAvailableFolders] = useState([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Message preview state
  const [expandedChatId, setExpandedChatId] = useState(null);
  const [chatMessages, setChatMessages] = useState({});
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [selectedStartMsg, setSelectedStartMsg] = useState(null);
  const [selectedEndMsg, setSelectedEndMsg] = useState(null);

  // Check for existing session when modal opens
  useEffect(() => {
    if (isOpen && token) {
      checkExistingSession();
    }
  }, [isOpen, token]);

  const checkExistingSession = async () => {
    setCheckingSession(true);
    try {
      const response = await apiRequest("/telegram/session", "GET", null, token);
      if (response.has_session) {
        // User already connected, skip to contacts
        setStep(3);
        await fetchContacts();
      }
    } catch (error) {
      console.log("No existing session:", error.message);
    } finally {
      setCheckingSession(false);
    }
  };

  const handleSendCode = async () => {
    if (!phoneNumber.trim()) {
      setError("Please enter your phone number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await apiRequest("/telegram/connect", "POST", { phone_number: phoneNumber }, token);
      setStep(2); // Move to code verification
    } catch (error) {
      setError(error.message || "Failed to send verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code.trim()) {
      setError("Please enter the verification code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await apiRequest("/telegram/verify", "POST", {
        phone_number: phoneNumber,
        code,
        password: needsPassword ? password : undefined
      }, token);

      setStep(3); // Move to contacts list
      await fetchContacts();
    } catch (error) {
      if (error.message.includes("2FA") || error.message.includes("password")) {
        setNeedsPassword(true);
        setError("Two-factor authentication enabled. Please enter your password.");
      } else {
        setError(error.message || "Verification failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async (limit = 10, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const folderParam = selectedFolder !== "all" ? `&folder_id=${selectedFolder}` : "";
      const response = await apiRequest(
        `/telegram/contacts?limit=${limit}${folderParam}`,
        "GET",
        null,
        token
      );

      if (append) {
        setContacts(prev => [...prev, ...response.contacts]);
      } else {
        setContacts(response.contacts);
        // Extract unique folders
        if (response.folders && response.folders.length > 0) {
          setAvailableFolders(response.folders);
        }
      }

      setHasMoreContacts(response.contacts.length >= limit);
    } catch (error) {
      setError(error.message || "Failed to fetch contacts");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSelectChat = async (chat) => {
    setSelectedChat(chat);
    setExpandedChatId(chat.id);

    // Fetch messages for preview
    if (!chatMessages[chat.id]) {
      await fetchChatMessages(chat.id);
    }
  };

  const fetchChatMessages = async (chatId, offset = null) => {
    setLoadingMessages(true);
    try {
      const offsetParam = offset ? `&offset_id=${offset}` : "";
      const response = await apiRequest(
        `/telegram/messages/preview/${chatId}?limit=44${offsetParam}`,
        "GET",
        null,
        token
      );

      setChatMessages(prev => ({
        ...prev,
        [chatId]: {
          messages: response.messages || [],
          hasMore: response.has_more || false
        }
      }));
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      setError("Failed to load message preview");
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleStartDownload = (chatId, chatName, startDate, endDate) => {
    setShowDatePicker(true);
    // Download will be handled by TelegramDateRangePicker component
  };

  if (!isOpen) return null;

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
      padding: "20px",
      overflow: "auto"
    }}>
      <div style={{
        background: "#FFFFFF",
        borderRadius: "16px",
        padding: "32px",
        maxWidth: "900px",
        width: "100%",
        maxHeight: "90vh",
        overflow: "auto",
        position: "relative"
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "none",
            border: "none",
            fontSize: "24px",
            cursor: "pointer",
            color: "#8A8A8F",
            padding: "8px",
            lineHeight: 1
          }}
        >
          ×
        </button>

        <h2 style={{
          fontSize: "24px",
          fontWeight: "700",
          color: "#0088CC",
          marginBottom: "24px"
        }}>
          Import from Telegram
        </h2>

        {checkingSession ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#8A8A8F" }}>
            Checking connection...
          </div>
        ) : error ? (
          <div style={{
            padding: "12px 16px",
            background: "#fee2e2",
            color: "#dc2626",
            borderRadius: "8px",
            marginBottom: "16px"
          }}>
            {error}
          </div>
        ) : null}

        {/* Step 1: Phone Number */}
        {step === 1 && !checkingSession && (
          <div>
            <p style={{ marginBottom: "16px", color: "#666" }}>
              Enter your phone number to connect your Telegram account:
            </p>
            <input
              type="tel"
              placeholder="+1234567890"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                fontSize: "16px",
                border: "2px solid #e5e7eb",
                borderRadius: "12px",
                marginBottom: "16px"
              }}
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
                cursor: loading || !phoneNumber.trim() ? "not-allowed" : "pointer"
              }}
            >
              {loading ? "Sending..." : "Send Code"}
            </button>
          </div>
        )}

        {/* Step 2: Verification Code */}
        {step === 2 && (
          <div>
            <p style={{ marginBottom: "16px", color: "#666" }}>
              Enter the verification code sent to {phoneNumber}:
            </p>
            <input
              type="text"
              placeholder="12345"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                fontSize: "16px",
                border: "2px solid #e5e7eb",
                borderRadius: "12px",
                marginBottom: "16px"
              }}
              onKeyDown={(e) => e.key === "Enter" && !needsPassword && handleVerifyCode()}
            />

            {needsPassword && (
              <input
                type="password"
                placeholder="Two-factor password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  fontSize: "16px",
                  border: "2px solid #e5e7eb",
                  borderRadius: "12px",
                  marginBottom: "16px"
                }}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyCode()}
              />
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
                cursor: loading || !code.trim() ? "not-allowed" : "pointer"
              }}
            >
              {loading ? "Verifying..." : "Verify Code"}
            </button>
          </div>
        )}

        {/* Step 3: Contact List */}
        {step === 3 && (
          <div>
            <p style={{ marginBottom: "16px", color: "#666" }}>
              Select a chat to import messages from:
            </p>

            {contacts.length === 0 && !loading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#8A8A8F" }}>
                No chats found
              </div>
            ) : (
              <div style={{ maxHeight: "400px", overflow: "auto" }}>
                {contacts.map(contact => (
                  <div
                    key={contact.id}
                    onClick={() => handleSelectChat(contact)}
                    style={{
                      padding: "12px 16px",
                      border: selectedChat?.id === contact.id ? "2px solid #0088CC" : "1px solid #e5e7eb",
                      borderRadius: "8px",
                      marginBottom: "8px",
                      cursor: "pointer",
                      background: selectedChat?.id === contact.id ? "#f0f9ff" : "white",
                      transition: "all 0.2s"
                    }}
                  >
                    <div style={{ fontWeight: "600", color: "#000" }}>
                      {contact.name}
                    </div>
                    {contact.folder_name && (
                      <div style={{ fontSize: "12px", color: "#8A8A8F", marginTop: "4px" }}>
                        📁 {contact.folder_name}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {hasMoreContacts && (
              <button
                onClick={() => fetchContacts(currentLimit + 10, true)}
                disabled={loadingMore}
                style={{
                  width: "100%",
                  padding: "12px",
                  marginTop: "16px",
                  fontSize: "14px",
                  color: "#0088CC",
                  background: "transparent",
                  border: "2px solid #0088CC",
                  borderRadius: "8px",
                  cursor: loadingMore ? "not-allowed" : "pointer"
                }}
              >
                {loadingMore ? "Loading..." : "Load More"}
              </button>
            )}

            {selectedChat && (
              <button
                onClick={() => setShowDatePicker(true)}
                style={{
                  width: "100%",
                  padding: "16px",
                  marginTop: "16px",
                  fontSize: "16px",
                  fontWeight: "700",
                  color: "white",
                  background: "#0088CC",
                  border: "none",
                  borderRadius: "12px",
                  cursor: "pointer"
                }}
              >
                Select Date Range
              </button>
            )}
          </div>
        )}

        {/* Date Range Picker */}
        {showDatePicker && selectedChat && (
          <TelegramDateRangePicker
            chatId={selectedChat.id}
            chatName={selectedChat.name}
            messages={chatMessages[selectedChat.id]?.messages || []}
            hasMore={chatMessages[selectedChat.id]?.hasMore || false}
            onClose={() => setShowDatePicker(false)}
            onDownloadStart={(id) => {
              setDownloadId(id);
              setShowDatePicker(false);
            }}
          />
        )}

        {/* Download Status */}
        {downloadId && (
          <TelegramDownloadStatus
            downloadId={downloadId}
            onComplete={() => {
              if (onImportComplete) {
                onImportComplete();
              }
              onClose();
            }}
            onClose={() => setDownloadId(null)}
          />
        )}
      </div>
    </div>
  );
}
