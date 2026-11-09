# Adaptive experience composition

The activity is `experience.lesson`. Its subject, objective, information units,
assessment attempts, completed units, and presentation cursor survive every
environment change. Presentation environments are separate, retained compositions.

`composeCapabilities` covers explicitly requested affordances from an available
capability catalog under a resource budget. It supports new contracts and catalogs;
there is no assignment from a Human Design type, personality, or goal to a game.
The prior keyword-to-fixture recommendation has been removed. Original activities
remain optional regression fixtures that require explicit selection.

The initial presentation contracts request these affordances:

| Request | Additional affordances |
| --- | --- |
| Game | World, challenge, response |
| Slides | Sequential navigation |
| Interactive demonstration | Controls, visualization, feedback |

All request objective, information, and progress. These are requirements for the
planner, not three stored screen trees. `ExperienceView` mounts the selected
component roles, retains shared DOM identities, removes released components,
and applies the resulting layout. Components excluded by the new composition
have `active:false` and zero allocated resources. Their previous state remains
recoverable from history. When slides release the world renderer, its geometry
is disposed; the persistent world data remains available for a later composition.

## Acceptance test

1. Click **Start learning activity**. The supplied example teaches Sheldon Klein's
   Boolean analogy using the iconographic example on pp. 2–3 of his paper.
2. Enter `010000` as the first answer and check it. Progress becomes 1/3.
3. Request: **I don't want to play a game. Teach me with slides.**
4. The assessment and world components are released. Navigation is assembled.
   The subject, objective, information, attempt, and 1/3 progress remain intact.
5. Request: **Now show me an interactive demonstration.**
6. The visualization capability is reused and parameter controls are assembled.
   Changing C to `001010` computes D=`100101` and constructs that result's
   actual addressed six-line geometry. The lesson remains at 1/3 progress.

`tests/experience-browser.cjs` performs this sequence using the request box,
verifies retained DOM identity and released resources, and checks exact replay.

## Content independence and limits

The supplied Boolean lesson is an explicit source-based example, not a universal
lesson generator. `ExperienceSession.start(lesson, format)` accepts a separate
subject, objective, and identified information units. A gardening lesson is tested
with the same composer. The currently registered interactive experiment adapter
implements six-bit Boolean analogy. Arbitrary subject-specific simulations require
their own registered executable capabilities and teaching content.

Request recognition currently recognizes explicit game, slides/presentation, and
interactive demonstration requests. Unknown requests preserve the current activity
and report that no supported interpretation was resolved. This is not a general
natural-language understanding system. Capability plans fail before releasing the
current environment if their requirements cannot be met.

The separate relational-world preview uses the recovered masked structural update
operator with explicitly authored numerical coefficients. Those coefficients and
the geometry layout are demonstration choices, not laws transcribed from the
Black Book, Klein, Govinda, or the author's directional glyph system. Exact 45°
letter traversal remains unimplemented rather than being silently invented.
