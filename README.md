# @humanspeak/svelte-santori-fix

A tiny, focused utility to make Satori accept dimension values when generating OG images from HTML or rendered Svelte components. It normalizes width/height attributes and inline styles to the numeric types Satori expects.

[![NPM version](https://img.shields.io/npm/v/@humanspeak/svelte-santori-fix.svg)](https://www.npmjs.com/package/@humanspeak/svelte-santori-fix)
[![Downloads](https://img.shields.io/npm/dm/@humanspeak/svelte-santori-fix.svg)](https://www.npmjs.com/package/@humanspeak/svelte-santori-fix)
[![Build Status](https://github.com/humanspeak/svelte-santori-fix/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/humanspeak/svelte-santori-fix/actions/workflows/npm-publish.yml)
[![Coverage Status](https://coveralls.io/repos/github/humanspeak/svelte-santori-fix/badge.svg?branch=main)](https://coveralls.io/github/humanspeak/svelte-santori-fix?branch=main)
[![CodeQL](https://github.com/humanspeak/svelte-santori-fix/actions/workflows/codeql.yml/badge.svg)](https://github.com/humanspeak/svelte-santori-fix/actions/workflows/codeql.yml)
[![Install size](https://packagephobia.com/badge?p=@humanspeak/svelte-santori-fix)](https://packagephobia.com/result?p=@humanspeak/svelte-santori-fix)
[![Code Style: Trunk](https://img.shields.io/badge/code%20style-trunk-blue.svg)](https://trunk.io)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![Types](https://img.shields.io/npm/types/@humanspeak/svelte-santori-fix.svg)](https://www.npmjs.com/package/@humanspeak/svelte-santori-fix)
[![License](https://img.shields.io/npm/l/@humanspeak/svelte-santori-fix.svg)](https://github.com/humanspeak/svelte-santori-fix/blob/main/LICENSE)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/humanspeak/svelte-santori-fix/graphs/commit-activity)

## Features

- **Fixes Satori dimension validation** for `<img>`, `<svg>`, and `<image>` nodes produced by `satori-html`
- **Coerces safe values** like "78" or "78px" to numbers, preserving `auto` and percentages
- **Recursive**, handles nested children and style objects
- **TypeScript-ready** with clear types for the normalized node tree
- **Drop-in utility** to use directly between `toReactNode(...)` and `satori(...)`

## Reference

- Common pattern inspiration: Dynamic OG image with SvelteKit and Satori ([dev.to](https://dev.to/theether0/dynamic-og-image-with-sveltekit-and-satori-4438))

## Installation

```bash
pnpm add @humanspeak/svelte-santori-fix satori satori-html @resvg/resvg-js
# or
npm i -S @humanspeak/svelte-santori-fix satori satori-html @resvg/resvg-js
```

## Basic Usage (HTML → React-like element → Satori)

This mirrors the common Satori flow documented in the reference article.

```ts
// +server.ts (simplified)
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { html as toReactNode } from 'satori-html'

const height = 630
const width = 1200

export const GET = async () => {
	const node = toReactNode('<div style="color:red">Hello</div>')
	const svg = await satori(node, { height, width })
	const image = new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render()
	return new Response(image.asPng(), { headers: { 'content-type': 'image/png' } })
}
```

## Using Svelte components (render) with images may fail in Satori

When rendering a Svelte component (e.g., `OG.svelte`) to HTML, if it contains an `<img>` with `width`/`height` as strings (e.g., "78" or "78px"), Satori can throw validation errors. Example render step:

```ts
// Somewhere in your route/handler
const result = render(OG, {}) // result.body is HTML; you may also capture component CSS
```

### The fix: normalize dimensions before calling Satori

Use `normalizeDimensionsForSatori` right after `toReactNode(...)` and before `satori(...)`.

```ts
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { html as toReactNode } from 'satori-html'
import { normalizeDimensionsForSatori } from '@humanspeak/svelte-santori-fix'

// result from your component render
const result = render(OG, {})
const css = '' // if you collected CSS for the component, include it here

// Build a single HTML string, then convert to a Satori node
const element = normalizeDimensionsForSatori(
	toReactNode(`${result.body}<style>${css}</style>`)
)

// Proceed with Satori and PNG output
const svg = await satori(element, { height: 630, width: 1200 })
const image = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render()
return new Response(image.asPng(), { headers: { 'content-type': 'image/png' } })
```

- What this fixes: coerces `width`/`height` attributes and inline `style.width`/`style.height` to numbers (e.g., `78`) where safe, which Satori expects for `<img>`, `<svg>`, and `<image>`.
- Non-destructive: values like `auto` and percentages (e.g., `50%`) are preserved.

## API

```ts
import { normalizeDimensionsForSatori } from '@humanspeak/svelte-santori-fix'
```

- `normalizeDimensionsForSatori(node)`
	- Accepts: `Node | Node[] | null` (tree produced by `satori-html`)
	- Returns: same node reference, normalized in-place
	- Behavior:
		- For `img`, `svg`, `image`: coerces `props.width`/`props.height` when safe
		- For `style`: coerces `style.width`/`style.height` when safe
		- Recursively walks `children` arrays/objects

If importing within this repo:

```ts
import { normalizeDimensionsForSatori } from '$lib/utils/main'
```

## Notes

- Works with both simple HTML templates and component-rendered HTML
- Place the normalization strictly between `toReactNode(...)` and `satori(...)`
- If you later expand normalization beyond dimensions, consider a more generic name (e.g., `normalizeDimensionsForSatori` or `preprocessForSatori`)

## License

MIT © [Humanspeak, Inc.](LICENSE)

## Credits

Made with ❤️ by [Humanspeak](https://humanspeak.com)
