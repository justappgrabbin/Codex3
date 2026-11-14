import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { ingest, summary, become, resolve } from '../core/file-swarm.js';
// a tiny app with a deliberate loose piece and a broken import
const files = [
  { path: 'index.html', text: '<html><head><link rel="stylesheet" href="style.css"><title>Demo</title></head><body><button id="go">Go</button><script type="module" src="./app.js"></script></body></html>' },
  { path: 'style.css', text: 'button { color: red; }\n#go { padding: 4px; }' },
  { path: 'app.js', text: "import { count, bump } from './state.js';\nimport { missing } from './nope.js';\nfunction onGo(){ bump(); document.title = String(count()); }\ndocument.getElementById('go').addEventListener('click', onGo);\nfunction neverUsed(){ return 1; }" },
  { path: 'state.js', text: 'let n = 0;\nexport function count(){ return n; }\nexport function bump(){ n += 1; }' },
];
const s = ingest(files), sm = summary(s);
assert.equal(resolve('app.js', './state.js', new Set(['state.js'])), 'state.js');
assert.ok(s.edges.some(e => e.type === 'imports' && e.to.startsWith('state.js')));
assert.ok(s.edges.some(e => e.type === 'calls' && e.to.includes('function:bump')));
assert.ok(s.orphans.some(u => u.name === 'neverUsed'), 'loose piece found');
assert.ok(s.brokenImports.some(u => u.name === './nope.js'), 'broken import found');
assert.deepEqual(sm.entries, ['index.html']);
assert.equal(s.units.find(u => u.name === 'bump').dimension, 'Evolution');
assert.equal(s.units.find(u => u.kind === 'rule').dimension, 'Design');
let made = 0; const html = become(s, 'index.html', (t, m) => `blob:${++made}:${m}`);
assert.ok(/href="blob:\d+:text\/css"/.test(html) && /src="blob:\d+:text\/javascript"/.test(html), html);
// real code: this repo's own core/ folder
const core = readdirSync('core').filter(f => f.endsWith('.js')).map(f => ({ path: 'core/' + f, text: readFileSync('core/' + f, 'utf8') }));
const r = summary(ingest(core));
assert.ok(r.units > 200 && r.edges > 100, JSON.stringify(r));
console.log('file-swarm ok', sm.byDimension, '| repo core:', r);
import { channels, proposals } from '../core/file-swarm.js';
const ch = channels(s);
const kinds = new Set(ch.channels.map(c => c.kind));
for (const k of ['module', 'wire', 'style', 'file']) assert.ok(kinds.has(k), 'channel kind ' + k + ' ' + JSON.stringify(ch.channels));
assert.ok(ch.channels.some(c => c.kind === 'module' && c.key === 'bump' && c.out === 'state.js' && c.in === 'app.js'));
const pr = proposals(s, ch).map(p => p.text);
assert.ok(pr.some(t => t.includes('missing') && t.includes('nope.js')), pr.join('\n'));
assert.ok(pr.some(t => t.includes('"missing" is imported')), pr.join('\n'));
assert.ok(ch.centers.every(c => c.defined));
console.log('channels ok:', ch.channels.length, 'channels,', ch.hanging.length, 'hanging\n ' + pr.join('\n '));
