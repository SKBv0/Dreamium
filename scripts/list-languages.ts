import { getAvailableLocales } from '../lib/config/load';
import fs from 'fs';
import path from 'path';

const configDir = path.join(process.cwd(), 'config');

console.log('\n📚 Available Languages:\n');

try {
  const availableLocales = getAvailableLocales();
  
  for (const locale of availableLocales) {
    const filePath = path.join(configDir, `patterns.${locale}.json`);
    
    if (fs.existsSync(filePath)) {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const patternCount = content.patterns?.length || 0;
      
      console.log(`  ✓ ${locale} (${patternCount} patterns) → config/patterns.${locale}.json`);
    } else {
      console.log(`  ✗ ${locale} → config/patterns.${locale}.json (FILE NOT FOUND)`);
    }
  }
  
  // Template dosyası kontrolü
  const templatePath = path.join(configDir, 'patterns.template.json');
  if (fs.existsSync(templatePath)) {
    console.log(`\n📋 Template available → config/patterns.template.json`);
  }
  
  console.log(`\n💡 To add a new language:`);
  console.log(`   1. cp config/patterns.template.json config/patterns.NEWLANG.json`);
  console.log(`   2. Edit patterns.NEWLANG.json (replace CHANGE_ME, FEAR_WORDS_HERE, etc.)`);
  console.log(`   3. Add "NEWLANG" to config/active.json availableLocales array`);
  console.log(`   4. npm run validate-config`);
  
} catch (error: any) {
  console.error(`✗ Error: ${error.message}`);
  process.exit(1);
}
