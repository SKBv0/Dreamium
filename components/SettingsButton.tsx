"use client"

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Dialog } from "@headlessui/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, ShieldCheck, Bot, RotateCcw } from 'lucide-react'
import { useTranslation } from '@/contexts/LanguageContext'
import {
  loadSystemMessagesForLanguage as readSystemMessages,
  updateSystemMessageForLanguage,
  resetSystemMessagesToDefaultForLanguage,
  type SystemMessagesConfig,
} from '@/lib/system-messages'

type Provider = 'openrouter' | 'ollama'

type ApiStatus = {
  selected?: Provider
  configured: Partial<Record<Provider, boolean>>
  hasSecret?: boolean
}

type OllamaModel = {
  name: string
  size: number
  modified_at: string
}

export default function SettingsButton() {
  const { t, language } = useTranslation()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  const [provider, setProvider] = useState<Provider>('ollama')
  const [apiKey, setApiKey] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [openRouterModel, setOpenRouterModel] = useState('meta-llama/llama-3.1-8b-instruct')
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([])
  const [status, setStatus] = useState<ApiStatus | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  const [systemMessages, setSystemMessages] = useState<SystemMessagesConfig | null>(null)
  const [editingMessage, setEditingMessage] = useState<string | null>(null)
  const [messageContent, setMessageContent] = useState('')
  const [savingSystemMessage, setSavingSystemMessage] = useState(false)

  const refreshSystemMessages = useCallback(() => {
    try {
      const messages = readSystemMessages(language as 'tr' | 'en')
      setSystemMessages(messages)
    } catch (err) {
      console.error('Failed to read system messages:', err)
    }
  }, [language])

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/keys')
      const data = await res.json()
      if (data.success) {
        setStatus(data.status)
        if (data.status.selected) {
          setProvider(data.status.selected)
        }
      }
    } catch (err) {
      console.error('Failed to load API key status:', err)
    }
  }, [])

  const loadOllamaModels = useCallback(async () => {
    try {
      const res = await fetch('/api/ollama/models')
      const data = await res.json()
      if (data.success) {
        setOllamaModels(data.models || [])
      }
    } catch (err) {
      console.error('Failed to load Ollama models:', err)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    loadStatus()
    refreshSystemMessages()
  }, [loadStatus, refreshSystemMessages])

  // Refresh system messages when language changes
  useEffect(() => {
    if (mounted) {
      refreshSystemMessages()
    }
  }, [language, refreshSystemMessages, mounted])

  useEffect(() => {
    if (provider === 'ollama') {
      loadOllamaModels()
    }
  }, [provider, loadOllamaModels])

  const configured = useCallback((p: Provider) => status?.configured?.[p], [status])

  const save = useCallback(async () => {
    setSaving(true)
    setError(null)
    setOk(null)

    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiKey: provider === 'ollama' ? selectedModel : apiKey,
          model: provider === 'openrouter' ? openRouterModel : undefined,
        }),
      })

      const data = await res.json()
      if (!data.success) {
        throw new Error(data.error || 'Failed')
      }

      setOk('settings.settingsSaved')
      setApiKey('')
      setSelectedModel('')
      setOpenRouterModel('meta-llama/llama-3.1-8b-instruct')
      setStatus(data.status)
    } catch (err: any) {
      setError(err?.message ?? String(err))
    } finally {
      setSaving(false)
    }
  }, [apiKey, provider, selectedModel, openRouterModel])

  const startEditingMessage = useCallback(
    (key: string) => {
      if (!systemMessages) return
      setEditingMessage(key)
      setMessageContent(systemMessages[key]?.content ?? '')
    },
    [systemMessages]
  )

  const cancelEditing = useCallback(() => {
    setEditingMessage(null)
    setMessageContent('')
  }, [])

  const saveSystemMessage = useCallback(
    (messageId: string, content: string) => {
      if (!systemMessages) return
      setSavingSystemMessage(true)
      try {
        updateSystemMessageForLanguage(messageId as keyof SystemMessagesConfig, language as 'tr' | 'en', { content })
        refreshSystemMessages()
        cancelEditing()
      } catch (err) {
        console.error('Error updating system message:', err)
      } finally {
        setSavingSystemMessage(false)
      }
    },
    [systemMessages, refreshSystemMessages, cancelEditing, language]
  )

  const resetSystemMessages = useCallback(() => {
    setSavingSystemMessage(true)
    try {
      resetSystemMessagesToDefaultForLanguage(language as 'tr' | 'en')
      refreshSystemMessages()
      cancelEditing()
    } catch (err) {
      console.error('Error resetting to default system messages:', err)
    } finally {
      setSavingSystemMessage(false)
    }
  }, [refreshSystemMessages, cancelEditing, language])

  const tabItems = useMemo(
    () => [
      { value: 'providers', label: t('settings.providers'), icon: <ShieldCheck className="h-4 w-4" /> },
      { value: 'system-messages', label: t('settings.systemMessages'), icon: <Bot className="h-4 w-4" /> },
    ],
    [t]
  )

  if (!mounted) {
    return null
  }

  if (status && status.hasSecret === false) {
    return null
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} className="flex items-center gap-2">
        <Settings className="h-4 w-4" />
        <span>{t('settings.button')}</span>
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />

        <div className="fixed inset-y-0 right-0 flex w-full max-w-xl overflow-y-auto">
          <Dialog.Panel className="flex-1 bg-dark-900/95 p-6 shadow-xl shadow-black/40">
          <div className="flex items-center justify-between">
            <div>
              <Dialog.Title className="text-lg font-semibold text-premium-pearl">{t('settings.title')}</Dialog.Title>
              <p className="text-sm text-dark-200">{t('settings.subtitle')}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              {t('settings.close')}
            </Button>
          </div>

          <Tabs defaultValue="providers" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              {tabItems.map(item => (
                <TabsTrigger key={item.value} value={item.value} className="flex items-center gap-2">
                  {item.icon}
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="providers" className="mt-6 space-y-6">
              <Card className="bg-dark-850/40 border-dark-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-premium-pearl">
                    {t('settings.providerSelection')}
                    {status?.selected && (
                      <Badge variant="outline" className="text-xs">
                        {t('settings.selectedProvider', { provider: status.selected })}
                      </Badge>
                    )}
                  </CardTitle>
                  <p className="text-sm text-dark-300">{t('settings.providerDescription')}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Card className={`border ${provider === 'openrouter' ? 'border-premium-accent-electric' : 'border-dark-700/60'} bg-dark-900/40`}>
                      <CardHeader>
                        <CardTitle className="text-premium-pearl text-base">OpenRouter</CardTitle>
                        <p className="text-xs text-dark-400">{t('settings.openrouterDescription')}</p>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Button
                          variant={provider === 'openrouter' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setProvider('openrouter')}
                          className="w-full"
                        >
                          {provider === 'openrouter' ? t('settings.selected') : t('settings.select')}
                        </Button>
                        {configured('openrouter') && (
                          <Badge variant="secondary" className="text-xs">
                            {t('settings.configured')}
                          </Badge>
                        )}
                      </CardContent>
                    </Card>

                    <Card className={`border ${provider === 'ollama' ? 'border-premium-accent-electric' : 'border-dark-700/60'} bg-dark-900/40`}>
                      <CardHeader>
                        <CardTitle className="text-premium-pearl text-base">Ollama</CardTitle>
                        <p className="text-xs text-dark-400">{t('settings.ollamaDescription')}</p>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Button
                          variant={provider === 'ollama' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setProvider('ollama')}
                          className="w-full"
                        >
                          {provider === 'ollama' ? t('settings.selected') : t('settings.select')}
                        </Button>
                        {configured('ollama') && (
                          <Badge variant="secondary" className="text-xs">
                            {t('settings.configured')}
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <form
                    onSubmit={event => {
                      event.preventDefault()
                      save()
                    }}
                    className="space-y-4"
                  >
                    {provider === 'ollama' ? (
                      <>
                        <label className="block text-sm font-medium text-dark-300">
                          {t('settings.model')}
                        </label>
                        <select
                          name="apiKey"
                          value={selectedModel}
                          onChange={event => setSelectedModel(event.target.value)}
                          className="w-full rounded-lg border border-dark-700/50 bg-dark-900/50 px-3 py-2 text-premium-pearl outline-none focus:border-violet-500/50"
                        >
                          <option value="">{t('settings.selectModel')}</option>
                          {ollamaModels.map(model => (
                            <option key={model.name} value={model.name}>
                              {model.name} ({(model.size / 1024 / 1024 / 1024).toFixed(1)} GB)
                            </option>
                          ))}
                        </select>
                      </>
                    ) : (
                      <>
                        <label className="block text-sm font-medium text-dark-300">
                          {t('settings.apiKey')}
                        </label>
                        <input
                          name="username"
                          type="text"
                          autoComplete="username"
                          style={{ display: 'none' }}
                          tabIndex={-1}
                        />
                        <input
                          name="apiKey"
                          type="password"
                          autoComplete="new-password"
                          value={apiKey}
                          onChange={event => setApiKey(event.target.value)}
                          placeholder="OpenRouter API Key"
                          className="w-full rounded-lg border border-dark-700/50 bg-dark-900/50 px-3 py-2 text-premium-pearl outline-none focus:border-violet-500/50"
                        />
                        
                        <label className="block text-sm font-medium text-dark-300">
                          {t('settings.model')}
                        </label>
                        <input
                          type="text"
                          value={openRouterModel}
                          onChange={event => setOpenRouterModel(event.target.value)}
                          placeholder="meta-llama/llama-3.1-8b-instruct"
                          className="w-full rounded-lg border border-dark-700/50 bg-dark-900/50 px-3 py-2 text-premium-pearl outline-none focus:border-violet-500/50"
                        />
                        <div className="text-xs text-dark-400">
                          {t('settings.openrouterModelDescription')}
                        </div>
                        <div className="text-xs text-yellow-400 bg-yellow-900/20 p-3 rounded border border-yellow-800/30">
                          <div className="font-semibold mb-2">{t('settings.privacyPolicyWarning')}</div>
                          <div className="space-y-1">
                            <div>1. <a href="https://openrouter.ai/settings/privacy" target="_blank" rel="noopener noreferrer" className="underline text-blue-300">OpenRouter Privacy Settings</a> {t('settings.privacyPolicySteps.step1')}</div>
                            <div>2. <strong>&quot;Enable free endpoints that may publish prompts&quot;</strong> {t('settings.privacyPolicySteps.step2')}</div>
                            <div>3. {t('settings.privacyPolicySteps.step3')}</div>
                            <div>4. {t('settings.privacyPolicySteps.step4')}</div>
                          </div>
                          <div className="mt-2 text-yellow-300">
                            {t('settings.privacyPolicySteps.note')}
                          </div>
                        </div>
                      </>
                    )}

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={
                          saving ||
                          (provider === 'ollama' ? selectedModel.length < 1 : apiKey.trim().length < 3)
                        }
                      >
                        {t('settings.save')}
                      </Button>
                    </div>

                    {error && <div className="text-sm text-red-400">{error}</div>}
                    {ok && <div className="text-sm text-green-400">{t(ok)}</div>}
                  </form>
                </CardContent>
              </Card>

              <div className="mt-4 text-xs text-dark-300">{t('settings.encryptionNote')}</div>
            </TabsContent>

            <TabsContent value="system-messages" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-premium-pearl">{t('settings.systemMessages')}</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetSystemMessages}
                    disabled={savingSystemMessage}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    {t('settings.resetToDefault')}
                  </Button>
                </div>

                {systemMessages &&
                  Object.entries(systemMessages).map(([key, message]) => (
                    <Card key={key} className="border-dark-700/50 bg-dark-850/40">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between text-base text-premium-pearl">
                          {message.name}
                          <Badge variant={message.isActive ? 'default' : 'secondary'}>
                            {message.isActive ? t('settings.active') : t('settings.passive')}
                          </Badge>
                        </CardTitle>
                        <p className="text-sm text-dark-300">
                          {message.description}
                        </p>
                      </CardHeader>
                      <CardContent>
                        {editingMessage === key ? (
                          <div className="space-y-3">
                            <textarea
                              value={messageContent}
                              onChange={event => setMessageContent(event.target.value)}
                              className="w-full p-3 border border-gray-300 rounded-md min-h-[200px] resize-vertical border-dark-700/50 bg-dark-900/50 text-premium-pearl"
                              placeholder={t('settings.systemMessagePlaceholder')}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => saveSystemMessage(key, messageContent)}
                                disabled={savingSystemMessage}
                              >
                                {savingSystemMessage ? t('settings.saving') : t('settings.save')}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelEditing}
                                disabled={savingSystemMessage}
                              >
                                {t('settings.cancel')}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="rounded-lg border border-dark-700/30 bg-dark-900/30 p-3">
                              <pre className="whitespace-pre-wrap font-mono text-sm text-dark-200">
                                {message.content}
                              </pre>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => startEditingMessage(key)}>
                              {t('settings.edit')}
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </Dialog.Panel>
        </div>
      </Dialog>
    </>
  )
}
