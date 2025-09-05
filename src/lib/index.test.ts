import { describe, expect, it } from 'vitest'
import { normalizeDimensionsForSatori } from './index'

describe('index exports', () => {
    it('exports normalizeDimensionsForSatori as a function', () => {
        expect(typeof normalizeDimensionsForSatori).toBe('function')
    })

    it('can be called from the index export', () => {
        // Should be safe no-op on null
        expect(normalizeDimensionsForSatori(null)).toBeNull()
    })
})
