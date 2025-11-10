import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/ui';

/**
 * Onboarding Slides Component - 5 slides introducing meedi8
 *
 * Features:
 * - 5 informational slides with smooth transitions
 * - Logo in top-left
 * - Next arrow button in top-right (circular, purple)
 * - Step indicators (Step 1, Step 2, etc.)
 * - Custom illustrations for each slide
 * - After last slide, navigates to /sessions
 */
export default function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const slides = [
    {
      step: null,
      title: "Why You're Here?",
      heading: "Resolve",
      subheading: "conflict calmly.",
      description: "Meedi8 gives people a safe space to talk, understand each other, and be heard, without arguments or judgment.",
      illustration: "/assets/illustrations/clean-air-gives-people-a-safe-space-to-talk-understand-each-other-and-be-heard-without-arguments-or-judgment.svg"
    },
    {
      step: "Step 1",
      heading: "Create a",
      subheading: "mediation request",
      description: "Choose a topic",
      subdescription: "family, work, friendship, etc.",
      illustration: "/assets/illustrations/stuck-at-home-sitting-on-floor.svg"
    },
    {
      step: "Step 2",
      heading: "Provide Context",
      description: "Answer a few questions",
      subdescription: "so we understand the situation fairly",
      illustration: "/assets/illustrations/stuck-at-home-sitting-on-floor.svg"
    },
    {
      step: "Step 3",
      heading: "Share Private",
      subheading: "Access",
      description: "Create and share",
      subdescription: "a private link to hear their perspective",
      illustration: "/assets/illustrations/share-this-link-with-the-other-person.svg"
    },
    {
      step: "Step 4",
      heading: "Speak, Listen,",
      subheading: "Understand",
      description: "Join a moderated chat",
      subdescription: "No interruptions.\nNo talking over each other.\nEach side gets equal time to be heard.",
      illustration: "/assets/illustrations/join-a-moderated-chat-no-interruptions-no-talking-over-each-other-each-side-gets-equal-time-to-be-heard.svg"
    }
  ];

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      // After last slide, go to sessions
      navigate('/sessions');
    }
  };

  const handleSkip = () => {
    navigate('/sessions');
  };

  const slide = slides[currentSlide];

  return (
    <div style={styles.container}>
      {/* Top ellipse for depth */}
      <div style={styles.topEllipse} />

      {/* Header with Logo and Next Button */}
      <div style={styles.header}>
        <div style={styles.logoContainer}>
          <Logo size={isMobile ? 180 : 240} />
        </div>
        <button
          style={styles.nextButton}
          onClick={handleNext}
          aria-label="Next slide"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Step indicator - positioned on right side */}
      {slide.step && (
        <div style={styles.stepIndicatorRight}>
          {slide.step}
        </div>
      )}

      {/* Main content */}
      <div style={styles.content}>

        {/* Headline */}
        <div style={styles.headline}>
          <h1 style={styles.headlineText}>
            {slide.title && (
              <span style={{ fontSize: isMobile ? '32px' : '40px', fontWeight: '400', color: '#9CA3AF', display: 'block', marginBottom: '16px' }}>
                {slide.title}
              </span>
            )}
            <span style={{ color: '#7DD3C0', fontWeight: currentSlide === 0 ? '700' : '400' }}>
              {slide.heading}
            </span>
            {slide.subheading && (
              <>
                <br />
                <span style={{ color: '#7DD3C0', fontWeight: '400' }}>
                  {slide.subheading}
                </span>
              </>
            )}
          </h1>
        </div>

        {/* Description */}
        <div style={styles.descriptionContainer}>
          <p style={styles.description}>
            {slide.description}
          </p>
          {slide.subdescription && (
            <p style={styles.subdescription}>
              {slide.subdescription}
            </p>
          )}
        </div>

        {/* Illustration */}
        <div style={styles.illustrationContainer}>
          <img
            src={slide.illustration}
            alt={`Slide ${currentSlide + 1} illustration`}
            style={styles.illustration}
          />
        </div>
      </div>

      {/* Bottom ellipse for depth */}
      <div style={styles.bottomEllipse} />
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    position: 'relative',
    background: 'linear-gradient(180deg, #EAF7F0 0%, #ffffff 100%)',
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
    background: 'radial-gradient(ellipse at center, rgba(76, 211, 194, 0.06) 0%, transparent 70%)',
    zIndex: 0,
  },
  header: {
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 30px',
  },
  logoContainer: {
    // Logo in top-left
  },
  nextButton: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#C8B6FF',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(200, 182, 255, 0.3)',
    transition: 'all 0.2s',
  },
  content: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px 20px 40px',
    maxWidth: '600px',
    margin: '0 auto',
    minHeight: 'calc(100vh - 120px)',
    justifyContent: 'flex-start',
    paddingTop: '40px',
  },
  stepIndicatorRight: {
    position: 'absolute',
    top: '140px',
    right: '40px',
    color: '#9CA3AF',
    fontSize: '16px',
    fontWeight: '400',
    zIndex: 5,
  },
  headline: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  headlineText: {
    fontSize: 'clamp(40px, 8vw, 56px)',
    fontWeight: '300',
    lineHeight: '1.2',
    margin: 0,
  },
  descriptionContainer: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  description: {
    fontSize: 'clamp(16px, 3.5vw, 20px)',
    color: '#6B7280',
    fontWeight: '600',
    lineHeight: '1.5',
    margin: '0 0 8px 0',
    padding: '0 16px',
  },
  subdescription: {
    fontSize: 'clamp(14px, 3vw, 16px)',
    color: '#9CA3AF',
    fontWeight: '400',
    lineHeight: '1.6',
    margin: 0,
    padding: '0 16px',
    whiteSpace: 'pre-line',
  },
  illustrationContainer: {
    width: '100%',
    maxWidth: '400px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    marginTop: '20px',
  },
  illustration: {
    width: '100%',
    height: 'auto',
    maxHeight: '300px',
    objectFit: 'contain',
  },
};
