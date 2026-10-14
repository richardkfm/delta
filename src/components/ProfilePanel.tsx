import { LOCATION_LABELS, type CarCount, type Location } from '../config/assumptions'
import { MAX_COMMUTE_KM } from '../lib/urlState'
import type { Profile } from '../model/types'

interface Props {
  profile: Profile
  onChange: (profile: Profile) => void
}

const LOCATIONS = Object.keys(LOCATION_LABELS) as Location[]
const CAR_OPTIONS: { value: CarCount; label: string }[] = [
  { value: 0, label: '0' },
  { value: 1, label: '1' },
  { value: 2, label: '2+' },
]

/** Compact personal profile: residential location, commute, cars in the household. */
export function ProfilePanel({ profile, onChange }: Props) {
  return (
    <section aria-label="Dein Profil" className="grid gap-4 rounded-xl border border-line p-4 sm:grid-cols-[1.4fr_1fr_auto]">
      <fieldset>
        <legend className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">Wohnlage</legend>
        <Segmented
          name="lage"
          options={LOCATIONS.map((l) => ({ value: l, label: LOCATION_LABELS[l] }))}
          value={profile.location}
          onChange={(location) => onChange({ ...profile, location })}
        />
      </fieldset>

      <div>
        <label htmlFor="arbeitsweg" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
          Arbeitsweg (einfach)
        </label>
        <div className="flex items-center gap-2">
          <input
            id="arbeitsweg"
            type="number"
            inputMode="numeric"
            min={0}
            max={MAX_COMMUTE_KM}
            step={1}
            value={profile.commuteKm}
            onChange={(e) => {
              const v = Number(e.target.value)
              if (Number.isFinite(v)) onChange({ ...profile, commuteKm: Math.min(MAX_COMMUTE_KM, Math.max(0, Math.round(v))) })
            }}
            className="w-20 rounded-lg border border-line px-3 py-1.5 tabular-nums focus:border-accent focus:outline-none"
          />
          <span className="text-sm text-muted">km</span>
        </div>
      </div>

      <fieldset>
        <legend className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">Autos im Haushalt</legend>
        <Segmented
          name="autos"
          options={CAR_OPTIONS}
          value={profile.cars}
          onChange={(cars) => onChange({ ...profile, cars })}
        />
      </fieldset>
    </section>
  )
}

interface SegmentedProps<T extends string | number> {
  name: string
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}

export function Segmented<T extends string | number>({ name, options, value, onChange }: SegmentedProps<T>) {
  return (
    <div className="inline-flex w-full rounded-lg border border-line p-0.5 sm:w-auto">
      {options.map((o) => {
        const checked = o.value === value
        return (
          <label
            key={String(o.value)}
            className={`flex-1 cursor-pointer rounded-md px-3 py-1.5 text-center text-sm transition active:scale-95 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent sm:flex-none ${
              checked ? 'bg-accent text-white' : 'text-ink hover:text-accent'
            }`}
          >
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={checked}
              onChange={() => onChange(o.value)}
            />
            {o.label}
          </label>
        )
      })}
    </div>
  )
}
