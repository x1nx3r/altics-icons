import type { SVGProps } from "react";

export type VercelIconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export function VercelIcon({ size = 24, ...props }: VercelIconProps) {
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
      <path d="M64.002 8.576 128 119.424H0Zm0 0"/>
    </svg>
  );
}
