// Klein/MESSY is an observer of the existing Dynamic Swarm, not its controller.
// Consume the substrate's committed world transitions; do not replace decide().
// The Swarm remains the world and retains its native physics, routing and learning.
export function attachKleinObserver(swarm, interpret) {
 if (!swarm?.core?.onChange || !swarm?.core?.record || typeof interpret !== 'function')
   throw new TypeError('Dynamic Swarm substrate and original interpreter required');
 const observations=[];
 let active=true, busy=false;
 const stop=swarm.core.onChange(event=>{
  if (!active || busy || !['entity.changed','relation.created','signal.delivered','observation.recorded','gate.changed'].includes(event.type)) return;
  // Observe committed events, not imagined external decisions.
  // Ignore self-generated audit events to avoid recursion.
  if (event.type==='observation.recorded' && event.data?.kind==='klein-world-reading') return;
  const input={
   schema:'dynamic-swarm/klein-observation/v1',
   context_id:'swarm-event:'+event.seq,
   source_tool:'Codex3/Substrate.record',
   event:structuredClone(event),
   world:{entities:[...swarm.core.entities.values()].map(e=>({
    id:e.id,dimension:e.dimension,address:structuredClone(e.address),
    state:structuredClone(e.state)})),
    relations:[...swarm.core.relations.values()].map(r=>structuredClone(r))}
  };
  busy=true;
  try {
   const reading=interpret(input);
   // No fake inference, no async promise, no world mutation from the interpreter.
   if (reading && typeof reading.then!=='function' &&
       reading.context_id===input.context_id && typeof reading.source_tool==='string' &&
       reading.source_tool && Array.isArray(reading.relations)) {
    const audit={kind:'klein-world-reading',sourceEvent:event.seq,
      context_id:reading.context_id,source_tool:reading.source_tool,
      relations:structuredClone(reading.relations),
      reading:structuredClone(reading)};
    swarm.core.record('observation.recorded',audit);
    observations.push({seq:event.seq,status:'recorded',source_tool:reading.source_tool});
   } else observations.push({seq:event.seq,status:'unresolved'});
  } catch (error) {
   observations.push({seq:event.seq,status:'error',message:String(error).slice(0,160)});
  } finally {busy=false;if(observations.length>256)observations.shift();}
 });
 return {observations,detach(){active=false;stop();}};
}
