// State-space canon: the structural rules of the five-dimension square.
// Every rule carries its source. Status: 'sourced' (printed on a page the owner
// supplied), 'owner' (stated by the owner, consistent with the pages),
// 'open' (not yet decided — must not be treated as settled).
// Nature chains and the 16 Boolean operators already live in
// dimensional-frames.js and boolean-state.js; this module reuses them.
import {NATURE_QUALITIES} from './dimensional-frames.js';
import {BINARY_BOOLEAN_FUNCTIONS} from './boolean-state.js';

const BB='Black Book';
export const DIMENSIONS=Object.freeze(['Movement','Evolution','Being','Design','Space']);

// Ra's numbering of the dimensions = the owner's creation order B-M-S-D-E.
export const CREATION_ORDER=Object.freeze({order:Object.freeze(['Being','Movement','Space','Design','Evolution']),status:'sourced',source:BB+' list "One. Being ... Five. Evolution"'});

// Corners of the square; Space is the centre ("When 4 is 5").
export const SQUARE=Object.freeze({
 corners:Object.freeze({
  Evolution:Object.freeze({row:'top',side:'left',human:'Mind',particle:'Electron',crystal:'Personality'}),
  Design:Object.freeze({row:'top',side:'right',human:'Ego',particle:'Neutrino',crystal:'Design'}),
  Being:Object.freeze({row:'bottom',side:'left',human:'Body',particle:'Quark',crystal:'Design'}),
  Movement:Object.freeze({row:'bottom',side:'right',human:'Individuality',particle:'Magnetic Monopole',crystal:null})
 }),
 centre:Object.freeze({dimension:'Space',human:'Personality',substance:false}),
 status:'sourced',source:BB+' "When 2 becomes 4" / "When 4 is 5" diagrams'
});

// Edges are never stored: an edge exists between two corners that share a row
// or a side. Frames only supply the name the edge takes in that frame.
export const FRAMES=Object.freeze({
 physics:Object.freeze({top:'Speed',bottom:'Force',left:'Material',right:'Position',centre:Object.freeze(['Personality','Space']),source:BB+' "When 2 becomes 4"'}),
 song:Object.freeze({top:'Tempo',bottom:'Appeal',left:'Musician',right:'Audience',centre:Object.freeze(['Song','Music','Rhythm']),source:BB+' "When the 5 is a Song"'})
});
// Which chart reads each position (capitals on the song page).
export const WHEELS=Object.freeze({values:Object.freeze({Evolution:'PW',Design:'DW',Being:'DW',Movement:'BG',Space:'PW'}),status:'sourced',source:BB+' "When the 5 is a Song"'});

export function edgeBetween(a,b,frame='physics'){
 const A=SQUARE.corners[a],B=SQUARE.corners[b],F=FRAMES[frame];
 if(!A||!B||a===b)throw Error('Edges join two distinct corners');
 if(!F)throw Error('Unknown frame: '+frame);
 let line=null;
 if(A.row===B.row)line=A.row;else if(A.side===B.side)line=A.side;
 if(!line)return null; // diagonal: passes through Space, not an edge
 return {corners:[a,b].sort(),line,name:F[line],frame,wheels:[WHEELS.values[a],WHEELS.values[b]],through:null};
}
export function diagonal(a,b){const e=edgeBetween(a,b);return e?null:{corners:[a,b].sort(),through:'Space'};}

// Crystals: two binaries and one single point.
export const CRYSTALS=Object.freeze({
 Personality:Object.freeze({members:Object.freeze(['Space','Evolution']),binary:true,centre:'Head',keynotes:Object.freeze(['I Communicate','I Remember'])}),
 Design:Object.freeze({members:Object.freeze(['Being','Design']),binary:true,centre:'Ajna',keynotes:Object.freeze(['I Am','I Design'])}),
 MagneticMonopole:Object.freeze({members:Object.freeze(['Movement']),binary:false,centre:'G',keynotes:Object.freeze(['I Create'])}),
 // Individuality also reads "I Define" in the macro/micro table: two pages read from
 // two levels (crystal vs human base). Both kept; neither is an error.
 status:'sourced',source:BB+' "The Crystals and the Monopole"'
});

// Base level: one question and one sense per dimension.
export const BASES=Object.freeze([
 Object.freeze({base:1,dimension:'Movement',human:'Individuality',polarity:'Yang/Yang',question:'Where',sense:'Seeing',keynote:'I Define'}),
 Object.freeze({base:2,dimension:'Evolution',human:'Mind',polarity:'Yang/Yin',question:'What',sense:'Taste',keynote:'I Remember'}),
 Object.freeze({base:3,dimension:'Being',human:'Body',polarity:'Yin/Yin',question:'When',sense:'Touching',keynote:'I Am'}),
 Object.freeze({base:4,dimension:'Design',human:'Ego',polarity:'Yin/Yang',question:'Why',sense:'Smell',keynote:'I Design'}),
 Object.freeze({base:5,dimension:'Space',human:'Personality',polarity:null,question:'Who',sense:'Hearing',keynote:'I Think'})
]);
export const BASES_SOURCE='Rave course PDF p.40 base table';

export const COLORS=Object.freeze([
 [1,'Fear','Appetite'],[2,'Hope','Taste'],[3,'Desire','Thirst'],[4,'Need','Touch'],[5,'Guilt','Sound'],[6,'Innocence','Light']
].map(([color,response,determination])=>Object.freeze({color,response,determination})));
export const TONES=Object.freeze([
 [1,'Security','Smell','Splenic'],[2,'Uncertainty','Taste','Splenic'],[3,'Action','Outer Vision','Ajna'],
 [4,'Meditation','Inner Vision','Ajna'],[5,'Judgement','Feeling','Solar Plexus'],[6,'Acceptance','Touch','Solar Plexus']
].map(([tone,theme,sense,binary])=>Object.freeze({tone,theme,sense,binary})));
export const COLOR_TONE_SOURCE='PHS course p.19, p.40 tables; Four Keys / Determination charts';

// What each level can see.
export const LEVEL_VISIBILITY=Object.freeze({
 base:Object.freeze({dimensions:DIMENSIONS,status:'sourced',note:'five bases, one per dimension'}),
 color:Object.freeze({dimensions:Object.freeze(['Movement','Evolution','Being','Design']),status:'owner',note:'Color is the fourth dimension and does not see Space; carries Sound (what is heard), not Hearing (Space\'s sense)'}),
 tone:Object.freeze({dimensions:null,status:'open',note:'not yet decided'})
});
export function senseAt(level,position){
 if(level==='base')return BASES[position-1]?.sense??null;
 if(level==='color')return COLORS[position-1]?.determination??null;
 if(level==='tone')return TONES[position-1]?.sense??null;
 throw Error('Unknown level: '+level);
}

// Being's chain has a printed gap: "Matter is" with no object.
export const BEING_GAP=Object.freeze({after:'Matter',status:'sourced',source:BB+' nature tables (both printings)'});
export function chainLength(dimension){const chain=NATURE_QUALITIES[dimension];if(!chain)throw Error('Unknown dimension');return 1+chain.filter(q=>!(dimension==='Being'&&q==='Is')).length;}

// The centre is not stored: it is the interplay of whichever corners are active.
// With all four present Space exists; with fewer it does not ("When there is only 3 of the 5").
// How the centre takes its words from the corners is still open.
export function centre(active){
 const corners=[...new Set(active)].filter(d=>SQUARE.corners[d]);
 return {dimension:'Space',present:corners.length===4,from:corners.sort(),words:null,status:'open: word rule not decided'};
}

// The centre is the reader's origin (owner, 2026-11-13): whoever reads sits at the centre,
// and the other four dimensions surround it as what makes them. Ra's square is read from
// Space; the four si xiang images are read from Being (Generative fragments.js). Same rule.
export function squareFrom(origin){
 if(!DIMENSIONS.includes(origin))throw Error('Unknown origin dimension: '+origin);
 return {centre:origin,around:DIMENSIONS.filter(d=>d!==origin),status:'owner'};
}

export const SOURCE_DIMENSIONS=Object.freeze({
 'Human Design':Object.freeze({dimension:'Being',status:'owner'}),
 Zhouyi:Object.freeze({dimension:'Movement',status:'open'}),
 Yijing:Object.freeze({dimension:'Evolution (reading Movement)',status:'open'}),
 Gnostic:Object.freeze({dimension:'Design (from Being)',status:'open'}),
 Govinda:Object.freeze({dimension:'Space',status:'open'})
});

export const OPERATORS=Object.freeze({names:BINARY_BOOLEAN_FUNCTIONS,count:BINARY_BOOLEAN_FUNCTIONS.length,note:'XOR is one view of one path, not the address algebra',status:'owner'});

export const OPEN=Object.freeze([
 'Tone-level visibility','How the centre takes its words from all four corners','Edge directions (owner: Movement bottom->top, Being top->bottom)',
 'What capitals change in behaviour beyond wheel labels','12 or 13 placements for things','Which of the 16 operators serve which quarter/dimension','Source-to-dimension assignments other than Human Design'
]);
