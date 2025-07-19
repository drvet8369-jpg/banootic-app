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
      d="M48,52H16a4,4,0,0,1-4-4V42a4,4,0,0,1,4-4H48a4,4,0,0,1,4,4v6A4,4,0,0,1,48,52Z"
    />
    <path
      fill="#82AAA7"
      stroke="none"
      d="M44,38V22a12,12,0,0,0-24,0V38Z"
    />
    <path
      fill="#82AAA7"
      stroke="none"
      d="M20,22a12,12,0,0,1,24,0,12,12,0,0,0-24,0Z"
    />
    <path
      fill="#E8F8EF"
      stroke="none"
      d="M12,46H52v2a4,4,0,0,1-4,4H16a4,4,0,0,1-4-4Z"
    />
  </svg>
);
export default CookingIcon;
