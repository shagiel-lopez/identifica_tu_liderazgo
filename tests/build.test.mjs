import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';

test('build bloquea configuración ausente y secretos; acepta publicable o anon', () => {
  const build = (url, key) => spawnSync(process.execPath, ['scripts/build.mjs'], {
    env:{...process.env, SUPABASE_URL:url, SUPABASE_PUBLISHABLE_KEY:key}, encoding:'utf8'
  });
  assert.notEqual(build('', '').status, 0);
  assert.notEqual(build('https://test.supabase.co', 'sb_secret_not_allowed').status, 0);
  const jwt = role => 'e30.' + Buffer.from(JSON.stringify({role,ref:'test',exp:4102444800})).toString('base64url') + '.test';
  assert.notEqual(build('https://test.supabase.co', jwt('service_role')).status, 0);
  assert.equal(build('https://test.supabase.co', jwt('anon')).status, 0);
  assert.equal(build('https://test.supabase.co', 'sb_publishable_test').status, 0);
  assert.equal(readFileSync('dist/index.html','utf8'), readFileSync('identifica-tu-estilo-de-liderazgo.html','utf8'));
  assert.match(readFileSync('dist/config.js','utf8'), /window.SURVEY_CONFIG/);
});
