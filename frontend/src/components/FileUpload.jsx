import React, { useRef } from "react";

export default function FileUpload({ onFileSelect, disabled = false }) {
  const fileInputRef = useRef(null);

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0 && onFileSelect) {
      onFileSelect(files);
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx,.txt"
        multiple
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      <button
        onClick={handleClick}
        disabled={disabled}
        style={{
          padding: "12px",
          background: disabled ? "#e5e7eb" : "#6b7280",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: disabled ? "not-allowed" : "pointer",
          fontSize: "20px",
          minHeight: "48px",
          minWidth: "48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: disabled ? 0.5 : 1
        }}
        title="Upload evidence (images, documents)"
      >
        📎
      </button>
    </>
  );
}
