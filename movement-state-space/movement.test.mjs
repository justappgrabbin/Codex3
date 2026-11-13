import test from "node:test";
import assert from "node:assert/strict";
import {MOVEMENT_SOURCE,MovementStateSpace} from "./movement.js";

test("source vocabulary is ordered and not replaced by interpretation",()=>{
 const s=new MovementStateSpace();
 assert.deepEqual(s.terms,["Movement","Energy","Creation","Seeing","Landscape","Environment"]);
 assert.equal(s.inspect().orientation,"bottom_to_top");
 assert.equal(s.inspect().perspective,"Individuality");
 assert.equal(s.inspect().keynote,"I Create");
 assert.deepEqual(s.inspect().links.map(x=>x.sourceConnector),Array(5).fill("is"));
 assert.ok(s.inspect().links.every(x=>x.interpretation===null));
 assert.equal(MOVEMENT_SOURCE.correspondences,null);
});
test("observations preserve expression and perspective without inferred meaning",()=>{
 const s=new MovementStateSpace();
 const a=s.observe({subject:"person",expression:"I create a path",context:"example"});
 const b=s.observe({subject:"person",expression:"I did not create a path",context:"example"});
 assert.equal(a.interpretationStatus,"unverified");
 assert.deepEqual(s.compare(a.id,b.id).differences.map(x=>x.field),["expression"]);
 assert.equal(s.compare(a.id,b.id).semanticJudgment,null);
});
test("snapshots round-trip without altering authored source",()=>{
 const s=new MovementStateSpace();
 s.observe({subject:"agent",expression:"moves upward",quality:{confidence:.2}});
 const copy=MovementStateSpace.import(s.export());
 assert.deepEqual(copy.export(),s.export());
});
test("unknown observations and altered source fail closed",()=>{
 const s=new MovementStateSpace();
 assert.throws(()=>s.compare("missing","missing"),RangeError);
 const snap=s.export();snap.source.direction="top_to_bottom";
 assert.throws(()=>MovementStateSpace.import(snap),TypeError);
});
