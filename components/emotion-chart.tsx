"use client"

import { useRef, useEffect, useMemo } from "react"
import { useTranslation } from "@/contexts/LanguageContext"
import { fixTurkishMojibake } from "@/lib/text-normalize"
import { formatEmotionLabel } from "@/lib/format-emotion-label"

interface EmotionChartProps {
  emotions: Record<string, number>
}

// Define emotion colors outside component to prevent recreation
const EMOTION_COLORS: Record<string, string> = {
  joy: "#FACC15", // yellow-400
  fear: "#EF4444", // red-500
  sadness: "#60A5FA", // blue-400
  anger: "#FB923C", // orange-400
  surprise: "#A78BFA", // purple-400
  disgust: "#4ADE80", // green-400
  trust: "#34D399", // emerald-400
  anticipation: "#F472B6", // pink-400
}

export default function EmotionChart({ emotions }: EmotionChartProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const formatEmotionName = (name: string) => {
    const fixed = formatEmotionLabel(fixTurkishMojibake(name || ""))
    if (!fixed) return ""
    return fixed.charAt(0).toUpperCase() + fixed.slice(1)
  }

  const maxValue = useMemo(() => Math.max(...Object.values(emotions), 1), [emotions])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, rect.width, rect.height)

    const barHeight = 30
    const barGap = 15
    const barRadius = 6
    const labelWidth = 100
    const valueWidth = 30
    const chartWidth = rect.width - labelWidth - valueWidth - 20

    // Filter and sort emotions by value
    const emotions_arr = Object.entries(emotions)
      .filter(([_, value]) => value > 0)
      .sort((a, b) => b[1] - a[1])

    emotions_arr.forEach(([emotion, value], index) => {
      const y = index * (barHeight + barGap) + 20
      const barWidth = (value / maxValue) * chartWidth

      ctx.font = "600 14px Inter, system-ui, sans-serif"
      ctx.fillStyle = "rgba(219, 234, 254, 0.9)"
      ctx.textAlign = "left"
      ctx.fillText(formatEmotionName(emotion), 0, y + barHeight / 2 + 5)

      ctx.beginPath()
      ctx.roundRect(labelWidth, y, chartWidth, barHeight, barRadius)
      ctx.fillStyle = "rgba(255, 255, 255, 0.1)"
      ctx.fill()

      if (value > 0) {
        ctx.beginPath()
        ctx.roundRect(labelWidth, y, barWidth, barHeight, barRadius)

        const gradient = ctx.createLinearGradient(labelWidth, 0, labelWidth + barWidth, 0)
        gradient.addColorStop(0, EMOTION_COLORS[emotion] || "#FFFFFF")
        gradient.addColorStop(1, (EMOTION_COLORS[emotion] || "#FFFFFF") + "80")

        ctx.fillStyle = gradient
        ctx.fill()

        ctx.shadowColor = EMOTION_COLORS[emotion] || "#FFFFFF"
        ctx.shadowBlur = 10
        ctx.beginPath()
        ctx.roundRect(labelWidth, y, barWidth, barHeight, barRadius)
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)"
        ctx.fill()
        ctx.shadowBlur = 0
      }

      if (value > 0) {
        ctx.font = "600 14px Inter, system-ui, sans-serif"
        ctx.fillStyle = "white"
        ctx.textAlign = "left"
        ctx.fillText(value.toString(), labelWidth + barWidth + 10, y + barHeight / 2 + 5)
      }
    })

    if (emotions_arr.length === 0) {
      ctx.font = "500 16px Inter, system-ui, sans-serif"
      ctx.fillStyle = "rgba(219, 234, 254, 0.6)"
      ctx.textAlign = "center"
      ctx.fillText(t('emotions.noEmotionsDetected'), rect.width / 2, rect.height / 2)
    }
  }, [emotions, maxValue, t])

  if (Object.values(emotions).every((value) => value === 0)) {
    return (
      <div className="flex items-center justify-center h-full text-blue-100/60">
        {t('emotions.noEmotionsDetected')}
      </div>
    )
  }

  return (
    <div className="w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full" style={{ maxHeight: "100%" }} />
    </div>
  )
}
