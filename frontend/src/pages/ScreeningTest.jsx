import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';

/**
 * SCREENING TEST PAGE
 * Simple demo to test the clinical screening system
 *
 * This shows:
 * 1. Checking if user has existing profile
 * 2. Full screening form (new users)
 * 3. Quick check form (returning users)
 * 4. Risk assessment results
 * 5. Crisis resources display
 */

export default function ScreeningTest() {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('check'); // 'check', 'full_form', 'quick_check', 'results'

  // Check status
  const [hasProfile, setHasProfile] = useState(false);
  const [existingProfile, setExistingProfile] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    // Mental health
    has_mental_health_condition: false,
    mental_health_conditions: [],
    currently_in_treatment: false,
    treatment_types: [],
    has_crisis_plan: false,
    emergency_contact_available: false,

    // Aggression
    verbal_aggression_history: 'never',
    physical_aggression_history: 'never',

    // Substance
    alcohol_use: 'none',
    drug_use: 'none',
    substance_details: [],
    substances_affect_behavior: false,

    // Safety
    feels_generally_safe: true,
    has_safety_plan: false,

    // Session state
    feeling_state: 'okay',
    feels_safe_today: true,
    under_substance_influence: false,
    recent_crisis: false,
    recent_aggression: false,
    concerns_about_other_person: false,
    willing_to_proceed: true,
  });

  // Results
  const [results, setResults] = useState(null);

  useEffect(() => {
    checkScreeningStatus();
  }, []);

  const checkScreeningStatus = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('/screening/check', 'GET', null, token);
      setHasProfile(response.has_existing_profile);
      setExistingProfile(response.profile);

      if (response.needs_full_profile) {
        setStep('full_form');
      } else if (response.has_existing_profile) {
        setStep('quick_check');
      } else {
        setStep('full_form');
      }
    } catch (error) {
      console.error('Error checking screening status:', error);
      setStep('full_form');
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create a test room ID (you can replace with real room ID)
      const testRoomId = 1;

      const payload = {
        room_id: testRoomId,
        session_data: {
          room_id: testRoomId,
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

      // Add profile data if new user
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
      setResults(response);
      setStep('results');
    } catch (error) {
      console.error('Error submitting screening:', error);
      alert('Error: ' + error.message);
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

  // Styles
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #EAF7F0 0%, #ffffff 100%)',
      padding: '40px 20px',
      fontFamily: "'Nunito', sans-serif",
    },
    card: {
      maxWidth: '800px',
      margin: '0 auto',
      background: 'white',
      borderRadius: '16px',
      padding: '40px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    },
    title: {
      fontSize: '32px',
      color: '#7DD3C0',
      marginBottom: '8px',
      fontWeight: '600',
    },
    subtitle: {
      fontSize: '16px',
      color: '#666',
      marginBottom: '32px',
    },
    section: {
      marginBottom: '32px',
    },
    sectionTitle: {
      fontSize: '20px',
      color: '#333',
      marginBottom: '16px',
      fontWeight: '600',
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      color: '#555',
      fontSize: '14px',
    },
    select: {
      width: '100%',
      padding: '12px',
      borderRadius: '8px',
      border: '1px solid #ddd',
      fontSize: '16px',
      marginBottom: '16px',
    },
    checkbox: {
      marginRight: '8px',
    },
    checkboxLabel: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '12px',
      cursor: 'pointer',
    },
    button: {
      background: '#7DD3C0',
      color: 'white',
      padding: '16px 32px',
      borderRadius: '12px',
      border: 'none',
      fontSize: '18px',
      fontWeight: '600',
      cursor: 'pointer',
      width: '100%',
      marginTop: '24px',
    },
    buttonDisabled: {
      background: '#ccc',
      cursor: 'not-allowed',
    },
    resultCard: {
      padding: '20px',
      borderRadius: '12px',
      marginBottom: '16px',
      border: '2px solid',
    },
    lowRisk: {
      background: '#E8F9F5',
      borderColor: '#7DD3C0',
    },
    mediumRisk: {
      background: '#FFF4E6',
      borderColor: '#FFB020',
    },
    highRisk: {
      background: '#FFEBE6',
      borderColor: '#FF6B6B',
    },
    criticalRisk: {
      background: '#FFE0E0',
      borderColor: '#D32F2F',
    },
    resource: {
      background: '#F5F5F5',
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '12px',
    },
    badge: {
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '16px',
      fontSize: '12px',
      fontWeight: '600',
      marginRight: '8px',
      marginBottom: '8px',
    },
  };

  const getRiskStyle = (level) => {
    switch (level) {
      case 'low': return styles.lowRisk;
      case 'medium': return styles.mediumRisk;
      case 'high': return styles.highRisk;
      case 'critical': return styles.criticalRisk;
      default: return styles.lowRisk;
    }
  };

  if (loading && step === 'check') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Checking your screening status...</h1>
        </div>
      </div>
    );
  }

  if (step === 'results' && results) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Screening Results</h1>
          <p style={styles.subtitle}>Your safety assessment is complete</p>

          <div style={{...styles.resultCard, ...getRiskStyle(results.session_risk_level)}}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '24px' }}>
              Risk Level: {results.session_risk_level.toUpperCase()}
            </h3>
            <p style={{ margin: '0 0 8px 0' }}>
              <strong>Action:</strong> {results.action_taken}
            </p>
            <p style={{ margin: '0 0 8px 0' }}>
              <strong>Can Proceed:</strong> {results.can_proceed ? 'Yes' : 'No'}
            </p>
            {results.baseline_risk_level && (
              <p style={{ margin: '0 0 8px 0' }}>
                <strong>Baseline Risk:</strong> {results.baseline_risk_level}
              </p>
            )}
          </div>

          {results.warning_message && (
            <div style={{ background: '#FFF4E6', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
              <p style={{ margin: 0, color: '#333' }}>{results.warning_message}</p>
            </div>
          )}

          {results.risk_reasons && results.risk_reasons.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Risk Factors Identified:</h3>
              <div>
                {results.risk_reasons.map((reason, idx) => (
                  <span key={idx} style={{...styles.badge, background: '#FFE0E0', color: '#D32F2F'}}>
                    {reason.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {results.resources && results.resources.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Crisis Resources:</h3>
              {results.resources.map((resource, idx) => (
                <div key={idx} style={styles.resource}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#7DD3C0' }}>{resource.name}</h4>
                  <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>{resource.description}</p>
                  {resource.phone && (
                    <p style={{ margin: '0 0 4px 0', fontSize: '14px' }}>
                      <strong>Phone:</strong> <a href={`tel:${resource.phone}`}>{resource.phone}</a>
                    </p>
                  )}
                  {resource.text_number && (
                    <p style={{ margin: '0 0 4px 0', fontSize: '14px' }}>
                      <strong>Text:</strong> {resource.text_number}
                    </p>
                  )}
                  {resource.url && (
                    <p style={{ margin: '0 0 4px 0', fontSize: '14px' }}>
                      <strong>Website:</strong> <a href={resource.url} target="_blank" rel="noopener noreferrer">{resource.url}</a>
                    </p>
                  )}
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>
                    Available: {resource.available}
                  </p>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => {
              setResults(null);
              setStep('check');
              checkScreeningStatus();
            }}
            style={styles.button}
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Clinical Screening Test</h1>
        <p style={styles.subtitle}>
          {hasProfile ? 'Quick safety check before your session' : 'First-time health profile'}
        </p>

        {existingProfile && (
          <div style={{ background: '#E8F9F5', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
            <p style={{ margin: 0 }}>
              ✓ We have your profile on file (created {new Date(existingProfile.last_full_screening).toLocaleDateString()})
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* MENTAL HEALTH SECTION */}
          {!hasProfile && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Mental Health</h3>

              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.has_mental_health_condition}
                  onChange={(e) => setFormData({ ...formData, has_mental_health_condition: e.target.checked })}
                  style={styles.checkbox}
                />
                I have a mental health condition
              </label>

              {formData.has_mental_health_condition && (
                <>
                  <label style={styles.label}>Conditions (check all that apply):</label>
                  {['anxiety', 'depression', 'ptsd', 'bipolar', 'other'].map(condition => (
                    <label key={condition} style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={formData.mental_health_conditions.includes(condition)}
                        onChange={() => handleCheckboxChange('mental_health_conditions', condition)}
                        style={styles.checkbox}
                      />
                      {condition.charAt(0).toUpperCase() + condition.slice(1)}
                    </label>
                  ))}

                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.currently_in_treatment}
                      onChange={(e) => setFormData({ ...formData, currently_in_treatment: e.target.checked })}
                      style={styles.checkbox}
                    />
                    Currently in treatment
                  </label>

                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.has_crisis_plan}
                      onChange={(e) => setFormData({ ...formData, has_crisis_plan: e.target.checked })}
                      style={styles.checkbox}
                    />
                    I have a crisis plan
                  </label>

                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.emergency_contact_available}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_available: e.target.checked })}
                      style={styles.checkbox}
                    />
                    Emergency contact available
                  </label>
                </>
              )}
            </div>
          )}

          {/* AGGRESSION HISTORY */}
          {!hasProfile && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Aggression History</h3>

              <label style={styles.label}>Verbal aggression:</label>
              <select
                value={formData.verbal_aggression_history}
                onChange={(e) => setFormData({ ...formData, verbal_aggression_history: e.target.value })}
                style={styles.select}
              >
                <option value="never">Never</option>
                <option value="past">In the past (over 6 months ago)</option>
                <option value="recent">Recent (within 6 months)</option>
                <option value="ongoing">Ongoing</option>
              </select>

              <label style={styles.label}>Physical aggression:</label>
              <select
                value={formData.physical_aggression_history}
                onChange={(e) => setFormData({ ...formData, physical_aggression_history: e.target.value })}
                style={styles.select}
              >
                <option value="never">Never</option>
                <option value="past">In the past (over 6 months ago)</option>
                <option value="recent">Recent (within 6 months)</option>
                <option value="ongoing">Ongoing</option>
              </select>
            </div>
          )}

          {/* SUBSTANCE USE */}
          {!hasProfile && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Substance Use</h3>

              <label style={styles.label}>Alcohol use:</label>
              <select
                value={formData.alcohol_use}
                onChange={(e) => setFormData({ ...formData, alcohol_use: e.target.value })}
                style={styles.select}
              >
                <option value="none">None</option>
                <option value="occasional">Occasional (few times a month)</option>
                <option value="regular">Regular (weekly)</option>
                <option value="daily">Daily</option>
                <option value="concerned">I'm concerned about my use</option>
              </select>

              <label style={styles.label}>Drug use:</label>
              <select
                value={formData.drug_use}
                onChange={(e) => setFormData({ ...formData, drug_use: e.target.value })}
                style={styles.select}
              >
                <option value="none">None</option>
                <option value="occasional">Occasional</option>
                <option value="regular">Regular</option>
                <option value="daily">Daily</option>
                <option value="concerned">I'm concerned about my use</option>
              </select>
            </div>
          )}

          {/* SAFETY */}
          {!hasProfile && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Safety</h3>

              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.feels_generally_safe}
                  onChange={(e) => setFormData({ ...formData, feels_generally_safe: e.target.checked })}
                  style={styles.checkbox}
                />
                I generally feel safe
              </label>

              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.has_safety_plan}
                  onChange={(e) => setFormData({ ...formData, has_safety_plan: e.target.checked })}
                  style={styles.checkbox}
                />
                I have a safety plan
              </label>
            </div>
          )}

          {/* CURRENT STATE (always asked) */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>How are you feeling right now?</h3>

            <label style={styles.label}>Emotional state:</label>
            <select
              value={formData.feeling_state}
              onChange={(e) => setFormData({ ...formData, feeling_state: e.target.value })}
              style={styles.select}
            >
              <option value="calm">Calm</option>
              <option value="okay">Okay</option>
              <option value="stressed">Stressed</option>
              <option value="anxious">Anxious</option>
              <option value="angry">Angry</option>
              <option value="overwhelmed">Overwhelmed</option>
            </select>

            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.feels_safe_today}
                onChange={(e) => setFormData({ ...formData, feels_safe_today: e.target.checked })}
                style={styles.checkbox}
              />
              I feel safe today
            </label>

            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.under_substance_influence}
                onChange={(e) => setFormData({ ...formData, under_substance_influence: e.target.checked })}
                style={styles.checkbox}
              />
              I am currently under the influence of alcohol or drugs
            </label>

            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.recent_crisis}
                onChange={(e) => setFormData({ ...formData, recent_crisis: e.target.checked })}
                style={styles.checkbox}
              />
              I've experienced a mental health crisis in the last 48 hours
            </label>

            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.recent_aggression}
                onChange={(e) => setFormData({ ...formData, recent_aggression: e.target.checked })}
                style={styles.checkbox}
              />
              There has been aggression in the last 7 days
            </label>

            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.concerns_about_other_person}
                onChange={(e) => setFormData({ ...formData, concerns_about_other_person: e.target.checked })}
                style={styles.checkbox}
              />
              I have concerns about the other person
            </label>

            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.willing_to_proceed}
                onChange={(e) => setFormData({ ...formData, willing_to_proceed: e.target.checked })}
                style={styles.checkbox}
              />
              I am willing to proceed with this mediation
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{...styles.button, ...(loading ? styles.buttonDisabled : {})}}
          >
            {loading ? 'Submitting...' : 'Submit Screening'}
          </button>
        </form>
      </div>
    </div>
  );
}
