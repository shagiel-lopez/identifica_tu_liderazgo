import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';

test('SQL: permisos, validación, reintentos y agregados de todas las respuestas', async () => {
  const db = new PGlite();
  try {
    await db.exec('create role anon; create role authenticated;');
    const schema = readFileSync('supabase/schema.sql', 'utf8');
    await db.exec(schema);
    await db.exec(schema); // Aplicarlo de nuevo no destruye datos ni falla.
    await db.exec('set role anon');
    const submit = 'select public.submit_leadership_response($1,$2,$3::integer[])';
    const id = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
    await db.query(submit, [id, 'Nombre privado', Array(16).fill(3)]);
    await db.query(submit, [id, 'Nombre privado', Array(16).fill(3)]);
    let result = (await db.query('select public.leadership_summary() as value')).rows[0].value;
    assert.equal(result.total, 1);
    assert.deepEqual(result.counts, [1,1,1,...Array(13).fill(0)]);
    assert.equal(JSON.stringify(result).includes('Nombre privado'), false);
    for (const bad of [null, [], [1], Array(16).fill(4), [...Array(15).fill(2),null]]) {
      await assert.rejects(db.query(submit, [id, null, bad]));
    }
    await assert.rejects(db.query(submit, [id, 'x'.repeat(121), Array(16).fill(1)]));
    for (const sql of [
      'select * from public.leadership_responses',
      'delete from public.leadership_responses',
      "update public.leadership_responses set nombre = 'test'",
      "insert into public.leadership_responses(id,scores) values(gen_random_uuid(),array_fill(1,array[16]))"
    ]) await assert.rejects(db.exec(sql), /permission denied/);
    await db.exec(`select public.submit_leadership_response(gen_random_uuid(),null,array_fill(0,array[16])) from generate_series(1,501);`);
    result = (await db.query('select public.leadership_summary() as value')).rows[0].value;
    assert.equal(result.total, 502);
    assert.deepEqual(result.counts.slice(0,3), [502,502,502]);
    await db.exec('reset role; set role authenticated;');
    await assert.rejects(db.exec('select * from public.leadership_responses'), /permission denied/);
    assert.equal((await db.query('select public.leadership_summary() as value')).rows[0].value.total, 502);
  } finally { await db.close(); }
});
