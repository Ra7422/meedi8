import React, { useState, useEffect } from "react";
import { apiRequest } from "../api/client";

/**
 * Telegram QR Login Modal - For authentication on login/signup page
 *
 * Features:
 * - QR code display for Telegram app scanning
 * - Auto-polling for scan status
 * - 2FA password support
 * - Phone number fallback option
 * - Auto-refresh expired QR codes
 */
export default function TelegramQRLoginModal({ isOpen, onClose, onLoginSuccess }) {
  // Step state
  const [step, setStep] = useState(0); // 0: QR code

  // QR login state
  const [qrCode, setQrCode] = useState(null);
  const [qrLoginId, setQrLoginId] = useState(null);
  const [qrStatus, setQrStatus] = useState(null);
  const [qr2FAPassword, setQr2FAPassword] = useState("");
  const [qrCountdown, setQrCountdown] = useState(30);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setQrCode(null);
      setQrLoginId(null);
      setQrStatus(null);
      setQr2FAPassword("");
      setQrCountdown(30);
      setError("");
      // Auto-initiate QR login
      handleInitiateQRLogin();
    }
  }, [isOpen]);

  // Poll QR login status
  useEffect(() => {
    if (qrLoginId && step === 0 && qrStatus !== 'success' && qrStatus !== '2fa_required') {
      const interval = setInterval(async () => {
        try {
          const response = await apiRequest(`/auth/telegram-qr/status/${qrLoginId}`, "GET");
          setQrStatus(response.status);

          if (response.status === 'success') {
            // QR scan successful, finalize login
            handleFinalizeLogin();
          } else if (response.status === 'expired') {
            setQrCountdown(0);
          }
        } catch (err) {
          console.error("Failed to check QR status:", err);
        }
      }, 2500);

      return () => clearInterval(interval);
    }
  }, [qrLoginId, qrStatus, step]);

  // Countdown timer for QR code
  useEffect(() => {
    if (qrCode && qrCountdown > 0 && step === 0) {
      const timer = setTimeout(() => {
        setQrCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [qrCode, qrCountdown, step]);

  const handleInitiateQRLogin = async () => {
    setLoading(true);
    setError("");
    setQrStatus(null);

    try {
      const response = await apiRequest("/auth/telegram-qr/initiate", "POST");
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
        // Try to refresh the existing QR code first
        try {
          const response = await apiRequest(`/auth/telegram-qr/refresh/${qrLoginId}`, "POST");
          setQrCode(response.qr_code);
          setQrLoginId(response.login_id);
          setQrCountdown(30);
          setLoading(false);
          return;
        } catch (e) {
          // If refresh fails, fall back to creating new
        }
      }

      // Create new QR login session
      const response = await apiRequest("/auth/telegram-qr/initiate", "POST");
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
      await apiRequest(`/auth/telegram-qr/2fa/${qrLoginId}`, "POST", {
        password: qr2FAPassword
      });

      // 2FA complete, finalize login
      handleFinalizeLogin();
    } catch (err) {
      setError(err.message || "Invalid 2FA password");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeLogin = async () => {
    setLoading(true);
    setError("");

    try {
      // Call the new auth endpoint to get JWT token
      const response = await apiRequest("/auth/telegram-qr", "POST");

      // Pass the access token back to parent
      if (onLoginSuccess) {
        onLoginSuccess(response);
      }
    } catch (err) {
      setError(err.message || "Failed to complete login");
    } finally {
      setLoading(false);
    }
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
        {step === 0 && !loading && qrStatus !== '2fa_required' && (
          <button
            onClick={handleRefreshQR}
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
                    Sign in with Telegram
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

                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
