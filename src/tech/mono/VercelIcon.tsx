import type { SVGProps } from "react";

export type VercelIconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export function VercelIcon({ size = 24, ...props }: VercelIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="m12 1.608 12 20.784H0Z"/>
    </svg>
  );
}
