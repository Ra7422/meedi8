import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import meedi8Logo from '../assets/logo/meedi8_logo.png';

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

  // New feature data
  const [activityLogs, setActivityLogs] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [featureFlags, setFeatureFlags] = useState({});
  const [webhookLogs, setWebhookLogs] = useState([]);
  const [impersonateToken, setImpersonateToken] = useState(null);
  const [emailTemplates, setEmailTemplates] = useState({});
  const [systemHealth, setSystemHealth] = useState(null);
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [aiCosts, setAiCosts] = useState(null);
  const [aiCostDetails, setAiCostDetails] = useState([]);

  // Error logs
  const [errorLogs, setErrorLogs] = useState([]);
  const [errorLogsUnresolved, setErrorLogsUnresolved] = useState(0);
  const [errorLogsFilter, setErrorLogsFilter] = useState("all"); // all, unresolved, resolved
  const [expandedErrorId, setExpandedErrorId] = useState(null);

  // Audit logs
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditActionTypes, setAuditActionTypes] = useState([]);
  const [auditFilterAction, setAuditFilterAction] = useState("");
  const [auditFilterStartDate, setAuditFilterStartDate] = useState("");
  const [auditFilterEndDate, setAuditFilterEndDate] = useState("");
  const [expandedAuditId, setExpandedAuditId] = useState(null);

  // Date range for analytics
  const [dateRangePreset, setDateRangePreset] = useState("30d");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const adminToken = localStorage.getItem("admin_token");

  // Calculate date range based on preset
  const getDateRangeParams = () => {
    const today = new Date();
    let startDate, endDate;

    switch (dateRangePreset) {
      case "7d":
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        endDate = today;
        break;
      case "30d":
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);
        endDate = today;
        break;
      case "90d":
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 90);
        endDate = today;
        break;
      case "this_month":
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = today;
        break;
      case "last_month":
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case "custom":
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate);
        } else {
          // Default to last 30 days if custom dates not set
          startDate = new Date(today);
          startDate.setDate(today.getDate() - 30);
          endDate = today;
        }
        break;
      default:
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);
        endDate = today;
    }

    return {
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0]
    };
  };

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
      const dateParams = getDateRangeParams();
      const analyticsUrl = `${API_URL}/admin/analytics?start_date=${dateParams.start_date}&end_date=${dateParams.end_date}`;

      const [usersRes, settingsRes, roomsRes, analyticsRes, activityRes, revenueRes, flagsRes, webhooksRes] = await Promise.all([
        fetch(`${API_URL}/admin/users`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        }),
        fetch(`${API_URL}/admin/settings`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        }),
        fetch(`${API_URL}/admin/rooms`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        }),
        fetch(analyticsUrl, {
          headers: { Authorization: `Bearer ${adminToken}` },
        }),
        fetch(`${API_URL}/admin/activity-logs`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        }),
        fetch(`${API_URL}/admin/revenue`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        }),
        fetch(`${API_URL}/admin/feature-flags`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        }),
        fetch(`${API_URL}/admin/webhook-logs`, {
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
      const activityData = activityRes.ok ? await activityRes.json() : { logs: [] };
      const revenueData = revenueRes.ok ? await revenueRes.json() : null;
      const flagsData = flagsRes.ok ? await flagsRes.json() : { flags: {} };
      const webhooksData = webhooksRes.ok ? await webhooksRes.json() : { events: [] };

      // Fetch email templates, system health, AI costs, error logs, and audit logs
      const [templatesRes, healthRes, aiCostsRes, errorLogsRes, auditLogsRes] = await Promise.all([
        fetch(`${API_URL}/admin/email-templates`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        }),
        fetch(`${API_URL}/admin/system-health`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        }),
        fetch(`${API_URL}/admin/ai-costs`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        }),
        fetch(`${API_URL}/admin/error-logs`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        }),
        fetch(`${API_URL}/admin/audit-logs`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        }),
      ]);

      const templatesData = templatesRes.ok ? await templatesRes.json() : { templates: {} };
      const healthData = healthRes.ok ? await healthRes.json() : null;
      const aiCostsData = aiCostsRes.ok ? await aiCostsRes.json() : null;
      const errorLogsData = errorLogsRes.ok ? await errorLogsRes.json() : { logs: [], unresolved_count: 0 };
      const auditLogsData = auditLogsRes.ok ? await auditLogsRes.json() : { logs: [], action_types: [] };

      setUsers(usersData.users || []);
      setSettings(settingsData);
      setRooms(roomsData.rooms || []);
      setAnalytics(analyticsData);
      setActivityLogs(activityData.logs || []);
      setRevenue(revenueData);
      setFeatureFlags(flagsData.flags || {});
      setWebhookLogs(webhooksData.events || []);
      setEmailTemplates(templatesData.templates || {});
      setSystemHealth(healthData);
      setAiCosts(aiCostsData);
      setErrorLogs(errorLogsData.logs || []);
      setErrorLogsUnresolved(errorLogsData.unresolved_count || 0);
      setAuditLogs(auditLogsData.logs || []);
      setAuditActionTypes(auditLogsData.action_types || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (auditFilterAction) params.append("action", auditFilterAction);
      if (auditFilterStartDate) params.append("start_date", auditFilterStartDate);
      if (auditFilterEndDate) params.append("end_date", auditFilterEndDate);

      const res = await fetch(`${API_URL}/admin/audit-logs?${params}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
        setAuditActionTypes(data.action_types || []);
      }
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    }
  };

  const getActionColor = (action) => {
    const colors = {
      user_created: { bg: "#DCFCE7", text: "#166534" },
      user_updated: { bg: "#DBEAFE", text: "#1e40af" },
      user_deleted: { bg: "#FEE2E2", text: "#EF4444" },
      subscription_changed: { bg: "#E0E7FF", text: "#3730a3" },
      password_reset: { bg: "#FEF3C7", text: "#92400e" },
      user_impersonated: { bg: "#FCE7F3", text: "#be185d" },
      feature_flag_toggled: { bg: "#F3E8FF", text: "#7c3aed" },
      bulk_subscription_change: { bg: "#E0E7FF", text: "#3730a3" },
      bulk_delete: { bg: "#FEE2E2", text: "#EF4444" },
      error_resolved: { bg: "#DCFCE7", text: "#166534" },
    };
    return colors[action] || { bg: "#f3f4f6", text: "#4B5563" };
  };

  const formatActionLabel = (action) => {
    return action.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleResolveError = async (errorId) => {
    try {
      const res = await fetch(`${API_URL}/admin/error-logs/${errorId}/resolve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      if (res.ok) {
        const data = await res.json();
        setErrorLogs(prev =>
          prev.map(log =>
            log.id === errorId ? { ...log, resolved: true } : log
          )
        );
        setErrorLogsUnresolved(data.unresolved_count);
      } else {
        throw new Error("Failed to resolve error");
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const getFilteredErrorLogs = () => {
    if (errorLogsFilter === "unresolved") {
      return errorLogs.filter(log => !log.resolved);
    } else if (errorLogsFilter === "resolved") {
      return errorLogs.filter(log => log.resolved);
    }
    return errorLogs;
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

  const handleToggleFeatureFlag = async (flagName, currentValue) => {
    try {
      const res = await fetch(`${API_URL}/admin/feature-flags/${flagName}?enabled=${!currentValue}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      if (res.ok) {
        setFeatureFlags(prev => ({ ...prev, [flagName]: !currentValue }));
      } else {
        throw new Error("Failed to update feature flag");
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleImpersonate = async (userId) => {
    if (!confirm("This will generate a token that allows full access as this user. Continue?")) return;

    try {
      const res = await fetch(`${API_URL}/admin/impersonate/${userId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      if (res.ok) {
        const data = await res.json();
        setImpersonateToken(data);
      } else {
        throw new Error("Failed to impersonate user");
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleTestEmail = async (templateId) => {
    if (!testEmailAddress) {
      alert("Please enter an email address");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/admin/email-templates/${templateId}/test?to_email=${encodeURIComponent(testEmailAddress)}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      const data = await res.json();
      if (data.status === "success") {
        alert(`Test email sent to ${testEmailAddress}`);
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const dateParams = getDateRangeParams();
      const analyticsUrl = `${API_URL}/admin/analytics?start_date=${dateParams.start_date}&end_date=${dateParams.end_date}`;

      const res = await fetch(analyticsUrl, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    }
  };

  const handleDateRangeChange = (preset) => {
    setDateRangePreset(preset);
    if (preset !== "custom") {
      // Immediately fetch with new preset
      setTimeout(() => fetchAnalytics(), 0);
    }
  };

  const handleCustomDateApply = () => {
    if (customStartDate && customEndDate) {
      fetchAnalytics();
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", fontFamily: "'Nunito', sans-serif", background: "linear-gradient(180deg, #EAF7F0 0%, #ffffff 100%)", minHeight: "100vh" }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #EAF7F0 0%, #ffffff 100%)", fontFamily: "'Nunito', sans-serif", display: "flex" }}>
      {/* Sidebar */}
      <div style={{
        width: "240px",
        background: "#1a1a1a",
        color: "white",
        padding: "20px 0",
        flexShrink: 0,
      }}>
        <div style={{ padding: "0 20px 20px", borderBottom: "1px solid #333" }}>
          <img
            src={meedi8Logo}
            alt="Meedi8"
            style={{
              height: "32px",
              filter: "brightness(0) invert(1)",
            }}
          />
        </div>

        <nav style={{ marginTop: "20px" }}>
          <SidebarItem
            icon="☰"
            label="Dashboard"
            active={activeTab === "dashboard"}
            onClick={() => setActiveTab("dashboard")}
          />
          <SidebarItem
            icon="⊞"
            label="Analytics"
            active={activeTab === "analytics"}
            onClick={() => setActiveTab("analytics")}
          />
          <SidebarItem
            icon="⚇"
            label="Users"
            active={activeTab === "users"}
            onClick={() => setActiveTab("users")}
          />
          <SidebarItem
            icon="◱"
            label="Rooms"
            active={activeTab === "rooms"}
            onClick={() => setActiveTab("rooms")}
          />
          <SidebarItem
            icon="⬡"
            label="Subscriptions"
            active={activeTab === "subscriptions"}
            onClick={() => setActiveTab("subscriptions")}
          />
          <SidebarItem
            icon="⚙"
            label="Settings"
            active={activeTab === "settings"}
            onClick={() => setActiveTab("settings")}
          />
          <SidebarItem
            icon="☷"
            label="Activity Logs"
            active={activeTab === "activity"}
            onClick={() => setActiveTab("activity")}
          />
          <SidebarItem
            icon="◈"
            label="Revenue"
            active={activeTab === "revenue"}
            onClick={() => setActiveTab("revenue")}
          />
          <SidebarItem
            icon="◎"
            label="AI Costs"
            active={activeTab === "ai-costs"}
            onClick={() => setActiveTab("ai-costs")}
          />
          <SidebarItemWithBadge
            icon="⚠"
            label="Error Logs"
            active={activeTab === "errors"}
            onClick={() => setActiveTab("errors")}
            badge={errorLogsUnresolved}
          />
          <SidebarItem
            icon="☷"
            label="Audit Trail"
            active={activeTab === "audit"}
            onClick={() => setActiveTab("audit")}
          />
          <SidebarItem
            icon="⚑"
            label="Feature Flags"
            active={activeTab === "flags"}
            onClick={() => setActiveTab("flags")}
          />
          <SidebarItem
            icon="⌁"
            label="Webhooks"
            active={activeTab === "webhooks"}
            onClick={() => setActiveTab("webhooks")}
          />
          <SidebarItem
            icon="✉"
            label="Email Templates"
            active={activeTab === "emails"}
            onClick={() => setActiveTab("emails")}
          />
          <SidebarItem
            icon="♡"
            label="System Health"
            active={activeTab === "health"}
            onClick={() => setActiveTab("health")}
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
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700", color: "#4B5563" }}>
            {activeTab === "dashboard" && "Dashboard Overview"}
            {activeTab === "analytics" && "Analytics"}
            {activeTab === "users" && "User Management"}
            {activeTab === "rooms" && "Room Management"}
            {activeTab === "subscriptions" && "Subscription Management"}
            {activeTab === "settings" && "Platform Settings"}
            {activeTab === "activity" && "Activity Logs"}
            {activeTab === "revenue" && "Revenue Reporting"}
            {activeTab === "ai-costs" && "AI Cost Tracking"}
            {activeTab === "errors" && "Error Logs"}
            {activeTab === "audit" && "Audit Trail"}
            {activeTab === "flags" && "Feature Flags"}
            {activeTab === "webhooks" && "Webhook Logs"}
            {activeTab === "emails" && "Email Templates"}
            {activeTab === "health" && "System Health"}
          </h2>
          <div style={{ display: "flex", gap: "8px" }}>
            {activeTab === "users" && (
              <>
                <button
                  onClick={handleExportCSV}
                  style={{
                    background: "#f3f4f6",
                    color: "#4B5563",
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
                    background: "#7DD3C0",
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
              color: "#EF4444",
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
                <StatCard title="Total Users" value={settings.total_users} color="#B8A7E5" icon="⚇" />
                <StatCard title="Active Subscriptions" value={settings.active_subscriptions} color="#10B981" icon="⬡" />
                <StatCard title="Total Rooms" value={settings.total_rooms} color="#7DD3C0" icon="◱" />
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
                    borderRadius: "12px",
                    padding: "24px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  }}>
                    <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: "700", color: "#4B5563" }}>
                      Subscription Tiers
                    </h3>
                    <PieChart data={analytics.tier_breakdown} size={140} />
                  </div>
                )}

                {/* Circular Progress Cards */}
                <div style={{
                  background: "white",
                  borderRadius: "12px",
                  padding: "24px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}>
                  <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: "700", color: "#4B5563" }}>
                    Quick Stats
                  </h3>
                  <div style={{ display: "flex", justifyContent: "space-around" }}>
                    <CircularProgress
                      value={analytics?.active_users_7d || 0}
                      max={settings.total_users || 1}
                      color="#B8A7E5"
                      label="Active (7d)"
                    />
                    <CircularProgress
                      value={settings.active_subscriptions}
                      max={settings.total_users || 1}
                      color="#10B981"
                      label="Paid Users"
                    />
                    <CircularProgress
                      value={analytics?.avg_turns_per_room || 0}
                      max={50}
                      color="#7DD3C0"
                      label="Avg Turns"
                    />
                  </div>
                </div>
              </div>

              <div style={{
                background: "white",
                borderRadius: "12px",
                padding: "24px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}>
                <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: "700", color: "#4B5563" }}>
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
              {/* Date Range Picker */}
              <div style={{
                background: "white",
                borderRadius: "12px",
                padding: "16px 20px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                marginBottom: "24px",
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px",
                }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}>
                    <span style={{ fontSize: "14px", fontWeight: "600", color: "#4B5563" }}>Date Range:</span>
                    {[
                      { value: "7d", label: "Last 7 days" },
                      { value: "30d", label: "Last 30 days" },
                      { value: "90d", label: "Last 90 days" },
                      { value: "this_month", label: "This month" },
                      { value: "last_month", label: "Last month" },
                      { value: "custom", label: "Custom" },
                    ].map((preset) => (
                      <button
                        key={preset.value}
                        onClick={() => handleDateRangeChange(preset.value)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          border: "none",
                          background: dateRangePreset === preset.value ? "#7DD3C0" : "#f3f4f6",
                          color: dateRangePreset === preset.value ? "white" : "#4B5563",
                          fontSize: "13px",
                          fontWeight: dateRangePreset === preset.value ? "600" : "400",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {dateRangePreset === "custom" && (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        style={{
                          padding: "6px 10px",
                          border: "1px solid #d1d5db",
                          borderRadius: "6px",
                          fontSize: "13px",
                        }}
                      />
                      <span style={{ color: "#6B7280" }}>to</span>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        style={{
                          padding: "6px 10px",
                          border: "1px solid #d1d5db",
                          borderRadius: "6px",
                          fontSize: "13px",
                        }}
                      />
                      <button
                        onClick={handleCustomDateApply}
                        disabled={!customStartDate || !customEndDate}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          border: "none",
                          background: customStartDate && customEndDate ? "#7DD3C0" : "#d1d5db",
                          color: "white",
                          fontSize: "13px",
                          fontWeight: "600",
                          cursor: customStartDate && customEndDate ? "pointer" : "not-allowed",
                        }}
                      >
                        Apply
                      </button>
                    </div>
                  )}

                  {analytics.date_range && (
                    <div style={{
                      fontSize: "12px",
                      color: "#6B7280",
                      background: "#f9fafb",
                      padding: "6px 12px",
                      borderRadius: "6px",
                    }}>
                      Showing: {analytics.date_range.start_date} to {analytics.date_range.end_date}
                    </div>
                  )}
                </div>
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "20px",
                marginBottom: "24px",
              }}>
                <StatCard title="Active Users (7d)" value={analytics.active_users_7d || 0} color="#B8A7E5" icon="◉" />
                <StatCard title="Avg Turns/Room" value={analytics.avg_turns_per_room || 0} color="#10B981" icon="◇" />
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
                    borderRadius: "12px",
                    padding: "24px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  }}>
                    <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: "700", color: "#4B5563" }}>
                      Tier Breakdown
                    </h3>
                    <PieChart
                      data={analytics.tier_breakdown}
                      size={140}
                      colors={["#B8A7E5", "#10B981", "#7DD3C0"]}
                    />
                  </div>
                )}

                {/* Rooms by Phase Pie Chart */}
                {analytics.rooms_by_phase && analytics.rooms_by_phase.length > 0 && (
                  <div style={{
                    background: "white",
                    borderRadius: "12px",
                    padding: "24px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  }}>
                    <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: "700", color: "#4B5563" }}>
                      Rooms by Phase
                    </h3>
                    <PieChart
                      data={analytics.rooms_by_phase}
                      size={140}
                      colors={["#F59E0B", "#EF4444", "#B8A7E5", "#7DD3C0", "#10B981", "#6750A4"]}
                    />
                  </div>
                )}
              </div>

              <div style={{
                background: "white",
                borderRadius: "12px",
                padding: "24px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}>
                <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: "700", color: "#4B5563" }}>
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
                      borderRadius: "12px",
                    }}>
                      <span style={{ color: "#6B7280", fontSize: "14px" }}>{item.date}</span>
                      <span style={{
                        fontWeight: "600",
                        background: "#7DD3C020",
                        color: "#7DD3C0",
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
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
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
                            style={{ ...actionBtnStyle, color: "#EF4444" }}
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
                borderRadius: "12px",
                padding: "16px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
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
                    background: "#7DD3C0",
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
                    color: "#4B5563",
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
                  background: "#EAF7F0",
                  borderRadius: "12px",
                  padding: "12px 16px",
                  marginBottom: "16px",
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                }}>
                  <span style={{ fontSize: "14px", fontWeight: "600", color: "#4B5563" }}>
                    {selectedUsers.length} selected
                  </span>
                  <button
                    onClick={() => handleBulkUpdateSubscriptions("pro", "active")}
                    style={{
                      background: "#10B981",
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
                      background: "#F59E0B",
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
                      background: "#EF4444",
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
                borderRadius: "12px",
                padding: "24px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
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
                              color: user.is_admin ? "#92400e" : user.is_guest ? "#3730a3" : "#6B7280",
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
                              onClick={() => handleImpersonate(user.id)}
                              style={{ ...actionBtnStyle, color: "#F59E0B" }}
                            >
                              Impersonate
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              style={{ ...actionBtnStyle, color: "#EF4444" }}
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
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
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
                                     user.subscription?.tier === "plus" ? "#1e40af" : "#6B7280",
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
                                     user.subscription?.status === "cancelled" ? "#EF4444" : "#6B7280",
                              fontSize: "12px",
                            }}>
                              {user.subscription?.status || "trial"}
                            </span>
                          )}
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: "11px", color: "#6B7280" }}>
                            {user.subscription?.stripe_subscription_id
                              ? user.subscription.stripe_subscription_id.slice(0, 15) + "..."
                              : "-"}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          {editingSubscription === user.id ? (
                            <button
                              onClick={() => setEditingSubscription(null)}
                              style={{ ...actionBtnStyle, color: "#10B981" }}
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
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}>
              <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "700", color: "#4B5563" }}>
                Platform Configuration
              </h3>
              <p style={{ color: "#6B7280", fontSize: "14px", marginBottom: "20px" }}>
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

          {/* Activity Logs Tab */}
          {activeTab === "activity" && (
            <div style={{
              background: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}>
              <div style={{ overflowX: "auto", maxHeight: "600px", overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead style={{ position: "sticky", top: 0, background: "white" }}>
                    <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                      <th style={thStyle}>ID</th>
                      <th style={thStyle}>User</th>
                      <th style={thStyle}>Action</th>
                      <th style={thStyle}>Context</th>
                      <th style={thStyle}>Room</th>
                      <th style={thStyle}>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activityLogs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <td style={tdStyle}>{log.id}</td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: "13px" }}>{log.user_email}</span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            padding: "2px 8px",
                            borderRadius: "12px",
                            background: log.action === "user" ? "#dbeafe" : "#dcfce7",
                            color: log.action === "user" ? "#1e40af" : "#166534",
                            fontSize: "12px",
                          }}>
                            {log.action}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            padding: "2px 8px",
                            borderRadius: "12px",
                            background: "#f3f4f6",
                            fontSize: "12px",
                          }}>
                            {log.context}
                          </span>
                        </td>
                        <td style={tdStyle}>{log.room_id || "-"}</td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: "12px", color: "#6B7280" }}>
                            {log.created_at ? new Date(log.created_at).toLocaleString() : "-"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Revenue Tab */}
          {activeTab === "revenue" && (
            <>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "20px",
                marginBottom: "24px",
              }}>
                <StatCard title="Total Revenue" value={revenue ? `$${revenue.total_revenue}` : "$0"} color="#10B981" icon="◈" />
                <StatCard title="Monthly Recurring" value={revenue ? `$${revenue.mrr}` : "$0"} color="#B8A7E5" icon="◯" />
                <StatCard title="Active Subscriptions" value={revenue?.active_subscriptions || 0} color="#7DD3C0" icon="⬡" />
              </div>

              {revenue?.error && (
                <div style={{
                  background: "#fef3c7",
                  color: "#92400e",
                  padding: "12px",
                  borderRadius: "8px",
                  marginBottom: "16px",
                  fontSize: "14px",
                }}>
                  Note: {revenue.error}
                </div>
              )}

              <div style={{
                background: "white",
                borderRadius: "12px",
                padding: "24px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}>
                <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: "700", color: "#4B5563" }}>
                  Recent Payments
                </h3>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                        <th style={thStyle}>ID</th>
                        <th style={thStyle}>Amount</th>
                        <th style={thStyle}>Status</th>
                        <th style={thStyle}>Customer</th>
                        <th style={thStyle}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(revenue?.recent_payments || []).map((payment) => (
                        <tr key={payment.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                          <td style={tdStyle}>
                            <span style={{ fontFamily: "monospace", fontSize: "12px" }}>
                              {payment.id.slice(0, 15)}...
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <span style={{ fontWeight: "600", color: "#10B981" }}>
                              ${payment.amount} {payment.currency}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <span style={{
                              padding: "2px 8px",
                              borderRadius: "12px",
                              background: payment.status === "succeeded" ? "#dcfce7" : "#fef3c7",
                              color: payment.status === "succeeded" ? "#166534" : "#92400e",
                              fontSize: "12px",
                            }}>
                              {payment.status}
                            </span>
                          </td>
                          <td style={tdStyle}>{payment.customer_email || "-"}</td>
                          <td style={tdStyle}>
                            <span style={{ fontSize: "12px", color: "#6B7280" }}>
                              {new Date(payment.created_at).toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* AI Costs Tab */}
          {activeTab === "ai-costs" && (
            <>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "20px",
                marginBottom: "24px",
              }}>
                <StatCard title="Today's Cost" value={aiCosts ? `$${aiCosts.today_cost.toFixed(4)}` : "$0"} color="#F59E0B" icon="◯" />
                <StatCard title="This Month" value={aiCosts ? `$${aiCosts.month_cost.toFixed(4)}` : "$0"} color="#B8A7E5" icon="⊞" />
                <StatCard title="Last 30 Days" value={aiCosts ? `$${aiCosts.total_cost.toFixed(4)}` : "$0"} color="#7DD3C0" icon="◈" />
              </div>

              {/* Costs by Service */}
              <div style={{
                background: "white",
                borderRadius: "12px",
                padding: "24px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                marginBottom: "24px",
              }}>
                <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: "700", color: "#4B5563" }}>
                  Costs by Service (Last 30 Days)
                </h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  {(aiCosts?.costs_by_service || []).map((service) => (
                    <div key={service.service} style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "16px",
                      background: "#f9fafb",
                      borderRadius: "12px",
                    }}>
                      <div>
                        <div style={{ fontWeight: "600", marginBottom: "4px", color: "#4B5563" }}>
                          {service.service === "anthropic" ? "Claude (Anthropic)" :
                           service.service === "openai_whisper" ? "Whisper (OpenAI)" :
                           service.service === "openai_tts" ? "TTS (OpenAI)" :
                           service.service === "gemini" ? "Gemini (Google)" :
                           service.service}
                        </div>
                        <div style={{ fontSize: "12px", color: "#6B7280" }}>
                          {service.calls} calls | {(service.input_tokens + service.output_tokens).toLocaleString()} tokens
                        </div>
                      </div>
                      <div style={{
                        fontSize: "18px",
                        fontWeight: "700",
                        color: "#10B981",
                      }}>
                        ${service.cost.toFixed(4)}
                      </div>
                    </div>
                  ))}
                  {(aiCosts?.costs_by_service || []).length === 0 && (
                    <div style={{ color: "#6B7280", fontSize: "14px", textAlign: "center", padding: "20px" }}>
                      No cost data yet
                    </div>
                  )}
                </div>
              </div>

              {/* Costs by Model */}
              <div style={{
                background: "white",
                borderRadius: "12px",
                padding: "24px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                marginBottom: "24px",
              }}>
                <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: "700", color: "#4B5563" }}>
                  Costs by Model
                </h3>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                        <th style={thStyle}>Model</th>
                        <th style={thStyle}>Calls</th>
                        <th style={thStyle}>Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(aiCosts?.costs_by_model || []).map((model) => (
                        <tr key={model.model} style={{ borderBottom: "1px solid #e5e7eb" }}>
                          <td style={tdStyle}>
                            <span style={{ fontFamily: "monospace", fontSize: "12px" }}>
                              {model.model}
                            </span>
                          </td>
                          <td style={tdStyle}>{model.calls}</td>
                          <td style={tdStyle}>
                            <span style={{ fontWeight: "600", color: "#10B981" }}>
                              ${model.cost.toFixed(4)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top Users by Cost */}
              <div style={{
                background: "white",
                borderRadius: "12px",
                padding: "24px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}>
                <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: "700", color: "#4B5563" }}>
                  Top Users by Cost
                </h3>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                        <th style={thStyle}>User</th>
                        <th style={thStyle}>Email</th>
                        <th style={thStyle}>API Calls</th>
                        <th style={thStyle}>Total Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(aiCosts?.top_users || []).map((user) => (
                        <tr key={user.user_id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                          <td style={tdStyle}>{user.name || "Unknown"}</td>
                          <td style={tdStyle}>
                            <span style={{ fontSize: "12px", color: "#6B7280" }}>
                              {user.email}
                            </span>
                          </td>
                          <td style={tdStyle}>{user.calls}</td>
                          <td style={tdStyle}>
                            <span style={{ fontWeight: "600", color: "#10B981" }}>
                              ${user.cost.toFixed(4)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Error Logs Tab */}
          {activeTab === "errors" && (
            <>
              {/* Stats Row */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
                marginBottom: "24px",
              }}>
                <StatCard
                  title="Unresolved Errors"
                  value={errorLogsUnresolved}
                  color="#EF4444"
                  icon="⚠"
                />
                <StatCard
                  title="Total Errors"
                  value={errorLogs.length}
                  color="#6B7280"
                  icon="◇"
                />
              </div>

              {/* Filter Bar */}
              <div style={{
                background: "white",
                borderRadius: "12px",
                padding: "16px 20px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                marginBottom: "24px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}>
                <span style={{ fontSize: "14px", fontWeight: "600", color: "#4B5563" }}>Filter:</span>
                {[
                  { value: "all", label: "All" },
                  { value: "unresolved", label: "Unresolved" },
                  { value: "resolved", label: "Resolved" },
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setErrorLogsFilter(filter.value)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: "none",
                      background: errorLogsFilter === filter.value ? "#EF4444" : "#f3f4f6",
                      color: errorLogsFilter === filter.value ? "white" : "#4B5563",
                      fontSize: "13px",
                      fontWeight: errorLogsFilter === filter.value ? "600" : "400",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {filter.label}
                    {filter.value === "unresolved" && errorLogsUnresolved > 0 && (
                      <span style={{
                        marginLeft: "6px",
                        background: errorLogsFilter === filter.value ? "rgba(255,255,255,0.3)" : "#EF4444",
                        color: "white",
                        padding: "2px 6px",
                        borderRadius: "10px",
                        fontSize: "11px",
                      }}>
                        {errorLogsUnresolved}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Error Logs Table */}
              <div style={{
                background: "white",
                borderRadius: "12px",
                padding: "24px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}>
                <div style={{ overflowX: "auto", maxHeight: "600px", overflowY: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                    <thead style={{ position: "sticky", top: 0, background: "white" }}>
                      <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                        <th style={thStyle}>Time</th>
                        <th style={thStyle}>Type</th>
                        <th style={thStyle}>Message</th>
                        <th style={thStyle}>Endpoint</th>
                        <th style={thStyle}>User</th>
                        <th style={thStyle}>Status</th>
                        <th style={thStyle}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredErrorLogs().map((log) => (
                        <React.Fragment key={log.id}>
                          <tr
                            style={{
                              borderBottom: expandedErrorId === log.id ? "none" : "1px solid #e5e7eb",
                              background: log.severity === "warning" ? "#FEF3C720" : (log.resolved ? "#f9fafb" : "#FEE2E210"),
                              cursor: "pointer",
                            }}
                            onClick={() => setExpandedErrorId(expandedErrorId === log.id ? null : log.id)}
                          >
                            <td style={tdStyle}>
                              <span style={{ fontSize: "12px", color: "#6B7280" }}>
                                {new Date(log.timestamp).toLocaleString()}
                              </span>
                            </td>
                            <td style={tdStyle}>
                              <span style={{
                                padding: "2px 8px",
                                borderRadius: "4px",
                                background: log.severity === "error" ? "#FEE2E2" : "#FEF3C7",
                                color: log.severity === "error" ? "#EF4444" : "#F59E0B",
                                fontSize: "11px",
                                fontWeight: "600",
                              }}>
                                {log.error_type}
                              </span>
                            </td>
                            <td style={{ ...tdStyle, maxWidth: "300px" }}>
                              <div style={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}>
                                {log.message}
                              </div>
                            </td>
                            <td style={tdStyle}>
                              <span style={{ fontFamily: "monospace", fontSize: "12px" }}>
                                {log.method} {log.endpoint}
                              </span>
                            </td>
                            <td style={tdStyle}>
                              {log.user_id || "-"}
                            </td>
                            <td style={tdStyle}>
                              <span style={{
                                padding: "2px 8px",
                                borderRadius: "12px",
                                background: log.resolved ? "#DCFCE7" : "#FEE2E2",
                                color: log.resolved ? "#166534" : "#EF4444",
                                fontSize: "11px",
                              }}>
                                {log.resolved ? "Resolved" : "Unresolved"}
                              </span>
                            </td>
                            <td style={tdStyle}>
                              {!log.resolved && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleResolveError(log.id);
                                  }}
                                  style={{
                                    background: "#10B981",
                                    color: "white",
                                    border: "none",
                                    padding: "4px 8px",
                                    borderRadius: "4px",
                                    fontSize: "11px",
                                    cursor: "pointer",
                                  }}
                                >
                                  Mark Resolved
                                </button>
                              )}
                            </td>
                          </tr>
                          {/* Expanded Stack Trace Row */}
                          {expandedErrorId === log.id && (
                            <tr style={{ background: "#f9fafb" }}>
                              <td colSpan="7" style={{ padding: "16px" }}>
                                <div style={{ marginBottom: "12px" }}>
                                  <strong style={{ color: "#4B5563", fontSize: "13px" }}>Request ID:</strong>
                                  <span style={{ marginLeft: "8px", fontFamily: "monospace", fontSize: "12px", color: "#6B7280" }}>
                                    {log.request_id}
                                  </span>
                                </div>
                                <div>
                                  <strong style={{ color: "#4B5563", fontSize: "13px" }}>Stack Trace:</strong>
                                  <pre style={{
                                    background: "#1a1a1a",
                                    color: "#f0f0f0",
                                    padding: "12px",
                                    borderRadius: "8px",
                                    fontSize: "11px",
                                    fontFamily: "monospace",
                                    overflow: "auto",
                                    maxHeight: "300px",
                                    marginTop: "8px",
                                    whiteSpace: "pre-wrap",
                                    wordBreak: "break-word",
                                  }}>
                                    {log.stack_trace}
                                  </pre>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                      {getFilteredErrorLogs().length === 0 && (
                        <tr>
                          <td colSpan="7" style={{ padding: "40px", textAlign: "center", color: "#6B7280" }}>
                            No error logs found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Audit Trail Tab */}
          {activeTab === "audit" && (
            <>
              {/* Filter Bar */}
              <div style={{
                background: "white",
                borderRadius: "12px",
                padding: "16px 20px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                marginBottom: "24px",
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  flexWrap: "wrap",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "14px", fontWeight: "600", color: "#4B5563" }}>Action:</span>
                    <select
                      value={auditFilterAction}
                      onChange={(e) => setAuditFilterAction(e.target.value)}
                      style={{
                        padding: "6px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "13px",
                        minWidth: "180px",
                      }}
                    >
                      <option value="">All Actions</option>
                      {auditActionTypes.map((action) => (
                        <option key={action} value={action}>
                          {formatActionLabel(action)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "14px", fontWeight: "600", color: "#4B5563" }}>From:</span>
                    <input
                      type="date"
                      value={auditFilterStartDate}
                      onChange={(e) => setAuditFilterStartDate(e.target.value)}
                      style={{
                        padding: "6px 10px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "13px",
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "14px", fontWeight: "600", color: "#4B5563" }}>To:</span>
                    <input
                      type="date"
                      value={auditFilterEndDate}
                      onChange={(e) => setAuditFilterEndDate(e.target.value)}
                      style={{
                        padding: "6px 10px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "13px",
                      }}
                    />
                  </div>

                  <button
                    onClick={fetchAuditLogs}
                    style={{
                      padding: "6px 16px",
                      borderRadius: "6px",
                      border: "none",
                      background: "#B8A7E5",
                      color: "white",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    Apply Filters
                  </button>

                  {(auditFilterAction || auditFilterStartDate || auditFilterEndDate) && (
                    <button
                      onClick={() => {
                        setAuditFilterAction("");
                        setAuditFilterStartDate("");
                        setAuditFilterEndDate("");
                        fetchAuditLogs();
                      }}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: "1px solid #d1d5db",
                        background: "white",
                        color: "#4B5563",
                        fontSize: "13px",
                        cursor: "pointer",
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Audit Logs Table */}
              <div style={{
                background: "white",
                borderRadius: "12px",
                padding: "24px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}>
                <div style={{ overflowX: "auto", maxHeight: "600px", overflowY: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                    <thead style={{ position: "sticky", top: 0, background: "white" }}>
                      <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                        <th style={thStyle}>Time</th>
                        <th style={thStyle}>Admin</th>
                        <th style={thStyle}>Action</th>
                        <th style={thStyle}>Target</th>
                        <th style={thStyle}>Details</th>
                        <th style={thStyle}>IP Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => (
                        <React.Fragment key={log.id}>
                          <tr
                            style={{
                              borderBottom: expandedAuditId === log.id ? "none" : "1px solid #e5e7eb",
                              cursor: Object.keys(log.details || {}).length > 0 ? "pointer" : "default",
                            }}
                            onClick={() => {
                              if (Object.keys(log.details || {}).length > 0) {
                                setExpandedAuditId(expandedAuditId === log.id ? null : log.id);
                              }
                            }}
                          >
                            <td style={tdStyle}>
                              <span style={{ fontSize: "12px", color: "#6B7280" }}>
                                {new Date(log.timestamp).toLocaleString()}
                              </span>
                            </td>
                            <td style={tdStyle}>
                              <span style={{ fontSize: "13px" }}>{log.admin_email}</span>
                            </td>
                            <td style={tdStyle}>
                              <span style={{
                                padding: "3px 10px",
                                borderRadius: "12px",
                                background: getActionColor(log.action).bg,
                                color: getActionColor(log.action).text,
                                fontSize: "11px",
                                fontWeight: "600",
                              }}>
                                {formatActionLabel(log.action)}
                              </span>
                            </td>
                            <td style={tdStyle}>
                              <div style={{ fontSize: "12px", color: "#4B5563" }}>
                                {log.target_type}
                                {log.target_id && (
                                  <span style={{ fontFamily: "monospace", marginLeft: "4px" }}>
                                    #{log.target_id}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td style={tdStyle}>
                              {Object.keys(log.details || {}).length > 0 ? (
                                <span style={{
                                  fontSize: "11px",
                                  color: "#B8A7E5",
                                  fontWeight: "600",
                                }}>
                                  {expandedAuditId === log.id ? "Hide details" : "View details"}
                                </span>
                              ) : (
                                <span style={{ fontSize: "11px", color: "#9ca3af" }}>-</span>
                              )}
                            </td>
                            <td style={tdStyle}>
                              <span style={{ fontSize: "11px", fontFamily: "monospace", color: "#6B7280" }}>
                                {log.ip_address || "-"}
                              </span>
                            </td>
                          </tr>
                          {/* Expanded Details Row */}
                          {expandedAuditId === log.id && Object.keys(log.details || {}).length > 0 && (
                            <tr style={{ background: "#f9fafb" }}>
                              <td colSpan="6" style={{ padding: "16px" }}>
                                <div style={{ marginBottom: "8px" }}>
                                  <strong style={{ color: "#4B5563", fontSize: "13px" }}>Details:</strong>
                                </div>
                                <pre style={{
                                  background: "#1a1a1a",
                                  color: "#f0f0f0",
                                  padding: "12px",
                                  borderRadius: "8px",
                                  fontSize: "11px",
                                  fontFamily: "monospace",
                                  overflow: "auto",
                                  maxHeight: "200px",
                                  marginTop: "8px",
                                  whiteSpace: "pre-wrap",
                                  wordBreak: "break-word",
                                }}>
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                      {auditLogs.length === 0 && (
                        <tr>
                          <td colSpan="6" style={{ padding: "40px", textAlign: "center", color: "#6B7280" }}>
                            No audit logs found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Feature Flags Tab */}
          {activeTab === "flags" && (
            <div style={{
              background: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}>
              <h3 style={{ margin: "0 0 8px", fontSize: "16px", fontWeight: "700", color: "#4B5563" }}>
                Feature Flags
              </h3>
              <p style={{ color: "#6B7280", fontSize: "14px", marginBottom: "24px" }}>
                Toggle features on/off for all users. Changes take effect immediately.
              </p>

              <div style={{ display: "grid", gap: "16px" }}>
                {Object.entries(featureFlags).map(([flagName, enabled]) => (
                  <div key={flagName} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px",
                    background: "#f9fafb",
                    borderRadius: "12px",
                  }}>
                    <div>
                      <div style={{ fontWeight: "600", marginBottom: "4px", color: "#4B5563" }}>
                        {flagName.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                      <div style={{ fontSize: "12px", color: "#6B7280" }}>
                        {flagName}
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleFeatureFlag(flagName, enabled)}
                      style={{
                        width: "56px",
                        height: "32px",
                        borderRadius: "16px",
                        background: enabled ? "#10B981" : "#d1d5db",
                        border: "none",
                        cursor: "pointer",
                        position: "relative",
                        transition: "background 0.2s",
                      }}
                    >
                      <div style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        background: "white",
                        position: "absolute",
                        top: "4px",
                        left: enabled ? "28px" : "4px",
                        transition: "left 0.2s",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                      }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Webhooks Tab */}
          {activeTab === "webhooks" && (
            <div style={{
              background: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}>
              <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: "700", color: "#4B5563" }}>
                Recent Stripe Webhook Events
              </h3>
              <div style={{ overflowX: "auto", maxHeight: "500px", overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead style={{ position: "sticky", top: 0, background: "white" }}>
                    <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                      <th style={thStyle}>Event ID</th>
                      <th style={thStyle}>Type</th>
                      <th style={thStyle}>Mode</th>
                      <th style={thStyle}>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {webhookLogs.map((event) => (
                      <tr key={event.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <td style={tdStyle}>
                          <span style={{ fontFamily: "monospace", fontSize: "12px" }}>
                            {event.id.slice(0, 20)}...
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            padding: "2px 8px",
                            borderRadius: "12px",
                            background: event.type.includes("succeeded") ? "#dcfce7" :
                                       event.type.includes("failed") ? "#fee2e2" : "#dbeafe",
                            color: event.type.includes("succeeded") ? "#166534" :
                                   event.type.includes("failed") ? "#EF4444" : "#1e40af",
                            fontSize: "11px",
                          }}>
                            {event.type}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            padding: "2px 8px",
                            borderRadius: "12px",
                            background: event.livemode ? "#dcfce7" : "#fef3c7",
                            color: event.livemode ? "#166534" : "#92400e",
                            fontSize: "11px",
                          }}>
                            {event.livemode ? "Live" : "Test"}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: "12px", color: "#6B7280" }}>
                            {new Date(event.created_at).toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Email Templates Tab */}
          {activeTab === "emails" && (
            <div style={{
              background: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}>
              <h3 style={{ margin: "0 0 8px", fontSize: "16px", fontWeight: "700", color: "#4B5563" }}>
                Email Templates
              </h3>
              <p style={{ color: "#6B7280", fontSize: "14px", marginBottom: "16px" }}>
                Manage email templates used by the notification system.
              </p>

              {/* Test Email Input */}
              <div style={{
                background: "#f9fafb",
                padding: "16px",
                borderRadius: "12px",
                marginBottom: "24px",
                display: "flex",
                gap: "12px",
                alignItems: "center",
              }}>
                <label style={{ fontSize: "14px", fontWeight: "500", color: "#4B5563" }}>Test Email:</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div style={{ display: "grid", gap: "16px" }}>
                {Object.entries(emailTemplates).map(([templateId, template]) => (
                  <div key={templateId} style={{
                    padding: "20px",
                    background: "#f9fafb",
                    borderRadius: "12px",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }}>
                      <div>
                        <div style={{ fontWeight: "600", fontSize: "15px", marginBottom: "4px", color: "#4B5563" }}>
                          {template.name}
                        </div>
                        <div style={{ fontSize: "12px", color: "#6B7280" }}>
                          {template.description}
                        </div>
                      </div>
                      <button
                        onClick={() => handleTestEmail(templateId)}
                        style={{
                          background: "#7DD3C0",
                          color: "white",
                          border: "none",
                          padding: "6px 12px",
                          borderRadius: "8px",
                          fontSize: "12px",
                          cursor: "pointer",
                        }}
                      >
                        Send Test
                      </button>
                    </div>
                    <div style={{ marginBottom: "8px" }}>
                      <span style={{ fontSize: "12px", color: "#6B7280" }}>Subject: </span>
                      <span style={{ fontSize: "13px", fontFamily: "monospace" }}>{template.subject}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: "12px", color: "#6B7280" }}>Variables: </span>
                      {template.variables?.map((v) => (
                        <span key={v} style={{
                          background: "#EAF7F0",
                          color: "#166534",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          marginRight: "4px",
                        }}>
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* System Health Tab */}
          {activeTab === "health" && systemHealth && (
            <>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
                marginBottom: "24px",
              }}>
                <div style={{
                  background: systemHealth.status === "healthy" ? "#dcfce7" : "#fef3c7",
                  borderRadius: "12px",
                  padding: "24px",
                  textAlign: "center",
                }}>
                  <div style={{
                    fontSize: "40px",
                    marginBottom: "8px",
                  }}>
                    {systemHealth.status === "healthy" ? "♥" : "⚠"}
                  </div>
                  <div style={{
                    fontWeight: "700",
                    fontSize: "18px",
                    color: systemHealth.status === "healthy" ? "#166534" : "#92400e",
                  }}>
                    {systemHealth.status === "healthy" ? "System Healthy" : "Degraded"}
                  </div>
                </div>
              </div>

              <div style={{
                background: "white",
                borderRadius: "12px",
                padding: "24px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}>
                <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: "700", color: "#4B5563" }}>
                  Health Checks
                </h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  {Object.entries(systemHealth.checks || {}).map(([name, check]) => (
                    <div key={name} style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "16px",
                      background: "#f9fafb",
                      borderRadius: "12px",
                    }}>
                      <div>
                        <div style={{ fontWeight: "600", textTransform: "capitalize", color: "#4B5563" }}>{name}</div>
                        {check.message && (
                          <div style={{ fontSize: "12px", color: "#6B7280" }}>{check.message}</div>
                        )}
                        {check.version && (
                          <div style={{ fontSize: "12px", color: "#6B7280" }}>v{check.version}</div>
                        )}
                        {check.used_percent !== undefined && (
                          <div style={{ fontSize: "12px", color: "#6B7280" }}>
                            {check.used_percent}% used
                            {check.used_gb && ` (${check.used_gb}/${check.total_gb} GB)`}
                          </div>
                        )}
                      </div>
                      <div style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: check.status === "ok" ? "#dcfce7" :
                                   check.status === "warning" ? "#fef3c7" :
                                   check.status === "not_configured" ? "#f3f4f6" : "#fee2e2",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "14px",
                      }}>
                        {check.status === "ok" ? "✓" :
                         check.status === "warning" ? "!" :
                         check.status === "not_configured" ? "○" : "✕"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
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
            borderRadius: "12px",
            padding: "24px",
            width: "100%",
            maxWidth: "400px",
          }}>
            <h3 style={{ margin: "0 0 20px", fontSize: "18px", fontWeight: "700", color: "#4B5563" }}>
              Create New User
            </h3>

            {createUserError && (
              <div style={{
                background: "#fee2e2",
                color: "#EF4444",
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
                <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px", color: "#4B5563" }}>
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
                <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px", color: "#4B5563" }}>
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
                <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px", color: "#4B5563" }}>
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
                  <span style={{ fontSize: "14px", color: "#4B5563" }}>Make this user an admin</span>
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
                    color: "#4B5563",
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
                    background: "#7DD3C0",
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
            borderRadius: "12px",
            padding: "24px",
            width: "100%",
            maxWidth: "400px",
          }}>
            <h3 style={{ margin: "0 0 20px", fontSize: "18px", fontWeight: "700", color: "#4B5563" }}>
              Password Reset
            </h3>

            <p style={{ marginBottom: "16px", color: "#6B7280", fontSize: "14px" }}>
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

            <p style={{ marginBottom: "16px", color: "#EF4444", fontSize: "12px" }}>
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
                background: "#7DD3C0",
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

      {/* Impersonate Token Modal */}
      {impersonateToken && (
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
            borderRadius: "12px",
            padding: "24px",
            width: "100%",
            maxWidth: "500px",
          }}>
            <h3 style={{ margin: "0 0 20px", fontSize: "18px", fontWeight: "700", color: "#4B5563" }}>
              User Impersonation Token
            </h3>

            <div style={{
              background: "#fef3c7",
              color: "#92400e",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "16px",
              fontSize: "13px",
            }}>
              {impersonateToken.warning}
            </div>

            <p style={{ marginBottom: "8px", color: "#6B7280", fontSize: "14px" }}>
              Impersonating: <strong>{impersonateToken.user_email}</strong>
            </p>

            <div style={{
              background: "#f3f4f6",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "20px",
              fontFamily: "monospace",
              fontSize: "11px",
              wordBreak: "break-all",
              userSelect: "all",
              maxHeight: "120px",
              overflowY: "auto",
            }}>
              {impersonateToken.token}
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(impersonateToken.token);
                  alert("Token copied to clipboard!");
                }}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "#f3f4f6",
                  color: "#4B5563",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Copy Token
              </button>
              <button
                onClick={() => {
                  // Set token in localStorage and redirect to app
                  localStorage.setItem("token", impersonateToken.token);
                  window.open("/start", "_blank");
                }}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "#F59E0B",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Open as User
              </button>
              <button
                onClick={() => setImpersonateToken(null)}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "#7DD3C0",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
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

function SidebarItemWithBadge({ icon, label, active, onClick, badge }) {
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
        borderLeft: active ? "3px solid #EF4444" : "3px solid transparent",
        position: "relative",
      }}
    >
      <span style={{ color: badge > 0 ? "#EF4444" : "inherit" }}>{icon}</span>
      <span>{label}</span>
      {badge > 0 && (
        <span style={{
          position: "absolute",
          right: "12px",
          background: "#EF4444",
          color: "white",
          fontSize: "10px",
          fontWeight: "700",
          padding: "2px 6px",
          borderRadius: "10px",
          minWidth: "18px",
          textAlign: "center",
        }}>
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  );
}

function StatCard({ title, value, color, icon }) {
  return (
    <div style={{
      background: "white",
      borderRadius: "12px",
      padding: "24px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
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
        color: color,
      }}>
        {icon || "☰"}
      </div>
      <div>
        <div style={{ fontSize: "13px", color: "#6B7280", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{title}</div>
        <div style={{ fontSize: "32px", fontWeight: "700", color: "#4B5563" }}>{value}</div>
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

  const defaultColors = ["#B8A7E5", "#10B981", "#7DD3C0", "#F59E0B", "#EF4444", "#6750A4"];
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
            <span style={{ fontSize: "13px", color: "#4B5563" }}>
              {item.tier || item.phase}: <strong>{item.count}</strong>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CircularProgress({ value, max, size = 80, color = "#7DD3C0", label }) {
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
        <text x="40" y="45" textAnchor="middle" fontSize="14" fontWeight="700" fill="#4B5563">
          {value}
        </text>
      </svg>
      {label && <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "4px" }}>{label}</div>}
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
        background: configured ? "#10B981" : "#EF4444",
      }} />
      <span style={{ fontSize: "14px", color: "#4B5563" }}>{label}</span>
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
      borderRadius: "12px",
    }}>
      <div style={{
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        background: configured ? "#10B981" : "#EF4444",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontSize: "18px",
      }}>
        {configured ? "✓" : "✕"}
      </div>
      <span style={{ fontSize: "13px", color: "#4B5563", fontWeight: "500" }}>{label}</span>
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
      <span style={{ fontSize: "14px", fontWeight: "500", color: "#4B5563" }}>{label}</span>
      <span style={{
        fontSize: "13px",
        color: status === undefined ? "#6B7280" : status ? "#10B981" : "#EF4444",
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
  color: "#4B5563",
};

const tdStyle = {
  padding: "12px 8px",
  color: "#4B5563",
};

const actionBtnStyle = {
  background: "none",
  border: "none",
  color: "#7DD3C0",
  cursor: "pointer",
  padding: "4px 8px",
  fontSize: "13px",
  fontWeight: "600",
};
