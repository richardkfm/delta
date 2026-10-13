/** Formatierungshilfen für deutsche Zahlendarstellung. */

const nf = (digits: number) =>
  new Intl.NumberFormat('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits })

/** Zahl mit fester Nachkommastellenzahl, z. B. 1.234,5 */
export function formatNumber(x: number, digits = 0): string {
  // −0 vermeiden
  const v = Math.abs(x) < 0.5 * 10 ** -digits ? 0 : x
  return nf(digits).format(v)
}

/** Euro ohne Cent, z. B. „4.116 €“. */
export function formatEuro(x: number): string {
  return `${formatNumber(x, 0)} €`
}

/** Milliarden Euro, z. B. „149 Mrd. €“ bzw. „13,7 Mrd. €“ unter 100. */
export function formatBillions(eur: number): string {
  const bn = eur / 1e9
  const digits = Math.abs(bn) >= 100 || bn === 0 ? 0 : 1
  return `${formatNumber(bn, digits)} Mrd. €`
}

/** Anteil 0–1 als Prozent, z. B. „62 %“. */
export function formatPercent(share: number, digits = 0): string {
  return `${formatNumber(share * 100, digits)} %`
}

/** Kilometer, z. B. „7,5 km“. */
export function formatKm(km: number, digits = 1): string {
  return `${formatNumber(km, digits)} km`
}
