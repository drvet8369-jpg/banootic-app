import * as React from 'react';

export function Logo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      aria-label="HonarBanoo Logo"
      role="img"
      {...props}
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="8"
        d="M85.2,196C75,193.3,60.5,185.3,51,173c-15.5-20-8-43.5-3-56.5c4-10.3,13-19.5,23-26
        c9.6-6.2,21.5-9.4,32.7-11.4c1.8-0.3,3.6-0.6,5.3-1c32-6.5,58.8-31,63-63.5c0.3-2.6,0.5-5.2,0.5-7.8c0-10-8.1-18.1-18.1-18.1
        c-2.8,0-5.5,0.6-7.9,1.8c-15.4,7.3-25.2,22.5-27.1,39.3c-0.2,1.8-0.4,3.5-0.6,5.3c-3,22.5-19.7,40.8-41.2,46.5
        c-10.4,2.8-21,2.8-31.3-0.2c-15.3-4.5-27.9-15.8-34.9-30.4c-2.3-4.8-3.9-10-4.6-15.3c-1.8-13,2.5-26,11.5-35.3
        c5.3-5.5,12-9,19.5-10.2"
      />
    </svg>
  );
}
