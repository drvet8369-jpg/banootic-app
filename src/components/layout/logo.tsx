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
        <path
          d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24Zm0 192a88 88 0 1 1 88-88a88.1 88.1 0 0 1-88 88Z"
          opacity=".2"
        />
        <path d="M168,88H88a48.05,48.05,0,0,0-48,48v2a8,8,0,0,0,16,0v-2a32,32,0,0,1,32-32h80a32,32,0,0,1,32,32v2a8,8,0,0,0,16,0v-2A48.05,48.05,0,0,0,168,88Z" />
        <path d="M128,152a40,40,0,1,0-40-40A40,40,0,0,0,128,152Zm0-64a24,24,0,1,1-24,24A24,24,0,0,1,128,88Z" />
      </g>
    </svg>
  );
}
