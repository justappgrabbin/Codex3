package com.synthia.codex3;
import android.content.Context;
import android.graphics.*;
import android.view.View;
import org.json.*;
import java.util.*;

final class AgentFieldView extends View {
 private JSONObject state=new JSONObject();private final Paint paint=new Paint(3);
 AgentFieldView(Context context){super(context);setContentDescription("Live agent relationships from the on-device service");}
 void update(JSONObject state){this.state=state;invalidate();}
 @Override protected void onDraw(Canvas canvas){
  super.onDraw(canvas);int width=getWidth(),height=getHeight();JSONArray agents=state.optJSONArray("agents");if(agents==null||agents.length()==0){label(canvas,"A space for relationships",width/2f,height/2f,0xff93a6a8,14);return;}
  Map<String,PointF> points=new HashMap<>();int count=agents.length();float cx=width/2f,cy=height/2f,r=Math.min(width,height)*.32f;
  float extent=3;for(int i=0;i<count;i++){JSONArray p=agents.optJSONObject(i).optJSONArray("position3D");if(p!=null)extent=Math.max(extent,(float)Math.max(Math.abs(p.optDouble(0)),Math.abs(p.optDouble(2)))+1);}
  for(int i=0;i<count;i++){JSONObject a=agents.optJSONObject(i);JSONArray p=a.optJSONArray("position3D");float x=p==null?(float)a.optDouble("position",0):(float)p.optDouble(0),z=p==null?0:(float)p.optDouble(2);points.put(a.optString("id"),new PointF(cx+x/extent*r,cy+z/extent*r));}

  for(int i=0;i<count;i++){JSONObject a=agents.optJSONObject(i),ties=a.optJSONObject("ties");if(ties==null)continue;PointF from=points.get(a.optString("id"));Iterator<String> ids=ties.keys();while(ids.hasNext()){String id=ids.next();PointF to=points.get(id);if(to==null)continue;paint.setColor(0xff6ebca1);paint.setAlpha((int)(40+180*Math.min(1,ties.optDouble(id,0))));paint.setStrokeWidth(dp(1.5f));canvas.drawLine(from.x,from.y,to.x,to.y,paint);}}
  for(int i=0;i<count;i++){JSONObject a=agents.optJSONObject(i);PointF p=points.get(a.optString("id"));paint.setAlpha(255);JSONArray rgb=a.optJSONArray("binaryColor");paint.setColor(rgb==null?(a.optBoolean("open",true)?0xffffffff:0xff000000):Color.rgb(rgb.optInt(0),rgb.optInt(1),rgb.optInt(2)));canvas.drawCircle(p.x,p.y,dp(7),paint);paint.setStyle(Paint.Style.STROKE);paint.setStrokeWidth(dp(1));paint.setColor(0xff93a6a8);canvas.drawCircle(p.x,p.y,dp(7),paint);paint.setStyle(Paint.Style.FILL);String name=a.optString("label",a.optString("id")).replace("autonomy.","");if(name.length()>14)name=name.substring(0,13)+"…";label(canvas,name,p.x,p.y+dp(24),0xffece8dd,11);}
 }
 private float dp(float value){return value*getResources().getDisplayMetrics().density;}
 private void label(Canvas canvas,String text,float x,float y,int color,float size){paint.setAlpha(255);paint.setColor(color);paint.setTextAlign(Paint.Align.CENTER);paint.setTextSize(size*getResources().getDisplayMetrics().scaledDensity);canvas.drawText(text,x,y,paint);}
}
