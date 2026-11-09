// Vocabulary transcribed from the supplied Black Book page 5 and pp.112–118.
// These are named qualitative relations, not five scalar qualities.
export const NATURE_QUALITIES=Object.freeze({
 Movement:Object.freeze(['Energy','Creation','Seeing','Landscape','Environment']),
 Evolution:Object.freeze(['Gravity','Memory','Taste','Love','Light']),
 Being:Object.freeze(['Matter','Is','Touch','Sex','Survival']),
 Design:Object.freeze(['Structure','Progress','Smell','Life','Art']),
 Space:Object.freeze(['Form','Illusion','Hearing','Music','Freedom'])
});
export const HUMAN_QUALITIES=Object.freeze({
 Movement:Object.freeze(['Individuality','Activity','Reaction','Limitation','Perspective','Relation','Uniqueness']),
 Evolution:Object.freeze(['Mind','Character','Separation','Nature','Integration','Spirit','Role']),
 Being:Object.freeze(['Body','Biology','Chemistry','Objectivity','Geometry','Trajectory','Genetics']),
 Design:Object.freeze(['Ego','Homo Sapiens','Growth','Decay','Continuity','Manifestation','Self']),
 Space:Object.freeze(['Personality','Type','Fantasy','Subjectivity','Rhythm','Timing','Presence'])
});
export const QUALITY_CATALOG=Object.freeze(Object.fromEntries(Object.keys(NATURE_QUALITIES).map(d=>[d,Object.freeze([...NATURE_QUALITIES[d],...HUMAN_QUALITIES[d]])])));
export const DIMENSION_NAMES=Object.freeze(Object.keys(QUALITY_CATALOG));
export function validateFramePath(path){if(!Array.isArray(path)||path.length>32)throw Error('A local frame path must have at most 32 resolved steps');for(const step of path)if(!QUALITY_CATALOG[step.dimension]?.includes(step.quality))throw Error('Unknown dimensional quality in local frame path');return path;}
export function facetKey(path,dimension,quality){validateFramePath(path);if(!QUALITY_CATALOG[dimension]?.includes(quality))throw Error('Unknown source quality');return [...path.map(s=>s.dimension+'/'+s.quality),dimension+'/'+quality].join(' > ');}
export function resolveDimensionalFrame(entity,path=[]){validateFramePath(path);const views=Object.fromEntries(DIMENSION_NAMES.map(d=>[d,{dimension:d,identity:entity.dimension,qualities:QUALITY_CATALOG[d].map((quality,index)=>{const next=[...path,{dimension:d,quality}],key=facetKey(path,d,quality),nature=index<NATURE_QUALITIES[d].length;return {quality,position:index,attributes:structuredClone(entity.state.facets?.[key]||{}),next:nature?NATURE_QUALITIES[d][index+1]||null:null,relation:nature?'nature-chain':'human-expression',source:nature?'Black Book printed page 5':'Black Book printed pages 115–118',frame:{entity:entity.id,path:next},dimensions:Object.fromEntries(DIMENSION_NAMES.map(other=>[other,{entity:entity.id,path:next,dimension:other}]))};}),dimensions:Object.fromEntries(DIMENSION_NAMES.map(other=>[other,{entity:entity.id,path,dimension:other}]))}]));return {identity:entity.id,address:structuredClone(entity.address),dominatingStructure:entity.frame||entity.id,path:structuredClone(path),views,rule:'recursive-qualified-frame/v1; source vocabulary, explicit relation paths',lazy:true};}
