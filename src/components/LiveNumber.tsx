import type { ReactNode } from 'react'
import { useAnimatedNumber } from '../hooks/useAnimatedNumber'

interface Props {
  value: number
  format: (value: number) => string
  /** Rendered after the number, e.g. a unit; it moves with the number. */
  children?: ReactNode
}

/** A number that counts to its new value and lifts slightly while doing so (styles: `.live-number`). */
export function LiveNumber({ value, format, children }: Props) {
  const shown = useAnimatedNumber(value)
  return (
    <span className="live-number" data-changing={shown !== value}>
      {format(shown)}
      {children}
    </span>
  )
}
