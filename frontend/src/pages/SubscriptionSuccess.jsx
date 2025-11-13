import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function SubscriptionSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { token } = useAuth();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const timer = setTimeout(() => {
      setCheckingAuth(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // If authenticated, auto-redirect after 5 seconds
    if (token && !checkingAuth) {
      const timer = setTimeout(() => {
        navigate("/rooms");
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [navigate, token, checkingAuth]);

  // If user is not authenticated, show auth prompt
  if (!token && !checkingAuth) {
    return (
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "80px 20px", textAlign: "center" }}>
        <div style={{ fontSize: "80px", marginBottom: "24px" }}>🎉</div>

        <h1 style={{ fontSize: "36px", marginBottom: "16px", color: "#10b981" }}>
          Payment Successful!
        </h1>

        <p style={{ fontSize: "18px", color: "#6b7280", marginBottom: "32px" }}>
          Your subscription is ready. Complete your account to start using Meedi8.
        </p>

        <div style={{
          background: "#f0fdf4",
          border: "2px solid #10b981",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "32px"
        }}>
          <h3 style={{ marginTop: 0, color: "#065f46" }}>Next Step: Create Your Account</h3>
          <p style={{ color: "#047857", marginBottom: "16px" }}>
            We've created your account with the email you provided during checkout.
            Sign in to access your subscription.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => navigate("/login")}
            style={{
              padding: "16px 32px",
              background: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            Sign In Now →
          </button>
        </div>

        <p style={{ marginTop: "24px", fontSize: "14px", color: "#9ca3af" }}>
          Use the email you provided during checkout to sign in with Google or Facebook.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "80px 20px", textAlign: "center" }}>
      <div style={{ fontSize: "80px", marginBottom: "24px" }}>🎉</div>

      <h1 style={{ fontSize: "36px", marginBottom: "16px", color: "#10b981" }}>
        Welcome to Meedi8 Plus!
      </h1>

      <p style={{ fontSize: "18px", color: "#6b7280", marginBottom: "32px" }}>
        Your subscription is now active. You can now use unlimited voice recording in your mediation sessions.
      </p>

      <div style={{
        background: "#f0fdf4",
        border: "2px solid #10b981",
        borderRadius: "12px",
        padding: "24px",
        marginBottom: "32px"
      }}>
        <h3 style={{ marginTop: 0, color: "#065f46" }}>What's included:</h3>
        <ul style={{ textAlign: "left", color: "#047857", lineHeight: "1.8" }}>
          <li>✅ Unlimited voice recording & transcription</li>
          <li>✅ All text-based mediation features</li>
          <li>✅ Download conversation transcripts</li>
          <li>✅ Email support</li>
        </ul>
      </div>

      <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
        <button
          onClick={() => navigate("/rooms")}
          style={{
            padding: "16px 32px",
            background: "#10b981",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          Start Using Voice Features →
        </button>
        <button
          onClick={() => navigate("/subscription")}
          style={{
            padding: "16px 32px",
            background: "#f3f4f6",
            color: "#374151",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          Manage Subscription
        </button>
      </div>

      <p style={{ marginTop: "32px", fontSize: "14px", color: "#9ca3af" }}>
        Redirecting to your rooms in 5 seconds...
      </p>
    </div>
  );
}
