"use client"

import React, { useMemo } from "react"

interface ParticleBackgroundProps {
  fadeStart?: number
  fadeEnd?: number
}

export default function ParticleBackground({ fadeStart = 0.35, fadeEnd = 0.75 }: ParticleBackgroundProps) {
  const gradient = useMemo(() => {
    const start = Math.max(0, Math.min(1, fadeStart)) * 100
    const end = Math.max(start, Math.min(100, fadeEnd * 100))
    return `linear-gradient(180deg, rgba(12, 10, 25, 0.25) 0%, rgba(12, 10, 25, 0.2) ${start}%, rgba(12, 10, 25, 0.05) ${end}%, rgba(12, 10, 25, 0) 100%)`
  }, [fadeStart, fadeEnd])

  return (
    <div className="pointer-events-none fixed inset-0" style={{ zIndex: 0 }}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(91,33,182,0.25),_transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(14,116,144,0.3),_transparent_70%)]" />
      <div className="absolute inset-0" style={{ backgroundImage: gradient }} />
    </div>
  )
}
