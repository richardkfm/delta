import { useEffect, useRef, useState } from 'react'

/**
 * Zählt eine Zahl weich zum Zielwert hoch bzw. runter (ease-out).
 * Respektiert „prefers-reduced-motion“: dann wird sofort gesprungen.
 */
export function useAnimatedNumber(target: number, durationMs = 500): number {
  const [value, setValue] = useState(target)
  const valueRef = useRef(target)

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const from = valueRef.current
    if (reduce || from === target) {
      valueRef.current = target
      setValue(target)
      return
    }
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - (1 - t) ** 3
      const v = from + (target - from) * eased
      valueRef.current = v
      setValue(v)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, durationMs])

  return value
}
