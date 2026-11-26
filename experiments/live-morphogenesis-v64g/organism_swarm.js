// organism_swarm.js — ONE swarm assembled from the user's pieces (Nov 22 2026). The particles are v26's LivingSwarm units;
// everything below runs ON those same units. Nothing here is a central controller: each step every unit reads its own
// lines, its bonds, and the shared focal point, and acts; results are only measured.
//
// What each piece does here, and where it comes from (all copied unchanged; see codex3/NEWEST-VERSION-SOURCES.txt):
//   particles, life, picture/touch ............ v26 living.js
//   lines by dimension, splits, changing lines  v26 klein_local.js (dimension = the hexagram; King Wen / Mawangdui / Fuxi)
//   Klein inside each unit (instinct + culture) v26 klein_local.js — rules travel by contact only
//   16 Klein tools in the 16 core hexagrams ... v26 function_side.js — the function aspect of a whole hexagram
//   Boolean relation on every bond ............ Codex3 boolean-state.js -> the user's boolean-ato (all 16 functions)
//   how a unit relates (link type) ............ Codex3 spacetime-semantics.js (Burgess types per dimension)
//   the shared moving focal point ............. Codex3 focal-point.js (morphology sets it; angle sets participation)
//   building new function from primitives ..... Codex3 primitive-swarm.js + primitives.js (search, keep what works)
//   taking in an app / files .................. Codex3 file-swarm.js (files -> units -> what links to what)
//   recognising its own formation ............. morphogen lab: the TRAINED Badalov model (local features + gossip)
//   Klein as observer, not controller ......... v26 klein_bridge.js (records only)
//
// Choices that are mine and marked as such: the bond operator per leading dimension (OPERATOR_BY_LEADER, all 'xnor' =
// Klein's strong equivalence until the user sets them), how participation scales action (k * weight), recognition
// radius mapping (thesis radius 1.2 <-> the swarm's own bond radius).
import * as KL from "./klein_local.js";
import * as FS from "./function_side.js";
import { applyBoolean, BINARY_BOOLEAN_FUNCTIONS } from "./codex3/synthia-dual-swarm/core/boolean-state.js";
import { TYPE_OF_DIMENSION } from "./codex3/synthia-dual-swarm/core/spacetime-semantics.js";
import { orient, focusFromAddress, placementOf } from "./codex3/synthia-dual-swarm/core/focal-point.js";
import { Substrate } from "./codex3/synthia-dual-swarm/core/substrate.js";
import { primitiveSwarm } from "./codex3/synthia-dual-swarm/core/primitives.js";
import { ingest, channels as fileChannels, summary as fileSummary } from "./codex3/synthia-dual-swarm/core/file-swarm.js";

// Which of the 16 Boolean functions a bond uses, chosen by the leading dimension (user: "the leading dimension does
// the kind of math that's needed"). NOT GIVEN YET -> every leader uses Klein's strong equivalence (xnor).
export const OPERATOR_BY_LEADER = { Movement: "xnor", Evolution: "xnor", Being: "xnor", Design: "xnor" };
export const DEFAULT_OPERATION = { "diseminer-lite": "export", "autoling-lite": "export" };   // read from each tool's own trace line
export const OPERATORS = [...BINARY_BOOLEAN_FUNCTIONS];   // the 16, in truth-table order

/** Load the trained Badalov recogniser from the morphogen lab (plain scripts) given a text reader. */
export async function loadRecognizer(readText) {
  const src = await readText("codex3/morphogen-swarm-lab/swarm.js"), models = await readText("codex3/morphogen-swarm-lab/trained-models.js");
  const api = new Function(`${models}\n${src}\nreturn { neighborhoods, sense, predict, trainedModels, formations, thesisRadii };`)();
  return {
    radii: api.thesisRadii, formations: api.formations,
    /** Each unit predicts its formation from its own neighbourhood only (no voting). */
    recognize(units, bondRadius, thesisRadius = 1.2) {
      const s = thesisRadius / bondRadius;
      const agents = units.map(u => ({ x: u.x * s, y: u.y * s, vx: (u.vx ?? 0) * s, vy: (u.vy ?? 0) * s }));
      const { peers } = api.neighborhoods(agents, thesisRadius);
      const labels = api.predict(api.sense(agents, peers, [1, 1, 1, 1]), peers, api.trainedModels[String(thesisRadius)]);
      const tally = {}; for (const l of labels) tally[l] = (tally[l] ?? 0) + 1;
      return { labels, tally, agreed: Object.keys(tally).length === 1 };
    },
  };
}

export class OrganismSwarm {
  constructor(living, { recognizer = null } = {}) {
    this.S = living; this.recognizer = recognizer; this.focus = null; this.tick = 0; this.log = [];
    this.function = primitiveSwarm(new Substrate());          // the function-building side, shared by the formation
    KL.grow(this.S);
  }
  /** Set the shared point everyone orients to (an explicit address; text goes through morphology in Node: setFocusFrom). */
  setFocus(address) { this.focus = focusFromAddress(address); this.log.push({ t: this.tick, focus: this.focus }); return this.focus; }
  async setFocusFrom(subject) {
    const { focusFromSubject } = await import("./codex3/synthia-dual-swarm/core/focal-point.js");
    this.focus = await focusFromSubject(subject); this.log.push({ t: this.tick, focus: this.focus }); return this.focus;
  }

  /** Each unit's own reading of the focus (weight 0..1 by angle, link type by its dimension). */
  readings() {
    const parts = this.S.units.filter(u => !u.broken).map(u => ({ id: u.id, dimension: u.address.dimension, address: u.address }));
    return new Map(orient(this.focus, parts).map(r => [r.id, r]));
  }

  /** The Boolean relation across one bond, with the operator the leading dimension asks for. */
  bondRelation(a, b) {
    const k = KL.sharedWidth(a, b); if (!k) return null;
    const op = OPERATOR_BY_LEADER[this.S.leader] ?? "xnor";
    const toB = l => l.slice(0, k).map(Boolean);   // the engine takes strict Booleans, line 1 first
    const out = applyBoolean(op, toB(a.lines), toB(b.lines)).map(Number);
    return { op, bits: out, agreement: out.reduce((s, x) => s + x, 0) / k };
  }

  /** One step of the organism. */
  step({ gossipEvery = 10 } = {}) {
    this.S.step(); KL.grow(this.S); this.tick++;
    const read = this.readings();
    for (const u of this.S.units) {
      if (u.broken || !u.particle) continue;
      const r = read.get(u.id); u.focusWeight = r?.weight ?? 0; u.focusRelation = r?.relation ?? null;
      // Boolean relation on each bond: agreement pulls together, disagreement pushes apart, scaled by participation
      for (const e of u.bonds) { const o = this.S.units[e.a === u.id ? e.b : e.a]; if (o.broken || !o.particle) continue;
        const rel = this.bondRelation(u, o); if (!rel) continue; e.relation = rel;
        const pull = (rel.agreement - 0.5) * 0.004 * (0.25 + u.focusWeight);
        u.x += (o.x - u.x) * pull; u.y += (o.y - u.y) * pull; }
      // the unit's function aspect: a whole hexagram knows its tool and its kind of output
      u.ability = FS.abilityOf(u.lines);
    }
    if (this.tick % gossipEvery === 0) this.gossipWeighted();
    return this;
  }
  /** Gossip where each unit's offers count by how much it takes part in the current focus. */
  gossipWeighted() {
    const save = this.S.units.map(u => u.bonds);
    for (const u of this.S.units) u.bonds = u.bonds.map(e => ({ ...e, strength: e.strength * (0.25 + (u.focusWeight ?? 0)) }));
    KL.gossip(this.S, 1);
    this.S.units.forEach((u, i) => { u.bonds = save[i]; });
  }

  /** A formation's units pool lines; if they make a whole hexagram, run its tool (the function side, for real). */
  runFormation(unitIds, input = {}) {
    const lines = FS.formationLines(unitIds.map(id => this.S.units[id]));
    return lines ? FS.runAbility(lines, input) : { ok: false, reason: "these units do not make a whole hexagram yet" };
  }

  /** Kept (never deleted), no longer called on a timer: tools now run only for a need (needs.js act()).
   *  Formations act on their own: each particle with bonds pools lines with its bonded particles (nearest first).
   *  When that makes a whole hexagram, its tool runs; the result stays on the unit that led the formation. No one asks. */
  runFormations() {
    const ran = [];
    for (const u of this.S.units) {
      if (u.broken || !u.particle || !u.bonds.length) continue;
      const mates = u.bonds.map(e => this.S.units[e.a === u.id ? e.b : e.a]).filter(o => o && !o.broken && o.particle)
        .sort((p, q) => Math.hypot(p.x - u.x, p.y - u.y) - Math.hypot(q.x - u.x, q.y - u.y));
      const group = [u, ...mates], lines = FS.formationLines(group); if (!lines) continue;
      const used = []; let n = 0; for (const p of group) { if (n >= 6) break; used.push(p.id); n += p.lines?.length ?? 0; }
      const key = lines.join("") + ":" + used.join(","); if (u.lastFormation === key) continue;   // same formation: nothing new to do
      u.lastFormation = key;
      let r = FS.runAbility(lines, { focus: this.focus, units: used });
      // two lite tools log 'export' as their default operation but never apply it (their own code, unchanged): apply it here
      if (!r.ok && /UNKNOWN_OPERATION/.test(r.reason ?? "") && DEFAULT_OPERATION[r.tool]) r = FS.runAbility(lines, { focus: this.focus, units: used, operation: DEFAULT_OPERATION[r.tool] });
      u.output = { tick: this.tick, units: used, ...r }; ran.push(u.output);
    }
    this.lastRuns = ran; return ran;
  }

  /** Build a function the swarm doesn't have yet from primitives; what works is kept as a reusable cluster. */
  build(observations, goal, { budget = 600 } = {}) {
    const f = this.function; f.observe(observations).seek(goal);
    for (let i = 0; i < budget && f.state.running; i++) f.step();
    return { status: f.state.status, result: f.state.result, clusters: [...f.state.clusters] };
  }

  /** Take in files (an app): each file becomes a unit; what imports/links/calls what becomes bonds-to-be. */
  takeIn(files) {
    const s = ingest(files), sum = fileSummary(s), ch = fileChannels(s);
    const made = files.map((f, i) => this.S.add({ gate: 1 + (hashText(f.path) % 64), line: 1 + (i % 6), dimension: "Design", file: f.path }, "item"));
    const byPath = new Map(files.map((f, i) => [f.path, made[i]]));
    for (const c of ch.channels) { const a = byPath.get(c.out), b = byPath.get(c.in);       // a completed link = these two belong together
      if (a && b) { (a.fileLinks ??= []).push({ to: b.id, kind: c.kind, key: c.key }); (b.fileLinks ??= []).push({ to: a.id, kind: c.kind, key: c.key });
        b.x = a.x + 0.03; b.y = a.y; } }                                                        // placed side by side so they bond
    KL.grow(this.S);
    // 'hanging' = half a link with nothing on the other side: the gaps in what came in
    return { files: sum, channels: ch.channels, gaps: ch.hanging, units: made.map(u => u.id) };
  }

  /** What formation the swarm is in, read by every unit from its own neighbourhood (trained model). */
  recognize() { return this.recognizer ? this.recognizer.recognize(this.S.units.filter(u => !u.broken), this.S.radius ?? 0.25) : null; }
}
const hashText = s => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h; };
export { placementOf, TYPE_OF_DIMENSION };
