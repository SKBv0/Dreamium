import { getBiasConfig } from './bias-config'
import { getTranslation } from './translations'

export interface BiasAssessment {
  biasType: 'cultural' | 'gender' | 'age' | 'socioeconomic' | 'educational' | 'linguistic';
  severity: 'low' | 'moderate' | 'high' | 'critical';
  confidence: number;
  detectedPatterns: string[];
  mitigationStrategies: string[];
  adjustedResults?: any;
}

export interface DemographicContext {
  culturalBackground: string;
  gender: string;
  age: number;
  language: string;
  educationLevel: string;
  socioeconomicStatus?: string;
  religiousBackground?: string;
  urbanRural?: 'urban' | 'rural' | 'suburban';
}

export interface BiasDetectionResult {
  overallBiasRisk: 'low' | 'moderate' | 'high' | 'critical';
  detectedBiases: BiasAssessment[];
  demographicFactors: string[];
  recommendations: string[];
  adjustmentApplied: boolean;
  language: string;
}

const resolveBiasLocale = (language?: string): 'tr' | 'en' => {
  const normalized = (language || '').toLowerCase()
  if (normalized.startsWith('en')) {
    return 'en'
  }
  if (normalized.startsWith('tr')) {
    return 'tr'
  }
  return normalized ? 'en' : 'tr'
}

export class BiasDetectionEngine {
  
  /**
   * Comprehensive bias detection and mitigation
   */
  static detectAndMitigateBias(
    analysisResults: any,
    demographics: DemographicContext
  ): BiasDetectionResult {
    
    const detectedBiases: BiasAssessment[] = [];
    
    const genderBias = this.detectGenderBias(analysisResults, demographics);
    if (genderBias) detectedBiases.push(genderBias);
    
    const ageBias = this.detectAgeBias(analysisResults, demographics);
    if (ageBias) detectedBiases.push(ageBias);
    
    const educationalBias = this.detectEducationalBias(analysisResults, demographics);
    if (educationalBias) detectedBiases.push(educationalBias);
    
    const linguisticBias = this.detectLinguisticBias(analysisResults, demographics);
    if (linguisticBias) detectedBiases.push(linguisticBias);
    
    const overallBiasRisk = this.calculateOverallBiasRisk(detectedBiases);
    
    let adjustedResults = analysisResults;
    let adjustmentApplied = false;
    
    if (overallBiasRisk !== 'low') {
      adjustedResults = this.applyBiasMitigation(analysisResults, detectedBiases, demographics);
      adjustmentApplied = true;
    }
    
    const recommendations = this.generateBiasRecommendations(detectedBiases, demographics);
    const demographicFactors = this.identifyDemographicFactors(demographics);
    
    return {
      overallBiasRisk,
      detectedBiases,
      demographicFactors,
      recommendations,
      adjustmentApplied,
      language: demographics.language ?? 'tr'
    };
  }
  
  private static detectGenderBias(
    results: any,
    demographics: DemographicContext
  ): BiasAssessment | null {
    const config = getBiasConfig()
    const detectedPatterns: string[] = [];
    let severity: 'low' | 'moderate' | 'high' | 'critical' = 'low';
    
    const emotionalThemes = results.themes?.filter((t: any) => 
      t.theme?.toLowerCase().includes('emotion') || 
      t.theme?.toLowerCase().includes('sadness') ||
      t.theme?.toLowerCase().includes('love') ||
      (demographics.language === 'turkish' ? t.theme?.toLowerCase().includes('duygu') : t.theme?.toLowerCase().includes('feeling'))
    ).length || 0;
    
    const aggressionThemes = results.themes?.filter((t: any) => 
      t.theme?.toLowerCase().includes('anger') || 
      t.theme?.toLowerCase().includes('conflict') ||
      t.theme?.toLowerCase().includes('fight') ||
      (demographics.language === 'turkish' ? t.theme?.toLowerCase().includes('öfke') : t.theme?.toLowerCase().includes('rage'))
    ).length || 0;
    
    const technicalThemes = results.themes?.filter((t: any) => 
      t.theme?.toLowerCase().includes('technology') || 
      t.theme?.toLowerCase().includes('technical') ||
      (demographics.language === 'turkish' ? t.theme?.toLowerCase().includes('teknoloji') : t.theme?.toLowerCase().includes('digital'))
    ).length || 0;
    
    if (demographics.gender === 'male') {
      if (emotionalThemes === 0 && results.emotions && Object.keys(results.emotions).length > 2) {
        detectedPatterns.push('Emotional themes potentially underrepresented in male analysis');
        severity = 'moderate';
      }
      
      if (aggressionThemes > results.themes?.length * config.thresholds.gender.aggressionThemeThreshold) {
        detectedPatterns.push('Aggression themes potentially overweighted in male analysis');
        severity = severity === 'moderate' ? 'high' : 'moderate';
      }
    }
    
    if (demographics.gender === 'female') {
      if (technicalThemes === 0 && results.dreamText?.toLowerCase().includes('technology')) {
        detectedPatterns.push('Technical themes potentially underrepresented in female analysis');
        severity = 'moderate';
      }
      
      if (emotionalThemes > results.themes?.length * config.thresholds.gender.emotionalThemeThreshold) {
        detectedPatterns.push('Emotional themes potentially overweighted in female analysis');
        severity = severity === 'moderate' ? 'high' : 'moderate';
      }
    }
    
    if (detectedPatterns.length === 0) return null;
    
    const mitigationStrategies = this.generateGenderMitigationStrategies(
      detectedPatterns, 
      demographics
    );
    
    return {
      biasType: 'gender',
      severity,
      confidence: config.detectionConfidence.gender,
      detectedPatterns,
      mitigationStrategies
    };
  }
  
  private static detectAgeBias(
    results: any,
    demographics: DemographicContext
  ): BiasAssessment | null {
    const config = getBiasConfig()
    const detectedPatterns: string[] = [];
    let severity: 'low' | 'moderate' | 'high' | 'critical' = 'low';
    
    const technologyThemes = results.themes?.filter((t: any) => 
      t.theme?.toLowerCase().includes('technology') ||
      t.theme?.toLowerCase().includes('digital') ||
      (demographics.language === 'turkish' ? t.theme?.toLowerCase().includes('teknoloji') : t.theme?.toLowerCase().includes('computer'))
    ).length || 0;
    
    const traditionThemes = results.themes?.filter((t: any) => 
      t.theme?.toLowerCase().includes('tradition') ||
      t.theme?.toLowerCase().includes('nostalgia') ||
      t.theme?.toLowerCase().includes('past') ||
      (demographics.language === 'turkish' ? t.theme?.toLowerCase().includes('gelenek') : t.theme?.toLowerCase().includes('heritage'))
    ).length || 0;
    
    if (demographics.age < config.thresholds.age.youngAdultAge) {
      if (technologyThemes > results.themes?.length * config.thresholds.age.technologyThemeThreshold) {
        detectedPatterns.push('Technology themes potentially overweighted in young adult analysis');
        severity = 'moderate';
      }
      
      if (traditionThemes === 0 && results.dreamText?.toLowerCase().includes('old')) {
        detectedPatterns.push('Traditional themes potentially underrepresented in young adult analysis');
        severity = severity === 'moderate' ? 'high' : 'moderate';
      }
    }
    
    if (demographics.age > config.thresholds.age.olderAdultAge) {
      if (technologyThemes === 0 && results.dreamText?.toLowerCase().includes('computer')) {
        detectedPatterns.push('Technology themes potentially underrepresented in older adult analysis');
        severity = 'moderate';
      }
    }
    
    if (detectedPatterns.length === 0) return null;
    
    const mitigationStrategies = this.generateAgeMitigationStrategies(
      detectedPatterns, 
      demographics
    );
    
    return {
      biasType: 'age',
      severity,
      confidence: config.detectionConfidence.age,
      detectedPatterns,
      mitigationStrategies
    };
  }
  
  private static detectEducationalBias(
    results: any,
    demographics: DemographicContext
  ): BiasAssessment | null {
    const config = getBiasConfig()
    const detectedPatterns: string[] = [];
    let severity: 'low' | 'moderate' | 'high' | 'critical' = 'low';
    
    const complexityScore = results.complexityScore || 0;
    const themeCount = results.themes?.length || 0;
    
    if (demographics.educationLevel === 'elementary' || demographics.educationLevel === 'secondary') {
      if (complexityScore > config.thresholds.educational.highComplexityThreshold && themeCount < config.thresholds.educational.lowThemeCountThreshold) {
        detectedPatterns.push('High complexity score with low theme detection may indicate educational bias');
        severity = 'moderate';
      }
    }
    
    if (demographics.educationLevel === 'university' || demographics.educationLevel === 'graduate') {
      if (complexityScore < config.thresholds.educational.lowComplexityThreshold && themeCount > config.thresholds.educational.highThemeCountThreshold) {
        detectedPatterns.push('Low complexity score with high theme detection may indicate educational bias');
        severity = 'moderate';
      }
    }
    
    if (detectedPatterns.length === 0) return null;
    
    const mitigationStrategies = [
      'Apply education-adjusted complexity scoring',
      'Use vocabulary-neutral theme detection',
      'Consider cultural education context'
    ];
    
    return {
      biasType: 'educational',
      severity,
      confidence: config.detectionConfidence.educational,
      detectedPatterns,
      mitigationStrategies
    };
  }
  
  private static detectLinguisticBias(
    results: any,
    demographics: DemographicContext
  ): BiasAssessment | null {
    const config = getBiasConfig()
    const detectedPatterns: string[] = [];
    let severity: 'low' | 'moderate' | 'high' | 'critical' = 'low';
    
    if (demographics.language !== 'turkish') {
      const turkishSpecificThemes = results.themes?.filter((t: any) => 
        t.theme?.includes('aile') || 
        t.theme?.includes('gelenek') ||
        t.theme?.includes('ruhani')
      ).length || 0;
      
      if (turkishSpecificThemes > 0) {
        detectedPatterns.push('Turkish-specific themes detected in non-Turkish analysis');
        severity = 'moderate';
      }
    }
    
    if (demographics.language === 'turkish') {
      const englishThemes = results.themes?.filter((t: any) => 
        /^[a-zA-Z\s]+$/.test(t.theme) && !t.theme.includes('ı') && !t.theme.includes('ş')
      ).length || 0;
      
      if (englishThemes > results.themes?.length * config.thresholds.linguistic.englishThemeThreshold) {
        detectedPatterns.push('Possible English-centric theme detection in Turkish analysis');
        severity = 'moderate';
      }
    }
    
    if (detectedPatterns.length === 0) return null;
    
    const mitigationStrategies = [
      'Apply language-specific theme normalization',
      'Use cross-linguistic validation',
      'Implement culture-aware translation'
    ];
    
    return {
      biasType: 'linguistic',
      severity,
      confidence: config.detectionConfidence.linguistic,
      detectedPatterns,
      mitigationStrategies
    };
  }
  
  private static calculateOverallBiasRisk(biases: BiasAssessment[]): 'low' | 'moderate' | 'high' | 'critical' {
    if (biases.length === 0) return 'low';
    
    const config = getBiasConfig()
    const severityScores = biases.map(b => {
      switch (b.severity) {
        case 'critical': return config.thresholds.risk.criticalThreshold;
        case 'high': return config.thresholds.risk.highThreshold;
        case 'moderate': return config.thresholds.risk.moderateThreshold;
        case 'low': return config.thresholds.risk.lowThreshold;
        default: return 0;
      }
    });
    
    const maxSeverity = Math.max(...severityScores);
    const avgSeverity = severityScores.reduce((a: number, b: number) => a + b, 0) / severityScores.length;
    
    if (maxSeverity >= config.thresholds.risk.criticalThreshold || avgSeverity >= config.thresholds.risk.criticalAvgThreshold) return 'critical';
    if (maxSeverity >= config.thresholds.risk.highThreshold || avgSeverity >= config.thresholds.risk.highAvgThreshold) return 'high';
    if (maxSeverity >= config.thresholds.risk.moderateThreshold || avgSeverity >= config.thresholds.risk.moderateAvgThreshold) return 'moderate';
    return 'low';
  }
  
  private static applyBiasMitigation(
    results: any,
    biases: BiasAssessment[],
    demographics: DemographicContext
  ): any {
    
    let adjustedResults = { ...results };
    
    const culturalBias = biases.find(b => b.biasType === 'cultural');
    if (culturalBias) {
      adjustedResults = this.applyCulturalCorrections(adjustedResults, demographics);
    }
    
    const genderBias = biases.find(b => b.biasType === 'gender');
    if (genderBias) {
      adjustedResults = this.applyGenderCorrections(adjustedResults, demographics);
    }
    
    const ageBias = biases.find(b => b.biasType === 'age');
    if (ageBias) {
      adjustedResults = this.applyAgeCorrections(adjustedResults, demographics);
    }
    
    if (adjustedResults.confidenceScore) {
      const config = getBiasConfig()
      adjustedResults.confidenceScore.score = Math.min(
        adjustedResults.confidenceScore.score * config.confidence.biasPenalty,
        config.confidence.maxAdjustedConfidence
      );
      adjustedResults.confidenceScore.biasAdjusted = true;
    }
    
    return adjustedResults;
  }
  
  private static applyCulturalCorrections(results: any, demographics: DemographicContext): any {
    const config = getBiasConfig()
    let adjusted = { ...results };
    
    if (demographics.culturalBackground === 'turkish' || demographics.culturalBackground === 'eastern') {
      if (adjusted.themes) {
        adjusted.themes = adjusted.themes.map((theme: any) => {
          if (theme.theme?.toLowerCase().includes('family') || (demographics.language === 'turkish' ? theme.theme?.toLowerCase().includes('aile') : theme.theme?.toLowerCase().includes('collective'))) {
            return { ...theme, confidence: Math.min(theme.confidence * config.confidence.culturalAdjustment, config.confidence.maxConfidence) };
          }
          if (theme.theme?.toLowerCase().includes('individual') || (demographics.language === 'turkish' ? theme.theme?.toLowerCase().includes('özgürlük') : theme.theme?.toLowerCase().includes('freedom'))) {
            return { ...theme, confidence: theme.confidence * config.confidence.culturalReduction };
          }
          return theme;
        });
      }
    }
    
    return adjusted;
  }
  
  private static applyGenderCorrections(results: any, demographics: DemographicContext): any {
    const config = getBiasConfig()
    let adjusted = { ...results };
    
    if (adjusted.themes) {
      adjusted.themes = adjusted.themes.map((theme: any) => {
        if (demographics.gender === 'male' && theme.theme?.toLowerCase().includes('emotion')) {
          return { ...theme, confidence: Math.min(theme.confidence * config.confidence.genderAdjustment, config.confidence.maxConfidence) };
        }
        if (demographics.gender === 'female' && theme.theme?.toLowerCase().includes('technology')) {
          return { ...theme, confidence: Math.min(theme.confidence * config.confidence.culturalAdjustment, config.confidence.maxConfidence) };
        }
        return theme;
      });
    }
    
    return adjusted;
  }
  
  private static applyAgeCorrections(results: any, demographics: DemographicContext): any {
    const config = getBiasConfig()
    let adjusted = { ...results };
    
    if (adjusted.themes) {
      adjusted.themes = adjusted.themes.map((theme: any) => {
        if (demographics.age < config.thresholds.age.youngAdultAge && theme.theme?.toLowerCase().includes('tradition')) {
          return { ...theme, confidence: Math.min(theme.confidence * config.confidence.ageAdjustment, config.confidence.maxConfidence) };
        }
        if (demographics.age > config.thresholds.age.olderAdultAge && theme.theme?.toLowerCase().includes('technology')) {
          return { ...theme, confidence: Math.min(theme.confidence * (config.confidence.ageAdjustment - 0.05), config.confidence.maxConfidence) };
        }
        return theme;
      });
    }
    
    return adjusted;
  }
  
  private static generateCulturalMitigationStrategies(
    patterns: string[], 
    demographics: DemographicContext
  ): string[] {
    const strategies: string[] = [];
    
    if (patterns.some(p => p.includes('Western individualism'))) {
      strategies.push('Apply collectivist culture adjustment to family and social themes');
      strategies.push('Increase weighting for traditional and communal values');
    }
    
    if (patterns.some(p => p.includes('spiritual'))) {
      strategies.push('Include spiritual and religious theme detection');
      strategies.push('Apply cultural-religious context to interpretation');
    }
    
    if (patterns.some(p => p.includes('Turkish cultural bias'))) {
      strategies.push('Normalize family theme weighting for non-Turkish cultures');
      strategies.push('Apply global cultural adjustment factors');
    }
    
    return strategies;
  }
  
  private static generateGenderMitigationStrategies(
    patterns: string[], 
    demographics: DemographicContext
  ): string[] {
    const strategies: string[] = [];
    
    if (patterns.some(p => p.includes('Emotional themes potentially underrepresented'))) {
      strategies.push('Apply gender-neutral emotional theme detection');
      strategies.push('Increase sensitivity to emotional content in male analysis');
    }
    
    if (patterns.some(p => p.includes('Technical themes potentially underrepresented'))) {
      strategies.push('Apply gender-neutral technical theme detection');
      strategies.push('Increase sensitivity to technical content in female analysis');
    }
    
    if (patterns.some(p => p.includes('overweighted'))) {
      strategies.push('Apply stereotype reduction normalization');
      strategies.push('Use gender-balanced reference norms');
    }
    
    return strategies;
  }
  
  private static generateAgeMitigationStrategies(
    patterns: string[], 
    demographics: DemographicContext
  ): string[] {
    const strategies: string[] = [];
    
    if (patterns.some(p => p.includes('Technology themes'))) {
      strategies.push('Apply age-neutral technology theme detection');
      strategies.push('Consider cross-generational technology use patterns');
    }
    
    if (patterns.some(p => p.includes('Traditional themes'))) {
      strategies.push('Balance modern and traditional theme detection');
      strategies.push('Apply intergenerational perspective to interpretation');
    }
    
    return strategies;
  }
  
  private static generateBiasRecommendations(
    biases: BiasAssessment[], 
    demographics: DemographicContext
  ): string[] {
    const lang = resolveBiasLocale(demographics.language);
    const recommendations: string[] = [];

    if (biases.length === 0) {
      recommendations.push(getTranslation(lang, 'biasMitigation.recommendations.noBias'));
      return recommendations;
    }

    recommendations.push(getTranslation(lang, 'biasMitigation.recommendations.adjusted'));

    if (biases.some(b => b.biasType === 'cultural')) {
      recommendations.push(getTranslation(lang, 'biasMitigation.recommendations.culturalContext'));
      recommendations.push(getTranslation(lang, 'biasMitigation.recommendations.culturalValidation'));
    }

    if (biases.some(b => b.biasType === 'gender')) {
      recommendations.push(getTranslation(lang, 'biasMitigation.recommendations.genderNeutral'));
      recommendations.push(getTranslation(lang, 'biasMitigation.recommendations.genderStereotypes'));
    }

    if (biases.some(b => b.biasType === 'age')) {
      recommendations.push(getTranslation(lang, 'biasMitigation.recommendations.ageInterpretation'));
      recommendations.push(getTranslation(lang, 'biasMitigation.recommendations.ageContext'));
    }

    const highSeverityBiases = biases.filter(b => b.severity === 'high' || b.severity === 'critical');
    if (highSeverityBiases.length > 0) {
      recommendations.push(getTranslation(lang, 'biasMitigation.recommendations.highRisk'));
      recommendations.push(getTranslation(lang, 'biasMitigation.recommendations.seekExpert'));
    }

    return recommendations;
  }


  private static identifyDemographicFactors(demographics: DemographicContext): string[] {
    const lang = resolveBiasLocale(demographics.language);
    const factors: string[] = [];

    if (demographics.culturalBackground) {
      factors.push(`${getTranslation(lang, 'biasMitigation.factors.culturalBackground')}: ${demographics.culturalBackground}`);
    }

    if (demographics.gender) {
      factors.push(`${getTranslation(lang, 'biasMitigation.factors.gender')}: ${demographics.gender}`);
    }

    if (demographics.age) {
      const config = getBiasConfig()
      let ageGroupLabel: string = getTranslation(lang, 'biasMitigation.ageGroups.unknown');
      if (demographics.age < config.ageGroups.young.max) ageGroupLabel = getTranslation(lang, 'biasMitigation.ageGroups.young');
      else if (demographics.age < config.ageGroups.adult.max) ageGroupLabel = getTranslation(lang, 'biasMitigation.ageGroups.adult');
      else if (demographics.age < config.ageGroups.middle.max) ageGroupLabel = getTranslation(lang, 'biasMitigation.ageGroups.middle');
      else ageGroupLabel = getTranslation(lang, 'biasMitigation.ageGroups.older');

      factors.push(`${getTranslation(lang, 'biasMitigation.factors.ageGroup')}: ${ageGroupLabel}`);
    }

    if (demographics.educationLevel) {
      factors.push(`${getTranslation(lang, 'biasMitigation.factors.education')}: ${demographics.educationLevel}`);
    }

    if (demographics.language) {
      factors.push(`${getTranslation(lang, 'biasMitigation.factors.language')}: ${demographics.language}`);
    }

    if (demographics.religiousBackground) {
      factors.push(`${getTranslation(lang, 'biasMitigation.factors.religiousBackground')}: ${demographics.religiousBackground}`);
    }

    if (demographics.urbanRural) {
      const envKey = demographics.urbanRural as 'urban' | 'rural' | 'suburban';
      const environmentLabel = getTranslation(lang, `biasMitigation.environments.${envKey}`) || demographics.urbanRural;
      factors.push(`${getTranslation(lang, 'biasMitigation.factors.environment')}: ${environmentLabel}`);
    }

    return factors;
  }
  
  /**
   * Generate comprehensive bias mitigation report
   */
  static generateBiasReport(result: BiasDetectionResult): string {
    const lang = resolveBiasLocale(result.language);
    let report = `${getTranslation(lang, 'biasMitigation.report.title')}\n\n`;

    report += `${getTranslation(lang, 'biasMitigation.report.overallRisk')}: ${result.overallBiasRisk.toUpperCase()}\n`;
    report += `${getTranslation(lang, 'biasMitigation.report.adjustmentApplied')}: ${result.adjustmentApplied ? getTranslation(lang, 'biasMitigation.report.yes') : getTranslation(lang, 'biasMitigation.report.no')}\n\n`;

    if (result.demographicFactors.length > 0) {
      report += `${getTranslation(lang, 'biasMitigation.report.demographicFactors')}:\n`;
      result.demographicFactors.forEach((factor, index) => {
        report += `${index + 1}. ${factor}\n`;
      });
      report += '\n';
    }

    if (result.detectedBiases.length > 0) {
      report += `${getTranslation(lang, 'biasMitigation.report.biasesDetected')}:\n`;
      result.detectedBiases.forEach((bias, index) => {
        report += `${index + 1}. ${bias.biasType.toUpperCase()} (${bias.severity})\n`;
        report += `   ${getTranslation(lang, 'biasMitigation.report.confidence')}: ${(bias.confidence * 100).toFixed(1)}%\n`;
        report += `   ${getTranslation(lang, 'biasMitigation.report.detectedPatterns')}:\n`;
        bias.detectedPatterns.forEach(pattern => {
          report += `   - ${pattern}\n`;
        });
        report += `   ${getTranslation(lang, 'biasMitigation.report.mitigationStrategies')}:\n`;
        bias.mitigationStrategies.forEach(strategy => {
          report += `   - ${strategy}\n`;
        });
        report += '\n';
      });
    }

    report += `${getTranslation(lang, 'biasMitigation.report.recommendationsHeader')}:\n`;
    result.recommendations.forEach((rec, index) => {
      report += `${index + 1}. ${rec}\n`;
    });

    report += `\n${getTranslation(lang, 'biasMitigation.report.noteHeader')}\n`;
    report += `${getTranslation(lang, 'biasMitigation.report.noteBody')}\n`;
    report += `${getTranslation(lang, 'biasMitigation.report.noteReminder')}\n`;

    return report;
  }
} 
