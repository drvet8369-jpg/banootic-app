import * as React from 'react';

export function Logo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      aria-label="HonarBanoo Logo"
      role="img"
      {...props}
    >
      <g fill="currentColor">
        <path
          d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Z"
          opacity="0.2"
        ></path>
        <path d="M188.42,159.66A48.24,48.24,0,0,0,192,144a48.05,48.05,0,0,0-48-48H121.2L96.69,57.3A8,8,0,0,0,89.2,52H72a8,8,0,0,0-8,8v92a8,8,0,0,0,16,0V79.23l18,30A8,8,0,0,0,104,112h24v24a8,8,0,0,0,16,0V112h24a32,32,0,0,1,28.31,16.31A8,8,0,1,0,188.42,159.66Z"></path>
        <path d="M104,136H88a8,8,0,0,0,0,16h8a24,24,0,1,1,22.62,36.74A8,8,0,1,0,104.74,174A40,40,0,1,0,104,136Z"></path>
      </g>
    </svg>
  );
}
