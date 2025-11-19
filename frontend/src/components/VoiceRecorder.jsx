import React, { useState, useRef } from "react";

export default function VoiceRecorder({
  onRecordingComplete,
  disabled = false,
  inline = false,
  isGuest = false,
  isPremium = true,
  onPremiumRequired = null
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const startRecording = async () => {
    // Check if guest user - show restriction message
    if (isGuest) {
      alert("Voice messages are available when you create an account. Sign up to express yourself with voice notes!");
      return;
    }

    // Check if non-premium - show upgrade message
    if (!isPremium && onPremiumRequired) {
      onPremiumRequired();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Use WebM format with Opus codec (widely supported)
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());

        // Calculate duration (approximate)
        const durationSeconds = recordingTime;

        onRecordingComplete(audioBlob, durationSeconds);

        // Reset
        setRecordingTime(0);
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone. Please check your browser permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {!isRecording ? (
        <button
          onClick={startRecording}
          disabled={disabled}
          title="Record voice message"
          style={{
            padding: inline ? "4px" : "12px",
            background: inline ? "transparent" : (disabled ? "#d1d5db" : "#3b82f6"),
            color: inline ? "#6b7280" : "white",
            border: "none",
            borderRadius: inline ? "0" : "8px",
            fontSize: inline ? "18px" : "20px",
            cursor: disabled ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.2s",
            minWidth: inline ? "32px" : "48px",
            minHeight: inline ? "32px" : "48px"
          }}
          onMouseEnter={(e) => !disabled && !inline && (e.currentTarget.style.background = "#2563eb")}
          onMouseLeave={(e) => !disabled && !inline && (e.currentTarget.style.background = "#3b82f6")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
        </button>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
          <button
            onClick={stopRecording}
            style={{
              padding: "12px",
              background: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "20px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: "48px",
              minHeight: "48px"
            }}
            title="Stop recording"
          >
            ⏹
          </button>
          <div style={{
            flex: 1,
            padding: "12px 16px",
            background: "#fef2f2",
            borderRadius: "8px",
            border: "2px solid #ef4444",
            display: "flex",
            alignItems: "center",
            gap: "12px"
          }}>
            <span style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: "#ef4444",
              animation: "pulse 1.5s ease-in-out infinite"
            }} />
            <span style={{ fontWeight: "600", color: "#991b1b", fontSize: "16px" }}>
              Recording: {formatTime(recordingTime)}
            </span>
          </div>
        </div>
      )}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </>
  );
}
