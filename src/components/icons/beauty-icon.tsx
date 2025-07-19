import type { SVGProps } from 'react';

const BeautyIcon = (props: SVGProps<SVGSVGElement>) => (
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
    <path d="M12 2a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z" />
    <path d="M6 7v1a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7" />
    <path d="M6 10v1a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1" />
    <path d="M6.1 14.1a2 2 0 0 0-1.8 2.2 2 2 0 0 0 2.2 1.8l8.4-2.5a2 2 0 0 0 1.8-2.2 2 2 0 0 0-2.2-1.8Z" />
    <path d="m20 18-3-3" />
  </svg>
);
export default BeautyIcon;
