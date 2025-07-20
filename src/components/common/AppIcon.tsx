import type { SVGProps } from 'react';

export function AppIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      {...props}
    >
      <defs>
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#009EFD" />
          <stop offset="100%" stopColor="#2AF598" />
        </linearGradient>
      </defs>
      
      {/* Medical Cross Background */}
      <path 
        d="M35 10 H65 V35 H90 V65 H65 V90 H35 V65 H10 V35 H35 Z" 
        fill="url(#logo-gradient)" 
        opacity="0.8"
      />

      {/* Interlocking Hands Shape */}
      <path 
        d="M30 50 C 30 35, 40 30, 50 30 C 60 30, 70 35, 70 50 C 70 65, 60 70, 50 70 C 40 70, 30 65, 30 50 Z" 
        fill="none" 
        stroke="url(#logo-gradient)" 
        strokeWidth="10"
      />
       <path 
        d="M50 30 C 40 30, 30 35, 30 50 L 50 50 Z" 
        fill="url(#logo-gradient)"
      />

    </svg>
  );
}
