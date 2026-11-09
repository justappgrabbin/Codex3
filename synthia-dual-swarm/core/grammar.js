// Small explicit workbench grammar. This is an engineering DSL, not a claim
// that the documents' unresolved natural-language correspondences are solved.
import {Substrate} from './substrate.js';
import {ACTIVE,CoreError,exampleAddress} from './ontology.js';
export class GrammarError extends CoreError{constructor(token,rule,expected,previous){super('GRAMMAR_UNEXPECTED_TOKEN',`at ${token.line}:${token.column}: received ${token.value||'end of input'} while resolving ${rule}; expected ${expected}`,{token:token.value,type:token.type,line:token.line,column:token.column,rule,expected,previous});}}
export function parseDiscourse(source){
 if(typeof source!=='string'||source.length>10000)throw new CoreError('GRAMMAR_INPUT','Discourse must be text under 10,000 characters');
 const tokens=[];let pos=0,line=1,column=1;
 while(pos<source.length){const rest=source.slice(pos);let m;if((m=/^\s+/.exec(rest))){for(const ch of m[0]){if(ch==='\n'){line++;column=1;}else column++;}pos+=m[0].length;continue;}const token={line,column};if((m=/^"(?:[^"\\\n]|\\.)*"/.exec(rest))){token.type='string';token.value=JSON.parse(m[0]);}else if((m=/^[A-Za-z][A-Za-z0-9_.-]*/.exec(rest))){token.type='identifier';token.value=m[0];}else if((m=/^[=(),;]/.exec(rest))){token.type='symbol';token.value=m[0];}else throw new GrammarError({value:rest[0],type:'unknown',line,column},'token','identifier | quoted label | = ( ) , ;',null);tokens.push(token);pos+=m[0].length;column+=m[0].length;}
 tokens.push({type:'eof',value:'',line,column});let i=0,previous=null;
 const take=(value,rule)=>{const t=tokens[i];if(t.value!==value)throw new GrammarError(t,rule,value,previous);i++;return t;};
 const ident=rule=>{const t=tokens[i];if(t.type!=='identifier')throw new GrammarError(t,rule,'identifier',previous);i++;return t.value;};
 const list=(depth=0)=>{if(depth>32)throw new CoreError('GRAMMAR_DEPTH','Maximum composition depth is 32');take('(','composition.operands');const values=[];do{if(values.length)take(',','composition.separator');const name=ident('composition.operand');if(tokens[i].value==='('){if(!['sequence','bundle'].includes(name))throw new GrammarError(tokens[i-1],'composition.operator','sequence | bundle',previous);values.push({operator:name,children:list(depth+1)});}else values.push({ref:name});}while(tokens[i].value===',');take(')','composition.operands');return values;};
 const ast=[];while(tokens[i].type!=='eof'){if(ast.length>=256)throw new CoreError('GRAMMAR_BUDGET','Maximum 256 declarations');const kind=ident('discourse.declaration'),id=ident('declaration.identity');let record;
  if(kind==='primitive'){const t=tokens[i++];if(t.type!=='string')throw new GrammarError(t,'primitive.label','quoted label',previous);const dimension=ident('primitive.dimension');if(!ACTIVE.includes(dimension))throw new GrammarError(tokens[i-1],'primitive.dimension',ACTIVE.join(' | '),previous);record={kind,id,label:t.value,dimension};}
  else if(['sequence','bundle'].includes(kind)){take('=','composition.assignment');record={kind,id,children:list()};}
  else throw new GrammarError(tokens[i-2],'discourse.declaration','primitive | sequence | bundle',previous);
  take(';','discourse.continuation');ast.push(record);previous={id,kind};
 }return ast;
}
export function compileDiscourse(core,source){const ast=parseDiscourse(source),start=core.events.length,staged=Substrate.replay(core.export());let nested=0;
 const resolve=(expr,parent)=>{if(expr.ref){staged.require(expr.ref);return expr.ref;}const id=parent+'.nested.'+(++nested),children=expr.children.map(e=>resolve(e,id));staged.compose({id,label:expr.operator,children,operator:expr.operator,address:exampleAddress()});staged.execute(expr.operator,children,{source:'workbench-grammar',parent});return id;};
 for(const declaration of ast){if(declaration.kind==='primitive')staged.create({id:declaration.id,label:declaration.label,dimension:declaration.dimension,address:exampleAddress(),functions:['compose']});else{const children=declaration.children.map(e=>resolve(e,declaration.id));staged.compose({id:declaration.id,label:declaration.id,children,operator:declaration.kind,address:exampleAddress()});staged.execute(declaration.kind,children,{source:'workbench-grammar',parent:declaration.id});}}
 for(const event of staged.events.slice(start))core.record(event.type,event.data);return {ids:ast.map(x=>x.id),events:core.events.length-start};
}
