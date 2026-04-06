import React, { useState, useEffect } from 'react';
import { C } from '../constants/constants';

function AnalyticsPage({ token }) {
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (token) {
      fetch("/api/analytics", { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => res.json())
        .then((data) => setAnalytics(data))
        .catch(() => setError("Failed to load analytics"));
    }
  }, [token]);

  if (error) return <div style={{ padding: 40, color: C.red }}>{error}</div>;

  if (!analytics) return <div style={{ padding: 40, color: C.textMuted }}>Loading analytics...</div>;

  const max = Math.max(...analytics.chart.values, 1);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "32px 40px", display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16 }}>
        {analytics.stats.map((item) => (
          <div key={item.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ color: C.textMuted, fontSize: 13 }}>{item.label}</div>
              <div>{item.icon}</div>
            </div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 28, color: item.color }}>{item.value}</div>
            <div style={{ marginTop: 8, fontSize: 12, color: item.delta > 0 ? C.green : item.delta < 0 ? C.red : C.textMuted }}>
              {item.delta > 0 ? `+${item.delta}% vs previous week` : item.delta < 0 ? `${item.delta}% vs previous week` : "No week-over-week change"}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 20 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 24 }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, marginBottom: 20 }}>Queries This Week</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 180 }}>
            {analytics.chart.values.map((value, index) => (
              <div key={analytics.chart.days[index]} style={{ flex: 1, textAlign: "center" }}>
                <div
                  style={{
                    height: `${(value / max) * 130}px`,
                    borderRadius: "10px 10px 0 0",
                    background: `linear-gradient(180deg, ${C.accent}, ${C.accent}77)`,
                    boxShadow: `0 0 18px ${C.accentGlow}`,
                  }}
                />
                <div style={{ marginTop: 10, color: C.textMuted, fontSize: 12 }}>{analytics.chart.days[index]}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 24 }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, marginBottom: 20 }}>Topic Breakdown</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {analytics.topics.map((topic) => (
              <div key={topic.name}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span>{topic.name}</span>
                  <span style={{ color: topic.color }}>{topic.pct}%</span>
                </div>
                <div style={{ height: 6, background: C.border, borderRadius: 999 }}>
                  <div style={{ width: `${topic.pct}%`, height: "100%", borderRadius: 999, background: topic.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsPage;