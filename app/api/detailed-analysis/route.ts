import { NextRequest, NextResponse } from "next/server";
import { performAdvancedDreamAnalysis } from '@/lib/advanced-dream-analysis';
import { saveAnalysis } from '@/lib/save-analysis';
import { processDreamAnalysis } from '@/lib/dream-analysis';
import { getTranslation } from '@/lib/translations';

// School names mapping
const schoolNames = {
  "jung": "Jungian",
  "freud": "Freudian", 
  "adler": "Adlerian",
  "gestalt": "Gestalt",
  "cognitive": "Cognitive"
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, school, language = 'tr' } = body;
    
    if (!text) {
      return NextResponse.json(
        { error: "Dream text is required" },
        { status: 400 }
      );
    }

    const dreamText = text.trim();
    
    if (dreamText.length < 10) {
      return NextResponse.json(
        { error: "Dream text is too short for meaningful analysis" },
        { status: 400 }
      );
    }
    const schoolName = schoolNames[school as keyof typeof schoolNames] || "Integrated";
    const schoolLimitationKey = school as keyof typeof schoolNames || "integrated";
    
    const schoolInfo = {
      name: schoolName,
      limitations: getTranslation(language, `analysisContext.schoolLimitations.${schoolLimitationKey}`) || 
                  getTranslation(language, "analysisContext.integratedApproach")
    };
    
    try {
      const textAnalysisTemplate = getTranslation(language, "analysisContext.dreamAnalyzedWith");
      const textAnalysis = textAnalysisTemplate.replace("{schoolName}", schoolInfo.name);

      // Create translation function with interpolation support for advanced analysis
      const t = (key: string, values?: Record<string, any>): string => {
        const translation = getTranslation(language, key);
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

      const advancedAnalysis = await performAdvancedDreamAnalysis(dreamText, language, t);

      const rawAnalysis = {
        dreamText,
        analysis: {
          textAnalysis,
          ...advancedAnalysis
        }
      };

      const processedAnalysis = await processDreamAnalysis(rawAnalysis, dreamText);
      await saveAnalysis(processedAnalysis);

      return NextResponse.json({ 
        success: true, 
        analysis: processedAnalysis.analysis,
        school: schoolInfo.name,
        limitations: schoolInfo.limitations
      });
    } catch (modelError) {
      if (process.env.NODE_ENV !== 'production') {
        console.error("Model error:", modelError);
      }
      return NextResponse.json(
        { error: "Failed to generate analysis" },
        { status: 500 }
      );
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error("Detailed analysis API error:", error);
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      {
        error: "Failed to process detailed analysis request",
        message: errorMessage,
        details: process.env.NODE_ENV !== 'production' ? error : undefined
      },
      { status: 500 }
    );
  }
} 
