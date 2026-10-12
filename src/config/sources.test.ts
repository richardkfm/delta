import { describe, expect, it } from 'vitest'
import { SOURCES } from './sources'

// Quelltext der Config-Dateien, um die [Quelle: id]-Verweise zu prüfen.
const configFiles = import.meta.glob(['./countries.ts', './assumptions.ts'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const referencedIds = Object.values(configFiles).flatMap((text) =>
  [...text.matchAll(/\[Quelle: ([a-z0-9-]+(?:, [a-z0-9-]+)*)\]/g)].flatMap((m) => m[1].split(',').map((id) => id.trim())),
)

// Quellen-IDs, die der Footer direkt verwendet (src: ['…']).
const footer = Object.values(
  import.meta.glob('../components/Footer.tsx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>,
)[0]
const footerIds = [...footer.matchAll(/src: \[([^\]]+)\]/g)].flatMap((m) =>
  [...m[1].matchAll(/'([a-z0-9-]+)'/g)].map((x) => x[1]),
)

describe('Quellen', () => {
  it('hat eindeutige IDs', () => {
    const ids = SOURCES.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('hat vollständige Einträge mit https-Link', () => {
    for (const s of SOURCES) {
      expect(s.title.length, s.id).toBeGreaterThan(0)
      expect(s.publisher.length, s.id).toBeGreaterThan(0)
      expect(s.usedFor.length, s.id).toBeGreaterThan(0)
      expect(s.url, s.id).toMatch(/^https:\/\//)
    }
  })

  it('jeder Verweis in der Config zeigt auf eine existierende Quelle', () => {
    const known = new Set(SOURCES.map((s) => s.id))
    const missing = referencedIds.filter((id) => !known.has(id))
    expect(missing).toEqual([])
  })

  it('jeder Verweis im Footer zeigt auf eine existierende Quelle', () => {
    const known = new Set(SOURCES.map((s) => s.id))
    expect(footerIds.length).toBeGreaterThan(0)
    expect(footerIds.filter((id) => !known.has(id))).toEqual([])
  })

  it('jede Quelle wird in der Config verwendet', () => {
    const used = new Set(referencedIds)
    const unused = SOURCES.filter((s) => !used.has(s.id)).map((s) => s.id)
    expect(unused).toEqual([])
  })
})
