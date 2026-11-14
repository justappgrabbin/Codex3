import assert from 'node:assert/strict';
import { calculateChart, fromLongitude, CENTERS, CHANNELS, longitudes, designDate } from '../core/chart.js';
import { buildSwarm, summary, place, step } from '../core/dual-swarm.js';
import * as A from '../vendor/astronomy-engine/astronomy.js';
// every gate in exactly one center
const all = Object.values(CENTERS).flat(); assert.equal(all.length, 64); assert.equal(new Set(all).size, 64);
assert.equal(CHANNELS.length, 36);
// wheel: 302 deg starts gate 41; 32 deg (2 Taurus) starts gate 27 (published table)
assert.deepEqual([fromLongitude(302.001).gate, fromLongitude(302.001).line], [41, 1]);
assert.equal(fromLongitude(31.999).gate, 3); assert.equal(fromLongitude(32.001).gate, 27);
assert.equal(fromLongitude(0.5).gate, 25); // 0 Aries is gate 25 (published table)
// Rave New Year: Sun enters gate 41 around Jan 21-23
const ny = A.SearchSunLongitude(302, A.MakeTime(new Date(Date.UTC(2026, 0, 10))), 30).date;
assert.ok(ny.getUTCMonth() === 0 && ny.getUTCDate() >= 19 && ny.getUTCDate() <= 23, ny.toISOString());
// Earth opposite Sun; Sun from SunPosition agrees with GeoVector path
const b = new Date(Date.UTC(1990, 5, 15, 12));
const L = longitudes(b); assert.ok(Math.abs(((L.Earth - L.Sun + 360) % 360) - 180) < 1e-9);
const sunGeo = A.Ecliptic(A.GeoVector(A.Body.Sun, A.MakeTime(b), true)).elon;
assert.ok(Math.abs(sunGeo - L.Sun) < 0.01, `sun ${sunGeo} vs ${L.Sun}`);
// design: Sun 88 deg earlier, about 88 days before
const d = designDate(b), dl = longitudes(d).Sun;
assert.ok(Math.abs(((L.Sun - dl + 360) % 360) - 88) < 1e-4);
const days = (b - d) / 864e5; assert.ok(days > 84 && days < 93, String(days));
const c = calculateChart(b); assert.equal(c.activations.length, 26);
// swarm
const s = buildSwarm([{ owner: 'me', chart: c }]); const sm = summary(s);
assert.equal(s.inner.length, 384); assert.equal(sm.expressed + sm.latent, 384);
assert.ok(sm.expressed >= 6 && sm.expressed <= 26*6 && sm.latent > 200, JSON.stringify(sm));
const two = buildSwarm([{ owner: 'me', chart: c }, { owner: 'you', chart: calculateChart(new Date(Date.UTC(1985, 1, 3, 7))) }]);
assert.ok(summary(two).expressed > sm.expressed); assert.ok(Array.isArray(two.connection));
place(s, { cx: 300, cy: 300, r: 250 }); for (let i = 0; i < 200; i++) step(s, 1, i * 16);
assert.ok(s.inner.every(u => Number.isFinite(u.x) && Math.hypot(u.x - 300, u.y - 300) < 600));
console.log('dual-swarm ok', sm, 'connections', two.connection.length);
