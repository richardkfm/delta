import { useEffect, useRef, useState } from 'react'

/**
 * Smoothly counts a number up or down to the target value (ease-out).
 * Respects "prefers-reduced-motion": in that case it jumps immediately.
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
      // Land exactly on the target so callers can compare against it.
      const v = t === 1 ? target : from + (target - from) * eased
      valueRef.current = v
      setValue(v)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, durationMs])

  return value
}
