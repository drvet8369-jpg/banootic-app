import type { SVGProps } from 'react';

const HandicraftsIcon = (props: SVGProps<SVGSVGElement>) => (
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
    <path d="M14.5 17.5c2.5-3 2.5-8.5 0-11.5" />
    <path d="M9.5 17.5c-2.5-3-2.5-8.5 0-11.5" />
    <path d="M12 20.5c-4-4.5-4-12.5 0-17" />
    <path d="M12 4.5c4 4.5 4 12.5 0 17" />
    <path d="M4.5 12c-2.5 3-2.5 8.5 0 11.5" />
    <path d="M19.5 12c2.5 3 2.5 8.5 0 11.5" />
  </svg>
);
export default HandicraftsIcon;
