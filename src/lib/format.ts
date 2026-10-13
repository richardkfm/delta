/** Formatting helpers for German number display. */

const nf = (digits: number) =>
  new Intl.NumberFormat('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits })

/** Number with a fixed number of decimal places, e.g. 1.234,5 */
export function formatNumber(x: number, digits = 0): string {
  // avoid −0
  const v = Math.abs(x) < 0.5 * 10 ** -digits ? 0 : x
  return nf(digits).format(v)
}

/** Euro without cents, e.g. "4.116 €". */
export function formatEuro(x: number): string {
  return `${formatNumber(x, 0)} €`
}

/** Billions of euros, e.g. "149 Mrd. €", or "13,7 Mrd. €" below 100. */
export function formatBillions(eur: number): string {
  const bn = eur / 1e9
  const digits = Math.abs(bn) >= 100 || bn === 0 ? 0 : 1
  return `${formatNumber(bn, digits)} Mrd. €`
}

/** Share 0–1 as a percentage, e.g. "62 %". */
export function formatPercent(share: number, digits = 0): string {
  return `${formatNumber(share * 100, digits)} %`
}

/** Kilometers, e.g. "7,5 km". */
export function formatKm(km: number, digits = 1): string {
  return `${formatNumber(km, digits)} km`
}
