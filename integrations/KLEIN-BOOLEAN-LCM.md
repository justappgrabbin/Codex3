# Klein Boolean / Language Contact Model bridge

This is a **first committed integration boundary**, not yet a live Swarm model.

Source of truth: `justappgrabbin/language-contact-model`, especially its original
`core.py` positional subdivisions. `integrations/klein_boolean_lcm.py`
imports the original LCM implementation at runtime; it does not copy or replace
Klein's equations, five readings, neural model, or weights.

- An exact rational turn position is passed through LCM's own Gate/Line/Color/Tone/Base
  and Degree/Minute/Second subdivisions.
- The Gate *address* is stored as six bits (zero-based 0..63); it is **not**
  equated to a HEXAGRAM or to the meaning of the reading.
- The complete source-grounded reading, positional chain, evidence, context and
  relations accompany the bits without lossy feature compression.
- AND/OR/XOR/NAND/NOR/XNOR operate on bits and retain both operands; their semantic
  result stays **unresolved** until the original Klein resolver returns a sourced reading.
- Cross-context composition requires an explicit relationship declaration.

Run the contract tests from the Codex3 root:

```bash
python -m unittest discover -s integrations -p 'test_*.py' -v
```

Run against **actual** LCM core from a separate checkout (do not vendor or overwrite it):

```bash
PYTHONPATH=/path/to/language-contact-model:. python -c 'from integrations.klein_boolean_lcm import positional_reading; print(positional_reading("1/8",context_id="world-1",source_id="source-1").export())'
```

Next required steps before claiming a complete model: connect the full Klein
tool/resolver readings (beyond positional core), connect actual trained neural
weights, map source-grounded world observations to the running Codex3
`AutonomousSwarm` without bypassing its action validation, and run Android
inference tests. Do not replace with Qwen or fabricate a neural response.
