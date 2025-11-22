import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BreathingExercise from "./BreathingExercise";
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
  const [showBreathingModal, setShowBreathingModal] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const videoRef = useRef(null);
  const { user, logout, googleLogin, facebookLogin, telegramQRLogin } = useAuth();
  const navigate = useNavigate();

  // Control video playback based on menu state
  useEffect(() => {
    if (isOpen && videoRef.current && !isMinimized) {
      videoRef.current.play().catch(err => {
        console.log('Autoplay prevented:', err);
      });
    } else if (!isOpen && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsMinimized(false);
      setIsMuted(true);
      setVideoProgress(0);
    }
  }, [isOpen, isMinimized]);

  // Handle video end
  const handleVideoEnded = () => {
    if (!isMuted) {
      // Video finished playing with sound - minimize it
      setIsMinimized(true);
      setIsMuted(true);
    } else {
      // Muted - restart loop
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play();
      }
    }
  };

  // Handle mute toggle
  const handleToggleMute = () => {
    if (isMuted && videoRef.current) {
      // Unmuting - restart from beginning
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
    setIsMuted(!isMuted);
  };

  // Handle mini player click
  const handleExpandVideo = () => {
    setIsMinimized(false);
    setVideoProgress(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
  };

  // Handle progress updates
  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setVideoProgress(progress);
    }
  };

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
            background: "rgba(139, 92, 246, 0.15)",
            border: "1px solid rgba(139, 92, 246, 0.4)",
            borderRadius: "50%",
            width: "48px",
            height: "48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: showTooltip
              ? "0 0 0 0 rgba(139, 92, 246, 1)"
              : "0 4px 15px rgba(139, 92, 246, 0.3)",
            backdropFilter: "blur(10px)",
            transition: "transform 0.2s, box-shadow 0.2s",
            animation: showTooltip ? "pulse 2s infinite" : "none"
          }}
        >
          {/* Always show hamburger/X icon */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
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
              background: "rgba(139, 92, 246, 0.9)",
              color: "white",
              padding: "12px 16px",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: "500",
              boxShadow: "0 4px 20px rgba(139, 92, 246, 0.4)",
              backdropFilter: "blur(10px)",
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
              borderBottom: "6px solid rgba(139, 92, 246, 0.9)"
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
              background: "linear-gradient(135deg, rgba(30, 20, 50, 0.95) 0%, rgba(20, 15, 35, 0.98) 100%)",
              zIndex: 1001,
              boxShadow: "-2px 0 30px rgba(139, 92, 246, 0.3)",
              backdropFilter: "blur(20px)",
              animation: "slideInRight 0.3s ease",
              display: "flex",
              flexDirection: "column"
            }}
          >
            {/* Menu Header */}
            <div style={{
              padding: "20px",
              borderBottom: "1px solid rgba(139, 92, 246, 0.3)"
            }}>
              {user ? (
                <p style={{
                  margin: 0,
                  fontSize: "14px",
                  color: "rgba(255, 255, 255, 0.8)",
                  fontWeight: "500"
                }}>
                  {user.name || user.email}
                </p>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <img
                    src="/assets/logo/meedi8-logo.png"
                    alt="Meedi8"
                    style={{ height: '120px', width: 'auto' }}
                  />
                </div>
              )}
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
                      background: showPerspectives ? "rgba(139, 92, 246, 0.2)" : "none",
                      border: "none",
                      fontSize: "16px",
                      color: "white",
                      cursor: "pointer",
                      transition: "background 0.2s",
                      fontWeight: showPerspectives ? "600" : "400"
                    }}
                    onMouseEnter={(e) => !showPerspectives && (e.currentTarget.style.background = "rgba(139, 92, 246, 0.15)")}
                    onMouseLeave={(e) => !showPerspectives && (e.currentTarget.style.background = "none")}
                  >
                    👥 Both Perspectives
                  </button>

                  {showPerspectives && (
                    <div style={{
                      padding: "16px 20px",
                      background: "rgba(139, 92, 246, 0.1)",
                      borderTop: "1px solid rgba(139, 92, 246, 0.3)",
                      borderBottom: "1px solid rgba(139, 92, 246, 0.3)",
                      fontSize: "13px"
                    }}>
                      <div style={{ marginBottom: "16px" }}>
                        <p style={{ fontWeight: "600", marginBottom: "6px", fontSize: "14px", color: "rgba(255, 255, 255, 0.9)" }}>
                          {summaries.user1_name}:
                        </p>
                        <p style={{ margin: 0, lineHeight: "1.6", whiteSpace: "pre-wrap", color: "rgba(255, 255, 255, 0.7)" }}>
                          {summaries.user1_summary}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontWeight: "600", marginBottom: "6px", fontSize: "14px", color: "rgba(255, 255, 255, 0.9)" }}>
                          {summaries.user2_name}:
                        </p>
                        <p style={{ margin: 0, lineHeight: "1.6", whiteSpace: "pre-wrap", color: "rgba(255, 255, 255, 0.7)" }}>
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
                      background: showLink ? "rgba(139, 92, 246, 0.2)" : "none",
                      border: "none",
                      fontSize: "16px",
                      color: "white",
                      cursor: "pointer",
                      transition: "background 0.2s",
                      fontWeight: showLink ? "600" : "400"
                    }}
                    onMouseEnter={(e) => !showLink && (e.currentTarget.style.background = "rgba(139, 92, 246, 0.15)")}
                    onMouseLeave={(e) => !showLink && (e.currentTarget.style.background = "none")}
                  >
                    🔗 Share Link
                  </button>

                  {showLink && (
                    <div style={{
                      padding: "16px 20px",
                      background: "rgba(139, 92, 246, 0.15)",
                      borderTop: "1px solid rgba(139, 92, 246, 0.3)",
                      borderBottom: "1px solid rgba(139, 92, 246, 0.3)"
                    }}>
                      <p style={{ margin: "0 0 8px 0", fontWeight: "600", fontSize: "13px", color: "rgba(255, 255, 255, 0.9)" }}>
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
                            border: "1px solid rgba(139, 92, 246, 0.4)",
                            background: "rgba(0, 0, 0, 0.3)",
                            color: "white",
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
                            background: "#8b5cf6",
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

              {/* Always show breathing option - opens modal */}
              <button
                onClick={() => {
                  setShowBreathingModal(true);
                  setIsOpen(false); // Close menu when opening breathing modal
                }}
                style={{
                  width: "100%",
                  padding: "14px 20px",
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  fontSize: "16px",
                  color: "white",
                  cursor: "pointer",
                  transition: "background 0.2s",
                  fontWeight: "400"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(139, 92, 246, 0.15)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "none"}
              >
                🫧 Breathe & Earn Rewards
              </button>

              {/* Divider if room options exist */}
              {(summaries || inviteLink || onToggleBreathing) && (
                <div style={{
                  height: "1px",
                  background: "rgba(139, 92, 246, 0.3)",
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
                    color: isGuest ? "rgba(255, 255, 255, 0.4)" : "white",
                    cursor: isGuest ? "not-allowed" : "pointer",
                    transition: "background 0.2s",
                    fontWeight: "500",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    opacity: isGuest ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => !isGuest && (e.currentTarget.style.background = "rgba(139, 92, 246, 0.15)")}
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
                      color: isRestricted ? "rgba(255, 255, 255, 0.4)" : "white",
                      cursor: isRestricted ? "not-allowed" : "pointer",
                      transition: "background 0.2s",
                      opacity: isRestricted ? 0.5 : 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between"
                    }}
                    onMouseEnter={(e) => !isRestricted && (e.currentTarget.style.background = "rgba(139, 92, 246, 0.15)")}
                    onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                    title={tooltipText}
                  >
                    {item.label}
                    {isRestricted && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    )}
                  </button>
                );
              })}

              {/* Video Section */}
              {!isMinimized ? (
                <div style={{
                  padding: "16px 20px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  borderTop: "1px solid rgba(139, 92, 246, 0.3)",
                  marginTop: "8px"
                }}>
                  <div style={{
                    position: "relative",
                    width: "126px",
                    height: "126px"
                  }}>
                    {/* Progress ring SVG */}
                    <svg style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "126px",
                      height: "126px",
                      transform: "rotate(-90deg)",
                      pointerEvents: "none"
                    }}>
                      {/* Background circle */}
                      <circle
                        cx="63"
                        cy="63"
                        r="60"
                        fill="none"
                        stroke="rgba(204, 178, 255, 0.3)"
                        strokeWidth="3"
                      />
                      {/* Progress circle */}
                      <circle
                        cx="63"
                        cy="63"
                        r="60"
                        fill="none"
                        stroke="#CCB2FF"
                        strokeWidth="3"
                        strokeDasharray="377"
                        strokeDashoffset={377 - (videoProgress / 100) * 377}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dashoffset 0.1s linear" }}
                      />
                    </svg>

                    {/* Circular video container */}
                    <div style={{
                      position: "absolute",
                      top: "3px",
                      left: "3px",
                      width: "120px",
                      height: "120px",
                      borderRadius: "50%",
                      overflow: "hidden",
                      boxShadow: !isMuted
                        ? "0 4px 12px rgba(0, 0, 0, 0.15), 0 0 25px rgba(204, 178, 255, 0.5)"
                        : "0 4px 12px rgba(0, 0, 0, 0.15)",
                      transition: "box-shadow 0.3s ease"
                    }}>
                      <video
                        ref={videoRef}
                        src="/assets/videos/meedi_intro_round.mp4"
                        muted={isMuted}
                        playsInline
                        preload={isOpen ? "auto" : "metadata"}
                        onEnded={handleVideoEnded}
                        onTimeUpdate={handleTimeUpdate}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover"
                        }}
                      />
                    </div>

                    {/* Mute/Unmute toggle button */}
                    <button
                      onClick={handleToggleMute}
                      style={{
                        position: "absolute",
                        bottom: "7px",
                        right: "7px",
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        border: "none",
                        background: "rgba(0, 0, 0, 0.6)",
                        color: "white",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 0,
                        transition: "background 0.2s",
                        zIndex: 2
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0, 0, 0, 0.8)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "rgba(0, 0, 0, 0.6)"}
                      aria-label={isMuted ? "Unmute video" : "Mute video"}
                    >
                      {isMuted ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                          <line x1="23" y1="9" x2="17" y2="15"/>
                          <line x1="17" y1="9" x2="23" y2="15"/>
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* Mini player in corner */
                <div
                  onClick={handleExpandVideo}
                  style={{
                    position: "absolute",
                    bottom: "70px",
                    right: "16px",
                    width: "48px",
                    height: "48px",
                    cursor: "pointer",
                    zIndex: 10
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label="Expand video player"
                  onKeyDown={(e) => e.key === 'Enter' && handleExpandVideo()}
                >
                  {/* Mini player border */}
                  <div style={{
                    position: "absolute",
                    top: "-2px",
                    left: "-2px",
                    width: "52px",
                    height: "52px",
                    borderRadius: "50%",
                    border: "2px solid #CCB2FF",
                    animation: "pulseGlow 2s infinite"
                  }} />

                  <div style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)"
                  }}>
                    <video
                      src="/assets/videos/meedi_intro_round.mp4"
                      muted
                      playsInline
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover"
                      }}
                    />
                  </div>

                  {/* Replay icon overlay */}
                  <div style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    background: "rgba(0, 0, 0, 0.5)",
                    borderRadius: "50%",
                    width: "24px",
                    height: "24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
              )}
            </nav>

            {/* Menu Footer */}
            <div style={{
              padding: "16px 20px",
              borderTop: "1px solid rgba(139, 92, 246, 0.3)"
            }}>
              {user ? (
                <button
                  onClick={handleLogout}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "rgba(239, 68, 68, 0.15)",
                    color: "white",
                    border: "1px solid rgba(239, 68, 68, 0.4)",
                    borderRadius: "50px",
                    fontSize: "15px",
                    fontWeight: "600",
                    cursor: "pointer",
                    boxShadow: "0 0 20px rgba(239, 68, 68, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)"
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
                      background: "rgba(139, 92, 246, 0.1)",
                      color: "rgba(255, 255, 255, 0.8)",
                      border: "1px solid rgba(139, 92, 246, 0.4)",
                      borderRadius: "50px",
                      fontSize: "13px",
                      fontWeight: "500",
                      cursor: "pointer",
                      boxShadow: "0 0 15px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                      backdropFilter: "blur(12px)",
                      WebkitBackdropFilter: "blur(12px)"
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
            box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(139, 92, 246, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(139, 92, 246, 0);
          }
        }

        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 0 10px rgba(204, 178, 255, 0.4);
          }
          50% {
            box-shadow: 0 0 20px rgba(204, 178, 255, 0.8);
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

      {/* Breathing Exercise Modal */}
      {showBreathingModal && (
        <>
          {/* Modal Backdrop */}
          <div
            onClick={() => setShowBreathingModal(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.85)",
              zIndex: 2000,
              animation: "fadeIn 0.3s ease"
            }}
          />

          {/* Modal Content */}
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 2001,
              width: "90%",
              maxWidth: "480px",
              maxHeight: "90vh",
              overflowY: "auto",
              borderRadius: "16px",
              animation: "breathingModalIn 0.3s ease"
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setShowBreathingModal(false)}
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                border: "none",
                background: "rgba(255, 255, 255, 0.1)",
                color: "#e9e7ff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
                transition: "background 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)"}
              aria-label="Close breathing exercise"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>

            <BreathingExercise
              inline={false}
              onSessionComplete={() => {
                // Optionally close modal after completing session
                // setShowBreathingModal(false);
              }}
            />
          </div>
        </>
      )}

      <style>{`
        @keyframes breathingModalIn {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
      `}</style>
    </>
  );
}
