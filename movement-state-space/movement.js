/**
 * Movement dimension: source-faithful standalone state-space seed.
 * No LLM, GPU, browser, or package dependency. No inferred correspondences.
 * Source: "The Crystals and the Monopole", printed page 5, PDF page 9,
 * user-provided screenshot (2026-11-09).
 */
export const MOVEMENT_SOURCE = Object.freeze({
  title: "The Crystals and the Monopole",
  printedPage: 5,
  pdfPage: 9,
  section: "The Magnetic Monopole",
  description: "The Attractor",
  uniqueness: "Your Uniqueness",
  location: "G Center",
  perspective: "Individuality",
  dimension: "Movement",
  direction: "bottom_to_top",
  keynote: "I Create",
  // The author's textual chain, not a spatial map or causal proof.
  terms: Object.freeze(["Movement", "Energy", "Creation", "Seeing", "Landscape", "Environment"]),
  connector: "is",
  semanticOperator: null,
  correspondences: null
});
const own=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
const clone=value=>JSON.parse(JSON.stringify(value));

export class MovementStateSpace {
  #states=new Map();
  #events=[];
  #next=0;
  constructor() {
    this.source=MOVEMENT_SOURCE;
    this.perspectives=Object.freeze([MOVEMENT_SOURCE.perspective]);
    this.links=Object.freeze(MOVEMENT_SOURCE.terms.slice(0,-1).map((from,index)=>
      Object.freeze({from,to:MOVEMENT_SOURCE.terms[index+1],sourceConnector:"is",
        interpretation:null,sourceIndex:index})));
  }
  get terms(){return [...this.source.terms];}
  get events(){return clone(this.#events);}
  get states(){return [...this.#states.values()].map(clone);}
  inspect(){
    return {dimension:"Movement",perspective:"Individuality",
      orientation:"bottom_to_top",terms:this.terms,links:this.links.map(clone),
      keynote:this.source.keynote,operatorMeaning:null,correspondences:null};
  }
  // Observations are never silently treated as established source facts.
  observe({subject,expression,context="",origin="user",quality=null}){
    for(const [name,value] of Object.entries({subject,expression,context,origin}))
      if(typeof value!=="string" || (["subject","expression","origin"].includes(name)&&!value.trim()))
        throw new TypeError(name+" must be a nonempty string (context may be empty)");
    if(quality!==null && (typeof quality!=="object" || Array.isArray(quality)))
      throw new TypeError("quality must be a record or null");
    const id="movement:"+String(++this.#next);
    const state={id,dimension:"Movement",perspective:"Individuality",
      subject,expression,context,origin,quality:quality===null?null:clone(quality),
      interpretationStatus:"unverified",createdOrder:this.#next};
    this.#states.set(id,state);
    this.#events.push({type:"observation",stateId:id,order:this.#next});
    return clone(state);
  }
  compare(a,b){
    if(!this.#states.has(a)||!this.#states.has(b))throw new RangeError("unknown observation");
    const left=this.#states.get(a),right=this.#states.get(b);
    // Comparison reports explicit differences; does not pretend to understand them.
    const fields=["subject","expression","context","origin","quality"];
    return {left:a,right:b,sharedPerspective:"Individuality",
      differences:fields.filter(k=>JSON.stringify(left[k])!==JSON.stringify(right[k]))
        .map(k=>({field:k,left:clone(left[k]),right:clone(right[k])})),
      semanticJudgment:null};
  }
  export(){
    return {schema:"movement-state-space-v1",source:clone(this.source),
      observations:this.states,events:this.events};
  }
  static import(snapshot){
    if(!snapshot || snapshot.schema!=="movement-state-space-v1" ||
       JSON.stringify(snapshot.source)!==JSON.stringify(MOVEMENT_SOURCE) ||
       !Array.isArray(snapshot.observations) || !Array.isArray(snapshot.events))
      throw new TypeError("incompatible Movement snapshot or source");
    const instance=new MovementStateSpace();
    for(const s of snapshot.observations){
      if(!s || s.dimension!=="Movement" || s.perspective!=="Individuality" ||
         s.interpretationStatus!=="unverified" || s.id!=="movement:"+String(instance.#next+1))
        throw new TypeError("invalid observation ordering");
      const inserted=instance.observe(s);
      if(JSON.stringify(inserted)!==JSON.stringify(s))throw new TypeError("invalid observation content");
    }
    if(JSON.stringify(instance.events)!==JSON.stringify(snapshot.events))
      throw new TypeError("invalid event history");
    return instance;
  }
}
