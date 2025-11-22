import React, { useState, useEffect } from "react";
import { useGamification } from "../../context/GamificationContext";

export default function ScoreHistoryChart({ height = 120 }) {
  const { fetchScoreHistory, scoreHistory } = useGamification();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScoreHistory(30)
      .then(() => setLoading(false))
      .catch(() => setLoading(false));
  }, [fetchScoreHistory]);

  if (loading) {
    return (
      <div style={{
        height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(139, 92, 246, 0.1)",
        borderRadius: "12px",
        color: "rgba(255, 255, 255, 0.5)",
        fontSize: "13px"
      }}>
        Loading history...
      </div>
    );
  }

  if (!scoreHistory || scoreHistory.length === 0) {
    return (
      <div style={{
        height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(139, 92, 246, 0.1)",
        borderRadius: "12px",
        color: "rgba(255, 255, 255, 0.5)",
        fontSize: "13px"
      }}>
        No activity yet
      </div>
    );
  }

  // Process data: group by day and get end-of-day score
  const dailyScores = processScoreHistory(scoreHistory);

  if (dailyScores.length < 2) {
    return (
      <div style={{
        height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(139, 92, 246, 0.1)",
        borderRadius: "12px",
        color: "rgba(255, 255, 255, 0.5)",
        fontSize: "13px"
      }}>
        Need more data for chart
      </div>
    );
  }

  // Calculate chart dimensions
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartWidth = 300;
  const chartHeight = height - padding.top - padding.bottom;

  // Get min/max for scaling
  const scores = dailyScores.map(d => d.score);
  const minScore = Math.max(0, Math.min(...scores) - 5);
  const maxScore = Math.min(100, Math.max(...scores) + 5);

  // Create path for the line
  const points = dailyScores.map((d, i) => {
    const x = padding.left + (i / (dailyScores.length - 1)) * (chartWidth - padding.left - padding.right);
    const y = padding.top + chartHeight - ((d.score - minScore) / (maxScore - minScore)) * chartHeight;
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) =>
    (i === 0 ? "M" : "L") + `${p.x},${p.y}`
  ).join(" ");

  // Area path for gradient fill
  const areaPath = linePath +
    ` L${points[points.length - 1].x},${padding.top + chartHeight}` +
    ` L${points[0].x},${padding.top + chartHeight} Z`;

  // Get trend direction
  const firstScore = dailyScores[0].score;
  const lastScore = dailyScores[dailyScores.length - 1].score;
  const trend = lastScore - firstScore;
  const trendColor = trend >= 0 ? "#22c55e" : "#ef4444";

  return (
    <div style={{
      background: "rgba(139, 92, 246, 0.1)",
      borderRadius: "12px",
      padding: "12px",
      border: "1px solid rgba(139, 92, 246, 0.3)"
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "8px"
      }}>
        <span style={{ fontSize: "14px", fontWeight: "600", color: "white" }}>
          30-Day Trend
        </span>
        <span style={{
          fontSize: "12px",
          fontWeight: "600",
          color: trendColor
        }}>
          {trend >= 0 ? "+" : ""}{trend} pts
        </span>
      </div>

      <svg width="100%" height={height} viewBox={`0 0 ${chartWidth} ${height}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(val => {
          if (val < minScore || val > maxScore) return null;
          const y = padding.top + chartHeight - ((val - minScore) / (maxScore - minScore)) * chartHeight;
          return (
            <g key={val}>
              <line
                x1={padding.left}
                y1={y}
                x2={chartWidth - padding.right}
                y2={y}
                stroke="rgba(139, 92, 246, 0.3)"
                strokeWidth="1"
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="rgba(255, 255, 255, 0.5)"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path
          d={areaPath}
          fill="url(#scoreGradient)"
        />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="#7c3aed"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3"
            fill="white"
            stroke="#7c3aed"
            strokeWidth="2"
          />
        ))}

        {/* X-axis labels (first and last date) */}
        <text
          x={points[0].x}
          y={height - 8}
          textAnchor="start"
          fontSize="10"
          fill="rgba(255, 255, 255, 0.5)"
        >
          {formatDate(dailyScores[0].date)}
        </text>
        <text
          x={points[points.length - 1].x}
          y={height - 8}
          textAnchor="end"
          fontSize="10"
          fill="rgba(255, 255, 255, 0.5)"
        >
          {formatDate(dailyScores[dailyScores.length - 1].date)}
        </text>
      </svg>
    </div>
  );
}

function processScoreHistory(events) {
  // Group events by day and get the final score for each day
  const dayMap = new Map();

  // Events are sorted by created_at desc, so reverse to process chronologically
  const sortedEvents = [...events].reverse();

  sortedEvents.forEach(event => {
    const date = new Date(event.created_at).toDateString();
    dayMap.set(date, {
      date: new Date(event.created_at),
      score: event.score_after
    });
  });

  // Convert to array and sort by date
  return Array.from(dayMap.values())
    .sort((a, b) => a.date - b.date)
    .slice(-30); // Last 30 days
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });
}
