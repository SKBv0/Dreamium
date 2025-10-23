import { toast as sonnerToast } from 'sonner'
import { translations } from './translations'

export const toast = {
  success: (message: string, options?: any) => {
    return sonnerToast.success(message, options)
  },
  error: (message: string, options?: any) => {
    return sonnerToast.error(message, options)
  },
  info: (message: string, options?: any) => {
    return sonnerToast.info(message, options)
  },
  warning: (message: string, options?: any) => {
    return sonnerToast.warning(message, options)
  },
  default: (message: string, options?: any) => {
    return sonnerToast(message, options)
  },
  dismiss: (toastId?: string | number) => {
    return sonnerToast.dismiss(toastId)
  },
  promise: <T>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading,
      success,
      error,
    })
  },
  retry: (taskName: string, attempt: number, maxAttempts: number, language: 'tr' | 'en' = 'tr') => {
    const t = translations[language].analysisSteps.retryNotification
      .replace('{component}', taskName)
      .replace('{attempt}', attempt.toString())
      .replace('{maxAttempts}', maxAttempts.toString())

    return sonnerToast.warning(t, {
      duration: 3000,
    })
  }
}
