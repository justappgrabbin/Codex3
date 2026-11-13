import test from "node:test";
import assert from "node:assert/strict";
import {MovementCorrespondences} from "./correspondences.js";

test("proposal cannot rewrite source vocabulary",()=>{
 const ledger=new MovementCorrespondences();
 assert.throws(()=>ledger.propose({term:"Ego",word:"a",perspective:"b",source:"c",reason:"d"}),RangeError);
 assert.deepEqual(ledger.entries,[]);
});

test("candidate requires attribution and remains unaccepted until review",()=>{
 const ledger=new MovementCorrespondences();
 assert.throws(()=>ledger.propose({term:"Energy",word:"force",perspective:"individuality",source:"",reason:"test"}),TypeError);
 const candidate=ledger.propose({term:"Energy",word:"force",perspective:"Individuality",source:"user hypothesis",reason:"test only"});
 assert.equal(candidate.status,"proposed");
 assert.equal(ledger.forTerm("Energy",{status:"accepted"}).length,0);
 const reviewed=ledger.review(candidate.id,{status:"rejected",reason:"not supported",reviewer:"user"});
 assert.equal(reviewed.status,"rejected");
 assert.throws(()=>ledger.review(candidate.id,{status:"accepted",reason:"changed",reviewer:"user"}));
});

test("correspondence records survive export and import",()=>{
 const ledger=new MovementCorrespondences();
 const a=ledger.propose({term:"Seeing",word:"observation",perspective:"Individuality",source:"experiment",reason:"trial"});
 ledger.review(a.id,{status:"accepted",reason:"verified in review",reviewer:"user"});
 ledger.propose({term:"Landscape",word:"field",perspective:"Individuality",source:"notes",reason:"exploration"});
 assert.deepEqual(MovementCorrespondences.import(ledger.export()).export(),ledger.export());
});

test("snapshot tampering is rejected",()=>{
 const ledger=new MovementCorrespondences();
 ledger.propose({term:"Movement",word:"motion",perspective:"Individuality",source:"notes",reason:"trial"});
 const snap=ledger.export();snap.entries[0].term="nonexistent";
 assert.throws(()=>MovementCorrespondences.import(snap));
});
