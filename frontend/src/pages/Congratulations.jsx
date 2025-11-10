import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api/client";
import confetti from "canvas-confetti";

export default function Congratulations() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [room, setRoom] = useState(null);
  const [summaries, setSummaries] = useState(null);
  const [loading, setLoading] = useState(true);

  // UI state
  const [hoveredIcon, setHoveredIcon] = useState(null);
  const [isWiggling, setIsWiggling] = useState(false);
  const [iconsVisible, setIconsVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const loadResolution = async () => {
      try {
        const roomData = await apiRequest(`/rooms/${roomId}`, "GET", null, token);
        setRoom(roomData);

        const summariesData = await apiRequest(`/rooms/${roomId}/main-room/summaries`, "GET", null, token);
        setSummaries(summariesData);
      } catch (error) {
        console.error("Load error:", error);
      }
      setLoading(false);
    };

    loadResolution();
  }, [roomId, token]);

  // Trigger confetti on page load
  useEffect(() => {
    if (!loading && room) {
      const celebrate = () => {
        setIsWiggling(true);
        // First burst from left
        confetti({
          particleCount: 200,
          spread: 70,
          origin: { x: 0.2, y: 0.6 },
          colors: ['#7DD3C0', '#C8B6FF', '#FFE4B5', '#E8D7FF', '#D4C5FF']
        });

        setTimeout(() => {
          confetti({
            particleCount: 200,
            spread: 70,
            origin: { x: 0.8, y: 0.6 },
            colors: ['#7DD3C0', '#C8B6FF', '#FFE4B5', '#E8D7FF', '#D4C5FF']
          });
        }, 150);

        setTimeout(() => {
          confetti({
            particleCount: 160,
            spread: 100,
            origin: { x: 0.5, y: 0.5 },
            colors: ['#7DD3C0', '#C8B6FF', '#FFE4B5', '#E8D7FF', '#D4C5FF']
          });
        }, 300);
      };

      const timer = setTimeout(celebrate, 400);
      const wiggleTimer = setTimeout(() => {
        setIsWiggling(false);
      }, 1400);

      return () => {
        clearTimeout(timer);
        clearTimeout(wiggleTimer);
      };
    }
  }, [loading, room]);

  // Scroll animation for icons
  useEffect(() => {
    const handleScroll = () => {
      if (!iconsVisible) {
        setIconsVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { once: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [iconsVisible]);

  const downloadTranscript = () => {
    window.location.href = `/api/rooms/${roomId}/transcript.pdf`;
  };

  const handleShare = (platform) => {
    const shareUrl = `${window.location.origin}/join/${roomId}`;
    const shareText = "I just resolved a conflict peacefully with Meedi8! Check it out:";

    switch (platform) {
      case 'Link':
        navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
        break;
      case 'Facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
        break;
      case 'Instagram':
        alert('Please share your experience on Instagram by posting a story or post!');
        break;
      case 'Email':
        window.location.href = `mailto:?subject=${encodeURIComponent('Check out Meedi8')}&body=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
        break;
      case 'WhatsApp':
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
        break;
      case 'Telegram':
        window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
        break;
      case 'Google Reviews':
        window.open('https://search.google.com/local/writereview?placeid=YOUR_GOOGLE_PLACE_ID', '_blank');
        break;
      case 'Trustpilot':
        window.open('https://www.trustpilot.com/review/meedi8.com', '_blank');
        break;
      case 'Referral Link':
        // TODO: Implement actual referral system
        alert('Referral system coming soon! Share the app with friends.');
        break;
      default:
        break;
    }
  };

  const handleRating = (stars) => {
    setRating(stars);

    // Check if user logged in with Google OAuth
    const isGoogleUser = user?.oauth_provider === 'google';

    if (isGoogleUser) {
      // Open Google Business review page - user is already logged in
      const googleReviewUrl = 'https://search.google.com/local/writereview?placeid=YOUR_GOOGLE_PLACE_ID';
      window.open(googleReviewUrl, '_blank');
    } else {
      alert(`Thank you for rating us ${stars} stars!`);
    }
  };

  const handleEmailSignup = () => {
    if (email) {
      alert(`Thank you! We'll send relationship tips to ${email}`);
      setEmail("");
    }
  };

  const addToCalendar = () => {
    if (room?.check_in_date) {
      const checkInDate = new Date(room.check_in_date);
      const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Meedi8%20Follow-Up%20Check-In&dates=${checkInDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=Review%20how%20your%20mediation%20agreement%20is%20working`;
      window.open(gcalUrl, '_blank');
    }
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
        <div style={styles.error}>Resolution not found</div>
      </div>
    );
  }

  const checkInDate = room.check_in_date
    ? new Date(room.check_in_date).toLocaleDateString()
    : "1 week";

  return (
    <div style={styles.container}>
      {/* Top ellipse for depth */}
      <div style={styles.topEllipse} />

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
        {/* Congratulations Section */}
        <div style={styles.congratulationsContainer}>
          <div
            style={{
              ...styles.partyIconInline,
              animation: isWiggling ? 'pop 0.6s ease-out' : 'none'
            }}
          >
            🎉
          </div>
          <h1 style={styles.congratulationsTitle}>Congratulations</h1>
        </div>

        {/* CSS Animation */}
        <style>{`
          @keyframes pop {
            0% {
              transform: translateX(-100px) scale(0.5);
              opacity: 0;
            }
            50% {
              transform: translateX(0) scale(3);
              opacity: 1;
            }
            100% {
              transform: translateX(0) scale(1);
              opacity: 1;
            }
          }
        `}</style>

        {/* Share Section with Encouraging Message */}
        <div style={styles.shareSection}>
          <p style={styles.shareMessage}>
            🌟 You just overcame a disagreement together! Share your success and help others discover Meedi8 - a better way to resolve conflicts peacefully.
          </p>

          <div style={styles.shareRow}>
            {/* Share Icons */}
            <div style={styles.shareIcons}>
            <button
              onClick={downloadTranscript}
              style={{
                ...styles.iconButton,
                ...styles.iconAnimation(iconsVisible, 0),
                ...(hoveredIcon === 'download' ? styles.iconButtonHover : {})
              }}
              onMouseEnter={() => setHoveredIcon('download')}
              onMouseLeave={() => setHoveredIcon(null)}
              title="Download Transcript"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="#C8B6FF">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
              </svg>
            </button>
            <button
              style={{
                ...styles.iconButton,
                ...styles.iconAnimation(iconsVisible, 1),
                ...(hoveredIcon === 'link' ? styles.iconButtonHover : {})
              }}
              onClick={() => handleShare('Link')}
              onMouseEnter={() => setHoveredIcon('link')}
              onMouseLeave={() => setHoveredIcon(null)}
              title="Copy link"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="#C8B6FF">
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
              </svg>
            </button>
            <button
              style={{
                ...styles.iconButton,
                ...styles.iconAnimation(iconsVisible, 2),
                ...(hoveredIcon === 'facebook' ? styles.iconButtonHover : {})
              }}
              onClick={() => handleShare('Facebook')}
              onMouseEnter={() => setHoveredIcon('facebook')}
              onMouseLeave={() => setHoveredIcon(null)}
              title="Share on Facebook"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="#C8B6FF">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </button>
            <button
              style={{
                ...styles.iconButton,
                ...styles.iconAnimation(iconsVisible, 3),
                ...(hoveredIcon === 'instagram' ? styles.iconButtonHover : {})
              }}
              onClick={() => handleShare('Instagram')}
              onMouseEnter={() => setHoveredIcon('instagram')}
              onMouseLeave={() => setHoveredIcon(null)}
              title="Share on Instagram"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="#C8B6FF">
                <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
              </svg>
            </button>
            <button
              style={{
                ...styles.iconButton,
                ...styles.iconAnimation(iconsVisible, 4),
                ...(hoveredIcon === 'email' ? styles.iconButtonHover : {})
              }}
              onClick={() => handleShare('Email')}
              onMouseEnter={() => setHoveredIcon('email')}
              onMouseLeave={() => setHoveredIcon(null)}
              title="Email"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="#C8B6FF">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
            </button>
            <button
              style={{
                ...styles.iconButton,
                ...styles.iconAnimation(iconsVisible, 5),
                ...(hoveredIcon === 'whatsapp' ? styles.iconButtonHover : {})
              }}
              onClick={() => handleShare('WhatsApp')}
              onMouseEnter={() => setHoveredIcon('whatsapp')}
              onMouseLeave={() => setHoveredIcon(null)}
              title="WhatsApp"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="#C8B6FF">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </button>
            <button
              style={{
                ...styles.iconButton,
                ...styles.iconAnimation(iconsVisible, 6),
                ...(hoveredIcon === 'telegram' ? styles.iconButtonHover : {})
              }}
              onClick={() => handleShare('Telegram')}
              onMouseEnter={() => setHoveredIcon('telegram')}
              onMouseLeave={() => setHoveredIcon(null)}
              title="Telegram"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="#C8B6FF">
                <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/>
              </svg>
            </button>
          </div>
          </div>
        </div>

        {/* Download Transcript CTA */}
        <div style={styles.downloadCTA}>
          <button
            onClick={downloadTranscript}
            style={{
              ...styles.primaryButton,
              ...(hoveredIcon === 'download-cta' ? styles.primaryButtonHover : {})
            }}
            onMouseEnter={() => setHoveredIcon('download-cta')}
            onMouseLeave={() => setHoveredIcon(null)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white" style={{ marginRight: '12px' }}>
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
            Download Your Agreement
          </button>
          <p style={styles.downloadSubtext}>Keep a record of what you both agreed to</p>
        </div>

        {/* Rate Your Experience */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>How Did We Do?</h3>
          <p style={styles.cardText}>
            {rating > 0
              ? "Thanks! Click a star again to share your experience on Google"
              : "Your feedback helps us improve - tap a star to rate"}
          </p>
          <div style={styles.starRating}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleRating(star)}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                style={{
                  ...styles.starButton,
                  transform: (hoveredStar || rating) >= star ? 'scale(1.1)' : 'scale(1)',
                }}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill={(hoveredStar || rating) >= star ? "#FFD700" : "#E5E7EB"}>
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                </svg>
              </button>
            ))}
          </div>
          {rating > 0 && user?.oauth_provider === 'google' && (
            <p style={styles.ratingNote}>
              ✓ Logged in with Google - You'll be able to post directly
            </p>
          )}
        </div>

        {/* Leave a Review */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Help Others Find Peaceful Solutions</h3>
          <p style={styles.cardText}>Share your experience and help others discover a better way to resolve conflicts</p>
          <div style={styles.reviewButtons}>
            <button
              onClick={() => handleShare('Google Reviews')}
              style={{
                ...styles.reviewButton,
                ...(hoveredIcon === 'google-review' ? styles.reviewButtonHover : {})
              }}
              onMouseEnter={() => setHoveredIcon('google-review')}
              onMouseLeave={() => setHoveredIcon(null)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" style={{ marginRight: '8px' }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google Review
            </button>
            <button
              onClick={() => handleShare('Trustpilot')}
              style={{
                ...styles.reviewButton,
                ...(hoveredIcon === 'trustpilot' ? styles.reviewButtonHover : {})
              }}
              onMouseEnter={() => setHoveredIcon('trustpilot')}
              onMouseLeave={() => setHoveredIcon(null)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" style={{ marginRight: '8px' }}>
                <path fill="#00B67A" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              Trustpilot
            </button>
          </div>
        </div>

        {/* Referral Program */}
        <div style={styles.referralCard}>
          <div style={styles.referralBadge}>🎁 Limited Time</div>
          <h3 style={styles.cardTitle}>Give Peace, Get Peace</h3>
          <p style={styles.cardText}>Invite a friend to resolve their conflict peacefully</p>
          <div style={styles.referralBenefits}>
            <div style={styles.benefit}>
              <span style={styles.benefitText}>They get 1 free mediation</span>
            </div>
            <div style={styles.benefit}>
              <span style={styles.benefitText}>You get 1 free mediation</span>
            </div>
          </div>
          <button
            onClick={() => handleShare('Referral Link')}
            style={{
              ...styles.primaryButton,
              ...(hoveredIcon === 'referral' ? styles.primaryButtonHover : {})
            }}
            onMouseEnter={() => setHoveredIcon('referral')}
            onMouseLeave={() => setHoveredIcon(null)}
          >
            Get Your Referral Link
          </button>
        </div>

        {/* Check-in Message */}
        <div style={styles.checkInBox}>
          <div style={styles.calendarIconWrapper}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#7DD3C0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
              <circle cx="12" cy="16" r="1" fill="#7DD3C0"></circle>
            </svg>
          </div>
          <div style={styles.checkInContent}>
            <h3 style={styles.checkInTitle}>Schedule Your Follow-Up</h3>
            <p style={styles.checkInText}>
              Great relationships take ongoing work. Check in with each other to see how things are progressing and keep the momentum going.
            </p>
            <button
              onClick={addToCalendar}
              style={{
                ...styles.secondaryButton,
                marginTop: '16px',
                ...(hoveredIcon === 'calendar' ? styles.secondaryButtonHover : {})
              }}
              onMouseEnter={() => setHoveredIcon('calendar')}
              onMouseLeave={() => setHoveredIcon(null)}
            >
              Add to Calendar
            </button>
          </div>
        </div>

        {/* Relationship Tips */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Keep Your Resolution Strong</h3>
          <p style={styles.cardText}>Practical tips to maintain momentum</p>
          <div style={styles.tipsList}>
            <div style={styles.tip}>
              <span style={styles.tipNumber}>1</span>
              <div>
                <strong style={styles.tipTitle}>Regular Check-ins</strong>
                <p style={styles.tipText}>Schedule weekly 10-minute conversations to review progress</p>
              </div>
            </div>
            <div style={styles.tip}>
              <span style={styles.tipNumber}>2</span>
              <div>
                <strong style={styles.tipTitle}>Celebrate Small Wins</strong>
                <p style={styles.tipText}>Acknowledge when things go well - positive reinforcement matters</p>
              </div>
            </div>
            <div style={styles.tip}>
              <span style={styles.tipNumber}>3</span>
              <div>
                <strong style={styles.tipTitle}>Address Issues Early</strong>
                <p style={styles.tipText}>Don't let small problems become big ones - communicate quickly</p>
              </div>
            </div>
            <div style={styles.tip}>
              <span style={styles.tipNumber}>4</span>
              <div>
                <strong style={styles.tipTitle}>Show Appreciation</strong>
                <p style={styles.tipText}>Thank each other for the effort put into maintaining the resolution</p>
              </div>
            </div>
          </div>
        </div>

        {/* Success Stats */}
        <div style={styles.statsCard}>
          <h3 style={styles.statsTitle}>You're Part of Something Special</h3>
          <div style={styles.statsGrid}>
            <div style={styles.stat}>
              <div style={styles.statNumber}>12,000+</div>
              <div style={styles.statLabel}>Conflicts Resolved</div>
            </div>
            <div style={styles.stat}>
              <div style={styles.statNumber}>94%</div>
              <div style={styles.statLabel}>Success Rate</div>
            </div>
            <div style={styles.stat}>
              <div style={styles.statNumber}>50+</div>
              <div style={styles.statLabel}>Countries</div>
            </div>
          </div>
        </div>

        {/* Email Signup */}
        <div style={styles.emailCard}>
          <h3 style={styles.cardTitle}>Get Weekly Relationship Tips</h3>
          <p style={styles.cardText}>Practical advice delivered to your inbox</p>
          <div style={styles.emailForm}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={styles.emailInput}
            />
            <button
              onClick={handleEmailSignup}
              style={{
                ...styles.primaryButton,
                ...(hoveredIcon === 'email-signup' ? styles.primaryButtonHover : {})
              }}
              onMouseEnter={() => setHoveredIcon('email-signup')}
              onMouseLeave={() => setHoveredIcon(null)}
            >
              Subscribe
            </button>
          </div>
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
    background: 'linear-gradient(180deg, #EAF7F0 0%, #E8F3F9 50%, #F0E8F9 100%)',
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
    background: 'radial-gradient(ellipse at center, rgba(200, 182, 255, 0.12) 0%, transparent 70%)',
    zIndex: 0,
  },
  wave: {
    position: 'absolute',
    top: 0,
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
    alignItems: 'center',
    padding: '40px 20px',
    maxWidth: '600px',
    margin: '0 auto',
  },
  shareSection: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '48px',
  },
  shareMessage: {
    fontSize: '16px',
    fontWeight: '400',
    color: '#6B5B95',
    lineHeight: '1.6',
    textAlign: 'center',
    maxWidth: '500px',
    margin: '0 0 24px 0',
    padding: '0 20px',
  },
  shareRow: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
  },
  shareIcons: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'nowrap',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    zIndex: 2,
  },
  iconButton: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    transition: 'all 0.2s',
    borderRadius: '8px',
  },
  iconButtonHover: {
    background: 'rgba(200, 182, 255, 0.1)',
    transform: 'scale(1.1)',
  },
  congratulationsContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    marginBottom: '32px',
  },
  congratulationsTitle: {
    fontSize: 'clamp(40px, 8vw, 64px)',
    fontWeight: '300',
    color: '#7DD3C0',
    lineHeight: '1.2',
    margin: '0',
    textAlign: 'center',
  },
  partyIconInline: {
    fontSize: '64px',
    lineHeight: '1',
    display: 'inline-block',
  },
  checkInBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '20px',
    padding: '28px',
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(125, 211, 192, 0.2)',
    borderRadius: '16px',
    marginBottom: '20px',
    maxWidth: '600px',
    width: '100%',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  },
  calendarIconWrapper: {
    flexShrink: 0,
    padding: '12px',
    background: 'rgba(125, 211, 192, 0.1)',
    borderRadius: '12px',
  },
  checkInContent: {
    flex: 1,
  },
  checkInTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 8px 0',
    lineHeight: '1.3',
    fontFamily: "'Nunito', sans-serif",
  },
  checkInText: {
    fontSize: '15px',
    fontWeight: '400',
    color: '#6b7280',
    lineHeight: '1.6',
    margin: 0,
    fontFamily: "'Nunito', sans-serif",
  },
  iconAnimation: (isVisible, index) => ({
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'scale(1)' : 'scale(0)',
    transition: `all 0.3s ease-out ${index * 0.1}s`,
  }),
  downloadCTA: {
    textAlign: 'center',
    marginBottom: '48px',
  },
  primaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px 32px',
    background: 'linear-gradient(135deg, #7DD3C0 0%, #6BC5B8 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s',
    fontFamily: "'Nunito', sans-serif",
    boxShadow: '0 4px 12px rgba(125, 211, 192, 0.3)',
  },
  primaryButtonHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 16px rgba(125, 211, 192, 0.4)',
  },
  downloadSubtext: {
    fontSize: '14px',
    color: '#6B5B95',
    marginTop: '12px',
  },
  card: {
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(125, 211, 192, 0.2)',
    borderRadius: '16px',
    padding: '28px',
    marginBottom: '20px',
    width: '100%',
    maxWidth: '600px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 8px 0',
    lineHeight: '1.3',
    fontFamily: "'Nunito', sans-serif",
  },
  cardText: {
    fontSize: '15px',
    fontWeight: '400',
    color: '#6b7280',
    lineHeight: '1.6',
    margin: '0 0 20px 0',
    fontFamily: "'Nunito', sans-serif",
  },
  starRating: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
  },
  starButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    transition: 'all 0.2s',
  },
  ratingNote: {
    fontSize: '13px',
    color: '#7DD3C0',
    textAlign: 'center',
    margin: '12px 0 0 0',
    fontWeight: '600',
    fontFamily: "'Nunito', sans-serif",
  },
  reviewButtons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  reviewButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '14px 24px',
    background: 'white',
    color: '#1f2937',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: "'Nunito', sans-serif",
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  },
  reviewButtonHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    borderColor: '#7DD3C0',
  },
  secondaryButton: {
    padding: '12px 24px',
    background: 'white',
    color: '#1f2937',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: "'Nunito', sans-serif",
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  },
  secondaryButtonHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    borderColor: '#7DD3C0',
  },
  referralCard: {
    background: 'linear-gradient(135deg, rgba(200, 182, 255, 0.1) 0%, rgba(125, 211, 192, 0.1) 100%)',
    backdropFilter: 'blur(10px)',
    border: '2px solid rgba(125, 211, 192, 0.3)',
    borderRadius: '16px',
    padding: '32px',
    marginBottom: '20px',
    width: '100%',
    maxWidth: '600px',
    position: 'relative',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  },
  referralBadge: {
    position: 'absolute',
    top: '-12px',
    right: '32px',
    background: '#FFD700',
    color: '#6B5B95',
    padding: '6px 16px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '700',
    boxShadow: '0 4px 12px rgba(255, 215, 0, 0.3)',
  },
  referralBenefits: {
    display: 'flex',
    gap: '16px',
    marginBottom: '24px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  benefit: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 24px',
    background: 'white',
    borderRadius: '12px',
    border: '1px solid rgba(125, 211, 192, 0.2)',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  },
  benefitText: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
    fontFamily: "'Nunito', sans-serif",
  },
  tipsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  tip: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
  },
  tipNumber: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    background: '#7DD3C0',
    color: 'white',
    borderRadius: '50%',
    fontSize: '16px',
    fontWeight: '700',
    flexShrink: 0,
  },
  tipTitle: {
    fontSize: '16px',
    color: '#1f2937',
    display: 'block',
    marginBottom: '4px',
    fontFamily: "'Nunito', sans-serif",
  },
  tipText: {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: '1.5',
    margin: 0,
    fontFamily: "'Nunito', sans-serif",
  },
  statsCard: {
    background: 'linear-gradient(135deg, #7DD3C0 0%, #6BC5B8 100%)',
    borderRadius: '20px',
    padding: '40px 32px',
    marginBottom: '24px',
    width: '100%',
    maxWidth: '600px',
    textAlign: 'center',
  },
  statsTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: 'white',
    margin: '0 0 32px 0',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '24px',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: '32px',
    fontWeight: '700',
    color: 'white',
    marginBottom: '8px',
  },
  statLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  emailCard: {
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(125, 211, 192, 0.2)',
    borderRadius: '16px',
    padding: '28px',
    marginBottom: '48px',
    width: '100%',
    maxWidth: '600px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  },
  emailForm: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  emailInput: {
    flex: '1 1 200px',
    padding: '14px 20px',
    border: '2px solid rgba(125, 211, 192, 0.3)',
    borderRadius: '10px',
    fontSize: '15px',
    fontFamily: "'Nunito', sans-serif",
    outline: 'none',
    transition: 'border-color 0.3s',
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
};
