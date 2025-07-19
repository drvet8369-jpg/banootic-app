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
    <path d="M14.5 14.5c2.4-2.4 4.1-4.9 5.2-7.2.2-.5.2-1-.2-1.4l-2.6-2.6c-.4-.4-1-.5-1.4-.2-2.3 1.1-4.8 2.8-7.2 5.2" />
    <path d="m13.5 15.5 -1 1-4 4-1-1 4-4Z" />
    <path d="m3 21 8-8" />
    <path d="m21.5 11.4-2.6 2.6" />
    <path d="M12.6 3.5 10 6.1" />
    <path d="m9.5 13.5 1 1" />
    <path d="m15.5 7.5 1 1" />
  </svg>
);
export default BeautyIcon;
