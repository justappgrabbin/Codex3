using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.EventSystems;
namespace Synthia {
 public sealed class SynthiaWorld : MonoBehaviour {
  readonly SynthiaKernel kernel=new SynthiaKernel();
  AssemblyModel model;
  SwarmBody human,wolf;
  Font font;
  Transform interfaceRoot,qualityRoot;
  Text status,pathText;
  string dimension="Movement",path="";
  readonly Stack<string> frameHistory=new Stack<string>();
  int uiSequence;
  void Awake(){
   model=new AssemblyModel();kernel.Add("world","Shared world substrate","Design",gameObject,"compose","inspect");
   var camObject=new GameObject("Swarm camera");var cam=camObject.AddComponent<Camera>();cam.transform.position=new Vector3(0,2.5f,-6);cam.transform.LookAt(new Vector3(0,1,0));cam.backgroundColor=new Color(.045f,.075f,.10f);cam.clearFlags=CameraClearFlags.SolidColor;camObject.AddComponent<AudioListener>();
   var sun=new GameObject("Key light").AddComponent<Light>();sun.type=LightType.Directional;sun.intensity=1.3f;sun.transform.rotation=Quaternion.Euler(45,-30,0);RenderSettings.ambientLight=new Color(.38f,.45f,.48f);
   var ground=GameObject.CreatePrimitive(PrimitiveType.Plane);ground.name="Swarm floor";ground.transform.localScale=Vector3.one*2;ground.GetComponent<Renderer>().material.color=new Color(.10f,.17f,.20f);kernel.Add("floor","Floor object","Being",ground,"morph");kernel.Relate("world","floor","contains","Being");
   human=CreateBody("human","Human",1.9f,new Vector3(.3f,0,0),"Being");wolf=CreateBody("wolf","Wolf",.8f,new Vector3(1.3f,0,.3f),"Evolution");if(human!=null&&wolf!=null)kernel.Relate("human","wolf","travels-with","Evolution");
   BuildInterface();
  }
  SwarmBody CreateBody(string id,string resource,float height,Vector3 position,string dimension){
   var prefab=Resources.Load<GameObject>("Models/"+resource);if(prefab==null){Debug.LogError("Missing actual model: "+resource);return null;}
   var root=new GameObject(id);var body=Instantiate(prefab,root.transform);body.name=resource+" model";var renderers=body.GetComponentsInChildren<Renderer>();if(renderers.Length==0){Debug.LogError(resource+" has no rendered body");Destroy(root);return null;}var bounds=renderers[0].bounds;foreach(var r in renderers)bounds.Encapsulate(r.bounds);body.transform.localScale*=height/Mathf.Max(.001f,bounds.size.y);bounds=renderers[0].bounds;foreach(var r in renderers)bounds.Encapsulate(r.bounds);body.transform.position-=new Vector3(bounds.center.x,bounds.min.y,bounds.center.z);root.transform.position=position;
   var animator=body.GetComponentInChildren<Animator>();var controller=Resources.Load<RuntimeAnimatorController>("Controllers/"+resource+"Controller");if(animator!=null&&controller!=null){animator.runtimeAnimatorController=controller;animator.applyRootMotion=false;}
   if(resource=="Wolf")foreach(var renderer in renderers)foreach(var mat in renderer.materials){string texture=mat.name.IndexOf("Body",StringComparison.OrdinalIgnoreCase)>=0?"Wolf_Body":mat.name.IndexOf("Eye",StringComparison.OrdinalIgnoreCase)>=0?"Wolf_Eyes_1":mat.name.IndexOf("Fur",StringComparison.OrdinalIgnoreCase)>=0?"Wolf_Fur_Alpha_3":null;if(texture!=null){var image=Resources.Load<Texture2D>("Models/Textures/"+texture);if(image!=null)mat.mainTexture=image;}}
   var entity=kernel.Add(id,resource,dimension,root,"morph","walk","inspect");entity.frame="world";kernel.entities["world"].children.Add(id);kernel.Relate("world",id,"contains",dimension);var swarm=root.AddComponent<SwarmBody>();swarm.identity=id;swarm.kernel=kernel;swarm.controller=model;return swarm;
  }
  GameObject UIObject(string name,Transform parent,Type component,float left,float top,float width,float height){var go=new GameObject(name,typeof(RectTransform));go.transform.SetParent(parent,false);var rect=go.GetComponent<RectTransform>();rect.anchorMin=rect.anchorMax=new Vector2(0,1);rect.pivot=new Vector2(0,1);rect.anchoredPosition=new Vector2(left,-top);rect.sizeDelta=new Vector2(width,height);if(component!=null)go.AddComponent(component);string id="ui."+(++uiSequence);kernel.Add(id,name,"Design",go,"render","inspect");kernel.Relate("world",id,"expresses-interface","Design");return go;}
  Text Label(string text,Transform parent,float left,float top,float width,float height,int size=14){var go=UIObject(text,parent,typeof(Text),left,top,width,height);var label=go.GetComponent<Text>();label.font=font;label.fontSize=size;label.text=text;label.color=new Color(.88f,.91f,.86f);label.verticalOverflow=VerticalWrapMode.Overflow;return label;}
  Button Control(string label,Transform parent,float left,float top,float width,float height,Action action,string target=null){var go=UIObject(label,parent,typeof(Image),left,top,width,height);string id="ui."+uiSequence;go.GetComponent<Image>().color=new Color(.12f,.22f,.25f);var button=go.AddComponent<Button>();button.targetGraphic=go.GetComponent<Image>();var text=Label(label,go.transform,8,5,width-16,height-6,12);text.alignment=TextAnchor.MiddleLeft;if(target!=null&&kernel.entities.ContainsKey(target))kernel.Relate(id,target,"invokes-capability","Movement");button.onClick.AddListener(()=>{kernel.Record("interface.invoked",id,label);if(target!=null)kernel.Signal(id,target);action();});return button;}
  void BuildInterface(){
   font=Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");var canvasObject=new GameObject("Swarm interface",typeof(Canvas),typeof(CanvasScaler),typeof(GraphicRaycaster));canvasObject.GetComponent<Canvas>().renderMode=RenderMode.ScreenSpaceOverlay;var scaler=canvasObject.GetComponent<CanvasScaler>();scaler.uiScaleMode=CanvasScaler.ScaleMode.ScaleWithScreenSize;scaler.referenceResolution=new Vector2(1280,800);scaler.matchWidthOrHeight=.5f;interfaceRoot=canvasObject.transform;kernel.Add("interface","Function + embodied interface","Space",canvasObject,"compose","render");kernel.Relate("world","interface","expresses","Design");
   if(FindObjectOfType<EventSystem>()==null)new GameObject("EventSystem",typeof(EventSystem),typeof(StandaloneInputModule));
   var panel=UIObject("Qualitative explorer",interfaceRoot,typeof(Image),20,20,320,755);panel.GetComponent<Image>().color=new Color(.04f,.08f,.11f,.95f);
   Label("SYNTHIA / ADAPTIVE SWARM",panel.transform,16,14,290,30,18);Label("Function and embodiment share identities,\nrelations and construction history.",panel.transform,16,52,290,45,12);
   Control("Human → particles → human",panel.transform,16,104,288,35,()=>human?.Morph(),"human");Control("Wolf → particles → wolf",panel.transform,16,145,288,35,()=>wolf?.Morph(),"wolf");Control("Walk through the world",panel.transform,16,186,288,35,()=>{if(human!=null)StartCoroutine(human.WalkTo(new Vector3(-1.5f,0,1.4f)));if(wolf!=null)StartCoroutine(wolf.WalkTo(new Vector3(-.4f,0,1.8f)));},"human");
   Label(model.Evidence,panel.transform,16,233,288,40,11);pathText=Label("Root dimensional frame",panel.transform,16,279,288,50,11);
   for(int i=0;i<SynthiaKernel.Dimensions.Length;i++){string d=SynthiaKernel.Dimensions[i];Control(d,panel.transform,16+(i%3)*96,338+(i/3)*34,90,29,()=>{dimension=d;BuildQualities();});}
   var scrollObject=UIObject("Nested qualities",panel.transform,typeof(Image),16,412,288,260);scrollObject.GetComponent<Image>().color=new Color(.05f,.10f,.13f);var scroll=scrollObject.AddComponent<ScrollRect>();scroll.horizontal=false;scrollObject.AddComponent<RectMask2D>();var content=UIObject("Qualified frame content",scrollObject.transform,null,0,0,280,450);qualityRoot=content.transform;scroll.content=content.GetComponent<RectTransform>();scroll.viewport=scrollObject.GetComponent<RectTransform>();
   Control("Up one frame",panel.transform,16,684,288,30,()=>{if(frameHistory.Count>0){path=frameHistory.Pop();BuildQualities();}});status=Label("",interfaceRoot,365,25,820,55,13);BuildQualities();
  }
  void BuildQualities(){foreach(Transform child in qualityRoot)Destroy(child.gameObject);var frame=kernel.Resolve("human",path);pathText.text=path.Length==0?"Root frame · all five dimensions":path;var names=frame.dimensions[dimension];for(int i=0;i<names.Length;i++){string quality=names[i];Control(quality+" → all five dimensions",qualityRoot,0,i*32,280,29,()=>{frameHistory.Push(path);path+=(path.Length>0?" > ":"")+dimension+"/"+quality;BuildQualities();});}qualityRoot.GetComponent<RectTransform>().sizeDelta=new Vector2(280,names.Length*32);}
  void Update(){if(status!=null)status.text="Object-by-object swarm · "+kernel.entities.Count+" entities · "+kernel.relations.Count+" relations\n"+kernel.events.Count+" retained events · Unity runtime";}
 }
}
