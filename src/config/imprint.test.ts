import { describe, expect, it } from 'vitest'
import { parseImprint } from './imprint'

const FULL = {
  VITE_IMPRINT_NAME: ' Erika Mustermann ',
  VITE_IMPRINT_STREET: 'Musterstraße 1',
  VITE_IMPRINT_CITY: '12345 Musterstadt',
  VITE_IMPRINT_EMAIL: 'erika@example.org',
  VITE_IMPRINT_PHONE: '+49 30 1234567',
  VITE_IMPRINT_VAT_ID: 'DE123456789',
}

describe('parseImprint', () => {
  it('returns null without a name', () => {
    expect(parseImprint({})).toBeNull()
    expect(parseImprint({ VITE_IMPRINT_NAME: '   ', VITE_IMPRINT_EMAIL: 'x@example.org' })).toBeNull()
  })

  it('reads all fields and trims whitespace', () => {
    expect(parseImprint(FULL)).toEqual({
      name: 'Erika Mustermann',
      street: 'Musterstraße 1',
      city: '12345 Musterstadt',
      email: 'erika@example.org',
      phone: '+49 30 1234567',
      vatId: 'DE123456789',
    })
  })

  it('leaves optional fields undefined when empty', () => {
    const i = parseImprint({ VITE_IMPRINT_NAME: 'Erika', VITE_IMPRINT_PHONE: '', VITE_IMPRINT_VAT_ID: ' ' })
    expect(i?.phone).toBeUndefined()
    expect(i?.vatId).toBeUndefined()
    expect(i?.street).toBe('')
    expect(i?.email).toBe('')
  })

  it('ignores unrelated variables', () => {
    const i = parseImprint({ ...FULL, VITE_DELTA_APP_URL: 'https://example.org/' })
    expect(i?.name).toBe('Erika Mustermann')
  })
})
