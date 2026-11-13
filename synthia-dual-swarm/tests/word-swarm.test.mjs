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
import {ingest,sections} from '../scripts/ingest-hatcher.mjs';
const txt=`14.M DA4 YOU3 (5943, 7533): BIG DOMAIN\n14.0 Gua Ci\n14.1 Chu Jiu\n14.1x Xiao Xiang (Fan Yao 50.1: cauldron's upturned feet, expelling the stagnant)`;
assert.equal(sections(txt).length,3); // 14.1x stays inside the 14.1 section
const {words,fragments}=ingest([txt]);assert.ok(fragments>=3);
assert.equal(words[14].name,'BIG DOMAIN');assert.equal(words[50].lines[1],"cauldron's upturned feet, expelling the stagnant");
const ub=unitsOf({gate:50,line:1,color:1,tone:1,base:1},0,{bookWords:words});assert.equal(ub[0].words[1],"cauldron's upturned feet, expelling the stagnant");
console.log('book words ok');
{const {words:w2}=ingest([`KUN1 (3684): ACCEPTING\n02.0 Gua Ci\n03.M ZHUN1 (6592): RALLYING (Also pronounced Tun2)\n03.0 x`]);
assert.equal(w2[2].name,'ACCEPTING');assert.equal(w2[3].name,'RALLYING');console.log('names ok');}
