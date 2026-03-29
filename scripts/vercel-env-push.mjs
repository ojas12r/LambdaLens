import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const envPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const lines = envContent.split(/\r?\n/);
for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  
  const match = trimmed.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let val = match[2].trim();
    
    // Remove inline comments
    if (val.includes(' #')) {
      val = val.split(' #')[0].trim();
    }
    // Remove quotes if present
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    
    console.log(`Adding ${key}...`);
    try {
      // Write value to a temp file
      fs.writeFileSync('.vercel-temp-val', val);
      // Execute command
      // We pass the file as stdin using <
      // Windows shell compatibility:
      // Execute command for each environment
      const envs = ['production', 'preview', 'development'];
      for (const env of envs) {
        execSync(`npx vercel env add ${key} ${env} < .vercel-temp-val`, {
          stdio: 'inherit',
          shell: true,
        });
      }
    } catch (e) {
      console.error(`Failed to add ${key}:`, e.message);
    }
  }
}
fs.unlinkSync('.vercel-temp-val');
console.log('Done passing env vars to Vercel.');
