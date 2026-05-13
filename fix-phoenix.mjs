import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const phoenixPkgPath = join(process.cwd(), 'node_modules/@supabase/phoenix/package.json');

try {
  const pkg = JSON.parse(readFileSync(phoenixPkgPath, 'utf8'));
  if (pkg.exports && pkg.exports.import) {
    pkg.exports.import.default = './priv/static/phoenix.mjs';
    pkg.module = './priv/static/phoenix.mjs';
    writeFileSync(phoenixPkgPath, JSON.stringify(pkg, null, 2));
    console.log('Fixed @supabase/phoenix exports');
  }
} catch (e) {
  // Ignore if file not found or error
}