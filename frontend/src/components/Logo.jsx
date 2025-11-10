import React from 'react';

export default function Logo({ style = {} }) {
  return (
    <div style={{ position: 'relative', zIndex: 1, ...style }}>
      <svg
        width="220"
        height="80"
        viewBox="0 0 220 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Cloud shape */}
        <path
          d="M 30 35 Q 20 20, 35 15 Q 40 10, 50 15 Q 60 10, 70 15 Q 85 20, 75 35 Q 80 45, 70 50 L 35 50 Q 25 45, 30 35 Z"
          stroke="#7DD3C0"
          strokeWidth="3"
          fill="none"
        />
        {/* Text "Clean Air" */}
        <text
          x="100"
          y="40"
          fill="#7DD3C0"
          fontSize="24"
          fontFamily="sans-serif"
          fontWeight="400"
        >
          Clean Air
        </text>
      </svg>
    </div>
  );
}
