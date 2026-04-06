import React from 'react';
import { C } from '../constants/constants';

const Avatar = ({ name, size = 32, color = C.accent }) => {
  const letter = name?.trim()?.charAt(0)?.toUpperCase() || "U";

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${color}33, ${color}66)`,
        border: `1.5px solid ${color}55`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.38,
        fontWeight: 700,
        color,
        flexShrink: 0,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {letter}
    </div>
  );
};

export default Avatar;