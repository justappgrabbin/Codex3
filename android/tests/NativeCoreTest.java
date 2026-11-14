import app.cash.quickjs.QuickJs;
import java.nio.file.*;
public class NativeCoreTest {
 public static void main(String[] args)throws Exception{try(QuickJs js=QuickJs.create()){
  js.evaluate(new String(Files.readAllBytes(Paths.get(args[0])),"UTF-8"));
  js.evaluate("NativeSwarm.open(null); NativeSwarm.request(JSON.stringify({route:'/v1/commands',body:{action:'start',requestId:'start'}}));");
  js.evaluate("for(let i=0;i<5;i++)NativeSwarm.tick();if(JSON.parse(NativeSwarm.state()).tick!==5)throw Error('clock');");
  js.evaluate("let save=NativeSwarm.save();NativeSwarm.open(save);NativeSwarm.tick();if(JSON.parse(NativeSwarm.state()).tick!==6)throw Error('restore');");
  js.evaluate("NativeSwarm.request(JSON.stringify({route:'/v1/commands',body:{action:'request',requestId:'learn',request:{samples:Array.from({length:9},(_,i)=>[i,2*i+1])}}}));for(let i=0;i<20;i++)NativeSwarm.tick();if(JSON.parse(NativeSwarm.state()).production.tools.length===0)throw Error('collective learning');");
  js.evaluate("let rep=JSON.parse(NativeSwarm.request(JSON.stringify({route:'/v1/commands',body:{action:'representText',requestId:'text',text:'Café 🌍'}}))).representation;if(rep.transliteration!=='Cafe 🌍'||rep.unicode[5]!=='U+1F30D')throw Error('Unicode representations');");
  js.evaluate("NativeSwarm.request(JSON.stringify({route:'/v1/commands',body:{action:'trainVisual',requestId:'visual',training:{epochs:30,samples:Array.from({length:40},(_,i)=>({point:[i/39,0,0,0],rgba:[i/39,.25,.5,1]}))}}}));for(let i=0;i<8;i++)NativeSwarm.tick();let visual=JSON.parse(NativeSwarm.state()).visualModel;if(visual.status!=='ready'||!visual.metrics.improved)throw Error('quantized visual training');let frame=JSON.parse(NativeSwarm.request(JSON.stringify({route:'/v1/commands',body:{action:'visualFrame',requestId:'frame',frame:{width:4,height:4}}}))).frame;if(frame.rgba.length!==64)throw Error('visual generation');");
  js.evaluate("let particles=JSON.parse(NativeSwarm.state()).agents;if(!particles.every(a=>a.wordVector.length===6&&a.wordVector.every(v=>typeof v==='boolean')&&a.wordFragments.every(p=>p.id&&p.position.length===3&&p.velocity.length===3&&p.booleanVector.length===6/a.wordTier)))throw Error('physical Boolean fragment state');");
  js.evaluate("let algebra=JSON.parse(NativeSwarm.state()).booleanAlgebra;if(algebra.operators.length!==16)throw Error('operator catalog');let but=JSON.parse(NativeSwarm.request(JSON.stringify({route:'/v1/commands',body:{action:'evaluateBoolean',requestId:'but',operator:'but',left:[true,false],right:[false,true]}}))).vector;if(but[0]!==true||but[1]!==false)throw Error('generative BUT semantics');");
  System.out.println("Embedded QuickJS core: ticks, particle reactions, checkpoint restore and collective learning passed");
 }}
}
