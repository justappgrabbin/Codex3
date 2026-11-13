// Feed Bradford Hatcher's Matrix text through the Generative-address-system BookIngestBridge
// and write a gate/line word index for the word swarm.
//   node scripts/ingest-hatcher.mjs <matrix.txt> [more.txt ...] [--out assets/book-words.json]
// Each "NN.M" / "NN.L" heading starts a section; the section is ingested with its address.
// Words taken (Hatcher's own, verbatim): the gua name from "NN.M PINYIN (num): NAME", and each
// line's short phrase from the "(Fan Yao G.L: phrase)" notes, filed under gate G line L.
// The source text is not stored in the repo; run this against your own copy.
import fs from 'node:fs';
import {BookIngestBridge} from '../vendor/trainable-core/book-ingest-bridge.mjs';
import {StateRegistry} from '../vendor/trainable-core/registration.mjs';

export function sections(text){
  const out=[];let cur=null;
  for(const raw of text.split(/\r?\n/)){
    const line=raw.replace(/^\d+\s+(?=\d\d\.)/,''); // strip page numbers glued to headings
    const h=line.match(/^(\d\d)\.([0-7MTX])\b/);
    if(h){cur={gate:+h[1],part:h[2],lines:[line]};out.push(cur);}else if(cur)cur.lines.push(line);
  }
  return out.map(s=>({...s,text:s.lines.join('\n')}));
}

const cleanName=n=>n.replace(/\s*\(.*?\)\s*$/,'').trim(); // drop notes like "(Also pronounced Tun2)"

export function ingest(texts,{registry=new StateRegistry()}={}){
  const bridge=new BookIngestBridge({registry});
  const words={};
  const slot=g=>(words[g]??={name:null,lines:{}});
  for(const [i,text] of texts.entries()){
    // A paste can start on a name line with its "NN.M" prefix cut off; it names the next gua.
    const lead=text.match(/^\s*[A-Z][A-Z0-9 ,]*\([\d, ]+\):\s*(.+)\r?\n(\d\d)\.0\b/);
    if(lead)slot(+lead[2]).name=cleanName(lead[1]);
    for(const s of sections(text)){
      const line=/^[1-6]$/.test(s.part)?+s.part:null;
      bridge.ingest({sourceId:`hatcher-matrix-${i}`,title:'Hatcher, Yijing Matrix',dimension:'Movement',text:s.text,
        addressResolver:()=>({dimension:'Movement',gate:s.gate,line})});
      const name=s.text.match(/^\d\d\.M\s+[A-Z0-9 ,]+\([\d, ]+\):\s*(.+)$/m);
      if(name)slot(s.gate).name=cleanName(name[1]);
      for(const m of s.text.matchAll(/\(Fan Yao (\d\d)\.([1-6]): ([^)]+)\)/g))slot(+m[1]).lines[+m[2]]=m[3].trim();
    }
  }
  return {words,fragments:bridge.fragments.length,registry};
}

if(import.meta.url===`file://${process.argv[1]}`){
  const args=process.argv.slice(2),o=args.indexOf('--out');
  const out=o>=0?args.splice(o,2)[1]:'assets/book-words.json';
  if(!args.length){console.error('usage: node scripts/ingest-hatcher.mjs <matrix.txt> ... [--out file]');process.exit(1);}
  const {words,fragments}=ingest(args.map(f=>fs.readFileSync(f,'utf8')));
  fs.writeFileSync(out,JSON.stringify({source:'Hatcher, The Book of Changes: Matrix (Fan Yao notes, gua names)',words},null,1));
  const g=Object.keys(words).length,l=Object.values(words).reduce((n,w)=>n+Object.keys(w.lines).length,0);
  console.log(`${fragments} fragments ingested; ${g} gates, ${l} line phrases -> ${out}`);
}
