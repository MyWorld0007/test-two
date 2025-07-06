import type { SVGProps } from 'react';

export function AppIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 80"
      {...props}
    >
      <defs>
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2AF598" />
          <stop offset="100%" stopColor="#009EFD" />
        </linearGradient>
      </defs>
      <g id="wing">
        <path d="M90 50 L70 55 L73 65 L93 60 Z" fill="url(#logo-gradient)"/>
        <path d="M82 37 L62 42 L65 52 L85 47 Z" fill="url(#logo-gradient)"/>
        <path d="M74 24 L54 29 L57 39 L77 34 Z" fill="url(#logo-gradient)"/>
        <path d="M66 11 L46 16 L49 26 L69 21 Z" fill="url(#logo-gradient)"/>
        <path d="M58 -2 L38 3 L41 13 L61 8 Z" fill="url(#logo-gradient)"/>
      </g>
      <use href="#wing" transform="translate(200, 0) scale(-1, 1)" />
    </svg>
  );
}
