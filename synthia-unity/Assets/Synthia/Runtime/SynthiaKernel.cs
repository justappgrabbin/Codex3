using System;
using System.Collections.Generic;
using UnityEngine;

namespace Synthia {
 [Serializable] public class SwarmEvent { public int sequence; public string type, entity, detail; }
 [Serializable] public class SwarmRelation { public string source, target, kind, dimension; public float weight; public int crossings; }
 public sealed class SwarmEntity {
  public string id, label, dimension, frame;
  public readonly List<string> capabilities = new List<string>();
  public readonly List<string> children = new List<string>();
  public readonly List<string> history = new List<string>();
  public GameObject embodiment;
 }
 public sealed class QualifiedFrame {
  public string entity, path;
  public readonly Dictionary<string,string[]> dimensions = new Dictionary<string,string[]>();
 }
 public sealed class SynthiaKernel {
  public static readonly string[] Dimensions = {"Movement","Evolution","Being","Design","Space"};
  public static readonly Dictionary<string,string[]> Qualities = new Dictionary<string,string[]> {
   {"Movement",new[]{"Energy","Creation","Seeing","Landscape","Environment","Individuality","Activity","Reaction","Limitation","Perspective","Relation","Uniqueness"}},
   {"Evolution",new[]{"Gravity","Memory","Taste","Love","Light","Mind","Character","Separation","Nature","Integration","Spirit","Role"}},
   {"Being",new[]{"Matter","Is","Touch","Sex","Survival","Body","Biology","Chemistry","Objectivity","Geometry","Trajectory","Genetics"}},
   {"Design",new[]{"Structure","Progress","Smell","Life","Art","Ego","Homo Sapiens","Growth","Decay","Continuity","Manifestation","Self"}},
   {"Space",new[]{"Form","Illusion","Hearing","Music","Freedom","Personality","Type","Fantasy","Subjectivity","Rhythm","Timing","Presence"}}
  };
  public readonly Dictionary<string,SwarmEntity> entities = new Dictionary<string,SwarmEntity>();
  public readonly List<SwarmRelation> relations = new List<SwarmRelation>();
  public readonly List<SwarmEvent> events = new List<SwarmEvent>();
  public event Action Changed;
  public SwarmEntity Add(string id,string label,string dimension,GameObject body,params string[] tools) {
   if(entities.ContainsKey(id)) throw new ArgumentException("Duplicate identity: "+id);
   if(!Qualities.ContainsKey(dimension)) throw new ArgumentException("Unknown dimensional frame");
   var e=new SwarmEntity{id=id,label=label,dimension=dimension,embodiment=body};e.capabilities.AddRange(tools);e.history.Add("origin");entities.Add(id,e);Record("entity.created",id,label);return e;
  }
  public void Relate(string a,string b,string kind,string dimension) {
   if(!entities.ContainsKey(a)||!entities.ContainsKey(b))throw new ArgumentException("Relation endpoints must exist");
   relations.Add(new SwarmRelation{source=a,target=b,kind=kind,dimension=dimension});Record("relation.created",a,kind+" → "+b);
  }
  public void Signal(string a,string b) { var r=relations.Find(x=>x.source==a&&x.target==b);if(r==null)throw new ArgumentException("Signal requires a recorded relation");r.crossings++;r.weight=(float)r.crossings/(r.crossings+1);Record("signal.delivered",a,b); }
  public QualifiedFrame Resolve(string entity,string path="") {
   if(!entities.ContainsKey(entity))throw new ArgumentException("Unknown identity");
   if(path.Split(new[]{'>'},StringSplitOptions.RemoveEmptyEntries).Length>32)throw new ArgumentException("Workbench depth budget is 32");
   var frame=new QualifiedFrame{entity=entity,path=path};foreach(var d in Dimensions)frame.dimensions[d]=(string[])Qualities[d].Clone();return frame;
  }
  public void Record(string type,string entity,string detail) { events.Add(new SwarmEvent{sequence=events.Count+1,type=type,entity=entity,detail=detail});Changed?.Invoke(); }
 }
}
