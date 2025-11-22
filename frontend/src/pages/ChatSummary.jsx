import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api/client";
import { Logo } from "../components/ui";
import CategoryIcon from "../components/ui/CategoryIcon";
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function ChatSummary() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token } = useAuth();
  const [room, setRoom] = useState(null);
  const [summaries, setSummaries] = useState(null);
  const [loading, setLoading] = useState(true);

  // Report state
  const [reportStatus, setReportStatus] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [comprehensiveReport, setComprehensiveReport] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutClientSecret, setCheckoutClientSecret] = useState(null);

  useEffect(() => {
    const loadRoomSummary = async () => {
      try {
        const roomData = await apiRequest(`/rooms/${roomId}`, "GET", null, token);
        setRoom(roomData);

        const summariesData = await apiRequest(`/rooms/${roomId}/main-room/summaries`, "GET", null, token);
        setSummaries(summariesData);

        // Load report status for resolved rooms
        if (roomData.phase === 'resolved') {
          const statusData = await apiRequest(`/rooms/${roomId}/report/status`, "GET", null, token);
          setReportStatus(statusData);
        }
      } catch (error) {
        console.error("Load error:", error);
      }
      setLoading(false);
    };

    loadRoomSummary();
  }, [roomId, token]);

  // Handle post-purchase confirmation
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const reportPurchased = searchParams.get('report_purchased');

    if (sessionId && reportPurchased === 'true') {
      // Confirm the purchase
      const confirmPurchase = async () => {
        try {
          await apiRequest(`/rooms/${roomId}/report/confirm-purchase?session_id=${sessionId}`, "POST", null, token);
          // Reload report status
          const statusData = await apiRequest(`/rooms/${roomId}/report/status`, "GET", null, token);
          setReportStatus(statusData);
          // Clear URL params
          navigate(`/rooms/${roomId}/summary`, { replace: true });
        } catch (error) {
          console.error("Confirm purchase error:", error);
        }
      };
      confirmPurchase();
    }
  }, [searchParams, roomId, token, navigate]);

  const handlePurchaseReport = async () => {
    try {
      const result = await apiRequest(`/rooms/${roomId}/report/create-checkout`, "POST", null, token);
      setCheckoutClientSecret(result.client_secret);
      setShowCheckout(true);
    } catch (error) {
      console.error("Create checkout error:", error);
      alert("Failed to start checkout. Please try again.");
    }
  };

  const handleGenerateReport = async () => {
    setReportLoading(true);
    try {
      const result = await apiRequest(`/rooms/${roomId}/generate-comprehensive-report`, "POST", null, token);
      setComprehensiveReport(result.report);
    } catch (error) {
      console.error("Generate report error:", error);
      if (error.message?.includes("402")) {
        alert("Payment required. Please purchase the report first.");
      } else {
        alert("Failed to generate report. Please try again.");
      }
    }
    setReportLoading(false);
  };

  const handleSendReminder = () => {
    // In a real app, this would send a push notification or email
    alert("Reminder sent!");
  };

  const downloadTranscript = () => {
    window.location.href = `/api/rooms/${roomId}/transcript.pdf`;
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (!room || !summaries) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>Summary not found</div>
      </div>
    );
  }

  const otherPersonName = summaries.user2_name || "Other Person";
  const isWaiting = room.phase === "user2_lobby" || room.phase === "user2_coaching";

  return (
    <div style={styles.container}>
      {/* Top ellipse for depth */}
      <div style={styles.topEllipse} />

      {/* Header with Logo */}
      <div style={styles.header}>
        <Logo size={240} />
      </div>

      {/* Decorative wave */}
      <svg style={styles.wave} viewBox="0 0 1440 120" preserveAspectRatio="none">
        <path
          d="M0,40 Q360,80 720,40 T1440,40 L1440,0 L0,0 Z"
          fill="#7DD3C0"
          opacity="0.1"
        />
      </svg>

      {/* Main Content */}
      <div style={styles.content}>
        {/* Icon and Title */}
        <div style={styles.iconTitleContainer}>
          <CategoryIcon category={room.category || 'work'} size={64} />
          <div>
            <h1 style={styles.personName}>{otherPersonName}</h1>
            <p style={styles.roomTitle}>{room.title}</p>
            {isWaiting && (
              <p style={styles.statusText}>Waiting: Other Person to Join</p>
            )}
          </div>
        </div>

        {/* Your Summary Section */}
        <div style={styles.summarySection}>
          <h2 style={styles.sectionTitle}>You said;</h2>
          <div style={styles.summaryBox}>
            <p style={styles.summaryText}>{summaries.user1_summary}</p>
          </div>
        </div>

        {/* Other Person Summary Section */}
        <div style={styles.summarySection}>
          <h2 style={styles.sectionTitle}>{otherPersonName} said;</h2>
          {summaries.user2_summary ? (
            <div style={styles.summaryBox}>
              <p style={styles.summaryText}>{summaries.user2_summary}</p>
            </div>
          ) : (
            <p style={styles.waitingText}>
              Awaiting {otherPersonName} to join the conversation
            </p>
          )}
        </div>

        {/* Comprehensive Report Section - Only for resolved rooms */}
        {room.phase === 'resolved' && reportStatus && (
          <div style={styles.reportSection}>
            <h2 style={styles.sectionTitle}>Professional Report</h2>

            {/* Checkout Modal */}
            {showCheckout && checkoutClientSecret && (
              <div style={styles.checkoutOverlay}>
                <div style={styles.checkoutModal}>
                  <button
                    style={styles.closeCheckout}
                    onClick={() => setShowCheckout(false)}
                  >
                    ×
                  </button>
                  <h3 style={styles.checkoutTitle}>Purchase Comprehensive Report</h3>
                  <EmbeddedCheckoutProvider
                    stripe={stripePromise}
                    options={{ clientSecret: checkoutClientSecret }}
                  >
                    <EmbeddedCheckout />
                  </EmbeddedCheckoutProvider>
                </div>
              </div>
            )}

            {/* Report Content */}
            {comprehensiveReport ? (
              <div style={styles.reportContent}>
                <div style={styles.reportBox}>
                  <pre style={styles.reportText}>{comprehensiveReport}</pre>
                </div>
              </div>
            ) : reportStatus.can_access ? (
              <div style={styles.reportAction}>
                <p style={styles.reportDescription}>
                  {reportStatus.reason === 'pro_subscriber'
                    ? 'As a PRO subscriber, you have free access to comprehensive reports.'
                    : 'Your comprehensive report is ready to generate.'}
                </p>
                <button
                  style={styles.generateButton}
                  onClick={handleGenerateReport}
                  disabled={reportLoading}
                >
                  {reportLoading ? 'Generating...' : 'Generate Report'}
                </button>
              </div>
            ) : (
              <div style={styles.reportAction}>
                <p style={styles.reportDescription}>
                  Get a comprehensive therapist-style analysis of your mediation session,
                  including individual assessments, relationship dynamics, and professional recommendations.
                </p>
                <div style={styles.reportPricing}>
                  <span style={styles.price}>${reportStatus.price}</span>
                  <span style={styles.priceNote}>one-time purchase</span>
                </div>
                <button
                  style={styles.purchaseButton}
                  onClick={handlePurchaseReport}
                >
                  Purchase Report
                </button>
                <p style={styles.proNote}>
                  PRO subscribers get unlimited free reports.{' '}
                  <span
                    style={styles.upgradeLink}
                    onClick={() => navigate('/subscription')}
                  >
                    Upgrade to PRO
                  </span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Send Reminder Section */}
        {isWaiting && (
          <div style={styles.reminderSection}>
            <div style={styles.phoneIcon}>
              <svg width="80" height="120" viewBox="0 0 100 150" fill="none">
                <rect x="10" y="10" width="80" height="130" rx="10" fill="white" stroke="#7DD3C0" strokeWidth="3"/>
                <rect x="20" y="20" width="60" height="100" rx="4" fill="#F3F4F6"/>
                <circle cx="50" cy="135" r="8" fill="#7DD3C0"/>
              </svg>
              <div style={styles.notificationBubble}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="#1F2937">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                </svg>
              </div>
            </div>
            <h3 style={styles.reminderTitle}>Send a Reminder?</h3>
          </div>
        )}

        {/* Character with Speech Bubble */}
        <div style={styles.characterContainer}>
          <div style={styles.speechBubbleLarge}>
            <div style={styles.speechLines}>
              <div style={styles.line}></div>
              <div style={styles.line}></div>
              <div style={styles.line}></div>
            </div>
          </div>
          <img
            src="/assets/illustrations/character-sitting.svg"
            alt="Character"
            style={styles.character}
          />
        </div>

        {/* Bottom Info */}
        <div style={styles.bottomInfo}>
          <div style={styles.infoItem}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#C8B6FF">
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V9h14v10z"/>
            </svg>
            <span style={styles.infoText}>No Date Confirmed</span>
          </div>
          <button onClick={downloadTranscript} style={styles.downloadLink}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#C8B6FF">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
            <span style={styles.infoText}>Transcript.PDF</span>
          </button>
        </div>
      </div>

      <div style={styles.bottomEllipse} />
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    position: 'relative',
    background: 'linear-gradient(180deg, #EAF7F0 0%, #E8F9F9 50%, #F5F3FF 100%)',
    overflow: 'hidden',
    fontFamily: "'Nunito', sans-serif",
  },
  topEllipse: {
    position: 'absolute',
    top: '-100px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '120%',
    height: '200px',
    borderRadius: '50%',
    background: 'radial-gradient(ellipse at center, rgba(76, 211, 194, 0.08) 0%, transparent 70%)',
    zIndex: 0,
  },
  bottomEllipse: {
    position: 'absolute',
    bottom: '-50px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '120%',
    height: '180px',
    borderRadius: '50%',
    background: 'radial-gradient(ellipse at center, rgba(125, 211, 192, 0.1) 0%, transparent 70%)',
    zIndex: 0,
  },
  header: {
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    justifyContent: 'center',
    padding: '20px 30px',
  },
  wave: {
    position: 'absolute',
    top: '100px',
    left: 0,
    width: '100%',
    height: '120px',
    zIndex: 0,
  },
  content: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 20px 200px',
    maxWidth: '650px',
    margin: '0 auto',
  },
  iconTitleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '40px',
  },
  personName: {
    fontSize: 'clamp(28px, 6vw, 48px)',
    fontWeight: '300',
    color: '#7DD3C0',
    margin: '0 0 4px 0',
    lineHeight: '1.2',
  },
  roomTitle: {
    fontSize: '16px',
    fontWeight: '400',
    color: '#9CA3AF',
    margin: '0 0 4px 0',
  },
  statusText: {
    fontSize: '14px',
    fontWeight: '400',
    color: '#C8B6FF',
    margin: 0,
  },
  summarySection: {
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: '300',
    color: '#7DD3C0',
    margin: '0 0 16px 0',
  },
  summaryBox: {
    background: 'white',
    borderRadius: '16px',
    padding: '20px 24px',
    border: '2px solid rgba(125, 211, 192, 0.2)',
  },
  summaryText: {
    fontSize: '15px',
    fontWeight: '300',
    color: '#4B5563',
    lineHeight: '1.7',
    margin: 0,
    fontStyle: 'italic',
  },
  waitingText: {
    fontSize: '15px',
    fontWeight: '400',
    color: '#9CA3AF',
    lineHeight: '1.6',
    margin: 0,
    fontStyle: 'italic',
  },
  reminderSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    marginTop: '40px',
    marginBottom: '40px',
  },
  phoneIcon: {
    position: 'relative',
  },
  notificationBubble: {
    position: 'absolute',
    bottom: '10px',
    right: '-15px',
    background: '#1F2937',
    borderRadius: '50%',
    padding: '8px',
  },
  reminderTitle: {
    fontSize: '20px',
    fontWeight: '400',
    color: '#9CA3AF',
    margin: 0,
  },
  characterContainer: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    marginTop: '40px',
    marginBottom: '60px',
  },
  speechBubbleLarge: {
    position: 'absolute',
    bottom: '40px',
    right: '180px',
    background: '#FFE4B5',
    borderRadius: '50%',
    width: '180px',
    height: '180px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px',
  },
  speechLines: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%',
  },
  line: {
    height: '4px',
    background: 'white',
    borderRadius: '2px',
  },
  character: {
    width: '200px',
    height: '200px',
  },
  bottomInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginTop: '20px',
  },
  infoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  downloadLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '0',
  },
  infoText: {
    fontSize: '16px',
    fontWeight: '400',
    color: '#C8B6FF',
  },
  loading: {
    textAlign: 'center',
    padding: '60px',
    fontSize: '18px',
    fontWeight: '300',
    color: '#6b7280',
  },
  error: {
    textAlign: 'center',
    padding: '60px',
    fontSize: '18px',
    fontWeight: '400',
    color: '#ef4444',
  },
  // Report section styles
  reportSection: {
    marginBottom: '40px',
    padding: '24px',
    background: 'rgba(200, 182, 255, 0.1)',
    borderRadius: '16px',
    border: '2px solid rgba(200, 182, 255, 0.3)',
  },
  reportAction: {
    textAlign: 'center',
  },
  reportDescription: {
    fontSize: '15px',
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: '1.6',
    marginBottom: '16px',
  },
  reportPricing: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '16px',
  },
  price: {
    fontSize: '32px',
    fontWeight: '600',
    color: '#C8B6FF',
  },
  priceNote: {
    fontSize: '14px',
    fontWeight: '400',
    color: '#9CA3AF',
  },
  purchaseButton: {
    background: 'linear-gradient(135deg, #C8B6FF 0%, #9F7AEA 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '14px 32px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '16px',
    boxShadow: '0 4px 12px rgba(200, 182, 255, 0.3)',
  },
  generateButton: {
    background: 'linear-gradient(135deg, #7DD3C0 0%, #4DC3B0 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '14px 32px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(125, 211, 192, 0.3)',
  },
  proNote: {
    fontSize: '13px',
    fontWeight: '400',
    color: '#9CA3AF',
    margin: 0,
  },
  upgradeLink: {
    color: '#C8B6FF',
    cursor: 'pointer',
    fontWeight: '600',
  },
  reportContent: {
    marginTop: '16px',
  },
  reportBox: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    maxHeight: '500px',
    overflowY: 'auto',
  },
  reportText: {
    fontSize: '14px',
    fontWeight: '400',
    color: '#4B5563',
    lineHeight: '1.8',
    margin: 0,
    whiteSpace: 'pre-wrap',
    fontFamily: "'Nunito', sans-serif",
  },
  checkoutOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  checkoutModal: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '90vh',
    overflowY: 'auto',
    position: 'relative',
  },
  closeCheckout: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: 'transparent',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#9CA3AF',
  },
  checkoutTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: '20px',
    textAlign: 'center',
  },
};
