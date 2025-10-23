"use client"

import React from "react"
import { motion } from "framer-motion"
import { BookOpen, ArrowRight, BarChart3, Cpu, Clock, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DreamInputSectionProps {
  dreamText: string
  setDreamText: (text: string) => void
  dreamTime: string
  setDreamTime: (time: string) => void
  isAnalyzing: boolean
  onAnalyze: () => Promise<void>
  demographics: any
  setShowDemographics: (show: boolean) => void
  language: string
  t: (key: string, values?: Record<string, any>) => string
  history: any[]
  loadAnalysis: (filename: string) => void
  fetchHistory: () => void
}

export default function DreamInputSection({
  dreamText,
  setDreamText,
  dreamTime,
  setDreamTime,
  isAnalyzing,
  onAnalyze,
  demographics,
  setShowDemographics,
  language,
  t,
  history,
  loadAnalysis,
  fetchHistory,
}: DreamInputSectionProps) {
  const [currentPage, setCurrentPage] = React.useState(0)
  const itemsPerPage = 3
  const totalPages = Math.ceil(history.length / itemsPerPage)
  const currentItems = history.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)

  const nextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages - 1))
  }

  const prevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 0))
  }
  return (
    <motion.div
      key="input"
      initial={{
        opacity: 0,
        scale: 0.95,
        y: 20
      }}
      animate={{
        opacity: 1,
        scale: 1,
        y: 0
      }}
      exit={{
        opacity: 0,
        scale: 0.95,
        y: -20
      }}
      transition={{
        duration: 0.6,
        ease: "easeOut"
      }}
      className="max-w-5xl mx-auto"
      style={{
        willChange: 'transform',
        transform: 'translateZ(0)' // Force GPU acceleration
      }}
    >
      {/* Hero Section */}
      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-12"
        >

          {/* Feature highlights */}
          <div className="flex flex-wrap justify-center gap-6 sm:gap-8 text-sm text-slate-400 mt-8">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-premium-accent-electric rounded-full"></div>
              <span>{t("dreamInput.features.aiAnalysis")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-premium-accent-gold rounded-full"></div>
              <span>{t("dreamInput.features.scientificMethods")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-premium-accent-purple rounded-full"></div>
              <span>{t("dreamInput.features.psychology")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
              <span>{t("dreamInput.features.researchBased")}</span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="bg-dark-800/50 border border-dark-700/50 rounded-2xl backdrop-blur-xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="text-center p-8 pb-6 border-b border-dark-700/50">
          <motion.h2
            className="text-2xl md:text-3xl font-light text-premium-pearl mb-3 flex items-center justify-center gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <BookOpen className="w-6 h-6 text-premium-accent-electric" />
            {t("dreamInput.title")}
          </motion.h2>
          <motion.p
            className="text-dark-200 font-light max-w-xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {t("dreamInput.subtitle")}
          </motion.p>
        </div>

        <div className="p-8 space-y-6">
          <div className="relative">
            <label htmlFor="dream-textarea" className="sr-only">
              {t("dreamInput.title")}
            </label>
            <textarea
              id="dream-textarea"
              placeholder={t("dreamInput.placeholder")}
              value={dreamText}
              onChange={(e) => setDreamText(e.target.value)}
              className="dream-textarea-input focus:ring-2 focus:ring-premium-accent-gold/30 focus:ring-offset-2 focus:ring-offset-dark-900"
              aria-describedby="character-count"
            />
            {dreamText.length > 100 && (
              <div className="absolute bottom-0 left-0 right-0 h-px bg-dark-700/20 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-transparent via-premium-accent-gold/30 to-transparent"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((dreamText.length / 1000) * 100, 100)}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            )}

            <div className="absolute bottom-4 right-4 flex items-center gap-4 text-sm">
              <div className={`flex items-center gap-2 transition-colors duration-300 ${
                dreamText.length < 10 ? 'text-amber-400' :
                dreamText.length >= 50 ? 'text-emerald-400' :
                'text-dark-300'
              }`}>
                <span className="font-medium">
                  {dreamText.length.toLocaleString()}
                </span>
                <span className="text-xs">
                  {t("dreamInput.characterCount")}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="dream-time" className="flex items-center gap-2 text-sm text-slate-300">
              <Clock className="w-4 h-4 text-premium-accent-purple" />
              <span className="font-medium">{t("dreamInput.dreamTimeLabel")}</span>
              <span className="text-xs text-dark-400">({t("dreamInput.dreamTimeDescription")})</span>
            </label>
            <input
              id="dream-time"
              type="time"
              value={dreamTime}
              onChange={(e) => setDreamTime(e.target.value)}
              placeholder={t("dreamInput.dreamTimePlaceholder")}
              className="w-full sm:w-64 px-4 py-3 bg-dark-850/50 border border-dark-650/50 rounded-lg text-premium-pearl placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-premium-accent-purple/50 focus:border-premium-accent-purple/50 transition-all duration-300"
            />
            {dreamTime && (
              <p className="text-xs text-premium-accent-purple/70 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {t("dreamInput.dreamTimeMemory")}
              </p>
            )}
          </div>

          {/* Recent Analyses - Scrollable */}
          {history && history.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-light text-premium-pearl">
                  {t("recentAnalysis.title")} ({history.length})
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm(t('history.management.deleteConfirm'))) {
                        fetch('/api/history/delete?action=all', { method: 'DELETE' })
                          .then(() => fetchHistory())
                      }
                    }}
                    className="text-slate-400 hover:text-red-400 text-xs"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    {t('history.management.clearAll')}
                  </Button>
                </div>
              </div>

              {/* Navigation and Cards */}
              <div className="relative">
                {/* Navigation Arrows */}
                {totalPages > 1 && (
                  <>
                    <button
                      onClick={prevPage}
                      disabled={currentPage === 0}
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 w-8 h-8 rounded-full bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={nextPage}
                      disabled={currentPage === totalPages - 1}
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 w-8 h-8 rounded-full bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}

                {/* Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {currentItems.map((item: any, index: number) => {
                    const globalIndex = currentPage * itemsPerPage + index
                    return (
                      <motion.div
                        key={item.filename}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group cursor-pointer"
                        onClick={() => loadAnalysis(item.filename)}
                      >
                        <div className="bg-slate-900/20 border border-slate-800/30 rounded-lg p-3 hover:bg-slate-900/30 transition-all duration-200 relative">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-300">
                              {t("recentAnalysis.analysisPrefix")} {history.length - globalIndex}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (confirm(t('history.management.deleteSingleConfirm'))) {
                                  fetch(`/api/history/delete?action=single&filename=${encodeURIComponent(item.filename)}`, { method: 'DELETE' })
                                    .then(() => fetchHistory())
                                }
                              }}
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 transition-all p-1 rounded hover:bg-red-900/20"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="text-xs text-slate-400">
                            {new Date(item.date).toLocaleString(language, {
                              dateStyle: "short",
                              timeStyle: "short"
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    {Array.from({ length: totalPages }).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentPage(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentPage 
                            ? 'bg-premium-accent-gold' 
                            : 'bg-slate-600 hover:bg-slate-500'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Scientific Enhancement Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-dark-850/50 rounded-xl border border-dark-650/40 hover:border-premium-accent-gold/50 transition-all duration-300">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-premium-accent-purple" />
                <div>
                  <h4 className="text-sm font-medium text-premium-pearl">
                    {t("scientificConfig.title")}
                  </h4>
                  <p className="text-xs text-dark-300">
                    {t("scientificConfig.description")}
                  </p>
                </div>
              </div>
              <div>
                <Button
                  onClick={() => setShowDemographics(true)}
                  variant="outline"
                  size="sm"
                  className="bg-dark-800/50 border-dark-650/50 text-premium-accent-purple hover:bg-dark-750/50 focus:ring-2 focus:ring-premium-accent-purple/50 focus:ring-offset-2 focus:ring-offset-dark-900"
                >
                  {demographics ? t("scientificConfig.update") : t("dreamInput.analyzeButton")}
                </Button>
              </div>
            </div>

            {demographics && (
              <motion.div
                className="text-sm text-dark-300 bg-dark-800/30 p-3 rounded-lg border border-dark-650/30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {t("scientificConfig.activeStatus", {
                  age: demographics.age,
                  gender: t(`demographics.steps.gender.options.${demographics.gender}`),
                  culture: t(`demographics.steps.culturalBackground.options.${demographics.culturalBackground}`)
                })}
              </motion.div>
            )}
          </div>

          {/* Analyze Button */}
            <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25,
              mass: 0.8
            }}
            className="pt-2"
          >
            <Button
              onClick={onAnalyze}
              disabled={!dreamText.trim() || isAnalyzing}
              aria-disabled={!dreamText.trim() || isAnalyzing}
              className="dream-analyze-button focus:ring-2 focus:ring-premium-accent-gold/50 focus:ring-offset-2 focus:ring-offset-dark-900"
              size="lg"
            >
              {isAnalyzing ? (
                <div className="flex items-center gap-3" role="status" aria-label={t("dreamInput.analyzing")}>
                  <div className="relative">
                    <div className="w-5 h-5 border-2 border-white/20 rounded-full"></div>
                    <div className="absolute inset-0 w-5 h-5 border-2 border-transparent border-t-premium-accent-gold rounded-full animate-spin"></div>
                  </div>
                  <span className="text-premium-accent-gold font-medium">{t("dreamInput.analyzing")}</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Cpu className="w-5 h-5" />
                  <span>
                    {demographics
                      ? t("scientificConfig.startButton")
                      : t("dreamInput.analyzeButton")}
                  </span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
} 