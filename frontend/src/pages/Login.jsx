import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";
import WaveDecoration from "../components/WaveDecoration";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      // Successful login - navigate to rooms
      navigate('/rooms');
    } catch (e) {
      setError(e.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: '#EAF7F0',
      padding: '16px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <WaveDecoration />

      <Logo style={{ marginBottom: '24px' }} />

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '32px',
          maxWidth: '520px',
          padding: '0 16px',
        }}>
          <h1 style={{
            fontSize: 'clamp(32px, 8vw, 48px)',
            color: '#7DD3C0',
            fontWeight: '400',
            lineHeight: '1.2',
            margin: 0,
          }}>
            Mediation<br />
            made calm,<br />
            clear, and fair.
          </h1>
        </div>

        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          width: '100%',
          maxWidth: '520px',
          alignItems: 'center',
        }}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="input-field"
            style={{
              backgroundColor: 'white',
              border: 'none',
              borderRadius: '16px',
              padding: '14px 20px',
              fontSize: '16px',
              width: '100%',
            }}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className="input-field"
            style={{
              backgroundColor: 'white',
              border: 'none',
              borderRadius: '16px',
              padding: '14px 20px',
              fontSize: '16px',
              width: '100%',
            }}
          />

          <div style={{ textAlign: 'right', width: '100%' }}>
            <button
              type="button"
              onClick={() => alert('Password reset not yet implemented')}
              style={{
                background: 'none',
                border: 'none',
                color: '#9CA3AF',
                fontSize: '14px',
                cursor: 'pointer',
                padding: '4px 0',
              }}
            >
              Forgot Password?
            </button>
          </div>

          {error && (
            <div style={{
              backgroundColor: '#FEE2E2',
              color: '#DC2626',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              width: '100%',
              textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              backgroundColor: '#7DD3C0',
              color: 'white',
              border: 'none',
              borderRadius: '16px',
              padding: 'clamp(14px, 3vw, 16px) 32px',
              fontSize: 'clamp(18px, 4vw, 20px)',
              fontWeight: '400',
              cursor: loading ? 'not-allowed' : 'pointer',
              width: '100%',
              marginTop: '8px',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div style={{
          marginTop: '32px',
          textAlign: 'center',
        }}>
          <div style={{
            backgroundColor: '#7C6CB6',
            color: 'white',
            padding: '16px 32px',
            borderRadius: '16px',
            display: 'inline-block',
            position: 'relative',
          }}>
            <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '4px' }}>
              New here?
            </div>
            <button
              onClick={() => navigate('/signup')}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '14px',
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: 0,
              }}
            >
              Create an account
            </button>
          </div>
        </div>
      </div>

      {/* Character illustration placeholder - hidden on mobile */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '150px',
        height: '150px',
        opacity: 0.3,
        pointerEvents: 'none',
        display: window.innerWidth < 768 ? 'none' : 'block',
      }}>
        {/* Placeholder for character illustration */}
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="30" r="15" fill="#C8B6FF" />
          <rect x="35" y="45" width="30" height="40" rx="5" fill="#7DD3C0" />
          <rect x="20" y="55" width="15" height="30" rx="3" fill="#FFB366" />
          <rect x="65" y="55" width="15" height="30" rx="3" fill="#FFB366" />
        </svg>
      </div>
    </div>
  );
}
