import React from 'react';
import { C } from '../constants/constants';

function Panel({ title, subtitle, children }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800 }}>{title}</div>
        <div style={{ color: C.textMuted, fontSize: 12, marginTop: 4 }}>{subtitle}</div>
      </div>
      {children}
    </div>
  );
}

export default Panel;