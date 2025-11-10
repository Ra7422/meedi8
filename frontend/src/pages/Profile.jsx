import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../api/client';

export default function Profile() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [healthProfile, setHealthProfile] = useState(null);
  const [expandedSessions, setExpandedSessions] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [selectedSessions, setSelectedSessions] = useState([]);
  const [selectMode, setSelectMode] = useState(false);

  const [profileData, setProfileData] = useState({
    name: '',
    age: '',
    religion: '',
    bio: '',
  });
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [healthFormData, setHealthFormData] = useState({});

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        age: user.age || '',
        religion: user.religion || '',
        bio: user.bio || '',
      });
    }
  }, [user]);

  useEffect(() => {
    // Add small delay for Safari to ensure token is properly set
    const timer = setTimeout(() => {
      fetchUserData();
    }, 100);
    return () => clearTimeout(timer);
  }, [token]);

  async function fetchUserData() {
    setLoading(true);
    try {
      // Fetch sessions
      console.log('📊 Fetching sessions...');
      const sessionsData = await apiRequest('/rooms', 'GET', null, token);
      console.log('📊 Sessions received:', sessionsData?.length || 0, 'rooms');
      setSessions(sessionsData || []);

      // Fetch subscription
      try {
        console.log('💳 Fetching subscription...');
        const subData = await apiRequest('/subscriptions/me', 'GET', null, token);
        console.log('💳 Subscription received:', subData?.tier || 'N/A');
        setSubscription(subData);
      } catch (err) {
        console.log('⚠️ No subscription found:', err.message);
      }

      // Fetch health profile
      try {
        console.log('🏥 Fetching health profile...');
        const healthData = await apiRequest('/screening/profile', 'GET', null, token);
        console.log('🏥 Health profile received:', healthData ? 'Yes' : 'No');
        setHealthProfile(healthData);
      } catch (err) {
        console.log('⚠️ No health profile found:', err.message);
      }
    } catch (error) {
      console.error('❌ Error fetching user data:', error);
    } finally {
      setLoading(false);
      console.log('✅ Profile data fetch complete');
    }
  }

  async function handleSaveProfile() {
    try {
      const updatedUser = await apiRequest('/users/me', 'PUT', profileData, token);
      setEditing(false);
      // Update user in context if needed
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  }

  function handleOpenHealthModal() {
    if (healthProfile) {
      setHealthFormData({
        has_mental_health_condition: healthProfile.has_mental_health_condition || false,
        mental_health_conditions: healthProfile.mental_health_conditions || [],
        currently_in_treatment: healthProfile.currently_in_treatment || false,
        treatment_types: healthProfile.treatment_types || [],
        has_crisis_plan: healthProfile.has_crisis_plan || false,
        emergency_contact_available: healthProfile.emergency_contact_available || false,
        verbal_aggression_history: healthProfile.verbal_aggression_history || 'never',
        physical_aggression_history: healthProfile.physical_aggression_history || 'never',
        alcohol_use: healthProfile.alcohol_use || 'none',
        drug_use: healthProfile.drug_use || 'none',
        substance_details: healthProfile.substance_details || [],
        substances_affect_behavior: healthProfile.substances_affect_behavior || false,
        feels_generally_safe: healthProfile.feels_generally_safe !== undefined ? healthProfile.feels_generally_safe : true,
        has_safety_plan: healthProfile.has_safety_plan || false,
      });
    }
    setShowHealthModal(true);
  }

  async function handleSaveHealthProfile() {
    try {
      const updatedProfile = await apiRequest('/screening/profile', 'PUT', healthFormData, token);
      setHealthProfile(updatedProfile);
      setShowHealthModal(false);
    } catch (error) {
      console.error('Error updating health profile:', error);
      alert('Failed to update health profile');
    }
  }

  async function handleDeleteSession(sessionId) {
    if (!window.confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }

    try {
      await apiRequest(`/rooms/${sessionId}`, 'DELETE', null, token);
      // Remove from local state
      setSessions(sessions.filter(s => s.id !== sessionId));
      setSessionToDelete(null);
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Failed to delete session');
    }
  }

  async function handleDeleteSelected() {
    if (selectedSessions.length === 0) {
      alert('Please select at least one session to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedSessions.length} session(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      // Delete all selected sessions
      await Promise.all(
        selectedSessions.map(sessionId =>
          apiRequest(`/rooms/${sessionId}`, 'DELETE', null, token)
        )
      );

      // Remove from local state
      setSessions(sessions.filter(s => !selectedSessions.includes(s.id)));
      setSelectedSessions([]);
      setSelectMode(false);
    } catch (error) {
      console.error('Error deleting sessions:', error);
      alert('Failed to delete some sessions');
    }
  }

  function toggleSessionSelection(sessionId) {
    setSelectedSessions(prev =>
      prev.includes(sessionId)
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    );
  }

  function toggleSelectAll() {
    if (selectedSessions.length === sessions.length) {
      setSelectedSessions([]);
    } else {
      setSelectedSessions(sessions.map(s => s.id));
    }
  }

  function getTierDisplay(tier) {
    const tiers = {
      FREE: { label: 'Free', color: '#7DD3C0', bg: '#E8F9F5' },
      PLUS: { label: 'Plus', color: '#D3C1FF', bg: '#F5EFFF' },
      PRO: { label: 'Pro', color: '#6750A4', bg: '#EDE7F6' },
    };
    return tiers[tier] || tiers.FREE;
  }

  const styles = {
    container: {
      minHeight: 'calc(100vh - 60px)',
      background: 'linear-gradient(180deg, #EAF7F0 0%, #ffffff 100%)',
      padding: '40px 20px',
      fontFamily: "'Nunito', sans-serif",
    },
    maxWidth: {
      maxWidth: '1200px',
      margin: '0 auto',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '24px',
      marginBottom: '40px',
      flexWrap: 'wrap',
    },
    headerContent: {
      textAlign: 'center',
    },
    title: {
      fontSize: '36px',
      fontWeight: '400',
      color: '#6750A4',
      marginBottom: '8px',
      fontFamily: "'Nunito', sans-serif",
    },
    titleBold: {
      fontWeight: '700',
    },
    subtitle: {
      fontSize: '16px',
      color: '#888',
      fontFamily: "'Nunito', sans-serif",
    },
    headerProfilePicture: {
      width: '80px',
      height: '80px',
      borderRadius: '50%',
      border: '3px solid #D3C1FF',
      objectFit: 'cover',
    },
    headerProfilePicturePlaceholder: {
      width: '80px',
      height: '80px',
      borderRadius: '50%',
      border: '3px solid #D3C1FF',
      backgroundColor: '#F5EFFF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '36px',
      color: '#D3C1FF',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '24px',
      marginBottom: '32px',
    },
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      border: '2px solid #D3C1FF',
    },
    cardTitle: {
      fontSize: '20px',
      fontWeight: '700',
      color: '#6750A4',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    infoGroup: {
      marginBottom: '12px',
    },
    label: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#6750A4',
      marginBottom: '4px',
    },
    value: {
      fontSize: '16px',
      color: '#6750A4',
      fontFamily: "'Nunito', sans-serif",
    },
    input: {
      width: '100%',
      padding: '12px',
      borderRadius: '8px',
      border: '2px solid #D3C1FF',
      fontSize: '16px',
      fontFamily: "'Nunito', sans-serif",
      backgroundColor: '#F5EFFF',
      color: '#6750A4',
    },
    button: {
      padding: '12px 24px',
      borderRadius: '8px',
      border: 'none',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      fontFamily: "'Nunito', sans-serif",
      transition: 'all 0.3s',
    },
    primaryButton: {
      backgroundColor: '#D3C1FF',
      color: '#FFFFFF',
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      color: '#D3C1FF',
      border: '2px solid #D3C1FF',
    },
    tierBadge: (tier) => ({
      display: 'inline-block',
      padding: '8px 16px',
      borderRadius: '20px',
      fontWeight: '700',
      fontSize: '14px',
      backgroundColor: getTierDisplay(tier).bg,
      color: getTierDisplay(tier).color,
    }),
    sessionsList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      maxHeight: expandedSessions ? 'none' : '200px',
      overflowY: expandedSessions ? 'visible' : 'auto',
      transition: 'max-height 0.3s ease',
    },
    sessionItem: {
      padding: '12px',
      backgroundColor: '#F5EFFF',
      borderRadius: '8px',
      transition: 'all 0.2s',
      border: '2px solid transparent',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sessionItemHover: {
      border: '2px solid #D3C1FF',
      transform: 'translateY(-2px)',
    },
    sessionContent: {
      flex: 1,
      cursor: 'pointer',
    },
    sessionTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#6750A4',
      marginBottom: '4px',
    },
    sessionDate: {
      fontSize: '14px',
      color: '#888',
    },
    deleteButton: {
      padding: '8px 12px',
      backgroundColor: '#FF4444',
      color: '#FFFFFF',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontFamily: "'Nunito', sans-serif",
      marginLeft: '12px',
    },
    expandButton: {
      padding: '12px',
      backgroundColor: '#F5EFFF',
      color: '#6750A4',
      border: '2px solid #D3C1FF',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontFamily: "'Nunito', sans-serif",
      width: '100%',
      marginTop: '12px',
    },
    sessionsCard: {
      gridColumn: expandedSessions ? '1 / -1' : 'auto',
      transition: 'all 0.3s ease',
    },
    checkbox: {
      width: '20px',
      height: '20px',
      marginRight: '12px',
      cursor: 'pointer',
      accentColor: '#D3C1FF',
    },
    selectAllContainer: {
      display: 'flex',
      alignItems: 'center',
      padding: '12px',
      backgroundColor: '#F5EFFF',
      borderRadius: '8px',
      marginBottom: '12px',
      border: '2px solid #D3C1FF',
    },
    selectAllLabel: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#6750A4',
      cursor: 'pointer',
      userSelect: 'none',
    },
    bulkActions: {
      display: 'flex',
      gap: '12px',
      marginTop: '12px',
    },
    selectButton: {
      padding: '8px 16px',
      backgroundColor: '#F5EFFF',
      color: '#6750A4',
      border: '2px solid #D3C1FF',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontFamily: "'Nunito', sans-serif",
    },
    deleteSelectedButton: {
      padding: '8px 16px',
      backgroundColor: '#FF4444',
      color: '#FFFFFF',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontFamily: "'Nunito', sans-serif",
    },
    stat: {
      textAlign: 'center',
      padding: '16px',
      backgroundColor: '#F5EFFF',
      borderRadius: '12px',
    },
    statValue: {
      fontSize: '32px',
      fontWeight: '700',
      color: '#6750A4',
    },
    statLabel: {
      fontSize: '14px',
      color: '#888',
      marginTop: '4px',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '16px',
      flex: 1,
    },
    statCompleted: {
      backgroundColor: '#E8F9F5',
      border: '2px solid #7DD3C0',
    },
    statInProgress: {
      backgroundColor: '#F5EFFF',
      border: '2px solid #CCB2FF',
    },
    chartContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '200px',
    },
    emptyState: {
      textAlign: 'center',
      padding: '40px',
      color: '#888',
      fontSize: '16px',
      fontFamily: "'Nunito', sans-serif",
    },
    linkButton: {
      color: '#D3C1FF',
      textDecoration: 'none',
      fontWeight: '600',
      cursor: 'pointer',
      fontFamily: "'Nunito', sans-serif",
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.maxWidth}>
          <div style={{ ...styles.emptyState, paddingTop: '100px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
            <p>Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  const tierInfo = getTierDisplay(subscription?.tier || 'FREE');

  return (
    <div style={styles.container}>
      <div style={styles.maxWidth}>
        <div style={styles.header}>
          {user?.profile_picture_url ? (
            <img src={user.profile_picture_url} alt="Profile" style={styles.headerProfilePicture} />
          ) : (
            <div style={styles.headerProfilePicturePlaceholder}>
              👤
            </div>
          )}
          <div style={styles.headerContent}>
            <h1 style={styles.title}>Your <span style={styles.titleBold}>Profile</span></h1>
            <p style={styles.subtitle}>Manage your information and track your progress</p>
          </div>
        </div>

        {/* Stats Overview */}
        <div style={{ ...styles.card, marginBottom: '24px' }}>
          <div style={styles.cardTitle}>
            <span>Session Overview</span>
          </div>

          <div style={{ display: 'flex', gap: '40px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Pie Chart */}
            <div style={styles.chartContainer}>
              <svg width="200" height="200" viewBox="0 0 200 200">
                {/* Background circle */}
                <circle cx="100" cy="100" r="80" fill="#F5EFFF" />

                {sessions.length > 0 ? (
                  <>
                    {/* Completed slice (teal) */}
                    {(() => {
                      const completed = sessions.filter(s => s.phase === 'resolved').length;
                      const inProgress = sessions.filter(s => s.phase !== 'resolved').length;
                      const completedPercentage = (completed / sessions.length) * 100;
                      const completedAngle = (completedPercentage / 100) * 360;

                      // Calculate arc path for completed slice
                      const startAngle = -90; // Start at top
                      const endAngle = startAngle + completedAngle;

                      const startRad = (startAngle * Math.PI) / 180;
                      const endRad = (endAngle * Math.PI) / 180;

                      const x1 = 100 + 80 * Math.cos(startRad);
                      const y1 = 100 + 80 * Math.sin(startRad);
                      const x2 = 100 + 80 * Math.cos(endRad);
                      const y2 = 100 + 80 * Math.sin(endRad);

                      const largeArc = completedAngle > 180 ? 1 : 0;

                      if (completed === sessions.length) {
                        // Full circle - completed only
                        return <circle cx="100" cy="100" r="80" fill="#7DD3C0" />;
                      } else if (completed > 0) {
                        return (
                          <path
                            d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                            fill="#7DD3C0"
                          />
                        );
                      }
                      return null;
                    })()}

                    {/* In Progress slice (purple) */}
                    {(() => {
                      const completed = sessions.filter(s => s.phase === 'resolved').length;
                      const inProgress = sessions.filter(s => s.phase !== 'resolved').length;
                      const completedPercentage = (completed / sessions.length) * 100;
                      const inProgressPercentage = (inProgress / sessions.length) * 100;
                      const completedAngle = (completedPercentage / 100) * 360;
                      const inProgressAngle = (inProgressPercentage / 100) * 360;

                      const startAngle = -90 + completedAngle;
                      const endAngle = startAngle + inProgressAngle;

                      const startRad = (startAngle * Math.PI) / 180;
                      const endRad = (endAngle * Math.PI) / 180;

                      const x1 = 100 + 80 * Math.cos(startRad);
                      const y1 = 100 + 80 * Math.sin(startRad);
                      const x2 = 100 + 80 * Math.cos(endRad);
                      const y2 = 100 + 80 * Math.sin(endRad);

                      const largeArc = inProgressAngle > 180 ? 1 : 0;

                      if (inProgress === sessions.length) {
                        // Full circle - in progress only
                        return <circle cx="100" cy="100" r="80" fill="#CCB2FF" />;
                      } else if (inProgress > 0) {
                        return (
                          <path
                            d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                            fill="#CCB2FF"
                          />
                        );
                      }
                      return null;
                    })()}

                    {/* Center white circle to make it a donut */}
                    <circle cx="100" cy="100" r="50" fill="white" />

                    {/* Total count in center */}
                    <text
                      x="100"
                      y="95"
                      textAnchor="middle"
                      style={{
                        fontSize: '32px',
                        fontWeight: '700',
                        fill: '#6750A4',
                        fontFamily: "'Nunito', sans-serif",
                      }}
                    >
                      {sessions.length}
                    </text>
                    <text
                      x="100"
                      y="115"
                      textAnchor="middle"
                      style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        fill: '#888',
                        fontFamily: "'Nunito', sans-serif",
                      }}
                    >
                      Total
                    </text>
                  </>
                ) : (
                  <>
                    <circle cx="100" cy="100" r="80" fill="#F5EFFF" />
                    <circle cx="100" cy="100" r="50" fill="white" />
                    <text
                      x="100"
                      y="105"
                      textAnchor="middle"
                      style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        fill: '#888',
                        fontFamily: "'Nunito', sans-serif",
                      }}
                    >
                      No sessions
                    </text>
                  </>
                )}
              </svg>
            </div>

            {/* Stats Grid */}
            <div style={styles.statsGrid}>
              <div style={styles.stat}>
                <div style={styles.statValue}>{sessions.length}</div>
                <div style={styles.statLabel}>Total Sessions</div>
              </div>
              <div style={{ ...styles.stat, ...styles.statCompleted }}>
                <div style={styles.statValue}>{sessions.filter(s => s.phase === 'resolved').length}</div>
                <div style={styles.statLabel}>Completed</div>
              </div>
              <div style={{ ...styles.stat, ...styles.statInProgress }}>
                <div style={styles.statValue}>{sessions.filter(s => s.phase !== 'resolved').length}</div>
                <div style={styles.statLabel}>In Progress</div>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.grid}>
          {/* Personal Information Card */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>
              <span>Personal Information</span>
              {!editing ? (
                <button
                  style={{ ...styles.button, ...styles.secondaryButton }}
                  onClick={() => setEditing(true)}
                >
                  Edit
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    style={{ ...styles.button, ...styles.secondaryButton }}
                    onClick={() => {
                      setEditing(false);
                      setProfileData({
                        name: user.name || '',
                        age: user.age || '',
                        religion: user.religion || '',
                        bio: user.bio || '',
                      });
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    style={{ ...styles.button, ...styles.primaryButton }}
                    onClick={handleSaveProfile}
                  >
                    Save
                  </button>
                </div>
              )}
            </div>

            <div style={styles.infoGroup}>
              <div style={styles.label}>Name</div>
              {editing ? (
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  style={styles.input}
                />
              ) : (
                <div style={styles.value}>{user?.name || 'Not set'}</div>
              )}
            </div>

            <div style={styles.infoGroup}>
              <div style={styles.label}>Email</div>
              <div style={styles.value}>{user?.email}</div>
            </div>

            <div style={styles.infoGroup}>
              <div style={styles.label}>Age</div>
              {editing ? (
                <input
                  type="number"
                  value={profileData.age}
                  onChange={(e) => setProfileData({ ...profileData, age: e.target.value })}
                  style={styles.input}
                />
              ) : (
                <div style={styles.value}>{user?.age || 'Not set'}</div>
              )}
            </div>

            <div style={styles.infoGroup}>
              <div style={styles.label}>Religion</div>
              {editing ? (
                <input
                  type="text"
                  value={profileData.religion}
                  onChange={(e) => setProfileData({ ...profileData, religion: e.target.value })}
                  style={styles.input}
                />
              ) : (
                <div style={styles.value}>{user?.religion || 'Not set'}</div>
              )}
            </div>

            <div style={styles.infoGroup}>
              <div style={styles.label}>Bio</div>
              {editing ? (
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
                />
              ) : (
                <div style={styles.value}>{user?.bio || 'Tell us about yourself...'}</div>
              )}
            </div>
          </div>

          {/* Subscription Card */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>
              <span>Subscription</span>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={styles.tierBadge(subscription?.tier || 'FREE')}>
                {tierInfo.label} Plan
              </div>
            </div>

            {subscription ? (
              <>
                <div style={styles.infoGroup}>
                  <div style={styles.label}>Status</div>
                  <div style={styles.value}>
                    {subscription.status === 'active' ? '✓ Active' : subscription.status}
                  </div>
                </div>

                <div style={styles.infoGroup}>
                  <div style={styles.label}>Rooms This Month</div>
                  <div style={styles.value}>
                    {subscription.rooms_created_this_month} / {subscription.rooms_limit === -1 ? '∞' : subscription.rooms_limit}
                  </div>
                </div>

                <div style={styles.infoGroup}>
                  <div style={styles.label}>Voice Messages</div>
                  <div style={styles.value}>
                    {subscription.voice_conversations_used} / {subscription.voice_conversations_limit}
                  </div>
                </div>
              </>
            ) : (
              <div style={styles.emptyState}>
                <p>No active subscription</p>
              </div>
            )}

            <button
              style={{ ...styles.button, ...styles.primaryButton, width: '100%', marginTop: '16px' }}
              onClick={() => navigate('/subscription')}
            >
              {subscription ? 'Manage Subscription' : 'Get Started'}
            </button>
          </div>

          {/* Health Profile Card */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>
              <span>Health Profile</span>
            </div>

            {healthProfile ? (
              <>
                <div style={styles.infoGroup}>
                  <div style={styles.label}>Status</div>
                  <div style={styles.value}>
                    ✓ Screening completed
                  </div>
                </div>

                <div style={styles.infoGroup}>
                  <div style={styles.label}>Risk Level</div>
                  <div style={styles.value}>
                    {healthProfile.baseline_risk_level === 'low' && '✓ Low'}
                    {healthProfile.baseline_risk_level === 'medium' && '⚠️ Medium'}
                    {healthProfile.baseline_risk_level === 'high' && '⚠️ High'}
                  </div>
                </div>

                <div style={styles.infoGroup}>
                  <div style={styles.label}>Last Updated</div>
                  <div style={styles.value}>
                    {new Date(healthProfile.last_full_screening).toLocaleDateString()}
                  </div>
                </div>

                {healthProfile.needs_update && (
                  <div style={{ ...styles.infoGroup, backgroundColor: '#FFF4E6', padding: '12px', borderRadius: '8px', marginTop: '12px' }}>
                    <div style={{ color: '#F59E0B', fontWeight: '600', fontSize: '14px' }}>
                      ⚠️ Profile needs updating (90+ days old)
                    </div>
                  </div>
                )}

                <button
                  style={{ ...styles.button, ...styles.primaryButton, width: '100%', marginTop: '16px' }}
                  onClick={handleOpenHealthModal}
                >
                  View & Edit Health Screening
                </button>
              </>
            ) : (
              <>
                <div style={styles.emptyState}>
                  <p>No health screening completed</p>
                </div>
                <button
                  style={{ ...styles.button, ...styles.primaryButton, width: '100%', marginTop: '16px' }}
                  onClick={() => {
                    sessionStorage.setItem('screeningReturnTo', '/profile');
                    navigate('/screening-carousel');
                  }}
                >
                  Complete Screening
                </button>
              </>
            )}
          </div>
        </div>

        {/* Sessions Card */}
        <div style={{ ...styles.card, ...styles.sessionsCard }}>
          <div style={styles.cardTitle}>
            <span>Your Sessions ({sessions.length})</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {sessions.length > 0 && (
                <button
                  style={styles.selectButton}
                  onClick={() => {
                    setSelectMode(!selectMode);
                    setSelectedSessions([]);
                  }}
                >
                  {selectMode ? 'Cancel' : 'Select'}
                </button>
              )}
              <button
                style={{ ...styles.button, ...styles.primaryButton }}
                onClick={() => navigate('/create')}
              >
                + New Session
              </button>
            </div>
          </div>

          {sessions.length > 0 ? (
            <>
              {selectMode && (
                <>
                  <div style={styles.selectAllContainer}>
                    <input
                      type="checkbox"
                      checked={selectedSessions.length === sessions.length}
                      onChange={toggleSelectAll}
                      style={styles.checkbox}
                    />
                    <label style={styles.selectAllLabel} onClick={toggleSelectAll}>
                      Select All ({selectedSessions.length}/{sessions.length})
                    </label>
                  </div>

                  {selectedSessions.length > 0 && (
                    <div style={styles.bulkActions}>
                      <button
                        style={styles.deleteSelectedButton}
                        onClick={handleDeleteSelected}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#CC0000';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#FF4444';
                        }}
                      >
                        Delete Selected ({selectedSessions.length})
                      </button>
                    </div>
                  )}
                </>
              )}

              <div style={styles.sessionsList}>
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    style={styles.sessionItem}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.border = styles.sessionItemHover.border;
                      e.currentTarget.style.transform = styles.sessionItemHover.transform;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.border = '2px solid transparent';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    {selectMode && (
                      <input
                        type="checkbox"
                        checked={selectedSessions.includes(session.id)}
                        onChange={() => toggleSessionSelection(session.id)}
                        onClick={(e) => e.stopPropagation()}
                        style={styles.checkbox}
                      />
                    )}
                    <div
                      style={styles.sessionContent}
                      onClick={() => {
                        if (selectMode) {
                          toggleSessionSelection(session.id);
                        } else {
                          // Navigate to appropriate page based on phase
                          if (session.phase === 'resolved') {
                            navigate(`/rooms/${session.id}/summary`);
                          } else if (session.phase === 'main_room') {
                            navigate(`/main-room/${session.id}`);
                          } else {
                            navigate(`/coaching/${session.id}`);
                          }
                        }
                      }}
                    >
                      <div style={styles.sessionTitle}>
                        {session.title || `Session #${session.id}`}
                      </div>
                      <div style={styles.sessionDate}>
                        Created: {new Date(session.created_at).toLocaleDateString()} •
                        Status: {session.phase === 'resolved' ? 'Completed' : 'In Progress'}
                      </div>
                    </div>
                    {!selectMode && (
                      <button
                        style={styles.deleteButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(session.id);
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#CC0000';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#FF4444';
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {sessions.length > 3 && (
                <button
                  style={styles.expandButton}
                  onClick={() => setExpandedSessions(!expandedSessions)}
                >
                  {expandedSessions ? '▲ Show Less' : `▼ Show All (${sessions.length})`}
                </button>
              )}
            </>
          ) : (
            <div style={styles.emptyState}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
              <p>No sessions yet</p>
              <p>
                <span
                  style={styles.linkButton}
                  onClick={() => navigate('/create')}
                >
                  Create your first session
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Health Screening Modal */}
        {showHealthModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
              position: 'relative',
            }}>
              {/* Close button */}
              <button
                onClick={() => setShowHealthModal(false)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6750A4',
                  fontWeight: '700',
                }}
              >
                ×
              </button>

              <h2 style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#6750A4',
                marginBottom: '24px',
                fontFamily: "'Nunito', sans-serif",
              }}>
                Health Screening Details
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Mental Health */}
                <div style={{
                  padding: '16px',
                  backgroundColor: '#F5EFFF',
                  borderRadius: '12px',
                  border: '2px solid #D3C1FF',
                }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    fontFamily: "'Nunito', sans-serif",
                  }}>
                    <input
                      type="checkbox"
                      checked={healthFormData.has_mental_health_condition || false}
                      onChange={(e) => setHealthFormData({
                        ...healthFormData,
                        has_mental_health_condition: e.target.checked
                      })}
                      style={{
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                        accentColor: '#D3C1FF',
                      }}
                    />
                    <span style={{ fontSize: '16px', color: '#6750A4', fontWeight: '500' }}>
                      Has mental health condition
                    </span>
                  </label>
                </div>

                {/* Currently in Treatment */}
                <div style={{
                  padding: '16px',
                  backgroundColor: '#F5EFFF',
                  borderRadius: '12px',
                  border: '2px solid #D3C1FF',
                }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    fontFamily: "'Nunito', sans-serif",
                  }}>
                    <input
                      type="checkbox"
                      checked={healthFormData.currently_in_treatment || false}
                      onChange={(e) => setHealthFormData({
                        ...healthFormData,
                        currently_in_treatment: e.target.checked
                      })}
                      style={{
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                        accentColor: '#D3C1FF',
                      }}
                    />
                    <span style={{ fontSize: '16px', color: '#6750A4', fontWeight: '500' }}>
                      Currently in treatment
                    </span>
                  </label>
                </div>

                {/* Crisis Plan */}
                <div style={{
                  padding: '16px',
                  backgroundColor: '#F5EFFF',
                  borderRadius: '12px',
                  border: '2px solid #D3C1FF',
                }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    fontFamily: "'Nunito', sans-serif",
                  }}>
                    <input
                      type="checkbox"
                      checked={healthFormData.has_crisis_plan || false}
                      onChange={(e) => setHealthFormData({
                        ...healthFormData,
                        has_crisis_plan: e.target.checked
                      })}
                      style={{
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                        accentColor: '#D3C1FF',
                      }}
                    />
                    <span style={{ fontSize: '16px', color: '#6750A4', fontWeight: '500' }}>
                      Has crisis plan
                    </span>
                  </label>
                </div>

                {/* Emergency Contact */}
                <div style={{
                  padding: '16px',
                  backgroundColor: '#F5EFFF',
                  borderRadius: '12px',
                  border: '2px solid #D3C1FF',
                }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    fontFamily: "'Nunito', sans-serif",
                  }}>
                    <input
                      type="checkbox"
                      checked={healthFormData.emergency_contact_available || false}
                      onChange={(e) => setHealthFormData({
                        ...healthFormData,
                        emergency_contact_available: e.target.checked
                      })}
                      style={{
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                        accentColor: '#D3C1FF',
                      }}
                    />
                    <span style={{ fontSize: '16px', color: '#6750A4', fontWeight: '500' }}>
                      Emergency contact available
                    </span>
                  </label>
                </div>

                {/* Aggression History */}
                <div style={{
                  padding: '16px',
                  backgroundColor: '#F5EFFF',
                  borderRadius: '12px',
                  border: '2px solid #D3C1FF',
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#6750A4',
                    marginBottom: '8px',
                  }}>
                    Verbal Aggression History
                  </div>
                  <select
                    value={healthFormData.verbal_aggression_history || 'never'}
                    onChange={(e) => setHealthFormData({
                      ...healthFormData,
                      verbal_aggression_history: e.target.value
                    })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '8px',
                      border: '2px solid #D3C1FF',
                      fontSize: '14px',
                      fontFamily: "'Nunito', sans-serif",
                    }}
                  >
                    <option value="never">Never</option>
                    <option value="past">Past</option>
                    <option value="recent">Recent</option>
                    <option value="ongoing">Ongoing</option>
                  </select>
                </div>

                {/* Physical Aggression */}
                <div style={{
                  padding: '16px',
                  backgroundColor: '#F5EFFF',
                  borderRadius: '12px',
                  border: '2px solid #D3C1FF',
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#6750A4',
                    marginBottom: '8px',
                  }}>
                    Physical Aggression History
                  </div>
                  <select
                    value={healthFormData.physical_aggression_history || 'never'}
                    onChange={(e) => setHealthFormData({
                      ...healthFormData,
                      physical_aggression_history: e.target.value
                    })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '8px',
                      border: '2px solid #D3C1FF',
                      fontSize: '14px',
                      fontFamily: "'Nunito', sans-serif",
                    }}
                  >
                    <option value="never">Never</option>
                    <option value="past">Past</option>
                    <option value="recent">Recent</option>
                    <option value="ongoing">Ongoing</option>
                  </select>
                </div>

                {/* Alcohol Use */}
                <div style={{
                  padding: '16px',
                  backgroundColor: '#F5EFFF',
                  borderRadius: '12px',
                  border: '2px solid #D3C1FF',
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#6750A4',
                    marginBottom: '8px',
                  }}>
                    Alcohol Use
                  </div>
                  <select
                    value={healthFormData.alcohol_use || 'none'}
                    onChange={(e) => setHealthFormData({
                      ...healthFormData,
                      alcohol_use: e.target.value
                    })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '8px',
                      border: '2px solid #D3C1FF',
                      fontSize: '14px',
                      fontFamily: "'Nunito', sans-serif",
                    }}
                  >
                    <option value="none">None</option>
                    <option value="occasional">Occasional</option>
                    <option value="regular">Regular</option>
                    <option value="daily">Daily</option>
                    <option value="concerned">Concerned</option>
                  </select>
                </div>

                {/* Drug Use */}
                <div style={{
                  padding: '16px',
                  backgroundColor: '#F5EFFF',
                  borderRadius: '12px',
                  border: '2px solid #D3C1FF',
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#6750A4',
                    marginBottom: '8px',
                  }}>
                    Drug Use
                  </div>
                  <select
                    value={healthFormData.drug_use || 'none'}
                    onChange={(e) => setHealthFormData({
                      ...healthFormData,
                      drug_use: e.target.value
                    })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '8px',
                      border: '2px solid #D3C1FF',
                      fontSize: '14px',
                      fontFamily: "'Nunito', sans-serif",
                    }}
                  >
                    <option value="none">None</option>
                    <option value="occasional">Occasional</option>
                    <option value="regular">Regular</option>
                    <option value="daily">Daily</option>
                    <option value="concerned">Concerned</option>
                  </select>
                </div>

                {/* Feels Generally Safe */}
                <div style={{
                  padding: '16px',
                  backgroundColor: '#F5EFFF',
                  borderRadius: '12px',
                  border: '2px solid #D3C1FF',
                }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    fontFamily: "'Nunito', sans-serif",
                  }}>
                    <input
                      type="checkbox"
                      checked={healthFormData.feels_generally_safe !== false}
                      onChange={(e) => setHealthFormData({
                        ...healthFormData,
                        feels_generally_safe: e.target.checked
                      })}
                      style={{
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                        accentColor: '#D3C1FF',
                      }}
                    />
                    <span style={{ fontSize: '16px', color: '#6750A4', fontWeight: '500' }}>
                      Feels generally safe
                    </span>
                  </label>
                </div>

                {/* Has Safety Plan */}
                <div style={{
                  padding: '16px',
                  backgroundColor: '#F5EFFF',
                  borderRadius: '12px',
                  border: '2px solid #D3C1FF',
                }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    fontFamily: "'Nunito', sans-serif",
                  }}>
                    <input
                      type="checkbox"
                      checked={healthFormData.has_safety_plan || false}
                      onChange={(e) => setHealthFormData({
                        ...healthFormData,
                        has_safety_plan: e.target.checked
                      })}
                      style={{
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                        accentColor: '#D3C1FF',
                      }}
                    />
                    <span style={{ fontSize: '16px', color: '#6750A4', fontWeight: '500' }}>
                      Has safety plan
                    </span>
                  </label>
                </div>

                {/* Risk Level Display */}
                <div style={{
                  padding: '16px',
                  backgroundColor: '#E8F9F5',
                  borderRadius: '12px',
                  border: '2px solid #7DD3C0',
                  marginTop: '8px',
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#6750A4',
                    marginBottom: '8px',
                    fontFamily: "'Nunito', sans-serif",
                  }}>
                    Current Risk Level
                  </div>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: healthProfile?.baseline_risk_level === 'high' ? '#EF4444' :
                           healthProfile?.baseline_risk_level === 'medium' ? '#F59E0B' : '#7DD3C0',
                    fontFamily: "'Nunito', sans-serif",
                  }}>
                    {healthProfile?.baseline_risk_level === 'low' && '✓ Low Risk'}
                    {healthProfile?.baseline_risk_level === 'medium' && '⚠️ Medium Risk'}
                    {healthProfile?.baseline_risk_level === 'high' && '⚠️ High Risk'}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{
                display: 'flex',
                gap: '12px',
                marginTop: '32px',
                justifyContent: 'flex-end',
              }}>
                <button
                  onClick={() => setShowHealthModal(false)}
                  style={{
                    ...styles.button,
                    ...styles.secondaryButton,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveHealthProfile}
                  style={{
                    ...styles.button,
                    ...styles.primaryButton,
                  }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
