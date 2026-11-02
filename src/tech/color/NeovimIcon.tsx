import type { SVGProps } from "react";

export type NeovimIconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export function NeovimIcon({ size = 24, ...props }: NeovimIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <defs> <linearGradient id="NeovimIcon-a" x1="0.5" x2="0.5" y1="0" y2="1" gradientTransform="matrix(32.95703 0 0 154.72266 .426 .426)" gradientUnits="userSpaceOnUse"> <stop offset="0" stopColor="#16b0ed" stopOpacity=".8" /> <stop offset="1" stopColor="#0f59b2" stopOpacity=".835294" /> </linearGradient> <linearGradient id="NeovimIcon-b" x1="0.5" x2="0.5" y1="0" y2="1" gradientTransform="matrix(-33.59375 0 0 154.72266 128 .426)" gradientUnits="userSpaceOnUse"> <stop offset="0" stopColor="#7db643" /> <stop offset="1" stopColor="#367533" /> </linearGradient> <linearGradient id="NeovimIcon-c" x1="0.5" x2="0.5" y1="0" y2="1" gradientTransform="matrix(109.71484 0 0 154.72656 9.355 .637)" gradientUnits="userSpaceOnUse"> <stop offset="0" stopColor="#88c649" stopOpacity=".8" /> <stop offset="1" stopColor="#439240" stopOpacity=".839216" /> </linearGradient> </defs> <g fillRule="evenodd"> <path fill="url(#NeovimIcon-a)" d="M.426 33.703 33.383.426v154.722L.426 122.258Zm0 0" transform="translate(10.95 -.352) scale(.82614)" /> <path fill="url(#NeovimIcon-b)" d="M127.773 34 94.406.426l.676 154.722L128 122.254Zm0 0" transform="translate(10.95 -.352) scale(.82614)" /> <path fill="url(#NeovimIcon-c)" d="m33.379.637 85.691 130.75-23.98 23.976L9.355 24.903Zm0 0" transform="translate(10.95 -.352) scale(.82614)" /> <path fillOpacity="0.129412" d="m38.53 50.01-.04 4.244-21.743-32.18 2.014-2.06zm0 0" /> </g>
    </svg>
  );
}
