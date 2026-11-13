import assert from 'node:assert/strict';
import {unitsOf,appearance,binaryOf,layout,step,dimensionOfBase} from '../core/word-swarm.js';
assert.equal(dimensionOfBase(1),'Movement');assert.equal(dimensionOfBase(3),'Being');
const u=unitsOf({gate:2,line:5,color:3,tone:4,base:3,degree:12,minute:7,second:30,arcsecond:41,house:8},0);
assert.equal(u.length,3);assert.deepEqual(u[0].words,['The Receptive','Genius']);
assert.equal(u[1].words[0],'C3 T4 B3');assert.equal(u[2].words[1],'house 8');
assert.equal(appearance(u[0],{viewer:'Being'}).kind,'words');
assert.equal(appearance(u[0],{viewer:'Movement'}).text,binaryOf(2));assert.equal(binaryOf(1),'111111');
assert.equal(appearance(u[0],{viewer:'Being',zoom:0.1}).kind,'dot');
assert.throws(()=>unitsOf({gate:65,line:1,color:1,tone:1,base:1}));
// Movement units rise, Being units sink
const m=layout([...unitsOf({gate:1,line:1,color:1,tone:1,base:1},0),...unitsOf({gate:2,line:1,color:1,tone:1,base:3},1)]);
const s=step(m);assert.ok(s[0].y<m[0].y);assert.ok(s[3].y>m[3].y);
console.log('word-swarm ok');
