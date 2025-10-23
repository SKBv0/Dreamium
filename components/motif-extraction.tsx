"use client"

import { motion } from "framer-motion"
import { Users, PawPrint, MapPin, Package, Heart } from "lucide-react"
import React from "react"
import { useLanguage } from "@/contexts/LanguageContext"

interface MotifExtractionProps {
  motifs: Record<string, string[]>
  categoryIcons?: Record<string, React.FC<{ className?: string }>>
  categoryColors?: Record<string, string>
}

// Icon mapping for categories
const getCategoryIcon = (category: string) => {
  const catLower = category.toLowerCase()
  if (catLower.includes('character') || catLower.includes('karakter') || catLower.includes('people')) return Users
  if (catLower.includes('animal') || catLower.includes('hayvan')) return PawPrint
  if (catLower.includes('place') || catLower.includes('yer')) return MapPin
  if (catLower.includes('object') || catLower.includes('nesne')) return Package
  if (catLower.includes('activity') || catLower.includes('eylem') || catLower.includes('action')) return Heart
  if (catLower.includes('emotion') || catLower.includes('duygu')) return Heart
  return Heart // default
}

export default function MotifExtraction({ motifs }: MotifExtractionProps) {
  const { t } = useLanguage()
  
  const hasMotifs = Object.values(motifs).some((arr) => arr.length > 0)

  if (!hasMotifs) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-sm">
        {t('motifs.noMotifsDetected')}
      </div>
    )
  }

  return (
    <div className="space-y-4 h-full overflow-y-auto pr-2">
      {Object.entries(motifs).map(
        ([category, items]) =>
          items.length > 0 && (
            <motion.div
              key={category}
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center space-x-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10">
                  {React.createElement(getCategoryIcon(category), {
                    className: "h-3 w-3 text-white"
                  })}
                </div>
                <h4 className="text-sm font-medium text-white capitalize">
                  {t(`motifs.${category}`)}
                </h4>
                <span className="text-xs text-slate-400">
                  {items.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {items.map((item) => (
                  <motion.span
                    key={item}
                    className="px-2 py-1 bg-white/5 rounded-md text-xs text-slate-300 hover:bg-white/10 transition-all duration-150"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {typeof item === 'string' && item !== '[object Object]' 
                      ? (t(`motifs.labels.${item.toLowerCase()}`) !== `motifs.labels.${item.toLowerCase()}` 
                          ? t(`motifs.labels.${item.toLowerCase()}`) 
                          : item)
                      : t('motifs.unknown')}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          ),
      )}
    </div>
  )
}
