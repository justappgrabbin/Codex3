import assert from 'node:assert/strict';
import {zhiGua,fanYao} from '../core/zhouyi.js';
import {jiaoGua,huGua,twelveBranches,xianTianValue} from '../core/zhouyi-later.js';
assert.equal(zhiGua(1,1).name,'1 zhi 44');
for(const [a,b,l] of [[1,43,6],[2,15,3],[3,63,3]]){assert.deepEqual(fanYao(a,l),{gate:b,line:l});assert.deepEqual(fanYao(b,l),{gate:a,line:l});}
assert.equal(jiaoGua(11),12);assert.equal(jiaoGua(12),11);
assert.equal(huGua(1),1);assert.equal(huGua(2),2);assert.equal(huGua(63),64);assert.equal(huGua(64),63);
const t=twelveBranches(),s=t.indexOf(11);
assert.deepEqual([...t.slice(s),...t.slice(0,s)],[11,34,43,1,44,33,12,20,23,2,24,19]);
assert.equal(xianTianValue(1),63);assert.equal(xianTianValue(24),32);assert.equal(xianTianValue(23),1);
console.log('zhouyi-hatcher ok');
import {pangTong,dang,ying,bi,sanCai,banXiang,binomial} from '../core/zhouyi-later.js';
assert.equal(pangTong(1),2);assert.equal(pangTong(63),64);
assert.equal(dang(63,1),true);assert.equal(dang(63,2),true);assert.equal(dang(64,1),false); // Jiji all correct, Weiji none
for(let l=1;l<=6;l++){assert.equal(dang(63,l),true);assert.equal(dang(64,l),false);assert.equal(ying(63,l),true);}
assert.equal(ying(1,1),false);assert.deepEqual(bi(63,1),[2]);
assert.equal(sanCai(3),'human');assert.equal(banXiang(11).inner.trigram,7);
assert.deepEqual(binomial(6),[1,6,15,20,15,6,1]);assert.equal(binomial(6).reduce((a,b)=>a+b),64);
console.log('yao de ok');
