import React, { useState, useEffect } from 'react';
import { C } from '../constants/constants';
import Badge from '../components/Badge';

function HistoryPage({ token }) {
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

    useEffect(() => {
    if (token) {
        fetch("/api/history", {
        headers: { Authorization: `Bearer ${token}` }
        })
        .then((res) => res.json())
        .then((data) => {
            if (Array.isArray(data)) {
            setHistory(data);
            } else if (Array.isArray(data.conversations)) {
            setHistory(data.conversations);
            } else if (Array.isArray(data.history)) {
            setHistory(data.history);
            } else if (Array.isArray(data.data)) {
            setHistory(data.data);
            } else {
            setHistory([]);
            }
            setLoading(false);
        })
        .catch(() => {
            setHistory([]);
            setLoading(false);
        });
    }
    }, [token]);

  const filtered = history.filter((item) =>
    item.q.toLowerCase().includes(search.toLowerCase()) || item.a.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div style={{ padding: 40, color: C.textMuted }}>Loading history...</div>;

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "32px 40px", display: "flex", flexDirection: "column", gap: 18 }}>
      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search your saved questions..."
        style={{
          background: C.card,
          border: `1px solid ${C.borderHi}`,
          borderRadius: 14,
          padding: "13px 16px",
          color: C.text,
          outline: "none",
        }}
      />
      {filtered.map((entry, index) => (
        <div key={`${entry.session_id}-${index}`} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 12 }}>
            <Badge color={C.accent}>{entry.session_title || entry.tag}</Badge>
            <div style={{ fontSize: 12, color: C.textMuted }}>{entry.date}</div>
          </div>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Q: {entry.q}</div>
          <div style={{ color: C.textMuted, lineHeight: 1.7 }}>A: {entry.a || "No answer saved."}</div>
        </div>
      ))}
      {!filtered.length && <div style={{ color: C.textMuted }}>No conversations found for this search.</div>}
    </div>
  );
}

export default HistoryPage;