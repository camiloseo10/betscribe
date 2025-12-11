import fs from 'fs';
import path from 'path';

function loadEnvTxt() {
  try {
    const paths = [
      path.join(process.cwd(), 'env.txt'),
      path.join(process.cwd(), '.env.txt')
    ];
    const envPath = paths.find((p) => fs.existsSync(p));
    if (envPath) {
      const content = fs.readFileSync(envPath, 'utf8');
      const lines = content.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex > 0) {
          const key = trimmed.slice(0, eqIndex).trim();
          const value = trimmed.slice(eqIndex + 1).trim();
          if (key && !(key in process.env)) {
            process.env[key] = value;
          }
        }
      }
    }
  } catch {}
}

loadEnvTxt();
