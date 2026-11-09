# Adaptive world and experience verification

Verified in this change:

- `npm test`: 35 checks pass (17 core, 5 bounded-agent, 7 dimensional-world,
  6 experience-composition tests).
- `npm run build`: the downloadable standalone is rebuilt from the updated source.
- `tests/dimensional-world-browser.cjs`: 64 visible world assemblies, five views
  over the same identities, recursive constituents, actual factory execution,
  replay equality, body assets, and mobile overflow checks.
- `tests/experience-browser.cjs`: the requested game → slides → interactive
  demonstration flow, persistent subject/objective/progress, retained DOM
  component identity, released world resources, computed geometry, and replay.
- Both browser flows pass against the embedded standalone in Chromium with
  software WebGL. Screenshots in this directory show their actual rendered states.

Browser test dependencies are development tools, not application runtime
dependencies. Set `NODE_PATH` to a Playwright installation if it is not installed
locally. `STANDALONE=1` tests `Synthia-Dual-Swarm.html`; otherwise tests use the
source page. Run the repository's local server on port 8000 first.

The material repair preserves glTF transparency settings and corrects zero-opacity
alpha-cutout wolf materials. Ordinary body viewing no longer overlays surface
particles or automatically tints clothing by simulation weights. The human remains
the existing stylized, locally bound asset; these changes do not claim photorealism
or new learned anatomy.

Unity was not changed or Editor-tested by this work. The passing browser tests do
not establish unrestricted semantic world generation, arbitrary format synthesis,
or a complete implementation of the author's directional glyph rules. See
`ADAPTIVE-EXPERIENCES.md` and `vendor/generative/README.md` for the exact boundary.
