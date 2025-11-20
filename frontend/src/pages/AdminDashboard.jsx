import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [editingSubscription, setEditingSubscription] = useState(null);

  const adminToken = localStorage.getItem("admin_token");

  useEffect(() => {
    if (!adminToken) {
      navigate("/admin");
      return;
    }
    fetchData();
  }, [adminToken, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, settingsRes] = await Promise.all([
        fetch(`${API_URL}/admin/users`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        }),
        fetch(`${API_URL}/admin/settings`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        }),
      ]);

      if (!usersRes.ok || !settingsRes.ok) {
        if (usersRes.status === 403 || settingsRes.status === 403) {
          localStorage.removeItem("admin_token");
          navigate("/admin");
          return;
        }
        throw new Error("Failed to fetch data");
      }

      const usersData = await usersRes.json();
      const settingsData = await settingsRes.json();

      setUsers(usersData.users || []);
      setSettings(settingsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubscription = async (userId, tier, status) => {
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}/subscription`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tier, status }),
      });

      if (!res.ok) throw new Error("Failed to update subscription");

      setEditingSubscription(null);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      if (!res.ok) throw new Error("Failed to delete user");

      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    navigate("/admin");
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", fontFamily: "'Nunito', sans-serif" }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", fontFamily: "'Nunito', sans-serif" }}>
      {/* Header */}
      <div style={{
        background: "#6750A4",
        color: "white",
        padding: "16px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "700" }}>
          Meedi8 Admin Dashboard
        </h1>
        <button
          onClick={handleLogout}
          style={{
            background: "rgba(255,255,255,0.2)",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Logout
        </button>
      </div>

      <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
        {error && (
          <div style={{
            background: "#fee2e2",
            color: "#dc2626",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "16px",
          }}>
            {error}
          </div>
        )}

        {/* Stats Cards */}
        {settings && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}>
            <StatCard title="Total Users" value={settings.total_users} />
            <StatCard title="Active Subscriptions" value={settings.active_subscriptions} />
            <StatCard title="Total Rooms" value={settings.total_rooms} />
          </div>
        )}

        {/* API Configuration Status */}
        {settings && (
          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}>
            <h2 style={{ margin: "0 0 16px", fontSize: "18px", fontWeight: "700" }}>
              API Configuration
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
              <ConfigItem label="Stripe" configured={settings.stripe_webhook_configured} />
              <ConfigItem label="Anthropic" configured={settings.anthropic_key_configured} />
              <ConfigItem label="Gemini" configured={settings.gemini_key_configured} />
              <ConfigItem label="OpenAI" configured={settings.openai_key_configured} />
              <ConfigItem label="SendGrid" configured={settings.sendgrid_key_configured} />
              <ConfigItem label="AWS S3" configured={settings.aws_configured} />
              <ConfigItem label="Telegram" configured={settings.telegram_configured} />
            </div>
          </div>
        )}

        {/* Users Table */}
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "20px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}>
          <h2 style={{ margin: "0 0 16px", fontSize: "18px", fontWeight: "700" }}>
            Users ({users.length})
          </h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Tier</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Admin</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={tdStyle}>{user.id}</td>
                    <td style={tdStyle}>{user.email}</td>
                    <td style={tdStyle}>{user.name || "-"}</td>
                    <td style={tdStyle}>
                      {editingSubscription === user.id ? (
                        <select
                          defaultValue={user.subscription?.tier || "free"}
                          onChange={(e) => {
                            const status = user.subscription?.status || "trial";
                            handleUpdateSubscription(user.id, e.target.value, status);
                          }}
                          style={{ padding: "4px", borderRadius: "4px" }}
                        >
                          <option value="free">Free</option>
                          <option value="plus">Plus</option>
                          <option value="pro">Pro</option>
                        </select>
                      ) : (
                        <span style={{
                          padding: "2px 8px",
                          borderRadius: "4px",
                          background: user.subscription?.tier === "pro" ? "#dcfce7" :
                                     user.subscription?.tier === "plus" ? "#dbeafe" : "#f3f4f6",
                          color: user.subscription?.tier === "pro" ? "#166534" :
                                 user.subscription?.tier === "plus" ? "#1e40af" : "#6b7280",
                          fontSize: "12px",
                          fontWeight: "600",
                        }}>
                          {user.subscription?.tier?.toUpperCase() || "FREE"}
                        </span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      {editingSubscription === user.id ? (
                        <select
                          defaultValue={user.subscription?.status || "trial"}
                          onChange={(e) => {
                            const tier = user.subscription?.tier || "free";
                            handleUpdateSubscription(user.id, tier, e.target.value);
                          }}
                          style={{ padding: "4px", borderRadius: "4px" }}
                        >
                          <option value="trial">Trial</option>
                          <option value="active">Active</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="past_due">Past Due</option>
                        </select>
                      ) : (
                        <span style={{ fontSize: "12px", color: "#6b7280" }}>
                          {user.subscription?.status || "trial"}
                        </span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      {user.is_admin ? "Yes" : "No"}
                    </td>
                    <td style={tdStyle}>
                      {editingSubscription === user.id ? (
                        <button
                          onClick={() => setEditingSubscription(null)}
                          style={actionBtnStyle}
                        >
                          Done
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingSubscription(user.id)}
                            style={actionBtnStyle}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            style={{ ...actionBtnStyle, color: "#dc2626" }}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div style={{
      background: "white",
      borderRadius: "12px",
      padding: "20px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    }}>
      <div style={{ fontSize: "14px", color: "#6b7280", marginBottom: "4px" }}>{title}</div>
      <div style={{ fontSize: "28px", fontWeight: "700", color: "#1a1a1a" }}>{value}</div>
    </div>
  );
}

function ConfigItem({ label, configured }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <span style={{
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        background: configured ? "#22c55e" : "#ef4444",
      }} />
      <span style={{ fontSize: "14px", color: "#374151" }}>{label}</span>
    </div>
  );
}

const thStyle = {
  textAlign: "left",
  padding: "12px 8px",
  fontWeight: "600",
  color: "#374151",
};

const tdStyle = {
  padding: "12px 8px",
  color: "#1a1a1a",
};

const actionBtnStyle = {
  background: "none",
  border: "none",
  color: "#6750A4",
  cursor: "pointer",
  padding: "4px 8px",
  fontSize: "13px",
  fontWeight: "600",
};
