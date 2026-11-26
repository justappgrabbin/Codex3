import { LivingSwarm } from "./living.js";
import { OrganismSwarm } from "./organism_swarm.js";
import { World } from "./hostworld.js";
import { enter, enterLive } from "./morphogenesis.js";
import { appHost, worldHost } from "./hosts.js";
import { runHost } from "./lifecycle.js";

function* setupEnvironments() {
  const swarm = new LivingSwarm({ seed: 9 });
  const dimensions = ["Movement", "Evolution", "Being", "Design"];
  for (let i = 0; i < 64; i++) {
    swarm.add({ gate: i + 1, line: i % 6 + 1, color: i % 6 + 1,
      tone: i % 6 + 1, base: i % 5 + 1, dimension: dimensions[i % 4] },
    "person", 0.25 + i % 8 * 0.07, 0.25 + Math.floor(i / 8) * 0.07);
  }
  const organism = new OrganismSwarm(swarm);
  swarm.link(0.11);
  for (let i = 0; i < 5; i++) organism.step();

  const app = appHost([
    { path: "panel.js", text: "import { indicator } from './indicator.js';\nexport function panel(a, b) { return indicator(a, b); }" }
  ], { health: files => Number(runHost([...files, {
    path: "private-health.js",
    text: "import { panel } from './panel.js';\nassert(panel(0,0) === 0); assert(panel(0,1) === 0); assert(panel(1,0) === 0); assert(panel(1,1) === 1);"
  }]).ok) });
  const appResult = yield { organism, host: app, place: "Incomplete app" };

  for (let i = 0; i < 5; i++) organism.step();
  const world = new World({ name: "ridge", w: 24, h: 18, temperature: -4 });
  world.palette = [[20, 20, 20], [200, 40, 30], [40, 170, 60], [235, 235, 245]];
  const habitat = worldHost(world, { measure: w => {
    const ground = w.cells.slice((w.h - 1) * w.w);
    return ground.filter(rgb => rgb.every(c => c > 200)).length / w.w;
  } }, { healthOnly: true });
  const worldResult = yield { organism, host: habitat, place: "Grid world" };
  return { app, habitat, appResult, worldResult, organism };
}


export function twoEnvironments() {
  const places = setupEnvironments();
  let next = places.next();
  while (!next.done) {
    const { organism, host } = next.value;
    next = places.next(enter(organism, host));
  }
  return next.value;
}

export async function twoEnvironmentsLive(onFrame) {
  const places = setupEnvironments();
  let next = places.next();
  while (!next.done) {
    const { organism, host, place } = next.value;
    next = places.next(await enterLive(organism, host, {
      onFrame: (frame, swarm) => onFrame(place, frame, swarm)
    }));
  }
  return next.value;
}
