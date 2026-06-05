import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { useTheme } from "../context/ThemeContext";
import API from "../api/axios";
import { Trash2 } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { FaChartBar, FaDatabase, FaUsers } from "react-icons/fa";

export default function Analytics() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await API.get("/tenant/analytics");
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this query from history?")) return;
    try {
      await API.delete(`/tenant/analytics/${id}`);
      // Remove from local state
      setData((prev) => ({
        ...prev,
        recent: prev.recent.filter((q) => q._id !== id),
        total_queries: prev.total_queries - 1,
      }));
    } catch (e) {
      alert("Failed to delete query");
    }
  };

  const formatTime = (d) => {
    const diff = Math.floor((Date.now() - new Date(d)) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(d).toLocaleDateString();
  };

  const buildChart = (recent = []) => {
    const days = {};
    recent.forEach((q) => {
      const d = new Date(q.asked_at).toLocaleDateString("en", {
        weekday: "short",
      });
      days[d] = (days[d] || 0) + 1;
    });
    return Object.entries(days).map(([name, queries]) => ({ name, queries }));
  };

  const chartData = buildChart(data?.recent || []);

  const card = {
    background: isDark ? "#1a1d27" : "#ffffff",
    border: `1px solid ${isDark ? "#2a2d3a" : "#e5e7eb"}`,
    borderRadius: 14,
    padding: 20,
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
          Analytics
        </h1>
        <p
          style={{
            fontSize: 13,
            color: isDark ? "#6b7280" : "#64748b",
            margin: 0,
          }}
        >
          Usage insights for your knowledge platform
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 14,
          marginBottom: 20,
        }}
      >
        {[
          {
            icon: <FaDatabase style={{color:"#62a1e9",fontSize:'20px',marginBottom:'6px'}}/>,
            label: "Total Queries",
            value: data?.total_queries || 0,
          },
          {
            icon: <FaChartBar style={{color:'green',fontSize:'20px',marginBottom:'6px'}}/>,
            label: "Today",
            value: (data?.recent || []).filter(
              (q) =>
                new Date(q.asked_at).toDateString() ===
                new Date().toDateString(),
            ).length,
          },
          {
            icon: <FaUsers style={{color:'blue',fontSize:'20px',marginBottom:'6px'}}/>,
            label: "Unique Users",
            value: new Set((data?.recent || []).map((q) => q.user_email)).size,
          },
        ].map((s, i) => (
          <div key={i} style={card}>
            <div>{s.icon}</div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: "-1px",
                color: isDark ? "#f0f2f8" : "#0f172a",
                margin: "0 0 4px",
              }}
            >
              {loading ? "..." : s.value}
            </div>
            <div
              style={{
                fontSize: 12,
                color: isDark ? "#6b7280" : "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ ...card, marginBottom: 20 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: isDark ? "#f0f2f8" : "#0f172a",
            marginBottom: 20,
          }}
        >
          Query Activity
        </div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDark ? "#1f2230" : "#f1f5f9"}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke={isDark ? "#6b7280" : "#94a3b8"}
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke={isDark ? "#6b7280" : "#94a3b8"}
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: isDark ? "#1a1d27" : "#fff",
                  border: `1px solid ${isDark ? "#2a2d3a" : "#e5e7eb"}`,
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="queries"
                stroke="#3b82f6"
                fill="url(#cg)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div
            style={{
              height: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: isDark ? "#6b7280" : "#94a3b8",
              fontSize: 13,
            }}
          >
            No data yet. Start chatting!
          </div>
        )}
      </div>

      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: "14px 20px",
            borderBottom: `1px solid ${isDark ? "#2a2d3a" : "#e5e7eb"}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: isDark ? "#f0f2f8" : "#0f172a",
            }}
          >
            Query History
          </span>
          <span style={{ fontSize: 12, color: isDark ? "#6b7280" : "#94a3b8" }}>
            {data?.total_queries || 0} total
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 120px 80px 40px",
            padding: "10px 20px",
            borderBottom: `1px solid ${isDark ? "#2a2d3a" : "#e5e7eb"}`,
          }}
        >
          {["Question", "Asked By", "Time", "Speed", ""].map((h, i) => (
            <div
              key={i}
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: isDark ? "#6b7280" : "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                textAlign: i === 4 ? "right" : "left",
              }}
            >
              {h}
            </div>
          ))}
        </div>

        {loading ? (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: isDark ? "#6b7280" : "#94a3b8",
            }}
          >
            Loading...
          </div>
        ) : (data?.recent || []).length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: isDark ? "#6b7280" : "#94a3b8",
              fontSize: 13,
            }}
          >
            No queries yet.
          </div>
        ) : (
          (data?.recent || []).map((q, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 120px 80px 40px",
                padding: "13px 20px",
                alignItems: "center",
                borderBottom: `1px solid ${isDark ? "#1f2230" : "#f1f5f9"}`,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = isDark
                  ? "#1f2230"
                  : "#f9fafb")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              {/* Question */}
              <div>
                <div
                  style={{
                    fontSize: 13,
                    color: isDark ? "#d1d5db" : "#374151",
                    fontWeight: 500,
                    marginBottom: 3,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: 400,
                  }}
                >
                  {q.question}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: isDark ? "#6b7280" : "#94a3b8",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: 400,
                  }}
                >
                  {q.answer?.slice(0, 60)}...
                </div>
              </div>

              {/* Member name/email */}
              <div
                style={{ fontSize: 12, color: isDark ? "#9ca3af" : "#64748b" }}
              >
                <div
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {q.user_email || q.asked_by || "Unknown"}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: isDark ? "#6b7280" : "#94a3b8",
                    marginTop: 2,
                  }}
                >
                  {q.asked_by}
                </div>
              </div>

              <div
                style={{ fontSize: 12, color: isDark ? "#9ca3af" : "#64748b" }}
              >
                {formatTime(q.asked_at)}
              </div>

              <div
                style={{ fontSize: 12, color: isDark ? "#9ca3af" : "#64748b" }}
              >
                {q.response_time_ms ? `${q.response_time_ms}ms` : "—"}
              </div>

              <div style={{ textAlign: "right" }}>
                <button
                  onClick={() => handleDelete(q._id)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: isDark ? "#4b5563" : "#d1d5d",
                    padding: 4,
                    borderRadius: 6,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#ef4444")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = isDark
                      ? "#4b5563"
                      : "#d1d5d")
                  }
                  title="Delete query"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </Layout>
  );
}
