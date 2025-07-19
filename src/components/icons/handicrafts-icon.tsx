import type { SVGProps } from 'react';

const HandicraftsIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="m14 6-4.5 4.5" />
    <path d="M10 10.5 6 15" />
    <path d="M18 10c-2 0-4-1-4-4 0-2 2-2.5 4-2.5s4 .5 4 2.5c0 3-2 4-4 4Z" />
    <path d="M15 11c-1 0-2 1-2 2s1 2.5 2 2.5 2-1.5 2-2.5-1-2-2-2Z" />
    <path d="M3.5 20.5c0-3 2-4 4-4h1" />
    <path d="M4 16.5c0-2 2-3 4-3h.5" />
    <path d="M17.5 13.5c2 0 4 1 4 4s-2 4.5-4 4.5-4-1.5-4-4.5 2-4 4-4Z" />
  </svg>
);
export default HandicraftsIcon;
