import { NextRequest, NextResponse } from 'next/server';
import { setProviderKey, setSelectedProvider, getStatus, setOllamaModel } from '@/lib/secure-store';

export async function GET(req: NextRequest) {
  try {
    const status = getStatus();
    // Fallback to cookie-selected provider when no secure store or secret not set
    const cookieSelected = req.cookies.get('selected_provider')?.value as 'ollama' | 'openrouter' | undefined;
    const selected = status.selected || cookieSelected;
    const hasSecret = !!process.env.KEYRING_SECRET;
    return NextResponse.json({ success: true, status: { ...status, selected, hasSecret } });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { provider, apiKey, model, selectOnly } = body as { provider: 'openrouter' | 'ollama'; apiKey?: string; model?: string; selectOnly?: boolean };

    if (!provider || !['openrouter', 'ollama'].includes(provider)) {
      return NextResponse.json({ success: false, error: 'Invalid provider' }, { status: 400 });
    }

    const hasSecret = !!process.env.KEYRING_SECRET;

    if (!selectOnly) {
      if (!hasSecret) {
        return NextResponse.json({ success: false, error: 'Server KEYRING_SECRET not configured' }, { status: 500 });
      }
      if (!apiKey || typeof apiKey !== 'string' || (provider === 'ollama' ? apiKey.trim().length < 1 : apiKey.trim().length < 3)) {
        return NextResponse.json({ success: false, error: 'Invalid apiKey' }, { status: 400 });
      }
      
      if (provider === 'ollama') {
        // For Ollama, save the model name instead of API key
        setOllamaModel(apiKey.trim());
        setProviderKey(provider, 'ollama_configured'); // Mark as configured
      } else {
        setProviderKey(provider, apiKey.trim());
        if (model) {
          setProviderKey('openrouter_model', model);
        }
      }
    }

    // Also mark as selected when saving or explicitly selecting
    const base = getStatus();
    let res = NextResponse.json({ success: true, status: { ...base, hasSecret } });
    if (hasSecret) {
      setSelectedProvider(provider);
      const st = getStatus();
      res = NextResponse.json({ success: true, status: { ...st, hasSecret } });
    } else {
      // Dev fallback: set cookie so selection works without persistence
      res.cookies.set('selected_provider', provider, { httpOnly: true, sameSite: 'lax', path: '/' });
    }
    return res;
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
