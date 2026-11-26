// morphogenesis.js — ONE developmental cycle for the organism (user's assignment, Nov 22):
// Enter → Observe → Discover → Organize → Construct → Act → Evaluate → Adapt → Learn → Clone → Integrate → Extract
// Built ON the organism's own function builder (organism_swarm.js → Codex3 primitive-swarm.js: typed search over pure
// primitives, feedback ranking, verified results promoted to reusable CLUSTERS that become primitives at the next
// scale). Nothing here knows any task. A host offers only: its materials (typed observations), the primitives its
// world allows, its own check, and how a descendant is housed. The swarm's real units carry the formation.
// Added where the source had a gap (marked): NAND as a builder primitive (the bond operator), a morph builder with
// larger limits on the SAME substrate (so clusters are shared), memory of which materials a formation used.
import { PrimitiveSwarm } from "./codex3/synthia-dual-swarm/core/primitive-swarm.js";
import { installPrimitives } from "./codex3/synthia-dual-swarm/core/primitives.js";
import { readPOP } from "./opp.js";
import { unitsConstruct, constructRounds, runPlan, matchesGoal } from "./unitbuild.js";

/** The organism's builder for morphing: same substrate as O.function, bigger working limits. */
export function morphBuilder(O) {
  if (O.morph) return O.morph;
  const B = installPrimitives(new PrimitiveSwarm(O.function.core, { id: "primitive.morph", maxTokens: 600, maxAttempts: 4000, maxDepth: 7 }));
  // ADDED: NAND, the swarm's bond operator, as a primitive — the source builder had xor/equivalence/not but no NAND
  B.register({ id: "nand", inputs: { left: "bits", right: "bits" }, output: "bits", run: ({ left, right }) => left.map((x, i) => (x && right[i]) ? 0 : 1) });
  B.builtin = new Set(B.registry.keys());   // the organism's own primitives (always available)
  O.morph = B; O.morphMemory ??= { formations: [] }; return B;
}

/** Which of the swarm's own units carry each step: a unit of the step's dimension, the one taking most part in the focus. */
function organize(O, plan, dimOf) {
  const used = new Set(), carry = [];
  for (const step of plan) { const dim = dimOf(step.primitive);
    const pool = O.S.units.filter(u => !u.broken && !used.has(u.id) && (!dim || u.address.dimension === dim));
    const u = (pool.length ? pool : O.S.units.filter(v => !v.broken && !used.has(v.id))).sort((a, b) => (b.focusWeight ?? 0) - (a.focusWeight ?? 0) || a.id - b.id)[0];
    if (!u) break; used.add(u.id); u.role = { step: step.id, primitive: step.primitive }; carry.push({ unit: u.id, dimension: u.address.dimension, primitive: step.primitive }); }
  return carry;
}

const liveRuns = new WeakSet();

export function enter(O, host, options) {
  if (liveRuns.has(O)) throw new Error("this swarm is already morphing");
  return cycle(O, host, { ...options, live: false }).next().value;
}

export async function enterLive(O, host, { onFrame = () => {}, ...options } = {}) {
  if (liveRuns.has(O)) throw new Error("this swarm is already morphing");
  liveRuns.add(O);
  const search = cycle(O, host, { ...options, live: true });
  const units = new Map(O.S.units.map(u => [u.id, u]));
  let active = [];
  try {
    let state = search.next();
    for (; !state.done; state = search.next()) {
      for (const id of active) delete units.get(id).trialRole;
      const frame = state.value;
      active = frame.carriers.map(c => c.unit);
      for (const carrier of frame.carriers) {
        const unit = units.get(carrier.unit);
        unit.trialRole = carrier;
        const sources = carrier.sources.map(id => units.get(id)).filter(source => source && source !== unit);
        if (unit.target || !sources.length) continue;
        const dx = sources.reduce((sum, source) => sum + source.x - unit.x, 0) / sources.length;
        const dy = sources.reduce((sum, source) => sum + source.y - unit.y, 0) / sources.length;
        unit.x += dx * 0.08;
        unit.y += dy * 0.08;
      }
      await onFrame(frame, O.S);
    }
    return state.value;
  } finally {
    for (const id of active) delete units.get(id).trialRole;
    search.return();
    liveRuns.delete(O);
  }
}

function* cycle(O, host, { budget = 4000, live = false } = {}) {
  const B = morphBuilder(O), mem = O.morphMemory, steps = [], say = (step, d = {}) => steps.push({ step, ...d });
  const before = host.check(); say("enter", { host: host.name, kind: host.kind, checkWithout: +before.toFixed(3) });
  if (before >= host.enough) { say("nothing-needed"); return { ok: true, steps }; }
  const pop = host.healthOnly ? readPOP(O.S.units) : null;
  if (pop) say("orient", { pop });
  const m = host.materials();
  if (!m) { say("fail", { reason: "no supported gap in the observations" }); return { ok: false, steps }; }
 say("observe", { materials: m.observations.length, primitives: m.primitives.map(p => p.id) });
  say("discover", host.healthOnly ? { observation: m.observation } : { needs: m.need });
  for (const [t, v] of Object.entries(m.types ?? {})) if (!B.types.has(t)) B.registerType(t, v);
  const dims = new Map(); for (const p of m.primitives) { B.register(p); dims.set(p.id, p.dimension ?? null); }
  // what was learned before comes first: materials a past formation used are offered first (the builder tries in id order)
  const learned = new Set(mem.formations.filter(f => f.kind === host.kind).flatMap(f => f.materials));
  const obs = m.observations.map(o => ({ ...o, id: (learned.has(JSON.stringify(o.value)) ? "a_" : "z_") + o.id }));
  const rename = id => obs.find(o => o.id.slice(2) === id)?.id ?? id;
  const cases = (m.cases ?? [{ inputs: Object.fromEntries(m.observations.map(o => [o.id, o.value])), goal: m.goal }])
    .map(c => ({ inputs: Object.fromEntries(Object.entries(c.inputs).map(([k, v]) => [rename(k), v])), goal: c.goal }));
  // CONSTRUCT — first the units themselves (lines, bonds, dimension, culture, changing lines); the builder only if they can't
  // what can be used HERE: this host's operations, the organism's own primitives, and learned formations built only from those
  const here = new Set([...B.builtin, ...m.primitives.map(p => p.id)]), usable = p => here.has(p.id) || (p.formation && p.formation.plan.every(s => usable(B.registry.get(s.op) ?? { id: s.op })));
  const ops = [...B.registry.values()].filter(usable).map(p => ({ ...p, dimension: dims.get(p.id) ?? p.dimension }));
  const conditions = { types: Object.fromEntries(B.types), observations: obs, primitives: ops, cases, pop, live };
  const U = live ? yield* constructRounds(O.S, conditions) : unitsConstruct(O.S, conditions);
  let formation, by;
  if (U.found) { formation = U.formation; by = "units";
    say("construct", { by, recalled: !!U.recalled, simplified: U.simplified ?? 0, rounds: U.rounds, executions: U.executions, toFirst: U.toFirst, plan: formation.plan.map(s => s.op), units: formation.units, rejected: U.log.filter(l => !l.allCases).length }); }
  else { say("construct", { by: "units", found: false, executions: U.executions, note: host.healthOnly ? "no formation reached the health threshold" : "the units did not find it; the builder is asked" });
    if (host.healthOnly) { say("fail", { reason: "no healthy formation found" }); return { ok: false, steps }; }
    B.observe(obs).seek(cases[0].goal); let n = 0; while (B.state.running && n++ < budget) B.step();
    const st = B.state; if (st.status !== "satisfied") { say("fail", { reason: `neither the units nor the builder met the host's requirement (builder ${st.status})` }); return { ok: false, steps }; }
    const g = st.result.cluster ? O.function.core.require(st.result.cluster).state.graph : { steps: [], output: st.result.ref };
    formation = { plan: g.steps.map(s => ({ id: s.id, op: s.primitive, inputs: s.inputs })), output: g.output, type: st.result.type, units: [] }; by = "builder";
    say("construct", { by, executions: st.executions, plan: formation.plan.map(s => s.op) }); }
  // ORGANIZE: who carries each step (units already named their own steps; for a builder result units are assigned)
  const carry = by === "units" ? formation.plan.map(s => ({ unit: s.unit, dimension: O.S.units[s.unit]?.address.dimension, op: s.op }))
    : organize(O, formation.plan.map(s => ({ id: s.id, primitive: s.op })), id => dims.get(id) ?? null);
  for (const c of carry) { const u = O.S.units[c.unit]; if (u) u.role = { op: c.op }; }
  say("organize", { units: carry });
  const usedRefs = new Set(formation.plan.flatMap(s => Object.values(s.inputs))), materials = obs.filter(o => usedRefs.has("$" + o.id)).map(o => JSON.stringify(o.value));
  const opsHere = new Map([...B.registry, ...ops.map(p => [p.id, p])]),   /* the builder may answer with its own clusters, so its registry is included */
    result = runPlan(formation.plan, formation.output, opsHere, (t, x) => B.validate(t, x), cases[0].inputs);
  /* every case is actually run (the builder searches on the first case only, so its answer can fit that one and no other) */
  const met = cases.filter(c => { try { const out = runPlan(formation.plan, formation.output, opsHere, (t, x) => B.validate(t, x), c.inputs); return matchesGoal(out, c.goal); } catch { return false; } }).length;
  say("act+evaluate", { result, plan: formation.plan.map(s => s.op), casesMet: met, of: cases.length });
  if (met < cases.length) { say("fail", { reason: `${by === "units" ? "the units'" : "the builder's"} formation met ${met} of ${cases.length} cases; nothing is grown or learned from it` }); return { ok: false, steps }; }
  // LEARN (as a capability): the formation becomes one operation at the next scale, available to units and builder alike
  const ext = [...new Set(formation.plan.flatMap(s => Object.values(s.inputs)).filter(r => r.startsWith("$")))];
  const inputsOf = Object.fromEntries(ext.map(r => [r.slice(1), obs.find(o => "$" + o.id === r)?.type ?? "bits"]));
  const fid = "formation." + Math.abs([...JSON.stringify(formation.plan.map(s => [s.op, s.inputs]))].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)).toString(16);
  const opsMap = new Map(ops.map(p => [p.id, p]));
  const bound = Object.fromEntries(ext.map(r => [r.slice(1), obs.find(o => "$" + o.id === r)?.value]));   // what it was made from, to try first next time
  const learnIt = () => { if (!B.registry.has(fid)) B.register({ id: fid, inputs: inputsOf, output: formation.type, cost: 0.5,
    formation: { plan: formation.plan, output: formation.output, bound },
    run: args => runPlan(formation.plan, formation.output, B.registry, (t, x) => B.validate(t, x), args) }); };   /* runs on THIS host's operations; persisted (v40 fix) so the builder can name it when it builds on it; learned ONLY once the grown app works alone */
  const graph = { steps: formation.plan.map(s => ({ id: s.id, primitive: s.op, inputs: s.inputs })), output: formation.output };
  const cluster = fid;
  // CLONE: a descendant that carries the executable formation (not a description of it)
  const descendant = host.descend({ result, graph, builder: B, carry, ops: opsMap, formation, rename });
  say("clone", { descendant: descendant.label, standalone: descendant.standalone });
  host.integrate(descendant); say("integrate");
  // EXTRACT: the units carrying it are released; the host is judged on its own
  for (const c of carry) delete O.S.units[c.unit]?.role;
  const after = host.checkAlone(); say("extract", { checkWithSwarmGone: +after.toFixed(3), unitsStillCarrying: O.S.units.filter(u => u.role).length });
  const ok = after >= host.enough;
  if (ok) learnIt();
  if (ok) mem.formations.push({ kind: host.kind, host: host.name, formation: cluster, by, plan: graph.steps.map(s => s.primitive), materials, units: carry.map(c => c.unit) });
  say("learn", { formations: mem.formations.length, clusters: B.state.clusters.length });
  return { ok, steps, descendant, cluster };
}
