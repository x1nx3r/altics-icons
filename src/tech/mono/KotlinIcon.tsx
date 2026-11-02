import type { SVGProps } from "react";

export type KotlinIconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export function KotlinIcon({ size = 24, ...props }: KotlinIconProps) {
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
      <path d="M24 24H0V0h24L12 12Z"/>
    </svg>
  );
}
