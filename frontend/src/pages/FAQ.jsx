import React, { useState } from 'react';

/**
 * FAQ Page - Collapsible Questions
 *
 * Design from: "FAQ.png"
 *
 * Features:
 * - Large "FAQ" heading
 * - Collapsible Q&A pairs with down arrow icons
 * - Questions in dark text, answers in lighter purple
 * - Background matches page gradient
 * - White menu bar text
 */
export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const faqs = [
    {
      question: "What is Meedi8?",
      answer: "Meedi8 is a mediation platform that helps people resolve conflicts calmly and fairly. We provide a safe space where both sides can be heard without interruptions or judgment, guided by Meedi, your friendly mediator."
    },
    {
      question: "How does the coaching work?",
      answer: "Meedi guides the conversation between both parties, ensuring equal speaking time and helping each person express their perspective. Meedi asks clarifying questions, summarizes key points, and helps identify common ground for resolution."
    },
    {
      question: "Is my coaching session private?",
      answer: "Yes, absolutely. All mediation sessions are completely private and confidential. Only the participants in the session can see the conversation. We never share your personal information or session details with third parties."
    },
    {
      question: "Can I pause or take breaks?",
      answer: "Yes, you can pause the session at any time. Both parties have the option to take breaks during the mediation process. You can resume when you're ready. We understand that difficult conversations can be emotionally taxing."
    },
    {
      question: "How long does mediation take?",
      answer: "The length of mediation varies depending on the complexity of the situation and how much both parties want to discuss. Most sessions range from 30 minutes to 2 hours. You control the pace of the conversation."
    },
    {
      question: "Do I need to complete it in one sitting?",
      answer: "No, you don't have to complete the mediation in one sitting. You can save your progress and return to the session later. Both parties can agree on a time to continue the conversation when you're both ready."
    },
    {
      question: "How much does it cost?",
      answer: "We offer flexible pricing plans to fit your needs. You can view our subscription options on the Pricing page, with plans starting from basic mediation access to premium features with unlimited sessions."
    },
    {
      question: "What if the other person won't participate?",
      answer: "While we can't force participation, we provide tools to make joining easy. You can send a private invitation link, and our platform is designed to be welcoming and non-threatening. If they're hesitant, you can start with your own coaching session first."
    },
    {
      question: "Can I get a transcript of the session?",
      answer: "Yes! After each mediation session, you can download a full transcript in PDF format. This allows both parties to review what was discussed and reference any agreements or action items."
    },
    {
      question: "What types of conflicts can Meedi8 help with?",
      answer: "Meedi8 works well for work disagreements, family tensions, romantic relationship issues, money disputes, and general interpersonal conflicts. For serious issues involving safety, abuse, or legal matters, we recommend professional in-person mediation or therapy."
    }
  ];

  const toggleQuestion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div style={styles.container}>
      {/* Top ellipse for depth */}
      <div style={styles.topEllipse} />

      {/* Main content */}
      <div style={styles.content}>
        {/* Heading */}
        <h1 style={styles.heading}>FAQ</h1>

        {/* FAQ Items - Collapsible */}
        <div style={styles.faqList}>
          {faqs.map((faq, index) => (
            <div
              key={index}
              style={{
                ...styles.faqItem,
                backgroundColor: openIndex === index ? '#FFFFFF' : '#9CDAD5',
              }}
            >
              <button
                onClick={() => toggleQuestion(index)}
                style={styles.questionButton}
                aria-expanded={openIndex === index}
              >
                <h3 style={{
                  ...styles.question,
                  color: openIndex === index ? '#CCB2FF' : '#FFFFFF',
                }}>{faq.question}</h3>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{
                    ...styles.icon,
                    transform: openIndex === index ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                >
                  <path
                    d="M6 9L12 15L18 9"
                    stroke={openIndex === index ? '#CCB2FF' : '#FFFFFF'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {openIndex === index && (
                <p style={styles.answer}>{faq.answer}</p>
              )}
            </div>
          ))}
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
  content: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 20px 80px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  heading: {
    fontSize: 'clamp(48px, 10vw, 72px)',
    fontWeight: '700',
    color: '#7DD3C0',
    lineHeight: '1.2',
    margin: '0 0 48px 0',
    textAlign: 'center',
    fontFamily: "'Nunito', sans-serif",
  },
  faqList: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  faqItem: {
    width: '100%',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    transition: 'all 0.3s ease',
  },
  questionButton: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    textAlign: 'left',
  },
  question: {
    fontSize: 'clamp(18px, 4vw, 22px)',
    fontWeight: '700',
    color: '#1F2937',
    lineHeight: '1.4',
    margin: 0,
    fontFamily: "'Nunito', sans-serif",
    flex: 1,
  },
  icon: {
    flexShrink: 0,
    marginLeft: '16px',
    transition: 'transform 0.3s ease',
  },
  answer: {
    fontSize: 'clamp(15px, 3.5vw, 17px)',
    fontWeight: '400',
    color: '#B8A7E5',
    lineHeight: '1.6',
    margin: '16px 0 0 0',
    fontFamily: "'Nunito', sans-serif",
  },
};
