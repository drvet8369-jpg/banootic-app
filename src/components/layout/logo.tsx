import * as React from 'react';

export function Logo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      aria-label="HonarBanoo Logo"
      role="img"
      {...props}
    >
      {/* Please paste your SVG code here. I will replace this placeholder. */}
      <rect width="100" height="100" rx="20" fill="hsl(var(--primary))" />
      <text
        x="50"
        y="55"
        font-family="sans-serif"
        font-size="50"
        fill="hsl(var(--primary-foreground))"
        text-anchor="middle"
        dominant-baseline="middle"
      >
        H
      </text>
    </svg>
  );
}
