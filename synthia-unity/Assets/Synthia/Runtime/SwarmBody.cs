using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Rendering;
namespace Synthia {
 public sealed class SwarmBody : MonoBehaviour {
  public string identity;
  public SynthiaKernel kernel;
  public AssemblyModel controller;
  public int particleCount=1000;
  public float morph;
  SkinnedMeshRenderer[] skins;
  Mesh[] baked;
  ParticleSystem cloud;
  ParticleSystem.Particle[] particles;
  Vector3[] velocities;
  readonly List<Material> materials=new List<Material>();
  int[] owner,vertex;
  Animator animator;
  bool walking;
  float age=100;
  void Start() {
   skins=GetComponentsInChildren<SkinnedMeshRenderer>();if(skins.Length==0){Debug.LogError(identity+" requires an actual skinned mesh");enabled=false;return;}
   animator=GetComponentInChildren<Animator>();baked=new Mesh[skins.Length];int total=0;for(int i=0;i<skins.Length;i++){baked[i]=new Mesh();skins[i].BakeMesh(baked[i]);total+=baked[i].vertexCount;foreach(var source in skins[i].materials){var mat=source;materials.Add(mat);}}
   var go=new GameObject(identity+".surface-swarm");go.transform.SetParent(transform,false);cloud=go.AddComponent<ParticleSystem>();var main=cloud.main;main.loop=false;main.playOnAwake=false;main.maxParticles=particleCount;main.simulationSpace=ParticleSystemSimulationSpace.World;main.startLifetime=100000;main.startSize=.022f;main.startSpeed=0;main.gravityModifier=0;var emission=cloud.emission;emission.enabled=false;var shape=cloud.shape;shape.enabled=false;var renderer=go.GetComponent<ParticleSystemRenderer>();var shader=Shader.Find("Particles/Standard Unlit")??Shader.Find("Sprites/Default");renderer.material=new Material(shader);renderer.renderMode=ParticleSystemRenderMode.Billboard;
   particles=new ParticleSystem.Particle[particleCount];velocities=new Vector3[particleCount];owner=new int[particleCount];vertex=new int[particleCount];for(int i=0;i<particleCount;i++){int n=Mathf.FloorToInt((float)i*total/particleCount),m=0;while(n>=baked[m].vertexCount){n-=baked[m].vertexCount;m++;}owner[i]=m;vertex[i]=n;particles[i].startSize=.022f;particles[i].remainingLifetime=100000;particles[i].startLifetime=100000;particles[i].startColor=new Color(.75f,.85f,.79f,.15f);particles[i].position=skins[m].transform.TransformPoint(baked[m].vertices[n]);}cloud.SetParticles(particles,particles.Length);kernel?.Record("population.registered",identity,particleCount+" surface particles; inherited identity/address context");
  }
  public void Morph() {age=0;kernel?.Record("morph.started",identity,"surface particles → scatter → reconstruct");}
  public IEnumerator WalkTo(Vector3 target) {walking=true;if(animator!=null)animator.SetFloat("Speed",1);while(Vector3.Distance(transform.position,target)>.04f){var d=target-transform.position;if(d.sqrMagnitude>.001f)transform.rotation=Quaternion.Slerp(transform.rotation,Quaternion.LookRotation(d),Time.deltaTime*8);transform.position=Vector3.MoveTowards(transform.position,target,Time.deltaTime*1.2f);yield return null;}walking=false;if(animator!=null)animator.SetFloat("Speed",0);kernel?.Record("movement.arrived",identity,target.ToString());}
  void LateUpdate() {
   if(particles==null)return;float dt=Mathf.Min(Time.deltaTime,.035f);age+=dt;morph=age<.9f?Mathf.Sin(age/.9f*Mathf.PI/2):age<1.3f?1:age<3.4f?Mathf.Max(0,1-(age-1.3f)/2.1f):0;for(int i=0;i<skins.Length;i++)skins[i].BakeMesh(baked[i]);
   var arrays=new Vector3[baked.Length][];for(int i=0;i<baked.Length;i++)arrays[i]=baked[i].vertices;float coupling=controller==null?.5f:controller.Predict(new[]{.5f,.5f,.5f,.5f,.5f,(.5f+morph*2)/3,.5f,.5f});float k=3+coupling*25,damping=2*Mathf.Sqrt(k)*.775f;
   for(int i=0;i<particles.Length;i++){int m=owner[i];Vector3 target=skins[m].transform.TransformPoint(arrays[m][vertex[i]]);float a=i*2.39996f;target+=new Vector3(Mathf.Cos(a),Mathf.Sin(a*.37f)*.6f,Mathf.Sin(a))*morph;velocities[i]+=((target-particles[i].position)*k-velocities[i]*damping)*dt;particles[i].position+=velocities[i]*dt;particles[i].startColor=new Color(.75f,.85f,.79f,.12f+morph*.88f);particles[i].remainingLifetime=100000;}
   cloud.SetParticles(particles,particles.Length);foreach(var mat in materials){if(morph>.01f){mat.SetFloat("_Mode",3);mat.SetInt("_SrcBlend",(int)BlendMode.SrcAlpha);mat.SetInt("_DstBlend",(int)BlendMode.OneMinusSrcAlpha);mat.SetInt("_ZWrite",0);mat.EnableKeyword("_ALPHABLEND_ON");mat.renderQueue=3000;}else{mat.SetFloat("_Mode",0);mat.SetInt("_SrcBlend",(int)BlendMode.One);mat.SetInt("_DstBlend",(int)BlendMode.Zero);mat.SetInt("_ZWrite",1);mat.DisableKeyword("_ALPHABLEND_ON");mat.renderQueue=-1;}var color=mat.color;color.a=1-morph*.96f;mat.color=color;}
   if(age-dt<3.4f&&age>=3.4f)kernel?.Record("assembly.observed",identity,"reconstructed using local learned coupling "+coupling.ToString("F3"));
  }
  void OnDestroy(){if(baked!=null)foreach(var mesh in baked)Destroy(mesh);}
 }
}
