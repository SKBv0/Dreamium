import { NextRequest, NextResponse } from 'next/server'
import { Ollama } from 'ollama'

export async function GET(_req: NextRequest) {
  try {
    const ollama = new Ollama({
      host: 'http://localhost:11434'
    })
    
    const models = await ollama.list()
    
    return NextResponse.json({ 
      success: true, 
      models: models.models?.map(model => ({
        name: model.name,
        size: model.size,
        modified_at: model.modified_at
      })) || []
    })
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Ollama models fetch error:', error)
    }
    return NextResponse.json({
      success: false,
      error: 'Ollama connection error. Is Ollama running?',
      models: []
    }, { status: 500 })
  }
}
