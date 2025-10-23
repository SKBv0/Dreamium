"use client"

import React from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip)

interface MetricCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray'
  subtitle?: string
  progress?: number
  sparkline?: number[]
  badges?: Array<{ text: string; variant?: 'default' | 'outline' }>
  className?: string
}

// SectionHeader removed (unused)

interface ProgressMetricProps {
  label: string
  value: number
  max?: number
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray' | 'orange'
  showPercentage?: boolean
  className?: string
}

interface BadgeGroupProps {
  badges: Array<{ text: string; variant?: 'default' | 'outline'; color?: string }>
  title?: string
  className?: string
}

// Metric Card Component
export function MetricCard({
  label,
  value,
  icon,
  color = 'blue',
  subtitle,
  progress,
  sparkline,
  badges = [],
  className = ''
}: MetricCardProps) {
  const colorClasses = {
    blue: 'text-blue-400 border-blue-500',
    green: 'text-green-400 border-green-500',
    red: 'text-red-400 border-red-500',
    yellow: 'text-yellow-400 border-yellow-500',
    purple: 'text-purple-400 border-purple-500',
    gray: 'text-gray-400 border-gray-500'
  }

  return (
    <Card className={`card-soft card-hover hover-soft-lift ${className}`}>
      <CardContent className="p-8">
        <div className="flex items-center gap-3 mb-4">
          {icon && (
            <div className={`p-2 rounded-lg bg-${color}-500/10 border border-${color}-500/20`}>
              <span className={colorClasses[color]}>{icon}</span>
            </div>
          )}
          <span className="text-sm font-medium text-slate-300">{label}</span>
        </div>
        <div className="mb-4">
          <span className="text-4xl font-bold text-white num-mono">{value}</span>
        </div>
        {subtitle && (
          <div className="space-y-1">
            {subtitle.split(' • ').map((item, index) => (
              <p key={index} className="text-sm text-slate-400">{item}</p>
            ))}
          </div>
        )}
        {sparkline && sparkline.length > 1 && (
          <div className="mt-4 h-8">
            <Line
              data={{
                labels: sparkline.map((_, i) => `${i}`),
                datasets: [
                  {
                    data: sparkline,
                    borderColor: '#8B5CF6',
                    backgroundColor: 'rgba(139,92,246,0.2)',
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.35,
                    fill: true,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                scales: { x: { display: false }, y: { display: false } },
              }}
            />
          </div>
        )}
        {progress !== undefined && (
          <Progress value={progress} className="mt-4 h-2" />
        )}
        {badges.length > 0 && (
          <div className="flex gap-2 mt-4">
            {badges.map((badge, index) => (
              <Badge key={index} variant={badge.variant || 'outline'} className="text-xs">
                {badge.text}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Section Header Component
// (SectionHeader was unused and has been removed)

// Progress Metric Component
export function ProgressMetric({
  label,
  value,
  max = 100,
  color = 'blue',
  showPercentage = true,
  className = ''
}: ProgressMetricProps) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    gray: 'bg-gray-500'
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-300">{label}</span>
        <span className="text-sm text-white">
          {showPercentage ? `${value}%` : value}
        </span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  )
}

// Badge Group Component
export function BadgeGroup({
  badges,
  title,
  className = ''
}: BadgeGroupProps) {
  if (badges.length === 0) return null

  return (
    <div className={className}>
      {title && <h4 className="text-sm font-medium text-slate-300 mb-2">{title}</h4>}
      <div className="flex flex-wrap gap-2">
        {badges.map((badge, index) => (
          <Badge
            key={index}
            variant={badge.variant || 'outline'}
            className={badge.color ? `border-${badge.color}-500 text-${badge.color}-300` : ''}
          >
            {badge.text}
          </Badge>
        ))}
      </div>
    </div>
  )
}

// Scientific Reference Component
export function ScientificReference({
  reference,
  index
}: {
  reference: { authors: string; year: number; title: string; journal: string; finding: string }
  index: number
}) {
  return (
    <div className="p-3 bg-slate-800/20 rounded-lg border border-slate-700/50">
      <div className="text-sm font-medium text-slate-200 mb-1">
        {reference.authors} ({reference.year})
      </div>
      <div className="text-xs text-slate-400 mb-2">
        {reference.title}. <em>{reference.journal}</em>
      </div>
      <div className="text-xs text-slate-300 italic">
        &ldquo;{reference.finding}&rdquo;
      </div>
    </div>
  )
}
