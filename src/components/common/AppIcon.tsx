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
      />

      {/* Interlocking Hands Shape */}
      <path 
        d="M 40 45 C 30 45 30 55 40 55 L 60 55 C 70 55 70 45 60 45 L 40 45"
        fill="none"
        stroke="hsl(var(--background))"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M 60 55 C 70 55 70 65 60 65 L 40 65 C 30 65 30 55 40 55"
        fill="none"
        stroke="hsl(var(--background))"
        strokeWidth="8"
        strokeLinecap="round"
      />
    </svg>
  );
}
