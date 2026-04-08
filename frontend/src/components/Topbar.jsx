import React from 'react';
import { C } from '../constants/constants';
import Badge from './Badge';

function Topbar({ title, subtitle, isMobile, onMenuClick }) {
  return (
    <div
      className="topbar"
      style={{ borderBottom: `1px solid ${C.border}`, background: C.surface }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
        {isMobile && (
          <button className="topbar-menu" type="button" onClick={onMenuClick}>
            Menu
          </button>
        )}
        <div className="topbar-title">
        <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: -0.4 }}>{title}</div>
        <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4, maxWidth: 680 }}>{subtitle}</div>
        </div>
      </div>
      {!isMobile && (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Badge color={C.green}>Secure session</Badge>
          <div style={{ fontSize: 12, color: C.textMuted }}>Workspace online</div>
        </div>
      )}
    </div>
  );
}

export default Topbar;
