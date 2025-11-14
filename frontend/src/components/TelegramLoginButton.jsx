import React, { useEffect, useRef } from 'react';

/**
 * Custom Telegram Login Button Component
 *
 * This component loads the Telegram Login Widget script and creates a button
 * that integrates with Telegram's OAuth. It avoids React version conflicts
 * by directly using Telegram's official widget script.
 *
 * @param {Object} props
 * @param {string} props.botName - Your Telegram bot username (without @)
 * @param {function} props.dataOnauth - Callback function when user authenticates
 * @param {string} props.buttonSize - Button size: 'large', 'medium', or 'small' (default: 'large')
 * @param {number} props.cornerRadius - Border radius in pixels (default: 12)
 * @param {boolean} props.requestAccess - Request write access (default: true)
 * @param {string} props.usePic - Show user picture: true/false (default: false)
 * @param {string} props.lang - Language code (default: 'en')
 */
export default function TelegramLoginButton({
  botName,
  dataOnauth,
  buttonSize = 'large',
  cornerRadius = 12,
  requestAccess = true,
  usePic = false,
  lang = 'en'
}) {
  const containerRef = useRef(null);
  const callbackName = useRef(`telegramCallback_${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    // SSR safety check
    if (typeof window === 'undefined' || !botName) return;

    // Create global callback function
    window[callbackName.current] = (user) => {
      if (dataOnauth) {
        dataOnauth(user);
      }
    };

    // Check if script already loaded
    const existingScript = document.getElementById('telegram-login-script');

    const loadWidget = () => {
      if (!containerRef.current) return;

      // Clear container
      containerRef.current.innerHTML = '';

      // Create script element
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.setAttribute('data-telegram-login', botName);
      script.setAttribute('data-size', buttonSize);
      script.setAttribute('data-radius', cornerRadius.toString());
      script.setAttribute('data-onauth', `${callbackName.current}(user)`);
      script.setAttribute('data-request-access', requestAccess ? 'write' : '');
      script.setAttribute('data-userpic', usePic.toString());
      script.setAttribute('data-lang', lang);
      script.async = true;

      containerRef.current.appendChild(script);
    };

    if (existingScript) {
      // Script already loaded, just render widget
      loadWidget();
    } else {
      // Load script for first time
      loadWidget();
    }

    // Cleanup
    return () => {
      if (window[callbackName.current]) {
        delete window[callbackName.current];
      }
    };
  }, [botName, dataOnauth, buttonSize, cornerRadius, requestAccess, usePic, lang]);

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '40px'
      }}
    />
  );
}
