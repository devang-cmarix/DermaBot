import React from 'react';
import { C } from '../constants/constants';
import Badge from './Badge';

function Topbar({ title, subtitle }) {
  return (
    <div
      style={{
        height: 70,
        borderBottom: `1px solid ${C.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        background: C.surface,
      }}
    >
      <div>
        <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 18 }}>{title}</div>
        <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>{subtitle}</div>
      </div>
      <Badge color={C.green}>Logged in</Badge>
    </div>
  );
}

export default Topbar;