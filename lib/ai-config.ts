/**
 * AI Configuration Constants
 * Centralized configuration for AI-related parameters
 */

export interface AIConfig {
  dreamInterpretation: {
    temperature: number
    maxTokens: number
    wordCountRange: {
      min: number
      max: number
    }
  }
  prompts: {
    maxSystemPromptLength: number
    maxUserPromptLength: number
  }
  fallback: {
    enabled: boolean
    maxRetries: number
  }
}

export const DEFAULT_AI_CONFIG: AIConfig = {
  dreamInterpretation: {
    temperature: 0.85, // High for creative interpretation
    maxTokens: 1200,
    wordCountRange: {
      min: 350,
      max: 450
    }
  },
  prompts: {
    maxSystemPromptLength: 2000,
    maxUserPromptLength: 4000
  },
  fallback: {
    enabled: true,
    maxRetries: 3
  }
}

/**
 * Load AI configuration from environment or use defaults
 */
export function loadAIConfig(): AIConfig {
  return {
    dreamInterpretation: {
      temperature: parseFloat(process.env.AI_TEMPERATURE || DEFAULT_AI_CONFIG.dreamInterpretation.temperature.toString()),
      maxTokens: parseInt(process.env.AI_MAX_TOKENS || DEFAULT_AI_CONFIG.dreamInterpretation.maxTokens.toString()),
      wordCountRange: {
        min: parseInt(process.env.AI_MIN_WORDS || DEFAULT_AI_CONFIG.dreamInterpretation.wordCountRange.min.toString()),
        max: parseInt(process.env.AI_MAX_WORDS || DEFAULT_AI_CONFIG.dreamInterpretation.wordCountRange.max.toString())
      }
    },
    prompts: {
      maxSystemPromptLength: parseInt(process.env.AI_MAX_SYSTEM_PROMPT || DEFAULT_AI_CONFIG.prompts.maxSystemPromptLength.toString()),
      maxUserPromptLength: parseInt(process.env.AI_MAX_USER_PROMPT || DEFAULT_AI_CONFIG.prompts.maxUserPromptLength.toString())
    },
    fallback: {
      enabled: process.env.AI_FALLBACK_ENABLED !== 'false',
      maxRetries: parseInt(process.env.AI_MAX_RETRIES || DEFAULT_AI_CONFIG.fallback.maxRetries.toString())
    }
  }
}

/**
 * Get AI configuration with validation
 */
export function getAIConfig(): AIConfig {
  const config = loadAIConfig()
  
  // Validate temperature
  if (config.dreamInterpretation.temperature < 0 || config.dreamInterpretation.temperature > 2) {
    console.warn('AI temperature out of range (0-2), using default')
    config.dreamInterpretation.temperature = DEFAULT_AI_CONFIG.dreamInterpretation.temperature
  }
  
  // Validate max tokens
  if (config.dreamInterpretation.maxTokens < 100 || config.dreamInterpretation.maxTokens > 4000) {
    console.warn('AI max tokens out of range (100-4000), using default')
    config.dreamInterpretation.maxTokens = DEFAULT_AI_CONFIG.dreamInterpretation.maxTokens
  }
  
  // Validate word count range
  if (config.dreamInterpretation.wordCountRange.min < 100 || config.dreamInterpretation.wordCountRange.min > 1000) {
    console.warn('AI min words out of range (100-1000), using default')
    config.dreamInterpretation.wordCountRange.min = DEFAULT_AI_CONFIG.dreamInterpretation.wordCountRange.min
  }
  
  if (config.dreamInterpretation.wordCountRange.max < config.dreamInterpretation.wordCountRange.min) {
    console.warn('AI max words less than min words, using default')
    config.dreamInterpretation.wordCountRange.max = DEFAULT_AI_CONFIG.dreamInterpretation.wordCountRange.max
  }
  
  return config
}
