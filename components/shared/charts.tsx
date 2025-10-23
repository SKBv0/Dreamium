"use client"

import React from 'react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts'
import { useTranslation } from '@/contexts/LanguageContext'

interface SharedChartProps {
  data: any[]
  height?: number
  colors?: string[]
  showGrid?: boolean
  className?: string
}

interface RadarChartProps extends SharedChartProps {
  dataKey?: string
  angleKey?: string
  domain?: [number, number]
  tickCount?: number
}

interface BarChartProps extends SharedChartProps {
  dataKey?: string
  xDataKey?: string
  yDataKey?: string
  layout?: 'horizontal' | 'vertical'
  showXAxis?: boolean
  showYAxis?: boolean
  showGrid?: boolean
  domain?: [number, number]
}

interface PieChartProps extends SharedChartProps {
  dataKey?: string
  nameKey?: string
  innerRadius?: number
  outerRadius?: number
  label?: boolean
}

interface LineChartProps extends SharedChartProps {
  dataKey?: string
  xDataKey?: string
  showDots?: boolean
  strokeWidth?: number
}

// Optimized Radar Chart Component
export function OptimizedRadarChart({
  data,
  height = 350,
  dataKey = 'score',
  angleKey = 'type',
  domain = [0, 100],
  tickCount = 6,
  className = ''
}: RadarChartProps) {
  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={data}>
          <PolarGrid stroke="rgba(201,168,255,0.3)" />
          <PolarAngleAxis 
            tick={{ 
              fontSize: 12, 
              fill: '#E8EAF2',
              fontWeight: 500
            }} 
          />
          <PolarRadiusAxis
            angle={0}
            domain={domain}
            tick={{ 
              fontSize: 11, 
              fill: '#C9A8FF',
              fontWeight: 400
            }}
            tickCount={tickCount}
          />
          <Radar
            name="Score"
            dataKey={dataKey}
            stroke="#C9A8FF"
            fill="#C9A8FF"
            fillOpacity={0.3}
            strokeWidth={3}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Optimized Bar Chart Component
export function OptimizedBarChart({
  data,
  height = 250,
  dataKey = 'value',
  xDataKey = 'name',
  layout = 'vertical',
  showXAxis = true,
  showYAxis = true,
  showGrid = false,
  domain,
  className = ''
}: BarChartProps) {
  const { language } = useTranslation();
  const intensityLabel = language === 'tr' ? 'Yoğunluk (%)' : 'Intensity (%)';

  if (layout === 'horizontal') {
    return (
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} layout="horizontal">
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,168,255,0.2)" />}
            <XAxis
              type="number"
              domain={domain}
              tick={{
                fontSize: 12,
                fill: '#E8EAF2',
                fontWeight: 500
              }}
              tickFormatter={(value) => Math.round(value).toString()}
              label={{
                value: intensityLabel,
                position: 'insideBottom',
                offset: -5,
                style: { textAnchor: 'middle', fill: '#C9A8FF', fontSize: 12 }
              }}
            />
            <YAxis 
              dataKey={xDataKey} 
              type="category" 
              tick={{ 
                fontSize: 12, 
                fill: '#E8EAF2',
                fontWeight: 500
              }} 
            />
            <Bar 
              dataKey={dataKey} 
              radius={[0, 6, 6, 0]} 
              fill="#C9A8FF"
              stroke="#8B5CF6"
              strokeWidth={1}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,168,255,0.2)" />}
          {showXAxis && (
            <XAxis 
              dataKey={xDataKey} 
              tick={{ 
                fontSize: 12, 
                fill: '#E8EAF2',
                fontWeight: 500
              }} 
            />
          )}
          {showYAxis && (
            <YAxis
              domain={domain}
              tick={{
                fontSize: 12,
                fill: '#E8EAF2',
                fontWeight: 500
              }}
              tickFormatter={(value) => Math.round(value).toString()}
              label={{
                value: intensityLabel,
                angle: -90,
                position: 'insideLeft',
                style: { textAnchor: 'middle', fill: '#C9A8FF', fontSize: 12 }
              }}
            />
          )}
          <Bar 
            dataKey={dataKey} 
            radius={[6, 6, 0, 0]} 
            fill="#C9A8FF"
            stroke="#8B5CF6"
            strokeWidth={1}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Optimized Pie Chart Component
export function OptimizedPieChart({
  data,
  height = 300,
  dataKey = 'value',
  nameKey = 'name',
  innerRadius = 80,
  outerRadius = 120,
  label = false,
  className = ''
}: PieChartProps) {
  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            dataKey={dataKey}
            label={label ? ({ name, value }) => `${name}: ${value}` : false}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.fill || (index % 2 === 0 ? '#C9A8FF' : '#F59E0B')} 
                stroke="#8B5CF6"
                strokeWidth={2}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// Optimized Line Chart Component
export function OptimizedLineChart({
  data,
  height = 250,
  dataKey = 'value',
  xDataKey = 'name',
  showDots = true,
  strokeWidth = 3,
  className = ''
}: LineChartProps) {
  const { language } = useTranslation();
  const intensityLabel = language === 'tr' ? 'Yoğunluk (%)' : 'Intensity (%)';

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,168,255,0.2)" />
          <XAxis
            dataKey={xDataKey}
            tick={{
              fontSize: 12,
              fill: '#E8EAF2',
              fontWeight: 500
            }}
          />
          <YAxis
            tick={{
              fontSize: 12,
              fill: '#E8EAF2',
              fontWeight: 500
            }}
            tickFormatter={(value) => Math.round(value).toString()}
            label={{
              value: intensityLabel,
              angle: -90,
              position: 'insideLeft',
              style: { textAnchor: 'middle', fill: '#C9A8FF', fontSize: 12 }
            }}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke="#C9A8FF"
            strokeWidth={strokeWidth}
            dot={showDots ? { 
              fill: '#C9A8FF', 
              r: 4,
              stroke: '#8B5CF6',
              strokeWidth: 2
            } : false}
            activeDot={{ 
              r: 6, 
              fill: '#8B5CF6',
              stroke: '#C9A8FF',
              strokeWidth: 2
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}