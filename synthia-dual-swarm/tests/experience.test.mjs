import test from 'node:test';
import assert from 'node:assert/strict';
import {Substrate} from '../core/substrate.js';
import {ExperienceSession,composeCapabilities,interpretExperienceRequest,BOOLEAN_LESSON} from '../core/experience.js';
const make=()=>{const core=new Substrate(),session=new ExperienceSession(core);session.start();return session;};
test('game → requested slides → interactive demonstration preserves purpose and demonstrated progress',()=>{
 const r=make(),identity=r.core.require('experience.lesson').id,subject=r.state.subject,objective=r.state.objective;
 assert.equal(r.environment.state.format,'game');assert.equal(r.submit('010000').correct,true);
 const before=structuredClone(r.state),game=r.environment.id,heading='experience.component.purpose';
 const change=r.request("I don't want to play a game. Teach me with slides.");
 assert.equal(change.accepted,true);assert.equal(r.environment.state.format,'slides');
 assert.ok(change.retained.includes(heading));assert.ok(change.released.includes('experience.component.challenge'));assert.ok(change.released.includes('experience.component.world'));
 assert.equal(r.core.require('experience.component.world').state.resources,0);assert.equal(r.core.require(game).state.active,false);
 assert.deepEqual(r.state.completed,before.completed);assert.deepEqual(r.state.attempts,before.attempts);assert.equal(r.state.cursor,before.cursor);
 r.request('Show me an interactive demonstration.');assert.equal(r.environment.state.format,'demonstration');
 assert.equal(r.core.require('experience.lesson').id,identity);assert.equal(r.state.subject,subject);assert.equal(r.state.objective,objective);assert.deepEqual(r.state.completed,['relation']);
 assert.ok(r.environment.children.includes('experience.component.parameters'));assert.equal(r.core.require('experience.component.world').state.active,true);
});
test('planning is driven by affordances and budgets, including new capability combinations',()=>{
 const catalog=[{id:'talk',role:'heading',provides:['audio'],cost:2},{id:'read',role:'reading',provides:['text'],cost:1},{id:'combine',role:'reading',provides:['audio','text'],cost:2}];
 const plan=composeCapabilities({needs:['audio','text'],layout:'flow'},catalog,2);assert.deepEqual(plan.components.map(c=>c.id),['combine']);assert.equal(plan.cost,2);
 const r=make(),count=r.core.events.length,env=r.environment.id;assert.throws(()=>r.reconfigure({needs:['unavailable']},'test',catalog));assert.equal(r.environment.id,env);assert.equal(r.core.events.length,count);
});
test('purpose and content are supplied independently from the composition mechanism',()=>{
 const r=new ExperienceSession(new Substrate());r.start({subject:'Gardening',objective:'Understand water retention',units:[{id:'soil',title:'Soil',information:'Observe the supplied soil sample.'}]},'slides');
 assert.equal(r.state.subject,'Gardening');assert.equal(r.state.objective,'Understand water retention');assert.deepEqual(r.state.units,[{id:'soil',title:'Soil',information:'Observe the supplied soil sample.'}]);
});
test('unknown requests leave the environment and progress unchanged; negated requests are not positive choices',()=>{
 const r=make(),snapshot=r.core.snapshot();assert.equal(r.request('Make this smell like cinnamon.').accepted,false);assert.deepEqual(r.core.snapshot(),snapshot);
 assert.equal(interpretExperienceRequest("I don't want slides. Give me an interactive demonstration.").format,'demonstration');
 assert.equal(interpretExperienceRequest("Don't use slides.").format,null);
});
test('interactive feedback changes the demonstration without resetting mastery or content',()=>{
 const r=make();r.submit('010000');r.request('interactive demonstration');const before=structuredClone(r.state.completed);
 r.experiment({C:'100101'});assert.equal(r.state.experiment.result,'001010');r.experiment({C:'001010'});assert.equal(r.state.experiment.result,'100101');
 assert.deepEqual(r.state.completed,before);assert.deepEqual(r.state.units,BOOLEAN_LESSON.units);
});
test('the transformed experience restores exactly from the retained event log',()=>{
 const r=make();r.submit('010000');r.request('teach me with slides');r.navigate(1);r.request('interactive demonstration');r.experiment({A:'000000'});
 const restored=Substrate.replay(r.core.export()),next=new ExperienceSession(restored);assert.deepEqual(restored.snapshot(),r.core.snapshot());assert.equal(next.state.cursor,1);assert.deepEqual(next.state.completed,['relation']);assert.equal(next.environment.state.format,'demonstration');
});
