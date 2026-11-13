// Checks are Schöter's own worked examples.
import test from 'node:test';import assert from 'node:assert/strict';
import * as A from '../core/gua-algebra.js';
import {figureOf,gateOf,partner} from '../core/zhouyi.js';
const S=A.fromSchoter, T=(f,n)=>A.toSchoter(f,n);
test('the four operations on trigrams (2.1)',()=>{
 assert.equal(T(A.not(S('010'),3),3),'101');assert.equal(T(A.not(S('100'),3),3),'011');
 assert.equal(T(A.or(S('100'),S('001')),3),'101');assert.equal(T(A.and(S('110'),S('101')),3),'100');
 assert.equal(T(A.xor(S('100'),S('110')),3),'010');});
test('lattice: unions and intersections of the trigram list (2.3)',()=>{
 assert.equal(T(A.or(S('100'),S('010')),3),'110');assert.equal(T(A.and(S('110'),S('011')),3),'010');
 assert.ok(A.leq(S('10'),S('11'))&&A.leq(S('01'),S('11'))&&!A.leq(S('10'),S('01')));
 assert.deepEqual([0,1,2,3].map(l=>[...Array(8).keys()].filter(t=>A.level(t)===l).length),[1,3,3,1]);});
test('Rising and Sinking Yang sequences (2.4)',()=>{
 assert.deepEqual(A.risingYang(3).map(f=>T(f,3)),['000','100','010','110','001','101','011','111']);
 assert.deepEqual(A.sinkingYang(3).map(f=>T(f,3)),['000','001','010','011','100','101','110','111']);});
test('structural complement: Revolution 49 to Youthful Folly 4 (3.1.1)',()=>{
 assert.equal(T(figureOf(49)),'101110');assert.equal(gateOf(A.not(figureOf(49))),4);});
test('primal correlate: Well 48 is Sigma 26, correlate 26; Contemplation 20 to 3 (3.1.2)',()=>{
 assert.equal(A.sinkingIndex(figureOf(48)),26);assert.equal(gateOf(A.primalCorrelate(figureOf(48))),26);
 assert.equal(gateOf(A.primalCorrelate(figureOf(20))),3);assert.equal(A.primalCorrelate(63),0);});
test('change as xor: Deliverance 40 to 54 and 7 and 19 (3.2.3)',()=>{
 assert.equal(T(figureOf(40)),'010100');
 assert.equal(T(A.change(S('010100'),S('110100'))),'100000');assert.equal(gateOf(S('110100')),54);
 assert.equal(T(A.change(S('010100'),S('010000'))),'000100');assert.equal(gateOf(S('010000')),7);
 const c=A.change(S('010100'),S('110000'));assert.equal(T(c),'100100');assert.equal(gateOf(A.xor(S('010100'),c)),19);});
test("Zaimo names Qian's lines by the hexagram that line makes (3.2.4; also Rutt Story 17)",()=>{
 assert.equal(gateOf(A.xor(63,S('100000'))),44);assert.equal(gateOf(A.xor(63,S('010000'))),13);
 assert.equal(gateOf(A.xor(63,S('000010'))),14);assert.equal(gateOf(A.xor(63,S('000001'))),43);});
