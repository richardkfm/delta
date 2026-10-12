import { describe, expect, it } from 'vitest'
import { DEFAULT_STATE, MAX_COMMUTE_KM, parseState, serializeState, type AppState } from './urlState'

const CUSTOM: AppState = {
  benchmarkId: 'nl',
  sliders: { transit: 0.25, rail: 0, bike: 1, car: 0.73 },
  profile: { location: 'land', commuteKm: 42, cars: 2 },
}

describe('parseState', () => {
  it('returns DEFAULT_STATE for an empty search string', () => {
    expect(parseState('')).toEqual(DEFAULT_STATE)
  })

  it('accepts a leading "?" in the search string', () => {
    expect(parseState('?b=nl&oepnv=50')).toEqual(parseState('b=nl&oepnv=50'))
    expect(parseState('?b=nl&oepnv=50').benchmarkId).toBe('nl')
    expect(parseState('?b=nl&oepnv=50').sliders.transit).toBe(0.5)
  })

  it('uses a custom benchmarkIds list when given', () => {
    expect(parseState('?b=xx', ['nl', 'xx']).benchmarkId).toBe('xx')
  })

  it('falls back to defaults for invalid values', () => {
    expect(parseState('b=gibt-es-nicht').benchmarkId).toBe(DEFAULT_STATE.benchmarkId)
    expect(parseState('lage=mond').profile.location).toBe(DEFAULT_STATE.profile.location)
    expect(parseState('oepnv=abc').sliders.transit).toBe(DEFAULT_STATE.sliders.transit)
    expect(parseState('km=').profile.commuteKm).toBe(DEFAULT_STATE.profile.commuteKm)
  })

  it('clamps out-of-range values to the allowed range', () => {
    expect(parseState('oepnv=150').sliders.transit).toBe(1)
    expect(parseState('bahn=-20').sliders.rail).toBe(0)
    expect(parseState('km=500').profile.commuteKm).toBe(MAX_COMMUTE_KM)
    expect(parseState('autos=7').profile.cars).toBe(2)
  })
})

describe('serializeState', () => {
  it('writes the expected parameter names with slider values as integers 0–100', () => {
    const params = new URLSearchParams(serializeState(CUSTOM))
    expect(params.get('b')).toBe('nl')
    expect(params.get('oepnv')).toBe('25')
    expect(params.get('bahn')).toBe('0')
    expect(params.get('rad')).toBe('100')
    expect(params.get('auto')).toBe('73')
    expect(params.get('lage')).toBe('land')
    expect(params.get('km')).toBe('42')
    expect(params.get('autos')).toBe('2')
  })

  it('round-trips a custom state through parseState', () => {
    expect(parseState(serializeState(CUSTOM))).toEqual(CUSTOM)
  })
})
