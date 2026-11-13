// Every check below is a fact printed in Rutt, The Book of Changes (Zhouyi).
import test from 'node:test';import assert from 'node:assert/strict';
import * as Z from '../core/zhouyi.js';

test('received order pairs by inversion, or counterchange for the eight symmetric figures (p.102)',()=>{
 for(let g=1;g<=64;g+=2){assert.equal(Z.partner(g),g+1,'pair '+g);assert.equal(Z.partner(g+1),g);}
 const symmetric=[...Array(64).keys()].map(i=>i+1).filter(g=>Z.invert(Z.figureOf(g))===Z.figureOf(g));
 assert.deepEqual(symmetric,[1,2,27,28,29,30,61,62]);});
test('counterchanged pairs sum to 63 in binary (p.112)',()=>{
 for(const [a,b] of [[1,2],[27,28],[29,30],[61,62]])assert.equal(Z.figureOf(a)+Z.figureOf(b),63);});
test('trigram family from the lines (Table 15/19)',()=>{
 assert.deepEqual(Z.family(7),{role:'father',rank:0});assert.deepEqual(Z.family(0),{role:'mother',rank:0});
 assert.deepEqual(Z.family(0b001),{role:'son',rank:1});assert.deepEqual(Z.family(0b100),{role:'son',rank:3});
 assert.deepEqual(Z.family(0b110),{role:'daughter',rank:1});assert.deepEqual(Z.family(0b011),{role:'daughter',rank:3});});
test('Mawangdui order by rule matches Table 10',()=>{
 const m=Z.mawangduiOrder();assert.equal(new Set(m).size,64);
 assert.deepEqual(m.slice(0,16),[1,12,33,10,6,13,25,44,52,26,23,41,4,22,27,18]);
 assert.deepEqual([m[16],m[24],m[32],m[40],m[48],m[56]],[29,51,2,58,30,57]);
 assert.deepEqual(m.slice(56),[57,9,20,53,61,59,37,42]);});
test('xiang numbers and line odds (pp.163, 167-168)',()=>{
 assert.equal(Z.xiangFromCounts([3,3,3]),9);assert.equal(Z.xiangFromCounts([2,2,2]),6);assert.equal(Z.xiangFromCounts([2,3,2]),7);
 for(const m of ['yarrow','coins'])assert.equal(Object.values(Z.ODDS[m]).reduce((a,b)=>a+b,0),16);
 assert.equal(Z.drawLine(0,'yarrow'),6);assert.equal(Z.drawLine(0.99,'yarrow'),9);});
test('Nanjing remainder table (p.170)',()=>{
 const rows={6:[6,7,18,19],5:[5,8,17],4:[4,9,16],3:[3,10,15],2:[2,11,14],1:[1,12,13]};
 for(const [line,rs] of Object.entries(rows))for(const r of rs)assert.equal(Z.nanjingLine(55-r),+line);});
test('Story 1: Guan changing to Pi, 55-46=9, line 4 speaks (p.176)',()=>{
 const o=Z.oracle([8,8,8,6,7,9]);
 assert.equal(o.base,20);assert.equal(o.total,46);assert.equal(o.line,4);assert.equal(o.speaks,'line');});
test('Story 22: Qian changing to Pi, 55-48=7, both hexagram statements (p.200)',()=>{
 const o=Z.oracle([9,9,9,7,7,7]);
 assert.equal(o.base,1);assert.equal(o.result,12);assert.equal(o.line,6);assert.equal(o.speaks,'both hexagrams');assert.deepEqual(o.hexagrams,[1,12]);});
test('no changeable lines: the hexagram statement speaks (rule 1)',()=>{
 assert.equal(Z.oracle([7,7,7,7,7,7]).speaks,'hexagram');assert.deepEqual(Z.oracle([7,7,7,7,7,7]).hexagrams,[1]);});
test('all changeable: Hexagrams 1 and 2 use the seventh line statement (rule 2, p.130)',()=>{
 assert.equal(Z.oracle([9,9,9,9,9,9]).speaks,'seventh line (all lines)');assert.equal(Z.oracle([6,6,6,6,6,6]).base,2);});
test('nuclear trigrams are lines 2-4 and 3-5',()=>{
 const f=0b101101;assert.deepEqual(Z.nuclear(f),{lower:0b110,upper:0b011});});
test('Olsvanger grid: total 2016; 63 and 0 top right; 55 then 25 beneath 0; top-left six are 1 and the powers of 2 (pp.109-112)',()=>{
 const g=Z.olsvangerGrid();assert.equal(g.flat().reduce((a,b)=>a+b,0),2016);
 assert.deepEqual([g[0][7],g[0][6]],[63,0]);assert.deepEqual([g[1][6],g[2][6]],[55,25]);
 assert.deepEqual([g[0][0],g[0][1],g[1][0],g[1][1],g[2][0],g[2][1]].sort((a,b)=>a-b),[1,2,4,8,16,32]);
 assert.deepEqual(g[0],[2,16,23,58,17,34,0,63]);});
