import type { SVGProps } from "react";

/** Props that every icon component accepts. */
export type IconProps = SVGProps<SVGSVGElement> & {
  /** Width and height of the icon in pixels. @default 24 */
  size?: number;
};
