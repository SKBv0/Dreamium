/**
 * Bias Mitigation Configuration Constants
 * Centralized configuration for bias detection and mitigation parameters
 */

export interface BiasConfig {
  thresholds: {
    // Gender bias thresholds
    gender: {
      emotionalThemeThreshold: number // 0.4 = 40%
      aggressionThemeThreshold: number // 0.3 = 30%
      technicalThemeThreshold: number // 0.3 = 30%
    }
    // Age bias thresholds
    age: {
      technologyThemeThreshold: number // 0.3 = 30%
      youngAdultAge: number // 30
      olderAdultAge: number // 50
    }
    // Educational bias thresholds
    educational: {
      highComplexityThreshold: number // 8
      lowComplexityThreshold: number // 4
      lowThemeCountThreshold: number // 3
      highThemeCountThreshold: number // 8
    }
    // Linguistic bias thresholds
    linguistic: {
      englishThemeThreshold: number // 0.5 = 50%
    }
    // Overall bias risk calculation
    risk: {
      criticalThreshold: number // 4
      highThreshold: number // 3
      moderateThreshold: number // 2
      lowThreshold: number // 1
      criticalAvgThreshold: number // 3
      highAvgThreshold: number // 2.5
      moderateAvgThreshold: number // 1.5
    }
  }
  // Age group definitions
  ageGroups: {
    young: { min: number; max: number; label: string }
    adult: { min: number; max: number; label: string }
    middle: { min: number; max: number; label: string }
    older: { min: number; max: number; label: string }
  }
  // Confidence adjustments
  confidence: {
    genderAdjustment: number // 1.15, 1.2
    ageAdjustment: number // 1.15, 1.1
    culturalAdjustment: number // 1.2
    culturalReduction: number // 0.9
    biasPenalty: number // 0.9
    maxConfidence: number // 0.95
    maxAdjustedConfidence: number // 75
  }
  // Detection confidence levels
  detectionConfidence: {
    gender: number // 0.65
    age: number // 0.6
    educational: number // 0.55
    linguistic: number // 0.6
  }
}

export const DEFAULT_BIAS_CONFIG: BiasConfig = {
  thresholds: {
    gender: {
      emotionalThemeThreshold: 0.4, // 40%
      aggressionThemeThreshold: 0.3, // 30%
      technicalThemeThreshold: 0.3, // 30%
    },
    age: {
      technologyThemeThreshold: 0.3, // 30%
      youngAdultAge: 30,
      olderAdultAge: 50,
    },
    educational: {
      highComplexityThreshold: 8,
      lowComplexityThreshold: 4,
      lowThemeCountThreshold: 3,
      highThemeCountThreshold: 8,
    },
    linguistic: {
      englishThemeThreshold: 0.5, // 50%
    },
    risk: {
      criticalThreshold: 4,
      highThreshold: 3,
      moderateThreshold: 2,
      lowThreshold: 1,
      criticalAvgThreshold: 3,
      highAvgThreshold: 2.5,
      moderateAvgThreshold: 1.5,
    },
  },
  ageGroups: {
    young: { min: 18, max: 24, label: 'Young Adult' },
    adult: { min: 25, max: 39, label: 'Adult' },
    middle: { min: 40, max: 59, label: 'Middle-aged' },
    older: { min: 60, max: 100, label: 'Older Adult' },
  },
  confidence: {
    genderAdjustment: 1.15,
    ageAdjustment: 1.15,
    culturalAdjustment: 1.2,
    culturalReduction: 0.9,
    biasPenalty: 0.9,
    maxConfidence: 0.95,
    maxAdjustedConfidence: 75,
  },
  detectionConfidence: {
    gender: 0.65,
    age: 0.6,
    educational: 0.55,
    linguistic: 0.6,
  },
}

/**
 * Load bias configuration from environment or use defaults
 */
export function loadBiasConfig(): BiasConfig {
  return {
    thresholds: {
      gender: {
        emotionalThemeThreshold: parseFloat(process.env.BIAS_GENDER_EMOTIONAL_THRESHOLD || DEFAULT_BIAS_CONFIG.thresholds.gender.emotionalThemeThreshold.toString()),
        aggressionThemeThreshold: parseFloat(process.env.BIAS_GENDER_AGGRESSION_THRESHOLD || DEFAULT_BIAS_CONFIG.thresholds.gender.aggressionThemeThreshold.toString()),
        technicalThemeThreshold: parseFloat(process.env.BIAS_GENDER_TECHNICAL_THRESHOLD || DEFAULT_BIAS_CONFIG.thresholds.gender.technicalThemeThreshold.toString()),
      },
      age: {
        technologyThemeThreshold: parseFloat(process.env.BIAS_AGE_TECHNOLOGY_THRESHOLD || DEFAULT_BIAS_CONFIG.thresholds.age.technologyThemeThreshold.toString()),
        youngAdultAge: parseInt(process.env.BIAS_AGE_YOUNG_ADULT || DEFAULT_BIAS_CONFIG.thresholds.age.youngAdultAge.toString()),
        olderAdultAge: parseInt(process.env.BIAS_AGE_OLDER_ADULT || DEFAULT_BIAS_CONFIG.thresholds.age.olderAdultAge.toString()),
      },
      educational: {
        highComplexityThreshold: parseInt(process.env.BIAS_EDU_HIGH_COMPLEXITY || DEFAULT_BIAS_CONFIG.thresholds.educational.highComplexityThreshold.toString()),
        lowComplexityThreshold: parseInt(process.env.BIAS_EDU_LOW_COMPLEXITY || DEFAULT_BIAS_CONFIG.thresholds.educational.lowComplexityThreshold.toString()),
        lowThemeCountThreshold: parseInt(process.env.BIAS_EDU_LOW_THEMES || DEFAULT_BIAS_CONFIG.thresholds.educational.lowThemeCountThreshold.toString()),
        highThemeCountThreshold: parseInt(process.env.BIAS_EDU_HIGH_THEMES || DEFAULT_BIAS_CONFIG.thresholds.educational.highThemeCountThreshold.toString()),
      },
      linguistic: {
        englishThemeThreshold: parseFloat(process.env.BIAS_LINGUISTIC_ENGLISH_THRESHOLD || DEFAULT_BIAS_CONFIG.thresholds.linguistic.englishThemeThreshold.toString()),
      },
      risk: {
        criticalThreshold: parseInt(process.env.BIAS_RISK_CRITICAL || DEFAULT_BIAS_CONFIG.thresholds.risk.criticalThreshold.toString()),
        highThreshold: parseInt(process.env.BIAS_RISK_HIGH || DEFAULT_BIAS_CONFIG.thresholds.risk.highThreshold.toString()),
        moderateThreshold: parseInt(process.env.BIAS_RISK_MODERATE || DEFAULT_BIAS_CONFIG.thresholds.risk.moderateThreshold.toString()),
        lowThreshold: parseInt(process.env.BIAS_RISK_LOW || DEFAULT_BIAS_CONFIG.thresholds.risk.lowThreshold.toString()),
        criticalAvgThreshold: parseFloat(process.env.BIAS_RISK_CRITICAL_AVG || DEFAULT_BIAS_CONFIG.thresholds.risk.criticalAvgThreshold.toString()),
        highAvgThreshold: parseFloat(process.env.BIAS_RISK_HIGH_AVG || DEFAULT_BIAS_CONFIG.thresholds.risk.highAvgThreshold.toString()),
        moderateAvgThreshold: parseFloat(process.env.BIAS_RISK_MODERATE_AVG || DEFAULT_BIAS_CONFIG.thresholds.risk.moderateAvgThreshold.toString()),
      },
    },
    ageGroups: {
      young: {
        min: parseInt(process.env.BIAS_AGE_GROUP_YOUNG_MIN || DEFAULT_BIAS_CONFIG.ageGroups.young.min.toString()),
        max: parseInt(process.env.BIAS_AGE_GROUP_YOUNG_MAX || DEFAULT_BIAS_CONFIG.ageGroups.young.max.toString()),
        label: process.env.BIAS_AGE_GROUP_YOUNG_LABEL || DEFAULT_BIAS_CONFIG.ageGroups.young.label,
      },
      adult: {
        min: parseInt(process.env.BIAS_AGE_GROUP_ADULT_MIN || DEFAULT_BIAS_CONFIG.ageGroups.adult.min.toString()),
        max: parseInt(process.env.BIAS_AGE_GROUP_ADULT_MAX || DEFAULT_BIAS_CONFIG.ageGroups.adult.max.toString()),
        label: process.env.BIAS_AGE_GROUP_ADULT_LABEL || DEFAULT_BIAS_CONFIG.ageGroups.adult.label,
      },
      middle: {
        min: parseInt(process.env.BIAS_AGE_GROUP_MIDDLE_MIN || DEFAULT_BIAS_CONFIG.ageGroups.middle.min.toString()),
        max: parseInt(process.env.BIAS_AGE_GROUP_MIDDLE_MAX || DEFAULT_BIAS_CONFIG.ageGroups.middle.max.toString()),
        label: process.env.BIAS_AGE_GROUP_MIDDLE_LABEL || DEFAULT_BIAS_CONFIG.ageGroups.middle.label,
      },
      older: {
        min: parseInt(process.env.BIAS_AGE_GROUP_OLDER_MIN || DEFAULT_BIAS_CONFIG.ageGroups.older.min.toString()),
        max: parseInt(process.env.BIAS_AGE_GROUP_OLDER_MAX || DEFAULT_BIAS_CONFIG.ageGroups.older.max.toString()),
        label: process.env.BIAS_AGE_GROUP_OLDER_LABEL || DEFAULT_BIAS_CONFIG.ageGroups.older.label,
      },
    },
    confidence: {
      genderAdjustment: parseFloat(process.env.BIAS_CONF_GENDER_ADJ || DEFAULT_BIAS_CONFIG.confidence.genderAdjustment.toString()),
      ageAdjustment: parseFloat(process.env.BIAS_CONF_AGE_ADJ || DEFAULT_BIAS_CONFIG.confidence.ageAdjustment.toString()),
      culturalAdjustment: parseFloat(process.env.BIAS_CONF_CULTURAL_ADJ || DEFAULT_BIAS_CONFIG.confidence.culturalAdjustment.toString()),
      culturalReduction: parseFloat(process.env.BIAS_CONF_CULTURAL_RED || DEFAULT_BIAS_CONFIG.confidence.culturalReduction.toString()),
      biasPenalty: parseFloat(process.env.BIAS_CONF_BIAS_PENALTY || DEFAULT_BIAS_CONFIG.confidence.biasPenalty.toString()),
      maxConfidence: parseFloat(process.env.BIAS_CONF_MAX || DEFAULT_BIAS_CONFIG.confidence.maxConfidence.toString()),
      maxAdjustedConfidence: parseInt(process.env.BIAS_CONF_MAX_ADJUSTED || DEFAULT_BIAS_CONFIG.confidence.maxAdjustedConfidence.toString()),
    },
    detectionConfidence: {
      gender: parseFloat(process.env.BIAS_DETECT_GENDER || DEFAULT_BIAS_CONFIG.detectionConfidence.gender.toString()),
      age: parseFloat(process.env.BIAS_DETECT_AGE || DEFAULT_BIAS_CONFIG.detectionConfidence.age.toString()),
      educational: parseFloat(process.env.BIAS_DETECT_EDUCATIONAL || DEFAULT_BIAS_CONFIG.detectionConfidence.educational.toString()),
      linguistic: parseFloat(process.env.BIAS_DETECT_LINGUISTIC || DEFAULT_BIAS_CONFIG.detectionConfidence.linguistic.toString()),
    },
  }
}

/**
 * Get bias configuration with validation
 */
export function getBiasConfig(): BiasConfig {
  const config = loadBiasConfig()
  
  // Validate thresholds (0-1 range for percentages)
  const validatePercentage = (value: number, name: string) => {
    if (value < 0 || value > 1) {
      console.warn(`Bias config ${name} out of range (0-1), using default`)
      return DEFAULT_BIAS_CONFIG.thresholds.gender.emotionalThemeThreshold
    }
    return value
  }
  
  // Validate age groups
  const validateAgeGroup = (group: { min: number; max: number; label: string }, name: string) => {
    if (group.min < 0 || group.max < group.min || group.max > 120) {
      console.warn(`Bias config age group ${name} invalid, using default`)
      return DEFAULT_BIAS_CONFIG.ageGroups.young
    }
    return group
  }
  
  // Validate confidence adjustments
  const validateConfidence = (value: number, name: string) => {
    if (value < 0.1 || value > 2.0) {
      console.warn(`Bias config ${name} out of range (0.1-2.0), using default`)
      return DEFAULT_BIAS_CONFIG.confidence.genderAdjustment
    }
    return value
  }
  
  // Apply validations
  config.thresholds.gender.emotionalThemeThreshold = validatePercentage(config.thresholds.gender.emotionalThemeThreshold, 'emotionalThemeThreshold')
  config.thresholds.gender.aggressionThemeThreshold = validatePercentage(config.thresholds.gender.aggressionThemeThreshold, 'aggressionThemeThreshold')
  config.thresholds.gender.technicalThemeThreshold = validatePercentage(config.thresholds.gender.technicalThemeThreshold, 'technicalThemeThreshold')
  config.thresholds.age.technologyThemeThreshold = validatePercentage(config.thresholds.age.technologyThemeThreshold, 'technologyThemeThreshold')
  config.thresholds.linguistic.englishThemeThreshold = validatePercentage(config.thresholds.linguistic.englishThemeThreshold, 'englishThemeThreshold')
  
  config.ageGroups.young = validateAgeGroup(config.ageGroups.young, 'young')
  config.ageGroups.adult = validateAgeGroup(config.ageGroups.adult, 'adult')
  config.ageGroups.middle = validateAgeGroup(config.ageGroups.middle, 'middle')
  config.ageGroups.older = validateAgeGroup(config.ageGroups.older, 'older')
  
  config.confidence.genderAdjustment = validateConfidence(config.confidence.genderAdjustment, 'genderAdjustment')
  config.confidence.ageAdjustment = validateConfidence(config.confidence.ageAdjustment, 'ageAdjustment')
  config.confidence.culturalAdjustment = validateConfidence(config.confidence.culturalAdjustment, 'culturalAdjustment')
  config.confidence.culturalReduction = validateConfidence(config.confidence.culturalReduction, 'culturalReduction')
  
  return config
}
