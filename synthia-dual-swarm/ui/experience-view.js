import {ELEMENTS} from '../core/primitives.js';

// One primitive DOM renderer. It has no lesson/format-specific render functions.
export class ExperienceView {
  constructor(host, {onSurface}) { this.host=host; this.onSurface=onSurface; this.key=''; this.nodes=new Map(); this.visible=true; }
  show(visible) { this.visible=visible; this.key=""; }
  update(core) {
    const activity=core.entities.get('experience.activity');
    if (!this.visible || !activity?.state.artifact) { this.host.hidden=true; this.host.style.display='none'; this.key=''; this.onSurface(true); return; }
    const {artifact,resultKey}=activity.state;
    this.host.hidden=false;
    if(this.key===resultKey)return;
    this.key=resultKey;
    this.onSurface(false);
    const retained=new Set();
    const render=(description,path)=>{
      if(!ELEMENTS.has(description.tag))throw Error('Unregistered element primitive');
      const key=path.join('/');retained.add(key);
      let element=this.nodes.get(key);
      if(!element||element.tagName.toLowerCase()!==description.tag){element=document.createElement(description.tag);this.nodes.set(key,element);}
      element.dataset.primitiveNode=key;
      const children=(description.children??[]).map((child,i)=>render(child,[...path,i]));
      // Text is always a text node; no HTML, event handlers, or generated code.
      element.replaceChildren(document.createTextNode(description.text),...children);
      return element;
    };
    this.host.replaceChildren(...artifact.nodes.map((n,i)=>render(n,[i])));
    this.host.style.display='grid';
    this.host.style.gridTemplateColumns=`repeat(${artifact.layout.columns}, minmax(0,1fr))`;
    this.host.style.gridAutoFlow=artifact.layout.axis==='row'?'row':'column';
    for(const [key,element]of this.nodes)if(!retained.has(key)){element.remove();this.nodes.delete(key);}
  }
}
