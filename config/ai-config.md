# AI Configuration

This document describes the configurable AI parameters that were previously hardcoded in `ai-dream-interpreter.ts`.

## Environment Variables

You can configure AI behavior using the following environment variables:

### Dream Interpretation Settings

- `AI_TEMPERATURE` (default: 0.85)
  - Controls creativity/randomness of AI responses
  - Range: 0.0 to 2.0
  - Higher values = more creative, lower values = more deterministic

- `AI_MAX_TOKENS` (default: 1200)
  - Maximum number of tokens in AI response
  - Range: 100 to 4000
  - Higher values = longer responses

- `AI_MIN_WORDS` (default: 350)
  - Minimum word count for dream interpretations
  - Range: 100 to 1000

- `AI_MAX_WORDS` (default: 450)
  - Maximum word count for dream interpretations
  - Must be >= AI_MIN_WORDS

### Prompt Settings

- `AI_MAX_SYSTEM_PROMPT` (default: 2000)
  - Maximum length for system prompts

- `AI_MAX_USER_PROMPT` (default: 4000)
  - Maximum length for user prompts

### Fallback Settings

- `AI_FALLBACK_ENABLED` (default: true)
  - Enable fallback interpretation when AI fails

- `AI_MAX_RETRIES` (default: 3)
  - Number of retry attempts before giving up
  - Uses exponential backoff (2^attempt seconds)

## Usage

The configuration is automatically loaded when the AI dream interpreter is used. No code changes needed - just set the environment variables.

## Example Configuration

```bash
# More creative responses
AI_TEMPERATURE=1.2
AI_MAX_TOKENS=1500

# Shorter responses
AI_MIN_WORDS=200
AI_MAX_WORDS=300

# More retries for reliability
AI_MAX_RETRIES=5
```

## Validation

The system automatically validates configuration values and falls back to defaults if invalid values are provided. Check the console logs for validation warnings.
