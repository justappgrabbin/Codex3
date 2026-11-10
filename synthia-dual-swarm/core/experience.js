import {exampleAddress, hash} from './ontology.js';
import {primitiveSwarm} from './primitives.js';

// Purpose and retained progress are data. There are no experience names, canned
// lessons, component menus, or preselected execution paths in this adapter.
export class ExperienceSession {
  constructor(core) { this.core = core; }
  get exists() { return this.core.entities.has('experience.activity'); }
  get state() { return this.core.require('experience.activity').state; }
  get runtime() { return primitiveSwarm(this.core); }

  start(activity, observations, goal) {
    if (!activity?.subject || !activity.objective || !Array.isArray(observations) || !goal) {
      throw Error('Supply the actual activity, typed observations, and an output contract');
    }
    if (!this.exists) this.core.create({id:'experience.activity', label:activity.subject,
      address:exampleAddress(), dimension:'Design', functions:['inspect'], state:{
        subject:String(activity.subject), objective:String(activity.objective),
        information:structuredClone(activity.information ?? []), progress:structuredClone(activity.progress ?? {}),
        artifact:null, activeCluster:null, resultKey:null
      }});
    this.runtime.observe(observations, {objective:this.state.objective, progress:this.state.progress}).seek(goal);
    return this;
  }

  request(text) {
    let goal;
    try { goal = JSON.parse(text); }
    catch { return {accepted:false, reason:'No grounded output contract was supplied. The swarm has not selected a format from keywords.'}; }
    if (!this.exists) return {accepted:false, reason:'Observe the current selection first; no activity or lesson has been fabricated.'};
    this.runtime.seek(goal);
    return {accepted:true};
  }

  synchronize() {
    if (!this.exists) return;
    const result = this.runtime.state.result;
    if (!result || result.type !== 'artifact') return;
    const key = hash({epoch:this.runtime.state.epoch, goal:this.runtime.state.goal, result});
    if (this.state.resultKey === key) return;
    const previous = this.state.activeCluster;
    if (previous && previous !== result.cluster) this.core.change(previous, {active:false}, 'release previous arrangement; retain its executable lineage');
    if (result.cluster) this.core.change(result.cluster, {active:true}, 'activate verified primitive composition');
    this.core.change('experience.activity', {artifact:structuredClone(result.value), activeCluster:result.cluster, resultKey:key}, 'replace arrangement only after the swarm produces a validated result; purpose and progress retained');
  }

  recordProgress(patch) {
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw Error('Progress requires an observed data patch');
    const progress = {...this.state.progress, ...structuredClone(patch)};
    this.core.change('experience.activity', {progress}, 'retain observed progress independently from composition');
    this.runtime.change({progress}, 'shared progress observation');
  }
}
