import type { Imprint as ImprintData } from '../config/imprint'

interface Props {
  imprint: ImprintData
  onBack: () => void
}

/** Imprint page (§ 5 DDG), shown under #impressum. Data comes from VITE_IMPRINT_* at build time. */
export function Imprint({ imprint, onBack }: Props) {
  return (
    <main className="mt-8 max-w-2xl">
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault()
          onBack()
        }}
        className="text-sm text-muted underline decoration-line underline-offset-2 hover:text-accent hover:decoration-accent"
      >
        ← Zurück zum Simulator
      </a>
      <h1 className="mt-6 text-3xl font-bold tracking-tight">Impressum</h1>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-muted">Angaben gemäß § 5 DDG</h2>
      <address className="mt-2 not-italic leading-relaxed">
        {imprint.name}
        {imprint.street && (
          <>
            <br />
            {imprint.street}
          </>
        )}
        {imprint.city && (
          <>
            <br />
            {imprint.city}
          </>
        )}
      </address>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-muted">Kontakt</h2>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        {imprint.email && (
          <>
            <dt className="text-muted">E-Mail</dt>
            <dd>
              <a href={`mailto:${imprint.email}`} className="underline decoration-line underline-offset-2 hover:text-accent">
                {imprint.email}
              </a>
            </dd>
          </>
        )}
        {imprint.phone && (
          <>
            <dt className="text-muted">Telefon</dt>
            <dd>{imprint.phone}</dd>
          </>
        )}
      </dl>

      {imprint.vatId && (
        <>
          <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-muted">Umsatzsteuer-ID</h2>
          <p className="mt-2">
            Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: <span className="tabular-nums">{imprint.vatId}</span>
          </p>
        </>
      )}

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-muted">Haftung für Inhalte</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        delta ist ein Erklär-Tool, kein wissenschaftliches Modell. Alle Zahlen beruhen auf den im Fußbereich
        aufgeführten Quellen und Annahmen und werden ohne Gewähr bereitgestellt.
      </p>
    </main>
  )
}
