import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api/client";

export default function SubscriptionSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const subscriptionId = searchParams.get("subscription_id");
  const paymentIntentId = searchParams.get("payment_intent");
  const { token, setToken } = useAuth();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);

  useEffect(() => {
    // If not authenticated and we have a session/subscription ID, try to auto-login
    const attemptAutoLogin = async () => {
      if (!token && !autoLoginAttempted && (sessionId || subscriptionId || paymentIntentId)) {
        setAutoLoginAttempted(true);

        try {
          // Retry logic - webhook may take a few seconds to process
          let attempts = 0;
          const maxAttempts = 5;
          let response = null;

          while (attempts < maxAttempts) {
            attempts++;
            // Wait before each attempt (2s, 3s, 4s, 5s, 6s)
            await new Promise(resolve => setTimeout(resolve, 1000 + attempts * 1000));

            try {
              response = await apiRequest(
                "/auth/stripe-session-login",
                "POST",
                {
                  session_id: sessionId,
                  subscription_id: subscriptionId,
                  payment_intent_id: paymentIntentId
                }
              );

              if (response.access_token) {
                // Auto-login the user by setting the token directly
                setToken(response.access_token);
                console.log(`✅ Auto-logged in user after payment (attempt ${attempts})`);
                break;
              }
            } catch (error) {
              console.log(`Auto-login attempt ${attempts}/${maxAttempts} failed:`, error.message);
              if (attempts >= maxAttempts) {
                throw error;
              }
              // Continue to next attempt
            }
          }
        } catch (error) {
          console.error("Auto-login failed after all attempts:", error);
          // User will see the manual login option
        }
      }

      setCheckingAuth(false);
    };

    attemptAutoLogin();
  }, [token, sessionId, subscriptionId, paymentIntentId, autoLoginAttempted, setToken]);

  useEffect(() => {
    // If authenticated, auto-redirect after 5 seconds
    if (token && !checkingAuth) {
      const timer = setTimeout(() => {
        navigate("/");
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [navigate, token, checkingAuth]);

  // Show loading state while attempting auto-login
  if (checkingAuth) {
    return (
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "80px 20px", textAlign: "center", fontFamily: "'Nunito', sans-serif" }}>
        <div style={{ fontSize: "80px", marginBottom: "24px" }}>🎉</div>
        <h1 style={{ fontSize: "36px", marginBottom: "16px", color: "#7DD3C0" }}>
          Payment Successful!
        </h1>
        <p style={{ fontSize: "18px", color: "#6b7280", marginBottom: "32px" }}>
          Setting up your account...
        </p>
        <div style={{
          width: "40px",
          height: "40px",
          border: "4px solid #E5E7EB",
          borderTop: "4px solid #7DD3C0",
          borderRadius: "50%",
          margin: "0 auto",
          animation: "spin 1s linear infinite"
        }}></div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // If user is not authenticated after attempts, show auth prompt
  if (!token && !checkingAuth) {
    return (
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "80px 20px", textAlign: "center", fontFamily: "'Nunito', sans-serif" }}>
        <div style={{ fontSize: "80px", marginBottom: "24px" }}>🎉</div>

        <h1 style={{ fontSize: "36px", marginBottom: "16px", color: "#7DD3C0" }}>
          Payment Successful!
        </h1>

        <p style={{ fontSize: "18px", color: "#6b7280", marginBottom: "32px" }}>
          Your subscription is ready. Sign in to start using premium features.
        </p>

        <div style={{
          background: "#E8F9F5",
          border: "2px solid #7DD3C0",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "32px"
        }}>
          <h3 style={{ marginTop: 0, color: "#1F7A5C" }}>Sign in to access your subscription</h3>
          <p style={{ color: "#2D9F7C", marginBottom: "16px" }}>
            Use the same email you provided during checkout.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => navigate("/login")}
            style={{
              padding: "16px 32px",
              background: "#7DD3C0",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: "700",
              cursor: "pointer",
              fontFamily: "'Nunito', sans-serif",
              boxShadow: "0 4px 12px rgba(125, 211, 192, 0.3)"
            }}
          >
            Sign In Now →
          </button>
        </div>

        <p style={{ marginTop: "24px", fontSize: "14px", color: "#9ca3af" }}>
          Sign in with Google, Facebook, or Telegram using the same email.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "80px 20px", textAlign: "center", fontFamily: "'Nunito', sans-serif" }}>
      <div style={{ fontSize: "80px", marginBottom: "24px" }}>🎉</div>

      <h1 style={{ fontSize: "36px", marginBottom: "16px", color: "#7DD3C0", fontWeight: "700" }}>
        Welcome to Meedi8!
      </h1>

      <p style={{ fontSize: "18px", color: "#6b7280", marginBottom: "32px" }}>
        Your subscription is now active. Enjoy unlimited voice recording and premium features!
      </p>

      <div style={{
        background: "#E8F9F5",
        border: "2px solid #7DD3C0",
        borderRadius: "12px",
        padding: "24px",
        marginBottom: "32px"
      }}>
        <h3 style={{ marginTop: 0, color: "#1F7A5C", fontWeight: "700" }}>What's included:</h3>
        <ul style={{ textAlign: "left", color: "#2D9F7C", lineHeight: "1.8", paddingLeft: "20px" }}>
          <li>Unlimited voice recording & transcription</li>
          <li>Unlimited text-based mediation</li>
          <li>File uploads and evidence sharing</li>
          <li>Priority support</li>
        </ul>
      </div>

      <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
        <button
          onClick={() => navigate("/")}
          style={{
            padding: "16px 32px",
            background: "#7DD3C0",
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontSize: "16px",
            fontWeight: "700",
            cursor: "pointer",
            fontFamily: "'Nunito', sans-serif",
            boxShadow: "0 4px 12px rgba(125, 211, 192, 0.3)"
          }}
        >
          Start Using Premium Features →
        </button>
        <button
          onClick={() => navigate("/subscription")}
          style={{
            padding: "16px 32px",
            background: "white",
            color: "#6750A4",
            border: "2px solid #6750A4",
            borderRadius: "12px",
            fontSize: "16px",
            fontWeight: "700",
            cursor: "pointer",
            fontFamily: "'Nunito', sans-serif"
          }}
        >
          Manage Subscription
        </button>
      </div>

      <p style={{ marginTop: "32px", fontSize: "14px", color: "#9ca3af" }}>
        Redirecting to home in 5 seconds...
      </p>
    </div>
  );
}
