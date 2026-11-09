import app.cash.quickjs.QuickJs;
import java.nio.file.*;
public class NativeCoreTest {
 public static void main(String[] args)throws Exception{try(QuickJs js=QuickJs.create()){
  js.evaluate(new String(Files.readAllBytes(Paths.get(args[0])),"UTF-8"));
  js.evaluate("NativeSwarm.open(null); NativeSwarm.request(JSON.stringify({route:'/v1/commands',body:{action:'start',requestId:'start'}}));");
  js.evaluate("for(let i=0;i<5;i++)NativeSwarm.tick();if(JSON.parse(NativeSwarm.state()).tick!==5)throw Error('clock');");
  js.evaluate("let save=NativeSwarm.save();NativeSwarm.open(save);NativeSwarm.tick();if(JSON.parse(NativeSwarm.state()).tick!==6)throw Error('restore');");
  js.evaluate("NativeSwarm.request(JSON.stringify({route:'/v1/commands',body:{action:'request',requestId:'learn',request:{samples:Array.from({length:9},(_,i)=>[i,2*i+1])}}}));for(let i=0;i<20;i++)NativeSwarm.tick();if(JSON.parse(NativeSwarm.state()).production.tools.length===0)throw Error('collective learning');");
  System.out.println("Embedded QuickJS core: ticks, particle reactions, checkpoint restore and collective learning passed");
 }}
}
