"use client"

import React, { ReactNode } from 'react'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'

interface LazyChartProps {
  children: ReactNode
  fallback?: ReactNode
  className?: string
}

export function LazyChart({ children, fallback, className = '' }: LazyChartProps) {
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px',
    triggerOnce: true
  })

  const defaultFallback = (
    <div className={`chart-container ${className}`}>
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <div className="loading-skeleton w-full h-full rounded-lg"></div>
      </div>
    </div>
  )

  return (
    <div ref={ref} className={className}>
      {isIntersecting ? children : (fallback || defaultFallback)}
    </div>
  )
}
