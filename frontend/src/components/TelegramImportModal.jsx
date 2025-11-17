import React from "react";
import TelegramImportModalCompact from "./TelegramImportModalCompact";

/**
 * TelegramImportModal - Optimized compact modal for Telegram import
 *
 * Features:
 * - Icon-based UI (calendar icon instead of "Date" text)
 * - Compact button ratios optimized for 400px width
 * - Fixed download progress indicator (always visible)
 * - "View in Chat" button after download completes
 * - Minimal padding and optimized spacing
 *
 * Props:
 * - isOpen: boolean - Controls modal visibility
 * - onClose: function - Callback when modal is closed
 * - onImportComplete: function - Callback when download completes (receives downloaded messages)
 * - roomId: number - The room/context to import into (optional)
 */
export default function TelegramImportModal({ isOpen, onClose, onImportComplete, roomId }) {
  return (
    <TelegramImportModalCompact
      isOpen={isOpen}
      onClose={onClose}
      onImportComplete={onImportComplete}
      roomId={roomId}
    />
  );
}
