// Utility helpers for sanitizing element trees before rendering with satori.
//
// These helpers coerce CSS-like width/height values to numbers where appropriate.
// satori's newer versions validate attribute types strictly and expect numbers for
// many dimensions (e.g., <img width={78} />). When HTML is parsed by `satori-html`,
// numeric attributes often become strings ("78" or "78px"), which triggers errors
// like: Invalid value "78" for "width". These helpers normalize such values.

type Children = Node | Node[] | string | number | null

/**
 * Minimal node shape produced by `satori-html` that we care about.
 */
export type Node = {
    type?: string
    props?: Record<string, unknown> & {
        children?: Children
        style?: Record<string, unknown>
        width?: unknown
        height?: unknown
    }
}

/**
 * Normalizes a CSS-like dimension value to a number when safe.
 *
 * Converts numeric strings (optionally suffixed with "px") to a number while
 * preserving percentage values (e.g., "50%") and the keyword "auto" to keep
 * layout semantics intact.
 *
 * @param value - Raw dimension value from an attribute or style object.
 * @returns The numeric value when conversion is safe; otherwise the original value.
 * @example
 * toNumberIfPossible("78") // 78
 * toNumberIfPossible("78px") // 78
 * toNumberIfPossible("50%") // "50%"
 * toNumberIfPossible("auto") // "auto"
 */
const toNumberIfPossible = (value: unknown): unknown => {
    if (typeof value === 'number') return value
    if (typeof value !== 'string') return value

    const trimmed = value.trim()
    if (trimmed.endsWith('%') || trimmed === 'auto') return value

    const withoutPx = trimmed.endsWith('px') ? trimmed.slice(0, -2) : trimmed
    const parsed = Number(withoutPx)
    return Number.isNaN(parsed) ? value : parsed
}

/**
 * Coerces width/height values on a node's props to numbers in-place.
 *
 * Applies to width/height attributes on `img`, `svg`, and `image` elements and
 * to inline `style.width`/`style.height` when present.
 *
 * @param props - The props object to mutate. If undefined, this is a no-op.
 * @param type - The element tag name (e.g., `img`, `svg`, `image`).
 * @returns void
 * @remarks
 * This function intentionally mutates `props` to avoid extra allocations while
 * walking the tree.
 */
const fixDimensionsOnProps = (props: Node['props'], type?: string): void => {
    if (!props) return

    if (type === 'img' || type === 'svg' || type === 'image') {
        if ('width' in props) props.width = toNumberIfPossible(props.width)
        if ('height' in props) props.height = toNumberIfPossible(props.height)
    }

    if (props.style) {
        const { style } = props
        const { width: styleWidth, height: styleHeight } = style
        if (styleWidth !== undefined) style.width = toNumberIfPossible(styleWidth)
        if (styleHeight !== undefined) style.height = toNumberIfPossible(styleHeight)
    }
}

/**
 * Recursively normalizes dimension values within a `satori-html` node tree.
 *
 * Ensures attributes like `width`/`height` and their style counterparts are
 * numeric where satori expects numbers.
 *
 * @typeParam T - A single `Node`, an array of `Node`, or `null`.
 * @param node - The element tree produced by `satori-html`.
 * @returns The same node reference, with child props normalized in place.
 * @example
 * const element = normalizeDimensionsForSatori(toReactNode('<img width="78" height="78"/>'))
 * const svg = await satori(element, opts)
 * @remarks
 * This is safe to call on `null` and will simply return `null`.
 */
export const normalizeDimensionsForSatori = <T extends Node | Node[] | null>(node: T): T => {
    const walk = (n: Node): Node => {
        if (!n || typeof n !== 'object') return n

        const { props, type } = n
        fixDimensionsOnProps(props, type)

        if (!props) return n

        const children = props.children as Children | undefined
        if (Array.isArray(children)) {
            props.children = children.map((child) => {
                if (typeof child === 'object' && child !== null) {
                    return walk(child as Node)
                }
                return child
            }) as Children
        } else if (children && typeof children === 'object') {
            props.children = walk(children as Node)
        }

        return n
    }

    if (Array.isArray(node)) {
        return node.map((n) => walk(n as Node)) as T
    }
    return node ? (walk(node as Node) as T) : node
}
