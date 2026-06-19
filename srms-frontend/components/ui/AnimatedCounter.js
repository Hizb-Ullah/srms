'use client'

import { useEffect, useState, useRef } from 'react'

export default function AnimatedCounter({ value, duration = 800 }) {
  const [display, setDisplay] = useState(0)
  const startRef = useRef(null)
  const fromRef = useRef(0)

  useEffect(() => {
    const target = Number(value) || 0
    const from = fromRef.current
    startRef.current = null

    const step = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp
      const progress = Math.min((timestamp - startRef.current) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(from + (target - from) * eased)
      setDisplay(current)
      if (progress < 1) {
        requestAnimationFrame(step)
      } else {
        fromRef.current = target
      }
    }

    const frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [value, duration])

  return <span>{display}</span>
}