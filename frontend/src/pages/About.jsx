import React, { useState, useEffect, useRef } from 'react';
import describeImg from '../assets/icons/Describe.png';
import confirmImg from '../assets/icons/Confirm.png';
import inviteImg from '../assets/icons/Invite.png';
import chatImg from '../assets/icons/Chat.png';
import resolveImg from '../assets/icons/Resolve.png';
import meediHead from '../assets/icons/Meedi_head.svg';

/**
 * About / Our Story Page
 *
 * Features:
 * - "What is Meedi8?" section with promo video
 * - "How It Works" section with compact interactive cards
 * - "Our Story" section with origin narrative
 * - "Our Mission" section
 * - "Ethical Stance" section with 4 principles
 */
export default function About() {
  const [activeStep, setActiveStep] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const videoRef = useRef(null);

  // SSR safety check for mobile detection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkMobile = () => setIsMobile(window.innerWidth < 768);
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  const howItWorksSteps = [
    {
      number: "1",
      image: describeImg,
      title: "Describe the Issue",
      description: "Start by sharing your perspective in a private space. Take your time to articulate what happened, how it made you feel, and what matters most to you. Meedi listens carefully without judgment, creating a safe environment for honest expression."
    },
    {
      number: "2",
      image: confirmImg,
      title: "Confirm Understanding",
      description: "Meedi reflects back what you've shared to ensure nothing is lost in translation. This moment of confirmation helps clarify your thoughts and ensures your voice will be accurately represented when it's time to connect with the other person."
    },
    {
      number: "3",
      image: inviteImg,
      title: "Invite the Other Person",
      description: "When you're ready, send a simple invitation link. The other person receives the same thoughtful onboarding experience, sharing their perspective privately with Meedi. Both sides get equal space to be heard before the conversation begins."
    },
    {
      number: "4",
      image: chatImg,
      title: "Guided Three-Way Conversation",
      description: "Now the real magic happens. Meedi brings you together in a structured dialogue where each person takes turns speaking and listening. The AI mediator keeps the conversation balanced, prevents interruptions, and gently redirects if tensions rise. You'll find yourself actually hearing each other, perhaps for the first time."
    },
    {
      number: "5",
      image: resolveImg,
      title: "Reach Resolution Together",
      description: "Through patient turn taking and guided reflection, the path forward becomes clear. Meedi helps you identify common ground, explore creative solutions, and craft agreements that work for everyone. The conversation continues until you both feel heard and ready to move forward."
    }
  ];

  const ethicalPrinciples = [
    {
      title: "No Judgment",
      description: "We believe everyone deserves to be heard without fear of criticism or bias. Our platform creates a safe space where both parties can express themselves freely."
    },
    {
      title: "Human Oversight",
      description: "While AI assists in moderation, human values guide our platform. We're committed to ensuring technology serves people, not the other way around."
    },
    {
      title: "AI as a Tool, Not a Decision-Maker",
      description: "Meedi helps facilitate conversations, but you control the outcomes. Meedi never makes decisions for you. It simply helps create clarity and understanding."
    },
    {
      title: "Privacy First",
      description: "Your conversations are private and confidential. We never sell your data, and we use encryption to protect your sessions. What you share stays between you and the other party."
    }
  ];

  // Handle card interaction (hover on desktop, tap on mobile)
  const handleCardInteraction = (index) => {
    if (isMobile) {
      setActiveStep(activeStep === index ? null : index);
    }
  };

  return (
    <div style={styles.container}>
      {/* Top ellipse for depth */}
      <div style={styles.topEllipse} />

      {/* Meedi head peering from right */}
      <img src={meediHead} alt="" style={styles.meediHead} />

      {/* Main content */}
      <div style={styles.content}>

        {/* NEW: What is Meedi8? Section */}
        <section style={styles.section}>
          <h1 style={styles.mainHeading}>What is Meedi8?</h1>
          <p style={styles.bodyText}>
            AI-powered mediation that transforms conflict into understanding
          </p>

          <div style={styles.videoWrapper}>
            <video
              ref={videoRef}
              controls
              playsInline
              preload="metadata"
              style={styles.video}
            >
              <source src="/assets/videos/Meedi_promo.mp4" type="video/mp4" />
              Your browser does not support video.
            </video>
          </div>
        </section>

        {/* REDESIGNED: How It Works Section */}
        <section style={styles.section}>
          <h2 style={styles.sectionHeading}>How It Works</h2>

          {/* How It Works Video */}
          <div style={styles.videoWrapper}>
            <video
              controls
              playsInline
              preload="metadata"
              style={styles.video}
            >
              <source src="/assets/videos/Meedi8_process.mp4" type="video/mp4" />
              Your browser does not support video.
            </video>
          </div>

          {/* Interactive Cards Grid */}
          <div style={{
            ...styles.cardsGrid,
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)',
            alignItems: 'start',
          }}>
            {howItWorksSteps.map((step, index) => {
              const isActive = activeStep === index;
              return (
                <div
                  key={index}
                  style={{
                    ...styles.interactiveCard,
                    backgroundColor: isActive ? 'rgba(125, 211, 192, 0.08)' : 'white',
                    transform: isActive ? 'translateY(-4px)' : 'translateY(0)',
                    boxShadow: isActive
                      ? '0 8px 24px rgba(125, 211, 192, 0.25)'
                      : '0 2px 8px rgba(0, 0, 0, 0.06)',
                    border: isActive
                      ? '1px solid rgba(125, 211, 192, 0.4)'
                      : '1px solid transparent',
                  }}
                  onMouseEnter={() => !isMobile && setActiveStep(index)}
                  onMouseLeave={() => !isMobile && setActiveStep(null)}
                  onClick={() => handleCardInteraction(index)}
                >
                  {/* Card Content */}
                  <div style={styles.cardHeader}>
                    <span style={styles.stepBadge}>{step.number}</span>
                    <img src={step.image} alt={step.title} style={styles.cardIcon} />
                    <h3 style={styles.cardTitle}>{step.title}</h3>
                  </div>

                  {/* Expandable Description */}
                  <div style={{
                    ...styles.cardDescription,
                    maxHeight: isActive ? '300px' : '0',
                    opacity: isActive ? 1 : 0,
                    marginTop: isActive ? '12px' : '0',
                    paddingTop: isActive ? '12px' : '0',
                    borderTop: isActive ? '1px solid #E5E7EB' : 'none',
                  }}>
                    <p style={styles.descriptionText}>{step.description}</p>
                  </div>

                  {/* Mobile tap indicator */}
                  {isMobile && !isActive && (
                    <div style={styles.tapIndicator}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#9CA3AF">
                        <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/>
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Our Story Section */}
        <section style={styles.section}>
          <h1 style={styles.mainHeading}>Our Story</h1>
          <p style={styles.bodyText}>
            Meedi8 was born from a simple observation: most conflicts escalate not because people are
            fundamentally incompatible, but because they struggle to communicate effectively. Arguments
            spiral into interruptions, raised voices, and hurt feelings, leaving both parties feeling
            unheard and frustrated.
          </p>
          <p style={styles.bodyText}>
            We created Meedi8 to change that. By providing a structured, moderated space where each
            person gets equal time to speak and be truly heard, we help transform conflict into understanding.
            Meedi, our friendly mediator, ensures conversations stay productive, fair, and
            respectful, giving conflicts the clarity they need to resolve naturally.
          </p>
        </section>

        {/* Our Mission Section */}
        <section style={styles.section}>
          <h2 style={styles.sectionHeading}>Our Mission</h2>
          <p style={styles.bodyText}>
            To make conflict resolution accessible, affordable, and effective for everyone. Whether it's
            a disagreement with family, a workplace tension, or a relationship challenge, Meedi8 provides
            the tools and structure to help people find common ground and move forward together.
          </p>
        </section>

        {/* Ethical Stance Section */}
        <section style={styles.section}>
          <h2 style={styles.sectionHeading}>Ethical Stance</h2>
          <p style={styles.bodyText}>
            We believe technology should empower people, not replace human judgment. Our ethical
            principles guide everything we do:
          </p>

          <div style={{
            ...styles.principlesList,
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          }}>
            {ethicalPrinciples.map((principle, index) => (
              <div key={index} style={styles.principleCard}>
                <h3 style={styles.principleTitle}>{principle.title}</h3>
                <p style={styles.principleDescription}>{principle.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Core Modality Blend Section */}
        <section style={styles.modalitySection}>
          <h2 style={styles.sectionHeading}>Meedi8's Core Modality Blend</h2>
          <p style={styles.bodyText}>
            Our AI mediator integrates proven therapeutic and mediation frameworks to guide you through every stage of conflict resolution.
          </p>
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.tableHeader}>Category</th>
                  <th style={styles.tableHeader}>Modality</th>
                  <th style={styles.tableHeader}>Function in Platform</th>
                </tr>
              </thead>
              <tbody>
                <tr style={styles.tableRow}>
                  <td style={styles.tableCell}>Communication Framing</td>
                  <td style={styles.tableCell}>Nonviolent Communication (NVC)</td>
                  <td style={styles.tableCell}>Builds empathy based summaries and standardized conflict inputs</td>
                </tr>
                <tr style={styles.tableRowAlt}>
                  <td style={styles.tableCell}>Emotional Exploration</td>
                  <td style={styles.tableCell}>Emotionally Focused Therapy (EFT)</td>
                  <td style={styles.tableCell}>Enhances relational empathy and connection</td>
                </tr>
                <tr style={styles.tableRow}>
                  <td style={styles.tableCell}>Cognitive Insight</td>
                  <td style={styles.tableCell}>Cognitive Behavioural Techniques (CBT)</td>
                  <td style={styles.tableCell}>Identifies and reframes negative assumptions</td>
                </tr>
                <tr style={styles.tableRowAlt}>
                  <td style={styles.tableCell}>Motivation & Reflection</td>
                  <td style={styles.tableCell}>Motivational Interviewing (MI)</td>
                  <td style={styles.tableCell}>Elicits internal motivation and ownership of change</td>
                </tr>
                <tr style={styles.tableRow}>
                  <td style={styles.tableCell}>Negotiation & Structure</td>
                  <td style={styles.tableCell}>Harvard Mediation Model</td>
                  <td style={styles.tableCell}>Guides toward shared interest based solutions</td>
                </tr>
                <tr style={styles.tableRowAlt}>
                  <td style={styles.tableCell}>Goal Creation</td>
                  <td style={styles.tableCell}>Solution Focused Brief Therapy (SFBT)</td>
                  <td style={styles.tableCell}>Converts insight into clear behavioural agreements</td>
                </tr>
                <tr style={styles.tableRow}>
                  <td style={styles.tableCell}>Tone & Relational Safety</td>
                  <td style={styles.tableCell}>Coaching & Person Centred Therapy</td>
                  <td style={styles.tableCell}>Maintains encouragement, neutrality, and trust</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* CTA Section */}
        <section style={styles.ctaSection}>
          <h2 style={styles.ctaHeading}>Ready to resolve your conflict?</h2>
          <p style={styles.ctaText}>
            Start your mediation journey with Meedi today.
          </p>
          <button
            style={styles.ctaButton}
            onClick={() => window.location.href = '/create'}
          >
            Start Mediation
          </button>
        </section>
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
  meediHead: {
    position: 'absolute',
    right: '-80px',
    top: '1800px',
    width: '400px',
    height: 'auto',
    opacity: 0.4,
    zIndex: 0,
    pointerEvents: 'none',
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
  content: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 20px 80px',
    maxWidth: '1000px',
    margin: '0 auto',
  },
  section: {
    width: '100%',
    marginBottom: '64px',
  },
  mainHeading: {
    fontSize: 'clamp(40px, 8vw, 64px)',
    fontWeight: '300',
    color: '#7DD3C0',
    lineHeight: '1.2',
    margin: '0 0 32px 0',
    textAlign: 'left',
  },
  sectionHeading: {
    fontSize: 'clamp(40px, 8vw, 64px)',
    fontWeight: '300',
    color: '#7DD3C0',
    lineHeight: '1.2',
    margin: '0 0 24px 0',
    textAlign: 'left',
  },
  bodyText: {
    fontSize: 'clamp(16px, 3.5vw, 20px)',
    fontWeight: '400',
    color: '#4B5563',
    lineHeight: '1.8',
    margin: '0 0 20px 0',
    textAlign: 'left',
  },

  // Video Section
  videoWrapper: {
    position: 'relative',
    width: '100%',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
    background: '#000',
    marginBottom: '32px',
  },
  video: {
    width: '100%',
    height: 'auto',
    display: 'block',
  },

  // Interactive Cards
  cardsGrid: {
    display: 'grid',
    gap: '16px',
    width: '100%',
  },
  interactiveCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px 16px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    border: '1px solid transparent',
    position: 'relative',
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  stepBadge: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: '#7DD3C0',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '700',
  },
  cardIcon: {
    width: '80px',
    height: '80px',
    objectFit: 'contain',
  },
  cardTitle: {
    fontSize: 'clamp(12px, 2.5vw, 14px)',
    fontWeight: '600',
    color: '#6750A4',
    margin: 0,
    textAlign: 'center',
    lineHeight: '1.3',
  },
  cardDescription: {
    overflow: 'hidden',
    transition: 'all 0.3s ease',
  },
  descriptionText: {
    fontSize: 'clamp(11px, 2vw, 13px)',
    color: '#6B7280',
    lineHeight: '1.6',
    margin: 0,
    textAlign: 'center',
  },
  tapIndicator: {
    position: 'absolute',
    bottom: '8px',
    left: '50%',
    transform: 'translateX(-50%)',
    opacity: 0.5,
  },

  // Ethical Principles
  principlesList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginTop: '32px',
  },
  principleCard: {
    backgroundColor: 'white',
    padding: '16px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  principleTitle: {
    fontSize: 'clamp(14px, 3vw, 16px)',
    fontWeight: '700',
    color: '#B8A7E5',
    lineHeight: '1.3',
    margin: '0 0 8px 0',
  },
  principleDescription: {
    fontSize: 'clamp(11px, 2vw, 13px)',
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: '1.5',
    margin: 0,
  },

  // Modality Table
  modalitySection: {
    width: '100%',
    marginBottom: '64px',
  },
  tableContainer: {
    overflowX: 'auto',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    padding: '16px',
    WebkitOverflowScrolling: 'touch',
  },
  table: {
    width: '100%',
    minWidth: '600px',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
  tableHeader: {
    backgroundColor: '#7DD3C0',
    color: 'white',
    padding: '12px 8px',
    textAlign: 'left',
    fontWeight: '700',
    fontSize: '14px',
    borderBottom: '2px solid #6BC5B8',
  },
  tableRow: {
    backgroundColor: 'white',
  },
  tableRowAlt: {
    backgroundColor: '#F9FAFB',
  },
  tableCell: {
    padding: '10px 8px',
    borderBottom: '1px solid #E5E7EB',
    color: '#4B5563',
    lineHeight: '1.5',
  },

  // CTA Section
  ctaSection: {
    width: '100%',
    textAlign: 'center',
    padding: '48px 24px',
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    marginTop: '32px',
  },
  ctaHeading: {
    fontSize: 'clamp(28px, 5vw, 40px)',
    fontWeight: '700',
    color: '#7DD3C0',
    lineHeight: '1.2',
    margin: '0 0 16px 0',
  },
  ctaText: {
    fontSize: 'clamp(16px, 3.5vw, 20px)',
    fontWeight: '400',
    color: '#4B5563',
    lineHeight: '1.6',
    margin: '0 0 32px 0',
  },
  ctaButton: {
    backgroundColor: '#7DD3C0',
    color: 'white',
    fontSize: 'clamp(16px, 3.5vw, 20px)',
    fontWeight: '600',
    padding: '16px 48px',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: "'Nunito', sans-serif",
  },
};
