import type { SVGProps } from 'react';

const HandicraftsIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 64 64"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path
      d="M39.6,22.4a4,4,0,0,1-4-4V12a4,4,0,0,0-8,0v6.4a4,4,0,0,1-4,4"
      stroke="#D6A2A8"
      strokeWidth="4"
    />
    <path
      fill="#D6A2A8"
      stroke="none"
      d="M20,28.8,16,52H48L44,28.8a4,4,0,0,0-4-4H24A4,4,0,0,0,20,28.8Z"
    />
  </svg>
);
export default HandicraftsIcon;
