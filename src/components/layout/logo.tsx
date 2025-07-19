import * as React from 'react';

export function Logo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="200"
      height="200"
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      aria-label="HonarBanoo Logo"
      role="img"
      {...props}
    >
      <path d="M256 0c140.6 0 256 115.4 256 256S396.6 512 256 512 0 396.6 0 256 115.4 0 256 0zm45 390c20-13 37-31 51-53 11-17 16-36 16-55 0-28-9-50-27-67-10-9-21-14-34-16-10-1-20 1-30 5-10 5-20 12-30 22-9-10-18-17-28-22-10-5-20-7-30-6-13 1-24 6-34 15-18 17-27 39-27 67 0 19 5 38 16 55 14 22 31 40 51 53 10 6 21 10 34 10s24-4 34-10z" />
    </svg>
  );
}
