package com.synthia.codex3;
import android.app.*;
import android.content.Intent;
import android.os.*;
import android.util.AtomicFile;
import app.cash.quickjs.QuickJs;
import org.json.JSONObject;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

public final class SwarmService extends Service {
 private HandlerThread workerThread;private Handler worker;private QuickJs js;private Messenger incoming;private String fault;private AtomicFile checkpoint;private PowerManager.WakeLock wake;private boolean running=false;private long tick=0;
 private final Runnable clock=new Runnable(){public void run(){try{if(js!=null&&fault==null&&Boolean.TRUE.equals(js.evaluate("NativeSwarm.tick()"))){persist();updateStatus();}}catch(Exception error){fault=error.getMessage();running=false;publishNotification();}finally{worker.postDelayed(this,1000);}}};
 @Override public void onCreate(){super.onCreate();checkpoint=new AtomicFile(new File(getFilesDir(),"swarm-checkpoint.json"));
  if(Build.VERSION.SDK_INT>=26)getSystemService(NotificationManager.class).createNotificationChannel(new NotificationChannel("swarm","Swarm runtime",NotificationManager.IMPORTANCE_LOW));
  wake=((PowerManager)getSystemService(POWER_SERVICE)).newWakeLock(PowerManager.PARTIAL_WAKE_LOCK,"Synthia:swarm");wake.setReferenceCounted(false);
  workerThread=new HandlerThread("synthia-runtime",android.os.Process.THREAD_PRIORITY_BACKGROUND);workerThread.start();worker=new Handler(workerThread.getLooper());
  incoming=new Messenger(new Handler(getMainLooper()){@Override public void handleMessage(Message message){final Messenger reply=message.replyTo;final Bundle data=message.getData();worker.post(()->handle(data,reply));}});
  worker.post(()->{try{js=QuickJs.create();js.evaluate(readAsset("native-runtime.js"));String saved=null;if(checkpoint.getBaseFile().exists())saved=read(checkpoint.openRead(),32*1024*1024);if(saved!=null){JSONObject envelope=new JSONObject(saved);String payload=envelope.getString("payload");if(!sha(payload).equals(envelope.getString("sha256")))throw new IOException("Saved state integrity failed. Original state is preserved.");saved=payload;}js.evaluate("NativeSwarm.open("+(saved==null?"null":JSONObject.quote(saved))+")");persist();updateStatus();worker.post(clock);}catch(Exception error){fault="Runtime could not restore: "+error.getMessage();}});
 }
 @Override public IBinder onBind(Intent intent){return incoming.getBinder();}
 @Override public int onStartCommand(Intent intent,int flags,int id){
  publishNotification();
  if(intent!=null&&"PAUSE".equals(intent.getAction()))worker.post(()->{try{JSONObject body=new JSONObject().put("action","pause").put("requestId",java.util.UUID.randomUUID().toString());js.evaluate("NativeSwarm.request("+JSONObject.quote(new JSONObject().put("route","/v1/commands").put("body",body).toString())+")");persist();updateStatus();}catch(Exception error){fault=error.getMessage();}});
  return START_STICKY;
 }
 private void handle(Bundle data,Messenger reply){String id=data.getString("id"),message=data.getString("message");File response=null;
  try{
   JSONObject request=new JSONObject(message);
   if(fault!=null){if("/v1/commands".equals(request.optString("route"))&&"restore".equals(request.optJSONObject("body").optString("action"))){if(checkpoint.getBaseFile().exists()){File recovery=new File(getFilesDir(),"checkpoint-before-recovery-"+System.currentTimeMillis()+".json");copy(checkpoint.getBaseFile(),recovery);}js.evaluate("NativeSwarm.open(null)");fault=null;}else throw new IOException(fault);}
   String before=(String)js.evaluate("NativeSwarm.save()"),result=(String)js.evaluate("NativeSwarm.request("+JSONObject.quote(message)+")");
   if("/v1/commands".equals(request.optString("route"))){try{persist();updateStatus();}catch(Exception error){js.evaluate("NativeSwarm.open("+JSONObject.quote(before)+")");throw error;}}
   response=File.createTempFile("swarm-response-",".json",getCacheDir());try(FileOutputStream out=new FileOutputStream(response)){out.write(result.getBytes(StandardCharsets.UTF_8));}
   Bundle out=new Bundle();out.putString("id",id);out.putString("file",response.getAbsolutePath());Message responseMessage=Message.obtain();responseMessage.setData(out);reply.send(responseMessage);
  }catch(Exception error){if(response!=null)response.delete();try{Bundle out=new Bundle();out.putString("id",id);out.putString("error",error.getMessage());Message m=Message.obtain();m.setData(out);reply.send(m);}catch(Exception ignored){}}
 }
 private void persist()throws Exception{String payload=(String)js.evaluate("NativeSwarm.save()");byte[] data=new JSONObject().put("sha256",sha(payload)).put("payload",payload).toString().getBytes(StandardCharsets.UTF_8);if(data.length>32*1024*1024)throw new IOException("Checkpoint storage budget reached");FileOutputStream out=null;try{out=checkpoint.startWrite();out.write(data);checkpoint.finishWrite(out);}catch(Exception error){if(out!=null)checkpoint.failWrite(out);throw error;}}
 private void updateStatus()throws Exception{JSONObject state=new JSONObject((String)js.evaluate("NativeSwarm.state()"));boolean next=state.optBoolean("running");tick=state.optLong("tick");if(next&&!running){startService(new Intent(this,SwarmService.class));}running=next;if(running){if(!wake.isHeld())wake.acquire(30*60*1000L);publishNotification();}else{if(wake.isHeld())wake.release();stopForeground(true);stopSelf();}}
 private void publishNotification(){Intent open=new Intent(this,MainActivity.class);PendingIntent activity=PendingIntent.getActivity(this,0,open,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);PendingIntent pause=PendingIntent.getService(this,1,new Intent(this,SwarmService.class).setAction("PAUSE"),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
  Notification.Builder notification=Build.VERSION.SDK_INT>=26?new Notification.Builder(this,"swarm"):new Notification.Builder(this);notification.setSmallIcon(R.drawable.app_icon).setContentTitle(fault==null?"Synthia swarm · tick "+tick:"Synthia runtime stopped").setContentText(fault==null?"Running locally, independently of the screen.":fault).setContentIntent(activity).setOngoing(true).addAction(new Notification.Action.Builder(null,"Pause",pause).build());startForeground(15,notification.build());}
 @Override public void onDestroy(){if(worker!=null){worker.removeCallbacks(clock);worker.post(()->{try{if(js!=null){persist();js.close();}}catch(Exception ignored){}workerThread.quitSafely();});}if(wake!=null&&wake.isHeld())wake.release();super.onDestroy();}
 private String readAsset(String name)throws IOException{return read(getAssets().open(name),4*1024*1024);}
 private static String read(InputStream source,int max)throws IOException{try(InputStream in=source;ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] buffer=new byte[8192];int n;while((n=in.read(buffer))!=-1){if(out.size()+n>max)throw new IOException("Stored data exceeds limit");out.write(buffer,0,n);}return out.toString("UTF-8");}}
 private static String sha(String value)throws Exception{StringBuilder s=new StringBuilder();for(byte b:MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)))s.append(String.format("%02x",b&255));return s.toString();}
 private static void copy(File from,File to)throws IOException{try(InputStream in=new FileInputStream(from);OutputStream out=new FileOutputStream(to)){byte[] b=new byte[8192];int n;while((n=in.read(b))!=-1)out.write(b,0,n);}}
}
