import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SimpleBreathing from "./SimpleBreathing";
import { GoogleLogin } from '@react-oauth/google';
import FacebookLogin from '@greatsumini/react-facebook-login';
import TelegramQRLoginModal from './TelegramQRLoginModal';

export default function FloatingMenu({
  // Room-specific props (optional)
  summaries = null,
  inviteLink = null,
  onToggleBreathing = null,
  showBreathing = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPerspectives, setShowPerspectives] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [showBreathingSection, setShowBreathingSection] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const { user, logout, googleLogin, facebookLogin, telegramQRLogin } = useAuth();
  const navigate = useNavigate();

  // Environment variables for OAuth
  const GOOGLE_CLIENT_ID = typeof window !== 'undefined' ? import.meta.env.VITE_GOOGLE_CLIENT_ID : null;
  const FACEBOOK_APP_ID = typeof window !== 'undefined' ? import.meta.env.VITE_FACEBOOK_APP_ID : null;

  // Check if OAuth is properly configured
  const hasGoogleOAuth = typeof window !== 'undefined' && GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID.length > 20 && !GOOGLE_CLIENT_ID.includes('YOUR_');
  const hasFacebookOAuth = typeof window !== 'undefined' && FACEBOOK_APP_ID && FACEBOOK_APP_ID.length > 10 && !FACEBOOK_APP_ID.includes('YOUR_');

  // OAuth handlers
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await googleLogin(credentialResponse.credential);
      setIsOpen(false);
      navigate('/');
    } catch (e) {
      console.error("Google login failed:", e);
    }
  };

  const handleFacebookSuccess = async (response) => {
    try {
      await facebookLogin(response.accessToken, response.userID);
      setIsOpen(false);
      navigate('/');
    } catch (e) {
      console.error("Facebook login failed:", e);
    }
  };

  const handleTelegramQRSuccess = async (tokenData) => {
    try {
      await telegramQRLogin(tokenData);
      setShowTelegramModal(false);
      setIsOpen(false);
      navigate('/');
    } catch (e) {
      console.error("Telegram login failed:", e);
    }
  };

  // Show tooltip hint for perspectives (only if summaries exist and user hasn't seen it)
  React.useEffect(() => {
    if (summaries && typeof window !== 'undefined') {
      const hasSeenHint = localStorage.getItem('meedi_perspectives_hint_seen');
      if (!hasSeenHint) {
        // Show tooltip after 1 second delay
        const timer = setTimeout(() => {
          setShowTooltip(true);
        }, 1000);

        // Hide tooltip after 10 seconds
        const hideTimer = setTimeout(() => {
          setShowTooltip(false);
          localStorage.setItem('meedi_perspectives_hint_seen', 'true');
        }, 11000);

        return () => {
          clearTimeout(timer);
          clearTimeout(hideTimer);
        };
      }
    }
  }, [summaries]);

  const handleMenuClick = () => {
    setIsOpen(!isOpen);
    // Dismiss tooltip when user clicks menu
    if (showTooltip) {
      setShowTooltip(false);
      if (typeof window !== 'undefined') {
        localStorage.setItem('meedi_perspectives_hint_seen', 'true');
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Check if user is a guest (email starts with "guest_")
  const isGuest = user?.email?.startsWith('guest_');

  // For premium checks - currently we assume isPremium=true until backend integration
  // Backend will enforce actual premium checks via 402 responses
  const isPremium = true;  // TODO: Get from user subscription status

  const menuItems = [
    { label: "Sessions", path: "/sessions" },
    { label: "New Mediation", path: "/create" },
    { label: "Solo Coaching", path: "/solo/start" },
    { label: "Pricing", path: "/subscription" },
    { label: "FAQ", path: "/faq" },
    { label: "About Us", path: "/about" },
    { label: "Referrals", path: "/referrals" }
  ];

  return (
    <>
      {/* Floating Menu Button with Tooltip */}
      <div style={{ position: "relative" }}>
        <button
          onClick={handleMenuClick}
          style={{
            position: "fixed",
            top: "16px",
            right: "16px",
            zIndex: 1000,
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "50%",
            width: "48px",
            height: "48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: showTooltip
              ? "0 0 0 0 rgba(125, 211, 192, 1)"
              : "0 4px 6px rgba(0, 0, 0, 0.1)",
            transition: "transform 0.2s",
            animation: showTooltip ? "pulse 2s infinite" : "none"
          }}
        >
          {/* Always show hamburger/X icon */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#374151">
            {isOpen ? (
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            ) : (
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
            )}
          </svg>
        </button>

        {/* Tooltip */}
        {showTooltip && (
          <div
            style={{
              position: "fixed",
              top: "72px",
              right: "16px",
              background: "#7DD3C0",
              color: "white",
              padding: "12px 16px",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: "500",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              zIndex: 999,
              maxWidth: "200px",
              animation: "fadeInDown 0.3s ease",
              pointerEvents: "none"
            }}
          >
            <div style={{
              position: "absolute",
              top: "-6px",
              right: "20px",
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderBottom: "6px solid #7DD3C0"
            }} />
            👥 Tap here to see both perspectives
          </div>
        )}
      </div>

      {/* Slide-out Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.5)",
              zIndex: 999,
              animation: "fadeIn 0.2s ease"
            }}
          />

          {/* Menu Panel */}
          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: "280px",
              maxWidth: "80vw",
              background: "white",
              zIndex: 1001,
              boxShadow: "-2px 0 8px rgba(0, 0, 0, 0.1)",
              animation: "slideInRight 0.3s ease",
              display: "flex",
              flexDirection: "column"
            }}
          >
            {/* Menu Header */}
            <div style={{
              padding: "20px",
              borderBottom: "1px solid #e5e7eb"
            }}>
              <p style={{
                margin: 0,
                fontSize: "14px",
                color: "#6b7280",
                fontWeight: "500"
              }}>
                {user?.name || user?.email}
              </p>
            </div>

            {/* Menu Items */}
            <nav style={{
              flex: 1,
              padding: "16px 0",
              overflowY: "auto"
            }}>
              {/* Room-specific options */}
              {summaries && (
                <>
                  <button
                    onClick={() => setShowPerspectives(!showPerspectives)}
                    style={{
                      width: "100%",
                      padding: "14px 20px",
                      textAlign: "left",
                      background: showPerspectives ? "#f9fafb" : "none",
                      border: "none",
                      fontSize: "16px",
                      color: "#374151",
                      cursor: "pointer",
                      transition: "background 0.2s",
                      fontWeight: showPerspectives ? "600" : "400"
                    }}
                    onMouseEnter={(e) => !showPerspectives && (e.currentTarget.style.background = "#f9fafb")}
                    onMouseLeave={(e) => !showPerspectives && (e.currentTarget.style.background = "none")}
                  >
                    👥 Both Perspectives
                  </button>

                  {showPerspectives && (
                    <div style={{
                      padding: "16px 20px",
                      background: "#f9fafb",
                      borderTop: "1px solid #e5e7eb",
                      borderBottom: "1px solid #e5e7eb",
                      fontSize: "13px"
                    }}>
                      <div style={{ marginBottom: "16px" }}>
                        <p style={{ fontWeight: "600", marginBottom: "6px", fontSize: "14px" }}>
                          {summaries.user1_name}:
                        </p>
                        <p style={{ margin: 0, lineHeight: "1.6", whiteSpace: "pre-wrap", color: "#374151" }}>
                          {summaries.user1_summary}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontWeight: "600", marginBottom: "6px", fontSize: "14px" }}>
                          {summaries.user2_name}:
                        </p>
                        <p style={{ margin: 0, lineHeight: "1.6", whiteSpace: "pre-wrap", color: "#374151" }}>
                          {summaries.user2_summary}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {inviteLink && (
                <>
                  <button
                    onClick={() => setShowLink(!showLink)}
                    style={{
                      width: "100%",
                      padding: "14px 20px",
                      textAlign: "left",
                      background: showLink ? "#f9fafb" : "none",
                      border: "none",
                      fontSize: "16px",
                      color: "#374151",
                      cursor: "pointer",
                      transition: "background 0.2s",
                      fontWeight: showLink ? "600" : "400"
                    }}
                    onMouseEnter={(e) => !showLink && (e.currentTarget.style.background = "#f9fafb")}
                    onMouseLeave={(e) => !showLink && (e.currentTarget.style.background = "none")}
                  >
                    🔗 Share Link
                  </button>

                  {showLink && (
                    <div style={{
                      padding: "16px 20px",
                      background: "#fef3c7",
                      borderTop: "1px solid #f59e0b",
                      borderBottom: "1px solid #f59e0b"
                    }}>
                      <p style={{ margin: "0 0 8px 0", fontWeight: "600", fontSize: "13px" }}>
                        Share this link:
                      </p>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <input
                          type="text"
                          value={inviteLink}
                          readOnly
                          style={{
                            flex: 1,
                            padding: "8px",
                            borderRadius: "6px",
                            border: "1px solid #d1d5db",
                            background: "white",
                            fontSize: "12px"
                          }}
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(inviteLink);
                            alert("Link copied!");
                          }}
                          style={{
                            padding: "8px 12px",
                            background: "#3b82f6",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "13px",
                            fontWeight: "600",
                            cursor: "pointer",
                            whiteSpace: "nowrap"
                          }}
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {onToggleBreathing && (
                <>
                  <button
                    onClick={() => setShowBreathingSection(!showBreathingSection)}
                    style={{
                      width: "100%",
                      padding: "14px 20px",
                      textAlign: "left",
                      background: showBreathingSection ? "#f9fafb" : "none",
                      border: "none",
                      fontSize: "16px",
                      color: "#374151",
                      cursor: "pointer",
                      transition: "background 0.2s",
                      fontWeight: showBreathingSection ? "600" : "400"
                    }}
                    onMouseEnter={(e) => !showBreathingSection && (e.currentTarget.style.background = "#f9fafb")}
                    onMouseLeave={(e) => !showBreathingSection && (e.currentTarget.style.background = "none")}
                  >
                    🫧 Take a Breath
                  </button>

                  {showBreathingSection && (
                    <div style={{
                      padding: "16px 20px",
                      background: "#f0f9ff",
                      borderTop: "1px solid #bae6fd",
                      borderBottom: "1px solid #bae6fd"
                    }}>
                      <SimpleBreathing startCountdown={true} />
                    </div>
                  )}
                </>
              )}

              {/* Divider if room options exist */}
              {(summaries || inviteLink || onToggleBreathing) && (
                <div style={{
                  height: "1px",
                  background: "#e5e7eb",
                  margin: "8px 0"
                }} />
              )}

              {/* Profile button (only when logged in, greyed out for guests) */}
              {user && (
                <button
                  onClick={() => {
                    if (!isGuest) {
                      navigate("/profile");
                      setIsOpen(false);
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "14px 20px",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    fontSize: "16px",
                    color: isGuest ? "#9ca3af" : "#374151",
                    cursor: isGuest ? "not-allowed" : "pointer",
                    transition: "background 0.2s",
                    fontWeight: "500",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    opacity: isGuest ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => !isGuest && (e.currentTarget.style.background = "#f9fafb")}
                  onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                  title={isGuest ? "Sign up to access your profile" : ""}
                >
                  {user.profile_picture_url ? (
                    <img
                      src={user.profile_picture_url}
                      alt="Profile"
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        objectFit: "cover"
                      }}
                    />
                  ) : isGuest ? (
                    <img
                      src="/assets/illustrations/Guest_Profile.svg"
                      alt="Guest"
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        objectFit: "cover"
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: "20px" }}>👤</span>
                  )}
                  Profile
                  {isGuest && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "auto" }}>
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  )}
                </button>
              )}

              {/* Regular navigation items */}
              {menuItems.map((item) => {
                // Restricted if guest and guestRestricted, OR if not premium and premiumRequired
                const isRestricted = (isGuest && item.guestRestricted) || (!isPremium && item.premiumRequired);
                const tooltipText = isGuest && item.guestRestricted
                  ? "Sign up to access this feature"
                  : !isPremium && item.premiumRequired
                    ? "Upgrade to Plus or Pro to access this feature"
                    : "";
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      if (!isRestricted) {
                        navigate(item.path);
                        setIsOpen(false);
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "14px 20px",
                      textAlign: "left",
                      background: "none",
                      border: "none",
                      fontSize: "16px",
                      color: isRestricted ? "#9ca3af" : "#374151",
                      cursor: isRestricted ? "not-allowed" : "pointer",
                      transition: "background 0.2s",
                      opacity: isRestricted ? 0.5 : 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between"
                    }}
                    onMouseEnter={(e) => !isRestricted && (e.currentTarget.style.background = "#f9fafb")}
                    onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                    title={tooltipText}
                  >
                    {item.label}
                    {isRestricted && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Menu Footer */}
            <div style={{
              padding: "16px 20px",
              borderTop: "1px solid #e5e7eb"
            }}>
              {user ? (
                <button
                  onClick={handleLogout}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "15px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  Logout
                </button>
              ) : (
                <div>
                  {/* OAuth buttons row */}
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center', marginBottom: '12px' }}>
                    {/* Google */}
                    {hasGoogleOAuth && (
                      <div style={{ transform: 'scale(1.25)', display: 'flex', alignItems: 'center' }}>
                        <GoogleLogin
                          onSuccess={handleGoogleSuccess}
                          onError={() => console.error("Google login failed")}
                          type="icon"
                          shape="circle"
                          size="medium"
                        />
                      </div>
                    )}

                    {/* Facebook */}
                    {hasFacebookOAuth && (
                      <FacebookLogin
                        appId={FACEBOOK_APP_ID}
                        onSuccess={handleFacebookSuccess}
                        onFail={(error) => console.error("Facebook login failed", error)}
                        render={({ onClick }) => (
                          <button
                            onClick={onClick}
                            style={{
                              width: '40px',
                              height: '40px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '50%',
                              border: 'none',
                              background: '#1877F2',
                              cursor: 'pointer',
                              padding: 0
                            }}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                          </button>
                        )}
                      />
                    )}

                    {/* Telegram */}
                    <button
                      onClick={() => setShowTelegramModal(true)}
                      style={{
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      <img
                        src="/assets/illustrations/Telegram_logo.svg"
                        alt="Sign in with Telegram"
                        style={{ width: '36px', height: '36px' }}
                      />
                    </button>
                  </div>

                  {/* Login with email link */}
                  <button
                    onClick={() => {
                      navigate("/login");
                      setIsOpen(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "10px",
                      background: "transparent",
                      color: "#6b7280",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: "500",
                      cursor: "pointer"
                    }}
                  >
                    Login with email
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }

        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(125, 211, 192, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(125, 211, 192, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(125, 211, 192, 0);
          }
        }

        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Telegram QR Login Modal */}
      <TelegramQRLoginModal
        isOpen={showTelegramModal}
        onClose={() => setShowTelegramModal(false)}
        onLoginSuccess={handleTelegramQRSuccess}
      />
    </>
  );
}
