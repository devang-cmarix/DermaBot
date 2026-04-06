import React from 'react';
import { C } from '../constants/constants';

const InputField = ({ label, type = "text", value, onChange, placeholder }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 8 }}>
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
        borderRadius: 12,
        border: `1.5px solid ${C.border}`,
        background: C.surface,
        color: C.text,
        fontSize: 16,
        outline: "none",
        transition: "border-color 0.2s ease",
      }}
      onFocus={(e) => (e.target.style.borderColor = C.accent)}
      onBlur={(e) => (e.target.style.borderColor = C.border)}
    />
  </div>
);

export default InputField;