import React from 'react';
import { C } from '../constants/constants';

const InputField = ({ label, type = "text", value, onChange, placeholder }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.textMuted, marginBottom: 8 }}>
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%",
        padding: "14px 16px",
        borderRadius: 16,
        border: `1px solid ${C.border}`,
        background: C.surface,
        color: C.text,
        fontSize: 16,
        outline: "none",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
      }}
      onFocus={(e) => {
        e.target.style.borderColor = C.accent;
        e.target.style.boxShadow = `0 0 0 4px ${C.accentGlow}`;
      }}
      onBlur={(e) => {
        e.target.style.borderColor = C.border;
        e.target.style.boxShadow = "none";
      }}
    />
  </div>
);

export default InputField;
