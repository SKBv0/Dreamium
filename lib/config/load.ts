import { BundleSchemaV1, ConfigBundle } from './schema_v1';
import fs from 'fs';
import path from 'path';

interface ActiveConfig {
  availableLocales: string[];
  defaultLocale: string;
}

export function loadConfigBundle(locale?: string): ConfigBundle {
  const configDir = path.join(process.cwd(), 'config');
  
  // Active config'i oku
  let activeConfig: ActiveConfig;
  try {
    const activeConfigPath = path.join(configDir, 'active.json');
    const activeConfigRaw = fs.readFileSync(activeConfigPath, 'utf-8');
    activeConfig = JSON.parse(activeConfigRaw);
  } catch (error) {
    console.warn('active.json not found, using default config');
    activeConfig = {
      availableLocales: ['tr'],
      defaultLocale: 'tr'
    };
  }
  
  // Locale belirle
  const targetLocale = locale || activeConfig.defaultLocale;
  
  // Load pattern file
  const bundlePath = path.join(configDir, `patterns.${targetLocale}.json`);
  
  if (!fs.existsSync(bundlePath)) {
    throw new Error(
      `Pattern file not found: patterns.${targetLocale}.json\n` +
      `Available locales: ${activeConfig.availableLocales.join(', ')}`
    );
  }
  
  const raw = fs.readFileSync(bundlePath, 'utf-8');
  const parsed = JSON.parse(raw);
  
  const validated = BundleSchemaV1.parse(parsed);
  
  // Locale consistency check
  if (validated.locale !== targetLocale) {
    throw new Error(
      `Locale mismatch: requested "${targetLocale}" ` +
      `but patterns.${targetLocale}.json says "${validated.locale}"`
    );
  }
  
  console.log(`✓ Loaded bundle: patterns.${targetLocale}.json`);
  return validated;
}

export function getAvailableLocales(): string[] {
  const configDir = path.join(process.cwd(), 'config');
  
  try {
    const activeConfigPath = path.join(configDir, 'active.json');
    const activeConfigRaw = fs.readFileSync(activeConfigPath, 'utf-8');
    const activeConfig: ActiveConfig = JSON.parse(activeConfigRaw);
    return activeConfig.availableLocales;
  } catch (error) {
    console.warn('active.json not found, returning default locales');
    return ['tr'];
  }
}