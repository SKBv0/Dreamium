"use client"

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/contexts/LanguageContext'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

// Error display component that can use hooks
function ErrorDisplay({ error, errorInfo, onReset }: { 
  error?: Error; 
  errorInfo?: ErrorInfo; 
  onReset: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-premium-black via-dark-800 to-premium-charcoal flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-dark-800/50 backdrop-blur-sm border border-dark-700/50 rounded-xl p-6 text-center">
        <div className="mb-4">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            {t('error.title')}
          </h2>
          <p className="text-dark-300 mb-4">
            {t('error.description')}
          </p>
        </div>
        
        <div className="space-y-3">
          <Button
            onClick={onReset}
            className="w-full bg-premium-accent-electric hover:bg-premium-accent-electric/80 text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('error.tryAgain')}
          </Button>
          
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="w-full border-dark-600 text-dark-300 hover:bg-dark-700"
          >
            {t('error.refreshPage')}
          </Button>
        </div>

        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-4 text-left">
            <summary className="text-sm text-dark-400 cursor-pointer hover:text-dark-300">
              {t('error.developerDetails')}
            </summary>
            <pre className="mt-2 text-xs text-red-400 bg-dark-900/50 p-2 rounded overflow-auto">
              {error.toString()}
              {errorInfo?.componentStack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
    this.setState({ error, errorInfo })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <ErrorDisplay 
          error={this.state.error} 
          errorInfo={this.state.errorInfo} 
          onReset={this.handleReset} 
        />
      )
    }

    return this.props.children
  }
}

