package com.synthia.codex3;
import android.content.*;
import android.os.*;
import org.json.JSONObject;
import java.io.*;
import java.util.*;
import java.util.concurrent.*;

final class RuntimeClient {
 interface Callback {void done(JSONObject result,String error);}
 private final Context context;private final Handler main=new Handler(Looper.getMainLooper());private final ExecutorService io=Executors.newSingleThreadExecutor();
 private final Map<String,Callback> pending=new HashMap<>();private final List<Message> waiting=new ArrayList<>();private Messenger service;private boolean closed=false;
 private final Messenger reply=new Messenger(new Handler(Looper.getMainLooper()){@Override public void handleMessage(Message message){Bundle data=message.getData();RuntimeClient.Callback callback=pending.remove(data.getString("id"));if(callback==null)return;String error=data.getString("error"),file=data.getString("file");if(error!=null){callback.done(null,error);return;}io.execute(()->{JSONObject value=null;String problem=null;try{File path=new File(file);if(!path.getCanonicalFile().getParentFile().equals(context.getCacheDir().getCanonicalFile())||path.length()>32*1024*1024)throw new IOException("Invalid runtime response");try(InputStream in=new FileInputStream(path);ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] bytes=new byte[8192];int n;while((n=in.read(bytes))!=-1)out.write(bytes,0,n);value=new JSONObject(out.toString("UTF-8"));}path.delete();}catch(Exception e){problem=e.getMessage();}JSONObject result=value;String failure=problem;main.post(()->{if(!closed)callback.done(result,failure);});});}});
 private final ServiceConnection connection=new ServiceConnection(){public void onServiceConnected(ComponentName name,IBinder binder){service=new Messenger(binder);for(Message message:waiting)try{service.send(message);}catch(RemoteException error){}waiting.clear();}public void onServiceDisconnected(ComponentName name){service=null;for(Callback c:new ArrayList<>(pending.values()))c.done(null,"The background runtime is restoring.");pending.clear();}};
 RuntimeClient(Context context){this.context=context.getApplicationContext();this.context.bindService(new Intent(context,SwarmService.class),connection,Context.BIND_AUTO_CREATE);}
 void get(String route,Callback callback){send(route,null,callback);}
 void command(JSONObject command,Callback callback){try{command.put("requestId",UUID.randomUUID().toString());if("start".equals(command.optString("action"))){Intent intent=new Intent(context,SwarmService.class);if(Build.VERSION.SDK_INT>=26)context.startForegroundService(intent);else context.startService(intent);}send("/v1/commands",command,callback);}catch(Exception error){callback.done(null,error.getMessage());}}
 private void send(String route,JSONObject body,Callback callback){if(closed)return;try{String id=UUID.randomUUID().toString();JSONObject request=new JSONObject().put("route",route);if(body!=null)request.put("body",body);Message message=Message.obtain();Bundle data=new Bundle();data.putString("id",id);data.putString("message",request.toString());message.setData(data);message.replyTo=reply;pending.put(id,callback);if(service==null)waiting.add(message);else service.send(message);}catch(Exception error){callback.done(null,error.getMessage());}}
 void close(){closed=true;context.unbindService(connection);pending.clear();waiting.clear();io.shutdownNow();}
}
