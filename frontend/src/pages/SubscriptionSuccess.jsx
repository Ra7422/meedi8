import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api/client";
import { GoogleLogin } from '@react-oauth/google';
import FacebookLogin from '@greatsumini/react-facebook-login';
import TelegramLoginButton from '../components/TelegramLoginButton';

export default function SubscriptionSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const subscriptionId = searchParams.get("subscription_id");
  const paymentIntentId = searchParams.get("payment_intent");
  const { token, setToken, googleLogin, facebookLogin, telegramLogin } = useAuth();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);
  const [customerEmail, setCustomerEmail] = useState(null);
  const [showEmailSignup, setShowEmailSignup] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupError, setSignupError] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);

  // Environment variables for OAuth
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID;
  const TELEGRAM_BOT_NAME = import.meta.env.VITE_TELEGRAM_BOT_NAME;

  // Check if OAuth is properly configured
  const hasGoogleOAuth = typeof window !== 'undefined' && GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID.length > 20;
  const hasFacebookOAuth = typeof window !== 'undefined' && FACEBOOK_APP_ID && FACEBOOK_APP_ID.length > 10;
  const hasTelegramOAuth = typeof window !== 'undefined' && TELEGRAM_BOT_NAME;

  // OAuth handlers
  const handleGoogleSuccess = async (credentialResponse) => {
    setSignupError('');
    setSignupLoading(true);
    try {
      await googleLogin(credentialResponse.credential);
      navigate('/');
    } catch (e) {
      setSignupError(e.message || 'Google login failed.');
    } finally {
      setSignupLoading(false);
    }
  };

  const handleFacebookSuccess = async (response) => {
    setSignupError('');
    setSignupLoading(true);
    try {
      await facebookLogin(response.accessToken, response.userID);
      navigate('/');
    } catch (e) {
      setSignupError(e.message || 'Facebook login failed.');
    } finally {
      setSignupLoading(false);
    }
  };

  const handleTelegramResponse = async (response) => {
    setSignupError('');
    setSignupLoading(true);
    try {
      await telegramLogin(response);
      navigate('/');
    } catch (e) {
      setSignupError(e.message || 'Telegram login failed.');
    } finally {
      setSignupLoading(false);
    }
  };

  // Email/password signup handler
  const handleEmailSignup = async (e) => {
    e.preventDefault();
    setSignupError('');
    setSignupLoading(true);
    try {
      const response = await apiRequest('/auth/register', 'POST', {
        email: signupEmail || customerEmail,
        password: signupPassword,
        name: signupName || (signupEmail || customerEmail).split('@')[0]
      });
      if (response.access_token) {
        setToken(response.access_token);
        navigate('/');
      }
    } catch (e) {
      setSignupError(e.message || 'Signup failed. Email may already be in use.');
    } finally {
      setSignupLoading(false);
    }
  };

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
              // Try to extract email from error message (format: "message|email")
              if (error.message && error.message.includes("|")) {
                let email = error.message.split("|")[1];
                // Clean up any trailing characters like "} from JSON parsing
                if (email) {
                  email = email.replace(/["\}\s]+$/g, '').trim();
                }
                if (email && email.includes("@")) {
                  setCustomerEmail(email);
                }
              }
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
            {customerEmail
              ? <>Sign in with <strong>{customerEmail}</strong> to complete your purchase.</>
              : "Use the same email you provided during checkout."
            }
          </p>

          {signupError && (
            <div style={{ color: '#d32f2f', marginBottom: '16px', fontSize: '14px' }}>
              {signupError}
            </div>
          )}

          {/* OAuth Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
            {hasGoogleOAuth && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setSignupError('Google login failed.')}
                  text="continue_with"
                  shape="rectangular"
                  width="280"
                />
              </div>
            )}

            {hasFacebookOAuth && (
              <FacebookLogin
                appId={FACEBOOK_APP_ID}
                onSuccess={handleFacebookSuccess}
                onFail={() => setSignupError('Facebook login failed.')}
                render={({ onClick }) => (
                  <button
                    onClick={onClick}
                    disabled={signupLoading}
                    style={{
                      width: '280px',
                      margin: '0 auto',
                      padding: '10px 16px',
                      background: '#1877F2',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Continue with Facebook
                  </button>
                )}
              />
            )}

            {hasTelegramOAuth && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <TelegramLoginButton
                  botName={TELEGRAM_BOT_NAME}
                  onAuth={handleTelegramResponse}
                  buttonSize="large"
                />
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#D1D5DB' }} />
            <span style={{ padding: '0 12px', color: '#6B7280', fontSize: '12px' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: '#D1D5DB' }} />
          </div>

          {/* Email/Password Signup Toggle */}
          {!showEmailSignup ? (
            <button
              onClick={() => {
                setShowEmailSignup(true);
                if (customerEmail) setSignupEmail(customerEmail);
              }}
              style={{
                width: '280px',
                margin: '0 auto',
                padding: '10px 16px',
                background: 'white',
                color: '#374151',
                border: '1px solid #D1D5DB',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'block'
              }}
            >
              Sign up with Email
            </button>
          ) : (
            <form onSubmit={handleEmailSignup} style={{ maxWidth: '280px', margin: '0 auto' }}>
              <input
                type="email"
                placeholder="Email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  marginBottom: '8px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
              <input
                type="text"
                placeholder="Name (optional)"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  marginBottom: '8px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
              <input
                type="password"
                placeholder="Create Password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                required
                minLength={6}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  marginBottom: '12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="submit"
                disabled={signupLoading}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  background: '#7DD3C0',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: signupLoading ? 'not-allowed' : 'pointer',
                  opacity: signupLoading ? 0.6 : 1
                }}
              >
                {signupLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          )}
        </div>
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
