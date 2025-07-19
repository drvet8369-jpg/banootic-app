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
      fill="#D6A2A8"
      stroke="none"
      d="M16,24.5a8,8,0,0,1,8-8h16a8,8,0,0,1,8,8V28h-32Z"
    />
    <path
      fill="#82AAA7"
      stroke="none"
      d="M16,28H48L44,52H20Z"
    />
    <path
      d="M24,16.5a8,8,0,0,1,16,0"
      stroke="#D6A2A8"
      strokeWidth="3"
    />
  </svg>
);
export default HandicraftsIcon;
