import * as React from 'react';

export function Logo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 256 256"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      {...props}
    >
      <path
        d="M128 24C64.3 24 16 72.3 16 136s48.3 112 112 112 112-48.3 112-112S191.7 24 128 24zm0 184c-39.6 0-72-32.4-72-72s32.4-72 72-72 72 32.4 72 72-32.4 72-72 72z"
        opacity="0.2"
      />
      <path
        d="M128 56c-44.1 0-80 35.9-80 80s35.9 80 80 80 80-35.9 80-80-35.9-80-80-80zm0 136c-30.8 0-56-25.2-56-56s25.2-56 56-56 56 25.2 56 56-25.2 56-56 56z"
        opacity="0.5"
      />
      <path
        d="M128 88c-22 0-40 18-40 40s18 40 40 40 40-18 40-40-18-40-40-40zm0 64c-13.2 0-24-10.8-24-24s10.8-24 24-24 24 10.8 24 24-10.8 24-24 24z"
      />
    </svg>
  );
}
