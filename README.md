# Altics Icons

React icon components for Altics UI. The package contains 1,311 icons. Each icon is a typed SVG component with a `size` prop. The package supports tree shaking and per-icon imports.

## Install

```bash
npm install @altics/icons
```

React 18 or later is a peer dependency.

## Use

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

## Props

Each icon accepts all `SVGProps<SVGSVGElement>` and these props:

| Prop   | Type     | Default | Description                   |
| ------ | -------- | ------- | ----------------------------- |
| `size` | `number` | `24`    | Width and height in pixels.   |

The icons use `currentColor`. Set the color with the CSS `color` property.

## Imports and tree shaking

Named imports from the package root are tree-shakeable. The package sets `sideEffects` to `false`. To limit the module graph to one icon, use a subpath import:

```tsx
import { ActivityIcon } from "@altics/icons/icons/ActivityIcon";
```

## CommonJS

```js
const { ActivityIcon } = require("@altics/icons");
```

## Development

```bash
npm install
npm run generate   # icons/*.svg -> src/icons/*.tsx
npm run build      # dist/esm, dist/cjs, dist/types
npm test           # Build and run the smoke test for all icons
npm pack --dry-run
```

## Add an icon

1. Put an SVG file in `icons/`. Use a 24x24 viewBox and `currentColor` for the fill or stroke.
2. Run `npm run generate`.
3. Run `npm test`.

Do not edit the files in `src/icons` by hand. The generator deletes files that have no source SVG.

## License

MIT
