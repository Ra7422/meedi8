import React from 'react';

export default function WaveDecoration() {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '250px',
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <svg
        width="100%"
        height="250"
        viewBox="0 0 1000 250"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M 0,100 Q 250,50 500,100 T 1000,100 L 1000,0 L 0,0 Z"
          fill="none"
          stroke="#7DD3C0"
          strokeWidth="2"
          opacity="0.3"
        />
      </svg>
    </div>
  );
}
