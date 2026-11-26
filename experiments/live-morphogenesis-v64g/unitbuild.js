// unitbuild.js — the UNITS construct and select formations (user, Nov 22). The builder (primitive-swarm.js) stays available
// as a capability, used only when the units' own construction does not find it.
// How each unit takes part — all from what the unit already is:
//   LINES      a unit's lines (its hexagram as its dimension reads it) are compared bit by bit with each operation's own
//              6-bit fingerprint: the more they agree (XNOR), the more that unit is inclined to carry that operation.
//   DIMENSION  an operation the host tags with a dimension is carried more readily by units of that dimension.
//   BONDS      a unit can only use values it holds or that a unit it is BONDED to holds: dataflow travels along bonds,
//              so a formation is a chain of bonded units, each doing one step.
//   CULTURE    a unit that took part in a formation that met the requirement remembers the operation it carried
//              (u.craft); this passes to bonded units by contact, and failures weaken it.
//   CHANGING LINES  a unit that keeps trying and never contributes changes one of its lines (the one that agrees least
//              with what it carried), which changes what it is inclined to do next — adaptation by changing lines.
import { linesOf } from "./klein_local.js";

const stable = v => JSON.stringify(v, (k, x) => x && typeof x === "object" && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort()) : x);
const fnv = s => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h; };
export const fingerprint = id => Array.from({ length: 6 }, (_, i) => (fnv(id) >>> i) & 1);
export function matches(value, constraints = []) {
  return constraints.every(({ path = [], equals, includes, minimum, maximum }) => { const f = path.reduce((v, k) => v?.[k], value);
    if (equals !== undefined && stable(f) !== stable(equals)) return false;
    if (includes !== undefined && !((Array.isArray(f) || typeof f === "string") && f.includes(includes))) return false;
    if (minimum !== undefined && !(typeof f === "number" && f >= minimum)) return false;
    if (maximum !== undefined && !(typeof f === "number" && f <= maximum)) return false; return true; });
}
export function matchesGoal(value, goal) {
  return matches(value, goal.constraints) && (!goal.accept || goal.accept(value));
}
// how close a value is to what the host asked for (character-pair overlap of their written forms) — the units build on
// whatever is closest first. This is the host's requirement acting as a gradient, not a recipe.
const pairs = s => { const m = new Map(); for (let i = 0; i < s.length - 1; i++) { const p = s.slice(i, i + 2); m.set(p, (m.get(p) ?? 0) + 1); } return m; };
// plus: how much of what the value SAYS (its pieces of text/number) appears inside what was asked for
const leaves = v => v === null || v === undefined ? [] : typeof v === "object" ? Object.values(v).flatMap(leaves) : [String(v)];
export function closeness(value, target) { if (target === undefined) return 0;
  if (typeof value === "number" && typeof target === "number") return Number.isFinite(value) ? 1 / (1 + Math.abs(value - target) / Math.max(1, Math.abs(target))) : 0;   /* numbers: nearness by size, not by shared digits */
  const T = leaves(target).join("\u0001"), L = leaves(value).filter(x => x.length);
  const contain = L.length ? L.reduce((s, x) => s + (T.includes(x) ? x.length : 0), 0) / Math.max(1, L.reduce((s, x) => s + x.length, 0)) : 0;
  return 0.7 * contain + 0.3 * bigram(value, target); }
function bigram(value, target) { const a = pairs(stable(value) ?? ""), b = pairs(stable(target) ?? ""); let n = 0, ta = 0, tb = 0;
  for (const [, c] of a) ta += c; for (const [, c] of b) tb += c; for (const [p, c] of a) n += Math.min(c, b.get(p) ?? 0); return ta + tb ? 2 * n / (ta + tb) : 0; }
const linesOfUnit = (u, leader) => { const l = u.morphLines ?? linesOf(u.address, leader) ?? u.bits?.slice(0, 6) ?? [0, 0, 0, 0, 0, 0];
  return l.length >= 6 ? l.slice(0, 6) : [...l, ...Array(6 - l.length).fill(0)]; };
export function affinity(u, op, leader) {
  if (op.sandboxed && u.address.dimension !== "Movement") return -Infinity;   // outside code: only Movement units carry it (the chamber)
  const L = linesOfUnit(u, leader), F = fingerprint(op.id); let a = 0; for (let i = 0; i < 6; i++) a += L[i] === F[i] ? 1 : 0;
  return a + (op.dimension && u.address.dimension === op.dimension ? 2 : 0) + 3 * Math.tanh(u.craft?.[op.id] ?? 0);
}

/** A token's plan, read through its producers NOW (so a simpler way found later for any value is used everywhere). */
export function planOf(tok, acc = [], seen = new Set(), path = new Set()) {
  if (!tok.op || seen.has(tok.ref) || path.has(tok.ref)) return acc; path.add(tok.ref);
  for (const { tok: t } of tok.from) planOf(t, acc, seen, path);
  seen.add(tok.ref); acc.push({ id: tok.ref, op: tok.op, inputs: Object.fromEntries(tok.from.map(({ port, tok: t }) => [port, t.ref])), unit: tok.unit });
  path.delete(tok.ref); return acc;
}
/** Run a plan (list of steps) for one case's inputs, with the host's operations. */
export function runPlan(plan, output, ops, validate, inputs) {
  const v = new Map(Object.entries(inputs).map(([k, x]) => ["$" + k, x]));
  for (const s of plan) { const op = ops.get(s.op), args = {};
    for (const [p, r] of Object.entries(s.inputs)) { if (!v.has(r)) throw Error("missing " + r); args[p] = structuredClone(v.get(r)); }
    if (op.guard && !op.guard(args)) throw Error("guard"); const out = op.run(args); validate(op.output, out); v.set(s.id, out); }
  return v.get(output);
}

/**
 * The units build. m = { types, observations:[{id,type,value}], primitives:[ops], cases:[{inputs:{id:value}, goal:{type,constraints}}] }.
 * Returns { found, formation:{plan, output, units}, rounds, executions, log }.
 */
export function unitsConstruct(S, m, options) {
  const search = constructRounds(S, m, options);
  let state = search.next();
  while (!state.done) state = search.next();
  return state.value;
}

export function* constructRounds(S, m, { rounds = 150, perUnit = 3, perRound = 3, leader = S.leader } = {}) {
  const ops = new Map(m.primitives.map(p => [p.id, p])), types = m.types ?? {}, validate = (t, x) => { if (types[t] && !types[t](x)) throw Error("type " + t); };
  const units = S.units.filter(u => !u.broken);
  if (m.pop) {
    // Start with units that can see their peers. Give sparsely represented actions a turn first.
    units.sort((a, b) => Number(!a.opp?.perception.count) - Number(!b.opp?.perception.count)
      || (m.pop.position.share[a.opp?.position.as] ?? 1) - (m.pop.position.share[b.opp?.position.as] ?? 1));
  }
  const byId = new Map(units.map(u => [u.id, u]));
  if (!units.length) return { found: false, reason: "no units" };
  const case0 = m.cases[0], target = case0.goal.constraints?.find(c => c.equals !== undefined && !(c.path ?? []).length)?.equals, tokens = [], seen = new Set(), tried = new Set(), log = [];
  // the observations enter the swarm: each is held by a unit (spread over the swarm)
  m.observations.forEach((o, i) => { const u = units[(i * 7) % units.length];
    tokens.push({ ref: "$" + o.id, type: o.type, value: case0.inputs[o.id] ?? o.value, op: null, from: [], holder: u.id, holders: new Set([u.id]), depth: 0, close: closeness(case0.inputs[o.id] ?? o.value, target) }); seen.add(o.type + stable(case0.inputs[o.id] ?? o.value)); });
  // SELECTION: the simplest working formation, read through the simplest known way of making each value
  const pick = rr => { const w = winners.map(t => ({ t, plan: planOf(t) })).sort((a, b) => a.plan.length - b.plan.length)[0]; reward(S, byId, w.plan, 1);
    return { found: true, formation: { plan: w.plan, output: w.t.ref, type: w.t.type, units: w.plan.map(s => s.unit) }, rounds: rr, executions, toFirst: firstExec, simplified, log, by: "units", alternatives: winners.length }; };
  let simplified = 0, executions = 0, idle = new Map(), stuck = 0, widen = 0, firstWin = null, firstExec = null; const winners = [], bySig = new Map();
  const neighbours = u => (u.bonds ?? []).map(e => e.a === u.id ? e.b : e.a).filter(id => byId.has(id));
  // RECALL: before trying anything new, the units that carried a learned formation try it on what is here.
  // If it already meets the need, that is reuse; if not, what it makes stays in the pool to be adapted.
  for (const op of ops.values()) { if (!op.formation) continue;
    const carriers = units.filter(u => (u.craft?.[op.id] ?? 0) > 0 || op.formation.plan.some(st => st.unit === u.id));
    const u = carriers[0] ?? units[0], ports = Object.keys(op.inputs), mats = tokens.filter(t => !t.op);
    const was = op.formation.bound ?? {}, same = (p, t) => was[p] !== undefined && stable(was[p]) === stable(t.value);
    const combos = ports.reduce((acc, p) => acc.flatMap(b => mats.filter(t => t.type === op.inputs[p]).map(t => ({ ...b, [p]: t }))), [{}])
      .sort((x, y) => ports.filter(p => same(p, y[p])).length - ports.filter(p => same(p, x[p])).length).slice(0, 60);   // what it was made from last time, first
    for (const b of combos) { executions++; let value;
      try { value = op.run(Object.fromEntries(Object.entries(b).map(([p, t]) => [p, structuredClone(t.value)]))); validate(op.output, value); } catch { continue; }
      const key = op.id + stable(Object.fromEntries(Object.entries(b).map(([p, t]) => [p, t.ref]))), sig = op.output + stable(value); tried.add(key);
      if (seen.has(sig)) continue; seen.add(sig);
      const tok = { ref: "@" + (fnv(key) >>> 0).toString(16), type: op.output, value, op: op.id, from: Object.entries(b).map(([port, t]) => ({ port, tok: t })), unit: u.id,
        holder: u.id, holders: new Set([u.id]), depth: 1, close: closeness(value, target), recalled: true }; tokens.push(tok); bySig.set(sig, tok);
      if (tok.type === case0.goal.type && m.cases.every(c => { try { return matchesGoal(runPlan(planOf(tok), tok.ref, ops, validate, c.inputs), c.goal); } catch { return false; } })) {
        winners.push(tok); firstWin = -1; firstExec = executions; log.push({ round: "recall", unit: u.id, op: op.id, allCases: true }); } } }
  if (winners.length) { const res = pick(0); res.recalled = true; return res; }
  for (let r = 0; r < rounds; r++) {
    let progressed = false;
    const active = m.live ? new Map() : null;
    for (const u of units) {
      const near = [u.id, ...neighbours(u)], pool = tokens.filter(t => near.some(id => t.holders.has(id))).sort((a, b) => (b.close - 0.08 * b.depth) - (a.close - 0.08 * a.depth) || a.depth - b.depth);   /* closest to what the host asked for first, simpler first among close */
      if (!pool.length) continue;
      const have = new Set(pool.map(t => t.type)), pref = [...ops.values()].filter(op => Object.values(op.inputs).every(t => have.has(t))).map(op => [op, affinity(u, op, leader)]).filter(([, a]) => a > -Infinity)   /* only what it could do with what is within reach */.sort((a, b) => b[1] - a[1] || (a[0].id < b[0].id ? -1 : 1)).slice(0, perUnit + Math.floor(r / 6) + widen);   /* the longer nothing works, the wider each unit reaches */
      let did = false, doneHere = 0;
      for (const [op] of pref) {
        const ports = Object.keys(op.inputs), choose = (k, b) => { if (k === ports.length) return [b];
          const fit = pool.filter(t => t.type === op.inputs[ports[k]]), cand = [...new Set([...fit.filter(t => t.depth === 0), ...fit.slice(0, 10), ...[...fit].sort((a, b) => a.depth - b.depth).slice(0, 10), ...[...fit].sort((a, b) => (a.uses ?? 0) - (b.uses ?? 0) || a.depth - b.depth).slice(0, 10)])];   /* closest, raw materials, and the least built-on (exploration) */   // its best few + every raw material + what nobody has built on yet
          return cand.flatMap(t => choose(k + 1, { ...b, [ports[k]]: t })).slice(0, 400); };
        let hereOp = 0;
        for (const b of choose(0, {})) {
          const key = op.id + stable(Object.fromEntries(Object.entries(b).map(([p, t]) => [p, t.ref]))); if (tried.has(key)) continue; tried.add(key);
          const depth = 1 + Math.max(0, ...Object.values(b).map(t => t.depth)); if (depth > 7) continue;
          for (const t of Object.values(b)) t.uses = (t.uses ?? 0) + 1;
          let value; executions++;
          try { const args = Object.fromEntries(Object.entries(b).map(([p, t]) => [p, structuredClone(t.value)])); if (op.guard && !op.guard(args)) continue;
            value = op.run(args); validate(op.output, value); } catch { continue; }
          const ref = "@" + (fnv(key) >>> 0).toString(16), from = Object.entries(b).map(([port, tok]) => ({ port, tok }));
          const cand = { ref, op: op.id, from, unit: u.id }, candLen = planOf(cand).length;
          /* two ways of making something are the SAME value only if they agree on every case, not just the first (3*4 and 3+4+5 are both 12 once) */
          const sig = op.output + stable(value) + (m.cases.length > 1 ? stable(m.cases.slice(1).map(c => { try { return runPlan(planOf(cand), ref, ops, validate, c.inputs); } catch { return "×"; } })) : "");
          if (seen.has(sig) && op.output === case0.goal.type && matchesGoal(value, case0.goal)) {   /* a NEW way to a value that answers the first case: it may answer the others where the old way did not */
            const alt = { ref, type: op.output, value, op: op.id, from, unit: u.id, holder: u.id, holders: new Set([u.id]), depth, close: 1 }, plan = planOf(alt);
            const all = m.cases.every(c => { try { return matchesGoal(runPlan(plan, ref, ops, validate, c.inputs), c.goal); } catch { return false; } });
            log.push({ round: r, unit: u.id, op: op.id, candidate: plan.map(s => s.op), allCases: all, anotherWay: true });
            if (all) { winners.push(alt); firstWin ??= r; firstExec ??= executions; } }
          if (seen.has(sig)) { const old = bySig.get(sig);   // same value reached a simpler way: the value keeps its name, its making gets simpler
            if (old && old.op && candLen < planOf(old).length && !planOf(cand).some(st => st.id === old.ref)) { old.op = op.id; old.from = from; old.unit = u.id; old.holders.add(u.id); simplified++;
              for (const t of tokens) if (t.op && t.type === case0.goal.type && !winners.includes(t) && matchesGoal(t.value, case0.goal)) {   /* what was built on it now reads differently: check those answers again */
                const plan = planOf(t); if (!plan.some(st => st.id === old.ref) && t !== old) continue;
                if (m.cases.every(c => { try { return matchesGoal(runPlan(plan, t.ref, ops, validate, c.inputs), c.goal); } catch { return false; } })) { winners.push(t); firstWin ??= r; firstExec ??= executions; log.push({ round: r, unit: u.id, op: t.op, candidate: plan.map(st => st.op), allCases: true, afterSimplifying: true }); } } }
            continue; }
          seen.add(sig);
          if (active) active.set(u.id, { unit: u.id, op: op.id, dimension: op.dimension ?? u.address.dimension,
            sources: [...new Set(from.map(input => input.tok.holder))] });
          const tok = { ref, type: op.output, value, op: op.id, from, unit: u.id, holder: u.id, holders: new Set([u.id]), depth, close: closeness(value, target) }; tokens.push(tok); bySig.set(sig, tok); did = progressed = true;
          // EVALUATE against every case, not just the one it was built on
          if (tok.type === case0.goal.type && matchesGoal(value, case0.goal)) {
            const plan = planOf(tok); const all = m.cases.every(c => { try { const out = runPlan(plan, tok.ref, ops, validate, c.inputs); return c.goal.type === tok.type && matchesGoal(out, c.goal); } catch { return false; } });
            log.push({ round: r, unit: u.id, op: op.id, candidate: plan.map(s => s.op), allCases: all });
            if (all) { winners.push(tok); firstWin ??= r; firstExec ??= executions; }
            reward(S, byId, plan, -0.3); }
          if (++doneHere >= perRound || ++hereOp >= Math.ceil(perRound / pref.length)) break;   /* its turns are shared among what it carries, so one easy operation can't take them all */
        }
        if (doneHere >= perRound) break;
      }
      if (!did) { const n = (idle.get(u.id) ?? 0) + 1; idle.set(u.id, n);
        if (n % 5 === 0) changeLine(u, pref[0]?.[0], leader); }        // CHANGING LINE: what it is inclined to carry shifts
    }
    if (active) yield { round: r + 1, executions, carriers: [...active.values()] };
    // SELECTION: once something works, the swarm keeps going two more rounds and keeps the simplest formation that works
    if (winners.length && r - firstWin >= 3) return pick(r + 1);   /* a few more rounds: a simpler way may still turn up */
    // VALUES travel along bonds: what a unit holds reaches the units bonded to it next round (so materials can meet)
    for (const t of tokens) { const add = []; for (const h of t.holders) { const hu = byId.get(h); if (hu) add.push(...neighbours(hu)); } for (const a of add) t.holders.add(a); }
    // CULTURE travels by contact each round
    for (const u of units) for (const [k, w] of Object.entries(u.craft ?? {})) for (const n of neighbours(u)) { const o = byId.get(n); (o.craft ??= {})[k] = (o.craft[k] ?? 0) + w * 0.05; }
    if (!progressed) { stuck++; if (stuck >= 4 && perUnit + Math.floor(r / 6) + widen >= ops.size) break; widen += 2; } else stuck = 0;   // stuck: reach wider before giving up
  }
  if (winners.length) return pick(rounds);
  return { found: false, rounds, executions, log, by: "units" };
}
function reward(S, byId, plan, w) { for (const s of plan) { const u = byId.get(s.unit); if (u) (u.craft ??= {})[s.op] = (u.craft[s.op] ?? 0) + w; } }
function changeLine(u, op, leader) { const L = linesOfUnit(u, leader); if (!op) return; const F = fingerprint(op.id);
  let i = L.findIndex((x, k) => x === F[k]); if (i < 0) i = 0; L[i] ^= 1; /* flips a line that agreed with what got it nowhere */ u.morphLines = L; (u.changedLines ??= []).push(i + 1); }
