import React, { useState } from "react";

type SignalType = "break" | "hurt" | "agree" | "sorry" | "hear_you" | "disagree";
type ButtonPanelProps = { roomId: string; onSignalSent?: () => void };

const API_BASE: string =
  // Vite
  ((typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_URL) as string) ||
  // Next
  ((typeof process !== "undefined" && (process as any).env?.NEXT_PUBLIC_API_BASE) as string) ||
  // Fallback for local dev
  "http://localhost:8000";

const SIGNALS: { type: SignalType; label: string; emoji: string; classes: string }[] = [
  { type: "break",     label: "Need a Break", emoji: "⏸️", classes: "bg-gray-700 hover:bg-gray-800" },
  { type: "hear_you",  label: "I Hear You",   emoji: "👂", classes: "bg-indigo-600 hover:bg-indigo-700" },
  { type: "sorry",     label: "I’m Sorry",    emoji: "🙏", classes: "bg-amber-600 hover:bg-amber-700" },
  { type: "agree",     label: "I Agree",      emoji: "🤝", classes: "bg-emerald-600 hover:bg-emerald-700" },
  { type: "disagree",  label: "I Disagree",   emoji: "⚖️", classes: "bg-red-600 hover:bg-red-700" },
  { type: "hurt",      label: "That Hurt",    emoji: "💔", classes: "bg-pink-600 hover:bg-pink-700" },
];

export default function ButtonPanel({ roomId, onSignalSent }: ButtonPanelProps) {
  const [pending, setPending] = useState<SignalType | null>(null);
  const token =
    (typeof window !== "undefined" &&
      (localStorage.getItem("token") || localStorage.getItem("access_token") || "")) ||
    "";

  async function sendSignal(type: SignalType) {
    if (!roomId) return;
    setPending(type);
    try {
      const res = await fetch(`${API_BASE}/rooms/${roomId}/signal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ signal_type: type }),
      });
      await res.json().catch(() => null);
      onSignalSent?.();
    } catch (e) {
      console.error("sendSignal failed", e);
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="sticky bottom-0 left-0 right-0 z-20 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-t">
      <div className="mx-auto max-w-5xl px-3 py-3">
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-3">
          {SIGNALS.map((s) => (
            <button
              key={s.type}
              onClick={() => sendSignal(s.type)}
              disabled={!!pending}
              className={[
                "min-w-[120px] h-[60px] rounded-xl text-white font-semibold",
                "flex items-center justify-center gap-2 select-none",
                "transition-transform duration-100 active:scale-95",
                "shadow-sm hover:shadow",
                s.classes,
                pending === s.type ? "animate-pulse" : ""
              ].join(" ")}
              aria-label={s.label}
            >
              <span className="text-2xl leading-none">{s.emoji}</span>
              <span className="text-[17px]">{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
