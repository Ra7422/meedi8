import React from 'react';

/**
 * Speech Bubble Component
 * Uses actual Figma SVG (speech1.svg)
 * Color: #6750A4
 */
export default function SpeechBubble({ children, style = {} }) {
  const { width, height, ...otherStyles } = style;
  const bubbleWidth = width || '230px';
  const bubbleHeight = height || '127px';

  return (
    <div style={{ position: 'relative', display: 'inline-block', width: bubbleWidth, height: bubbleHeight, ...otherStyles }}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 230 127"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'relative', zIndex: 2 }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Actual Figma speech bubble path from speech1.svg */}
        <path d="M210.838 107.858L207.074 20.2697C206.959 17.5934 205.024 15.3812 201.271 13.6332C197.517 11.8851 193.063 11.1218 187.907 11.3434L37.9159 17.7889C32.76 18.0105 28.3871 19.1531 24.7974 21.2167C21.2076 23.2803 19.4703 25.6503 19.5853 28.3266L22.0945 86.7188C22.2095 89.3951 24.1438 91.6073 27.8974 93.3554C31.6509 95.1034 36.1056 95.8667 41.2616 95.6451L172.503 90.0053L210.838 107.858Z" fill="#6750A4"/>
      </svg>

      {/* Content overlay */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '30px',
        right: '30px',
        bottom: '25px',
        textAlign: 'center',
        zIndex: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {children}
      </div>
    </div>
  );
}
