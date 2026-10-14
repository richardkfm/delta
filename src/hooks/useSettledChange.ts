import { useEffect, useRef, useState } from 'react'

/**
 * Counts how often `value` has changed and then stayed put for `delayMs`.
 * Useful as a React `key` to replay a one-off animation once a slider comes to rest,
 * instead of restarting it on every intermediate step.
 */
export function useSettledChange(value: number, delayMs = 250): number {
  const [count, setCount] = useState(0)
  const settled = useRef(value)

  useEffect(() => {
    if (value === settled.current) return
    const id = window.setTimeout(() => {
      settled.current = value
      setCount((c) => c + 1)
    }, delayMs)
    return () => window.clearTimeout(id)
  }, [value, delayMs])

  return count
}
