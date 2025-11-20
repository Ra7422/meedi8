import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api/client";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await apiRequest("/admin/login", "POST", {
        email,
        password,
      });

      if (response.access_token) {
        localStorage.setItem("admin_token", response.access_token);
        navigate("/admin/dashboard");
      }
    } catch (err) {
      setError(err.message || "Invalid credentials or not an admin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f5f5f5",
      fontFamily: "'Nunito', sans-serif",
    }}>
      <div style={{
        background: "white",
        padding: "40px",
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
        width: "100%",
        maxWidth: "400px",
      }}>
        <h1 style={{
          fontSize: "28px",
          fontWeight: "700",
          marginBottom: "8px",
          color: "#1a1a1a",
        }}>
          Admin Login
        </h1>
        <p style={{
          color: "#6b7280",
          marginBottom: "24px",
        }}>
          Sign in to access the admin dashboard
        </p>

        {error && (
          <div style={{
            background: "#fee2e2",
            color: "#dc2626",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "16px",
            fontSize: "14px",
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{
              display: "block",
              marginBottom: "6px",
              fontWeight: "600",
              fontSize: "14px",
              color: "#374151",
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{
              display: "block",
              marginBottom: "6px",
              fontWeight: "600",
              fontSize: "14px",
              color: "#374151",
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              background: "#6750A4",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p style={{
          marginTop: "24px",
          textAlign: "center",
          fontSize: "14px",
          color: "#6b7280",
        }}>
          <a href="/" style={{ color: "#6750A4", textDecoration: "none" }}>
            Back to Home
          </a>
        </p>
      </div>
    </div>
  );
}
