import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';

// Import illustrations (mix of PNG and SVG)
import WelcomeIllustration from '../assets/illustrations/welcome-screening.svg';
import MentalHealthIllustration from '../assets/illustrations/mental-health-icon.png';
import CommunicationIllustration from '../assets/illustrations/communication-icon.png';
import SubstanceIllustration from '../assets/illustrations/substance-check-icon.png';
import SafetyIllustration from '../assets/illustrations/safety-check-icon.png';

/**
 * Custom Dropdown Component
 * Fully styled dropdown to replace native <select> for purple theme control
 */
function CustomDropdown({ value, onChange, options, label, styles }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={styles.customSelect}
      >
        <span>{selectedOption?.label || 'Select...'}</span>
        <span style={styles.dropdownArrow}>{isOpen ? '▲' : '▼'}</span>
      </div>

      {isOpen && (
        <div style={styles.dropdownMenu}>
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              style={{
                ...styles.dropdownOption,
                ...(value === option.value ? styles.dropdownOptionSelected : {}),
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * CLINICAL SCREENING CAROUSEL
 * Gamified horizontal slide interface for safety screening
 *
 * 5 Slides:
 * 1. Welcome & Context
 * 2. Mental Health
 * 3. Communication History
 * 4. Substance Use
 * 5. Safety Check
 */

export default function ScreeningCarousel() {
  const navigate = useNavigate();
  const { token, user, setUser } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [completedSlides, setCompletedSlides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [existingProfile, setExistingProfile] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);

  // Form data state
  const [formData, setFormData] = useState({
    // Slide 2: Mental Health
    has_mental_health_condition: false, // Default to false instead of null
    mental_health_conditions: [],
    currently_in_treatment: false,
    treatment_types: [],
    has_crisis_plan: false,
    emergency_contact_available: false,

    // Slide 3: Communication History
    verbal_aggression_history: 'never',
    physical_aggression_history: 'never',

    // Slide 4: Substance Use
    alcohol_use: 'none',
    drug_use: 'none',
    substance_details: [],
    substances_affect_behavior: false,
    need_substance_help: false,

    // Slide 5: Safety Check
    feeling_state: 'okay',
    feels_safe_today: true,
    feels_generally_safe: true,
    has_safety_plan: false,
    under_substance_influence: false,
    recent_crisis: false,
    recent_aggression: false,
    concerns_about_other_person: false,
    willing_to_proceed: true,
  });

  // Styles - defined early so slides can reference them
  const styles = {
    container: {
      minHeight: 'calc(100vh - 80px)', // Subtract header height
      background: 'linear-gradient(180deg, #EAF7F0 0%, #ffffff 100%)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Nunito', sans-serif",
      overflow: 'hidden',
    },
    progressBar: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px 20px 10px 20px',
      gap: '12px',
    },
    progressDot: {
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
    },
    dotFilled: {
      backgroundColor: '#D3C1FF',
    },
    dotCurrent: {
      backgroundColor: '#D3C1FF',
      transform: 'scale(1.3)',
      boxShadow: '0 0 8px rgba(211, 193, 255, 0.5)',
    },
    dotEmpty: {
      backgroundColor: 'transparent',
      border: '2px solid #D3C1FF',
    },
    stepIndicator: {
      textAlign: 'center',
      fontSize: '14px',
      color: '#666',
      marginBottom: '4px',
    },
    carouselContainer: {
      flex: 1,
      overflow: 'auto',
      position: 'relative',
      display: 'flex',
      alignItems: 'flex-start',
      padding: '10px 20px 0 20px',
    },
    slidesWrapper: {
      display: 'flex',
      transition: 'transform 0.3s ease-in-out',
      width: '100%',
    },
    slide: {
      minWidth: '100%',
      maxWidth: '600px',
      margin: '0 auto',
      padding: '20px',
    },
    slideContent: {
      textAlign: 'center',
    },
    iconLarge: {
      width: '200px',
      height: '200px',
      marginBottom: '16px',
      display: 'block',
      margin: '0 auto 16px auto',
    },
    iconMedium: {
      width: '150px',
      height: '150px',
      marginBottom: '12px',
      display: 'block',
      margin: '0 auto 12px auto',
    },
    slideTitle: {
      fontSize: '24px',
      color: '#333',
      marginBottom: '10px',
      fontWeight: '600',
    },
    slideDescription: {
      fontSize: '15px',
      color: '#666',
      marginBottom: '16px',
      lineHeight: '1.4',
    },
    benefitsList: {
      textAlign: 'left',
      maxWidth: '400px',
      margin: '16px auto',
    },
    benefit: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '10px',
      fontSize: '16px',
      color: '#333',
    },
    checkmark: {
      color: '#7DD3C0',
      fontSize: '24px',
      marginRight: '12px',
      fontWeight: 'bold',
    },
    privacyNote: {
      fontSize: '13px',
      color: '#666',
      marginTop: '16px',
    },
    questionGroup: {
      marginBottom: '16px',
      textAlign: 'left',
    },
    selectLabel: {
      display: 'block',
      fontSize: '16px',
      color: '#6750A4',
      marginBottom: '8px',
      fontWeight: '600',
      fontFamily: "'Nunito', sans-serif",
    },
    select: {
      width: '100%',
      padding: '32px 16px',
      borderRadius: '12px',
      border: '2px solid #D3C1FF',
      fontSize: '16px',
      backgroundColor: '#F5EFFF',
      color: '#6750A4',
      cursor: 'pointer',
      transition: 'all 0.3s',
      fontWeight: '600',
      fontFamily: "'Nunito', sans-serif",
    },
    selectOption: {
      backgroundColor: '#F5EFFF',
      color: '#6750A4',
      padding: '16px',
      fontFamily: "'Nunito', sans-serif",
      fontWeight: '600',
      fontSize: '16px',
    },
    // Custom Dropdown Styles
    customSelect: {
      width: '100%',
      padding: '32px 16px',
      borderRadius: '12px',
      border: '2px solid #D3C1FF',
      fontSize: '16px',
      backgroundColor: '#F5EFFF',
      color: '#6750A4',
      cursor: 'pointer',
      fontWeight: '600',
      fontFamily: "'Nunito', sans-serif",
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      userSelect: 'none',
    },
    dropdownArrow: {
      color: '#D3C1FF',
      fontSize: '14px',
      fontWeight: 'bold',
    },
    dropdownMenu: {
      position: 'absolute',
      top: '100%',
      left: '0',
      right: '0',
      backgroundColor: '#F5EFFF',
      border: '2px solid #D3C1FF',
      borderRadius: '12px',
      marginTop: '8px',
      maxHeight: '300px',
      overflowY: 'auto',
      zIndex: 1000,
      boxShadow: '0 4px 12px rgba(103, 80, 164, 0.2)',
    },
    dropdownOption: {
      padding: '16px',
      color: '#6750A4',
      cursor: 'pointer',
      fontFamily: "'Nunito', sans-serif",
      fontWeight: '600',
      fontSize: '16px',
      transition: 'background-color 0.2s',
      borderBottom: '1px solid #D3C1FF',
    },
    dropdownOptionSelected: {
      backgroundColor: '#D3C1FF',
      color: '#FFFFFF',
    },
    checkboxLabel: {
      display: 'flex',
      alignItems: 'center',
      padding: '12px',
      marginBottom: '8px',
      cursor: 'pointer',
      borderRadius: '8px',
      transition: 'background-color 0.2s',
      color: '#6750A4',
      fontWeight: '500',
      fontFamily: "'Nunito', sans-serif",
    },
    checkbox: {
      width: '20px',
      height: '20px',
      marginRight: '12px',
      cursor: 'pointer',
      accentColor: '#D3C1FF',
    },
    subQuestions: {
      marginLeft: '32px',
      marginTop: '16px',
      padding: '16px',
      backgroundColor: '#F5EFFF',
      borderRadius: '12px',
      border: '2px solid #D3C1FF',
    },
    subLabel: {
      fontSize: '14px',
      color: '#6750A4',
      marginBottom: '12px',
      fontWeight: '500',
      fontFamily: "'Nunito', sans-serif",
    },
    navigation: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '16px 20px',
      maxWidth: '600px',
      margin: '0 auto',
      width: '100%',
    },
    button: {
      padding: '16px 32px',
      borderRadius: '12px',
      border: 'none',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      minWidth: '120px',
      fontFamily: "'Nunito', sans-serif",
    },
    backButton: {
      background: 'transparent',
      color: '#D3C1FF',
      border: '2px solid #D3C1FF',
      boxShadow: 'none',
    },
    continueButton: {
      background: 'linear-gradient(135deg, #D3C1FF 0%, #B8A7E5 100%)',
      color: 'white',
      border: 'none',
      boxShadow: '0 4px 12px rgba(211, 193, 255, 0.3)',
    },
    buttonDisabled: {
      background: 'transparent',
      color: '#D1D5DB',
      cursor: 'not-allowed',
      border: '2px solid #D1D5DB',
      opacity: 0.5,
      boxShadow: 'none',
    },
    tealTitle: {
      fontSize: '28px',
      color: '#9CDAD5',
      marginBottom: '16px',
      fontWeight: '700',
      textAlign: 'center',
    },
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      marginTop: '16px',
    },
    profileNote: {
      fontSize: '14px',
      color: '#666',
      textAlign: 'center',
      marginTop: '16px',
      padding: '12px',
      backgroundColor: '#F5F5F5',
      borderRadius: '8px',
      lineHeight: '1.5',
    },
    therapySuggestion: {
      backgroundColor: '#F5EFFF',
      borderRadius: '12px',
      padding: '20px',
      marginTop: '16px',
      border: '2px solid #D3C1FF',
      textAlign: 'center',
    },
    therapyLogo: {
      width: '280px',
      height: 'auto',
      marginBottom: '16px',
    },
    therapyText: {
      fontSize: '15px',
      color: '#333',
      marginBottom: '16px',
      lineHeight: '1.6',
    },
    therapyLink: {
      display: 'inline-block',
      backgroundColor: '#D3C1FF',
      color: 'white',
      padding: '12px 24px',
      borderRadius: '8px',
      textDecoration: 'none',
      fontWeight: '600',
      fontSize: '15px',
      transition: 'background-color 0.2s',
    },
  };

  useEffect(() => {
    checkScreeningStatus();
  }, []);

  const checkScreeningStatus = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('/screening/check', 'GET', null, token);
      setHasProfile(response.has_existing_profile);
      setExistingProfile(response.profile);
    } catch (error) {
      console.error('Error checking screening status:', error);
    }
    setLoading(false);
  };

  const handleCheckboxChange = (field, value) => {
    setFormData(prev => {
      const currentValues = prev[field] || [];
      if (currentValues.includes(value)) {
        return { ...prev, [field]: currentValues.filter(v => v !== value) };
      } else {
        return { ...prev, [field]: [...currentValues, value] };
      }
    });
  };

  const canContinue = (slideIndex) => {
    // Slide 0 (Welcome) - always can continue
    if (slideIndex === 0) return true;

    // Slide 1 (Mental Health) - can always continue (optional questions)
    if (slideIndex === 1) return true;

    // Slide 2 (Communication) - must select options
    if (slideIndex === 2) {
      return formData.verbal_aggression_history && formData.physical_aggression_history;
    }

    // Slide 3 (Substance) - must select options
    if (slideIndex === 3) {
      return formData.alcohol_use && formData.drug_use;
    }

    // Slide 4 (Safety Check) - must select feeling state
    if (slideIndex === 4) {
      return formData.feeling_state !== '';
    }

    return true;
  };

  const nextSlide = () => {
    const totalSlides = 5; // Total number of slides
    if (currentSlide < totalSlides - 1 && canContinue(currentSlide)) {
      // Mark current slide as completed
      if (!completedSlides.includes(currentSlide)) {
        setCompletedSlides([...completedSlides, currentSlide]);
      }
      setCurrentSlide(currentSlide + 1);
    } else if (currentSlide === totalSlides - 1) {
      // Submit on last slide
      handleSubmit();
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      // For first-time screening (no room yet), don't send room_id
      // Room will be created later when user proceeds to create a mediation
      const payload = {
        room_id: null, // First-time screening has no room yet
        session_data: {
          room_id: null,
          is_returning_user: hasProfile,
          profile_still_accurate: hasProfile ? true : null,
          reported_changes: false,
          feeling_state: formData.feeling_state,
          feels_safe_today: formData.feels_safe_today,
          under_substance_influence: formData.under_substance_influence,
          recent_crisis: formData.recent_crisis,
          recent_aggression: formData.recent_aggression,
          concerns_about_other_person: formData.concerns_about_other_person,
          willing_to_proceed: formData.willing_to_proceed,
        }
      };

      if (!hasProfile) {
        payload.profile_data = {
          has_mental_health_condition: formData.has_mental_health_condition,
          mental_health_conditions: formData.mental_health_conditions,
          currently_in_treatment: formData.currently_in_treatment,
          treatment_types: formData.treatment_types,
          has_crisis_plan: formData.has_crisis_plan,
          emergency_contact_available: formData.emergency_contact_available,
          verbal_aggression_history: formData.verbal_aggression_history,
          physical_aggression_history: formData.physical_aggression_history,
          alcohol_use: formData.alcohol_use,
          drug_use: formData.drug_use,
          substance_details: formData.substance_details,
          substances_affect_behavior: formData.substances_affect_behavior,
          feels_generally_safe: formData.feels_generally_safe,
          has_safety_plan: formData.has_safety_plan,
          prefers_professional_mediator: false,
          comfortable_with_ai_mediation: true,
        };
      }

      const response = await apiRequest('/screening/complete', 'POST', payload, token);

      // Refresh user data to update has_completed_screening flag
      const updatedUser = await apiRequest('/auth/me', 'GET', null, token);
      setUser(updatedUser);

      // Set a flag to indicate screening was just completed (prevents loop)
      sessionStorage.setItem('screeningJustCompleted', 'true');

      // Check if there's a return destination (e.g., from profile page)
      const returnTo = sessionStorage.getItem('screeningReturnTo');
      if (returnTo) {
        sessionStorage.removeItem('screeningReturnTo');
        navigate(returnTo);
      } else {
        // Default: navigate to Home page
        navigate('/');
      }
    } catch (error) {
      console.error('Error submitting screening:', error);
      alert('Error: ' + error.message);
      setLoading(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' && canContinue(currentSlide)) {
        nextSlide();
      } else if (e.key === 'ArrowLeft' && currentSlide > 0) {
        prevSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, formData]);

  // Slide definitions
  const slides = [
    // SLIDE 0: Welcome
    {
      id: 'welcome',
      title: 'Let\'s make this work for you both',
      icon: 'welcome',
      content: (
        <div style={styles.slideContent}>
          <img src={WelcomeIllustration} alt="Welcome" style={styles.iconLarge} />
          <h2 style={styles.tealTitle}>Let's make this work for you both</h2>

          <div style={styles.card}>
            <p style={{ ...styles.slideDescription, marginBottom: '20px' }}>
              Before we begin mediation, we want to make sure everyone is in the right space for a productive conversation.
            </p>
            <div style={styles.benefitsList}>
              <div style={styles.benefit}>
                <span style={styles.checkmark}>✓</span>
                <span>Keep everyone safe</span>
              </div>
              <div style={styles.benefit}>
                <span style={styles.checkmark}>✓</span>
                <span>Provide the right support</span>
              </div>
              <div style={styles.benefit}>
                <span style={styles.checkmark}>✓</span>
                <span>Make mediation actually work</span>
              </div>
            </div>
            <p style={styles.privacyNote}>
              🔒 Your answers are private and help us help you.
            </p>
          </div>

          <div style={styles.profileNote}>
            ℹ️ This information is saved to your profile and only needs to be completed once. You can update it anytime in your profile settings.
          </div>
        </div>
      )
    },

    // SLIDE 1: Mental Health
    {
      id: 'mental_health',
      title: 'Mental Health',
      icon: 'mental_health',
      content: (
        <div style={styles.slideContent}>
          <img src={MentalHealthIllustration} alt="Mental Health" style={styles.iconMedium} />
          <h2 style={styles.tealTitle}>Mental Health Support</h2>

          <div style={styles.card}>
            <p style={{ ...styles.slideDescription, textAlign: 'center', color: '#888' }}>
              Understanding your mental health helps us provide better support
            </p>

            <div style={styles.questionGroup}>
              <label style={styles.selectLabel}>Do you have a mental health condition?</label>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="radio"
                    name="has_mental_health_condition"
                    checked={formData.has_mental_health_condition === true}
                    onChange={() => setFormData({ ...formData, has_mental_health_condition: true })}
                    style={styles.checkbox}
                  />
                  <span>Yes</span>
                </label>
                <label style={styles.checkboxLabel}>
                  <input
                    type="radio"
                    name="has_mental_health_condition"
                    checked={formData.has_mental_health_condition === false}
                    onChange={() => setFormData({ ...formData, has_mental_health_condition: false })}
                    style={styles.checkbox}
                  />
                  <span>No</span>
                </label>
                <label style={styles.checkboxLabel}>
                  <input
                    type="radio"
                    name="has_mental_health_condition"
                    checked={formData.has_mental_health_condition === 'not_sure'}
                    onChange={() => setFormData({ ...formData, has_mental_health_condition: 'not_sure' })}
                    style={styles.checkbox}
                  />
                  <span>Not sure</span>
                </label>
              </div>
            </div>

            {formData.has_mental_health_condition === 'not_sure' && (
              <div style={styles.therapySuggestion}>
                <img src="/assets/logo/online therapy.svg" alt="Online Therapy" style={styles.therapyLogo} />
                <p style={styles.therapyText}>
                  Sometimes it's better to speak with another human. When you notice you need deeper support,
                  imagine the relief of talking with a caring professional.
                </p>
                <a
                  href="https://www.psychologytoday.com/us/therapists"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.therapyLink}
                >
                  Connect with a Therapist
                </a>
              </div>
            )}

            {formData.has_mental_health_condition === true && (
              <div style={styles.subQuestions}>
                <p style={styles.subLabel}>Which conditions? (check all that apply)</p>
                {['Anxiety', 'Depression', 'PTSD', 'Bipolar', 'Other'].map(condition => (
                  <label key={condition} style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.mental_health_conditions.includes(condition.toLowerCase())}
                      onChange={() => handleCheckboxChange('mental_health_conditions', condition.toLowerCase())}
                      style={styles.checkbox}
                    />
                    <span>{condition}</span>
                  </label>
                ))}

                <div style={{ marginTop: '24px' }}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.currently_in_treatment}
                      onChange={(e) => setFormData({ ...formData, currently_in_treatment: e.target.checked })}
                      style={styles.checkbox}
                    />
                    <span>Currently in treatment</span>
                  </label>

                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.has_crisis_plan}
                      onChange={(e) => setFormData({ ...formData, has_crisis_plan: e.target.checked })}
                      style={styles.checkbox}
                    />
                    <span>I have a crisis plan</span>
                  </label>

                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.emergency_contact_available}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_available: e.target.checked })}
                      style={styles.checkbox}
                    />
                    <span>Emergency contact available</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      )
    },

    // SLIDE 2: Communication History
    {
      id: 'communication',
      title: 'Communication History',
      icon: 'communication',
      content: (
        <div style={styles.slideContent}>
          <img src={CommunicationIllustration} alt="Communication" style={styles.iconMedium} />
          <h2 style={styles.tealTitle}>Communication History</h2>

          <div style={styles.card}>
            <p style={styles.slideDescription}>
              Help us understand past interactions
            </p>

            <div style={styles.questionGroup}>
            <label style={styles.selectLabel}>Verbal conflict or arguments:</label>
            <CustomDropdown
              value={formData.verbal_aggression_history}
              onChange={(value) => setFormData({ ...formData, verbal_aggression_history: value })}
              options={[
                { value: 'never', label: 'Never happened' },
                { value: 'past', label: 'Long ago (6+ months)' },
                { value: 'recent', label: 'Recent (within 6 months)' },
                { value: 'ongoing', label: 'Ongoing issue' },
              ]}
              styles={styles}
            />
          </div>

          <div style={styles.questionGroup}>
            <label style={styles.selectLabel}>Physical conflict:</label>
            <CustomDropdown
              value={formData.physical_aggression_history}
              onChange={(value) => setFormData({ ...formData, physical_aggression_history: value })}
              options={[
                { value: 'never', label: 'Never happened' },
                { value: 'past', label: 'Long ago (6+ months)' },
                { value: 'recent', label: 'Recent (within 6 months)' },
                { value: 'ongoing', label: 'Ongoing issue' },
              ]}
              styles={styles}
            />
            </div>
          </div>
        </div>
      )
    },

    // SLIDE 3: Substance Use
    {
      id: 'substance',
      title: 'Substance Use',
      icon: 'substance',
      content: (
        <div style={styles.slideContent}>
          <img src={SubstanceIllustration} alt="Substance Check" style={styles.iconMedium} />
          <h2 style={styles.tealTitle}>Substance Use</h2>

          <div style={styles.card}>
            <p style={styles.slideDescription}>
              This helps us ensure clear communication
            </p>

            <div style={styles.questionGroup}>
            <label style={styles.selectLabel}>Alcohol use:</label>
            <CustomDropdown
              value={formData.alcohol_use}
              onChange={(value) => setFormData({ ...formData, alcohol_use: value })}
              options={[
                { value: 'none', label: 'None' },
                { value: 'occasional', label: 'Occasional (few times a month)' },
                { value: 'regular', label: 'Regular (weekly)' },
                { value: 'daily', label: 'Daily' },
                { value: 'concerned', label: "I'm concerned about my use" },
              ]}
              styles={styles}
            />
          </div>

          <div style={styles.questionGroup}>
            <label style={styles.selectLabel}>Drug use:</label>
            <CustomDropdown
              value={formData.drug_use}
              onChange={(value) => setFormData({ ...formData, drug_use: value })}
              options={[
                { value: 'none', label: 'None' },
                { value: 'occasional', label: 'Occasional' },
                { value: 'regular', label: 'Regular' },
                { value: 'daily', label: 'Daily' },
                { value: 'concerned', label: "I'm concerned about my use" },
              ]}
              styles={styles}
            />
          </div>

          {(formData.alcohol_use !== 'none' || formData.drug_use !== 'none') && (
            <div style={styles.questionGroup}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.substances_affect_behavior}
                  onChange={(e) => setFormData({ ...formData, substances_affect_behavior: e.target.checked })}
                  style={styles.checkbox}
                />
                <span>This sometimes affects my behavior</span>
              </label>
            </div>
          )}

          <div style={styles.questionGroup}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.need_substance_help}
                onChange={(e) => setFormData({ ...formData, need_substance_help: e.target.checked })}
                style={styles.checkbox}
              />
              <span>I need help but don't know where to go</span>
            </label>
          </div>

          {formData.need_substance_help && (
            <div style={styles.therapySuggestion}>
              <img src="/assets/logo/online therapy.svg" alt="Online Therapy" style={styles.therapyLogo} />
              <p style={styles.therapyText}>
                Getting support for substance use takes courage. Speaking with a professional can help you understand your relationship with substances and develop healthier patterns.
              </p>
              <a
                href="https://www.samhsa.gov/find-help/national-helpline"
                target="_blank"
                rel="noopener noreferrer"
                style={styles.therapyLink}
              >
                Connect with SAMHSA Helpline
              </a>
            </div>
          )}
          </div>
        </div>
      )
    },

    // SLIDE 4: Safety Check
    {
      id: 'safety',
      title: 'Safety Check',
      icon: 'safety',
      content: (
        <div style={styles.slideContent}>
          <img src={SafetyIllustration} alt="Safety Check" style={styles.iconMedium} />
          <h2 style={styles.tealTitle}>How are you feeling right now?</h2>

          <div style={styles.card}>
            <p style={styles.slideDescription}>
              Let's check in on your current state
            </p>

            <div style={styles.questionGroup}>
            <label style={styles.selectLabel}>Emotional state right now:</label>
            <CustomDropdown
              value={formData.feeling_state}
              onChange={(value) => setFormData({ ...formData, feeling_state: value })}
              options={[
                { value: 'calm', label: 'Calm' },
                { value: 'okay', label: 'Okay' },
                { value: 'stressed', label: 'Stressed' },
                { value: 'anxious', label: 'Anxious' },
                { value: 'angry', label: 'Angry' },
                { value: 'overwhelmed', label: 'Overwhelmed' },
              ]}
              styles={styles}
            />
          </div>

          <div style={styles.questionGroup}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.feels_safe_today}
                onChange={(e) => setFormData({ ...formData, feels_safe_today: e.target.checked })}
                style={styles.checkbox}
              />
              <span>I feel safe today</span>
            </label>

            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.feels_generally_safe}
                onChange={(e) => setFormData({ ...formData, feels_generally_safe: e.target.checked })}
                style={styles.checkbox}
              />
              <span>I generally feel safe in this relationship</span>
            </label>

            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.under_substance_influence}
                onChange={(e) => setFormData({ ...formData, under_substance_influence: e.target.checked })}
                style={styles.checkbox}
              />
              <span>I am currently under the influence</span>
            </label>

            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.recent_crisis}
                onChange={(e) => setFormData({ ...formData, recent_crisis: e.target.checked })}
                style={styles.checkbox}
              />
              <span>I've had a crisis in the last 48 hours</span>
            </label>

            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.recent_aggression}
                onChange={(e) => setFormData({ ...formData, recent_aggression: e.target.checked })}
                style={styles.checkbox}
              />
              <span>There's been conflict in the last week</span>
            </label>

            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.willing_to_proceed}
                onChange={(e) => setFormData({ ...formData, willing_to_proceed: e.target.checked })}
                style={styles.checkbox}
              />
              <span>I'm ready to proceed with mediation</span>
            </label>
            </div>
          </div>
        </div>
      )
    },
  ];

  if (showResults && results) {
    const getRiskColor = (level) => {
      switch (level) {
        case 'low': return '#E8F9F5';
        case 'medium': return '#FFF4E6';
        case 'high': return '#FFEBE6';
        case 'critical': return '#FFE0E0';
        default: return '#E8F9F5';
      }
    };

    return (
      <div style={styles.container}>
        <div style={{ padding: '40px 20px', maxWidth: '600px', margin: '0 auto' }}>
          <div style={styles.iconLarge}>
            {results.can_proceed ? '✅' : '🚫'}
          </div>
          <h1 style={styles.slideTitle}>Screening Complete</h1>

          <div style={{
            background: getRiskColor(results.session_risk_level),
            padding: '24px',
            borderRadius: '16px',
            marginBottom: '24px'
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>
              Risk Level: {results.session_risk_level.toUpperCase()}
            </h3>
            <p style={{ margin: '0 0 8px 0' }}>
              <strong>Status:</strong> {results.can_proceed ? 'Approved to proceed' : 'Cannot proceed'}
            </p>
          </div>

          {results.warning_message && (
            <div style={{ background: '#FFF4E6', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
              <p style={{ margin: 0 }}>{results.warning_message}</p>
            </div>
          )}

          {results.resources && results.resources.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ marginBottom: '16px' }}>Crisis Resources:</h3>
              {results.resources.map((resource, idx) => (
                <div key={idx} style={{ background: '#F5F5F5', padding: '16px', borderRadius: '12px', marginBottom: '12px' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#7DD3C0' }}>{resource.name}</h4>
                  {resource.phone && (
                    <p style={{ margin: '4px 0' }}><strong>Phone:</strong> <a href={`tel:${resource.phone}`}>{resource.phone}</a></p>
                  )}
                  {resource.url && (
                    <p style={{ margin: '4px 0' }}><a href={resource.url} target="_blank" rel="noopener noreferrer">Visit website</a></p>
                  )}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => {
              setShowResults(false);
              setCurrentSlide(0);
              setCompletedSlides([]);
            }}
            style={{ ...styles.button, ...styles.continueButton, width: '100%', marginTop: '24px' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #C4AEFF 0%, #A895D4 100%)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(211, 193, 255, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #D3C1FF 0%, #B8A7E5 100%)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(211, 193, 255, 0.3)';
            }}
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Progress Bar */}
      <div style={styles.progressBar}>
        {slides.map((_, index) => (
          <div
            key={index}
            style={{
              ...styles.progressDot,
              ...(completedSlides.includes(index) ? styles.dotFilled : {}),
              ...(currentSlide === index ? styles.dotCurrent : {}),
              ...(currentSlide !== index && !completedSlides.includes(index) ? styles.dotEmpty : {}),
            }}
            onClick={() => {
              if (completedSlides.includes(index) || index < currentSlide) {
                setCurrentSlide(index);
              }
            }}
          />
        ))}
      </div>

      <div style={styles.stepIndicator}>
        Step {currentSlide + 1} of {slides.length}
      </div>

      {/* Navigation - Moved to top */}
      <div style={styles.navigation}>
        <button
          onClick={prevSlide}
          disabled={currentSlide === 0}
          style={{
            ...styles.button,
            ...styles.backButton,
            ...(currentSlide === 0 ? styles.buttonDisabled : {}),
          }}
          onMouseEnter={(e) => {
            if (currentSlide !== 0) {
              e.currentTarget.style.backgroundColor = '#F5EFFF';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }
          }}
          onMouseLeave={(e) => {
            if (currentSlide !== 0) {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
        >
          ← Back
        </button>

        <button
          onClick={nextSlide}
          disabled={!canContinue(currentSlide) || loading}
          style={{
            ...styles.button,
            ...styles.continueButton,
            ...(!canContinue(currentSlide) || loading ? styles.buttonDisabled : {}),
          }}
          onMouseEnter={(e) => {
            if (canContinue(currentSlide) && !loading) {
              e.currentTarget.style.background = 'linear-gradient(135deg, #C4AEFF 0%, #A895D4 100%)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(211, 193, 255, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (canContinue(currentSlide) && !loading) {
              e.currentTarget.style.background = 'linear-gradient(135deg, #D3C1FF 0%, #B8A7E5 100%)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(211, 193, 255, 0.3)';
            }
          }}
        >
          {loading ? 'Submitting...' : currentSlide === slides.length - 1 ? 'Submit' : 'Continue →'}
        </button>
      </div>

      {/* Carousel */}
      <div style={styles.carouselContainer}>
        <div
          style={{
            ...styles.slidesWrapper,
            transform: `translateX(-${currentSlide * 100}%)`,
          }}
        >
          {slides.map((slide, index) => (
            <div key={slide.id} style={styles.slide}>
              {slide.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
