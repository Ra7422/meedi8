import React, { useState, useEffect } from "react";
import { apiRequest } from "../api/client";

// Common country codes
const COUNTRY_CODES = [
  { code: "+1", country: "US/CA" },
  { code: "+44", country: "UK" },
  { code: "+91", country: "IN" },
  { code: "+61", country: "AU" },
  { code: "+49", country: "DE" },
  { code: "+33", country: "FR" },
  { code: "+39", country: "IT" },
  { code: "+34", country: "ES" },
  { code: "+31", country: "NL" },
  { code: "+46", country: "SE" },
  { code: "+47", country: "NO" },
  { code: "+45", country: "DK" },
  { code: "+358", country: "FI" },
  { code: "+48", country: "PL" },
  { code: "+7", country: "RU" },
  { code: "+86", country: "CN" },
  { code: "+81", country: "JP" },
  { code: "+82", country: "KR" },
  { code: "+65", country: "SG" },
  { code: "+60", country: "MY" },
  { code: "+66", country: "TH" },
  { code: "+84", country: "VN" },
  { code: "+62", country: "ID" },
  { code: "+63", country: "PH" },
  { code: "+55", country: "BR" },
  { code: "+52", country: "MX" },
  { code: "+54", country: "AR" },
  { code: "+27", country: "ZA" },
  { code: "+971", country: "UAE" },
  { code: "+972", country: "IL" },
];

/**
 * Telegram QR Login Modal - For authentication on login/signup page
 *
 * Features:
 * - QR code display for Telegram app scanning
 * - Auto-polling for scan status
 * - 2FA password support
 * - Phone number fallback with country code selector
 * - Auto-refresh expired QR codes
 */
export default function TelegramQRLoginModal({ isOpen, onClose, onLoginSuccess }) {
  // Step state: 0 = QR code, 1 = phone verification code
  const [step, setStep] = useState(0);

  // QR login state
  const [qrCode, setQrCode] = useState(null);
  const [qrLoginId, setQrLoginId] = useState(null);
  const [qrStatus, setQrStatus] = useState(null);
  const [qr2FAPassword, setQr2FAPassword] = useState("");
  const [qrCountdown, setQrCountdown] = useState(30);

  // Phone login state
  const [countryCode, setCountryCode] = useState("+44");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [phoneCodeHash, setPhoneCodeHash] = useState("");
  const [phone2FAPassword, setPhone2FAPassword] = useState("");
  const [needsPhone2FA, setNeedsPhone2FA] = useState(false);

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
      setPhoneNumber("");
      setVerificationCode("");
      setPhoneCodeHash("");
      setPhone2FAPassword("");
      setNeedsPhone2FA(false);
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

      handleFinalizeLogin();
    } catch (err) {
      setError(err.message || "Invalid 2FA password");
    } finally {
      setLoading(false);
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
      const fullPhone = `${countryCode}${phoneNumber.replace(/\D/g, '')}`;
      const response = await apiRequest("/auth/telegram-phone/connect", "POST", {
        phone_number: fullPhone
      });

      setPhoneCodeHash(response.phone_code_hash);
      setStep(1);
    } catch (err) {
      setError(err.message || "Failed to send verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setError("Please enter the verification code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const fullPhone = `${countryCode}${phoneNumber.replace(/\D/g, '')}`;
      const response = await apiRequest("/auth/telegram-phone/verify", "POST", {
        phone_number: fullPhone,
        code: verificationCode,
        phone_code_hash: phoneCodeHash,
        password: needsPhone2FA ? phone2FAPassword : undefined
      });

      if (!response.success && response.needs_password) {
        setNeedsPhone2FA(true);
        setError("Two-factor authentication required");
        setLoading(false);
        return;
      }

      // Verification complete, finalize login
      handleFinalizeLogin();
    } catch (err) {
      if (err.message?.includes("2FA") || err.message?.includes("password")) {
        setNeedsPhone2FA(true);
        setError("Two-factor authentication required");
      } else {
        setError(err.message || "Invalid verification code");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest("/auth/telegram-qr", "POST");

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

                  {/* Phone Number Input with Country Code */}
                  <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      disabled={loading}
                      style={{
                        padding: "10px 8px",
                        fontSize: "13px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                        outline: "none",
                        background: "white",
                        cursor: "pointer",
                        minWidth: "90px"
                      }}
                    >
                      {COUNTRY_CODES.map(({ code, country }) => (
                        <option key={code} value={code}>
                          {code} {country}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Phone number"
                      disabled={loading}
                      style={{
                        flex: 1,
                        padding: "10px",
                        fontSize: "13px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                      onFocus={(e) => e.target.style.borderColor = "#0088CC"}
                      onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
                      onKeyDown={(e) => e.key === "Enter" && handleSendCode()}
                    />
                  </div>
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

          {/* Step 1: Verification Code */}
          {step === 1 && (
            <div>
              <h3 style={{ fontSize: "14px", fontWeight: "600", margin: "0 0 12px 0" }}>
                Enter Verification Code
              </h3>
              <p style={{ fontSize: "11px", color: "#6b7280", margin: "0 0 12px 0" }}>
                We sent a code to {countryCode}{phoneNumber}
              </p>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter code"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "10px",
                  fontSize: "13px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  marginBottom: "10px",
                  outline: "none",
                  boxSizing: "border-box",
                  textAlign: "center",
                  letterSpacing: "4px"
                }}
                onFocus={(e) => e.target.style.borderColor = "#0088CC"}
                onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyCode()}
              />
              {needsPhone2FA && (
                <input
                  type="password"
                  value={phone2FAPassword}
                  onChange={(e) => setPhone2FAPassword(e.target.value)}
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
                disabled={loading || !verificationCode.trim() || (needsPhone2FA && !phone2FAPassword.trim())}
                style={{
                  width: "100%",
                  padding: "10px",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "white",
                  background: loading || !verificationCode.trim() ? "#d1d5db" : "#0088CC",
                  border: "none",
                  borderRadius: "6px",
                  cursor: loading || !verificationCode.trim() ? "not-allowed" : "pointer"
                }}
              >
                {loading ? "Verifying..." : "Verify"}
              </button>
              <button
                onClick={() => {
                  setStep(0);
                  setVerificationCode("");
                  setNeedsPhone2FA(false);
                  setPhone2FAPassword("");
                  setError("");
                }}
                style={{
                  width: "100%",
                  padding: "8px",
                  fontSize: "12px",
                  color: "#6b7280",
                  background: "transparent",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  marginTop: "8px"
                }}
              >
                Back to QR code
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
