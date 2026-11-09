// Opt-in live Klein decision bridge. Does not change the Swarm's default policy.
// A real resolver must supply a sourced reading and select an existing candidate.
export function attachKleinResolver(swarm, resolver) {
  if (!swarm || typeof swarm.decide !== 'function' || typeof swarm.validate !== 'function')
    throw new TypeError('Expected an existing AutonomousSwarm');
  if (typeof resolver !== 'function') throw new TypeError('Real Klein resolver required');
  const original = swarm.decide;
  if (swarm.__kleinResolverAttached) throw new Error('Resolver already attached');
  const evidence = [];
  swarm.decide = function (agent) {
    const candidates = this.candidates(agent);
    if (!candidates.length) return undefined;
    const observation = {
      schema: 'klein-swarm-observation/v1',
      agent: agent.id, tick: this.state.tick,
      context_id: 'swarm:' + agent.id,
      source_tool: 'Codex3/AutonomousSwarm.candidates',
      position: agent.state.position3D || [agent.state.position, 0, 0],
      needs: structuredClone(agent.state.generatedGoals || []),
      relations: structuredClone(agent.state.ties || {}),
      experiences: structuredClone((agent.state.experiences || []).slice(-16)),
      candidates: candidates.map(({action, target, component}) => ({action, target, ...(component ? {component} : {})}))
    };
    // Synchronous by design: existing step() is synchronous and deterministic.
    // Never execute a proposed command, script, or unchecked target.
    let result;
    try { result = resolver(structuredClone(observation)); } catch (error) {
      evidence.push({tick: this.state.tick, agent: agent.id, status: 'resolver-error', message: String(error).slice(0,160)});
      return original.call(this, agent);
    }
    if (!result || typeof result.then === 'function' ||
        result.context_id !== observation.context_id ||
        typeof result.source_tool !== 'string' || !result.source_tool ||
        !result.choice || typeof result.choice !== 'object') {
      evidence.push({tick: this.state.tick, agent: agent.id, status: 'unverified'});
      return original.call(this, agent);
    }
    const chosen = candidates.find(c => c.action === result.choice.action &&
      c.target === result.choice.target && (c.component || null) === (result.choice.component || null));
    if (!chosen || !this.validate(agent, chosen)) {
      evidence.push({tick: this.state.tick, agent: agent.id, status: 'rejected'});
      return original.call(this, agent);
    }
    evidence.push({tick: this.state.tick, agent: agent.id, status: 'accepted',
      action: chosen.action, target: chosen.target, source_tool: result.source_tool});
    if (evidence.length > 256) evidence.shift();
    return chosen;
  };
  Object.defineProperty(swarm, '__kleinResolverAttached', {value: true, configurable: true});
  return {
    evidence,
    detach() { swarm.decide = original; delete swarm.__kleinResolverAttached; },
  };
}
