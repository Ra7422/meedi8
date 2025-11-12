import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api/client";

export default function Subscription() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isWideScreen, setIsWideScreen] = useState(
    typeof window !== 'undefined' ? window.innerWidth > 900 : true
  );

  useEffect(() => {
    loadSubscription();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setIsWideScreen(window.innerWidth > 900);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadSubscription = async () => {
    // Only load subscription if user is authenticated
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const data = await apiRequest("/subscriptions/status", "GET", null, token);
      setSubscription(data);
    } catch (error) {
      console.error("Failed to load subscription:", error);
    }
    setLoading(false);
  };

  const handleUpgrade = async (tier, interval) => {
    // If not authenticated, redirect to signup
    if (!token) {
      sessionStorage.setItem('postLoginRedirect', '/subscription');
      navigate('/signup');
      return;
    }

    setProcessing(true);
    try {
      const response = await apiRequest(
        "/subscriptions/create-checkout",
        "POST",
        { tier, interval },
        token
      );
      // Redirect to Stripe Checkout
      window.location.href = response.checkout_url;
    } catch (error) {
      alert("Failed to start checkout: " + error.message);
      setProcessing(false);
    }
  };

  const handleManageSubscription = async () => {
    setProcessing(true);
    try {
      const response = await apiRequest(
        "/subscriptions/create-portal",
        "POST",
        {},
        token
      );
      // Redirect to Stripe Customer Portal
      window.location.href = response.portal_url;
    } catch (error) {
      alert("Failed to open subscription portal: " + error.message);
      setProcessing(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "60px", fontFamily: "'Nunito', sans-serif" }}>Loading...</div>;
  }

  const currentTier = subscription?.tier || "free";
  const isActive = subscription?.status === "active" || subscription?.status === "trial";

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      background: 'linear-gradient(180deg, #EAF7F0 0%, #ffffff 100%)',
      overflow: 'hidden',
      fontFamily: "'Nunito', sans-serif",
    }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 20px", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ marginBottom: "40px", textAlign: "center" }}>
          <h1 style={{
            fontSize: "clamp(36px, 7vw, 48px)",
            marginBottom: "12px",
            fontFamily: "'Nunito', sans-serif",
            color: "#7DD3C0",
            fontWeight: "700"
          }}>Pricing</h1>
          <p style={{
            color: "#6B7280",
            fontSize: "clamp(16px, 3vw, 18px)",
            fontFamily: "'Nunito', sans-serif",
            lineHeight: "1.6"
          }}>
            Choose the plan that works best for you
          </p>
        </div>

      {/* Current Plan Status */}
      {currentTier !== "free" && (
        <div style={{
          background: "#E8F9F5",
          border: "2px solid #7DD3C0",
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "32px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.06)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <div style={{
                fontWeight: "700",
                fontSize: "20px",
                color: "#1F7A5C",
                marginBottom: "4px",
                fontFamily: "'Nunito', sans-serif"
              }}>
                ✅ Current Plan: {currentTier === "plus" ? "Plus" : "Pro"}
              </div>
              <div style={{
                fontSize: "15px",
                color: "#2D9F7C",
                fontFamily: "'Nunito', sans-serif"
              }}>
                Status: {subscription.status}
              </div>
            </div>
            <button
              onClick={handleManageSubscription}
              disabled={processing}
              style={{
                padding: "12px 24px",
                background: "white",
                border: "2px solid #7DD3C0",
                borderRadius: "12px",
                color: "#1F7A5C",
                fontWeight: "600",
                fontFamily: "'Nunito', sans-serif",
                cursor: processing ? "not-allowed" : "pointer",
                transition: "all 0.2s"
              }}
            >
              Manage Subscription
            </button>
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isWideScreen ? "repeat(3, 1fr)" : "1fr",
        gap: "24px",
        maxWidth: "100%"
      }}>

        {/* Free Tier */}
        <div style={{
          border: currentTier === "free" ? "3px solid #7DD3C0" : "2px solid #E5E7EB",
          borderRadius: "20px",
          padding: "32px",
          background: "white",
          transition: "all 0.3s ease",
          boxShadow: currentTier === "free" ? "0 8px 24px rgba(125, 211, 192, 0.2)" : "0 4px 12px rgba(0,0,0,0.08)"
        }}>
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{
              fontSize: "28px",
              marginBottom: "8px",
              fontFamily: "'Nunito', sans-serif",
              fontWeight: "700",
              color: "#6750A4"
            }}>Free</h3>
            <div style={{
              fontSize: "40px",
              fontWeight: "700",
              marginBottom: "8px",
              color: "#7DD3C0",
              fontFamily: "'Nunito', sans-serif"
            }}>
              £0<span style={{ fontSize: "18px", fontWeight: "400", color: "#6B7280" }}>/month</span>
            </div>
            <p style={{
              color: "#888",
              fontSize: "15px",
              fontFamily: "'Nunito', sans-serif"
            }}>Perfect for trying out Meedi</p>
          </div>

          <ul style={{
            listStyle: "none",
            padding: 0,
            marginBottom: "24px",
            fontFamily: "'Nunito', sans-serif"
          }}>
            <li style={{ marginBottom: "12px", display: "flex", gap: "12px", alignItems: "start", color: "#6750A4", fontSize: "15px" }}>
              <span style={{ fontSize: "18px" }}>✅</span>
              <span>Text-based mediation</span>
            </li>
            <li style={{ marginBottom: "12px", display: "flex", gap: "12px", alignItems: "start", color: "#6750A4", fontSize: "15px" }}>
              <span style={{ fontSize: "18px" }}>✅</span>
              <span>1 trial voice conversation</span>
            </li>
            <li style={{ marginBottom: "12px", display: "flex", gap: "12px", alignItems: "start", color: "#6750A4", fontSize: "15px" }}>
              <span style={{ fontSize: "18px" }}>✅</span>
              <span>Download transcripts</span>
            </li>
          </ul>

          {currentTier === "free" && (
            <div style={{
              padding: "14px",
              background: "#E8F9F5",
              borderRadius: "12px",
              textAlign: "center",
              fontWeight: "700",
              color: "#1F7A5C",
              fontFamily: "'Nunito', sans-serif",
              fontSize: "16px"
            }}>
              Current Plan
            </div>
          )}
        </div>

        {/* Plus Tier */}
        <div style={{
          border: currentTier === "plus" ? "3px solid #7C6CB6" : "2px solid #E5E7EB",
          borderRadius: "20px",
          padding: "32px",
          background: "white",
          position: "relative",
          transition: "all 0.3s ease",
          boxShadow: currentTier === "plus" ? "0 8px 24px rgba(124, 108, 182, 0.2)" : "0 4px 12px rgba(0,0,0,0.08)"
        }}>
          <div style={{
            position: "absolute",
            top: "-14px",
            right: "24px",
            background: "#7DD3C0",
            color: "white",
            padding: "6px 16px",
            borderRadius: "12px",
            fontSize: "13px",
            fontWeight: "700",
            fontFamily: "'Nunito', sans-serif",
            boxShadow: "0 2px 8px rgba(125, 211, 192, 0.3)"
          }}>
            POPULAR
          </div>

          <div style={{ marginBottom: "24px" }}>
            <h3 style={{
              fontSize: "28px",
              marginBottom: "8px",
              fontFamily: "'Nunito', sans-serif",
              fontWeight: "700",
              color: "#6750A4"
            }}>Plus</h3>
            <div style={{
              fontSize: "40px",
              fontWeight: "700",
              marginBottom: "8px",
              color: "#7C6CB6",
              fontFamily: "'Nunito', sans-serif"
            }}>
              £9.99<span style={{ fontSize: "18px", fontWeight: "400", color: "#6B7280" }}>/month</span>
            </div>
            <p style={{
              color: "#888",
              fontSize: "15px",
              fontFamily: "'Nunito', sans-serif"
            }}>For natural voice conversations</p>
          </div>

          <ul style={{
            listStyle: "none",
            padding: 0,
            marginBottom: "24px",
            fontFamily: "'Nunito', sans-serif"
          }}>
            <li style={{ marginBottom: "12px", display: "flex", gap: "12px", alignItems: "start", color: "#6750A4", fontSize: "15px" }}>
              <span style={{ fontSize: "18px" }}>✅</span>
              <span><strong>Everything in Free</strong></span>
            </li>
            <li style={{ marginBottom: "12px", display: "flex", gap: "12px", alignItems: "start", color: "#6750A4", fontSize: "15px" }}>
              <span style={{ fontSize: "18px" }}>✅</span>
              <span><strong>Unlimited voice recording</strong></span>
            </li>
            <li style={{ marginBottom: "12px", display: "flex", gap: "12px", alignItems: "start", color: "#6750A4", fontSize: "15px" }}>
              <span style={{ fontSize: "18px" }}>✅</span>
              <span>Automatic transcription</span>
            </li>
            <li style={{ marginBottom: "12px", display: "flex", gap: "12px", alignItems: "start", color: "#6750A4", fontSize: "15px" }}>
              <span style={{ fontSize: "18px" }}>✅</span>
              <span>Email support</span>
            </li>
          </ul>

          {currentTier !== "plus" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                onClick={() => handleUpgrade("plus", "monthly")}
                disabled={processing}
                style={{
                  padding: "14px",
                  background: "#7C6CB6",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  fontWeight: "700",
                  fontFamily: "'Nunito', sans-serif",
                  cursor: processing ? "not-allowed" : "pointer",
                  fontSize: "16px",
                  transition: "all 0.2s",
                  boxShadow: "0 4px 12px rgba(124, 108, 182, 0.3)"
                }}
              >
                Get Plus Monthly
              </button>
              <button
                onClick={() => handleUpgrade("plus", "yearly")}
                disabled={processing}
                style={{
                  padding: "12px",
                  background: "#F3F4F6",
                  color: "#6750A4",
                  border: "2px solid #E5E7EB",
                  borderRadius: "12px",
                  fontWeight: "600",
                  fontFamily: "'Nunito', sans-serif",
                  cursor: processing ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  transition: "all 0.2s"
                }}
              >
                £99/year (Save 17%)
              </button>
            </div>
          ) : (
            <div style={{
              padding: "14px",
              background: "#EDE9FE",
              borderRadius: "12px",
              textAlign: "center",
              fontWeight: "700",
              color: "#5B21B6",
              fontFamily: "'Nunito', sans-serif",
              fontSize: "16px"
            }}>
              Current Plan
            </div>
          )}
        </div>

        {/* Pro Tier */}
        <div style={{
          border: currentTier === "pro" ? "3px solid #7DD3C0" : "2px solid #E5E7EB",
          borderRadius: "20px",
          padding: "32px",
          background: "white",
          transition: "all 0.3s ease",
          boxShadow: currentTier === "pro" ? "0 8px 24px rgba(125, 211, 192, 0.2)" : "0 4px 12px rgba(0,0,0,0.08)"
        }}>
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{
              fontSize: "28px",
              marginBottom: "8px",
              fontFamily: "'Nunito', sans-serif",
              fontWeight: "700",
              color: "#6750A4"
            }}>Pro</h3>
            <div style={{
              fontSize: "40px",
              fontWeight: "700",
              marginBottom: "8px",
              color: "#7DD3C0",
              fontFamily: "'Nunito', sans-serif"
            }}>
              £19.99<span style={{ fontSize: "18px", fontWeight: "400", color: "#6B7280" }}>/month</span>
            </div>
            <p style={{
              color: "#888",
              fontSize: "15px",
              fontFamily: "'Nunito', sans-serif"
            }}>Complete audio experience</p>
          </div>

          <ul style={{
            listStyle: "none",
            padding: 0,
            marginBottom: "24px",
            fontFamily: "'Nunito', sans-serif"
          }}>
            <li style={{ marginBottom: "12px", display: "flex", gap: "12px", alignItems: "start", color: "#6750A4", fontSize: "15px" }}>
              <span style={{ fontSize: "18px" }}>✅</span>
              <span><strong>Everything in Plus</strong></span>
            </li>
            <li style={{ marginBottom: "12px", display: "flex", gap: "12px", alignItems: "start", color: "#6750A4", fontSize: "15px" }}>
              <span style={{ fontSize: "18px" }}>✅</span>
              <span><strong>Meedi voice responses</strong></span>
            </li>
            <li style={{ marginBottom: "12px", display: "flex", gap: "12px", alignItems: "start", color: "#6750A4", fontSize: "15px" }}>
              <span style={{ fontSize: "18px" }}>✅</span>
              <span>Full audio conversations</span>
            </li>
            <li style={{ marginBottom: "12px", display: "flex", gap: "12px", alignItems: "start", color: "#6750A4", fontSize: "15px" }}>
              <span style={{ fontSize: "18px" }}>✅</span>
              <span>Priority support</span>
            </li>
            <li style={{ marginBottom: "12px", display: "flex", gap: "12px", alignItems: "start", color: "#6750A4", fontSize: "15px" }}>
              <span style={{ fontSize: "18px" }}>✅</span>
              <span>Advanced analytics</span>
            </li>
          </ul>

          {currentTier !== "pro" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                onClick={() => handleUpgrade("pro", "monthly")}
                disabled={processing}
                style={{
                  padding: "14px",
                  background: "#7DD3C0",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  fontWeight: "700",
                  fontFamily: "'Nunito', sans-serif",
                  cursor: processing ? "not-allowed" : "pointer",
                  fontSize: "16px",
                  transition: "all 0.2s",
                  boxShadow: "0 4px 12px rgba(125, 211, 192, 0.3)"
                }}
              >
                Get Pro Monthly
              </button>
              <button
                onClick={() => handleUpgrade("pro", "yearly")}
                disabled={processing}
                style={{
                  padding: "12px",
                  background: "#F3F4F6",
                  color: "#6750A4",
                  border: "2px solid #E5E7EB",
                  borderRadius: "12px",
                  fontWeight: "600",
                  fontFamily: "'Nunito', sans-serif",
                  cursor: processing ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  transition: "all 0.2s"
                }}
              >
                £199/year (Save 17%)
              </button>
            </div>
          ) : (
            <div style={{
              padding: "14px",
              background: "#E8F9F5",
              borderRadius: "12px",
              textAlign: "center",
              fontWeight: "700",
              color: "#1F7A5C",
              fontFamily: "'Nunito', sans-serif",
              fontSize: "16px"
            }}>
              Current Plan
            </div>
          )}
        </div>
      </div>

        {/* Back Button */}
        <div style={{ marginTop: "40px", textAlign: "center" }}>
          <button
            onClick={() => navigate("/profile")}
            style={{
              padding: "14px 36px",
              background: "#F3F4F6",
              border: "2px solid #D3C1FF",
              borderRadius: "12px",
              fontWeight: "600",
              fontFamily: "'Nunito', sans-serif",
              cursor: "pointer",
              fontSize: "16px",
              color: "#6750A4",
              transition: "all 0.2s"
            }}
          >
            ← Back to Profile
          </button>
        </div>
      </div>
    </div>
  );
}
