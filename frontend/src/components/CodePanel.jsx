import React from 'react';
import { C } from '../constants/constants';

function CodePanel({ title, color, code }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 24 }}>
      <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, color, marginBottom: 16 }}>{title}</div>
      <pre style={{ background: C.surface, border: `1px solid ${C.borderHi}`, borderRadius: 12, padding: 16, overflowX: "auto", lineHeight: 1.6 }}>
        {code}
      </pre>
    </div>
  );
}

export default CodePanel;