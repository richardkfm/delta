import { describe, expect, it } from 'vitest'
import { getBenchmark } from '../config/countries'
import { parseState } from '../lib/urlState'
import { computeScenario } from '../model'
import { buildAppLink, DEFAULT_WIDGET_STATE, parseWidgetState, toAppState } from './widgetState'

const PAGE = 'https://delta.example.org/widget.html?lage=land'

describe('parseWidgetState', () => {
  it('returns the default for an empty search string', () => {
    expect(parseWidgetState('')).toEqual(DEFAULT_WIDGET_STATE)
  })

  it('reads variant, location and level', () => {
    expect(parseWidgetState('?v=bahn&lage=land&niveau=40')).toEqual({ variant: 'bahn', location: 'land', level: 0.4 })
  })

  it('clamps and rounds the level', () => {
    expect(parseWidgetState('niveau=150').level).toBe(1)
    expect(parseWidgetState('niveau=-5').level).toBe(0)
    expect(parseWidgetState('niveau=33.6').level).toBe(0.34)
  })

  it('falls back to defaults for invalid values', () => {
    expect(parseWidgetState('v=quiz').variant).toBe(DEFAULT_WIDGET_STATE.variant)
    expect(parseWidgetState('lage=mond').location).toBe(DEFAULT_WIDGET_STATE.location)
    expect(parseWidgetState('niveau=abc').level).toBe(DEFAULT_WIDGET_STATE.level)
    expect(parseWidgetState('niveau=').level).toBe(DEFAULT_WIDGET_STATE.level)
  })
})

describe('buildAppLink', () => {
  const w = { variant: 'auto', level: 0.7, location: 'kleinstadt' } as const

  it('resolves an empty or relative app URL against the widget page', () => {
    expect(buildAppLink('', w, PAGE)).toMatch(/^https:\/\/delta\.example\.org\/\?/)
    expect(buildAppLink('./', w, PAGE)).toMatch(/^https:\/\/delta\.example\.org\/\?/)
  })

  it('uses an absolute app URL and keeps its own parameters', () => {
    const link = new URL(buildAppLink('https://other.example/delta/?lang=de', w, PAGE))
    expect(link.origin + link.pathname).toBe('https://other.example/delta/')
    expect(link.searchParams.get('lang')).toBe('de')
  })

  it('prefills the scenario so the app opens with the same state', () => {
    const link = new URL(buildAppLink('https://delta.example.org/', w, PAGE))
    expect(parseState(link.search)).toEqual(toAppState(w))
    expect(link.searchParams.get('oepnv')).toBe('70')
    expect(link.searchParams.get('lage')).toBe('kleinstadt')
    expect(link.searchParams.get('autos')).toBe('1')
  })

  it('moves only the rail slider in the "bahn" variant', () => {
    const link = new URL(buildAppLink('https://delta.example.org/', { ...w, variant: 'bahn' }, PAGE))
    expect(link.searchParams.get('bahn')).toBe('70')
    for (const key of ['oepnv', 'rad', 'auto']) expect(link.searchParams.get(key)).toBe('0')
  })

  it('adds UTM parameters with the variant as utm_content', () => {
    const link = new URL(buildAppLink('https://delta.example.org/', w, PAGE))
    expect(link.searchParams.get('utm_source')).toBe('widget')
    expect(link.searchParams.get('utm_medium')).toBe('embed')
    expect(link.searchParams.get('utm_content')).toBe('auto')
    const vergleich = new URL(buildAppLink('https://delta.example.org/', { ...w, variant: 'vergleich' }, PAGE))
    expect(vergleich.searchParams.get('utm_content')).toBe('vergleich')
  })
})

describe('toAppState', () => {
  it('gives the app the same savings the widget shows', () => {
    const w = { variant: 'auto', level: 1, location: 'grossstadt' } as const
    const app = toAppState(w)
    const result = computeScenario(getBenchmark(app.benchmarkId), app.sliders, app.profile)
    expect(result.money.carAbolishProbability).toBeCloseTo(0.7)
    expect(result.money.totalPerYear).toBeGreaterThan(0)
  })
})
