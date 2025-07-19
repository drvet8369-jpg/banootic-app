import type { SVGProps } from 'react';

const CookingIcon = (props: SVGProps<SVGSVGElement>) => (
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
      d="M44,36H20a4,4,0,0,1-4-4V22a4,4,0,0,1,4-4H44a4,4,0,0,1,4,4v10A4,4,0,0,1,44,36Z"
      stroke="#82AAA7"
      strokeWidth="2.5"
    />
    <path
      d="M22,18v-5a10,10,0,0,1,6-9,10,10,0,0,1,8,4,10,10,0,0,1,0,10,10,10,0,0,1-8,4,10,10,0,0,1-6-9Z"
      stroke="#D6A2A8"
      strokeWidth="2.5"
    />
    <line x1="26" y1="24" x2="38" y2="24" stroke="#D6A2A8" strokeWidth="2" />
    <line x1="26" y1="30" x2="38" y2="30" stroke="#D6A2A8" strokeWidth="2" />
  </svg>
);
export default CookingIcon;
