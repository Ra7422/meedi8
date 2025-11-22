import React, { useState, useEffect, useRef } from "react";
import { useGamification } from "../context/GamificationContext";

export default function BreathingExercise({ inline = false, onSessionComplete }) {
  const { completeBreathingSession } = useGamification();
  const [isActive, setIsActive] = useState(false);
  const [step, setStep] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [mode, setMode] = useState("box");
  const [currentTheme, setCurrentTheme] = useState("");
  const [showAchievement, setShowAchievement] = useState(null);

  const timerRef = useRef(null);
  const timeCounterRef = useRef(null);

  const modes = {
    box: [4, 4, 4, 4],
    "478": [4, 7, 8, 0],
    coh: [5, 0, 5, 0]
  };

  const milestones = {
    1: { text: "First Breath 🌱", desc: "You've started your journey" },
    3: { text: "Finding Rhythm 🌊", desc: "Your breath is flowing", theme: "teal" },
    5: { text: "Centered Mind ✨", desc: "You're in the zone" },
    10: { text: "Meditation Master 🧘", desc: "Incredible focus!", theme: "gold" }
  };

  const labels = ["Inhale", "Hold", "Exhale", "Hold"];

  const currentSegments = modes[mode];

  useEffect(() => {
    if (showAchievement) {
      const timer = setTimeout(() => setShowAchievement(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [showAchievement]);

  useEffect(() => {
    if (!isActive) return;

    if (secondsLeft > 0) {
      timerRef.current = setTimeout(() => {
        setSecondsLeft(s => s - 1);
      }, 1000);
    } else {
      // Move to next step
      const nextStep = (step + 1) % 4;

      // Complete cycle after exhale hold (when returning to inhale)
      if (nextStep === 0 && cyclesCompleted > 0) {
        const newCycles = cyclesCompleted + 1;
        setCyclesCompleted(newCycles);

        if (milestones[newCycles]) {
          setShowAchievement(milestones[newCycles]);
          if (milestones[newCycles].theme) {
            setCurrentTheme(milestones[newCycles].theme);
          }
        }
      }

      setStep(nextStep);
      setSecondsLeft(currentSegments[nextStep]);
    }

    return () => clearTimeout(timerRef.current);
  }, [isActive, secondsLeft, step, cyclesCompleted, currentSegments]);

  useEffect(() => {
    if (!isActive) return;

    timeCounterRef.current = setInterval(() => {
      setTotalSeconds(t => t + 1);
    }, 1000);

    return () => clearInterval(timeCounterRef.current);
  }, [isActive]);

  const handleStart = () => {
    if (cyclesCompleted === 0) {
      setCyclesCompleted(1);
    }
    setStep(0);
    setSecondsLeft(currentSegments[0]);
    setIsActive(true);
  };

  const handlePause = () => {
    setIsActive(false);
    clearTimeout(timerRef.current);
    clearInterval(timeCounterRef.current);
  };

  const handleComplete = async () => {
    handlePause();

    if (cyclesCompleted > 0 && totalSeconds > 0) {
      try {
        // Map mode names for backend
        const modeMap = { box: "box", "478": "478", coh: "coherence" };
        await completeBreathingSession(
          modeMap[mode] || "box",
          cyclesCompleted,
          totalSeconds
        );

        if (onSessionComplete) {
          onSessionComplete({ mode, cycles: cyclesCompleted, duration: totalSeconds });
        }
      } catch (err) {
        console.error("Failed to log breathing session:", err);
      }
    }

    // Reset for next session
    setCyclesCompleted(0);
    setTotalSeconds(0);
    setStep(0);
    setCurrentTheme("");
  };

  const handleModeChange = (e) => {
    if (isActive) {
      handlePause();
    }
    setMode(e.target.value);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScale = () => {
    if (step === 0 || step === 1) return 1.15; // Inhale/hold
    return 0.65; // Exhale/hold
  };

  const themeClass = currentTheme ? `theme-${currentTheme}` : "";

  const containerStyle = inline ? styles.inlineContainer : styles.container;
  const cardStyle = inline ? styles.inlineCard : styles.card;

  return (
    <div style={containerStyle}>
      <style>{breathingStyles}</style>

      <div style={cardStyle}>
        <h1 style={styles.title}>🫧 Center Yourself</h1>
        <p style={styles.encouragement}>
          You're about to discuss this with the other person and the AI mediator.
          Take a moment to center yourself and prepare for a calm, productive conversation.
          Finding your calm now will help you communicate clearly and listen openly for the best results.
        </p>

        <div style={styles.recommendation}>
          ⏱️ <strong>Recommendation:</strong> 2-3 minutes while you wait
        </div>

        <div className={`dot-wrap ${themeClass}`} style={styles.dotWrap}>
          <div
            className="halo"
            style={{
              ...styles.halo,
              transform: `scale(${getScale()})`
            }}
          />
          <div
            className="dot"
            style={{
              ...styles.dot,
              transform: `scale(${getScale()})`
            }}
          />
        </div>

        <div style={styles.prompt}>
          {isActive ? labels[step] : "Press Start"}
        </div>
        <p style={styles.sub}>
          {isActive ? `${secondsLeft}s` : "—"}
        </p>

        <div style={styles.stats}>
          <div style={styles.stat}>
            <strong style={styles.statStrong}>{cyclesCompleted}</strong> cycles
          </div>
          <div style={styles.stat}>
            <strong style={styles.statStrong}>{formatTime(totalSeconds)}</strong> time
          </div>
        </div>

        {showAchievement && (
          <div className="achievement" style={styles.achievement}>
            <p style={styles.achievementText}>{showAchievement.text}</p>
            <p style={{...styles.muted, fontSize: "12px", margin: "4px 0 0"}}>
              {showAchievement.desc}
            </p>
          </div>
        )}

        <div style={styles.row}>
          <label style={styles.muted}>
            Mode:
            <select
              value={mode}
              onChange={handleModeChange}
              style={styles.select}
            >
              <option value="box">Box 4-4-4-4</option>
              <option value="478">4-7-8 Calm</option>
              <option value="coh">Coherence 5-5</option>
            </select>
          </label>
          <button onClick={handleStart} disabled={isActive} style={styles.button}>
            Start
          </button>
          <button onClick={handlePause} style={{...styles.button, ...styles.mutedButton}}>
            Pause
          </button>
          {cyclesCompleted > 0 && (
            <button
              onClick={handleComplete}
              style={{
                ...styles.button,
                background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                marginLeft: "8px"
              }}
            >
              Complete (+5)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "grid",
    placeItems: "center",
    minHeight: "100%",
    padding: "24px",
    background: "#0b0b14",
    color: "#e9e7ff"
  },
  inlineContainer: {
    width: "100%",
    padding: "20px",
    background: "#0b0b14",
    color: "#e9e7ff",
    borderRadius: "12px"
  },
  card: {
    maxWidth: "520px",
    width: "100%",
    textAlign: "center"
  },
  inlineCard: {
    width: "100%",
    textAlign: "center"
  },
  encouragement: {
    fontSize: "14px",
    lineHeight: "1.6",
    color: "#c4b5fd",
    margin: "8px 0 16px 0",
    padding: "12px 16px",
    background: "rgba(139, 92, 246, 0.1)",
    borderRadius: "8px",
    border: "1px solid rgba(139, 92, 246, 0.3)"
  },
  title: {
    fontSize: "18px",
    margin: "6px 0 0",
    opacity: 0.9
  },
  muted: {
    opacity: 0.7,
    fontSize: "13px"
  },
  recommendation: {
    background: "#1a1530",
    border: "1px solid #2a2350",
    padding: "10px",
    borderRadius: "8px",
    margin: "10px 0",
    fontSize: "13px",
    opacity: 0.8
  },
  dotWrap: {
    position: "relative",
    height: "288px",
    display: "grid",
    placeItems: "center",
    margin: "22px 0"
  },
  halo: {
    position: "absolute",
    width: "256px",
    height: "256px",
    borderRadius: "999px",
    background: "radial-gradient(circle at 50% 50%, rgba(124, 58, 237, 0.25), transparent 60%)",
    filter: "blur(10px)",
    opacity: 0.6,
    transition: "transform 0.6s cubic-bezier(0.2, 0.9, 0.2, 1)"
  },
  dot: {
    width: "160px",
    height: "160px",
    borderRadius: "999px",
    background: "radial-gradient(circle at 35% 30%, #a78bfa, #8b5cf6)",
    boxShadow: "0 0 24px rgba(109, 40, 217, 0.67) inset, 0 0 30px rgba(109, 40, 217, 0.53)",
    transition: "transform 0.8s cubic-bezier(0.2, 0.9, 0.2, 1), background 0.8s ease"
  },
  prompt: {
    fontSize: "22px",
    letterSpacing: "0.2px",
    margin: "4px 0 2px"
  },
  sub: {
    opacity: 0.8,
    fontSize: "13px",
    margin: 0
  },
  stats: {
    display: "flex",
    gap: "16px",
    justifyContent: "center",
    margin: "12px 0",
    fontSize: "14px"
  },
  stat: {
    opacity: 0.7
  },
  statStrong: {
    color: "#a78bfa",
    fontWeight: 600
  },
  achievement: {
    animation: "fadeInUp 0.5s ease",
    background: "#1a1530",
    border: "1px solid #2a2350",
    padding: "12px 16px",
    borderRadius: "10px",
    margin: "12px 0",
    display: "inline-block"
  },
  achievementText: {
    fontSize: "15px",
    margin: 0
  },
  row: {
    display: "flex",
    gap: "8px",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: "10px"
  },
  button: {
    background: "#1a1530",
    border: "1px solid #2a2350",
    color: "#e9e7ff",
    padding: "8px 12px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "14px"
  },
  mutedButton: {
    opacity: 0.7
  },
  select: {
    background: "#1a1530",
    border: "1px solid #2a2350",
    color: "#e9e7ff",
    padding: "8px 12px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "14px",
    marginLeft: "8px"
  },
  readyBtn: {
    background: "linear-gradient(135deg, #10b981, #059669)",
    borderColor: "#059669",
    border: "1px solid",
    color: "white",
    fontWeight: 600,
    padding: "12px 24px",
    fontSize: "15px",
    borderRadius: "10px",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)"
  }
};

const breathingStyles = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .theme-teal .dot {
    background: radial-gradient(circle at 35% 30%, #5eead4, #14b8a6) !important;
    box-shadow: 0 0 24px rgba(15, 118, 110, 0.67) inset, 0 0 30px rgba(15, 118, 110, 0.53) !important;
  }
  .theme-teal .halo {
    background: radial-gradient(circle at 50% 50%, rgba(20, 184, 166, 0.25), transparent 60%) !important;
  }

  .theme-gold .dot {
    background: radial-gradient(circle at 35% 30%, #fbbf24, #f59e0b) !important;
    box-shadow: 0 0 24px rgba(217, 119, 6, 0.67) inset, 0 0 30px rgba(217, 119, 6, 0.53) !important;
  }
  .theme-gold .halo {
    background: radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.25), transparent 60%) !important;
  }

  @media (prefers-reduced-motion: reduce) {
    .dot, .halo { transition: none !important; }
    .achievement { animation: none !important; }
  }
`;
