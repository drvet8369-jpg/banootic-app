import type { SVGProps } from 'react';

const TailoringIcon = (props: SVGProps<SVGSVGElement>) => (
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
    <circle cx="6" cy="6" r="3" />
    <circle cx="18" cy="6" r="3" />
    <path d="M15.1 8.9 9.1 14.9" />
    <path d="m6 21 6-6" />
    <path d="m18 21-6-6" />
    <path d="M9.1 8.9 14.9 14.9" />
  </svg>
);
export default TailoringIcon;
