import { mkdir, readFile, writeFile } from 'node:fs/promises';

const url = process.env.SUPABASE_URL?.trim() || '';
const key = process.env.SUPABASE_PUBLISHABLE_KEY?.trim() || '';
if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url)) {
  throw new Error('Configura SUPABASE_URL con la URL HTTPS de tu proyecto Supabase.');
}
let legacyAnon = false;
try {
  const payload = JSON.parse(Buffer.from(key.split('.')[1] || '', 'base64url').toString());
  legacyAnon = key.split('.').length === 3 && payload.role === 'anon' &&
    payload.ref === new URL(url).hostname.split('.')[0] && payload.exp * 1000 > Date.now();
} catch {}
if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key) && !legacyAnon) {
  throw new Error('Configura SUPABASE_PUBLISHABLE_KEY con una clave publicable o anon del proyecto (nunca una clave secreta).');
}
const html = await readFile('identifica-tu-estilo-de-liderazgo.html', 'utf8');
const config = `window.SURVEY_CONFIG = ${JSON.stringify({url, key}).replaceAll('<', '\\u003c')};\n`;
await mkdir('dist', {recursive: true});
await writeFile('dist/index.html', html);
await writeFile('dist/identifica-tu-estilo-de-liderazgo.html', html);
await writeFile('dist/config.js', config);
console.log('Encuesta generada en dist/ para Vercel.');
