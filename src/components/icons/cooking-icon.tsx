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
      fill="#82AAA7"
      stroke="none"
      d="M32 12C21.5 12 18 18 18 24h28c0-6-3.5-12-14-12z"
    />
    <path
      fill="#82AAA7"
      stroke="none"
      d="M16 48V28a2 2 0 012-2h28a2 2 0 012 2v20a4 4 0 01-4 4H20a4 4 0 01-4-4z"
    />
     <path
      fill="#E8F8EF"
      stroke="none"
      d="M16 44h32v4a4 4 0 01-4 4H20a4 4 0 01-4-4v-4z"
    />
  </svg>
);
export default CookingIcon;
