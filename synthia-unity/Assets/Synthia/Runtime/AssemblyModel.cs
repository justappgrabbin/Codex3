using System;
using UnityEngine;
namespace Synthia {
 [Serializable] public class AssemblyEdge { public int from,to; public float logit; }
 [Serializable] public class AssemblyModelData { public int input,hidden; public float[] w1,b1,w2; public float b2; public AssemblyEdge[] edges; public string provenance; public float beforeCost,afterCost; }
 public sealed class AssemblyModel {
  readonly AssemblyModelData data;
  public bool Ready => data!=null;
  public string Evidence => data==null?"Controller unavailable":"Held-out local assembly cost "+data.beforeCost.ToString("F3")+" → "+data.afterCost.ToString("F3");
  public AssemblyModel() { var asset=Resources.Load<TextAsset>("assembly-controller");if(asset!=null){var d=JsonUtility.FromJson<AssemblyModelData>(asset.text);if(d.input==8&&d.hidden>0&&d.w1.Length==8*d.hidden&&d.b1.Length==d.hidden&&d.w2.Length==d.hidden)data=d;} }
  static float Sigmoid(float x) => 1f/(1f+Mathf.Exp(-Mathf.Clamp(x,-32,32)));
  public float Predict(float[] input) { if(input.Length!=8)throw new ArgumentException("Eight measured controller features required");if(data==null)return .5f;var raw=new float[data.hidden];var mixed=new float[data.hidden];var degrees=new int[data.hidden];for(int i=0;i<raw.Length;i++){float sum=data.b1[i];for(int j=0;j<8;j++)sum+=data.w1[i*8+j]*input[j];raw[i]=(float)Math.Tanh(sum);mixed[i]=raw[i]*.8f;}foreach(var edge in data.edges)degrees[edge.to]++;foreach(var edge in data.edges)mixed[edge.to]+=.2f*Sigmoid(edge.logit)*raw[edge.from]/Mathf.Max(1,degrees[edge.to]);float y=data.b2;for(int i=0;i<mixed.Length;i++)y+=mixed[i]*data.w2[i];return Sigmoid(y); }
 }
}
