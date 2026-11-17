import {exampleAddress, hash, stable} from './ontology.js';

const copy = value => structuredClone(value);
const validId = id => typeof id === 'string' && /^[a-z][a-z0-9_.-]{0,100}$/i.test(id)
  && !['constructor', 'prototype', '__proto__'].includes(id);

function matches(value, constraints = []) {
  return constraints.every(({path = [], equals, includes, minimum, maximum}) => {
    const found = path.reduce((v, key) => v?.[key], value);
    if (equals !== undefined && stable(found) !== stable(equals)) return false;
    if (includes !== undefined && !(Array.isArray(found) || typeof found === 'string' ? found.includes(includes) : false)) return false;
    if (minimum !== undefined && !(typeof found === 'number' && found >= minimum)) return false;
    if (maximum !== undefined && !(typeof found === 'number' && found <= maximum)) return false;
    return true;
  });
}

function mergePlans(tokens) {
  const nodes = new Map();
  for (const token of tokens) for (const step of token.plan) nodes.set(step.id, step);
  return [...nodes.values()];
}

/** A bounded, deterministic dataflow search. It contains no task/format recipes.
 * Registered functions are trusted primitive implementations, never generated JS.
 * Search executes pure primitives only; rendering consumes a verified artifact.
 */
export class PrimitiveSwarm {
  constructor(core, {id = 'primitive.swarm', maxTokens = 96, maxAttempts = 384, maxDepth = 7} = {}) {
    if (!validId(id) || ![maxTokens, maxAttempts, maxDepth].every(n => Number.isInteger(n) && n > 0)) throw Error('Invalid swarm limits');
    this.core = core;
    this.id = id;
    this.registry = new Map();
    this.types = new Map();
    if (!core.entities.has(id)) core.create({
      id, label: 'Primitive composition swarm', address: exampleAddress(), dimension: 'Design',
      functions: ['compose', 'inspect'],
      state: {objective: '', progress: {}, goal: null, epoch: 0, running: false, status: 'waiting',
        inputs: [], tokens: [], attempted: [], executions: 0, tick: 0, result: null,
        clusters: [], feedback: {}, limits: {maxTokens, maxAttempts, maxDepth}}
    });
  }

  get state() { return this.core.require(this.id).state; }
  change(patch, reason) { this.core.change(this.id, patch, reason); }

  registerType(name, validate) {
    if (!validId(name) || typeof validate !== 'function') throw Error('A type needs a name and validator');
    this.types.set(name, validate);
    return this;
  }

  validate(type, value) {
    if (!this.types.has(type) || !this.types.get(type)(value)) throw Error('Value does not satisfy type: ' + type);
    const encoded = stable(value);
    if (encoded === undefined || encoded.length > 32768) throw Error('Primitive value exceeds the bounded data contract');
    return value;
  }

  register(spec, {persist = true} = {}) {
    const {id, inputs, output, run, version = 1, cost = 1, guard = null} = spec;
    if (!validId(id) || !inputs || typeof inputs !== 'object' || Array.isArray(inputs)
      || Object.keys(inputs).some(k => !validId(k)) || !this.types.has(output)
      || Object.values(inputs).some(t => !this.types.has(t)) || typeof run !== 'function'
      || !Number.isInteger(version) || version < 1 || !Number.isFinite(cost) || cost <= 0
      || guard !== null && typeof guard !== 'function' || spec.effect && spec.effect !== 'pure') throw Error('Invalid pure primitive contract');
    const previous = this.registry.get(id);
    this.registry.set(id, {...spec, version, cost, guard});
    if (previous && previous.version !== version) this.change({
      tokens: this.state.tokens.filter(t => t.plan.length === 0), attempted: [], executions: 0,
      result: null, status: this.state.goal ? 'searching' : 'waiting'
    }, 'changed primitive contract invalidates derived evidence');
    if (persist) {
      const entityId = this.id + '.primitive.' + id;
      const descriptor = {primitive: id, version, inputs: copy(inputs), output, cost, effect: 'pure'};
      if (!this.core.entities.has(entityId)) this.core.create({id: entityId, label: id,
        dimension: 'Design', address: exampleAddress(), functions: ['evaluate'], state: descriptor});
      else if (stable(this.core.require(entityId).state) !== stable(descriptor)) this.core.change(entityId, descriptor, 'primitive contract updated');
    }
    // New/revised primitives reopen an unsolved goal without throwing away evidence.
    if (this.state.goal && !this.state.result && this.state.status === 'blocked') this.change({status: 'searching', running: true}, 'new primitive may close the capability gap');
    return this;
  }

  observe(inputs, {objective = this.state.objective, progress = this.state.progress} = {}) {
    if (!Array.isArray(inputs) || inputs.length > this.state.limits.maxTokens
      || new Set(inputs.map(x => x.id)).size !== inputs.length) throw Error('Inputs require distinct bounded identities');
    const tokens = inputs.map(({id, type, value}) => {
      if (!validId(id)) throw Error('Invalid input identity');
      this.validate(type, value);
      return {ref: '$' + id, id, type, value: copy(value), plan: [], depth: 0};
    });
    this.change({objective: String(objective), progress: copy(progress), inputs: copy(inputs), tokens,
      epoch: this.state.epoch + 1, attempted: [], executions: 0, result: null,
      status: this.state.goal ? 'searching' : 'waiting', running: !!this.state.goal}, 'new observations invalidate derived candidates; purpose and progress remain separate');
    return this;
  }

  seek(goal) {
    const operations = ['equals','includes','minimum','maximum'];
    if (!goal || !this.types.has(goal.type) || Object.keys(goal).some(k => !['type','constraints'].includes(k))
      || goal.constraints && (!Array.isArray(goal.constraints) || goal.constraints.length > 64
      || goal.constraints.some(c => !c || typeof c !== 'object' || !Array.isArray(c.path ?? [])
        || (c.path ?? []).length > 32 || (c.path ?? []).some(k => !['string','number'].includes(typeof k))
        || Object.keys(c).some(k => !['path',...operations].includes(k))
        || !operations.some(k => Object.hasOwn(c,k))
        || ['minimum','maximum'].some(k => Object.hasOwn(c,k) && !Number.isFinite(c[k]))))) {
      throw Error('Goal requires a registered output type and explicit supported constraints');
    }
    // Goal changes preserve observations, progress, feedback, and learned clusters.
    this.change({goal: copy(goal), result: null, running: true, status: 'searching', attempted: [], executions: 0}, 'goal changed; discover a composition from current primitives');
    return this;
  }

  control(running) {
    this.change({running: !!running && !!this.state.goal && !['satisfied', 'exhausted'].includes(this.state.status)}, 'composition supervisor');
  }

  *bindings(spec, tokens, ports = Object.keys(spec.inputs), index = 0, binding = {}) {
    if (index === ports.length) { yield {...binding}; return; }
    const port = ports[index];
    for (const token of tokens) if (token.type === spec.inputs[port]) {
      binding[port] = token;
      yield* this.bindings(spec, tokens, ports, index + 1, binding);
    }
  }

  nextCandidate() {
    const tried = new Set(this.state.attempted), candidates = [];
    let inspected = 0;
    this.searchTruncated = false;
    search: for (const spec of this.registry.values()) for (const binding of this.bindings(spec, this.state.tokens)) {
      if (++inspected > 20000) { this.searchTruncated = true; break search; }
      const depth = 1 + Math.max(0, ...Object.values(binding).map(t => t.depth));
      const refs = Object.fromEntries(Object.entries(binding).map(([p,t]) => [p,t.ref]));
      const key = stable({id: spec.id, version: spec.version, refs});
      if (depth > this.state.limits.maxDepth || tried.has(key)) continue;
      const feedback = this.state.feedback[spec.id]?.value ?? 0;
      candidates.push({spec, binding, refs, key, depth, score: Math.max(.05, spec.cost - .5*feedback)});
      if (candidates.length >= 4096) { this.searchTruncated = true; break search; }
    }
    return candidates.sort((a,b) => a.depth-b.depth || a.score-b.score || a.key.localeCompare(b.key))[0];
  }

  step() {
    if (!this.state.running || !this.state.goal) return false;
    const existing = this.state.tokens.filter(t => t.type === this.state.goal.type && matches(t.value, this.state.goal.constraints));
    if (existing.length) {
      const result = existing.sort((a,b) => this.planScore(a.plan)-this.planScore(b.plan))[0];
      this.complete(result);
      return true;
    }
    if (this.state.executions >= this.state.limits.maxAttempts || this.core.events.length > 44000) {
      this.change({running: false, status: 'exhausted'}, 'composition execution limit');
      return false;
    }
    const candidate = this.nextCandidate();
    if (!candidate) { this.change({running: false, status: this.searchTruncated ? 'exhausted' : 'blocked'}, this.searchTruncated ? 'candidate inspection limit; no completeness claim' : 'no compatible untried primitive bindings'); return false; }
    const {spec, binding, refs, key, depth} = candidate;
    const input = Object.fromEntries(Object.entries(binding).map(([p,t]) => [p,copy(t.value)]));
    let tokens = [...this.state.tokens], status = 'executed', issue = null;
    try {
      if (spec.guard && !spec.guard(copy(input))) throw Error('primitive precondition rejected these inputs');
      const value = spec.run(copy(input));
      if (value && typeof value.then === 'function') throw Error('pure primitives must return synchronously');
      this.validate(spec.output, value);
      const step = {id: '@' + hash(key), primitive: spec.id, version: spec.version, inputs: refs};
      const previousStep = tokens.flatMap(t => t.plan).find(s => s.id === step.id);
      if (previousStep && stable(previousStep) !== stable(step)) throw Error('Primitive binding identity collision');
      const plan = [...mergePlans(Object.values(binding)), step];
      const token = {ref: step.id, type: spec.output, value: copy(value), depth, plan};
      const duplicate = tokens.findIndex(t => t.type === token.type && stable(t.value) === stable(token.value));
      if (duplicate < 0) {
        if (tokens.length >= this.state.limits.maxTokens) throw Error('working token limit reached');
        tokens.push(token);
      } else if (this.planScore(plan) < this.planScore(tokens[duplicate].plan)) tokens[duplicate] = token;
    } catch (error) { status = 'rejected'; issue = error.message; }
    const prior = this.state.feedback[spec.id] ?? {n: 0, value: 0}, n = prior.n + 1;
    const reward = status === 'executed' ? .1 : -1;
    const feedback = {...this.state.feedback, [spec.id]: {n, value: prior.value + (reward-prior.value)/n}};
    this.core.record('observation.recorded', {kind: 'primitive-execution', primitive: spec.id,
      version: spec.version, inputs: refs, status, issue, epoch: this.state.epoch});
    this.change({tokens, feedback, attempted: [...this.state.attempted, key], executions: this.state.executions+1, tick: this.state.tick+1}, 'primitive consequence enters shared working state');
    return true;
  }

  planScore(plan) {
    return plan.reduce((total, step) => total + Math.max(.05,
      (this.registry.get(step.primitive)?.cost ?? 1000)
      - .5*(this.state.feedback[step.primitive]?.value ?? 0)), 0);
  }

  complete(token) {
    let cluster = null;
    if (token.plan.length) {
      const graph = {steps: token.plan, output: token.ref, outputType: token.type};
      const signature = stable(graph), id = this.id + '.cluster.' + hash(signature);
      const external = new Set(token.plan.flatMap(s => Object.values(s.inputs)).filter(ref => ref.startsWith('$')));
      const inputs = Object.fromEntries(this.state.inputs.filter(t => external.has('$'+t.id)).map(t => [t.id,t.type]));
      if (!this.core.entities.has(id)) {
        const children = [...new Set(token.plan.map(s => this.registry.get(s.primitive)?.entityId ?? this.id+'.primitive.'+s.primitive))];
        this.core.compose({id, label: token.plan.map(s => s.primitive).join(' → '), children,
          dimension: 'Design', address: exampleAddress(), functions: ['invoke','inspect']});
        this.core.change(id, {graph, inputs, signature, status: 'verified', epoch: this.state.epoch}, 'verified result promotes its actual primitive graph to a reusable capability');
        for (const step of graph.steps) for (const ref of Object.values(step.inputs)) {
          const source = graph.steps.find(s => s.id === ref);
          if (source) this.core.relate({source: this.registry.get(source.primitive)?.entityId ?? this.id+'.primitive.'+source.primitive,
            target: this.registry.get(step.primitive)?.entityId ?? this.id+'.primitive.'+step.primitive,
            kind: 'primitive-port-binding', projection: 'dependency', dimension: 'Design', context: {cluster: id, from: source.id, to: step.id}});
        }
      } else if (this.core.require(id).state.signature !== signature) throw Error('Cluster identity collision');
      cluster = id;
      this.change({clusters: [...new Set([...this.state.clusters, id])]}, 'retain discovered capability');
      this.restoreCluster(id);
    }
    this.change({result: {type: token.type, value: copy(token.value), cluster, ref: token.ref},
      status: 'satisfied', running: false}, 'goal satisfied by executed primitive composition');
  }

  runGraph(graph, input) {
    const outer = !this.graphBudget;
    if (outer) this.graphBudget = {remaining: this.state.limits.maxAttempts, depth: 0};
    this.graphBudget.depth++;
    try {
    if (this.graphBudget.depth > this.state.limits.maxDepth) throw Error('Nested cluster depth limit');
    const values = new Map(Object.entries(input).map(([id,value]) => ['$'+id, copy(value)]));
    for (const step of graph.steps) {
      if (--this.graphBudget.remaining < 0) throw Error('Nested cluster execution limit');
      const primitive = this.registry.get(step.primitive);
      if (!primitive || primitive.version !== step.version) throw Error('Cluster needs its original primitive contract: '+step.primitive);
      const args = {};
      for (const [port,ref] of Object.entries(step.inputs)) {
        if (!values.has(ref)) throw Error('Missing graph input: '+ref);
        args[port] = copy(this.validate(primitive.inputs[port], values.get(ref)));
      }
      if (primitive.guard && !primitive.guard(copy(args))) throw Error('Cluster precondition rejected');
      const result = primitive.run(copy(args));
      if (result && typeof result.then === 'function') throw Error('pure primitives must return synchronously');
      values.set(step.id, copy(this.validate(primitive.output, result)));
    }
    if (!values.has(graph.output)) throw Error('Cluster has no produced output');
    return copy(values.get(graph.output));
    } finally { this.graphBudget.depth--; if (outer) this.graphBudget = null; }
  }

  invoke(id, input) {
    const state = this.core.require(id).state;
    for (const [port,type] of Object.entries(state.inputs)) this.validate(type, input[port]);
    return this.runGraph(state.graph, input);
  }

  restoreCluster(id) {
    const entity = this.core.require(id), {graph, inputs} = entity.state;
    // A cluster becomes a primitive at the next scale, retaining its entire graph.
    if (graph.steps.some(s => !this.registry.has(s.primitive))) return false;
    const primitiveId = 'cluster.' + id.split('.').at(-1);
    this.register({id: primitiveId, inputs, output: graph.outputType, version: 1,
      cost: Math.max(.1, this.planScore(graph.steps) * .8), entityId: id,
      run: values => this.runGraph(graph, values)}, {persist: false});
    return true;
  }

  feedback(id, reward) {
    if (!Number.isFinite(reward) || reward < -1 || reward > 1) throw Error('Feedback must be in -1..1');
    const key = id.startsWith(this.id+'.cluster.') ? 'cluster.'+id.split('.').at(-1) : id;
    if (!this.registry.has(key)) throw Error('Feedback requires an executable primitive or cluster');
    const prior = this.state.feedback[key] ?? {n: 0, value: 0}, n = prior.n+1;
    this.change({feedback: {...this.state.feedback, [key]: {n, value: prior.value+(reward-prior.value)/n}}}, 'observed feedback changes later composition ranking');
  }
}
