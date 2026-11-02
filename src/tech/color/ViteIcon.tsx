import type { SVGProps } from "react";

export type ViteIconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export function ViteIcon({ size = 24, ...props }: ViteIconProps) {
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
      <path fill="#006bff" d="M128 3.83 48.72 22.547 36.977 124.17ZM39.464 24.264 0 33.167l35.658 90.604Z"/>
    </svg>
  );
}
