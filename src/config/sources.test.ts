import { describe, expect, it } from 'vitest'
import { SOURCES } from './sources'

// Source text of the config files, to check the [Source: id] references.
const configFiles = import.meta.glob(['./countries.ts', './assumptions.ts'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const referencedIds = Object.values(configFiles).flatMap((text) =>
  [...text.matchAll(/\[Source: ([a-z0-9-]+(?:, [a-z0-9-]+)*)\]/g)].flatMap((m) => m[1].split(',').map((id) => id.trim())),
)

// Source IDs used directly by the footer (src: ['…']).
const footer = Object.values(
  import.meta.glob('../components/Footer.tsx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>,
)[0]
const footerIds = [...footer.matchAll(/src: \[([^\]]+)\]/g)].flatMap((m) =>
  [...m[1].matchAll(/'([a-z0-9-]+)'/g)].map((x) => x[1]),
)

describe('Sources', () => {
  it('has unique IDs', () => {
    const ids = SOURCES.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has complete entries with an https link', () => {
    for (const s of SOURCES) {
      expect(s.title.length, s.id).toBeGreaterThan(0)
      expect(s.publisher.length, s.id).toBeGreaterThan(0)
      expect(s.usedFor.length, s.id).toBeGreaterThan(0)
      expect(s.url, s.id).toMatch(/^https:\/\//)
    }
  })

  it('every reference in the config points to an existing source', () => {
    const known = new Set(SOURCES.map((s) => s.id))
    const missing = referencedIds.filter((id) => !known.has(id))
    expect(missing).toEqual([])
  })

  it('every reference in the footer points to an existing source', () => {
    const known = new Set(SOURCES.map((s) => s.id))
    expect(footerIds.length).toBeGreaterThan(0)
    expect(footerIds.filter((id) => !known.has(id))).toEqual([])
  })

  it('every source is used in the config', () => {
    const used = new Set(referencedIds)
    const unused = SOURCES.filter((s) => !used.has(s.id)).map((s) => s.id)
    expect(unused).toEqual([])
  })
})
