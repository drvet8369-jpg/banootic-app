import type { SVGProps } from 'react';

const BeautyIcon = (props: SVGProps<SVGSVGElement>) => (
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
      d="M26.23,17.41,32,11.64l5.77,5.77a4,4,0,0,1,0,5.66L32,28.84,26.23,23.07A4,4,0,0,1,26.23,17.41Z"
    />
    <path
      fill="#82AAA7"
      stroke="none"
      d="M23,26.84V48a3,3,0,0,0,3,3H38a3,3,0,0,0,3-3V26.84Z"
    />
    <line
      x1="23"
      y1="32"
      x2="41"
      y2="32"
      stroke="#E8F8EF"
      strokeWidth="2"
    />
  </svg>
);
export default BeautyIcon;
