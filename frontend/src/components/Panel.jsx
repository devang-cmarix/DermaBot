import React from 'react';
import { C } from '../constants/constants';

function Panel({ title, subtitle, children }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 24, padding: 28, display: "flex", flexDirection: "column", gap: 16, boxShadow: "0 16px 40px rgba(17, 23, 20, 0.05)" }}>
      <div>
        <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: -0.2 }}>{title}</div>
        <div style={{ color: C.textMuted, fontSize: 13, marginTop: 6, maxWidth: 720 }}>{subtitle}</div>
      </div>
      {children}
    </div>
  );
}

export default Panel;
