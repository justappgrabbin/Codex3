import {PrimitiveSwarm} from './primitive-swarm.js';
import {xor, equivalence, not, hammingDistance} from '../vendor/generative/boolean-ato.js';

export const ELEMENTS = new Set(['article','section','div','p','h1','h2','h3','span','label','input','button','output']);
const record = x => !!x && typeof x === 'object' && !Array.isArray(x);
const list = x => Array.isArray(x) && x.length <= 128;
const node = x => record(x) && ELEMENTS.has(x.tag) && typeof x.text === 'string'
  && (!x.children || list(x.children) && x.children.every(node));
const text = (row, template) => template.replace(/\{([a-z0-9_.-]+)\}/gi,
  (_, key) => String(key.split('.').reduce((v,k) => v?.[k], row) ?? ''));

/** Only atomic contracts and local functions. No named experience, lesson, or
 * composite capability is registered here. Templates/constraints are input data.
 */
export function installPrimitives(runtime) {
  for (const [name, validate] of Object.entries({
    number: x => typeof x === 'number' && Number.isFinite(x),
    text: x => typeof x === 'string',
    bits: x => list(x) && x.length > 0 && x.every(b => b === 0 || b === 1),
    words: x => list(x) && x.every(s => typeof s === 'string'),
    records: x => list(x) && x.every(record),
    groups: x => list(x) && x.every(g => list(g) && g.every(record)),
    fields: x => list(x) && x.every(k => typeof k === 'string' && !['__proto__','constructor','prototype'].includes(k)),
    template: x => record(x) && ELEMENTS.has(x.tag) && typeof x.text === 'string',
    layout: x => record(x) && ['row','column'].includes(x.axis) && Number.isInteger(x.columns)
      && x.columns >= 1 && x.columns <= 12,
    nodes: x => list(x) && x.every(node),
    artifact: x => record(x) && list(x.nodes) && x.nodes.every(node)
      && record(x.layout) && ['row','column'].includes(x.layout.axis)
      && Number.isInteger(x.layout.columns) && x.layout.columns >= 1 && x.layout.columns <= 12
  })) runtime.registerType(name, validate);

  const binary = {left: 'bits', right: 'bits'};
  const definitions = [
    {id:'xor', inputs:binary, output:'bits', run:({left,right}) => [...xor(left,right)]},
    {id:'equivalence', inputs:binary, output:'bits', run:({left,right}) => [...equivalence(left,right)]},
    {id:'not', inputs:{value:'bits'}, output:'bits', run:({value}) => [...not(value)]},
    {id:'hamming', inputs:binary, output:'number', run:({left,right}) => hammingDistance(left,right)},
    {id:'split', inputs:{value:'text', separator:'text'}, output:'words',
      guard:({separator}) => separator.length > 0, run:({value,separator}) => value.split(separator)},
    {id:'reverse', inputs:{items:'words'}, output:'words', run:({items}) => [...items].reverse()},
    {id:'join', inputs:{items:'words', separator:'text'}, output:'text', run:({items,separator}) => items.join(separator)},
    {id:'project', inputs:{items:'records', fields:'fields'}, output:'records',
      run:({items,fields}) => items.map(item => Object.fromEntries(fields.filter(k => Object.hasOwn(item,k)).map(k => [k,item[k]])))},
    {id:'partition', inputs:{items:'records', size:'number'}, output:'groups',
      guard:({size}) => Number.isInteger(size) && size >= 1 && size <= 128,
      run:({items,size}) => Array.from({length:Math.ceil(items.length/size)}, (_,i) => items.slice(i*size,(i+1)*size))},
    {id:'materialize', inputs:{items:'records', template:'template'}, output:'nodes',
      run:({items,template}) => items.map(row => ({tag:template.tag,text:text(row,template.text),children:[]}))},
    {id:'nest', inputs:{groups:'groups', template:'template'}, output:'nodes',
      run:({groups,template}) => groups.map(group => ({tag:'section',text:'',children:group.map(row => ({tag:template.tag,text:text(row,template.text),children:[]}))}))},
    {id:'arrange', inputs:{nodes:'nodes', layout:'layout'}, output:'artifact',
      run:({nodes,layout}) => ({nodes,layout})}
  ];
  for (const definition of definitions) runtime.register(definition);
  for (const id of runtime.state.clusters) runtime.restoreCluster(id);
  return runtime;
}

const runtimes = new WeakMap();
export function primitiveSwarm(core) {
  if (!runtimes.has(core)) runtimes.set(core, installPrimitives(new PrimitiveSwarm(core)));
  return runtimes.get(core);
}
