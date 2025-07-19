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
    {/* Hand */}
    <path 
      d="M48,30c0-6.6-5.4-12-12-12h-4c-2.2,0-4,1.8-4,4v14c0,1.1,0.9,2,2,2h4c1.1,0,2-0.9,2-2v-4h2 c2.2,0,4,1.8,4,4s-1.8,4-4,4h-2" 
      stroke="#D6A2A8" 
      strokeWidth="2.5"
      fill="none"
    />
    {/* Fingers */}
    <path d="M26,26h-2c-1.1,0-2-0.9-2-2v-2c0-1.1,0.9-2,2-2h2" stroke="#D6A2A8" strokeWidth="2.5" fill="none"/>
    <path d="M26,32h-4c-1.1,0-2-0.9-2-2v-2c0-1.1,0.9-2,2-2h4" stroke="#D6A2A8" strokeWidth="2.5" fill="none"/>
    
    {/* Needle and Thread */}
    <path d="M42,20 L54,8" stroke="#82AAA7" strokeWidth="2" fill="none" />
    <path d="M52,10 a2,2 0 1,1 -4,4" stroke="#82AAA7" strokeWidth="2" fill="none" />
    <path d="M46,24 C50,28 52,34 50,40 C48,46 42,50 36,48" stroke="#82AAA7" strokeWidth="2" fill="none" strokeDasharray="4 4" />
  </svg>
);
export default TailoringIcon;
