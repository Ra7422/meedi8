import React from "react";
import TelegramConnect from "../pages/TelegramConnect";

/**
 * TelegramImportModal - Modal wrapper for TelegramConnect page
 * 
 * This wraps the complete TelegramConnect functionality in a modal overlay,
 * maintaining all features: folders, lazy loading, message preview, etc.
 * 
 * Props:
 * - isOpen: boolean - Controls modal visibility
 * - onClose: function - Callback when modal is closed
 * - onImportComplete: function - Callback when download completes (optional)
 * - roomId: number - The room/context to import into (optional)
 */
export default function TelegramImportModal({ isOpen, onClose, onImportComplete, roomId }) {
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
        background: "#F5F7FA",
        borderRadius: "16px",
        maxWidth: "400px",
        width: "100%",
        maxHeight: "80vh",
        overflow: "auto",
        position: "relative",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)"
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "white",
            border: "2px solid #e5e7eb",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
            cursor: "pointer",
            color: "#8A8A8F",
            zIndex: 10,
            transition: "all 0.2s",
            fontWeight: "300",
            lineHeight: 1
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

        {/* Embed the complete TelegramConnect page */}
        <div style={{ padding: "12px" }}>
          <TelegramConnect
            isModal={true}
            onComplete={() => {
              if (onImportComplete) {
                onImportComplete();
              }
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}
