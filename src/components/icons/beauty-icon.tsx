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
    <path d="M14.5 13.5a2 2 0 0 1-2.8 0l-4.2-4.2a2 2 0 0 1 0-2.8l1.4-1.4a2 2 0 0 1 2.8 0l4.2 4.2" />
    <path d="M12 11.5 8.5 8" />
    <path d="m18 13-1.4-1.4" />
    <path d="M15.5 15.5 14 14" />
    <path d="M2.3 21.7a2.4 2.4 0 0 0 3.4 0L17 10.4a2.4 2.4 0 0 0 0-3.4l-1.3-1.3a2.4 2.4 0 0 0-3.4 0L1 17.1a2.4 2.4 0 0 0 0 3.4Z" />
    <path d="m19 8-2-2" />
  </svg>
);
export default BeautyIcon;
