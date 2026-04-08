import React from 'react';
import { C, NAV } from '../constants/constants';
import Avatar from './Avatar';

function Sidebar({ page, setPage, collapsed, setCollapsed, user, onLogout, isMobile, mobileOpen, onClose }) {
  const handleNavigate = (nextPage) => {
    setPage(nextPage);
    if (isMobile) {
      onClose?.();
    }
  };

  return (
    <>
      <div
        className={`sidebar-backdrop${mobileOpen ? ' is-open' : ''}`}
        onClick={onClose}
      />
      <aside
        className={`app-sidebar${collapsed ? ' is-collapsed' : ''}${mobileOpen ? ' is-open' : ''}`}
        style={{
          background: 'var(--app-sidebar)',
          borderRight: `1px solid ${C.border}`,
        }}
      >
        <div className="sidebar-scroll">
          <div
            className={`sidebar-brand-card${collapsed ? ' is-collapsed' : ''}`}
            style={{
              border: `1px solid ${C.border}`,
              background: C.card,
            }}
          >
            <div
              className={`sidebar-brand-row${collapsed ? ' is-collapsed' : ''}`}
            >
              <div
                className="sidebar-brand-mark"
                style={{
                  background: `linear-gradient(180deg, ${C.text}, ${C.accent})`,
                }}
              >
                MB
              </div>
              {!collapsed && (
                <div className="sidebar-brand-copy">
                  <div style={{ fontWeight: 800, letterSpacing: -0.3 }}>MediBot</div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>Medical AI workspace</div>
                </div>
              )}
            </div>
            {!collapsed && (
              <div
                className="sidebar-workspace-card"
                style={{ background: C.accentSoft, border: `1px solid ${C.border}` }}
              >
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: C.textMuted }}>WORKSPACE</div>
                <div style={{ marginTop: 6, fontSize: 14, fontWeight: 700 }}>Professional mode</div>
                <div style={{ marginTop: 4, fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
                  Sessions, uploads, and history stay connected for better follow-up analysis.
                </div>
              </div>
            )}
          </div>

          <nav className="sidebar-nav">
            {NAV.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: collapsed ? "center" : "flex-start",
                  gap: 12,
                  padding: collapsed ? "14px 0" : "14px 16px",
                  borderRadius: 18,
                  border: `1px solid ${page === item.id ? `${C.accent}22` : "transparent"}`,
                  cursor: "pointer",
                  background: page === item.id ? C.card : "transparent",
                  color: page === item.id ? C.text : C.textMuted,
                  fontWeight: page === item.id ? 800 : 600,
                }}
              >
                <span style={{
                  minWidth: collapsed ? 32 : 36,
                  height: 32,
                  borderRadius: 10,
                  display: "grid",
                  placeItems: "center",
                  background: page === item.id ? C.accentSoft : "transparent",
                  color: page === item.id ? C.accent : C.textDim,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 0.6,
                }}>{item.icon}</span>
                {!collapsed && item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="sidebar-footer" style={{ borderTop: `1px solid ${C.border}` }}>
          <button
            className="button-ghost"
            onClick={() => {
              if (isMobile) {
                onClose?.();
                return;
              }
              setCollapsed((value) => !value);
            }}
            style={{
              width: "100%",
            }}
          >
            {isMobile ? "Close menu" : collapsed ? "Expand rail" : "Collapse rail"}
          </button>
          <div
            className={`sidebar-user-card${collapsed ? ' is-collapsed' : ''}`}
            style={{ background: C.card, border: `1px solid ${C.border}` }}
          >
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
              className="button-ghost"
              onClick={onLogout}
              style={{
                borderColor: `${C.red}33`,
                background: `${C.red}10`,
                color: C.red,
              }}
            >
              Sign out
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
