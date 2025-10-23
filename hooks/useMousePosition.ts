import { useState, useEffect, useCallback } from 'react'

export function useMousePosition() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isClient, setIsClient] = useState(false)

  // Initialize client-side flag
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Optimized mouse tracking with useCallback and requestAnimationFrame
  const handleMouseMove = useCallback((e: MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY })
  }, [])

  useEffect(() => {
    if (!isClient) return

    // Use requestAnimationFrame for smoother performance
    let rafId: number
    const throttledMouseMove = (e: MouseEvent) => {
      if (rafId) return
      rafId = requestAnimationFrame(() => {
        handleMouseMove(e)
        rafId = 0
      })
    }

    window.addEventListener("mousemove", throttledMouseMove, { passive: true })
    return () => {
      window.removeEventListener("mousemove", throttledMouseMove)
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [isClient, handleMouseMove])

  return { mousePosition, isClient }
}
