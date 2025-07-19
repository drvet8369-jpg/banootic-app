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
    <path d="M2 12h20" />
    <path d="M2 6h20" />
    <path d="M12 2v20" />
    <path d="M18 2a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4v-3" />
    <path d="M6 22a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3" />
  </svg>
);
export default CookingIcon;
