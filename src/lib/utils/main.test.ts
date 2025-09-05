import { describe, expect, it } from 'vitest'
import { normalizeDimensionsForSatori, type Node } from './main'

describe('normalizeDimensionsForSatori', () => {
    it('converts numeric string attributes on img to numbers', () => {
        const node: Node = {
            type: 'img',
            props: { width: '78', height: '78' }
        }

        const result = normalizeDimensionsForSatori(node) as Node
        expect(result.props?.width).toBe(78)
        expect(result.props?.height).toBe(78)
    })

    it('converts px values and preserves auto/percentages', () => {
        const node: Node = {
            type: 'img',
            props: { width: '88px', height: 'auto' }
        }

        const result = normalizeDimensionsForSatori(node) as Node
        expect(result.props?.width).toBe(88)
        expect(result.props?.height).toBe('auto')
    })

    it('coerces style width/height when present', () => {
        const node: Node = {
            type: 'div',
            props: { style: { width: '100px', height: '50%' } }
        }

        const result = normalizeDimensionsForSatori(node) as Node
        // @ts-expect-error — style is a loose record; we check runtime values
        expect(result.props?.style.width).toBe(100)
        // @ts-expect-error — style is a loose record; we check runtime values
        expect(result.props?.style.height).toBe('50%')
    })

    it('walks nested children arrays and objects', () => {
        const node: Node = {
            type: 'div',
            props: {
                children: [
                    {
                        type: 'span',
                        props: { children: { type: 'img', props: { width: '42px', height: '7' } } }
                    }
                ]
            }
        }

        const result = normalizeDimensionsForSatori(node) as Node
        const child = (result.props?.children as Node[])[0] as Node
        const grand = child.props?.children as Node as Node
        expect(grand.props?.width).toBe(42)
        expect(grand.props?.height).toBe(7)
    })

    it('supports an array root of nodes', () => {
        const nodes: Node[] = [
            { type: 'img', props: { width: '10', height: '20' } },
            { type: 'img', props: { width: '30px', height: '40px' } }
        ]

        const result = normalizeDimensionsForSatori(nodes) as Node[]
        expect(result[0].props?.width).toBe(10)
        expect(result[0].props?.height).toBe(20)
        expect(result[1].props?.width).toBe(30)
        expect(result[1].props?.height).toBe(40)
    })

    it('returns null when given null', () => {
        const result = normalizeDimensionsForSatori(null)
        expect(result).toBeNull()
    })
})
