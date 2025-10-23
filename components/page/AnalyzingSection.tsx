"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Brain, Cpu, Sparkles, Zap, Activity } from "lucide-react"
import { useState, useEffect } from "react"

interface AnalyzingSectionProps {
  currentStep?: number
  analysisSteps?: string[]
  t: (key: string) => string
  isLoadingHistory?: boolean
}

const getAnalysisPhases = (t: (key: string) => string) => [
  {
    icon: Brain,
    title: t("analysisSteps.phases.dreamAnalysis"),
    description: t("analysisSteps.phaseDescriptions.dreamAnalysis"),
    color: "text-purple-400"
  },
  {
    icon: Sparkles,
    title: t("analysisSteps.phases.themeDetection"),
    description: t("analysisSteps.phaseDescriptions.themeDetection"),
    color: "text-emerald-400"
  },
  {
    icon: Zap,
    title: t("analysisSteps.phases.emotionAnalysis"),
    description: t("analysisSteps.phaseDescriptions.emotionAnalysis"),
    color: "text-yellow-400"
  },
  {
    icon: Cpu,
    title: t("analysisSteps.phases.psychologyReview"),
    description: t("analysisSteps.phaseDescriptions.psychologyReview"),
    color: "text-cyan-400"
  },
  {
    icon: Activity,
    title: t("analysisSteps.phases.creatingInsights"),
    description: t("analysisSteps.phaseDescriptions.creatingInsights"),
    color: "text-pink-400"
  }
]

export default function AnalyzingSection({
  t,
  isLoadingHistory = false,
}: AnalyzingSectionProps) {
  const [progress, setProgress] = useState(0)
  const [currentPhase, setCurrentPhase] = useState(0)

  const analysisPhases = getAnalysisPhases(t)

  // Auto-progress animation
  useEffect(() => {
    if (isLoadingHistory) return

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100
        return prev + Math.random() * 3 + 1 // Random progress between 1-4%
      })
    }, 300)

    return () => clearInterval(interval)
  }, [isLoadingHistory])

  // Phase transition
  useEffect(() => {
    const phaseDuration = 2000 // 2 seconds per phase
    const interval = setInterval(() => {
      setCurrentPhase(prev => (prev + 1) % analysisPhases.length)
    }, phaseDuration)

    return () => clearInterval(interval)
  }, [analysisPhases.length])

  const CurrentIcon = analysisPhases[currentPhase].icon

  if (isLoadingHistory) {
    return (
      <motion.div
        key="analyzing"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -30 }}
        transition={{ duration: 0.5 }}
        className="max-w-5xl mx-auto"
      >
        <div className="bg-dark-800/40 border border-dark-700/50 rounded-2xl backdrop-blur-xl p-8">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 mx-auto mb-4"
            >
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
                <Activity className="w-6 h-6 text-white animate-pulse" />
              </div>
            </motion.div>
            <h3 className="text-lg font-light text-premium-pearl mb-2">
              {t("analysisSteps.loadingHistory")}
            </h3>
            <p className="text-sm text-dark-200">
              {t("analysisSteps.loadingHistorySubtitle")}
            </p>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      key="analyzing"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.5 }}
      className="max-w-5xl mx-auto relative"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5 rounded-2xl blur-xl"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-dark-900/20 to-transparent rounded-2xl"></div>

      {/* Main Content */}
      <div className="relative bg-dark-800/50 border border-dark-700/50 rounded-2xl backdrop-blur-xl p-8 overflow-hidden">
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-premium-accent-electric/30 rounded-full"
              animate={{
                x: [0, Math.random() * 100 - 50],
                y: [0, Math.random() * 100 - 50],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2
              }}
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${20 + Math.random() * 60}%`
              }}
            />
          ))}
        </div>

        <div className="space-y-8 relative z-10">
          {/* Header */}
          <div className="text-center">
            <motion.div
              key={currentPhase}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="w-16 h-16 mx-auto mb-6"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-premium-accent-electric/20 to-premium-accent-purple/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shadow-lg">
                <CurrentIcon className={`w-8 h-8 ${analysisPhases[currentPhase].color} animate-pulse`} />
              </div>
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentPhase}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-xl font-light text-premium-pearl mb-2">
                  {analysisPhases[currentPhase].title}
                </h3>
                <p className="text-sm text-dark-200 leading-relaxed">
                  {analysisPhases[currentPhase].description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Progress Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-dark-150">
                {t("analysisSteps.progress")}
              </span>
              <span className="text-lg font-bold text-premium-accent-gold">
                {Math.round(progress)}%
              </span>
            </div>

            <div className="relative">
              <div className="w-full bg-dark-700/50 rounded-full h-3 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-premium-accent-electric via-premium-accent-gold to-premium-accent-purple rounded-full shadow-lg"
                  style={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Animated shine effect */}
              <motion.div
                className="absolute top-0 left-0 h-full w-8 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full"
                animate={{ x: ['0%', '400%'] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
              />
            </div>

            {/* Phase indicators */}
            <div className="flex justify-between mt-4">
              {analysisPhases.map((phase, index) => (
                <motion.div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index <= currentPhase ? 'bg-premium-accent-gold' : 'bg-dark-600'
                  }`}
                  animate={index === currentPhase ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 1, repeat: index === currentPhase ? Infinity : 0 }}
                />
              ))}
            </div>
          </div>

          {/* Status Messages */}
          <div className="text-center space-y-2">
            <motion.p
              className="text-xs text-dark-300 font-medium"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {t("analysisSteps.analyzingMessage")}
            </motion.p>
            <div className="flex items-center justify-center gap-1">
              <motion.div
                className="w-1 h-1 bg-premium-accent-electric rounded-full"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
              />
              <motion.div
                className="w-1 h-1 bg-premium-accent-gold rounded-full"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
              />
              <motion.div
                className="w-1 h-1 bg-premium-accent-purple rounded-full"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
} 