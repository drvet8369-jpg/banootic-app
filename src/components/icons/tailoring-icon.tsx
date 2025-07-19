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
    <path d="M7.7 7.7a3 3 0 1 0-4.24 4.24l9.66 9.66l4.24-4.24L7.7 7.7Z" />
    <path d="m12 6 6-6" />
    <path d="m14 8 4-4" />
    <path d="m6 12-6 6" />
    <path d="m8 14-4 4" />
    <path d="M18.4 2.6a3 3 0 1 0-4.24 4.24l4.24-4.24Z" />
  </svg>
);
export default TailoringIcon;
