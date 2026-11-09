import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const {build}=await import(process.env.ESBUILD_MODULE||'esbuild');
const result=await build({entryPoints:[path.join(root,'ui/app.js')],bundle:true,format:'iife',target:'es2022',minify:true,write:false,legalComments:'inline'});
const [html,css]=await Promise.all([readFile(path.join(root,'index.html'),'utf8'),readFile(path.join(root,'ui/style.css'),'utf8')]);
const js=result.outputFiles[0].text.replaceAll('</script','<\\/script');
const assets={};for(const name of ['human','wolf'])assets[name]='data:model/gltf-binary;base64,'+(await readFile(path.join(root,'assets',name+'.glb'))).toString('base64');
// Use replacer functions: minified JavaScript can contain $& tokens which
// String.replace otherwise expands into the matched HTML tag.
await writeFile(path.join(root,'Synthia-Dual-Swarm.html'),html.replace('<link rel="stylesheet" href="ui/style.css">',()=>'<style>'+css+'</style>').replace('<script type="module" src="ui/app.js"></script>',()=>'<script>window.SYNTHIA_ASSETS='+JSON.stringify(assets)+';'+js+'</script>'));
console.log('Built Synthia-Dual-Swarm.html');
