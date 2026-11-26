// EARLIER ATTEMPT (kept, not the organism): a side pipeline with its own search. Superseded by morphogenesis.js, which runs the same cycle on the organism's own builder. runHost/observe/discover here are still used by hosts.js.
// lifecycle.js — Enter → Observe → Discover → Experiment → Construct → Test → Learn → Clone → Integrate → Extract → Reuse
// (user's spec, Nov 22). No neural network: toolmaking by trying arrangements of the swarm's own primitive and keeping what works.
// Domain built so every step is CHECKED, not claimed: the host is a set of JS files; a missing function is one the host
// imports/calls but nothing defines, and the host's own asserts say what it must do. The primitive is the swarm's bond
// operator, NAND (functionally complete), one swarm unit per gate; an arrangement is a NAND circuit made of units.
// Limits (stated, not hidden): Boolean functions (0/1 inputs and output), up to MAX_GATES gates; a small module loader
// that handles `import {a} from './x.js'`, `export function`, `export const` — enough to run hosts like these, not all JS.
export const LIFE = { MAX_GATES: 6, MAX_INPUTS: 3 };

// ---------- OBSERVE: what the host has, what it imports, what it promises (asserts) ----------
export function observe(host) {
  const defined = new Map(), imports = [], asserts = [];
  for (const f of host) {
    for (const m of f.text.matchAll(/export\s+(?:function|const|let)\s+([A-Za-z_$][\w$]*)/g)) defined.set(m[1], f.path);
    for (const m of f.text.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g))
      for (const n of m[1].split(",").map(s => s.trim()).filter(Boolean)) imports.push({ name: n, from: m[2], in: f.path });
    for (const m of f.text.matchAll(/assert\(\s*([A-Za-z_$][\w$]*)\(([^)]*)\)\s*===\s*([01]|true|false)\s*\)/g))
      asserts.push({ name: m[1], args: m[2].split(",").map(s => +(/true|1/.test(s.trim()))), out: +(/true|1/.test(m[3])), in: f.path });
  }
  return { files: host.map(f => f.path), defined, imports, asserts };
}

// ---------- DISCOVER: imported or asserted, defined nowhere, with cases that say what it must do ----------
export function discover(obs) {
  const names = new Set([...obs.imports.map(i => i.name), ...obs.asserts.map(a => a.name)].filter(n => !obs.defined.has(n)));
  return [...names].map(name => { const cases = obs.asserts.filter(a => a.name === name), arity = Math.max(0, ...cases.map(c => c.args.length));
    const imp = obs.imports.find(i => i.name === name); return { name, arity, cases, path: imp ? resolve(imp.in, imp.from) : `${name}.js` }; })
    .filter(n => n.cases.length && n.arity >= 1 && n.arity <= LIFE.MAX_INPUTS);
}
export const resolve = (from, rel) => { const base = from.split("/").slice(0, -1); for (const p of rel.split("/")) { if (p === "." || !p) continue; if (p === "..") base.pop(); else base.push(p); } return base.join("/"); };
export const signature = need => need.arity + ":" + need.cases.map(c => c.args.join("") + ">" + c.out).sort().join(",");

// ---------- EXPERIMENT / CONSTRUCT / TEST: arrangements of NAND units, smallest first ----------
/** A circuit: gates[i] = [a, b] indices into (inputs ++ earlier gates); output = last gate. */
// A gate is [a, b] (NAND) or [a, b, op] where op is a learned 2-input arrangement used as ONE unit: learned solutions
// become parts of bigger constructions.
export const runCircuit = (gates, ins, ops = {}) => { const v = [...ins];
  for (const [a, b, op] of gates) v.push(op ? runSolution(ops[op], [v[a], v[b]], ops) : +!(v[a] && v[b])); return v[v.length - 1]; };
const runSolution = (sol, ins, ops) => sol.wire !== undefined ? ins[sol.wire] : runCircuit(sol.gates, ins, ops);
export const passes = (gates, cases, ops = {}) => cases.every(c => runCircuit(gates, c.args, ops) === c.out);
export function experiment(need, maxGates = LIFE.MAX_GATES, learned = {}) {
  const opNames = [null, ...Object.keys(learned)];
  let tried = 0;
  if (need.arity === 1 || true) { /* a wire alone: output = an input, needs no gate */
    for (let i = 0; i < need.arity; i++) { tried++; if (need.cases.every(c => c.args[i] === c.out)) return { gates: [], wire: i, tried }; } }
  for (let g = 1; g <= maxGates; g++) {
    const gates = []; let found = null;
    const rec = k => { if (found) return; if (k === g) { tried++; if (passes(gates, need.cases, learned)) found = gates.map(x => [...x]); return; }
      const n = need.arity + k; for (const op of opNames) for (let a = 0; a < n; a++) for (let b = a; b < n; b++) { gates.push(op ? [a, b, op] : [a, b]); rec(k + 1); gates.pop(); if (found) return; } };
    rec(0); if (found) return { gates: found, tried, uses: [...new Set(found.map(x => x[2]).filter(Boolean))] };
  }
  return { gates: null, tried };
}

// ---------- CLONE: the arrangement written out as its own units, standalone (no swarm needed to run) ----------
export function cloneModule(name, arity, sol, learned = {}) {
  const ins = Array.from({ length: arity }, (_, i) => String.fromCharCode(97 + i)), v = [...ins], lines = [];
  if (sol.wire !== undefined) return `// grown by the swarm: ${name} = input ${ins[sol.wire]} (no gate needed)\nexport function ${name}(${ins.join(", ")}) { return ${ins[sol.wire]} ? 1 : 0; }\n`;
  const helpers = [];
  for (const op of new Set(sol.gates.map(g => g[2]).filter(Boolean))) helpers.push(cloneModule(`__${op}`, 2, learned[op], learned).replace(/^\/\/.*\n/, "").replace("export function", "function"));
  sol.gates.forEach(([a, b, op], i) => { lines.push(op ? `  const g${i} = __${op}(${v[a]}, ${v[b]});   // unit ${i}: learned '${op}'` : `  const g${i} = (${v[a]} && ${v[b]}) ? 0 : 1;   // unit ${i}: NAND`); v.push(`g${i}`); });
  if (helpers.length) return `// grown by the swarm from ${sol.gates.length} unit(s), some of them learned arrangements; standalone\n${helpers.join("")}export function ${name}(${ins.join(", ")}) {\n${lines.join("\n")}\n  return ${v[v.length - 1]};\n}\n`;
  return `// grown by the swarm from ${sol.gates.length} NAND unit(s); standalone — no swarm code is needed to run it\nexport function ${name}(${ins.join(", ")}) {\n${lines.join("\n")}\n  return ${v[v.length - 1]};\n}\n`;
}

// ---------- INTEGRATE / VERIFY: run the host's own asserts with a small loader (host files only) ----------
export function runHost(host, { entry } = {}) {
  const files = new Map(host.map(f => [f.path, f.text])), cache = new Map(), failures = [];
  const load = path => { if (cache.has(path)) return cache.get(path); const src = files.get(path); if (src === undefined) throw new Error("missing module " + path);
    const exp = {}; cache.set(path, exp); const deps = [];
    let body = src.replace(/import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"];?/g, (_, n, from) => { deps.push([n, resolve(path, from)]); return ""; })
      .replace(/export\s+function\s+([\w$]+)/g, (_, n) => `__exp.${n} = ${n}; function ${n}`).replace(/export\s+(const|let)\s+([\w$]+)/g, (_, k, n) => `${k} ${n}`);
    const names = [...src.matchAll(/export\s+(?:const|let)\s+([\w$]+)/g)].map(m => m[1]);
    const pre = deps.map(([n, p]) => `const {${n}} = __load(${JSON.stringify(p)});`).join("\n");
    new Function("__exp", "__load", "assert", pre + "\n" + body + "\n" + names.map(n => `__exp.${n} = ${n};`).join("\n"))(exp, load,
      (ok, ...rest) => { if (!ok) failures.push({ in: path }); });
    return exp; };
  try { for (const f of host) load(f.path); return { ok: failures.length === 0, failures, error: null, ...(entry ? { exports: load(entry) } : {}) }; }
  catch (e) { return { ok: false, failures, error: String(e.message ?? e) }; }
}

/** Learned 2-input arrangements, by name, usable as single units in new constructions. */
export const learnedOps = lib => Object.fromEntries(Object.values(lib.entries).filter(e => e.arity === 2).map(e => [e.name, e.solution]));

// ---------- the whole lifecycle; `units` are real swarm units that stand in as the gates while it is built ----------
export function lifecycle(host, library = { entries: {} }, units = []) {
  const report = { steps: [] }, step = (name, data) => report.steps.push({ step: name, ...data });
  const before = runHost(host); step("enter", { hostRuns: before.ok, error: before.error });
  const obs = observe(host); step("observe", { files: obs.files.length, defines: obs.defined.size, imports: obs.imports.length, asserts: obs.asserts.length });
  const needs = discover(obs); step("discover", { missing: needs.map(n => `${n.name}/${n.arity} (${n.cases.length} cases)`) });
  let out = host.map(f => ({ ...f })); const built = [];
  for (const need of needs) {
    const sig = signature(need), known = library.entries[sig];
    let sol, from;
    if (known) { sol = known.solution; from = "reused"; known.uses++; step("reuse", { name: need.name, learnedAs: known.name, gates: sol.gates?.length ?? 0 }); }
    else { const r = experiment(need, LIFE.MAX_GATES, learnedOps(library)); step("experiment", { name: need.name, tried: r.tried, found: !!r.gates || r.wire !== undefined });
      if (!r.gates && r.wire === undefined) { step("fail", { name: need.name, reason: `no arrangement of ≤ ${LIFE.MAX_GATES} NAND units meets its asserts` }); continue; }
      sol = r; from = "constructed"; }
    if (!passes(sol.gates ?? [], need.cases, learnedOps(library)) && sol.wire === undefined) { step("fail", { name: need.name, reason: "did not pass its own test" }); continue; }
    step("test", { name: need.name, cases: need.cases.length, passed: true });
    const gateUnits = units.slice(0, sol.gates?.length ?? 0).map(u => u.id); units.slice(0, gateUnits.length).forEach((u, i) => u.role = { builds: need.name, gate: i });
    const code = cloneModule(need.name, need.arity, sol, learnedOps(library)); step("clone", { name: need.name, units: gateUnits, lines: code.split("\n").length });
    const exists = out.find(f => f.path === need.path);
    if (exists) exists.text += "\n" + code; else out.push({ path: need.path, text: code, grown: true });
    built.push({ need, sol, code, sig, from });
  }
  const after = runHost(out); step("integrate", { hostRuns: after.ok, error: after.error, failures: after.failures.length });
  // EXTRACT: the gate units leave; the host is run again with nothing of the swarm attached
  for (const u of units) delete u.role;
  const clean = out.map(f => ({ path: f.path, text: f.text }));
  const alone = runHost(clean); step("extract", { hostRunsWithoutSwarm: alone.ok, swarmCodeInHost: clean.some(f => /living\.js|organism|swarm\./.test(f.text)) });
  // LEARN: only what worked inside the host is kept
  if (alone.ok) for (const b of built) if (b.from === "constructed") library.entries[b.sig] = { name: b.need.name, arity: b.need.arity, solution: b.sol, builtFrom: b.sol.uses ?? [], learnedIn: host.map(f => f.path), uses: 0 };
  step("learn", { library: Object.keys(library.entries).length });
  return { host: clean, ok: alone.ok, report, library };
}
