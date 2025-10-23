"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/contexts/LanguageContext"

export interface StickyMiniMenuItem {
  id: string
  label: string
  icon?: ReactNode
  hidden?: boolean
}

interface StickyMiniMenuProps {
  items: StickyMiniMenuItem[]
  className?: string
  title?: string
}

export default function StickyMiniMenu({ items, className, title = "Sections" }: StickyMiniMenuProps) {
  const { t } = useTranslation()
  const computedTitle = title || t('results.sections')
  const visibleItems = items.filter(item => item && !item.hidden)

  if (visibleItems.length === 0) {
    return null
  }

  return (
    <nav className={cn("sticky top-24 space-y-3", className)} aria-label={computedTitle}>
      <span className="text-xs uppercase tracking-[0.2em] text-slate-500 block">
        {computedTitle}
      </span>
      <ul className="space-y-1.5">
        {visibleItems.map(({ id, label, icon }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-slate-800/40 hover:text-white"
            >
              {icon && <span className="text-slate-500">{icon}</span>}
              <span>{label}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
