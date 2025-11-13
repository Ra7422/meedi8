import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api/client";
import EmbeddedCheckout from "../components/EmbeddedCheckout";
import { GoogleLogin } from '@react-oauth/google';
import FacebookLogin from '@greatsumini/react-facebook-login';

export default function Subscription() {
  const { token, googleLogin, facebookLogin } = useAuth();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [billingInterval, setBillingInterval] = useState('monthly');
  const [isWideScreen, setIsWideScreen] = useState(
    typeof window !== 'undefined' ? window.innerWidth > 900 : true
  );
  const [checkoutSession, setCheckoutSession] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingPurchase, setPendingPurchase] = useState(null);

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
    // If not authenticated, show auth modal instead of redirecting
    if (!token) {
      setPendingPurchase({ tier, interval });
      setShowAuthModal(true);
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
      // Set checkout session to trigger embedded checkout modal
      setCheckoutSession({
        clientSecret: response.client_secret,
        sessionId: response.session_id,
        tier,
        interval
      });
    } catch (error) {
      alert("Failed to start checkout: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleAuthSuccess = async (authToken) => {
    // Close auth modal
    setShowAuthModal(false);

    // Wait a moment for token to be set in context
    await new Promise(resolve => setTimeout(resolve, 500));

    // Proceed with the pending purchase
    if (pendingPurchase) {
      setProcessing(true);
      try {
        const response = await apiRequest(
          "/subscriptions/create-checkout",
          "POST",
          { tier: pendingPurchase.tier, interval: pendingPurchase.interval },
          authToken || token
        );
        setCheckoutSession({
          clientSecret: response.client_secret,
          sessionId: response.session_id,
          tier: pendingPurchase.tier,
          interval: pendingPurchase.interval
        });
        setPendingPurchase(null);
      } catch (error) {
        alert("Failed to start checkout: " + error.message);
      } finally {
        setProcessing(false);
      }
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const authToken = await googleLogin(credentialResponse.credential);
      await handleAuthSuccess(authToken);
    } catch (e) {
      alert("Google sign-in failed: " + (e.message || "Please try again"));
    }
  };

  const handleFacebookSuccess = async (response) => {
    try {
      const authToken = await facebookLogin(response.accessToken, response.userID);
      await handleAuthSuccess(authToken);
    } catch (e) {
      alert("Facebook sign-in failed: " + (e.message || "Please try again"));
    }
  };

  const handleCheckoutComplete = () => {
    // Redirect to success page
    navigate(`/subscription/success?session_id=${checkoutSession.sessionId}`);
  };

  const handleCloseCheckout = () => {
    setCheckoutSession(null);
    setProcessing(false);
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
            lineHeight: "1.6",
            marginBottom: "24px"
          }}>
            Choose the plan that works best for you
          </p>

          {/* Billing Toggle */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "16px",
            background: "white",
            padding: "8px",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            border: "2px solid #E5E7EB"
          }}>
            <button
              onClick={() => setBillingInterval('monthly')}
              style={{
                padding: "10px 24px",
                fontSize: "16px",
                fontWeight: "600",
                fontFamily: "'Nunito', sans-serif",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s",
                background: billingInterval === 'monthly' ? "#7DD3C0" : "transparent",
                color: billingInterval === 'monthly' ? "white" : "#6B7280"
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('yearly')}
              style={{
                padding: "10px 24px",
                fontSize: "16px",
                fontWeight: "600",
                fontFamily: "'Nunito', sans-serif",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s",
                background: billingInterval === 'yearly' ? "#7DD3C0" : "transparent",
                color: billingInterval === 'yearly' ? "white" : "#6B7280",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              Yearly
              <span style={{
                fontSize: "12px",
                fontWeight: "700",
                background: "#10B981",
                color: "white",
                padding: "2px 8px",
                borderRadius: "6px"
              }}>
                Save 17%
              </span>
            </button>
          </div>
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
            }}>FREE TIER</h3>
            <div style={{
              fontSize: "14px",
              fontWeight: "600",
              marginBottom: "12px",
              color: "#6B7280",
              fontFamily: "'Nunito', sans-serif"
            }}>Trial & Text Only</div>
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
            }}>Perfect for trying Meedi8</p>
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
              <span>Individual coaching with Meedi</span>
            </li>
            <li style={{ marginBottom: "12px", display: "flex", gap: "12px", alignItems: "start", color: "#6750A4", fontSize: "15px" }}>
              <span style={{ fontSize: "18px" }}>✅</span>
              <span>Basic conversation summary</span>
            </li>
            <li style={{ marginBottom: "12px", display: "flex", gap: "12px", alignItems: "start", color: "#6750A4", fontSize: "15px" }}>
              <span style={{ fontSize: "18px" }}>✅</span>
              <span>7-day access to transcript</span>
            </li>
            <li style={{ marginBottom: "12px", display: "flex", gap: "12px", alignItems: "start", color: "#6750A4", fontSize: "15px" }}>
              <span style={{ fontSize: "18px" }}>✅</span>
              <span>Email support</span>
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
              Start for FREE!
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
            }}>PLUS TIER</h3>
            <div style={{
              fontSize: "14px",
              fontWeight: "600",
              marginBottom: "12px",
              color: "#6B7280",
              fontFamily: "'Nunito', sans-serif"
            }}>Voice & Evidence</div>
            <div style={{
              fontSize: "40px",
              fontWeight: "700",
              marginBottom: "8px",
              color: "#7C6CB6",
              fontFamily: "'Nunito', sans-serif"
            }}>
              {billingInterval === 'monthly' ? '£9.99' : '£99'}
              <span style={{ fontSize: "18px", fontWeight: "400", color: "#6B7280" }}>
                /{billingInterval === 'monthly' ? 'month' : 'year'}
              </span>
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
              <span>Unlimited text mediations</span>
            </li>
            <li style={{ marginBottom: "12px", display: "flex", gap: "12px", alignItems: "start", color: "#6750A4", fontSize: "15px" }}>
              <span style={{ fontSize: "18px" }}>✅</span>
              <span><strong>Voice-enabled mediations</strong></span>
            </li>
            <li style={{ marginBottom: "12px", display: "flex", gap: "12px", alignItems: "start", color: "#6750A4", fontSize: "15px" }}>
              <span style={{ fontSize: "18px" }}>✅</span>
              <span>Upload evidence files (up to 10MB per session)</span>
            </li>
            <li style={{ marginBottom: "12px", display: "flex", gap: "12px", alignItems: "start", color: "#6750A4", fontSize: "15px" }}>
              <span style={{ fontSize: "18px" }}>✅</span>
              <span>Automatic transcription</span>
            </li>
            <li style={{ marginBottom: "12px", display: "flex", gap: "12px", alignItems: "start", color: "#6750A4", fontSize: "15px" }}>
              <span style={{ fontSize: "18px" }}>✅</span>
              <span>30-day transcript storage</span>
            </li>
            <li style={{ marginBottom: "12px", display: "flex", gap: "12px", alignItems: "start", color: "#6750A4", fontSize: "15px" }}>
              <span style={{ fontSize: "18px" }}>✅</span>
              <span>Download basic session summaries</span>
            </li>
            <li style={{ marginBottom: "12px", display: "flex", gap: "12px", alignItems: "start", color: "#6750A4", fontSize: "15px" }}>
              <span style={{ fontSize: "18px" }}>✅</span>
              <span>Priority email support</span>
            </li>
          </ul>

          {currentTier !== "plus" ? (
            <button
              onClick={() => handleUpgrade("plus", billingInterval)}
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
                boxShadow: "0 4px 12px rgba(124, 108, 182, 0.3)",
                width: "100%"
              }}
            >
              Get Plus
            </button>
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
            }}>PRO TIER</h3>
            <div style={{
              fontSize: "14px",
              fontWeight: "600",
              marginBottom: "12px",
              color: "#6B7280",
              fontFamily: "'Nunito', sans-serif"
            }}>Complete Professional Service</div>
            <div style={{
              fontSize: "40px",
              fontWeight: "700",
              marginBottom: "8px",
              color: "#7DD3C0",
              fontFamily: "'Nunito', sans-serif"
            }}>
              {billingInterval === 'monthly' ? '£19.99' : '£199'}
              <span style={{ fontSize: "18px", fontWeight: "400", color: "#6B7280" }}>
                /{billingInterval === 'monthly' ? 'month' : 'year'}
              </span>
            </div>
            <p style={{
              color: "#888",
              fontSize: "15px",
              fontFamily: "'Nunito', sans-serif"
            }}>Complete audio experience with professional insights</p>
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
              <span>Unlimited voice mediations</span>
            </li>
            <li style={{ marginBottom: "12px", display: "flex", gap: "12px", alignItems: "start", color: "#6750A4", fontSize: "15px" }}>
              <span style={{ fontSize: "18px" }}>✅</span>
              <span><strong>Meedi AI voice responses</strong> (two-way voice conversations)</span>
            </li>
            <li style={{ marginBottom: "12px", display: "flex", gap: "12px", alignItems: "start", color: "#6750A4", fontSize: "15px" }}>
              <span style={{ fontSize: "18px" }}>✅</span>
              <span>Upload evidence files (up to 50MB per session)</span>
            </li>
            <li style={{ marginBottom: "12px", display: "flex", gap: "12px", alignItems: "start", color: "#6750A4", fontSize: "15px" }}>
              <span style={{ fontSize: "18px" }}>✅</span>
              <span><strong>3 professional evaluation reports per month</strong> (additional reports £4.99 each)</span>
            </li>
            <li style={{ marginBottom: "12px", display: "flex", gap: "12px", alignItems: "start", color: "#6750A4", fontSize: "15px" }}>
              <span style={{ fontSize: "18px" }}>✅</span>
              <span>90-day transcript storage</span>
            </li>
            <li style={{ marginBottom: "12px", display: "flex", gap: "12px", alignItems: "start", color: "#6750A4", fontSize: "15px" }}>
              <span style={{ fontSize: "18px" }}>✅</span>
              <span>Advanced relationship pattern analytics</span>
            </li>
            <li style={{ marginBottom: "12px", display: "flex", gap: "12px", alignItems: "start", color: "#6750A4", fontSize: "15px" }}>
              <span style={{ fontSize: "18px" }}>✅</span>
              <span>Priority support (24-hour response)</span>
            </li>
            <li style={{ marginBottom: "12px", display: "flex", gap: "12px", alignItems: "start", color: "#6750A4", fontSize: "15px" }}>
              <span style={{ fontSize: "18px" }}>✅</span>
              <span>Export to share with therapists</span>
            </li>
          </ul>

          {currentTier !== "pro" ? (
            <button
              onClick={() => handleUpgrade("pro", billingInterval)}
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
                boxShadow: "0 4px 12px rgba(125, 211, 192, 0.3)",
                width: "100%"
              }}
            >
              Get Pro
            </button>
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

        {/* Get Started Button */}
        <div style={{ marginTop: "40px", textAlign: "center" }}>
          <button
            onClick={() => {
              if (!token) {
                sessionStorage.setItem('postLoginRedirect', '/create');
                navigate('/signup');
              } else {
                navigate('/create');
              }
            }}
            style={{
              padding: "14px 36px",
              background: "#7DD3C0",
              border: "none",
              borderRadius: "12px",
              fontWeight: "700",
              fontFamily: "'Nunito', sans-serif",
              cursor: "pointer",
              fontSize: "16px",
              color: "white",
              transition: "all 0.2s",
              boxShadow: "0 4px 12px rgba(125, 211, 192, 0.3)"
            }}
          >
            Get Started Now →
          </button>
        </div>
      </div>

      {/* Quick Auth Modal */}
      {showAuthModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '40px',
            maxWidth: '460px',
            width: '100%',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowAuthModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666',
                padding: '8px',
                lineHeight: '1'
              }}
            >
              ×
            </button>
            <h2 style={{
              fontFamily: "'Nunito', sans-serif",
              color: '#7DD3C0',
              marginBottom: '12px',
              fontSize: '28px',
              fontWeight: '700',
              textAlign: 'center'
            }}>
              Quick Sign In
            </h2>
            <p style={{
              fontFamily: "'Nunito', sans-serif",
              color: '#6B7280',
              marginBottom: '32px',
              fontSize: '16px',
              textAlign: 'center'
            }}>
              Sign in to complete your {pendingPurchase?.tier === 'plus' ? 'Plus' : 'Pro'} subscription
            </p>

            {(() => {
              const GOOGLE_CLIENT_ID = typeof window !== 'undefined' ? import.meta.env.VITE_GOOGLE_CLIENT_ID : null;
              const FACEBOOK_APP_ID = typeof window !== 'undefined' ? import.meta.env.VITE_FACEBOOK_APP_ID : null;
              const hasGoogleOAuth = GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID.length > 20 && !GOOGLE_CLIENT_ID.includes('YOUR_');
              const hasFacebookOAuth = FACEBOOK_APP_ID && FACEBOOK_APP_ID.length > 10 && !FACEBOOK_APP_ID.includes('YOUR_');

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {hasGoogleOAuth ? (
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => alert('Google sign-in failed')}
                        text="signin_with"
                        shape="rectangular"
                        logo_alignment="left"
                        width="280px"
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => alert('Google OAuth not configured')}
                      style={{
                        padding: '14px 24px',
                        fontSize: '16px',
                        fontWeight: '600',
                        fontFamily: "'Nunito', sans-serif",
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        background: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px'
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continue with Google
                    </button>
                  )}

                  {hasFacebookOAuth && (
                    <FacebookLogin
                      appId={FACEBOOK_APP_ID}
                      onSuccess={handleFacebookSuccess}
                      onFail={() => alert('Facebook sign-in failed')}
                      style={{
                        padding: '14px 24px',
                        fontSize: '16px',
                        fontWeight: '600',
                        fontFamily: "'Nunito', sans-serif",
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        background: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      Continue with Facebook
                    </FacebookLogin>
                  )}

                  <div style={{
                    textAlign: 'center',
                    marginTop: '16px',
                    padding: '16px 0',
                    borderTop: '1px solid #E5E7EB'
                  }}>
                    <button
                      onClick={() => {
                        setShowAuthModal(false);
                        navigate('/signup');
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#7DD3C0',
                        fontSize: '15px',
                        fontFamily: "'Nunito', sans-serif",
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      Or create a new account
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Embedded Checkout Modal */}
      {checkoutSession && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative'
          }}>
            <button
              onClick={handleCloseCheckout}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666',
                padding: '8px',
                lineHeight: '1'
              }}
            >
              ×
            </button>
            <h2 style={{
              fontFamily: "'Nunito', sans-serif",
              color: '#6750A4',
              marginBottom: '20px',
              fontSize: '24px',
              fontWeight: '700'
            }}>
              Complete Your {checkoutSession.tier === 'plus' ? 'Plus' : 'Pro'} Subscription
            </h2>
            <EmbeddedCheckout
              clientSecret={checkoutSession.clientSecret}
              onComplete={handleCheckoutComplete}
            />
          </div>
        </div>
      )}
    </div>
  );
}
