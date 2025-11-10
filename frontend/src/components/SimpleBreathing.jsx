import React, { useState, useEffect, useRef } from "react";

export default function SimpleBreathing({ startCountdown = false, allowRestart = false, hideEncouragement = false }) {
  const [countdown, setCountdown] = useState(null); // null = not started
  const [isBreathing, setIsBreathing] = useState(false);
  const [step, setStep] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(4);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);

  const timerRef = useRef(null);

  const handleRestart = () => {
    if (!allowRestart) return;

    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Reset to countdown state
    setCountdown(5);
    setIsBreathing(false);
    setStep(0);
    setSecondsLeft(4);
    setCyclesCompleted(0);
  };

  // Box breathing pattern: 4-4-4-4 (inhale, hold, exhale, hold)
  const breathingPattern = [4, 4, 4, 4];
  const labels = ["Inhale", "Hold", "Exhale", "Hold"];

  // Start countdown when startCountdown prop becomes true
  useEffect(() => {
    if (startCountdown && countdown === null) {
      setCountdown(5);
    }
  }, [startCountdown, countdown]);

  // Countdown timer
  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !isBreathing) {
      // Start breathing after countdown
      setIsBreathing(true);
      setStep(0);
      setSecondsLeft(breathingPattern[0]);
      setCyclesCompleted(1);
    }
  }, [countdown, isBreathing]);

  // Breathing cycle
  useEffect(() => {
    if (!isBreathing) return;

    if (secondsLeft > 0) {
      timerRef.current = setTimeout(() => {
        setSecondsLeft(s => s - 1);
      }, 1000);
    } else {
      // Move to next step
      const nextStep = (step + 1) % 4;

      // Complete cycle after exhale hold
      if (nextStep === 0) {
        setCyclesCompleted(c => c + 1);
      }

      setStep(nextStep);
      setSecondsLeft(breathingPattern[nextStep]);
    }

    return () => clearTimeout(timerRef.current);
  }, [isBreathing, secondsLeft, step]);

  const getScale = () => {
    if (step === 0 || step === 1) return 1.2; // Inhale/hold
    return 0.7; // Exhale/hold
  };

  const getColor = () => {
    if (countdown === null) return "#6b7280"; // Gray for waiting
    if (countdown > 0) return "#8b5cf6"; // Purple for countdown
    if (step === 0 || step === 1) return "#8b5cf6"; // Purple for inhale/hold
    return "#6366f1"; // Indigo for exhale/hold
  };

  return (
    <div style={styles.container}>
      <style>{breathingStyles}</style>

      {!hideEncouragement && (
        <div style={styles.encouragement}>
          ✨ You're about to discuss this with the other person and the AI mediator.
          {countdown === null ? (
            <> Share the invite link below to begin centering yourself.</>
          ) : (
            <> Take a moment to center yourself for a calm, productive conversation.</>
          )}
          {allowRestart && isBreathing && (
            <div style={{ marginTop: "8px", fontSize: "12px", opacity: 0.8 }}>
              Tap the circle to restart
            </div>
          )}
        </div>
      )}

      <div
        style={{
          ...styles.breathingArea,
          cursor: allowRestart && isBreathing ? "pointer" : "default"
        }}
        onClick={allowRestart && isBreathing ? handleRestart : undefined}
      >
        <div
          className={countdown !== null ? "breathing-dot" : ""}
          style={{
            ...styles.dot,
            transform: `scale(${countdown === null ? 0.9 : countdown > 0 ? 1 : getScale()})`,
            background: getColor(),
            boxShadow: `0 0 40px ${getColor()}, 0 0 80px ${getColor()}40`,
            opacity: countdown === null ? 0.5 : 1
          }}
        >
          {countdown === null ? (
            <div style={styles.waitingLabel}>Ready</div>
          ) : countdown > 0 ? (
            <div style={styles.countdownNumber}>{countdown}</div>
          ) : (
            <div style={styles.breathLabel}>{labels[step]}</div>
          )}
        </div>

        {isBreathing && (
          <div style={styles.breathingInfo}>
            <div style={styles.secondsDisplay}>{secondsLeft}s</div>
            <div style={styles.cycleCount}>{cyclesCompleted} cycles completed</div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    padding: "20px",
    background: "linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%)",
    borderRadius: "12px",
    marginBottom: "20px"
  },
  encouragement: {
    fontSize: "14px",
    lineHeight: "1.6",
    color: "#c4b5fd",
    margin: "0 0 20px 0",
    padding: "12px 16px",
    background: "rgba(139, 92, 246, 0.1)",
    borderRadius: "8px",
    border: "1px solid rgba(139, 92, 246, 0.3)",
    textAlign: "center"
  },
  breathingArea: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "40px 20px"
  },
  dot: {
    width: "180px",
    height: "180px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1), background 0.8s ease, box-shadow 0.8s ease",
    marginBottom: "20px"
  },
  countdownNumber: {
    fontSize: "80px",
    fontWeight: "700",
    color: "white",
    textShadow: "0 0 20px rgba(255, 255, 255, 0.5)"
  },
  breathLabel: {
    fontSize: "24px",
    fontWeight: "600",
    color: "white",
    textTransform: "uppercase",
    letterSpacing: "2px"
  },
  waitingLabel: {
    fontSize: "20px",
    fontWeight: "600",
    color: "white",
    textTransform: "uppercase",
    letterSpacing: "2px"
  },
  breathingInfo: {
    textAlign: "center",
    color: "#e9e7ff"
  },
  secondsDisplay: {
    fontSize: "32px",
    fontWeight: "600",
    marginBottom: "8px",
    color: "#c4b5fd"
  },
  cycleCount: {
    fontSize: "14px",
    opacity: 0.8
  }
};

const breathingStyles = `
  @keyframes pulse-glow {
    0%, 100% { filter: brightness(1); }
    50% { filter: brightness(1.2); }
  }

  .breathing-dot {
    animation: pulse-glow 2s ease-in-out infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    .breathing-dot {
      animation: none;
    }
  }
`;
