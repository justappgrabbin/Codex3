// Locks the sourced parts of the state-space canon so no later edit can quietly change them.
import test from 'node:test';import assert from 'node:assert/strict';
import * as C from '../core/state-space-canon.js';

test('Ra numbering is the creation order B-M-S-D-E',()=>{
 assert.deepEqual([...C.CREATION_ORDER.order],['Being','Movement','Space','Design','Evolution']);});
test('square corners and empty centre',()=>{
 assert.equal(C.SQUARE.corners.Evolution.particle,'Electron');assert.equal(C.SQUARE.corners.Design.particle,'Neutrino');
 assert.equal(C.SQUARE.corners.Being.particle,'Quark');assert.equal(C.SQUARE.corners.Movement.particle,'Magnetic Monopole');
 assert.equal(C.SQUARE.centre.dimension,'Space');assert.equal(C.SQUARE.centre.substance,false);});
test('edges are computed from their two corners, named by frame',()=>{
 const want={physics:[['Evolution','Design','Speed'],['Being','Movement','Force'],['Evolution','Being','Material'],['Design','Movement','Position']],
  song:[['Evolution','Design','Tempo'],['Being','Movement','Appeal'],['Evolution','Being','Musician'],['Design','Movement','Audience']]};
 for(const [frame,rows] of Object.entries(want))for(const [a,b,name] of rows){
  assert.equal(C.edgeBetween(a,b,frame).name,name);assert.equal(C.edgeBetween(b,a,frame).name,name);}
 assert.equal(C.edgeBetween('Evolution','Movement'),null);assert.equal(C.diagonal('Being','Design').through,'Space');
 assert.deepEqual(C.edgeBetween('Evolution','Design','song').wheels,['PW','DW']);});
test('wheels per position, and Space shares the Evolution wheel',()=>{
 assert.equal(C.WHEELS.values.Space,C.WHEELS.values.Evolution);assert.equal(C.WHEELS.values.Movement,'BG');});
test('Movement is the single monopole; crystals are binaries',()=>{
 assert.deepEqual([...C.CRYSTALS.MagneticMonopole.members],['Movement']);assert.equal(C.CRYSTALS.MagneticMonopole.binary,false);
 assert.equal(C.CRYSTALS.Personality.members[1],'Evolution');assert.equal(C.CRYSTALS.Design.binary,true);});
test('base table: question, sense, polarity',()=>{
 const q=Object.fromEntries(C.BASES.map(b=>[b.dimension,b.question]));
 assert.deepEqual(q,{Movement:'Where',Evolution:'What',Being:'When',Design:'Why',Space:'Who'});
 assert.equal(C.BASES[3].polarity,'Yin/Yang');assert.equal(C.BASES[4].sense,'Hearing');});
test('senses differ by level; tone 6 is Touch, colour 5 is Sound',()=>{
 assert.equal(C.senseAt('tone',6),'Touch');assert.equal(C.senseAt('tone',5),'Feeling');
 assert.equal(C.senseAt('color',5),'Sound');assert.equal(C.senseAt('base',5),'Hearing');
 assert.ok(!C.LEVEL_VISIBILITY.color.dimensions.includes('Space'));assert.equal(C.LEVEL_VISIBILITY.tone.status,'open');});
test('Being chain is one short (the "Matter is" gap)',()=>{
 for(const d of ['Movement','Evolution','Design','Space'])assert.equal(C.chainLength(d),6);assert.equal(C.chainLength('Being'),5);});
test('centre exists only with all four corners; its words stay open',()=>{
 assert.equal(C.centre(['Movement','Evolution','Being','Design']).present,true);
 assert.equal(C.centre(['Movement','Evolution','Being']).present,false);assert.equal(C.centre(['Being']).words,null);});
test('16 two-input operators, XOR only one of them',()=>{
 assert.equal(C.OPERATORS.count,16);assert.equal(C.SOURCE_DIMENSIONS['Human Design'].dimension,'Being');});
test('the centre is the reader\'s origin',()=>{
 assert.equal(C.squareFrom('Space').centre,'Space');assert.deepEqual(C.squareFrom('Being').around,['Movement','Evolution','Design','Space']);
 assert.equal(C.squareFrom('Evolution').around.length,4);});
test('letters read one or two at a time by dimension',()=>{
 assert.deepEqual(C.readLetters('HEXAGRAM','Evolution'),['HE','XA','GR','AM']);
 assert.deepEqual(C.readLetters('BHANTUGH','Design'),['BH','AN','TU','GH']);
 assert.equal(C.readLetters('HEXAGRAM','Movement').length,8);});
