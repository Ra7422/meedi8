import React, { useState, useRef, useEffect } from "react";

/**
 * AttachmentMenu - Dropdown menu for file uploads and imports
 *
 * Props:
 * - onFileSelect: function(file) - Callback when file is selected
 * - onTelegramImport: function() - Callback when Telegram import is clicked
 * - disabled: boolean - Whether the menu is disabled
 * - uploading: boolean - Whether a file is currently uploading
 * - isGuest: boolean - Whether user is a guest (restricts all features)
 * - isPremium: boolean - Whether user has premium subscription
 */
export default function AttachmentMenu({
  onFileSelect,
  onTelegramImport,
  disabled = false,
  uploading = false,
  isGuest = false,
  isPremium = true
}) {
  // File upload restricted for guests and non-premium users
  const isUploadRestricted = isGuest || !isPremium;
  // Telegram import restricted for guests and non-premium users
  const isTelegramRestricted = isGuest || !isPremium;
  const [showMenu, setShowMenu] = useState(false);
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMenu]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file && onFileSelect) {
      onFileSelect(file);
      setShowMenu(false);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTelegramClick = () => {
    if (onTelegramImport) {
      onTelegramImport();
    }
    setShowMenu(false);
  };

  return (
    <div ref={menuRef} style={{ position: "relative" }}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx,.txt"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {/* Plus button */}
      <button
        className="icon-button"
        title="Add attachment"
        disabled={disabled || uploading}
        onClick={() => setShowMenu(!showMenu)}
        style={{
          background: "none",
          border: "none",
          color: "#6b7280",
          cursor: disabled || uploading ? "not-allowed" : "pointer",
          padding: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: "40px",
          minHeight: "40px",
          borderRadius: "50%",
          transition: "background 0.2s",
          opacity: disabled || uploading ? 0.3 : 1
        }}
      >
        {uploading ? (
          <span style={{ fontSize: "16px" }}>⏳</span>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        )}
      </button>

      {/* Dropdown menu */}
      {showMenu && (
        <div style={{
          position: "absolute",
          bottom: "100%",
          left: "0",
          marginBottom: "8px",
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          minWidth: "220px",
          zIndex: 1000,
          overflow: "hidden",
          border: "1px solid #e5e7eb"
        }}>
          {/* Upload from device */}
          <button
            onClick={() => {
              if (isUploadRestricted) {
                alert(isGuest
                  ? "File uploads are available when you create an account. Sign up to share images and documents!"
                  : "File uploads are available with Plus or Pro subscription. Upgrade to express yourself better!");
                setShowMenu(false);
              } else {
                fileInputRef.current?.click();
              }
            }}
            style={{
              width: "100%",
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              background: "none",
              border: "none",
              cursor: isUploadRestricted ? "not-allowed" : "pointer",
              fontSize: "15px",
              color: isUploadRestricted ? "#9ca3af" : "#000",
              transition: "background 0.2s",
              textAlign: "left",
              opacity: isUploadRestricted ? 0.6 : 1
            }}
            onMouseEnter={(e) => !isUploadRestricted && (e.currentTarget.style.background = "#f3f4f6")}
            onMouseLeave={(e) => e.currentTarget.style.background = "none"}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <span style={{ flex: 1 }}>Upload from Device</span>
            {isUploadRestricted && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            )}
          </button>

          {/* Divider */}
          <div style={{
            height: "1px",
            background: "#e5e7eb",
            margin: "0 8px"
          }} />

          {/* Import from Telegram */}
          <button
            onClick={() => {
              if (isTelegramRestricted) {
                alert(isGuest
                  ? "Telegram import is available when you create an account. Sign up to import your conversations!"
                  : "Telegram import is available with Plus or Pro subscription. Upgrade to analyze your conversations!");
                setShowMenu(false);
              } else {
                handleTelegramClick();
              }
            }}
            style={{
              width: "100%",
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              background: "none",
              border: "none",
              cursor: isTelegramRestricted ? "not-allowed" : "pointer",
              fontSize: "15px",
              color: isTelegramRestricted ? "#9ca3af" : "#0088CC",
              transition: "background 0.2s",
              textAlign: "left",
              opacity: isTelegramRestricted ? 0.6 : 1
            }}
            onMouseEnter={(e) => !isTelegramRestricted && (e.currentTarget.style.background = "#f0f9ff")}
            onMouseLeave={(e) => e.currentTarget.style.background = "none"}
          >
            {/* Telegram icon */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161l-1.563 7.359c-.117.541-.428.676-.864.421l-2.39-1.76-1.151 1.107c-.128.128-.236.236-.485.236l.173-2.447 4.476-4.047c.195-.173-.043-.27-.301-.098l-5.533 3.484-2.386-.747c-.521-.162-.531-.521.109-.771l9.338-3.605c.436-.162.817.098.677.768z"/>
            </svg>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: "600" }}>Import from Telegram</div>
              <div style={{ fontSize: "12px", color: "#8A8A8F", marginTop: "2px" }}>
                Browse your chats
              </div>
            </div>
            {isTelegramRestricted && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            )}
          </button>

          {/* Future: More import options can be added here */}
        </div>
      )}
    </div>
  );
}
