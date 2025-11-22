import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { apiRequest } from "../api/client";
import { useAuth } from "./AuthContext";

const GamificationContext = createContext(null);

export function GamificationProvider({ children }) {
  const { token, user } = useAuth();

  // Health Score state
  const [healthScore, setHealthScore] = useState(null);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Streak state
  const [streakData, setStreakData] = useState(null);

  // Journal state
  const [journalEntries, setJournalEntries] = useState([]);
  const [journalTotalCount, setJournalTotalCount] = useState(0);

  // Breathing state
  const [breathingHistory, setBreathingHistory] = useState([]);

  // Mood state
  const [moodHistory, setMoodHistory] = useState([]);

  // Achievements state
  const [achievements, setAchievements] = useState([]);
  const [achievementStats, setAchievementStats] = useState({ earned: 0, total: 0 });

  // Toast notifications for score changes
  const [scoreToast, setScoreToast] = useState(null);

  // Achievement toast
  const [achievementToast, setAchievementToast] = useState(null);

  // Fetch health score data
  const fetchHealthScore = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const data = await apiRequest("/gamification/health-score", "GET", null, token);
      setHealthScore(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch health score:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch score history
  const fetchScoreHistory = useCallback(async (limit = 30) => {
    if (!token) return;

    try {
      const data = await apiRequest(`/gamification/health-score/history?limit=${limit}`, "GET", null, token);
      setScoreHistory(data.events);
      return data;
    } catch (err) {
      console.error("Failed to fetch score history:", err);
      throw err;
    }
  }, [token]);

  // Fetch streak data
  const fetchStreaks = useCallback(async () => {
    if (!token) return;

    try {
      const data = await apiRequest("/gamification/streaks", "GET", null, token);
      setStreakData(data);
      return data;
    } catch (err) {
      console.error("Failed to fetch streaks:", err);
      throw err;
    }
  }, [token]);

  // Protect streak (PRO feature)
  const protectStreak = useCallback(async () => {
    if (!token) return;

    try {
      const data = await apiRequest("/gamification/streaks/protect", "POST", null, token);
      setStreakData(data);
      return data;
    } catch (err) {
      console.error("Failed to protect streak:", err);
      throw err;
    }
  }, [token]);

  // Fetch journal entries
  const fetchJournal = useCallback(async (limit = 20, offset = 0) => {
    if (!token) return;

    try {
      const data = await apiRequest(`/gamification/journal?limit=${limit}&offset=${offset}`, "GET", null, token);
      setJournalEntries(data.entries);
      setJournalTotalCount(data.total_count);
      return data;
    } catch (err) {
      console.error("Failed to fetch journal:", err);
      throw err;
    }
  }, [token]);

  // Create journal entry
  const createJournalEntry = useCallback(async (content, prompt = null) => {
    if (!token) return;

    try {
      const data = await apiRequest("/gamification/journal", "POST", { content, prompt }, token);
      // Refresh journal and health score
      await fetchJournal();
      await fetchHealthScore();

      // Show score toast
      setScoreToast({
        message: "Gratitude entry saved!",
        score: "+3",
        type: "gratitude"
      });
      setTimeout(() => setScoreToast(null), 3000);

      // Show achievement toast if earned
      if (data.new_achievements && data.new_achievements.length > 0) {
        setTimeout(() => {
          setAchievementToast(data.new_achievements[0]);
          setTimeout(() => setAchievementToast(null), 5000);
        }, 3500);
      }

      return data;
    } catch (err) {
      console.error("Failed to create journal entry:", err);
      throw err;
    }
  }, [token, fetchJournal, fetchHealthScore]);

  // Delete journal entry
  const deleteJournalEntry = useCallback(async (entryId) => {
    if (!token) return;

    try {
      await apiRequest(`/gamification/journal/${entryId}`, "DELETE", null, token);
      await fetchJournal();
      return true;
    } catch (err) {
      console.error("Failed to delete journal entry:", err);
      throw err;
    }
  }, [token, fetchJournal]);

  // Helper to show achievement toast
  const showAchievementToast = useCallback((achievement) => {
    setAchievementToast(achievement);
    setTimeout(() => setAchievementToast(null), 5000);
  }, []);

  // Complete breathing session
  const completeBreathingSession = useCallback(async (mode, cyclesCompleted, durationSeconds) => {
    if (!token) return;

    try {
      const data = await apiRequest("/gamification/breathing/complete", "POST", {
        mode,
        cycles_completed: cyclesCompleted,
        duration_seconds: durationSeconds
      }, token);

      // Refresh health score
      await fetchHealthScore();

      // Show score toast
      setScoreToast({
        message: `${mode} breathing complete!`,
        score: `+${data.score_earned}`,
        type: "breathing"
      });
      setTimeout(() => setScoreToast(null), 3000);

      // Show achievement toast if earned
      if (data.new_achievements && data.new_achievements.length > 0) {
        // Show first achievement (could queue multiple)
        setTimeout(() => showAchievementToast(data.new_achievements[0]), 3500);
      }

      return data;
    } catch (err) {
      console.error("Failed to log breathing session:", err);
      throw err;
    }
  }, [token, fetchHealthScore, showAchievementToast]);

  // Fetch breathing history
  const fetchBreathingHistory = useCallback(async (limit = 20) => {
    if (!token) return;

    try {
      const data = await apiRequest(`/gamification/breathing/history?limit=${limit}`, "GET", null, token);
      setBreathingHistory(data.sessions);
      return data;
    } catch (err) {
      console.error("Failed to fetch breathing history:", err);
      throw err;
    }
  }, [token]);

  // Create mood check-in
  const createMoodCheckin = useCallback(async (mood, energyLevel = null, note = null, context = null) => {
    if (!token) return;

    try {
      const payload = { mood };
      if (energyLevel) payload.energy_level = energyLevel;
      if (note) payload.note = note;
      if (context) payload.context = context;

      const data = await apiRequest("/gamification/mood", "POST", payload, token);

      // Refresh health score
      await fetchHealthScore();

      // Show score toast
      setScoreToast({
        message: "Mood logged!",
        score: "+2",
        type: "mood"
      });
      setTimeout(() => setScoreToast(null), 3000);

      // Show achievement toast if earned
      if (data.new_achievements && data.new_achievements.length > 0) {
        setTimeout(() => {
          setAchievementToast(data.new_achievements[0]);
          setTimeout(() => setAchievementToast(null), 5000);
        }, 3500);
      }

      return data;
    } catch (err) {
      console.error("Failed to create mood check-in:", err);
      throw err;
    }
  }, [token, fetchHealthScore]);

  // Fetch mood history
  const fetchMoodHistory = useCallback(async (limit = 30) => {
    if (!token) return;

    try {
      const data = await apiRequest(`/gamification/mood/history?limit=${limit}`, "GET", null, token);
      setMoodHistory(data.checkins);
      return data;
    } catch (err) {
      console.error("Failed to fetch mood history:", err);
      throw err;
    }
  }, [token]);

  // Fetch achievements
  const fetchAchievements = useCallback(async () => {
    if (!token) return;

    try {
      const data = await apiRequest("/gamification/achievements", "GET", null, token);
      setAchievements(data.achievements);
      setAchievementStats({ earned: data.total_earned, total: data.total_available });
      return data;
    } catch (err) {
      console.error("Failed to fetch achievements:", err);
      throw err;
    }
  }, [token]);

  // Perform daily check-in
  const performDailyCheckin = useCallback(async () => {
    if (!token) return;

    try {
      const data = await apiRequest("/gamification/daily-checkin", "POST", null, token);

      if (!data.already_checked_in) {
        // Refresh health score
        await fetchHealthScore();

        // Show score toast
        setScoreToast({
          message: "Daily check-in!",
          score: `+${data.score_earned}`,
          type: "checkin"
        });
        setTimeout(() => setScoreToast(null), 3000);

        // Show achievement toast if earned
        if (data.new_achievements && data.new_achievements.length > 0) {
          setTimeout(() => {
            setAchievementToast(data.new_achievements[0]);
            setTimeout(() => setAchievementToast(null), 5000);
          }, 3500);
        }
      }

      return data;
    } catch (err) {
      console.error("Failed to perform daily check-in:", err);
      throw err;
    }
  }, [token, fetchHealthScore]);

  // Auto-fetch data when user logs in
  useEffect(() => {
    if (token && user) {
      fetchHealthScore();
      fetchStreaks();
    } else {
      // Clear state on logout
      setHealthScore(null);
      setStreakData(null);
      setScoreHistory([]);
      setJournalEntries([]);
      setBreathingHistory([]);
      setMoodHistory([]);
      setAchievements([]);
      setAchievementStats({ earned: 0, total: 0 });
    }
  }, [token, user, fetchHealthScore, fetchStreaks]);

  // Helper to get tier color
  const getTierColor = (tier) => {
    switch (tier) {
      case "platinum": return "#E5E4E2";
      case "gold": return "#FFD700";
      case "silver": return "#C0C0C0";
      case "bronze":
      default: return "#CD7F32";
    }
  };

  // Helper to get score change color
  const getScoreChangeColor = (change) => {
    if (change > 0) return "#22c55e"; // green
    if (change < 0) return "#ef4444"; // red
    return "#6b7280"; // gray
  };

  return (
    <GamificationContext.Provider value={{
      // State
      healthScore,
      scoreHistory,
      streakData,
      journalEntries,
      journalTotalCount,
      breathingHistory,
      moodHistory,
      achievements,
      achievementStats,
      loading,
      error,
      scoreToast,
      achievementToast,

      // Actions
      fetchHealthScore,
      fetchScoreHistory,
      fetchStreaks,
      protectStreak,
      fetchJournal,
      createJournalEntry,
      deleteJournalEntry,
      completeBreathingSession,
      fetchBreathingHistory,
      createMoodCheckin,
      fetchMoodHistory,
      fetchAchievements,
      performDailyCheckin,

      // Helpers
      getTierColor,
      getScoreChangeColor,
    }}>
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error("useGamification must be used within a GamificationProvider");
  }
  return context;
}
