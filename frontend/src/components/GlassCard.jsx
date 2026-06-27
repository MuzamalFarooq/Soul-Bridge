import React from 'react';

const GlassCard = ({ children, className = '', glow = false }) => {
  return (
    <div
      className={`glass rounded-2xl transition-all duration-300 p-6 ${
        glow
          ? 'shadow-[0_0_25px_rgba(236,72,153,0.18)] hover:shadow-[0_0_35px_rgba(236,72,153,0.3)] border-pink-300/30'
          : 'shadow-lg hover:shadow-xl'
      } ${className}`}
    >
      {children}
    </div>
  );
};

export default GlassCard;
