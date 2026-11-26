// grow.js — the picture grows from what has already settled (parallel of Verma, Tzes & Ferrante, "Distributed Swarm
// Morphogenesis with Neural Cellular Automata", NYU Abu Dhabi — Advertiser/Joiner protocol), with NO neural net:
//   Advertisers = settled units. Each offers the empty squares next to it (4-neighbours) that the picture really has.
//     (Their trained NCA decides "is this cell part of the shape"; here the picture itself decides — and only squares
//      the picture has are ever offered, which is their false-positive rule without the loss function.)
//   Joiners = free units. Each looks only as far as it can see, takes the nearest offered square its dimension can hold
//     (BHANTUGH five layers, unchanged: dimension k holds squares of layer k), and settles there.
//   Position: a joiner places itself relative to the settled units it can see (their squares are known), so no unit
//     ever needs the whole plan. Deeper dimensions win a contested square, as pictureTargets did.
const DIMS = ["Movement", "Evolution", "Being", "Design", "Space"];

export function startGrow(S, img) {
  const n = img.w * img.h, taken = new Int32Array(n).fill(-1);
  for (const u of S.units) u.target = null;
  // seed: the square with the strongest edge that the deepest dimension present can hold — one unit settles first
  const live = S.units.filter(u => !u.broken), deep = Math.max(...live.map(u => DIMS.indexOf(u.address.dimension)));
  let seed = -1, bs = -1; for (let i = 0; i < n; i++) if (img.layers[Math.max(0, deep)][i] && img.edges[i] > bs) { bs = img.edges[i]; seed = i; }
  const first = live.filter(u => DIMS.indexOf(u.address.dimension) === deep)
    .sort((a, b) => Math.hypot(a.x - (seed % img.w + 0.5) / img.w, a.y - (Math.floor(seed / img.w) + 0.5) / img.h) - Math.hypot(b.x - (seed % img.w + 0.5) / img.w, b.y - (Math.floor(seed / img.w) + 0.5) / img.h))[0];
  S.grow = { img, taken, offered: new Set(), settled: 0 };
  if (first && seed >= 0) settle(S, first, seed);
  return S.grow;
}

function settle(S, u, cell) {
  const G = S.grow, { img } = G, w = img.w; G.taken[cell] = u.id; G.settled++;
  u.target = { x: (cell % w + 0.5) / w, y: (Math.floor(cell / w) + 0.5) / img.h, layer: DIMS.indexOf(u.address.dimension), cell };
  G.offered.delete(cell); G.lastSettled = u.target;
  const x = cell % w, y = Math.floor(cell / w);
  for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {     // advertise: only squares the picture has
    if (nx < 0 || ny < 0 || nx >= w || ny >= img.h) continue; const c = ny * w + nx;
    if (G.taken[c] < 0 && img.layers[0][c]) G.offered.add(c); }
}

/** One round: every free unit that can see an offered square it may hold bids; each square goes to the deepest bidder. */
export function growTick(S, sight = 0.12) {
  const G = S.grow; if (!G || !G.offered.size) return 0;
  const { img } = G, w = img.w, bids = new Map();
  // deepest layers choose first (as pictureTargets): a square goes to its own (deepest) band's dimension while any of those are free
  const band = c => { let b = 0; for (let k = 1; k < 5; k++) if (img.layers[k][c]) b = k; return b; }, free = [0, 0, 0, 0, 0];
  for (const u of S.units) if (!u.broken && !u.target) free[Math.max(0, DIMS.indexOf(u.address.dimension))]++;
  const may = (k, c) => { if (!img.layers[k][c]) return false; const b = band(c); if (b === k) return true; for (let d = k + 1; d <= b; d++) if (free[d]) return false; return true; };   // a deeper free unit that can hold it goes first
  const B = new Map(), bk = (x, y) => Math.floor(x / sight) * 1000 + Math.floor(y / sight);
  for (const c of G.offered) { const cx = (c % w + 0.5) / w, cy = (Math.floor(c / w) + 0.5) / img.h, k = bk(cx, cy); (B.get(k) ?? B.set(k, []).get(k)).push([c, cx, cy]); }
  for (const u of S.units) { if (u.broken || u.target) continue; const k = Math.max(0, DIMS.indexOf(u.address.dimension));
    let best = null, bd = sight;
    const gx = Math.floor(u.x / sight), gy = Math.floor(u.y / sight), near = [];
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) near.push(...(B.get((gx + a) * 1000 + gy + b) ?? []));
    for (const [c, cx, cy] of near) { if (!may(k, c)) continue; const d = Math.hypot(cx - u.x, cy - u.y); if (d < bd) { bd = d; best = c; } }
    if (best === null) { u.wanting = true; continue; } u.wanting = false;
    const cur = bids.get(best); if (!cur || k > cur.k || (k === cur.k && bd < cur.d)) bids.set(best, { u, k, d: bd }); }
  for (const [c, b] of bids) settle(S, b.u, c);
  // a joiner that saw nothing it could hold follows the offer: settled units relay their offers to each other (the
  // paper's light field does this job), so a joiner heads for the nearest offered square it could hold, wherever it is
  const all = [...G.offered].map(c => [c, (c % w + 0.5) / w, (Math.floor(c / w) + 0.5) / img.h]);
  for (const u of S.units) { if (u.broken || u.target || !u.wanting) continue; const k = Math.max(0, DIMS.indexOf(u.address.dimension));
    let tx = null, ty = null, nd = Infinity; for (const [c, cx, cy] of all) { if (!may(k, c)) continue; const d = Math.hypot(cx - u.x, cy - u.y); if (d < nd) { nd = d; tx = cx; ty = cy; } }
    if (tx !== null) { u.x += (tx - u.x) * 0.25; u.y += (ty - u.y) * 0.25; } }
  return bids.size;
}
