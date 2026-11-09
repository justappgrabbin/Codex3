using System;
using System.Linq;
using System.IO;
using UnityEditor;
using UnityEditor.Animations;
using UnityEngine;
namespace Synthia.Editor {
 public static class BuildCharacterControllers {
  [InitializeOnLoadMethod] static void OnLoad(){EditorApplication.delayCall+=Ensure;}
  [MenuItem("Synthia/Prepare real character controllers")]
  public static void Ensure(){if(EditorApplication.isCompiling||EditorApplication.isUpdating){EditorApplication.delayCall+=Ensure;return;}Prepare("Human");Prepare("Wolf");}
  static void Prepare(string name){string path="Assets/Resources/Models/"+name+".fbx",target="Assets/Resources/Controllers/"+name+"Controller.controller";if(!File.Exists(path)||File.Exists(target))return;var importer=AssetImporter.GetAtPath(path) as ModelImporter;if(importer!=null&&(importer.animationType!=ModelImporterAnimationType.Generic||!importer.importAnimation)){importer.animationType=ModelImporterAnimationType.Generic;importer.importAnimation=true;importer.SaveAndReimport();}
   var clips=AssetDatabase.LoadAllAssetsAtPath(path).OfType<AnimationClip>().Where(x=>!x.name.StartsWith("__preview__")).ToArray();if(clips.Length==0){Debug.LogError(name+" has no imported animation clips");return;}var idle=clips.FirstOrDefault(x=>x.name.IndexOf("idle",StringComparison.OrdinalIgnoreCase)>=0)??clips[0];var walk=clips.FirstOrDefault(x=>x.name.IndexOf("walk",StringComparison.OrdinalIgnoreCase)>=0);if(walk==null){Debug.LogWarning(name+" has no walking clip; inspect source import");walk=idle;}
   Directory.CreateDirectory("Assets/Resources/Controllers");var controller=AnimatorController.CreateAnimatorControllerAtPath(target);controller.AddParameter("Speed",AnimatorControllerParameterType.Float);var machine=controller.layers[0].stateMachine;var a=machine.AddState("Idle");a.motion=idle;var b=machine.AddState("Walk");b.motion=walk;machine.defaultState=a;var to=b.AddTransition(a);to.hasExitTime=false;to.duration=.15f;to.AddCondition(AnimatorConditionMode.Less,.05f,"Speed");var from=a.AddTransition(b);from.hasExitTime=false;from.duration=.15f;from.AddCondition(AnimatorConditionMode.Greater,.05f,"Speed");AssetDatabase.SaveAssets();Debug.Log("Prepared "+name+" controller with "+clips.Length+" source clips");
  }
 }
}
