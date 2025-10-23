import { NextRequest, NextResponse } from 'next/server'
import { getStatus, getProviderKey, getOllamaModel } from '@/lib/secure-store'
import { Ollama } from 'ollama'

type Provider = 'ollama' | 'openrouter'

function resolveProvider(req: NextRequest): Provider {
  try {
    const status = getStatus()
    const cookieSel = req.cookies.get('selected_provider')?.value as Provider | undefined
    return (status.selected as Provider) || cookieSel || 'ollama'
  } catch {
    const cookieSel = req.cookies.get('selected_provider')?.value as Provider | undefined
    return cookieSel || 'ollama'
  }
}

function resolveOpenRouterKey(): string | undefined {
  try {
    const stored = getProviderKey('openrouter')
    if (stored) {
      return stored
    }
  } catch {
    // secure store unavailable; fall back to env var
  }

  const envKey = process.env.OPENROUTER_API_KEY
  return envKey?.trim() ? envKey.trim() : undefined
}

function resolveOllamaConfig(requestedModel?: string) {
  const host = process.env.OLLAMA_HOST?.trim() || 'http://localhost:11434'

  if (requestedModel && typeof requestedModel === 'string' && requestedModel.trim().length > 0) {
    return { host, model: requestedModel.trim() }
  }

  try {
    const stored = getOllamaModel()
    if (stored && stored.trim().length > 0) {
      return { host, model: stored.trim() }
    }
  } catch {
    // secure store unavailable; continue with env/default fallback
  }

  const envModel = process.env.OLLAMA_MODEL?.trim()
  if (envModel && envModel.length > 0) {
    return { host, model: envModel }
  }
  
  // No model configured - user must select one
  throw new Error('No Ollama model configured. Please select a model in settings.')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { prompt, systemPrompt, model } = body as { prompt: string; systemPrompt?: string; model?: string }

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ success: false, error: 'Invalid prompt' }, { status: 400 })
    }

    const trimmedSystemPrompt =
      typeof systemPrompt === 'string' && systemPrompt.trim().length > 0 ? systemPrompt.trim() : undefined

    const provider = resolveProvider(req)

    if (provider === 'ollama') {
      const { host, model: modelName } = resolveOllamaConfig(model)
      const ollama = new Ollama({ host })

      try {
        const response = await ollama.generate({
          model: modelName,
          prompt,
          system: trimmedSystemPrompt,
          stream: false,
        })

        const text = response.response || ''
        return NextResponse.json({ success: true, text })
      } catch (err) {
        const message = err instanceof Error ? err.message : ''
        if (message.toLowerCase().includes('not found')) {
          return NextResponse.json(
            {
              success: false,
              error: `Ollama model "${modelName}" not found. Pull it with \"ollama pull ${modelName}\" or update the configured model.`,
            },
            { status: 400 }
          )
        }
        
        if (message.includes('No Ollama model configured')) {
          return NextResponse.json(
            {
              success: false,
              error: 'No Ollama model configured. Please select a model in settings.',
            },
            { status: 400 }
          )
        }

        throw err
      }
    }

    if (provider === 'openrouter') {
      const apiKey = resolveOpenRouterKey()
      if (!apiKey) {
        return NextResponse.json({ success: false, error: 'No API key configured for OpenRouter' }, { status: 400 })
      }

      const savedModel = getProviderKey('openrouter_model') || 'anthropic/claude-3.5-sonnet'
      const modelToUse = model || savedModel

      const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelToUse,
          messages: [
            ...(trimmedSystemPrompt ? [{ role: 'system' as const, content: trimmedSystemPrompt }] : []),
            { role: 'user' as const, content: prompt }
          ],
          temperature: 0.7,
        }),
      })

      if (!resp.ok) {
        const errText = await resp.text()
        return NextResponse.json({ success: false, error: `OpenRouter error: ${errText}` }, { status: resp.status || 500 })
      }

      const data = await resp.json()
      const text = data.choices?.[0]?.message?.content || ''
      return NextResponse.json({ success: true, text })
    }

    return NextResponse.json({ success: false, error: 'Unsupported provider' }, { status: 400 })
  } catch (e: unknown) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('AI Generate API Error:', e)
    }
    const errorMessage = e instanceof Error ? e.message : 'Internal server error'
    const errorStack = e instanceof Error ? e.stack : undefined
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV !== 'production' ? errorStack : undefined,
      },
      { status: 500 }
    )
  }
}
