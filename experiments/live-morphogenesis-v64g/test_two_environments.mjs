import assert from "node:assert/strict";
import { twoEnvironments } from "./two_environments.js";
import { enter } from "./morphogenesis.js";
import { appHost } from "./hosts.js";

const { app, habitat, appResult, worldResult, organism } = twoEnvironments();
for (const [kind, host, result] of [["app", app, appResult], ["world", habitat, worldResult]]) {
  const phase = name => result.steps.find(s => s.step === name);
  assert.equal(host.healthOnly, true);
  assert.ok(phase("enter").checkWithout < host.enough);
  assert.equal(phase("orient").pop.units, 64);
  assert.ok(result.steps.indexOf(phase("orient")) < result.steps.indexOf(phase("discover")));
  assert.equal(phase("discover").needs, undefined);
  assert.equal(phase("construct").by, "units");
  assert.ok(phase("construct").plan.length);
  assert.equal(phase("clone").standalone, true);
  assert.equal(phase("extract").unitsStillCarrying, 0);
  assert.ok(host.checkAlone() >= host.enough);
  assert.ok(result.ok);
  console.log(kind, JSON.stringify(result.steps.filter(s => ["enter", "orient", "discover", "construct", "extract"].includes(s.step))));
}
assert.equal(app.app.files.length, 2);
assert.ok(app.app.files.some(f => f.path === "indicator.js"));
assert.equal(habitat.world.systems.length, 1);
assert.equal(organism.morphMemory.formations.length, 2);
const impossible = appHost([{ path: "x.js", text: "export const x = 0;" }], { health: () => 0 });
assert.equal(enter(organism, impossible).ok, false);
const rejected = appHost([{ path: "x.js", text: "import { gate } from './gate.js';\nexport function x(v) { return gate(v); }" }], { health: () => 0 });
assert.equal(enter(organism, rejected).ok, false);
assert.equal(rejected.app.files.length, 1);
assert.equal(organism.morphMemory.formations.length, 2);
console.log("Two environments passed, including unsupported and unsatisfied hosts.");

const { twoEnvironmentsLive } = await import("./two_environments.js");
const positions = new Map(), frames = new Map();
let moved = false;
const live = await twoEnvironmentsLive((place, frame, swarm) => {
  frames.set(place, (frames.get(place) ?? 0) + 1);
  for (const carrier of frame.carriers) {
    const unit = swarm.units[carrier.unit];
    assert.equal(unit.trialRole, carrier);
    const key = place + unit.id, position = [unit.x, unit.y];
    if (positions.has(key) && positions.get(key).some((value, i) => value !== position[i])) moved = true;
    positions.set(key, position);
  }
});
assert.ok(live.appResult.ok && live.worldResult.ok);
assert.ok(moved);
assert.ok([...frames.values()].every(count => count > 1));
assert.ok(live.organism.S.units.every(unit => !unit.trialRole && !unit.role));
console.log("Live morphogenesis passed: provisional roles, movement across frames, and extraction.");
