// Bridge: semantic address <-> 3-2-1 swarm bodies.
// address.gate -> its six-bit figure -> split by the swarm's own splitter into
//   tier 1: one 6-bit body, tier 2: two 3-bit trigrams, tier 3: three 2-bit packs.
// Nothing here is a lookup of meaning. The gate<->figure map is the inverse of the
// rule-derived KING_WEN_BY_TRIGRAMS; the split/join is six-bit-swarm.js; physics is
// fragment-bodies.js (repartition conserves mass and momentum).
// Bit convention (verified in semantic-address tests): bit 0 = line 1 (bottom).
import {KING_WEN_BY_TRIGRAMS} from './semantic-address.js';
import {profileToAddress} from './profile-address.js';
import {splitWord,compileWord,changeTier} from './six-bit-swarm.js';
import {SI_XIANG,TRIGRAM_MATRIX} from '../vendor/generative-state-space/fragments.js';

const FIGURE_BY_GATE=new Map([...KING_WEN_BY_TRIGRAMS].map(([figure,gate])=>[gate,figure]));
const WIDTH={1:6,2:3,3:2};

export function figureOfGate(gate){
 const f=FIGURE_BY_GATE.get(gate);if(f===undefined)throw new RangeError('gate must be 1-64');return f;}
export function gateOfFigure(figure){
 const g=KING_WEN_BY_TRIGRAMS.get(figure);if(g===undefined)throw new RangeError('figure must be 0-63');return g;}

// Which body (slot) at a tier holds a given line (1-6).
export function slotOfLine(line,tier){
 if(!Number.isInteger(line)||line<1||line>6)throw new RangeError('line must be 1-6');
 return Math.floor((line-1)/WIDTH[tier]);}

// Address -> bodies at tier 1, 2 or 3 (3 = the two-bit packs). Each body records the
// lines it carries and whether the address's own line sits in it. The address travels
// with the bodies so nothing about the position is lost.
export function addressToBodies(address,tier=3){
 if(!WIDTH[tier])throw new RangeError('tier must be 1, 2 or 3');
 const word=figureOfGate(address.gate),w=WIDTH[tier],active=address.line?slotOfLine(address.line,tier):null;
 return splitWord(word,tier).map(p=>({...p,lines:Array.from({length:w},(_,i)=>p.slot*w+i+1),carriesActiveLine:p.slot===active,address}));
}

// Bodies -> gate. Works at any tier; this is how a re-formed pack finds its gate.
export function bodiesToGate(parts){return gateOfFigure(compileWord(parts));}

// Re-split the same word at another tier (3 packs <-> 2 trigrams <-> 1 whole).
export function retier(parts,tier){
 const address=parts[0]?.address;return changeTier(parts,tier).map(p=>({...p,address}));}

// A changing line flips one bit: the resultant (Zhi Gua) of that line.
// Source: Hatcher, Yijing Word by Word p.43 (changing lines become their opposites).
export function changedGate(gate,line){
 if(!Number.isInteger(line)||line<1||line>6)throw new RangeError('line must be 1-6');
 return gateOfFigure(figureOfGate(gate)^(1<<(line-1)));}

// Things with no birth moment: design profile -> address -> bodies.
export function profileToBodies(counts,tier=3){
 const {address,leading}=profileToAddress(counts);return {leading,address,bodies:addressToBodies(address,tier)};}

// Meaning layer: the owner's Generative fragment algebra, vendored byte-identical
// (vendor/generative-state-space/fragments.js, page-cited to Hatcher, Govinda, Adler,
// Wen, Rutt). Lookup is by the body's own bits, bottom line = least significant bit,
// the same convention both sources use (all 64 gates cross-checked in tests).
const PACK_BY_VALUE=new Map(SI_XIANG.rows.map(r=>[r.bits[0]|(r.bits[1]<<1),r]));
const TRIGRAM_BY_VALUE=new Map(TRIGRAM_MATRIX.trigrams.map(t=>[t.valueCode,t]));

export function meaningOf(body){
 if(body.tier===3){const r=PACK_BY_VALUE.get(body.value);
  return {kind:'si xiang (two-line image)',emblem:r.emblem,element:r.element,season:r.season,direction:r.direction,dimension:r.primaryDimension,source:SI_XIANG.source};}
 if(body.tier===2){const t=TRIGRAM_BY_VALUE.get(body.value);
  return {kind:body.slot===0?'lower (inner) trigram':'upper (outer) trigram',id:t.id,image:t.natureImage,quality:t.quality,family:t.family,dimension:t.dimension,sources:t.sources};}
 if(body.tier===1)return {kind:'whole hexagram',gate:gateOfFigure(body.value)};
 throw new RangeError('body must have tier 1, 2 or 3');
}
export function readAddress(address,tier=3){
 return addressToBodies(address,tier).map(b=>({lines:b.lines,carriesActiveLine:b.carriesActiveLine,bits:b.value,meaning:meaningOf(b)}));
}
