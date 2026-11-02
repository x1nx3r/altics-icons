# Altics Icons

React icon components for Altics UI. The package contains 1,311 UI icons and 298 tech icons. Each icon is a typed SVG component with a `size` prop. The package supports tree shaking and per-icon imports.

## Install

```bash
npm install @altics/icons
```

React 18 or later is a peer dependency.

## UI icons

```tsx
import { ActivityIcon, SearchIcon } from "@altics/icons";

export function Toolbar() {
  return (
    <div className="flex items-center gap-2 text-slate-700">
      <ActivityIcon />
      <SearchIcon size={20} className="text-blue-600" />
    </div>
  );
}
```

## Tech icons

The tech set has 152 monochrome icons and 146 full-color icons. It covers languages, frameworks, databases, cloud services, and developer tools. The source list is in `tool/tech-icons.json`.

Monochrome icons use `currentColor`. Color icons keep the official brand colors.

```tsx
import { DockerIcon, JavaScriptIcon } from "@altics/icons/tech";
import {
  DockerIcon as DockerColorIcon,
  JavaScriptIcon as JavaScriptColorIcon,
} from "@altics/icons/tech/color";

export function Stack() {
  return (
    <div className="flex items-center gap-3">
      <JavaScriptIcon size={32} className="text-yellow-500" />
      <DockerColorIcon size={32} />
      <JavaScriptColorIcon size={32} />
    </div>
  );
}
```

Use a per-icon import to load one module:

```tsx
import { JavaScriptIcon } from "@altics/icons/tech/JavaScriptIcon";
import { ReactIcon } from "@altics/icons/tech/color/ReactIcon";
```

## Props

Each icon accepts all `SVGProps<SVGSVGElement>` and these props:

| Prop   | Type     | Default | Description                   |
| ------ | -------- | ------- | ----------------------------- |
| `size` | `number` | `24`    | Width and height in pixels.   |

UI and monochrome tech icons use `currentColor`. Set the color with the CSS `color` property. Color tech icons keep their source colors. You can still override width, height, and other SVG props.

## Imports and tree shaking

Named imports from each entry are tree-shakeable. The package sets `sideEffects` to `false`. To limit the module graph to one icon, use a subpath import:

```tsx
import { ActivityIcon } from "@altics/icons/icons/ActivityIcon";
import { JavaScriptIcon } from "@altics/icons/tech/JavaScriptIcon";
import { ReactIcon } from "@altics/icons/tech/color/ReactIcon";
```

## CommonJS

```js
const { ActivityIcon } = require("@altics/icons");
const { JavaScriptIcon } = require("@altics/icons/tech");
const { ReactIcon } = require("@altics/icons/tech/color");
```

## Development

```bash
npm install
npm run fetch:tech  # Rebuild icons/tech from simple-icons and devicon
npm run generate    # icons/**/*.svg -> src/icons and src/tech/*
npm run build       # dist/esm, dist/cjs, dist/types
npm test            # Build and run the smoke test for all icons
npm pack --dry-run
```

## Add an icon

### UI icon

1. Put an SVG file in `icons/`. Use a 24x24 viewBox and `currentColor` for the fill or stroke.
2. Run `npm run generate`.
3. Run `npm test`.

### Tech icon

1. Add an entry to `tool/tech-icons.json` with `name`, `category`, `mono`, and `color`.
2. Run `npm run fetch:tech`.
3. Run `npm test`.

Do not edit the files in `src/icons` or `src/tech` by hand. The generator deletes files that have no source SVG.

## Licenses and trademarks

The UI icons are part of this MIT-licensed package. The tech icons come from [Simple Icons](https://simpleicons.org) (CC0-1.0) and [Devicon](https://devicon.dev) (MIT). See `THIRD_PARTY_LICENSES.md`.

Brand names and logos are trademarks of their owners. The licenses cover the SVG files. They do not grant trademark rights. You are responsible for compliance with each brand's usage guidelines.

## License

MIT
