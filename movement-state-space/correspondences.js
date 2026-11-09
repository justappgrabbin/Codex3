/** Reviewable correspondence notebook for the Movement source chain.
 * A proposed correspondence is NOT an established source fact.
 * No assumptions about Klein mappings or other dimensions are made here.
 */
import {MOVEMENT_SOURCE} from "./movement.js";

const copy = x => JSON.parse(JSON.stringify(x));
const valid = x => typeof x === "string" && x.trim().length > 0;
const statuses = new Set(["proposed","accepted","rejected"]);

export class MovementCorrespondences {
  #entries = [];
  #next = 0;
  get entries(){return copy(this.#entries);}
  propose({term,word,perspective,source,reason}){
    if(!MOVEMENT_SOURCE.terms.includes(term))throw new RangeError("unknown Movement term");
    if(![word,perspective,source,reason].every(valid))
      throw new TypeError("word, perspective, source and reason are required");
    const entry = {id:"correspondence:"+ ++this.#next,term,word,perspective,source,reason,
      status:"proposed",review:null};
    this.#entries.push(entry);
    return copy(entry);
  }
  review(id,{status,reason,reviewer}){
    if(!["accepted","rejected"].includes(status))throw new RangeError("invalid review status");
    if(!valid(reason)||!valid(reviewer))throw new TypeError("reason and reviewer required");
    const entry=this.#entries.find(x=>x.id===id);
    if(!entry)throw new RangeError("unknown correspondence");
    if(entry.status!=="proposed")throw new Error("review is final; propose a revision as a new entry");
    entry.status=status;
    entry.review={reason,reviewer};
    return copy(entry);
  }
  forTerm(term,{status=null}={}){
    if(!MOVEMENT_SOURCE.terms.includes(term))throw new RangeError("unknown Movement term");
    if(status!==null&&!statuses.has(status))throw new RangeError("unknown status");
    return copy(this.#entries.filter(e=>e.term===term&&(status===null||e.status===status)));
  }
  export(){return {schema:"movement-correspondences-v1",entries:this.entries};}
  static import(snapshot){
    if(!snapshot||snapshot.schema!=="movement-correspondences-v1"||!Array.isArray(snapshot.entries))
      throw new TypeError("invalid correspondence snapshot");
    const result=new MovementCorrespondences();
    for(const original of snapshot.entries){
      if(!original||original.id!=="correspondence:"+(result.#next+1)||!statuses.has(original.status))
        throw new TypeError("invalid entry or order");
      const created=result.propose(original);
      if(original.status!=="proposed"){
        if(!original.review)throw new TypeError("missing review");
        result.review(created.id,{...original.review,status:original.status});
      }
      if(JSON.stringify(result.#entries.at(-1))!==JSON.stringify(original))
        throw new TypeError("correspondence mismatch");
    }
    return result;
  }
}
