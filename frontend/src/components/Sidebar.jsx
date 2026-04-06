import React from 'react';
import { C, NAV } from '../constants/constants';
import Avatar from './Avatar';

function Sidebar({ page, setPage, collapsed, setCollapsed, user, onLogout }) {
  return (
    <aside
      style={{
        width: collapsed ? 76 : 238,
        flexShrink: 0,
        background: C.surface,
        borderRight: `1px solid ${C.border}`,
        display: "flex",
        flexDirection: "column",
        transition: "width .25s ease",
      }}
    >
      <div
        style={{
          height: 72,
          display: "flex",
          alignItems: "center",
          padding: collapsed ? "0 22px" : "0 20px",
          gap: 12,
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            background: `linear-gradient(135deg, ${C.accent}, #6b5ef7)`,
            display: "grid",
            placeItems: "center",
            animation: "glow 3s ease-in-out infinite",
          }}
        >
          🩺
        </div>
        {!collapsed && <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800 }}>MediBot</div>}
      </div>

      <nav style={{ flex: 1, padding: 10, display: "flex", flexDirection: "column", gap: 5 }}>
        {NAV.map((item) => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
              gap: 12,
              padding: collapsed ? "12px 0" : "12px 14px",
              borderRadius: 12,
              border: "none",
              cursor: "pointer",
              background: page === item.id ? C.accentSoft : "transparent",
              color: page === item.id ? C.accent : C.textMuted,
              fontWeight: page === item.id ? 700 : 500,
            }}
          >
            <span>{item.icon}</span>
            {!collapsed && item.label}
          </button>
        ))}
      </nav>

      <div style={{ padding: 10, borderTop: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          onClick={() => setCollapsed((value) => !value)}
          style={{
            padding: "11px 12px",
            borderRadius: 12,
            border: `1px solid ${C.border}`,
            background: "transparent",
            color: C.textMuted,
            cursor: "pointer",
          }}
        >
          {collapsed ? "→" : "← Collapse"}
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "2px 4px" }}>
          <Avatar name={user?.name || "U"} size={34} color={C.green} />
          {!collapsed && (
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.name}</div>
              <div style={{ fontSize: 12, color: C.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.email}</div>
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={onLogout}
            style={{
              padding: "11px 12px",
              borderRadius: 12,
              border: `1px solid ${C.red}33`,
              background: `${C.red}12`,
              color: C.red,
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Sign out
          </button>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;