import * as React from 'react';

// منتظر دریافت کد SVG از شما هستم تا در اینجا جایگزین کنم.
// Please paste your SVG code here.
export function Logo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="HonarBanoo Logo"
      role="img"
      {...props}
    >
      {/* The user's SVG path will be inserted here. */}
    </svg>
  );
}
