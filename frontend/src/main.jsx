import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/global.css'
import { GoogleOAuthProvider } from '@react-oauth/google'

// Google Client ID - Replace with your actual Google Client ID from Google Cloud Console
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

// Only wrap with GoogleOAuthProvider if we have a valid client ID (not a placeholder)
const hasValidGoogleOAuth = GOOGLE_CLIENT_ID &&
                             GOOGLE_CLIENT_ID.length > 20 &&
                             !GOOGLE_CLIENT_ID.includes('YOUR_') &&
                             !GOOGLE_CLIENT_ID.includes('undefined')

const AppWrapper = hasValidGoogleOAuth ? (
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <App />
  </GoogleOAuthProvider>
) : (
  <App />
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {AppWrapper}
  </React.StrictMode>
)
