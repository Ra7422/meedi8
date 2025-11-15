### Fonts

Telegram's design philosophy is to feel native to the operating system it's running on. Therefore, it uses the default system fonts:

*   **iOS/macOS:** **SF Pro**. This is the standard font for all Apple devices.
*   **Android:** **Roboto**. This is the standard font for the Android OS.
*   **Windows:** **Segoe UI**.

**Recommendation for Meedi8:**
To emulate this, you should use a "system font stack" in your CSS. This tells the browser to use the default font of the user's device, ensuring optimal performance and a native look.

You can apply this in your React style objects like this:
```javascript
const styles = {
  container: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    // ... other styles
  }
};
```
This line prioritizes Apple's font (`-apple-system`), then Segoe UI, then Roboto, and falls back to common sans-serif fonts.

---

### Color Palette

Telegram's color scheme is clean and functional, with a distinct brand blue and specific colors for chat bubbles. Here are the key HEX codes for the default "Day" theme.

#### Core Colors
*   **Brand Blue (Headers, Icons, Accents):** `#0088CC`
*   **Main Background:** `#FFFFFF` (White)
*   **Chat/List Background:** `#F7F7F7` (A very light grey, sometimes with a subtle pattern)
*   **Primary Text:** `#000000` (Black)
*   **Secondary/Hint Text (Timestamps, etc.):** `#8A8A8F`

#### Chat Bubble Colors
*   **Incoming Message Bubble:** `#FFFFFF` (White, with a subtle border or shadow)
*   **Outgoing Message Bubble:** `#E1FFC7` (A light, airy green)
*   **Message Text:** `#000000` (Black)
*   **Timestamp Text (within bubbles):** `#80919A` (A muted, slightly blue-grey)
*   **Read Ticks (Double Checkmarks):** `#52C234` (A bright, clear green)

### Example Implementation

Here is how you could structure a style object for a chat component in Meedi8 to match the Telegram theme.

```javascript
const telegramStyles = {
  // Main chat window
  chatContainer: {
    backgroundColor: '#F7F7F7',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  
  // Incoming message bubble
  incomingBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: '18px',
    padding: '8px 12px',
    maxWidth: '75%',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
  },

  // Outgoing message bubble
  outgoingBubble: {
    backgroundColor: '#E1FFC7',
    borderRadius: '18px',
    padding: '8px 12px',
    maxWidth: '75%',
    alignSelf: 'flex-end', // To align it to the right
  },

  // Text inside any bubble
  messageText: {
    color: '#000000',
    fontSize: '16px',
    lineHeight: '1.4',
  },

  // Timestamp below the message text
  timestamp: {
    color: '#80919A',
    fontSize: '12px',
    textAlign: 'right',
    marginTop: '4px',
  },

  // The header bar of the app
  header: {
    backgroundColor: '#0088CC',
    color: '#FFFFFF',
  }
};
