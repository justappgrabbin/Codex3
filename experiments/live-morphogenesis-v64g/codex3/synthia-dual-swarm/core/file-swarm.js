// File swarm: drop files in -> they break into units -> units find each other
// (imports, calls, links) -> the swarm assembles -> an entry can "become" the
// live app. Pure functions; the browser page supplies the files and blob URLs.
// Dimension rules are PROVISIONAL working rules (what a piece DOES):
//   Movement = runs (functions, handlers, scripts)
//   Evolution = changes data (mutates, sets, fetches, saves)
//   Being = holds state/data (constants, state, JSON values, classes' fields)
//   Design = structure/look (markup, styles, components, headings)
//   Space = connects (imports/exports, links, routes, index files)
import { DIMENSIONS } from './state-space-canon.js';

export const RULES_PROVISIONAL = true;
const ext = p => (p.match(/\.([a-z0-9]+)$/i)?.[1] || '').toLowerCase();
const CODE = new Set(['js', 'mjs', 'cjs', 'jsx', 'ts', 'tsx']);
const TEXTY = new Set([...CODE, 'py', 'html', 'htm', 'css', 'scss', 'json', 'md', 'txt', 'svg', 'yml', 'yaml', 'toml', 'csv', 'jsonl']);
export const isText = p => TEXTY.has(ext(p));
export const kindOf = p => { const e = ext(p);
  return CODE.has(e) ? 'code' : e === 'py' ? 'python' : ['html', 'htm'].includes(e) ? 'markup' : ['css', 'scss'].includes(e) ? 'style'
    : ['json', 'jsonl', 'yml', 'yaml', 'toml', 'csv'].includes(e) ? 'data' : ['md', 'txt'].includes(e) ? 'text'
    : /^(png|jpe?g|gif|webp|svg|ico)$/.test(e) ? 'image' : /^(mp3|wav|ogg)$/.test(e) ? 'audio' : 'other'; };

const lineOf = (text, idx) => text.slice(0, idx).split('\n').length;
function blockFrom(text, start) { // body until braces balance (good enough for JS/CSS)
  const open = text.indexOf('{', start); if (open < 0) return text.slice(start, start + 200);
  let d = 0; for (let i = open; i < text.length; i++) { if (text[i] === '{') d++; else if (text[i] === '}' && --d === 0) return text.slice(start, i + 1); }
  return text.slice(start);
}
function pyBlock(text, start) { const lines = text.slice(start).split('\n'); const ind = lines[0].match(/^\s*/)[0].length; let n = 1;
  while (n < lines.length && (lines[n].trim() === '' || lines[n].match(/^\s*/)[0].length > ind)) n++; return lines.slice(0, n).join('\n'); }

function weigh(kind, body, name = '') {
  const w = Object.fromEntries(DIMENSIONS.map(d => [d, 0])), b = body;
  if (kind === 'function' || kind === 'method' || kind === 'script') w.Movement += 1.5;
  if (kind === 'component' || kind === 'element' || kind === 'rule' || kind === 'heading') w.Design += 3;
  if (kind === 'const' || kind === 'state' || kind === 'datum' || kind === 'class') w.Being += 1.5;
  if (kind === 'import' || kind === 'export' || kind === 'link') w.Space += 3;
  if (/\b(set[A-Z]\w*|push|splice|update|save|write|delete|insert|fetch|post|put|dispatch|emit|mutate|append|assign)\b|\+\+|\+=|-=/.test(b)) w.Evolution += 2;
  if (/\b(useState|useReducer|createStore|localStorage|indexedDB|state|cache|store)\b/.test(b)) w.Being += 1;
  if (/\b(addEventListener|onclick|onClick|setInterval|requestAnimationFrame|setTimeout|async|await|run|start|loop)\b/.test(b)) w.Movement += 1;
  if (/<[A-Za-z][\w-]*[\s>]|className=|style=|\.css\b|render\(/.test(b)) w.Design += 1;
  if (/\b(import|require|route|router|href|link|connect|bridge|fetch\(\s*['"`]http)/.test(b)) w.Space += 1;
  if (/^(on|handle)[A-Z]/.test(name)) w.Movement += 1;
  if (/^[A-Z]/.test(name) && /return\s*\(?\s*</.test(b)) { w.Design += 2; }
  return w;
}
const lead = w => { const r = DIMENSIONS.slice().sort((a, b) => w[b] - w[a]); return w[r[0]] === 0 ? 'Space' : w[r[0]] === w[r[1]] ? 'Space' : r[0]; };

function unitsOfFile(f) {
  const t = f.text ?? '', k = kindOf(f.path), out = [];
  const add = (kind, name, idx, body) => { const w = weigh(kind, body, name);
    out.push({ id: `${f.path}#${kind}:${name}@${lineOf(t, idx)}`, file: f.path, kind, name, line: lineOf(t, idx), body: body.slice(0, 4000), weights: w, dimension: lead(w) }); };
  if (k === 'code') {
    for (const m of t.matchAll(/^\s*import\s+(?:[\s\S]*?from\s+)?['"]([^'"]+)['"]/gm)) add('import', m[1], m.index, m[0]);
    for (const m of t.matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g)) add('import', m[1], m.index, m[0]);
    for (const m of t.matchAll(/^\s*(?:export\s+(?:default\s+)?)?(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)/gm)) { const body = blockFrom(t, m.index); add(/return\s*\(?\s*</.test(body) && /^[A-Z]/.test(m[1]) ? 'component' : 'function', m[1], m.index, body); }
    for (const m of t.matchAll(/^\s*(?:export\s+)?class\s+([A-Za-z_$][\w$]*)/gm)) add('class', m[1], m.index, blockFrom(t, m.index));
    for (const m of t.matchAll(/^\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=\s*(async\s*)?(\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/gm)) { const body = blockFrom(t, m.index); add(/return\s*\(?\s*</.test(body) && /^[A-Z]/.test(m[1]) ? 'component' : 'function', m[1], m.index, body); }
    for (const m of t.matchAll(/^(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=\s*(?!\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>)/gm)) add('const', m[1], m.index, t.slice(m.index, m.index + 300).split('\n;')[0]);
    for (const m of t.matchAll(/^\s*export\s*\{([^}]+)\}/gm)) add('export', m[1].trim().slice(0, 40), m.index, m[0]);
  } else if (k === 'python') {
    for (const m of t.matchAll(/^\s*(?:from\s+([\w.]+)\s+import|import\s+([\w.]+))/gm)) add('import', m[1] || m[2], m.index, m[0]);
    for (const m of t.matchAll(/^(\s*)(?:async\s+)?def\s+(\w+)/gm)) add(m[1] ? 'method' : 'function', m[2], m.index, pyBlock(t, m.index));
    for (const m of t.matchAll(/^class\s+(\w+)/gm)) add('class', m[1], m.index, pyBlock(t, m.index));
    for (const m of t.matchAll(/^([A-Z_][A-Z0-9_]*)\s*=/gm)) add('const', m[1], m.index, t.slice(m.index, m.index + 200));
  } else if (k === 'markup') {
    for (const m of t.matchAll(/<script[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)) add('link', m[1], m.index, m[0]);
    for (const m of t.matchAll(/<link[^>]*\bhref=["']([^"']+)["'][^>]*>/gi)) add('link', m[1], m.index, m[0]);
    for (const m of t.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)) add('script', 'inline script', m.index, m[1]);
    for (const m of t.matchAll(/<([a-z][\w-]*)[^>]*\bid=["']([^"']+)["'][^>]*>/gi)) add('element', `${m[1]}#${m[2]}`, m.index, m[0]);
    for (const m of t.matchAll(/<(h[1-3]|title)[^>]*>([^<]{1,80})</gi)) add('heading', m[2].trim(), m.index, m[0]);
  } else if (k === 'style') {
    for (const m of t.matchAll(/^\s*([^{}@\n][^{}\n]{0,80})\{/gm)) add('rule', m[1].trim(), m.index, blockFrom(t, m.index));
  } else if (k === 'data') {
    if (ext(f.path) === 'json') { try { const j = JSON.parse(t); const keys = Array.isArray(j) ? [`[${j.length} items]`] : Object.keys(j).slice(0, 60);
      for (const key of keys) add('datum', key, 0, JSON.stringify(Array.isArray(j) ? j[0] : j[key])?.slice(0, 400) || ''); } catch { add('datum', '(invalid json)', 0, t.slice(0, 200)); } }
    else add('datum', f.path.split('/').pop(), 0, t.slice(0, 400));
  } else if (k === 'text') {
    for (const m of t.matchAll(/^#{1,3}\s+(.+)$/gm)) add('heading', m[1].trim(), m.index, t.slice(m.index, m.index + 400));
    if (!out.length) add('heading', f.path.split('/').pop(), 0, t.slice(0, 400));
  } else add('asset', f.path.split('/').pop(), 0, '');
  return out;
}

/** Resolve an import/link spec from a file to another file path we were given. */
export function resolve(from, spec, paths) {
  if (!spec || /^(https?:|data:|\/\/)/.test(spec)) return null;
  if (/^[@~]\//.test(spec)) { // project alias like @/components/x -> any file ending in components/x(.ext)
    const rest = spec.slice(2);
    for (const p of paths) for (const e of ['', '.ts', '.tsx', '.js', '.jsx', '.mjs', '/index.ts', '/index.tsx', '/index.js'])
      if (p === rest + e || p.endsWith('/' + rest + e) || p.endsWith('/' + rest.split('/').pop() + e) && rest.split('/').length === 1) return p;
    const leaf = rest.split('/').pop();
    for (const p of paths) if (p.replace(/\.\w+$/, '').split('/').pop() === leaf) return p;
    return null; }
  const dir = from.split('/').slice(0, -1);
  const parts = spec.startsWith('/') ? spec.slice(1).split('/') : [...dir, ...spec.split('/')];
  const stack = []; for (const p of parts) { if (p === '..') stack.pop(); else if (p && p !== '.') stack.push(p); }
  const base = stack.join('/');
  for (const c of [base, ...['.js', '.mjs', '.ts', '.tsx', '.jsx', '.json', '.css', '.py'].map(e => base + e), base + '/index.js', base + '/index.ts', base + '/index.tsx', base.replace(/\./g, '/') + '.py'])
    if (paths.has(c)) return c;
  // bare python module "pkg.mod" -> pkg/mod.py anywhere
  const tail = spec.replace(/\./g, '/') + '.py'; for (const p of paths) if (p.endsWith(tail)) return p;
  return null;
}

/** files: [{path, text?}] -> {files, units, edges, orphans, entries} */
export function ingest(files) {
  files = files.map(f => ({ ...f, path: f.path.replace(/^\.?\//, '') }));
  const paths = new Set(files.map(f => f.path)), units = files.flatMap(unitsOfFile), edges = [];
  const fileUnit = new Map(); // first unit per file acts as its anchor
  for (const u of units) if (!fileUnit.has(u.file)) fileUnit.set(u.file, u);
  // 1. imports/links -> the files they name
  for (const u of units) if (u.kind === 'import' || u.kind === 'link') {
    const target = resolve(u.file, u.name, paths); u.resolved = target;
    if (target && fileUnit.has(target)) edges.push({ from: u.id, to: fileUnit.get(target).id, type: 'imports' });
  }
  // 2. calls/uses: a named definition referenced in another unit's body
  const defs = units.filter(u => ['function', 'component', 'class', 'const'].includes(u.kind) && u.name.length >= 3);
  const byName = new Map(); for (const d of defs) { if (!byName.has(d.name)) byName.set(d.name, []); byName.get(d.name).push(d); }
  for (const u of units) { if (!u.body || u.kind === 'import') continue;
    const words = new Set(u.body.match(/[A-Za-z_$][\w$]{2,}/g) || []);
    for (const w of words) for (const d of byName.get(w) || []) if (d.id !== u.id && !(d.file === u.file && u.body.startsWith(d.body.slice(0, 30))))
      edges.push({ from: u.id, to: d.id, type: d.file === u.file ? 'uses' : 'calls' }); }
  // 3. same file = contained together
  const seen = new Set(); const uniq = edges.filter(e => { const k = e.from + '>' + e.to; if (seen.has(k)) return false; seen.add(k); return true; });
  const touched = new Set(uniq.flatMap(e => [e.from, e.to]));
  const importedFiles = new Set(units.filter(u => u.resolved).map(u => u.resolved));
  const orphans = units.filter(u => !touched.has(u.id) && u.kind !== 'heading' && u.kind !== 'datum' && u.kind !== 'rule' && u.kind !== 'asset');
  const brokenImports = units.filter(u => (u.kind === 'import' || u.kind === 'link') && !u.resolved && /^\.{1,2}\/|^\/(?!\/)/.test(u.name));
  const entries = files.filter(f => kindOf(f.path) === 'markup').map(f => f.path)
    .concat(files.filter(f => ['code', 'python'].includes(kindOf(f.path)) && !importedFiles.has(f.path) && /(^|\/)(main|index|app|server)\.\w+$/i.test(f.path)).map(f => f.path));
  return { files, units, edges: uniq, orphans, brokenImports, entries };
}

export function summary(s) {
  const by = Object.fromEntries(DIMENSIONS.map(d => [d, 0])); for (const u of s.units) by[u.dimension]++;
  return { files: s.files.length, units: s.units.length, edges: s.edges.length, orphans: s.orphans.length, brokenImports: s.brokenImports.length, entries: s.entries, byDimension: by };
}

/** Make an entry runnable. makeURL(text, mime) -> url (blob URLs in the browser).
 *  Local scripts, styles, images and ES-module imports are rewritten to those URLs. */
export function become(s, entry, makeURL) {
  const byPath = new Map(s.files.map(f => [f.path, f])), paths = new Set(byPath.keys()), made = new Map();
  const mime = p => ({ css: 'text/css', html: 'text/html', json: 'application/json', svg: 'image/svg+xml' }[ext(p)] || (CODE.has(ext(p)) ? 'text/javascript' : 'application/octet-stream'));
  const urlFor = (p, stack = []) => {
    if (made.has(p)) return made.get(p); const f = byPath.get(p); if (!f) return null;
    if (f.url) { made.set(p, f.url); return f.url; } // binary given as URL by the page
    let text = f.text ?? '';
    if (CODE.has(ext(p)) && !stack.includes(p)) text = text.replace(/(\bimport\s+(?:[\s\S]*?from\s+)?|\bimport\s*\(\s*|\bexport\s+[^;]*?from\s+)(['"])([^'"]+)\2/g,
      (m, pre, q, spec) => { const r = resolve(p, spec, paths); const u = r && urlFor(r, [...stack, p]); return u ? pre + q + u + q : m; });
    if (ext(p) === 'css') text = text.replace(/url\((['"]?)([^'")]+)\1\)/g, (m, q, spec) => { const r = resolve(p, spec, paths); const u = r && urlFor(r, stack); return u ? `url(${u})` : m; });
    const u = makeURL(text, mime(p)); made.set(p, u); return u;
  };
  const f = byPath.get(entry); if (!f) throw Error('no such entry ' + entry);
  if (kindOf(entry) !== 'markup') { // a script entry: wrap it in a page
    const u = urlFor(entry); return `<!doctype html><meta charset=utf-8><body><script type="module" src="${u}"></script></body>`; }
  return (f.text ?? '').replace(/(<(?:script|img|source|audio|video)[^>]*\bsrc=|<link[^>]*\bhref=)(["'])([^"']+)\2/gi,
    (m, pre, q, spec) => { const r = resolve(entry, spec, paths); const u = r && urlFor(r); return u ? pre + q + u + q : m; });
}

// ── Gates and channels ─────────────────────────────────────────────────────
// A gate is a half-connection a file offers ('out') or needs ('in').
// A channel forms when an out-gate and an in-gate with the same key meet.
// A file (center) is defined when it carries at least one channel.
// Unpaired gates hang: they are where proposals come from.
export const CHANNEL_KINDS = Object.freeze({
  module: 'export <-> import of the same name',
  wire: 'element id in markup <-> script that looks it up',
  style: 'CSS selector <-> markup that uses the class/id',
  call: 'function defined <-> function called from another file',
  file: 'file referenced <-> file present',
});

export function gatesOf(s) {
  const g = [], add = (file, kind, key, half, unit) => g.push({ file, kind, key, half, unit });
  const paths = new Set(s.files.map(f => f.path));
  for (const f of s.files) {
    const t = f.text ?? '', k = kindOf(f.path);
    if (k === 'code') {
      for (const m of t.matchAll(/export\s+(?:default\s+)?(?:async\s+)?(?:function\*?|class|const|let|var)\s+([A-Za-z_$][\w$]*)/g)) add(f.path, 'module', m[1], 'out');
      for (const m of t.matchAll(/export\s*\{([^}]+)\}/g)) for (const n of m[1].split(',')) { const name = n.trim().split(/\s+as\s+/).pop(); if (name) add(f.path, 'module', name, 'out'); }
      for (const m of t.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/g)) {
        const target = resolve(f.path, m[2], paths);
        if (!target && !/^\.{1,2}\/|^\/|^[@~]\//.test(m[2])) { add(f.path, 'package', m[2], 'in'); continue; } // outside dependency
        for (const n of m[1].split(',')) { const name = n.trim().split(/\s+as\s+/)[0]; if (name) add(f.path, 'module', name, 'in', target); } }
      for (const m of t.matchAll(/getElementById\(\s*['"]([^'"]+)['"]|querySelector(?:All)?\(\s*['"]#([\w-]+)/g)) add(f.path, 'wire', m[1] || m[2], 'in');
      for (const m of t.matchAll(/className=["']([^"']+)["']/g)) for (const c of m[1].split(/\s+/)) if (c) add(f.path, 'style', '.' + c, 'in');
      for (const m of t.matchAll(/\bid=["']([\w-]+)["']/g)) { add(f.path, 'wire', m[1], 'out'); add(f.path, 'style', '#' + m[1], 'in'); }
    }
    if (k === 'markup') {
      for (const m of t.matchAll(/\bid=["']([\w-]+)["']/g)) { add(f.path, 'wire', m[1], 'out'); add(f.path, 'style', '#' + m[1], 'in'); }
      for (const m of t.matchAll(/\bclass=["']([^"']+)["']/g)) for (const c of m[1].split(/\s+/)) if (c) add(f.path, 'style', '.' + c, 'in');
      for (const m of t.matchAll(/getElementById\(\s*['"]([^'"]+)['"]/g)) add(f.path, 'wire', m[1], 'in');
    }
    if (k === 'style') for (const m of t.matchAll(/([.#][A-Za-z_][\w-]*)/g)) if (!/^#[0-9a-f]{3,8}$/i.test(m[1])) add(f.path, 'style', m[1], 'out');
  }
  for (const u of s.units) if ((u.kind === 'import' || u.kind === 'link') && /^\.{1,2}\/|^[\w-]+\.\w+$/.test(u.name)) {
    add(u.file, 'file', u.name, 'in', u.resolved); if (u.resolved) add(u.resolved, 'file', u.name, 'out'); }
  // cross-file calls: defined in A, named in B's code
  const defs = s.units.filter(u => ['function', 'component', 'class'].includes(u.kind) && u.name.length >= 3);
  for (const d of defs) add(d.file, 'call', d.name, 'out');
  for (const e of s.edges) if (e.type === 'calls') { const to = s.units.find(u => u.id === e.to), from = s.units.find(u => u.id === e.from); if (to && from) add(from.file, 'call', to.name, 'in'); }
  // de-duplicate
  const seen = new Set(); return g.filter(x => { const k = [x.file, x.kind, x.key, x.half].join('|'); if (seen.has(k)) return false; seen.add(k); return true; });
}

export function channels(s) {
  const gates = gatesOf(s), out = [], used = new Set();
  const outs = new Map(); for (const g of gates) if (g.half === 'out') { const k = g.kind + '|' + g.key; if (!outs.has(k)) outs.set(k, []); outs.get(k).push(g); }
  for (const g of gates) if (g.half === 'in') {
    const partners = (outs.get(g.kind + '|' + g.key) || []).filter(o => g.kind === 'module' && g.unit ? o.file === g.unit : o.file !== g.file || g.kind !== 'call');
    for (const o of partners) { out.push({ kind: g.kind, key: g.key, out: o.file, in: g.file }); used.add(o); used.add(g); }
  }
  // calls/defs inside one file aren't hanging; only cross-file needs count
  const packages = [...new Set(gates.filter(g => g.kind === 'package').map(g => g.key.split('/').slice(0, g.key.startsWith('@') ? 2 : 1).join('/')))].sort();
  // a file whose classes never meet a local stylesheet is styled by a framework (Tailwind etc.)
  const localStyled = new Set(out.filter(c => c.kind === 'style').map(c => c.in));
  const utility = gates.filter(g => g.kind === 'style' && g.half === 'in' && g.key.startsWith('.') && !localStyled.has(g.file) && !used.has(g));
  const utilitySet = new Set(utility);
  const hanging = gates.filter(g => !used.has(g) && g.kind !== 'package' && !utilitySet.has(g) && !(g.kind === 'call' && g.half === 'out') && !(g.kind === 'style' && g.half === 'in' && g.key.startsWith('#')) && !(g.kind === 'style' && g.half === 'out' && /^[.#](?:hover|active)/.test(g.key)));
  const defined = new Set(out.flatMap(c => [c.out, c.in]));
  const centers = s.files.map(f => ({ file: f.path, defined: defined.has(f.path), channels: out.filter(c => c.out === f.path || c.in === f.path).length,
    hanging: hanging.filter(h => h.file === f.path).length }));
  return { gates, channels: out, hanging, centers, packages, utilityClasses: utility.length };
}

/** Proposals: each hanging gate says what would complete it. */
export function proposals(s, ch = channels(s)) {
  const say = { module: h => h.half === 'in' ? `"${h.key}" is imported in ${h.file} but no file exports it` : `${h.file} exports "${h.key}" but nothing imports it`,
    wire: h => h.half === 'in' ? `${h.file} looks for #${h.key} but no markup has that id` : `#${h.key} in ${h.file} is never wired to a script`,
    style: h => h.half === 'in' ? `${h.file} uses ${h.key} but no stylesheet defines it` : `${h.key} is styled in ${h.file} but nothing uses it`,
    file: h => `${h.file} references ${h.key} but that file is missing`, call: h => `${h.file} calls ${h.key}, which is missing` };
  return ch.hanging.map(h => ({ gate: h, text: say[h.kind](h), severity: h.half === 'in' ? 'missing' : 'unused' }))
    .sort((a, b) => (a.severity === 'missing' ? 0 : 1) - (b.severity === 'missing' ? 0 : 1));
}
