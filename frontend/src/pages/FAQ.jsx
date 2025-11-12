import React, { useState } from 'react';

/**
 * FAQ Page - Sectioned and Collapsible Questions
 *
 * Features:
 * - Sections with color-coded headers
 * - Collapsible Q&A pairs with down arrow icons
 * - Questions in dark text, answers in lighter purple
 * - Background matches page gradient
 */
export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  // FAQ organized by sections with color themes
  const faqSections = [
    {
      title: "Safety & Crisis Support",
      color: "#EF4444", // Red for safety/urgent
      questions: [
        {
          question: "What if I feel unsafe during a mediation session?",
          answer: "Your safety is our top priority. If at any point you feel unsafe, you can exit the session immediately by clicking the \"Need Help\" button or closing the app. You can also use the \"Exit Privately\" option which ends your session without notifying the other person. We'll provide you with crisis resources and support contact information. If you're in immediate danger, please call emergency services or a crisis hotline."
        },
        {
          question: "What happens if the AI detects concerning language or behavior?",
          answer: "Meedi8 monitors conversations for safety concerns like threats, abusive language, or mentions of self-harm. If concerning patterns are detected, the session will pause immediately and you'll receive safety resources including hotlines and support services. In serious cases, you may be connected with a human counselor who can provide professional support. The other person won't be told why the session paused."
        },
        {
          question: "Does Meedi8 report abuse or dangerous situations to authorities?",
          answer: "Meedi8 does not proactively report to authorities. Our role is to provide you with resources and connect you with professional support services when needed. However, we encourage anyone experiencing abuse or in danger to contact local authorities, domestic violence hotlines, or emergency services. We display these resources when safety concerns are detected."
        },
        {
          question: "Can I exit a session privately without the other person knowing?",
          answer: "Yes. You can use the \"Exit Privately\" option at any time. This ends your participation without sending a notification to the other person or explaining why you left. Your safety and comfort are more important than completing a session. You won't be required to give a reason for leaving."
        },
        {
          question: "What if someone mentions self-harm or suicide?",
          answer: "If self-harm or suicide is mentioned, Meedi8 will immediately pause the mediation and display crisis resources including suicide prevention hotlines, text lines, and emergency contacts specific to your location. We strongly encourage you to reach out to these professional services. A human counselor may follow up to check on your wellbeing."
        }
      ]
    },
    {
      title: "Getting Started",
      color: "#7DD3C0", // Teal brand color
      questions: [
        {
          question: "What is Meedi8?",
          answer: "Meedi8 is a mediation platform that helps people resolve conflicts calmly and fairly. We provide a safe space where both sides can be heard without interruptions or judgment, guided by Meedi, your friendly mediator."
        },
        {
          question: "How does the coaching work?",
          answer: "Meedi guides the conversation between both parties, ensuring equal speaking time and helping each person express their perspective. Meedi asks clarifying questions, summarizes key points, and helps identify common ground for resolution."
        },
        {
          question: "What types of conflicts can Meedi8 help with?",
          answer: "Meedi8 works well for work disagreements, family tensions, romantic relationship issues, money disputes, and general interpersonal conflicts. For serious issues involving safety, abuse, or legal matters, we recommend professional in-person mediation or therapy."
        },
        {
          question: "What if the other person won't participate?",
          answer: "While we can't force participation, we provide tools to make joining easy. You can send a private invitation link, and our platform is designed to be welcoming and non-threatening. If they're hesitant, you can start with your own coaching session first."
        }
      ]
    },
    {
      title: "During a Session",
      color: "#6750A4", // Purple
      questions: [
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
          question: "What if the other person is hostile or refuses to cooperate?",
          answer: "If someone is hostile during mediation, Meedi will help manage turn-taking and remind both people to communicate respectfully. If behavior becomes abusive, the session will pause and safety resources provided. If someone refuses to participate at all, you can't force them. Meedi8 only works when both people are willing. You might benefit from the coaching session on your own to understand the situation better, even if mediation doesn't happen."
        }
      ]
    },
    {
      title: "Data & Privacy",
      color: "#10B981", // Green
      questions: [
        {
          question: "How long is my data kept?",
          answer: "Your conversation data is automatically deleted after 30 days. This includes transcripts, summaries, and any notes from your coaching sessions. You can request earlier deletion at any time through your account settings. Your basic account information (email, name) remains until you delete your account."
        },
        {
          question: "Can I permanently delete my conversations?",
          answer: "Yes. You can delete any conversation immediately by going to \"My Chats\", selecting the conversation, and choosing \"Delete Permanently\". This cannot be undone. You can also delete your entire account which removes all your data from our systems within 48 hours."
        },
        {
          question: "How is my data secured and encrypted?",
          answer: "All your conversations are encrypted end-to-end, meaning only you and the other participant can read them. We use industry-standard encryption both when data is stored and when it's transmitted. Your password is never stored in readable form. We comply with GDPR and data protection regulations."
        },
        {
          question: "Who can see my mediation conversations?",
          answer: "Only you and the other person in the mediation can see the full conversation. Your private coaching session with Meedi (before joining the other person) is completely confidential and never shared. Meedi8 staff cannot read your conversations. In rare cases where serious safety concerns are flagged by our AI, a licensed professional may review the conversation to ensure appropriate resources were provided."
        },
        {
          question: "Does Meedi8 sell or share my data with third parties?",
          answer: "No. We never sell your personal data or conversation content to anyone. We don't share your information with third parties except when necessary to provide the service (like secure hosting providers who are contractually bound to protect your data) or when required by law. Anonymized, aggregated data may be used for research to improve conflict resolution methods, but this never includes identifiable information."
        }
      ]
    },
    {
      title: "Human Support",
      color: "#F59E0B", // Amber/Orange
      questions: [
        {
          question: "Is there a real human available if the AI can't help?",
          answer: "Yes. When situations become complex or safety concerns arise, you can be connected with a licensed therapist or mediator. Premium and Family plans include faster access to human support. Human professionals can also review your AI mediation summaries to provide guidance."
        },
        {
          question: "When would I be connected to a licensed therapist?",
          answer: "You'll be offered connection to a licensed professional when: the AI detects safety concerns like abuse or self-harm, the conflict involves legal or custody issues, you or the other person specifically request human help, or the situation is beyond what AI mediation can appropriately handle. You can also request human support anytime through the app."
        },
        {
          question: "How quickly can I speak to a human professional?",
          answer: "For safety emergencies, we aim to connect you with a professional within 15 minutes. For non-urgent professional support, premium users typically receive responses within 24 hours. Free tier users can be referred to partner therapy services. In all cases, immediate crisis resources and hotlines are always displayed instantly."
        }
      ]
    },
    {
      title: "Platform & Technical",
      color: "#3B82F6", // Blue
      questions: [
        {
          question: "What devices can I use Meedi8 on?",
          answer: "Meedi8 works on any device with a web browser including phones, tablets, laptops, and desktop computers. It's a Progressive Web App, which means you can add it to your phone's home screen and it works like a regular app on both iPhone and Android devices. No download from an app store is needed."
        },
        {
          question: "Do I need good internet connection for voice features?",
          answer: "Yes, voice features require a stable internet connection. We recommend WiFi for the best experience. If your connection is poor, you can switch to text-only mode at any time during a session. The app will warn you if your connection quality drops."
        },
        {
          question: "What happens if my internet disconnects during mediation?",
          answer: "Your progress is automatically saved. When you reconnect, you can pick up exactly where you left off. The other person will see a message that you disconnected and can wait for you to return. If you're unable to reconnect, you can continue the conversation later when your internet is working again."
        },
        {
          question: "Can I access Meedi8 offline?",
          answer: "Basic features like viewing your past conversations and summaries are available offline. However, you need an internet connection to participate in live mediation sessions or coaching with Meedi since these require AI responses in real time."
        }
      ]
    },
    {
      title: "Limitations & Appropriate Use",
      color: "#8B5CF6", // Purple/Violet
      questions: [
        {
          question: "Is Meedi8 a replacement for couples therapy or counseling?",
          answer: "No. Meedi8 is designed to help with everyday conflicts and communication challenges, but it's not a substitute for professional therapy. If you're dealing with trauma, mental health conditions, ongoing abuse, or deep relationship issues, we strongly recommend working with a licensed therapist. Meedi8 can complement therapy but shouldn't replace it for serious situations."
        },
        {
          question: "Can I use mediation transcripts in court or legal proceedings?",
          answer: "We don't recommend using Meedi8 conversations as legal evidence. The platform is designed for informal conflict resolution and honest communication, not legal proceedings. If your situation involves custody, divorce, or other legal matters, you should work with a qualified mediator or lawyer. Check with legal professionals before sharing any transcripts."
        },
        {
          question: "What types of conflicts is Meedi8 NOT suitable for?",
          answer: "Meedi8 is not appropriate for situations involving active abuse, violence, or threats, ongoing domestic violence or coercive control, severe mental health crises, legal disputes requiring formal mediation or court involvement, situations where one person has significant power over the other's safety or wellbeing, or conflicts involving children's immediate safety. For these situations, please contact appropriate professionals, legal services, or emergency support."
        },
        {
          question: "What age do I need to be to use Meedi8?",
          answer: "You must be 18 years or older to create a Meedi8 account and use the service. If you're under 18 and experiencing conflict, please talk to a trusted adult, school counselor, or contact youth support services in your area."
        }
      ]
    },
    {
      title: "Practical Usage",
      color: "#14B8A6", // Teal
      questions: [
        {
          question: "What if we don't reach an agreement?",
          answer: "That's okay. Not every conflict resolves in one session. You can take a break and return to the conversation later when you're both ready. You can also schedule a check-in date to try again. If you remain stuck, Meedi8 can suggest bringing in a human mediator or counselor who specializes in your type of conflict. Sometimes just understanding each other better is progress, even without full resolution."
        },
        {
          question: "Can I start a new mediation with the same person later?",
          answer: "Yes. You can start as many mediation conversations as you need with the same person. Each conversation is separate, so you can address different issues or revisit the same topic after time has passed. Your previous conversations remain in your history unless you delete them."
        },
        {
          question: "What happens after we reach a resolution?",
          answer: "Once you both agree on a resolution, Meedi8 helps you document what you've agreed to in clear terms. You can both digitally acknowledge the agreement and set a check-in date to review how it's going. You'll receive a reminder on that date to discuss whether the agreement is working. You can download a summary of your agreement as a PDF."
        },
        {
          question: "Can I get a transcript of the session?",
          answer: "Yes! After each mediation session, you can download a full transcript in PDF format. This allows both parties to review what was discussed and reference any agreements or action items."
        },
        {
          question: "Can I share my mediation with a therapist or counselor?",
          answer: "Yes. You can download transcripts and summaries of your mediation sessions to share with your therapist or counselor. This can help them understand your situation better and provide more targeted support. Make sure the other person is aware if you plan to share conversations that include their input."
        },
        {
          question: "How do check-ins work after we agree on something?",
          answer: "When you reach an agreement, you can choose to schedule a check-in for a week, two weeks, or a month later. On that date, both of you will receive a reminder to discuss how the agreement is working. You can start a new brief conversation to share what's going well and what might need adjusting. Check-ins help make sure agreements actually work in real life."
        }
      ]
    },
    {
      title: "Account & Subscription",
      color: "#EC4899", // Pink
      questions: [
        {
          question: "How much does it cost?",
          answer: "We offer flexible pricing plans to fit your needs. You can view our subscription options on the Pricing page, with plans starting from basic mediation access to premium features with unlimited sessions."
        },
        {
          question: "Can I cancel my subscription anytime?",
          answer: "Yes. You can cancel your subscription at any time from your account settings. If you cancel, you'll keep access to premium features until the end of your billing period. After that, your account reverts to the free tier. Your conversation history and data remain unless you choose to delete them."
        },
        {
          question: "What's the difference between free and paid plans?",
          answer: "The free tier gives you 1 active mediation per month with basic features and includes ads. Paid plans offer unlimited mediations, conversation history, advanced emotional insights, voice-to-text features, priority human support, and no ads. Premium plans also include relationship pattern tracking and faster access to professional help when needed. Family plans support up to 4 users in one household."
        },
        {
          question: "Do both people need to pay, or just one?",
          answer: "Only one person needs a paid subscription. When you create a mediation and invite someone, they can participate fully regardless of whether they have a paid account. Your subscription covers that conversation. However, if they want to start their own mediations, they would need their own subscription."
        },
        {
          question: "What happens to my data if I cancel?",
          answer: "Your data remains in your account if you cancel your subscription. You'll revert to the free tier and can still access your conversation history, though you'll be limited to 1 active mediation per month going forward. If you want to permanently delete your data, you need to delete your account separately from the account settings page."
        }
      ]
    },
    {
      title: "Special Situations",
      color: "#06B6D4", // Cyan
      questions: [
        {
          question: "Can I use this for workplace conflicts?",
          answer: "Yes. Meedi8 can help with workplace interpersonal conflicts like disagreements with colleagues, communication issues with managers, or team friction. Choose \"Work\" as your topic category when creating a mediation. However, for formal workplace disputes involving HR, discrimination, or legal issues, you should follow your company's official procedures."
        },
        {
          question: "Can I mediate with family members like parents or siblings?",
          answer: "Yes. Meedi8 works for family conflicts including parent-adult child relationships, sibling disputes, extended family disagreements, and household conflicts. Choose \"Family\" as your category. However, Meedi8 is designed for adults (18+) and not suitable for conflicts involving minor children's welfare or safety, which require professional family services."
        },
        {
          question: "Can I invite a supporter or advocate to join?",
          answer: "Currently, Meedi8 mediations are designed for two people. However, you can share transcripts with a trusted friend, therapist, or advocate outside the session. Family plans support multiple household members who can mediate in different combinations. If you need formal mediation with multiple parties or advocates present, we recommend working with a professional human mediator."
        }
      ]
    }
  ];

  const toggleQuestion = (sectionIndex, questionIndex) => {
    const key = `${sectionIndex}-${questionIndex}`;
    setOpenIndex(openIndex === key ? null : key);
  };

  return (
    <div style={styles.container}>
      {/* Top ellipse for depth */}
      <div style={styles.topEllipse} />

      {/* Main content */}
      <div style={styles.content}>
        {/* Heading */}
        <h1 style={styles.heading}>FAQ</h1>

        {/* FAQ Sections */}
        {faqSections.map((section, sectionIndex) => (
          <div key={sectionIndex} style={styles.section}>
            {/* Section Header */}
            <h2 style={{...styles.sectionTitle, color: section.color}}>
              {section.title}
            </h2>

            {/* Questions in this section */}
            <div style={styles.faqList}>
              {section.questions.map((faq, questionIndex) => {
                const key = `${sectionIndex}-${questionIndex}`;
                const isOpen = openIndex === key;

                return (
                  <div
                    key={questionIndex}
                    style={{
                      ...styles.faqItem,
                      backgroundColor: isOpen ? '#FFFFFF' : section.color,
                    }}
                  >
                    <button
                      onClick={() => toggleQuestion(sectionIndex, questionIndex)}
                      style={styles.questionButton}
                      aria-expanded={isOpen}
                    >
                      <h3 style={{
                        ...styles.question,
                        color: isOpen ? section.color : '#FFFFFF',
                      }}>{faq.question}</h3>
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        style={{
                          ...styles.icon,
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
                      >
                        <path
                          d="M6 9L12 15L18 9"
                          stroke={isOpen ? section.color : '#FFFFFF'}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>

                    {isOpen && (
                      <p style={styles.answer}>{faq.answer}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
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
  heading: {
    fontSize: 'clamp(48px, 10vw, 72px)',
    fontWeight: '300',
    color: '#7DD3C0',
    lineHeight: '1.2',
    margin: '0 0 48px 0',
    textAlign: 'center',
    fontFamily: "'Nunito', sans-serif",
  },
  section: {
    width: '100%',
    marginBottom: '48px',
  },
  sectionTitle: {
    fontSize: 'clamp(24px, 5vw, 32px)',
    fontWeight: '700',
    lineHeight: '1.3',
    margin: '0 0 24px 0',
    fontFamily: "'Nunito', sans-serif",
  },
  faqList: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
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
    fontSize: 'clamp(16px, 3.5vw, 19px)',
    fontWeight: '700',
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
    fontSize: 'clamp(14px, 3vw, 16px)',
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: '1.7',
    margin: '16px 0 0 0',
    fontFamily: "'Nunito', sans-serif",
  },
};
