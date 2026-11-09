# Synthia — Adaptive Dual Swarm

Function and embodiment share an addressed entity substrate, typed relations and retained history.

- **Browser source:** [`synthia-dual-swarm/`](synthia-dual-swarm/)
- **Standalone browser build:** [`synthia-dual-swarm/Synthia-Dual-Swarm.html`](synthia-dual-swarm/Synthia-Dual-Swarm.html) — download and open, or serve locally.
- **Unity project:** [`synthia-unity/`](synthia-unity/) — open with Unity 2022.3 LTS.

## Run the browser project

```sh
cd synthia-dual-swarm
npm start
```

Open http://localhost:8000. Run `npm test` for the 17 core regressions. Runtime dependencies and models are vendored; rebuilding the standalone file requires `npm install` then `npm run build`.

## Included

Real human and wolf assets; skinned human particle morphing; object-by-object interface morphing; recursive frames exposing all five dimensions and their named qualities; a relation-derived neural controller trained for a bounded assembly task; local image color-region learning; event replay and import/export.

Browser checks passed for assets, learned assembly, recursive frame exploration, interface morphing, replay and mobile layout. Unity is an unverified native project scaffold: Unity Editor was unavailable. Realistic photograph animation and general-purpose world generation remain unfinished. See each project's README and browser `docs/VERIFICATION.md` for evidence and limits.
