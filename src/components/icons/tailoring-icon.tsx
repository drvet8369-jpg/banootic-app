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
    <g transform="rotate(25, 32, 32)">
      <path
        fill="#82AAA7"
        stroke="none"
        d="M21.2,16.8a5,5,0,1,1-7.1,7.1L28.8,38.6,43,24.4,21.2,16.8Z"
      />
      <path
        fill="#82AAA7"
        stroke="none"
        d="M21.2,47.2a5,5,0,1,0-7.1-7.1L28.8,25.4,43,39.6,21.2,47.2Z"
      />
      <circle cx="16.8" cy="21.2" r="6" fill="#E8F8EF" stroke="none" />
      <circle cx="16.8" cy="42.8" r="6" fill="#E8F8EF" stroke="none" />
    </g>
    <path
      fill="#D6A2A8"
      stroke="none"
      d="M54,42a8,8,0,0,1-16,0,8,8,0,0,0-16,0,8,8,0,0,1-16,0V50a2,2,0,0,0,2,2H52a2,2,0,0,0,2-2V42Z"
    />
    <line x1="42" y1="42" x2="42" y2="52" stroke="#E8F8EF" strokeWidth="2" />
    <line x1="34" y1="46" x2="34" y2="52" stroke="#E8F8EF" strokeWidth="2" />
    <line x1="26" y1="42" x2="26" y2="52" stroke="#E8F8EF" strokeWidth="2" />
    <line x1="18" y1="46" x2="18" y2="52" stroke="#E8F8EF" strokeWidth="2" />
    <line x1="50" y1="46" x2="50" y2="52" stroke="#E8F8EF" strokeWidth="2" />
  </svg>
);
export default TailoringIcon;
