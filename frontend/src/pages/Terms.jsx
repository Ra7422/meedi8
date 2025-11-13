import React from "react";
import { Link } from "react-router-dom";

/**
 * Terms and Conditions Page
 *
 * Comprehensive legal document covering:
 * - UK jurisdiction (England & Wales)
 * - GDPR/Data Protection Act 2018 compliance
 * - AI disclaimers (not therapy, no emergency services, no legal advice)
 * - Global liability limitations
 * - Dispute resolution (mediation then court)
 * - User responsibilities and prohibited uses
 */
export default function Terms() {
  const lastUpdated = "13 November 2025";

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>Terms and Conditions</h1>
        <p style={styles.lastUpdated}>Last Updated: {lastUpdated}</p>

        <div style={styles.section}>
          <h2 style={styles.heading}>1. Agreement to Terms</h2>
          <p style={styles.text}>
            These Terms and Conditions ("Terms") constitute a legally binding agreement between you ("User", "you", or "your")
            and SafeGuardAi (Mira) Ltd, a company registered in England and Wales under company number 16727981, with registered office at
            [REGISTERED ADDRESS] ("Meedi8", "we", "us", or "our"). By accessing or using the Meedi8 platform
            (the "Service"), you acknowledge that you have read, understood, and agree to be bound by these Terms.
          </p>
          <p style={styles.text}>
            <strong>IF YOU DO NOT AGREE TO THESE TERMS, DO NOT USE THE SERVICE.</strong> Your continued use of the Service
            constitutes acceptance of these Terms and any amendments thereto.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.heading}>2. Eligibility and User Capacity</h2>
          <p style={styles.text}>
            <strong>2.1 Age Requirement:</strong> You must be at least 18 years of age to use the Service. By using the Service,
            you represent and warrant that you have the legal capacity to enter into a binding contract.
          </p>
          <p style={styles.text}>
            <strong>2.2 Prohibited Jurisdictions:</strong> You may not access the Service from any jurisdiction where it is illegal
            or prohibited. It is your responsibility to comply with local laws.
          </p>
          <p style={styles.text}>
            <strong>2.3 Account Accuracy:</strong> You agree to provide accurate, current, and complete information during registration
            and to update such information to maintain its accuracy.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.heading}>3. Nature of Service and Critical Disclaimers</h2>

          <p style={styles.text}>
            <strong>3.1 NOT PROFESSIONAL THERAPY OR COUNSELING:</strong> THE SERVICE IS NOT A SUBSTITUTE FOR PROFESSIONAL MENTAL HEALTH
            TREATMENT, THERAPY, COUNSELING, OR MEDICAL ADVICE. Our AI-powered mediation tool is designed for general conflict resolution
            between consenting adults and does not constitute professional psychological services. We are not licensed therapists,
            counselors, psychologists, or healthcare providers.
          </p>

          <p style={styles.text}>
            <strong>3.2 NOT FOR EMERGENCY SITUATIONS:</strong> THE SERVICE IS NOT DESIGNED FOR, AND MUST NOT BE USED IN, EMERGENCY
            SITUATIONS INCLUDING BUT NOT LIMITED TO:
          </p>
          <ul style={styles.list}>
            <li style={styles.listItem}>Suicidal ideation or self-harm risk</li>
            <li style={styles.listItem}>Active domestic violence or abuse</li>
            <li style={styles.listItem}>Child safety concerns</li>
            <li style={styles.listItem}>Mental health crises requiring immediate intervention</li>
            <li style={styles.listItem}>Situations involving threats of violence</li>
          </ul>
          <p style={styles.text}>
            <strong>IF YOU ARE IN CRISIS, CONTACT EMERGENCY SERVICES IMMEDIATELY:</strong> UK: 999 or 111 (NHS), Samaritans: 116 123,
            National Domestic Abuse Helpline: 0808 2000 247. US: 988 Suicide & Crisis Lifeline, 911 Emergency Services.
          </p>

          <p style={styles.text}>
            <strong>3.3 NOT LEGAL ADVICE:</strong> The Service does not provide legal advice, legal mediation, or legal representation.
            Nothing in the Service should be construed as creating an attorney-client relationship. For legal disputes, consult a
            qualified legal professional or accredited mediator.
          </p>

          <p style={styles.text}>
            <strong>3.4 AI LIMITATIONS:</strong> Our Service uses artificial intelligence (AI) technology provided by third parties
            (Anthropic's Claude, OpenAI's Whisper). AI systems may:
          </p>
          <ul style={styles.list}>
            <li style={styles.listItem}>Generate inaccurate, incomplete, or misleading information</li>
            <li style={styles.listItem}>Misinterpret context, tone, or intent</li>
            <li style={styles.listItem}>Fail to detect harmful content or behavior</li>
            <li style={styles.listItem}>Experience technical failures or service interruptions</li>
            <li style={styles.listItem}>Produce biased or culturally insensitive responses</li>
          </ul>
          <p style={styles.text}>
            YOU ACKNOWLEDGE AND ACCEPT THESE LIMITATIONS AND AGREE THAT MEEDI8 IS NOT RESPONSIBLE FOR ANY CONSEQUENCES ARISING FROM
            AI-GENERATED CONTENT.
          </p>

          <p style={styles.text}>
            <strong>3.5 User Responsibility:</strong> You are solely responsible for evaluating the suitability, accuracy, and usefulness
            of any information provided by the Service. You should independently verify any important information before acting upon it.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.heading}>4. User Conduct and Prohibited Uses</h2>
          <p style={styles.text}>You agree NOT to use the Service to:</p>
          <ul style={styles.list}>
            <li style={styles.listItem}>Harass, abuse, threaten, or intimidate other users</li>
            <li style={styles.listItem}>Post or transmit hateful, discriminatory, or offensive content</li>
            <li style={styles.listItem}>Violate any applicable local, national, or international law</li>
            <li style={styles.listItem}>Impersonate any person or entity, or falsely represent your affiliation</li>
            <li style={styles.listItem}>Upload malicious code, viruses, or attempt to compromise system security</li>
            <li style={styles.listItem}>Access another user's account without authorization</li>
            <li style={styles.listItem}>Reverse engineer, decompile, or extract source code from the Service</li>
            <li style={styles.listItem}>Use automated systems (bots, scrapers) without our written permission</li>
            <li style={styles.listItem}>Resell, redistribute, or commercialize the Service without authorization</li>
            <li style={styles.listItem}>Share content that violates intellectual property rights</li>
            <li style={styles.listItem}>Interfere with or disrupt the Service or servers</li>
          </ul>
          <p style={styles.text}>
            <strong>Violation of these prohibitions may result in immediate termination of your account and potential legal action.</strong>
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.heading}>5. Data Privacy and GDPR Compliance</h2>
          <p style={styles.text}>
            <strong>5.1 Data Controller:</strong> Meedi8 is the data controller for personal data processed through the Service,
            operating under the UK Data Protection Act 2018 and UK GDPR.
          </p>
          <p style={styles.text}>
            <strong>5.2 Data Collection:</strong> We collect and process: account information (name, email), OAuth authentication tokens,
            conversation transcripts, voice recordings, usage analytics, and payment information (processed by Stripe).
          </p>
          <p style={styles.text}>
            <strong>5.3 Legal Basis:</strong> We process your data based on: (a) contractual necessity to provide the Service;
            (b) legitimate interests in improving our Service; (c) legal obligations; and (d) your consent where required.
          </p>
          <p style={styles.text}>
            <strong>5.4 Third-Party Processors:</strong> We use third-party services including Anthropic (AI), OpenAI (voice transcription),
            AWS (storage), Stripe (payments), and SendGrid (email). These processors comply with applicable data protection laws.
          </p>
          <p style={styles.text}>
            <strong>5.5 Data Retention:</strong> Conversation transcripts are automatically deleted based on your subscription tier
            (7-90 days). Account data is retained until you request deletion.
          </p>
          <p style={styles.text}>
            <strong>5.6 Your Rights (GDPR):</strong> You have the right to:
          </p>
          <ul style={styles.list}>
            <li style={styles.listItem}><strong>Access:</strong> Request a copy of your personal data</li>
            <li style={styles.listItem}><strong>Rectification:</strong> Correct inaccurate data</li>
            <li style={styles.listItem}><strong>Erasure ("Right to be Forgotten"):</strong> Request deletion of your account and data</li>
            <li style={styles.listItem}><strong>Portability:</strong> Receive your data in a machine-readable format</li>
            <li style={styles.listItem}><strong>Object:</strong> Object to processing based on legitimate interests</li>
            <li style={styles.listItem}><strong>Complain:</strong> Lodge a complaint with the ICO (Information Commissioner's Office)</li>
          </ul>
          <p style={styles.text}>
            To exercise these rights, contact us at: support@meedi8.com
          </p>
          <p style={styles.text}>
            <strong>5.7 International Transfers:</strong> Your data may be transferred to and processed in countries outside the UK/EEA,
            including the United States. We ensure appropriate safeguards are in place (e.g., Standard Contractual Clauses).
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.heading}>6. Intellectual Property Rights</h2>
          <p style={styles.text}>
            <strong>6.1 Our IP:</strong> All content, features, functionality, software, trademarks, logos, and design elements of the
            Service are owned by Meedi8 or our licensors and are protected by UK, US, and international copyright, trademark, and other
            intellectual property laws.
          </p>
          <p style={styles.text}>
            <strong>6.2 Limited License:</strong> We grant you a limited, non-exclusive, non-transferable, revocable license to access
            and use the Service for personal, non-commercial purposes, subject to these Terms.
          </p>
          <p style={styles.text}>
            <strong>6.3 User Content:</strong> You retain ownership of content you submit ("User Content"). By submitting User Content,
            you grant Meedi8 a worldwide, non-exclusive, royalty-free license to use, reproduce, process, and store such content solely
            to provide and improve the Service.
          </p>
          <p style={styles.text}>
            <strong>6.4 AI-Generated Content:</strong> Content generated by AI during your use of the Service is provided "as is" for
            your personal use. Meedi8 makes no claims of ownership over AI-generated suggestions but retains rights to anonymized,
            aggregated data for service improvement.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.heading}>7. Payment Terms and Subscriptions</h2>
          <p style={styles.text}>
            <strong>7.1 Pricing:</strong> Current subscription tiers and pricing are displayed on our website. Prices are in GBP (£)
            and exclude applicable VAT/taxes unless stated otherwise.
          </p>
          <p style={styles.text}>
            <strong>7.2 Billing:</strong> Subscriptions are billed monthly in advance via Stripe. You authorize us to charge your
            payment method for recurring fees until you cancel.
          </p>
          <p style={styles.text}>
            <strong>7.3 Free Tier Limitations:</strong> Free accounts have usage limits (1 room/month, text-only). We reserve the right
            to modify free tier features at any time.
          </p>
          <p style={styles.text}>
            <strong>7.4 Cancellation:</strong> You may cancel your subscription at any time through your account settings. Cancellation
            takes effect at the end of the current billing period. No refunds for partial months.
          </p>
          <p style={styles.text}>
            <strong>7.5 Price Changes:</strong> We may change pricing with 30 days' notice. Continued use after notice constitutes
            acceptance of new pricing.
          </p>
          <p style={styles.text}>
            <strong>7.6 Refund Policy:</strong> All sales are final. Refunds are granted solely at our discretion in cases of service
            failure or billing errors.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.heading}>8. Limitation of Liability (UK and International)</h2>

          <p style={styles.text}>
            <strong>8.1 NO LIABILITY FOR CONSEQUENTIAL DAMAGES:</strong> TO THE MAXIMUM EXTENT PERMITTED BY LAW, MEEDI8 SHALL NOT BE
            LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
          </p>
          <ul style={styles.list}>
            <li style={styles.listItem}>Loss of profits, revenue, or business opportunities</li>
            <li style={styles.listItem}>Loss of data or use of the Service</li>
            <li style={styles.listItem}>Personal injury or emotional distress</li>
            <li style={styles.listItem}>Relationship breakdown or conflict escalation</li>
            <li style={styles.listItem}>Costs of substitute services</li>
            <li style={styles.listItem}>Any damages arising from reliance on AI-generated content</li>
          </ul>

          <p style={styles.text}>
            <strong>8.2 LIMITATION OF DIRECT DAMAGES:</strong> Our total liability to you for any claim arising from or related to the
            Service shall not exceed the greater of: (a) £100 GBP; or (b) the amount you paid to Meedi8 in the 12 months preceding the claim.
          </p>

          <p style={styles.text}>
            <strong>8.3 UK Consumer Rights:</strong> Nothing in these Terms excludes or limits our liability for: (a) death or personal
            injury caused by our negligence; (b) fraud or fraudulent misrepresentation; or (c) any other liability that cannot be excluded
            under UK law (Consumer Rights Act 2015).
          </p>

          <p style={styles.text}>
            <strong>8.4 No Warranty:</strong> THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS
            OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT,
            OR SECURITY. We do not warrant that the Service will be uninterrupted, error-free, or secure.
          </p>

          <p style={styles.text}>
            <strong>8.5 Third-Party Services:</strong> We are not responsible for the availability, accuracy, or content of third-party
            services integrated with Meedi8 (Anthropic, OpenAI, Stripe, etc.). Your use of such services is subject to their respective
            terms and privacy policies.
          </p>

          <p style={styles.text}>
            <strong>8.6 Force Majeure:</strong> We shall not be liable for any failure or delay in performance due to circumstances beyond
            our reasonable control, including but not limited to acts of God, war, terrorism, pandemics, government actions, internet
            failures, or third-party service outages.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.heading}>9. Indemnification</h2>
          <p style={styles.text}>
            You agree to indemnify, defend, and hold harmless Meedi8, its directors, officers, employees, agents, and licensors from and
            against any claims, liabilities, damages, losses, costs, or expenses (including reasonable legal fees) arising from:
          </p>
          <ul style={styles.list}>
            <li style={styles.listItem}>Your use or misuse of the Service</li>
            <li style={styles.listItem}>Your violation of these Terms</li>
            <li style={styles.listItem}>Your violation of any third-party rights, including intellectual property or privacy rights</li>
            <li style={styles.listItem}>Your User Content</li>
            <li style={styles.listItem}>Any disputes between you and other users</li>
          </ul>
          <p style={styles.text}>
            This indemnification obligation survives termination of these Terms and your use of the Service.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.heading}>10. Dispute Resolution and Governing Law</h2>

          <p style={styles.text}>
            <strong>10.1 Governing Law:</strong> These Terms shall be governed by and construed in accordance with the laws of England
            and Wales, without regard to conflict of law principles.
          </p>

          <p style={styles.text}>
            <strong>10.2 Jurisdiction:</strong> Subject to clause 10.3 below, the courts of England and Wales shall have exclusive
            jurisdiction to settle any dispute or claim arising from or in connection with these Terms.
          </p>

          <p style={styles.text}>
            <strong>10.3 Mandatory Mediation Before Litigation:</strong> Before commencing any court proceedings, the parties agree to
            first attempt to resolve the dispute through good faith mediation administered by the Centre for Effective Dispute Resolution
            (CEDR) or another mutually agreed mediation service. Each party shall bear their own costs of mediation, with any shared costs
            split equally.
          </p>

          <p style={styles.text}>
            <strong>10.4 International Users:</strong> If you are accessing the Service from outside the UK, you acknowledge that your use
            may be subject to local laws, and you are solely responsible for compliance with such laws. You consent to the application of
            English law and the jurisdiction of English courts regardless of your location.
          </p>

          <p style={styles.text}>
            <strong>10.5 Class Action Waiver:</strong> You agree to bring claims against Meedi8 only in your individual capacity and not
            as part of any class or representative action. This waiver applies to the fullest extent permitted by applicable law.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.heading}>11. Termination and Suspension</h2>

          <p style={styles.text}>
            <strong>11.1 Termination by You:</strong> You may terminate your account at any time by contacting us at support@meedi8.com or
            using the account deletion feature in your profile settings.
          </p>

          <p style={styles.text}>
            <strong>11.2 Termination by Us:</strong> We reserve the right to suspend or terminate your account immediately, without notice,
            if we reasonably believe you have:
          </p>
          <ul style={styles.list}>
            <li style={styles.listItem}>Violated these Terms or any applicable law</li>
            <li style={styles.listItem}>Engaged in fraudulent or abusive behavior</li>
            <li style={styles.listItem}>Created a security risk or exposed us to legal liability</li>
            <li style={styles.listItem}>Failed to pay outstanding fees</li>
          </ul>

          <p style={styles.text}>
            <strong>11.3 Effect of Termination:</strong> Upon termination: (a) your right to use the Service ceases immediately;
            (b) we may delete your account and data (subject to legal retention requirements); (c) no refunds will be issued for
            prepaid fees; and (d) clauses that by their nature should survive (indemnification, limitation of liability, governing law)
            shall remain in effect.
          </p>

          <p style={styles.text}>
            <strong>11.4 Data Retention After Termination:</strong> We may retain certain data for legal, accounting, or backup purposes
            for up to 90 days after termination, after which it will be permanently deleted unless legally required to retain longer.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.heading}>12. Changes to Terms</h2>
          <p style={styles.text}>
            We reserve the right to modify these Terms at any time. We will notify you of material changes by:
          </p>
          <ul style={styles.list}>
            <li style={styles.listItem}>Posting updated Terms on this page with a new "Last Updated" date</li>
            <li style={styles.listItem}>Sending email notification to your registered email address</li>
            <li style={styles.listItem}>Displaying an in-app notification upon your next login</li>
          </ul>
          <p style={styles.text}>
            Your continued use of the Service after changes take effect constitutes acceptance of the revised Terms. If you do not agree
            to the changes, you must stop using the Service and terminate your account.
          </p>
          <p style={styles.text}>
            <strong>Changes will take effect 30 days after notification, except where required by law to be immediate.</strong>
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.heading}>13. Miscellaneous Provisions</h2>

          <p style={styles.text}>
            <strong>13.1 Entire Agreement:</strong> These Terms, together with our Privacy Policy, constitute the entire agreement between
            you and Meedi8 and supersede all prior agreements, understandings, or representations.
          </p>

          <p style={styles.text}>
            <strong>13.2 Severability:</strong> If any provision of these Terms is found to be invalid or unenforceable by a court, the
            remaining provisions shall remain in full force and effect. The invalid provision shall be modified to the minimum extent
            necessary to make it enforceable.
          </p>

          <p style={styles.text}>
            <strong>13.3 Waiver:</strong> Our failure to enforce any right or provision of these Terms shall not constitute a waiver of
            such right or provision. Any waiver must be in writing and signed by an authorized representative of Meedi8.
          </p>

          <p style={styles.text}>
            <strong>13.4 Assignment:</strong> You may not assign or transfer these Terms or your account without our prior written consent.
            We may assign these Terms or any rights hereunder to any successor entity or purchaser of our business without your consent.
          </p>

          <p style={styles.text}>
            <strong>13.5 No Partnership:</strong> These Terms do not create any agency, partnership, joint venture, or employment
            relationship between you and Meedi8.
          </p>

          <p style={styles.text}>
            <strong>13.6 Notices:</strong> Legal notices to Meedi8 must be sent by registered post to our registered office address (see section 14 below).
            Notices to you will be sent to your registered email address. Email notices are deemed received 24 hours after sending.
          </p>

          <p style={styles.text}>
            <strong>13.7 Language:</strong> These Terms are written in English. Any translation is provided for convenience only. In case
            of conflict, the English version shall prevail.
          </p>

          <p style={styles.text}>
            <strong>13.8 Survival:</strong> Clauses 5 (Data Privacy), 6 (Intellectual Property), 8 (Limitation of Liability), 9
            (Indemnification), 10 (Governing Law), and 13 (Miscellaneous) shall survive termination of these Terms.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.heading}>14. Contact Information</h2>
          <p style={styles.text}>
            If you have any questions about these Terms, please contact us:
          </p>
          <p style={styles.text}>
            <strong>Email:</strong> support@meedi8.com<br />
            <strong>Company Name:</strong> SafeGuardAi (Mira) Ltd<br />
            <strong>Company Number:</strong> 16727981 (England and Wales)<br />
            <strong>Registered Address:</strong> [REGISTERED ADDRESS - To be provided]<br />
            <strong>Data Protection Officer:</strong> dpo@meedi8.com
          </p>
        </div>

        <div style={styles.acknowledgment}>
          <p style={styles.text}>
            <strong>ACKNOWLEDGMENT:</strong> BY CLICKING "I AGREE" OR BY ACCESSING OR USING THE SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE
            READ THESE TERMS, UNDERSTAND THEM, AND AGREE TO BE BOUND BY THEM. YOU FURTHER ACKNOWLEDGE THAT THESE TERMS CONSTITUTE A
            BINDING LEGAL AGREEMENT BETWEEN YOU AND MEEDI8.
          </p>
        </div>

        <div style={styles.footer}>
          <Link to="/signup" style={styles.backLink}>← Back to Sign Up</Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #EAF7F0 0%, #ffffff 100%)',
    padding: '40px 20px',
    fontFamily: "'Nunito', sans-serif",
  },
  content: {
    maxWidth: '900px',
    margin: '0 auto',
    background: 'white',
    borderRadius: '12px',
    padding: '40px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: '32px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '8px',
    textAlign: 'center',
  },
  lastUpdated: {
    fontSize: '14px',
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: '32px',
    fontStyle: 'italic',
  },
  section: {
    marginBottom: '32px',
  },
  heading: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '12px',
    marginTop: '24px',
  },
  text: {
    fontSize: '13px',
    lineHeight: '1.6',
    color: '#374151',
    marginBottom: '12px',
  },
  list: {
    fontSize: '13px',
    lineHeight: '1.6',
    color: '#374151',
    marginLeft: '20px',
    marginBottom: '12px',
  },
  listItem: {
    marginBottom: '6px',
  },
  acknowledgment: {
    background: '#FEF3C7',
    border: '2px solid #F59E0B',
    borderRadius: '8px',
    padding: '20px',
    marginTop: '32px',
    marginBottom: '32px',
  },
  footer: {
    textAlign: 'center',
    marginTop: '32px',
    paddingTop: '24px',
    borderTop: '1px solid #e5e7eb',
  },
  backLink: {
    color: '#7DD3C0',
    textDecoration: 'none',
    fontSize: '16px',
    fontWeight: '500',
  },
};
