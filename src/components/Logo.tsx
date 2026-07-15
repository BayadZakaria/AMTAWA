import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-8 h-8" }) => (
  <svg 
    viewBox="0 0 100 100" 
    fill="none" 
    stroke="currentColor" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
  >
    {/* Letter A */}
    <path 
      d="M 28 85 L 50 15 L 72 85" 
      strokeWidth="10" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    
    {/* Stethoscope */}
    <path 
      d="M 90 18 C 90 28, 85 32, 80 38 L 80 50 C 80 58, 75 58, 65 58 L 35 58 C 20 58, 12 62, 12 72 C 12 82, 18 85, 25 85" 
      strokeWidth="5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    <path 
      d="M 70 18 C 70 28, 75 32, 80 38" 
      strokeWidth="5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    
    {/* Earpieces */}
    <circle cx="90" cy="15" r="2.5" fill="currentColor" stroke="none" />
    <circle cx="70" cy="15" r="2.5" fill="currentColor" stroke="none" />
    
    {/* Chest piece */}
    <circle cx="31" cy="85" r="5" strokeWidth="3" />
    <circle cx="31" cy="85" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

