"use client"

import React from "react"
import { Droplets, AlertTriangle, Clock, Link, Heart } from "lucide-react"

export interface DreamTheme {
  theme: string
  emoji?: string
  color?: string
  intensity?: number
  description?: string
}

interface DreamSceneProps {
  themes: DreamTheme[]
}

// Icon mapping based on theme names
const getThemeIcon = (theme: string) => {
  const themeLower = theme.toLowerCase()
  if (themeLower.includes('su') || themeLower.includes('water')) return Droplets
  if (themeLower.includes('korku') || themeLower.includes('fear')) return AlertTriangle
  if (themeLower.includes('zaman') || themeLower.includes('time')) return Clock
  if (themeLower.includes('köprü') || themeLower.includes('bridge')) return Link
  if (themeLower.includes('nostalji') || themeLower.includes('nostalgia')) return Heart
  return Heart // default
}

export default function DreamScene({ themes }: DreamSceneProps) {
  if (!themes || themes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-white/10 bg-white/5 p-8 text-sm text-muted-foreground">
        No themes detected for this dream.
      </div>
    )
  }

  return (
    <div className="grid gap-2 p-2 md:grid-cols-2 lg:grid-cols-3">
      {themes.map(theme => {
        const IconComponent = getThemeIcon(theme.theme)
        return (
          <div key={theme.theme} className="group flex items-center space-x-2 rounded-lg bg-white/5 p-2 transition-all duration-200 hover:bg-white/10">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white">
              <IconComponent className="h-3 w-3" />
            </div>
            <div className="flex-1">
              <h3 className="text-xs font-medium text-white">
                {theme.theme}
              </h3>
              {theme.intensity && (
                <div className="flex items-center gap-1 mt-1">
                  <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-purple rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(theme.intensity * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400">
                    {Math.round(theme.intensity * 100)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
