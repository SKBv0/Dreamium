# Bias Mitigation Configuration

This document describes how previously hardcoded values in `bias-mitigation.ts` have been made configurable.

## Environment Variables

You can configure bias detection and mitigation behavior using the following environment variables:

### Gender Bias Thresholds

- `BIAS_GENDER_EMOTIONAL_THRESHOLD` (default: 0.4)
  - Threshold for emotional themes in female analysis
  - Range: 0.0-1.0 (as percentage)

- `BIAS_GENDER_AGGRESSION_THRESHOLD` (default: 0.3)
  - Threshold for aggression themes in male analysis
  - Range: 0.0-1.0 (as percentage)

- `BIAS_GENDER_TECHNICAL_THRESHOLD` (default: 0.3)
  - Threshold for technical themes
  - Range: 0.0-1.0 (as percentage)

### Age Bias Thresholds

- `BIAS_AGE_TECHNOLOGY_THRESHOLD` (default: 0.3)
  - Threshold for technology themes
  - Range: 0.0-1.0 (as percentage)

- `BIAS_AGE_YOUNG_ADULT` (default: 30)
  - Young adult age boundary
  - Range: 18-50

- `BIAS_AGE_OLDER_ADULT` (default: 50)
  - Older adult age boundary
  - Range: 40-80

### Educational Bias Thresholds

- `BIAS_EDU_HIGH_COMPLEXITY` (default: 8)
  - High complexity score threshold
  - Range: 5-15

- `BIAS_EDU_LOW_COMPLEXITY` (default: 4)
  - Low complexity score threshold
  - Range: 1-10

- `BIAS_EDU_LOW_THEMES` (default: 3)
  - Low theme count threshold
  - Range: 1-10

- `BIAS_EDU_HIGH_THEMES` (default: 8)
  - High theme count threshold
  - Range: 5-20

### Linguistic Bias Thresholds

- `BIAS_LINGUISTIC_ENGLISH_THRESHOLD` (default: 0.5)
  - Threshold for English theme detection
  - Range: 0.0-1.0 (as percentage)

### Risk Calculation Thresholds

- `BIAS_RISK_CRITICAL` (default: 4)
  - Critical risk threshold
- `BIAS_RISK_HIGH` (default: 3)
  - High risk threshold
- `BIAS_RISK_MODERATE` (default: 2)
  - Moderate risk threshold
- `BIAS_RISK_LOW` (default: 1)
  - Low risk threshold
- `BIAS_RISK_CRITICAL_AVG` (default: 3.0)
  - Critical average risk threshold
- `BIAS_RISK_HIGH_AVG` (default: 2.5)
  - High average risk threshold
- `BIAS_RISK_MODERATE_AVG` (default: 1.5)
  - Moderate average risk threshold

### Age Group Definitions

- `BIAS_AGE_GROUP_YOUNG_MIN` (default: 18)
- `BIAS_AGE_GROUP_YOUNG_MAX` (default: 24)
- `BIAS_AGE_GROUP_YOUNG_LABEL` (default: "Young Adult")
- `BIAS_AGE_GROUP_ADULT_MIN` (default: 25)
- `BIAS_AGE_GROUP_ADULT_MAX` (default: 39)
- `BIAS_AGE_GROUP_ADULT_LABEL` (default: "Adult")
- `BIAS_AGE_GROUP_MIDDLE_MIN` (default: 40)
- `BIAS_AGE_GROUP_MIDDLE_MAX` (default: 59)
- `BIAS_AGE_GROUP_MIDDLE_LABEL` (default: "Middle-aged")
- `BIAS_AGE_GROUP_OLDER_MIN` (default: 60)
- `BIAS_AGE_GROUP_OLDER_MAX` (default: 100)
- `BIAS_AGE_GROUP_OLDER_LABEL` (default: "Older Adult")

### Confidence Adjustments

- `BIAS_CONF_GENDER_ADJ` (default: 1.15)
  - Gender adjustment multiplier
- `BIAS_CONF_AGE_ADJ` (default: 1.15)
  - Age adjustment multiplier
- `BIAS_CONF_CULTURAL_ADJ` (default: 1.2)
  - Cultural adjustment multiplier
- `BIAS_CONF_CULTURAL_RED` (default: 0.9)
  - Cultural reduction multiplier
- `BIAS_CONF_BIAS_PENALTY` (default: 0.9)
  - Bias penalty multiplier
- `BIAS_CONF_MAX` (default: 0.95)
  - Maximum confidence score
- `BIAS_CONF_MAX_ADJUSTED` (default: 75)
  - Maximum adjusted confidence score

### Detection Confidence Levels

- `BIAS_DETECT_GENDER` (default: 0.65)
  - Gender detection confidence level
- `BIAS_DETECT_AGE` (default: 0.6)
  - Age detection confidence level
- `BIAS_DETECT_EDUCATIONAL` (default: 0.55)
  - Educational detection confidence level
- `BIAS_DETECT_LINGUISTIC` (default: 0.6)
  - Linguistic detection confidence level

## Usage

Configuration is automatically loaded when the bias mitigation system is used. No code changes needed - just set the required environment variables.

## Example Configuration

```bash
# More sensitive gender detection
BIAS_GENDER_EMOTIONAL_THRESHOLD=0.3
BIAS_GENDER_AGGRESSION_THRESHOLD=0.25

# Broader age groups
BIAS_AGE_GROUP_YOUNG_MAX=29
BIAS_AGE_GROUP_ADULT_MAX=44

# Higher education thresholds
BIAS_EDU_HIGH_COMPLEXITY=10
BIAS_EDU_LOW_COMPLEXITY=3

# Lower risk tolerance
BIAS_RISK_HIGH_AVG=2.0
BIAS_RISK_MODERATE_AVG=1.2
```

## Validation

The system automatically validates configuration values and falls back to defaults for invalid values. Check console logs for validation warnings.

## Important Notes

- Percentage values should be in 0.0-1.0 range
- Age groups should be in logical ranges (min < max)
- Confidence adjustments should be in 0.1-2.0 range
- Risk thresholds should be in ascending order (low < moderate < high < critical)
