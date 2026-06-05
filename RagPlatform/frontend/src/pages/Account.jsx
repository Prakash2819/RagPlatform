import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import API from "../api/axios";
import { Eye, EyeOff, Copy, RefreshCw, X, AlertTriangle } from "lucide-react";
import { FaBuilding, FaKey, FaLock, FaRobot } from "react-icons/fa";

const API_KEY_STORAGE = "rag_api_key";

export default function Account() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState("");
  const [keyActive, setKeyActive] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [botForm, setBotForm] = useState({ name: "", system_prompt: "" });
  const [botLoading, setBotLoading] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  useEffect(() => {
    fetchTenant();
    // Load saved API key from localStorage
    const savedKey = localStorage.getItem(
      `${API_KEY_STORAGE}_${user?.tenant_id}`,
    );
    if (savedKey) {
      setApiKey(savedKey);
      setKeyActive(true);
    }
  }, []);

  const fetchTenant = async () => {
    try {
      const res = await API.get("/tenant/info");
      setTenant(res.data);
      setBotForm({
        name: res.data.chatbot?.name || "",
        system_prompt: res.data.chatbot?.system_prompt || "",
      });
      // Check if API key is active
      setKeyActive(res.data.api_key_active || false);
      // key revoke
      if (!res.data.api_key_active) {
        localStorage.removeItem(`${API_KEY_STORAGE}_${user?.tenant_id}`);
        setApiKey("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 5000);
  };

  const generateApiKey = async () => {
    try {
      const res = await API.post("/tenant/apikey/generate");
      const key = res.data.api_key;
      setApiKey(key);
      setKeyActive(true);
      setShowKey(true);
      // Save to localStorage
      localStorage.setItem(`${API_KEY_STORAGE}_${user?.tenant_id}`, key);
      showMsg(
        "success",
        "✅ API key generated! Save it — shown here until revoked.",
      );
    } catch (e) {
      showMsg("error", "❌ Failed to generate API key");
    }
  };

  const revokeApiKey = async () => {
    try {
      await API.post("/tenant/apikey/revoke");
      // Remove from localStorage
      localStorage.removeItem(`${API_KEY_STORAGE}_${user?.tenant_id}`);
      setApiKey("");
      setKeyActive(false);
      setShowKey(false);
      setConfirmRevoke(false);
      showMsg("success", "✅ API key revoked. External chatbot disabled.");
    } catch (e) {
      showMsg("error", "❌ Failed to revoke key");
    }
  };

  const updateChatbot = async () => {
    setBotLoading(true);
    try {
      await API.put("/tenant/chatbot/update", botForm);
      showMsg("success", "✅ Chatbot updated!");
    } catch (e) {
      showMsg("error", "❌ Update failed");
    } finally {
      setBotLoading(false);
    }
  };

  const changePassword = async () => {
    if (pwForm.newPw.length < 8) {
      showMsg("error", "❌ Password must be at least 8 characters");
      return;
    }
    if (pwForm.newPw !== pwForm.confirm) {
      showMsg("error", "❌ Passwords do not match");
      return;
    }
    setPwLoading(true);
    try {
      await API.post("/auth/change-password", {
        current_password: pwForm.current,
        new_password: pwForm.newPw,
      });
      showMsg("success", "✅ Password changed!");
      setPwForm({ current: "", newPw: "", confirm: "" });
    } catch (e) {
      showMsg("error", `❌ ${e.response?.data?.detail || "Failed"}`);
    } finally {
      setPwLoading(false);
    }
  };

  const card = {
    background: isDark ? "#1a1d27" : "#ffffff",
    border: `1px solid ${isDark ? "#2a2d3a" : "#e5e7eb"}`,
    borderRadius: 14,
    padding: 24,
    marginBottom: 16,
  };

  const inputStyle = {
    width: "100%",
    padding: "11px 14px",
    borderRadius: 9,
    border: `1.5px solid ${isDark ? "#2a2d3a" : "#e5e7eb"}`,
    background: isDark ? "#252840" : "#f8fafc",
    color: isDark ? "#f0f2f8" : "#0f172a",
    fontSize: 14,
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: isDark ? "#9ca3af" : "#374151",
    marginBottom: 6,
  };

  return (
    <Layout>
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            margin: "0 0 4px",
            color: isDark ? "#f0f2f8" : "#0f172a",
          }}
        >
          Account
        </h1>
        <p
          style={{
            fontSize: 13,
            color: isDark ? "#6b7280" : "#64748b",
            margin: 0,
          }}
        >
          Manage your organization settings
        </p>
      </div>

      {msg.text && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            marginBottom: 16,
            fontSize: 13,
            fontWeight: 500,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background:
              msg.type === "success"
                ? "rgba(34,197,94,0.1)"
                : "rgba(239,68,68,0.1)",
            color: msg.type === "success" ? "#22c55e" : "#ef4444",
            border: `1px solid ${
              msg.type === "success"
                ? "rgba(34,197,94,0.2)"
                : "rgba(239,68,68,0.2)"
            }`,
          }}
        >
          {msg.text}
          <button
            onClick={() => setMsg({ type: "", text: "" })}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "inherit",
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={card}>
          <h2
            style={{
              fontSize: 15,
              fontWeight: 700,
              margin: "0 0 20px",
              color: isDark ? "#f0f2f8" : "#0f172a",
            }}
          >
            <FaBuilding/> Organization Info
          </h2>
          {loading ? (
            <p style={{ color: isDark ? "#6b7280" : "#94a3b8", fontSize: 13 }}>
              Loading...
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Company Name", value: tenant?.name },
                { label: "Domain", value: tenant?.domain },
                { label: "Plan", value: tenant?.plan },
                { label: "Admin Email", value: user?.email },
                {
                  label: "Company Code",
                  value: tenant?.company_code,
                  hint: "Share with employees to join",
                },
              ].map((row, i) => (
                <div key={i}>
                  <div
                    style={{
                      fontSize: 12,
                      color: isDark ? "#6b7280" : "#94a3b8",
                      marginBottom: 3,
                    }}
                  >
                    {row.label}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: isDark ? "#d1d5db" : "#374151",
                    }}
                  >
                    {row.value}
                  </div>
                  {row.hint && (
                    <div
                      style={{ fontSize: 11, color: "#3b82f6", marginTop: 2 }}
                    >
                      {row.hint}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={card}>
          <h2
            style={{
              fontSize: 15,
              fontWeight: 700,
              margin: "0 0 6px",
              color: isDark ? "#f0f2f8" : "#0f172a",
            }}
          >
            <FaKey/> API Key
          </h2>
          <p
            style={{
              fontSize: 12,
              color: isDark ? "#6b7280" : "#94a3b8",
              margin: "0 0 16px",
              lineHeight: 1.6,
            }}
          >
            Embed your chatbot on any website using this key.
          </p>

          {/* Key Status */}
          {keyActive && apiKey ? (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "11px 14px",
                  background: isDark ? "#252840" : "#f8fafc",
                  border: `1px solid ${isDark ? "#2a2d3a" : "#e5e7eb"}`,
                  borderRadius: 9,
                  marginBottom: 8,
                }}
              >
                <code
                  style={{
                    flex: 1,
                    fontSize: 12,
                    fontFamily: "monospace",
                    color: isDark ? "#d1d5db" : "#374151",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {showKey ? apiKey : "•".repeat(44)}
                </code>
                <button
                  onClick={() => setShowKey(!showKey)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: isDark ? "#6b7280" : "#94a3b8",
                    padding: 4,
                  }}
                >
                  {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(apiKey);
                    showMsg("success", "✅ API key copied!");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#3b82f6",
                    padding: 4,
                  }}
                >
                  <Copy size={15} />
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#22c55e",
                    animation: "pulse 2s infinite",
                  }}
                />
                <span style={{ fontSize: 12, color: "#22c55e" }}>
                  API key is active
                </span>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: isDark ? "#9ca3af" : "#64748b",
                    marginBottom: 6,
                  }}
                >
                  Embed on your website:
                </div>
                <pre
                  style={{
                    background: isDark ? "#0f1117" : "#f1f5f9",
                    padding: 12,
                    borderRadius: 8,
                    fontSize: 11,
                    overflow: "auto",
                    margin: 0,
                    fontFamily: "monospace",
                    color: isDark ? "#d1d5db" : "#374151",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                  }}
                >
                  {`<script>
window.ChatbotConfig={apiKey:"${apiKey}"};
</script>
<script src="https://yourplatform.com/widget.js"></script>`}
                </pre>
              </div>

              {!confirmRevoke ? (
                <button
                  onClick={() => setConfirmRevoke(true)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: 9,
                    border: `1px solid ${isDark ? "#3f1a1a" : "#fecaca"}`,
                    background: isDark ? "rgba(239,68,68,0.08)" : "#fff5f5",
                    color: "#ef4444",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <AlertTriangle size={14} />
                  Revoke API Key
                </button>
              ) : (
                <div
                  style={{
                    background: isDark ? "rgba(239,68,68,0.08)" : "#fff5f5",
                    border: `1px solid ${isDark ? "#3f1a1a" : "#fecaca"}`,
                    borderRadius: 9,
                    padding: 14,
                  }}
                >
                  <p
                    style={{
                      fontSize: 13,
                      color: "#ef4444",
                      margin: "0 0 12px",
                      fontWeight: 500,
                    }}
                  >
                    ⚠️ Revoking will break any website using this key. Are you
                    sure?
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => setConfirmRevoke(false)}
                      style={{
                        flex: 1,
                        padding: "9px",
                        borderRadius: 8,
                        border: `1px solid ${isDark ? "#2a2d3a" : "#e5e7eb"}`,
                        background: "transparent",
                        color: isDark ? "#d1d5db" : "#374151",
                        cursor: "pointer",
                        fontSize: 13,
                        fontFamily: "inherit",
                        fontWeight: 600,
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={revokeApiKey}
                      style={{
                        flex: 1,
                        padding: "9px",
                        borderRadius: 8,
                        border: "none",
                        background: "#ef4444",
                        color: "#fff",
                        cursor: "pointer",
                        fontSize: 13,
                        fontFamily: "inherit",
                        fontWeight: 600,
                      }}
                    >
                      Yes, Revoke
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div
                style={{
                  padding: "24px 16px",
                  textAlign: "center",
                  background: isDark ? "#252840" : "#f8fafc",
                  borderRadius: 9,
                  marginBottom: 16,
                  border: `2px dashed ${isDark ? "#2a2d3a" : "#e5e7eb"}`,
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>🔐</div>
                <div
                  style={{
                    fontSize: 13,
                    color: isDark ? "#6b7280" : "#94a3b8",
                  }}
                >
                  No active API key. Generate one to embed your chatbot.
                </div>
              </div>
              <button
                onClick={generateApiKey}
                style={{
                  width: "100%",
                  padding: "11px",
                  borderRadius: 9,
                  border: "none",
                  background: "#2563eb",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <RefreshCw size={14} />
                Generate API Key
              </button>
            </>
          )}
        </div>

        <div style={card}>
          <h2
            style={{
              fontSize: 15,
              fontWeight: 700,
              margin: "0 0 20px",
              color: isDark ? "#f0f2f8" : "#0f172a",
            }}
          >
            <FaRobot style={{fontSize:"16px"}}/> Chatbot Settings
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={labelStyle}>Chatbot Name</label>
              <input
                value={botForm.name}
                onChange={(e) =>
                  setBotForm({ ...botForm, name: e.target.value })
                }
                placeholder="My Assistant"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Personality / System Prompt</label>
              <textarea
                value={botForm.system_prompt}
                onChange={(e) =>
                  setBotForm({ ...botForm, system_prompt: e.target.value })
                }
                placeholder="You are a helpful assistant..."
                style={{ ...inputStyle, height: 100, resize: "vertical" }}
              />
            </div>
            <button
              onClick={updateChatbot}
              disabled={botLoading}
              style={{
                padding: "11px",
                borderRadius: 9,
                border: "none",
                background: "#2563eb",
                color: "#fff",
                cursor: botLoading ? "not-allowed" : "pointer",
                fontSize: 14,
                fontWeight: 600,
                fontFamily: "inherit",
                opacity: botLoading ? 0.7 : 1,
              }}
            >
              {botLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        <div style={card}>
          <h2
            style={{
              fontSize: 15,
              fontWeight: 700,
              margin: "0 0 20px",
              color: isDark ? "#f0f2f8" : "#0f172a",
            }}
          >
            <FaLock/> Change Password
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {["current", "newPw", "confirm"].map((field, i) => (
              <div key={i}>
                <label style={labelStyle}>
                  {field === "current"
                    ? "Current Password"
                    : field === "newPw"
                      ? "New Password"
                      : "Confirm New Password"}
                </label>
                <input
                  type="password"
                  value={pwForm[field]}
                  onChange={(e) =>
                    setPwForm({ ...pwForm, [field]: e.target.value })
                  }
                  placeholder="••••••••"
                  style={inputStyle}
                />
              </div>
            ))}
            <button
              onClick={changePassword}
              disabled={pwLoading}
              style={{
                padding: "11px",
                borderRadius: 9,
                border: "none",
                background: "#2563eb",
                color: "#fff",
                cursor: pwLoading ? "not-allowed" : "pointer",
                fontSize: 14,
                fontWeight: 600,
                fontFamily: "inherit",
                opacity: pwLoading ? 0.7 : 1,
              }}
            >
              {pwLoading ? "Changing..." : "Change Password"}
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </Layout>
  );
}
