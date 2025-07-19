import type { SVGProps } from 'react';

const TailoringIcon = (props: SVGProps<SVGSVGElement>) => (
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
      d="M32.5,42.5 C29.4,42.5 27,40.1 27,37 C27,33.9 29.4,31.5 32.5,31.5 C35.6,31.5 38,33.9 38,37 C38,40.1 35.6,42.5 32.5,42.5" 
      fill="#D6A2A8" 
      stroke="none" 
    />
    <path 
      d="M23,17 C23,13.7 25.7,11 29,11 C32.3,11 35,13.7 35,17 L35,28 C35,30.2 33.2,32 31,32 L27,32 C24.8,32 23,30.2 23,28 L23,17 Z" 
      fill="#82AAA7"
      stroke="none"
    />
    <path
      d="M45,23 C45,21.3 43.7,20 42,20 L35,20 L35,29 C35,30.7 36.3,32 38,32 L42,32 C43.7,32 45,30.7 45,29 L45,23 Z"
      fill="#82AAA7"
      stroke="none"
    />
     <line x1="32" y1="42" x2="32" y2="54" stroke="#D6A2A8" strokeWidth="2.5" />
     <line x1="28" y1="54" x2="36" y2="54" stroke="#D6A2A8" strokeWidth="2.5" />
  </svg>
);
export default TailoringIcon;
