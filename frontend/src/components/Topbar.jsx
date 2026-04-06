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
            ☰
          </button>
        )}
        <div className="topbar-title">
        <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 18 }}>{title}</div>
        <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>{subtitle}</div>
        </div>
      </div>
      {!isMobile && <Badge color={C.green}>Logged in</Badge>}
    </div>
  );
}

export default Topbar;
