/**
 * API route for dream analysis orchestration
 * Provides SSR endpoint for analysis bundle generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { orchestrate } from '@/lib/analysis/orchestrator';
import { logger } from '@/lib/logger';
import { getTranslation } from '@/lib/translations';
import type { Demographics } from '@/lib/analysis/types';
import type { Language } from '@/lib/translations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dreamText, language, demographics } = body;

    // Validate required fields
    if (!dreamText || typeof dreamText !== 'string') {
      return NextResponse.json(
        { error: 'dreamText is required and must be a string' },
        { status: 400 }
      );
    }

    if (!language || typeof language !== 'string') {
      return NextResponse.json(
        { error: 'language is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate language is supported
    if (!['tr', 'en'].includes(language)) {
      return NextResponse.json(
        { error: 'language must be either "tr" or "en"' },
        { status: 400 }
      );
    }

    // Validate dream text length
    if (dreamText.length < 20) {
      return NextResponse.json(
        { error: 'dreamText must be at least 20 characters long' },
        { status: 400 }
      );
    }

    if (dreamText.length > 10000) {
      return NextResponse.json(
        { error: 'dreamText must be less than 10000 characters' },
        { status: 400 }
      );
    }

    logger.info('🎭 [API] Starting dream analysis', {
      textLength: dreamText.length,
      language,
      hasDemographics: !!demographics
    });

    // Create translation function with interpolation support
    const t = (key: string, values?: Record<string, any>): string => {
      const translation = getTranslation(language as Language, key);
      if (translation === key) {
        // Translation not found, return key
        return key;
      }
      if (values) {
        let result = translation;
        Object.keys(values).forEach(k => {
          result = result.replace(`{${k}}`, values[k]);
        });
        return result;
      }
      return translation;
    };

    // Call orchestrator
    const { bundle: analysisBundle } = await orchestrate(
      dreamText,
      language as Language,
      demographics as Demographics,
      t
    );

    logger.info('✅ [API] Dream analysis completed', {
      confidence: analysisBundle.confidence,
      hasEmotions: !!analysisBundle.emotions.labels.length,
      sleepStage: analysisBundle.sleep.stage
    });

    return NextResponse.json({
      success: true,
      data: analysisBundle
    });

  } catch (error) {
    logger.error('❌ [API] Dream analysis failed', error);
    
    return NextResponse.json(
      { 
        error: 'Analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Dream Analysis API',
    version: '1.0.0',
    endpoints: {
      POST: '/api/analyze - Analyze dream text'
    }
  });
}

