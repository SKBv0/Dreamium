import { loadConfigBundle, getAvailableLocales } from '../lib/config/load';
import fs from 'fs';
import path from 'path';

try {
  console.log('🔍 Validating language configuration...\n');
  
  // Available locales'i kontrol et
  const availableLocales = getAvailableLocales();
  console.log(`✓ Available locales: ${availableLocales.join(', ')}`);
  
  // Her locale için validation
  let totalErrors = 0;
  
  for (const locale of availableLocales) {
    console.log(`\n📋 Validating ${locale}...`);
    
    try {
      const bundle = loadConfigBundle(locale);
      
      console.log(`  ✓ Bundle version: ${bundle.bundleVersion}`);
      console.log(`  ✓ Locale: ${bundle.locale}`);
      console.log(`  ✓ Patterns: ${bundle.patterns.length}`);
      
      // Regex safety check (ReDoS protection) - Basic validation
      let unsafeCount = 0;
      for (const pattern of bundle.patterns) {
        if (pattern.regex) {
          // Basic regex validation - check for catastrophic backtracking patterns
          const dangerousPatterns = [
            /\(\?\=.*\*/,  // Positive lookahead with *
            /\(\?\=.*\+/,  // Positive lookahead with +
            /\(\?\=.*\{.*,.*\}/,  // Positive lookahead with quantifiers
            /\(\?\=.*\?.*\*/,  // Positive lookahead with ?*
            /\(\?\=.*\?.*\+/,  // Positive lookahead with ?+
          ];
          
          for (const dangerousPattern of dangerousPatterns) {
            if (dangerousPattern.test(pattern.regex)) {
              console.error(`  ✗ Potentially unsafe regex in pattern "${pattern.id}": ${pattern.regex}`);
              unsafeCount++;
              break;
            }
          }
        }
      }
      
      if (unsafeCount > 0) {
        throw new Error(`Found ${unsafeCount} unsafe regex patterns (ReDoS risk)`);
      }
      
      console.log('  ✓ All regex patterns are safe');
      
      // Template değerleri kontrol et
      const bundlePath = path.join(process.cwd(), 'config', `patterns.${locale}.json`);
      const rawContent = fs.readFileSync(bundlePath, 'utf-8');
      
      const templateValues = ['CHANGE_ME', 'FEAR_WORDS_HERE', 'ANXIETY_WORDS_HERE', 'JOY_WORDS_HERE', 'LOVE_WORDS_HERE', 'ANGER_WORDS_HERE', 'SADNESS_WORDS_HERE', 'AWE_WORDS_HERE', 'CALM_WORDS_HERE', 'HUMAN_WORDS_HERE', 'ANIMAL_WORDS_HERE', 'FRIENDLY_WORDS_HERE', 'AGGRESSIVE_WORDS_HERE', 'SEXUAL_WORDS_HERE', 'INDOOR_WORDS_HERE', 'OUTDOOR_WORDS_HERE', 'SUCCESS_WORDS_HERE', 'FAILURE_WORDS_HERE'];
      for (const templateValue of templateValues) {
        if (rawContent.includes(templateValue)) {
          throw new Error(
            `Template placeholder found: "${templateValue}"\n` +
            `Please replace all placeholders in patterns.${locale}.json`
          );
        }
      }
      
      console.log('  ✓ No template placeholders found');
      
    } catch (error: any) {
      console.error(`  ✗ Validation failed for ${locale}: ${error.message}`);
      totalErrors++;
    }
  }
  
  if (totalErrors > 0) {
    throw new Error(`Validation failed for ${totalErrors} locale(s)`);
  }
  
  console.log('\n🎉 All locales validated successfully!');
  process.exit(0);
  
} catch (error: any) {
  console.error(`\n✗ Validation failed: ${error.message}`);
  process.exit(1);
}
