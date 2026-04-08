import React from 'react';
import { C } from '../constants/constants';

const Badge = ({ children, color = C.accent }) => (
  <span
    style={{
      background: `${color}14`,
      color,
      border: `1px solid ${color}2f`,
      borderRadius: 999,
      padding: "6px 11px",
      fontSize: 11,
      fontWeight: 800,
      letterSpacing: 0.45,
    }}
  >
    {children}
  </span>
);

export default Badge;
