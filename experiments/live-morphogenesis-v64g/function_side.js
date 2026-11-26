// function_side.js — the swarm's FUNCTION side runs the user's 16 Klein tools (vendor/pure-synthia, unchanged).
// Agreed with the user (Nov 22):
//   * 16 tools <-> the 16 CORE (nuclear) hexagrams. A core is built from lines 2-3-4 / 3-4-5, so it ignores lines 1 and 6;
//     exactly 4 hexagrams share each core (verified in test). The tool lives in the core.
//   * The two outer lines (1 and 6) are 2 bits = 4 kinds of output for the same tool:
//       line 1 (inner face) : 0 = function side, 1 = picture side       <- my assignment, user said "yes"
//       line 6 (outer face) : 0 = still,          1 = moving
//       -> function+still = SEMANTIC · function+moving = SOUND · picture+still = PICTURE · picture+moving = VIDEO
//   * Which tool goes to which core: the tool's own gate from the repo decides (its gate's core). Where two tools'
//     gates land on a core already taken, the tool walks forward through ITS OWN dimension's I Ching order from its gate
//     until it reaches a gate whose core is free. Rule is mine (derived, not typed); the user can replace the pairing.
//   * Bonds by PROMISE (Burgess, Spacetimes with Semantics I, §5): a unit offers (+b) and a neighbour accepts (-b);
//     only the overlap passes (effective action b1 ∩ b2). On line bits the overlap is AND.
// A unit needs all six lines to have a core, so a particle with fewer lines has no tool on its own —
// the ability only exists once particles together make a whole hexagram.
import { createAllTools, TOOL_REGISTRY } from "./vendor/pure-synthia/automata/registry.js";
import { maskFromKingWen, kingWenFromMask } from "./kingwen.js";
import { orderFor, maskAt, positionIn } from "./dimensions.js";

const toLines = m => Array.from({ length: 6 }, (_, i) => (m >>> i) & 1);          // line 1 first
const toMask = l => l.reduce((m, b, i) => m | (b << i), 0);
/** Core (nuclear) hexagram: lines 2,3,4 as the lower trigram, 3,4,5 as the upper. */
export const coreLines = l => [l[1], l[2], l[3], l[2], l[3], l[4]];
export const coreGate = l => kingWenFromMask(toMask(coreLines(l)));
export const CORES = [...new Set(Array.from({ length: 64 }, (_, g) => coreGate(toLines(maskFromKingWen(g + 1)))))].sort((a, b) => a - b);

export const KINDS = { "00": "semantic", "01": "sound", "10": "picture", "11": "video" };   // key = line1 line6
export const kindOf = l => KINDS[`${l[0]}${l[5]}`];

/** Pair each tool with a core by the rule above. Returns [{tool, dimension, gate, core, byOwnGate}]. */
export function pairToolsWithCores(registry = TOOL_REGISTRY) {
  const taken = new Map(), out = [];
  for (const t of registry) {
    const ord = orderFor(t.dimension === "Space" ? "Evolution" : t.dimension);           // Space starts from Evolution (user)
    let pos = positionIn(ord, maskFromKingWen(t.gate)), gate = t.gate, core = coreGate(toLines(maskFromKingWen(gate))), steps = 0;
    while (taken.has(core) && steps < 64) { pos = (pos + 1) % 64; gate = kingWenFromMask(maskAt(ord, pos)); core = coreGate(toLines(maskAt(ord, pos))); steps++; }
    if (taken.has(core)) throw new Error(`no free core for ${t.id}`);
    taken.set(core, t.id); out.push({ tool: t.id, dimension: t.dimension, repoGate: t.gate, viaGate: gate, core, byOwnGate: steps === 0 });
  }
  return out;
}
export const PAIRING = pairToolsWithCores();
const TOOL_OF_CORE = new Map(PAIRING.map(p => [p.core, p.tool]));

/** What a whole hexagram (six lines) can do: its tool and its kind of output. null if fewer than six lines. */
export function abilityOf(lines) {
  if (!lines || lines.length !== 6) return null;
  const core = coreGate(lines); return { core, tool: TOOL_OF_CORE.get(core), kind: kindOf(lines) };
}

// One copy of each tool's code, shared by every unit (the same instinct in every body); each run is the unit's own.
let TOOLS = null;
const tools = () => (TOOLS ??= new Map((() => { const t = createAllTools(); return Array.isArray(t) ? t : Object.values(t); })().map(t => [t.id, t])));

/** Promise bond (Burgess): u offers (+) its lines, v accepts (-) with its lines; only the overlap (AND) passes. */
export function promise(offerLines, acceptLines) {
  const n = Math.min(offerLines.length, acceptLines.length);
  const effective = Array.from({ length: n }, (_, i) => offerLines[i] & acceptLines[i]);
  return { effective, kept: effective.some(Boolean) };          // nothing in common = no binding
}

/** Run a whole hexagram's tool. `input` is what reached it (from a promise, a touch, text); lines are always passed.
 *  Returns the tool's real result, or why it could not run (the tool needs input only some formation can give). */
export function runAbility(lines, input = {}) {
  const a = abilityOf(lines); if (!a) return { ok: false, reason: "needs a whole hexagram (six lines)" };
  const tool = tools().get(a.tool);
  try { const r = tool.run({ lines, ...input });
    return { ok: !!r.accepted, tool: a.tool, kind: a.kind, core: a.core, output: r.output, reason: r.accepted ? null : r.output?.reason ?? "rejected" }; }
  catch (e) { return { ok: false, tool: a.tool, kind: a.kind, core: a.core, reason: "tool needs input it did not get: " + String(e?.message ?? e) }; }
}

/** Particles of a formation pool their lines (in order) until there are six: then the formation has a core and a tool.
 *  This is how an ability exists only when the right particles connect. */
export function formationLines(particles) {
  const all = particles.flatMap(p => p.lines ?? []);
  return all.length >= 6 ? all.slice(0, 6) : null;
}

/** Run one tool by name with a given operation, for answering a need (the tool's own result, or it throws). */
export function runToolOp(id, input) { const t = tools().get(id); if (!t) throw new Error("no tool " + id);
  const r = t.run(input); if (!r.accepted) throw new Error(r.output?.reason ?? "rejected"); return r.output; }
