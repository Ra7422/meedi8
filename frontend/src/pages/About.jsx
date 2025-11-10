import React from 'react';

/**
 * About / Our Story Page
 *
 * Design from: "Screenshot 2025-11-06 at 03.23.16.png"
 *
 * Features:
 * - "Our Story" section with origin narrative
 * - "Our Mission" section
 * - "Ethical Stance" section with 4 principles:
 *   - No Judgment
 *   - Human Oversight
 *   - AI as a Tool, Not a Decision-Maker
 *   - Privacy First
 */
export default function About() {
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
      description: "Meedi helps facilitate conversations, but you control the outcomes. Meedi never makes decisions for you—it simply helps create clarity and understanding."
    },
    {
      title: "Privacy First",
      description: "Your conversations are private and confidential. We never sell your data, and we use encryption to protect your sessions. What you share stays between you and the other party."
    }
  ];

  return (
    <div style={styles.container}>
      {/* Top ellipse for depth */}
      <div style={styles.topEllipse} />

      {/* Main content */}
      <div style={styles.content}>
        {/* Our Story Section */}
        <section style={styles.section}>
          <h1 style={styles.mainHeading}>Our Story</h1>
          <p style={styles.bodyText}>
            Meedi8 was born from a simple observation: most conflicts escalate not because people are
            fundamentally incompatible, but because they struggle to communicate effectively. Arguments
            spiral into interruptions, raised voices, and hurt feelings—leaving both parties feeling
            unheard and frustrated.
          </p>
          <p style={styles.bodyText}>
            We created Meedi8 to change that. By providing a structured, moderated space where each
            person gets equal time to speak and be truly heard, we help transform conflict into understanding.
            Meedi, our friendly mediator, ensures conversations stay productive, fair, and
            respectful—giving conflicts the clarity they need to resolve naturally.
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

          <div style={styles.principlesList}>
            {ethicalPrinciples.map((principle, index) => (
              <div key={index} style={styles.principleCard}>
                <h3 style={styles.principleTitle}>{principle.title}</h3>
                <p style={styles.principleDescription}>{principle.description}</p>
              </div>
            ))}
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
    maxWidth: '900px',
    margin: '0 auto',
  },
  section: {
    width: '100%',
    marginBottom: '64px',
  },
  mainHeading: {
    fontSize: 'clamp(48px, 10vw, 72px)',
    fontWeight: '700',
    color: '#7DD3C0',
    lineHeight: '1.2',
    margin: '0 0 32px 0',
    textAlign: 'left',
  },
  sectionHeading: {
    fontSize: 'clamp(32px, 6vw, 48px)',
    fontWeight: '700',
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
  principlesList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
    marginTop: '32px',
  },
  principleCard: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  principleTitle: {
    fontSize: 'clamp(20px, 4vw, 24px)',
    fontWeight: '700',
    color: '#B8A7E5',
    lineHeight: '1.3',
    margin: '0 0 12px 0',
  },
  principleDescription: {
    fontSize: 'clamp(14px, 3vw, 16px)',
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: '1.6',
    margin: 0,
  },
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
