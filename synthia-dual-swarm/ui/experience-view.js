import {ExperienceSession} from '../core/experience.js';
const node=(tag,text)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;return n;};
export class ExperienceView {
 constructor(host,{onSurface,onNotice,onExperiment}){this.host=host;this.onSurface=onSurface;this.onNotice=onNotice;this.onExperiment=onExperiment;this.components=new Map();this.signature='';this.environment=null;}
 update(core,readOnly=false){
  const session=new ExperienceSession(core);if(!session.exists){this.host.hidden=true;if(this.environment){this.onSurface(true);this.environment=null;}return;}
  const state=session.state,environment=session.environment,signature=JSON.stringify({state,readOnly});
  this.host.hidden=false;if(signature===this.signature)return;this.signature=signature;
  const present=new Set(environment.children);for(const [id,element]of this.components)if(!present.has(id)){element.remove();this.components.delete(id);}
  const components=environment.children.map(id=>core.require(id));
  if(this.environment!==environment.id){this.onSurface(components.some(c=>c.state.provides.includes('world')||c.state.provides.includes('visual')));this.environment=environment.id;}
  this.host.dataset.layout=environment.state.layout;
  let panel=this.host.querySelector('.experience-panel');if(!panel){panel=node('section');panel.className='experience-panel';panel.setAttribute('aria-label','Current learning activity');this.host.append(panel);}
  for(const component of components){let element=this.components.get(component.id);if(!element){element=node('div');element.dataset.experienceComponent=component.id;element.className='experience-part experience-'+component.state.role;this.components.set(component.id,element);}panel.append(element);this.renderPart(element,component.state.role,session,readOnly);}
 }
 action(fn){try{fn();}catch(error){this.onNotice(error.message);}}
 renderPart(element,role,session,readOnly){
  const state=session.state,unit=state.units[state.cursor];
  if(role==='heading'){element.replaceChildren(node('small',state.subject),node('h2',state.objective));return;}
  if(role==='reading'){element.replaceChildren(node('h3',unit.title),node('p',unit.information));return;}
  if(role==='progress'){element.replaceChildren(node('p',`${state.completed.length}/${state.units.length} understood · section ${state.cursor+1}/${state.units.length}`));element.dataset.completed=String(state.completed.length);return;}
  if(role==='world'){
   element.replaceChildren(node('p','A  '+state.sandbox.A+'   →   B  '+state.sandbox.B),node('p','C  '+state.sandbox.C+'   →   D  '+(state.experiment?.result??'?')));
   element.setAttribute('aria-label','Shared Boolean situation and its composed form');return;
  }
  if(role==='assessment'){
   const prior=element.querySelector('input')?.value??'',form=node('form'),label=node('label','Your result'),input=node('input');input.value=prior;input.name='answer';input.autocomplete='off';input.maxLength=240;input.disabled=readOnly;label.append(input);const check=node('button','Check result');check.type='submit';check.disabled=readOnly;form.append(label,check);form.onsubmit=e=>{e.preventDefault();this.action(()=>session.submit(input.value));};element.replaceChildren(form,node('p',state.feedback));
   if(state.completed.includes(unit.id)&&state.cursor<state.units.length-1){const next=node('button','Continue');next.disabled=readOnly;next.onclick=()=>this.action(()=>session.navigate(1));element.append(next);}return;
  }
  if(role==='navigation'){
   const prev=node('button','Previous'),next=node('button','Next');prev.disabled=readOnly||state.cursor===0;next.disabled=readOnly||state.cursor===state.units.length-1;prev.onclick=()=>this.action(()=>session.navigate(-1));next.onclick=()=>this.action(()=>session.navigate(1));element.replaceChildren(prev,next,node('p',state.feedback));return;
  }
  if(role==='parameters'){
   const form=node('form');for(const key of ['A','B','C']){const label=node('label',key),input=node('input');input.value=state.sandbox[key];input.name=key;input.pattern='[01]{6}';input.maxLength=6;input.disabled=readOnly;label.append(input);form.append(label);}
   const run=node('button','Demonstrate transformation');run.disabled=readOnly;form.append(run);form.onsubmit=e=>{e.preventDefault();this.action(()=>{session.experiment(Object.fromEntries(new FormData(form)));this.onExperiment?.(session.state.sandbox);});};
   element.replaceChildren(form,node('p',state.experiment?`Operator ${state.experiment.operator} · result ${state.experiment.result}`:'Change the features to see how the same operator composes a new result.'));return;
  }
  element.replaceChildren(node('p','No renderer registered for this capability: '+role));
 }
}
