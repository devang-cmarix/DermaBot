import React from 'react';
import { C } from '../constants/constants';

const Badge = ({ children, color = C.accent }) => (
  <span
    style={{
      background: `${color}22`,
      color,
      border: `1px solid ${color}44`,
      borderRadius: 999,
      padding: "4px 10px",
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 0.4,
    }}
  >
    {children}
  </span>
);

export default Badge;