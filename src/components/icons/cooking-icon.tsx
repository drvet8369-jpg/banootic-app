import type { SVGProps } from 'react';

const CookingIcon = (props: SVGProps<SVGSVGElement>) => (
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
    <path d="M12 2a4 4 0 0 0-4 4v1h8V6a4 4 0 0 0-4-4Z" />
    <path d="M18 7H6a4 4 0 0 0-4 4v5a4 4 0 0 0 4 4h12a4 4 0 0 0 4-4v-5a4 4 0 0 0-4-4Z" />
    <path d="M8 12v3" />
    <path d="M12 12v3" />
    <path d="M16 12v3" />
  </svg>
);
export default CookingIcon;
