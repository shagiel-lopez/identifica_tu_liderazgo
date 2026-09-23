import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';

const html = readFileSync('identifica-tu-estilo-de-liderazgo.html', 'utf8');
const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];
function setup(configured = true) {
  const nodes = new Map();
  for (const [,id] of html.matchAll(/id="([^"]+)"/g)) {
    const classes = new Set();
    nodes.set(id, {value:'', textContent:'', innerHTML:'', disabled:false, style:{}, handlers:{},
      classList: {add:c=>classes.add(c), remove:c=>classes.delete(c), contains:c=>classes.has(c)},
      addEventListener(event, fn) {this.handlers[event] = fn;}});
  }
  const calls = [];
  let fail = false;
  const db = {rpc: async (method, data) => {
    calls.push({method, data});
    return fail ? {error: new Error('offline')} : {data: {total:601, counts:Array(16).fill(100)}, error:null};
  }};
  const context = vm.createContext({
    window: {SURVEY_CONFIG: configured ? {url:'https://test.supabase.co',key:'sb_publishable_test'} : undefined,
      supabase: {createClient:()=>db}, scrollTo:()=>{}},
    document: {getElementById:id=>nodes.get(id), querySelectorAll:()=>[], hidden:false},
    crypto:{randomUUID}, setInterval:()=>{},
  });
  vm.runInContext(script, context);
  return {nodes, calls, run:code=>vm.runInContext(code,context), fail:value=>{fail=value;}};
}
test('sin configuración, la encuesta muestra resultados y no falla al registrar botones', () => {
  const s = setup(false);
  s.run('answers = Array(16).fill(3); showResults();');
  assert.match(s.nodes.get('podium').innerHTML, /Transformacional/);
  assert.equal(s.nodes.get('share-btn').disabled, true);
});
test('envío fallido reintenta el mismo UUID; éxito bloquea duplicados; repetir reinicia', async () => {
  const s = setup();
  s.run('answers = Array(16).fill(2); showResults();');
  const share = s.nodes.get('share-btn');
  s.fail(true);
  await share.handlers.click();
  assert.equal(share.disabled, false);
  s.fail(false);
  await share.handlers.click();
  assert.equal(s.calls[0].data.p_id, s.calls[1].data.p_id);
  assert.equal(share.disabled, true);
  await share.handlers.click();
  assert.equal(s.calls.length, 2);
  s.nodes.get('retake-btn').handlers.click();
  assert.equal(share.disabled, false);
  s.run('answers = Array(16).fill(1); showResults();');
  await share.handlers.click();
  assert.notEqual(s.calls[2].data.p_id, s.calls[1].data.p_id);
});
test('mapa usa agregados y permite más de 500 respuestas', async () => {
  const s = setup();
  await s.run('loadGroup()');
  assert.equal(s.calls[0].method, 'leadership_summary');
  assert.equal(s.nodes.get('group-count').textContent, 601);
  s.fail(true);
  await s.run('loadGroup()');
  assert.match(s.nodes.get('group-empty').textContent, /No se pudo/);
  s.run('renderGroup({total:0, counts:Array(16).fill(0)})');
  assert.match(s.nodes.get('group-empty').textContent, /Todavía no hay/);
});
