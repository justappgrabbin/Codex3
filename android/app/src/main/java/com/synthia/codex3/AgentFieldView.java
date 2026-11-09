package com.synthia.codex3;
import android.content.Context;
import android.graphics.*;
import android.view.View;
import org.json.*;
import java.util.*;

final class AgentFieldView extends View {
 private JSONObject state=new JSONObject();private final Paint paint=new Paint(3);
 AgentFieldView(Context context){super(context);setContentDescription("Live physical fragments and geometric connections from the on-device service");}
 void update(JSONObject state){this.state=state;invalidate();}
 @Override protected void onDraw(Canvas canvas){
  super.onDraw(canvas);JSONArray agents=state.optJSONArray("agents");int width=getWidth(),height=getHeight();if(agents==null||agents.length()==0){label(canvas,"A space for relationships",width/2f,height/2f,0xff93a6a8,14);return;}
  List<JSONObject> bodies=new ArrayList<>();Map<String,JSONObject> owners=new HashMap<>();Map<String,PointF> points=new HashMap<>();
  for(int i=0;i<agents.length();i++){JSONObject owner=agents.optJSONObject(i);owners.put(owner.optString("id"),owner);JSONArray parts=owner.optJSONArray("wordFragments");if(parts!=null&&parts.length()>0&&parts.optJSONObject(0).optJSONArray("position")!=null){for(int j=0;j<parts.length();j++)bodies.add(parts.optJSONObject(j));}else bodies.add(owner);}
  float extent=3,cx=width/2f,cy=height/2f,r=Math.min(width,height)*.38f;
  for(JSONObject b:bodies){JSONArray p=position(b);if(p!=null)extent=Math.max(extent,(float)Math.max(Math.abs(p.optDouble(0)),Math.abs(p.optDouble(2)))+1);}
  for(JSONObject b:bodies){JSONArray p=position(b);float x=p==null?(float)b.optDouble("position",0):(float)p.optDouble(0),z=p==null?0:(float)p.optDouble(2);points.put(b.optString("id"),new PointF(cx+x/extent*r,cy+z/extent*r));}
  JSONObject network=state.optJSONObject("sixBit");JSONArray edges=network==null?null:network.optJSONArray("edges");
  if(edges!=null)for(int i=0;i<edges.length();i++){JSONObject e=edges.optJSONObject(i);JSONArray ids=e.optJSONArray("fragments");line(canvas,points.get(ids==null?e.optString("a"):ids.optString(0)),points.get(ids==null?e.optString("b"):ids.optString(1)),e.optDouble("weight",0));}
  else for(int i=0;i<agents.length();i++){JSONObject a=agents.optJSONObject(i),ties=a.optJSONObject("ties");if(ties==null)continue;Iterator<String> ids=ties.keys();while(ids.hasNext()){String id=ids.next();line(canvas,points.get(a.optString("id")),points.get(id),ties.optDouble(id,0));}}
  for(JSONObject b:bodies){PointF p=points.get(b.optString("id"));JSONObject owner=owners.get(b.optString("owner",b.optString("id")));if(owner==null)continue;paint.setAlpha(255);JSONArray rgb=owner.optJSONArray("binaryColor");paint.setColor(rgb==null?(owner.optBoolean("open",true)?Color.WHITE:Color.BLACK):Color.rgb(rgb.optInt(0),rgb.optInt(1),rgb.optInt(2)));float size=dp(b.has("slot")?5:7);canvas.drawCircle(p.x,p.y,size,paint);paint.setStyle(Paint.Style.STROKE);paint.setStrokeWidth(dp(1));paint.setColor(0xff93a6a8);canvas.drawCircle(p.x,p.y,size,paint);paint.setStyle(Paint.Style.FILL);String name=b.has("slot")?b.optInt("value")+" / "+b.optInt("lineWidth")+"b":owner.optString("label",owner.optString("id"));if(name.length()>14)name=name.substring(0,13)+"…";label(canvas,name,p.x,p.y+dp(19),0xffece8dd,10);}
 }
 private JSONArray position(JSONObject body){JSONArray p=body.optJSONArray("position");return p==null?body.optJSONArray("position3D"):p;}
 private void line(Canvas canvas,PointF from,PointF to,double weight){if(from==null||to==null)return;paint.setColor(0xff6ebca1);paint.setAlpha((int)(40+180*Math.max(0,Math.min(1,weight))));paint.setStrokeWidth(dp(1.5f));canvas.drawLine(from.x,from.y,to.x,to.y,paint);}
 private float dp(float value){return value*getResources().getDisplayMetrics().density;}
 private void label(Canvas canvas,String text,float x,float y,int color,float size){paint.setAlpha(255);paint.setColor(color);paint.setTextAlign(Paint.Align.CENTER);paint.setTextSize(size*getResources().getDisplayMetrics().scaledDensity);canvas.drawText(text,x,y,paint);}
}
