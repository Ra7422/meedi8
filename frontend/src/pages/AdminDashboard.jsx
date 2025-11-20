import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingSubscription, setEditingSubscription] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", password: "", name: "", isAdmin: false });
  const [createUserError, setCreateUserError] = useState("");

  // Search and filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTier, setFilterTier] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Bulk selection
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Password reset modal
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [tempPassword, setTempPassword] = useState("");

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
      const [usersRes, settingsRes, roomsRes, analyticsRes] = await Promise.all([
        fetch(`${API_URL}/admin/users`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        }),
        fetch(`${API_URL}/admin/settings`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        }),
        fetch(`${API_URL}/admin/rooms`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        }),
        fetch(`${API_URL}/admin/analytics`, {
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
      const roomsData = roomsRes.ok ? await roomsRes.json() : { rooms: [] };
      const analyticsData = analyticsRes.ok ? await analyticsRes.json() : null;

      setUsers(usersData.users || []);
      setSettings(settingsData);
      setRooms(roomsData.rooms || []);
      setAnalytics(analyticsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("q", searchQuery);
      if (filterTier) params.append("tier", filterTier);
      if (filterStatus) params.append("status", filterStatus);

      const res = await fetch(`${API_URL}/admin/users/search?${params}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleExportCSV = () => {
    window.open(`${API_URL}/admin/users/export?token=${adminToken}`, "_blank");
  };

  const handleGeneratePassword = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}/generate-password`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      if (res.ok) {
        const data = await res.json();
        setTempPassword(data.temp_password);
        setResetPasswordUser(users.find((u) => u.id === userId));
      } else {
        throw new Error("Failed to generate password");
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!confirm("Are you sure you want to delete this room? This cannot be undone.")) return;

    try {
      const res = await fetch(`${API_URL}/admin/rooms/${roomId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      if (!res.ok) throw new Error("Failed to delete room");
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleBulkUpdateSubscriptions = async (tier, status) => {
    if (selectedUsers.length === 0) {
      alert("Select at least one user");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/admin/users/bulk/subscription?tier=${tier}&status=${status}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(selectedUsers),
      });

      if (!res.ok) throw new Error("Failed to update subscriptions");

      setSelectedUsers([]);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) {
      alert("Select at least one user");
      return;
    }
    if (!confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) return;

    try {
      const res = await fetch(`${API_URL}/admin/users/bulk/delete`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(selectedUsers),
      });

      if (!res.ok) throw new Error("Failed to delete users");

      setSelectedUsers([]);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((u) => u.id));
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
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

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

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateUserError("");

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newUser.email,
          password: newUser.password,
          name: newUser.name || newUser.email.split("@")[0],
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to create user");
      }

      // If user should be admin, update their admin status
      if (newUser.isAdmin) {
        const userData = await res.json();
        // We need to update admin status via admin endpoint
        await fetch(`${API_URL}/admin/users/${userData.user_id || userData.id}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ is_admin: true }),
        });
      }

      setShowCreateUser(false);
      setNewUser({ email: "", password: "", name: "", isAdmin: false });
      fetchData();
    } catch (err) {
      setCreateUserError(err.message);
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
    <div style={{ minHeight: "100vh", background: "#f5f5f5", fontFamily: "'Nunito', sans-serif", display: "flex" }}>
      {/* Sidebar */}
      <div style={{
        width: "240px",
        background: "#1a1a1a",
        color: "white",
        padding: "20px 0",
        flexShrink: 0,
      }}>
        <div style={{ padding: "0 20px 20px", borderBottom: "1px solid #333" }}>
          <h1 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#7DD3C0" }}>
            Meedi8 Admin
          </h1>
        </div>

        <nav style={{ marginTop: "20px" }}>
          <SidebarItem
            icon="📊"
            label="Dashboard"
            active={activeTab === "dashboard"}
            onClick={() => setActiveTab("dashboard")}
          />
          <SidebarItem
            icon="📈"
            label="Analytics"
            active={activeTab === "analytics"}
            onClick={() => setActiveTab("analytics")}
          />
          <SidebarItem
            icon="👥"
            label="Users"
            active={activeTab === "users"}
            onClick={() => setActiveTab("users")}
          />
          <SidebarItem
            icon="💬"
            label="Rooms"
            active={activeTab === "rooms"}
            onClick={() => setActiveTab("rooms")}
          />
          <SidebarItem
            icon="💳"
            label="Subscriptions"
            active={activeTab === "subscriptions"}
            onClick={() => setActiveTab("subscriptions")}
          />
          <SidebarItem
            icon="🔧"
            label="Settings"
            active={activeTab === "settings"}
            onClick={() => setActiveTab("settings")}
          />
        </nav>

        <div style={{ position: "absolute", bottom: "20px", left: "20px", right: "20px" }}>
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              background: "#333",
              color: "white",
              border: "none",
              padding: "10px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {/* Header */}
        <div style={{
          background: "white",
          padding: "16px 24px",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700", color: "#1a1a1a" }}>
            {activeTab === "dashboard" && "Dashboard Overview"}
            {activeTab === "analytics" && "Analytics"}
            {activeTab === "users" && "User Management"}
            {activeTab === "rooms" && "Room Management"}
            {activeTab === "subscriptions" && "Subscription Management"}
            {activeTab === "settings" && "Platform Settings"}
          </h2>
          <div style={{ display: "flex", gap: "8px" }}>
            {activeTab === "users" && (
              <>
                <button
                  onClick={handleExportCSV}
                  style={{
                    background: "#f3f4f6",
                    color: "#374151",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  Export CSV
                </button>
                <button
                  onClick={() => setShowCreateUser(true)}
                  style={{
                    background: "#6750A4",
                    color: "white",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  + Create User
                </button>
              </>
            )}
          </div>
        </div>

        <div style={{ padding: "24px" }}>
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

          {/* Dashboard Tab */}
          {activeTab === "dashboard" && settings && (
            <>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "20px",
                marginBottom: "24px",
              }}>
                <StatCard title="Total Users" value={settings.total_users} color="#6750A4" icon="👥" />
                <StatCard title="Active Subscriptions" value={settings.active_subscriptions} color="#22c55e" icon="💳" />
                <StatCard title="Total Rooms" value={settings.total_rooms} color="#3b82f6" icon="💬" />
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
                marginBottom: "24px",
              }}>
                {/* Pie Chart Card */}
                {analytics && analytics.tier_breakdown && analytics.tier_breakdown.length > 0 && (
                  <div style={{
                    background: "white",
                    borderRadius: "24px",
                    padding: "24px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  }}>
                    <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: "700" }}>
                      Subscription Tiers
                    </h3>
                    <PieChart data={analytics.tier_breakdown} size={140} />
                  </div>
                )}

                {/* Circular Progress Cards */}
                <div style={{
                  background: "white",
                  borderRadius: "24px",
                  padding: "24px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                }}>
                  <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: "700" }}>
                    Quick Stats
                  </h3>
                  <div style={{ display: "flex", justifyContent: "space-around" }}>
                    <CircularProgress
                      value={analytics?.active_users_7d || 0}
                      max={settings.total_users || 1}
                      color="#6750A4"
                      label="Active (7d)"
                    />
                    <CircularProgress
                      value={settings.active_subscriptions}
                      max={settings.total_users || 1}
                      color="#22c55e"
                      label="Paid Users"
                    />
                    <CircularProgress
                      value={analytics?.avg_turns_per_room || 0}
                      max={50}
                      color="#3b82f6"
                      label="Avg Turns"
                    />
                  </div>
                </div>
              </div>

              <div style={{
                background: "white",
                borderRadius: "24px",
                padding: "24px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              }}>
                <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: "700" }}>
                  API Configuration Status
                </h3>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "16px"
                }}>
                  <ConfigItemCircle label="Stripe" configured={settings.stripe_webhook_configured} />
                  <ConfigItemCircle label="Claude AI" configured={settings.anthropic_key_configured} />
                  <ConfigItemCircle label="Gemini" configured={settings.gemini_key_configured} />
                  <ConfigItemCircle label="OpenAI" configured={settings.openai_key_configured} />
                  <ConfigItemCircle label="SendGrid" configured={settings.sendgrid_key_configured} />
                  <ConfigItemCircle label="AWS S3" configured={settings.aws_configured} />
                  <ConfigItemCircle label="Telegram" configured={settings.telegram_configured} />
                </div>
              </div>
            </>
          )}

          {/* Analytics Tab */}
          {activeTab === "analytics" && analytics && (
            <>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "20px",
                marginBottom: "24px",
              }}>
                <StatCard title="Active Users (7d)" value={analytics.active_users_7d || 0} color="#6750A4" icon="🔥" />
                <StatCard title="Avg Turns/Room" value={analytics.avg_turns_per_room || 0} color="#22c55e" icon="💭" />
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
                marginBottom: "24px",
              }}>
                {/* Tier Breakdown Pie Chart */}
                {analytics.tier_breakdown && analytics.tier_breakdown.length > 0 && (
                  <div style={{
                    background: "white",
                    borderRadius: "24px",
                    padding: "24px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  }}>
                    <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: "700" }}>
                      Tier Breakdown
                    </h3>
                    <PieChart
                      data={analytics.tier_breakdown}
                      size={140}
                      colors={["#6750A4", "#22c55e", "#3b82f6"]}
                    />
                  </div>
                )}

                {/* Rooms by Phase Pie Chart */}
                {analytics.rooms_by_phase && analytics.rooms_by_phase.length > 0 && (
                  <div style={{
                    background: "white",
                    borderRadius: "24px",
                    padding: "24px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  }}>
                    <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: "700" }}>
                      Rooms by Phase
                    </h3>
                    <PieChart
                      data={analytics.rooms_by_phase}
                      size={140}
                      colors={["#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#22c55e", "#6750A4"]}
                    />
                  </div>
                )}
              </div>

              <div style={{
                background: "white",
                borderRadius: "24px",
                padding: "24px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              }}>
                <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: "700" }}>
                  Recent Signups
                </h3>
                <div style={{ maxHeight: "250px", overflowY: "auto" }}>
                  {analytics.signups_over_time?.map((item) => (
                    <div key={item.date} style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 16px",
                      marginBottom: "8px",
                      background: "#f9fafb",
                      borderRadius: "24px",
                    }}>
                      <span style={{ color: "#6b7280", fontSize: "14px" }}>{item.date}</span>
                      <span style={{
                        fontWeight: "600",
                        background: "#6750A420",
                        color: "#6750A4",
                        padding: "4px 12px",
                        borderRadius: "20px",
                        fontSize: "13px",
                      }}>
                        {item.count} signups
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Rooms Tab */}
          {activeTab === "rooms" && (
            <div style={{
              background: "white",
              borderRadius: "24px",
              padding: "24px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                      <th style={thStyle}>ID</th>
                      <th style={thStyle}>Title</th>
                      <th style={thStyle}>Type</th>
                      <th style={thStyle}>Phase</th>
                      <th style={thStyle}>Participants</th>
                      <th style={thStyle}>Turns</th>
                      <th style={thStyle}>Created</th>
                      <th style={thStyle}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.map((room) => (
                      <tr key={room.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <td style={tdStyle}>{room.id}</td>
                        <td style={tdStyle}>{room.title?.substring(0, 30) || "-"}</td>
                        <td style={tdStyle}>
                          <span style={{
                            padding: "2px 8px",
                            borderRadius: "4px",
                            background: room.room_type === "solo" ? "#e0e7ff" : "#dcfce7",
                            color: room.room_type === "solo" ? "#3730a3" : "#166534",
                            fontSize: "12px",
                          }}>
                            {room.room_type}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            padding: "2px 8px",
                            borderRadius: "4px",
                            background: room.phase === "resolved" ? "#dcfce7" : "#fef3c7",
                            color: room.phase === "resolved" ? "#166534" : "#92400e",
                            fontSize: "12px",
                          }}>
                            {room.phase}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          {room.participants?.map((p) => p.email?.split("@")[0]).join(", ") || "-"}
                        </td>
                        <td style={tdStyle}>{room.turn_count}</td>
                        <td style={tdStyle}>
                          {room.created_at ? new Date(room.created_at).toLocaleDateString() : "-"}
                        </td>
                        <td style={tdStyle}>
                          <button
                            onClick={() => handleDeleteRoom(room.id)}
                            style={{ ...actionBtnStyle, color: "#dc2626" }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <>
              {/* Search and Filter Bar */}
              <div style={{
                background: "white",
                borderRadius: "24px",
                padding: "16px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                marginBottom: "16px",
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
                alignItems: "center",
              }}>
                <input
                  type="text"
                  placeholder="Search email or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    flex: 1,
                    minWidth: "200px",
                  }}
                />
                <select
                  value={filterTier}
                  onChange={(e) => setFilterTier(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                >
                  <option value="">All Tiers</option>
                  <option value="free">Free</option>
                  <option value="plus">Plus</option>
                  <option value="pro">Pro</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                >
                  <option value="">All Status</option>
                  <option value="trial">Trial</option>
                  <option value="active">Active</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button
                  onClick={handleSearch}
                  style={{
                    background: "#6750A4",
                    color: "white",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  Search
                </button>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setFilterTier("");
                    setFilterStatus("");
                    fetchData();
                  }}
                  style={{
                    background: "#f3f4f6",
                    color: "#374151",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  Clear
                </button>
              </div>

              {/* Bulk Actions Bar */}
              {selectedUsers.length > 0 && (
                <div style={{
                  background: "#e0e7ff",
                  borderRadius: "24px",
                  padding: "12px 16px",
                  marginBottom: "16px",
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                }}>
                  <span style={{ fontSize: "14px", fontWeight: "600" }}>
                    {selectedUsers.length} selected
                  </span>
                  <button
                    onClick={() => handleBulkUpdateSubscriptions("pro", "active")}
                    style={{
                      background: "#22c55e",
                      color: "white",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "13px",
                    }}
                  >
                    Upgrade to Pro
                  </button>
                  <button
                    onClick={() => handleBulkUpdateSubscriptions("free", "trial")}
                    style={{
                      background: "#f59e0b",
                      color: "white",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "13px",
                    }}
                  >
                    Downgrade to Free
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    style={{
                      background: "#dc2626",
                      color: "white",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "13px",
                    }}
                  >
                    Delete Selected
                  </button>
                </div>
              )}

              <div style={{
                background: "white",
                borderRadius: "24px",
                padding: "24px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                        <th style={{ ...thStyle, width: "40px" }}>
                          <input
                            type="checkbox"
                            checked={selectedUsers.length === users.length && users.length > 0}
                            onChange={selectAllUsers}
                          />
                        </th>
                        <th style={thStyle}>ID</th>
                        <th style={thStyle}>Email</th>
                        <th style={thStyle}>Name</th>
                        <th style={thStyle}>Type</th>
                        <th style={thStyle}>Created</th>
                        <th style={thStyle}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                          <td style={tdStyle}>
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              onChange={() => toggleUserSelection(user.id)}
                            />
                          </td>
                          <td style={tdStyle}>{user.id}</td>
                          <td style={tdStyle}>{user.email}</td>
                          <td style={tdStyle}>{user.name || "-"}</td>
                          <td style={tdStyle}>
                            <span style={{
                              padding: "2px 8px",
                              borderRadius: "4px",
                              background: user.is_admin ? "#fef3c7" : user.is_guest ? "#e0e7ff" : "#f3f4f6",
                              color: user.is_admin ? "#92400e" : user.is_guest ? "#3730a3" : "#6b7280",
                              fontSize: "12px",
                              fontWeight: "600",
                            }}>
                              {user.is_admin ? "Admin" : user.is_guest ? "Guest" : "User"}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}
                          </td>
                          <td style={tdStyle}>
                            <button
                              onClick={() => handleGeneratePassword(user.id)}
                              style={actionBtnStyle}
                            >
                              Reset PW
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              style={{ ...actionBtnStyle, color: "#dc2626" }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Subscriptions Tab */}
          {activeTab === "subscriptions" && (
            <div style={{
              background: "white",
              borderRadius: "24px",
              padding: "24px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                      <th style={thStyle}>User</th>
                      <th style={thStyle}>Email</th>
                      <th style={thStyle}>Tier</th>
                      <th style={thStyle}>Status</th>
                      <th style={thStyle}>Stripe ID</th>
                      <th style={thStyle}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.filter(u => u.subscription).map((user) => (
                      <tr key={user.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <td style={tdStyle}>{user.name || user.id}</td>
                        <td style={tdStyle}>{user.email}</td>
                        <td style={tdStyle}>
                          {editingSubscription === user.id ? (
                            <select
                              defaultValue={user.subscription?.tier || "free"}
                              onChange={(e) => {
                                const status = user.subscription?.status || "trial";
                                handleUpdateSubscription(user.id, e.target.value, status);
                              }}
                              style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #d1d5db" }}
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
                              style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #d1d5db" }}
                            >
                              <option value="trial">Trial</option>
                              <option value="active">Active</option>
                              <option value="cancelled">Cancelled</option>
                              <option value="past_due">Past Due</option>
                            </select>
                          ) : (
                            <span style={{
                              padding: "2px 8px",
                              borderRadius: "4px",
                              background: user.subscription?.status === "active" ? "#dcfce7" :
                                         user.subscription?.status === "trial" ? "#fef3c7" :
                                         user.subscription?.status === "cancelled" ? "#fee2e2" : "#f3f4f6",
                              color: user.subscription?.status === "active" ? "#166534" :
                                     user.subscription?.status === "trial" ? "#92400e" :
                                     user.subscription?.status === "cancelled" ? "#dc2626" : "#6b7280",
                              fontSize: "12px",
                            }}>
                              {user.subscription?.status || "trial"}
                            </span>
                          )}
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: "11px", color: "#6b7280" }}>
                            {user.subscription?.stripe_subscription_id
                              ? user.subscription.stripe_subscription_id.slice(0, 15) + "..."
                              : "-"}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          {editingSubscription === user.id ? (
                            <button
                              onClick={() => setEditingSubscription(null)}
                              style={{ ...actionBtnStyle, color: "#22c55e" }}
                            >
                              Save
                            </button>
                          ) : (
                            <button
                              onClick={() => setEditingSubscription(user.id)}
                              style={actionBtnStyle}
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && settings && (
            <div style={{
              background: "white",
              borderRadius: "24px",
              padding: "24px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            }}>
              <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "700" }}>
                Platform Configuration
              </h3>
              <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "20px" }}>
                API keys and configuration are managed via Railway environment variables.
              </p>

              <div style={{ display: "grid", gap: "16px" }}>
                <SettingsRow label="Stripe Publishable Key" value={settings.stripe_publishable_key || "Not configured"} />
                <SettingsRow label="Stripe Webhook" value={settings.stripe_webhook_configured ? "Configured" : "Not configured"} status={settings.stripe_webhook_configured} />
                <SettingsRow label="Anthropic API" value={settings.anthropic_key_configured ? "Configured" : "Not configured"} status={settings.anthropic_key_configured} />
                <SettingsRow label="Gemini API" value={settings.gemini_key_configured ? "Configured" : "Not configured"} status={settings.gemini_key_configured} />
                <SettingsRow label="OpenAI API" value={settings.openai_key_configured ? "Configured" : "Not configured"} status={settings.openai_key_configured} />
                <SettingsRow label="SendGrid" value={settings.sendgrid_key_configured ? "Configured" : "Not configured"} status={settings.sendgrid_key_configured} />
                <SettingsRow label="AWS S3" value={settings.aws_configured ? "Configured" : "Not configured"} status={settings.aws_configured} />
                <SettingsRow label="Telegram Bot" value={settings.telegram_configured ? "Configured" : "Not configured"} status={settings.telegram_configured} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateUser && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            background: "white",
            borderRadius: "24px",
            padding: "24px",
            width: "100%",
            maxWidth: "400px",
          }}>
            <h3 style={{ margin: "0 0 20px", fontSize: "18px", fontWeight: "700" }}>
              Create New User
            </h3>

            {createUserError && (
              <div style={{
                background: "#fee2e2",
                color: "#dc2626",
                padding: "8px 12px",
                borderRadius: "6px",
                marginBottom: "16px",
                fontSize: "14px",
              }}>
                {createUserError}
              </div>
            )}

            <form onSubmit={handleCreateUser}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px" }}>
                  Email
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px" }}>
                  Name (optional)
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px" }}>
                  Password
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                  minLength={6}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={newUser.isAdmin}
                    onChange={(e) => setNewUser({ ...newUser, isAdmin: e.target.checked })}
                  />
                  <span style={{ fontSize: "14px" }}>Make this user an admin</span>
                </label>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateUser(false);
                    setCreateUserError("");
                  }}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "#f3f4f6",
                    color: "#374151",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "#6750A4",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {resetPasswordUser && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            background: "white",
            borderRadius: "24px",
            padding: "24px",
            width: "100%",
            maxWidth: "400px",
          }}>
            <h3 style={{ margin: "0 0 20px", fontSize: "18px", fontWeight: "700" }}>
              Password Reset
            </h3>

            <p style={{ marginBottom: "16px", color: "#6b7280", fontSize: "14px" }}>
              Temporary password generated for <strong>{resetPasswordUser.email}</strong>
            </p>

            <div style={{
              background: "#f3f4f6",
              padding: "16px",
              borderRadius: "8px",
              marginBottom: "20px",
              fontFamily: "monospace",
              fontSize: "16px",
              textAlign: "center",
              userSelect: "all",
            }}>
              {tempPassword}
            </div>

            <p style={{ marginBottom: "16px", color: "#dc2626", fontSize: "12px" }}>
              Please copy this password now. It will not be shown again.
            </p>

            <button
              onClick={() => {
                setResetPasswordUser(null);
                setTempPassword("");
              }}
              style={{
                width: "100%",
                padding: "10px",
                background: "#6750A4",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px 20px",
        background: active ? "#333" : "transparent",
        color: active ? "white" : "#9ca3af",
        border: "none",
        cursor: "pointer",
        fontSize: "14px",
        textAlign: "left",
        borderLeft: active ? "3px solid #7DD3C0" : "3px solid transparent",
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function StatCard({ title, value, color, icon }) {
  return (
    <div style={{
      background: "white",
      borderRadius: "24px",
      padding: "24px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
      display: "flex",
      alignItems: "center",
      gap: "16px",
    }}>
      <div style={{
        width: "56px",
        height: "56px",
        borderRadius: "50%",
        background: `${color}20`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "24px",
      }}>
        {icon || "📊"}
      </div>
      <div>
        <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{title}</div>
        <div style={{ fontSize: "32px", fontWeight: "700", color: "#1a1a1a" }}>{value}</div>
      </div>
    </div>
  );
}

function PieChart({ data, size = 160, colors }) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  let cumulativePercent = 0;

  const getCoordinates = (percent) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  const defaultColors = ["#6750A4", "#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];
  const chartColors = colors || defaultColors;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
      <svg width={size} height={size} viewBox="-1 -1 2 2" style={{ transform: "rotate(-90deg)" }}>
        {data.map((item, i) => {
          const percent = item.count / total;
          const [startX, startY] = getCoordinates(cumulativePercent);
          cumulativePercent += percent;
          const [endX, endY] = getCoordinates(cumulativePercent);
          const largeArcFlag = percent > 0.5 ? 1 : 0;

          const pathData = [
            `M ${startX} ${startY}`,
            `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            `L 0 0`,
          ].join(" ");

          return (
            <path
              key={item.tier || item.phase || i}
              d={pathData}
              fill={chartColors[i % chartColors.length]}
            />
          );
        })}
        <circle cx="0" cy="0" r="0.6" fill="white" />
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {data.map((item, i) => (
          <div key={item.tier || item.phase || i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: chartColors[i % chartColors.length],
            }} />
            <span style={{ fontSize: "13px", color: "#374151" }}>
              {item.tier || item.phase}: <strong>{item.count}</strong>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CircularProgress({ value, max, size = 80, color = "#6750A4", label }) {
  const percentage = (value / max) * 100;
  const circumference = 2 * Math.PI * 35;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{ textAlign: "center" }}>
      <svg width={size} height={size} viewBox="0 0 80 80">
        <circle
          cx="40"
          cy="40"
          r="35"
          fill="none"
          stroke="#f3f4f6"
          strokeWidth="8"
        />
        <circle
          cx="40"
          cy="40"
          r="35"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 40 40)"
        />
        <text x="40" y="45" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1a1a1a">
          {value}
        </text>
      </svg>
      {label && <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>{label}</div>}
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

function ConfigItemCircle({ label, configured }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "8px",
      padding: "16px",
      background: configured ? "#dcfce720" : "#fee2e220",
      borderRadius: "16px",
    }}>
      <div style={{
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        background: configured ? "#22c55e" : "#ef4444",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontSize: "18px",
      }}>
        {configured ? "✓" : "×"}
      </div>
      <span style={{ fontSize: "13px", color: "#374151", fontWeight: "500" }}>{label}</span>
    </div>
  );
}

function SettingsRow({ label, value, status }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "12px 0",
      borderBottom: "1px solid #f3f4f6",
    }}>
      <span style={{ fontSize: "14px", fontWeight: "500", color: "#374151" }}>{label}</span>
      <span style={{
        fontSize: "13px",
        color: status === undefined ? "#6b7280" : status ? "#22c55e" : "#ef4444",
      }}>
        {value}
      </span>
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
