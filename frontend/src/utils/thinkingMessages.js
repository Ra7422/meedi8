/**
 * Simulates Meedi "thinking" by showing progressive messages
 * while waiting for async operations like Gemini analysis
 */

const THINKING_PHRASES = [
  "Let me take a look at what you've shared...",
  "Hmm...",
  "Ok...",
  "Yep...",
  "Ok...",
  "Hmm...",
  "Yes...",
  "Ok...",
  "One sec...",
  "Right..."
];

/**
 * Show progressive "thinking" messages from Meedi
 * @param {Function} addMessage - Function to add message to chat
 * @param {number} totalDuration - Total expected duration in ms (e.g., 15000 for 15 seconds)
 * @returns {Function} cleanup function to stop the interval
 */
export function startThinkingMessages(addMessage, totalDuration = 15000) {
  const interval = totalDuration / THINKING_PHRASES.length;
  let currentIndex = 0;

  // Show first message immediately
  addMessage({
    role: "assistant",
    content: THINKING_PHRASES[0],
    isThinking: true
  });
  currentIndex++;

  // Show remaining messages at intervals
  const timer = setInterval(() => {
    if (currentIndex < THINKING_PHRASES.length) {
      addMessage({
        role: "assistant",
        content: THINKING_PHRASES[currentIndex],
        isThinking: true
      });
      currentIndex++;
    } else {
      clearInterval(timer);
    }
  }, interval);

  // Return cleanup function
  return () => clearInterval(timer);
}

/**
 * Remove all thinking messages from message array
 * @param {Array} messages - Current messages array
 * @returns {Array} Messages with thinking messages removed
 */
export function removeThinkingMessages(messages) {
  return messages.filter(msg => !msg.isThinking);
}
