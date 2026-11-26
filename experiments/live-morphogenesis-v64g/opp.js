// opp.js — Orientation · Position · Perception per unit; the whole swarm's Proportion of Perspective (user, Nov 25).
// "Each swarm member gets an OPP and the entirety of the swarm is the POP."
// POP (user's definition): orientation, position and perception, relative to everyone and everything, in a particular
// time and place, in proportion of a whole. Nothing here tells the swarm what to be; it only lets each unit read where
// it stands and lets the swarm read the proportion across all of them — what is covered, what is missing, where it agrees.
import { gateFunction } from "./gate_engine.js";

const TAU = Math.PI * 2;
/* fixed pairs (user, Nov 25): Sun–Earth, Nodes, Moon–Mercury, Venus–Mars, Jupiter–Saturn, Uranus–Neptune; Pluto unpaired.
   The places and pairs are fixed; WHICH of a pair runs upward and which across is relative to where the viewer sits. */
const PAIR = { Sun: "Earth", Earth: "Sun", NorthNode: "SouthNode", SouthNode: "NorthNode", Moon: "Mercury", Mercury: "Moon",
  Venus: "Mars", Mars: "Venus", Jupiter: "Saturn", Saturn: "Jupiter", Uranus: "Neptune", Neptune: "Uranus", Pluto: null };
/** the unit's cross, read from where it sits: its own body and its partner; which one is vertical depends on the viewer's heading */
export function crossOf(u, heading) {
  const me = u.address.planetary ?? null, partner = me ? PAIR[me] ?? null : null;
  if (!me) return null;
  const upright = heading == null ? true : Math.abs(Math.sin(heading)) >= Math.abs(Math.cos(heading));   // facing more up/down than sideways
  return { body: me, partner, side: u.address.side ?? null, vertical: partner ? (upright ? me : partner) : me, across: partner ? (upright ? partner : me) : null,
    point: `${u.address.gate}.${u.address.line}`, self: u.address.side ? "Design × Personality cross at this point is the self" : null };
}

/** one unit's OPP, from what it actually is and senses right now */
export function oppOf(u, units, { reach = 0.08 } = {}) {
  // orientation: which way it is heading (its motion since last read), and what its gate does (its direction of action)
  const dx = u.x - (u._ox ?? u.x), dy = u.y - (u._oy ?? u.y); u._ox = u.x; u._oy = u.y;
  const heading = Math.hypot(dx, dy) > 1e-6 ? Math.atan2(dy, dx) : (u.opp?.orientation.heading ?? null);
  const f = gateFunction(u.current?.gate ?? u.address.gate);
  // position: where it stands and as what in this place
  const position = { x: u.x, y: u.y, as: f.op, field: u.address.field ?? u.address.dimension, latent: !!u.latent, line: u.current?.line ?? u.address.line };
  // perception: what it takes in from where it stands — who is within reach, what they do, how many it resonates with
  const seen = units.filter(o => o !== u && !o.broken && Math.hypot(o.x - u.x, o.y - u.y) < reach);
  const ops = {}; for (const o of seen) { const op = gateFunction(o.current?.gate ?? o.address.gate).op; ops[op] = (ops[op] ?? 0) + 1; }
  const perception = { count: seen.length, ops, charge: seen.reduce((s, o) => s + (o.charge ?? 0), 0), mood: u.mood ?? null };
  position.cross = crossOf(u, heading);   // fixed place, relative axes
  return (u.opp = { orientation: { heading, toward: f.field, does: f.does }, position, perception });
}

/** the swarm's POP: the proportion across every unit's OPP, in this place, now */
export function popOf(units) {
  const live = units.filter(u => !u.broken && u.opp);
  const n = live.length || 1;
  // orientation: how aligned the headings are (1 = all one way, 0 = every way)
  const hs = live.map(u => u.opp.orientation.heading).filter(h => h != null);
  const cx = hs.reduce((s, h) => s + Math.cos(h), 0), cy = hs.reduce((s, h) => s + Math.sin(h), 0);
  const alignment = hs.length ? Math.hypot(cx, cy) / hs.length : 0, facing = hs.length ? ((Math.atan2(cy, cx) + TAU) % TAU) : null;
  // position: what the swarm is standing as — share of each kind of doing, active vs latent
  const as = {}, active = {}; for (const u of live) { const k = u.opp.position.as; as[k] = (as[k] ?? 0) + 1; if (!u.latent) active[k] = (active[k] ?? 0) + 1; }
  const share = Object.fromEntries(Object.entries(as).map(([k, v]) => [k, +(v / n).toFixed(3)]));
  const ALL = ["create", "store", "trigger", "route", "filter", "propagate", "render", "exchange"];
  const missing = ALL.filter(k => !active[k]);                       // nothing active is doing this here
  // perception: how much the swarm is taking in, and who sees nothing (its blind places)
  const blind = live.filter(u => u.opp.perception.count === 0).length;
  const seeing = live.reduce((s, u) => s + u.opp.perception.count, 0) / n;
  const lead = Object.entries(active).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  return { units: live.length, orientation: { alignment: +alignment.toFixed(3), facing }, position: { share, lead, missing },
    perception: { meanSeen: +seeing.toFixed(2), blind, blindShare: +(blind / n).toFixed(3) } };
}

/** read every unit's OPP, then the swarm's POP */
export function readPOP(units, opts) { for (const u of units) if (!u.broken) oppOf(u, units, opts); return popOf(units); }
