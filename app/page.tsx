"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslation } from "@/contexts/LanguageContext"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { DemographicsForm } from "@/components/DemographicsForm"
import DreamInputSection from "@/components/page/DreamInputSection"
import AnalyzingSection from "@/components/page/AnalyzingSection"
import AnalysisResults from "@/components/page/results/analysis-results"
import { useDreamAnalysis } from "@/hooks/useDreamAnalysis"
import { useMousePosition } from "@/hooks/useMousePosition"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import dynamic from 'next/dynamic'
import ParticleBackground from "@/components/ParticleBackground"

const SettingsButton = dynamic(() => import("@/components/SettingsButton"), { ssr: false })

const MouseGlow = React.memo(({ mousePosition }: { mousePosition: { x: number; y: number } }) => (
  <div
    className="absolute w-96 h-96 bg-gradient-to-r from-premium-accent-electric/4 to-premium-accent-purple/4 rounded-full blur-3xl pointer-events-none"
    style={{
      left: mousePosition.x - 192,
      top: mousePosition.y - 192,
      transition: "all 0.3s ease-out",
    }}
  />
))

MouseGlow.displayName = 'MouseGlow'

export default function HomePage() {
  const { t, language } = useTranslation()
  const { mousePosition } = useMousePosition()

  const {
    dreamText,
    setDreamText,
    dreamTime,
    setDreamTime,
    isAnalyzing,
    analysisResult,
    analysisBundle,
    currentStep,
    showDreamInput,
    setShowDreamInput,
    showDemographics,
    setShowDemographics,
    demographics,
    setDemographics,
    scientificResults,
    advancedAnalysis,
    quantitativeResult,
    remAnalysis,
    continuityAnalysis,
    emotionAnalysisResult,
    isAdvancedAnalysisLoading,
    analysisSteps,
    history,
    analyzeDream,
    resetAnalysis,
    loadAnalysis,
    fetchHistory,
  } = useDreamAnalysis()

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-app-gradient relative overflow-hidden">
        <MouseGlow mousePosition={mousePosition} />

        <ParticleBackground />

        <div className="relative z-10">
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-6"
          >
            <div className="flex items-center gap-4">
              {/* Brand Section with Icon */}
              <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                {/* Animated Icon */}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  className="w-12 h-12 relative"
                >
                  {/* Outer rotating circle */}
                  <motion.div
                    className="absolute inset-0 rounded-full border border-cyan-400/30"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  />
                  
                  {/* Inner rotating circle */}
                  <motion.div
                    className="absolute inset-1 rounded-full border border-purple-400/40"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                  />
                  
                  {/* Glow effect */}
                  <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400/20 via-purple-400/20 to-cyan-400/20 blur-sm"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                  />
                  
                  {/* Static star icon */}
                  <div className="relative z-10 w-full h-full flex items-center justify-center">
                    <img
                      src="/dreamium-icon.svg"
                      alt="Dreamium Logo"
                      className="w-full h-full filter drop-shadow-lg"
                    />
                  </div>
                </motion.div>

                {/* Text */}
                <div className="space-y-1">
                  <h1 className="text-3xl font-light tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-200 bg-clip-text text-transparent">
                    {t("title")}
                  </h1>
                  <p className="text-slate-300/80 text-sm font-medium tracking-wider uppercase">
                    {t("tagline")}
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Controls */}
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <LanguageSwitcher />
              <SettingsButton />
            </motion.div>
          </motion.header>

          {/* Main Content */}
          <main className="px-6 pb-6">
            <AnimatePresence mode="wait">
              {showDemographics && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <DemographicsForm
                    onComplete={(data) => {
                      setDemographics(data);
                      setShowDemographics(false);
                    }}
                    onSkip={() => setShowDemographics(false)}
                    isOptional={true}
                  />
                </motion.div>
              )}

              {!showDemographics && showDreamInput && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <DreamInputSection
                    dreamText={dreamText}
                    setDreamText={setDreamText}
                    dreamTime={dreamTime}
                    setDreamTime={setDreamTime}
                    onAnalyze={analyzeDream}
                    isAnalyzing={isAnalyzing}
                    demographics={demographics}
                    setShowDemographics={setShowDemographics}
                    language={language}
                    t={t}
                    history={history}
                    loadAnalysis={loadAnalysis}
                    fetchHistory={fetchHistory}
                  />
                </motion.div>
              )}

              {!showDemographics && isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <AnalyzingSection
                    currentStep={currentStep}
                    analysisSteps={analysisSteps}
                    t={t}
                  />
                </motion.div>
              )}

              {!showDemographics && analysisResult && !isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <AnalysisResults
                    bundle={analysisBundle || undefined}
                    analysisResult={analysisResult}
                    advancedAnalysis={advancedAnalysis}
                    quantitativeResult={quantitativeResult}
                    emotionAnalysisResult={emotionAnalysisResult}
                    remAnalysis={remAnalysis}
                    continuityAnalysis={continuityAnalysis}
                    scientificResults={scientificResults}
                    resetAnalysis={resetAnalysis}
                    showDreamInput={showDreamInput}
                    setShowDreamInput={setShowDreamInput}
                    t={t}
                    isAdvancedAnalysisLoading={isAdvancedAnalysisLoading}
                    demographics={demographics}
                    setShowDemographics={setShowDemographics}
                    language={language}
                  />

                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  )
}
