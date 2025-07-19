import * as React from 'react';

export function Logo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      aria-label="HonarBanoo Logo"
      role="img"
      {...props}
    >
      <g fill="currentColor">
        <rect width="256" height="256" fill="none" />
        <path d="M88,144H168a40,40,0,0,0,0-80H88a40,40,0,0,0,0,80Z" opacity="0.2" />
        <path d="M168,56H88a48,48,0,0,0,0,96H168a48,48,0,0,0,0-96Zm0,80H88a32,32,0,0,1,0-64H168a32,32,0,0,1,0,64Z" />
        <path d="M128,152a40,40,0,1,0,40,40A40,40,0,0,0,128,152Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,216Z" />
      </g>
    </svg>
  );
}
