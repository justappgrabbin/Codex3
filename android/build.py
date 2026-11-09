#!/usr/bin/env python3
"""Build the native APK with the Android SDK, without a Gradle daemon or wrappers."""
from pathlib import Path
import hashlib,json,os,shutil,subprocess,sys,zipfile,urllib.request
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'android/build'
def run(args):
 subprocess.run([str(x) for x in args],check=True,cwd=ROOT)
def build():
 sdk=Path(os.environ.get('ANDROID_SDK_ROOT',os.environ.get('ANDROID_HOME','')))
 tools=sdk/'build-tools/35.0.0';android=sdk/'platforms/android-35/android.jar'
 java=Path(os.environ.get('JAVA_HOME',''))/'bin'
 javac=java/'javac' if (java/'javac').is_file() else shutil.which('javac')
 keytool=java/'keytool' if (java/'keytool').is_file() else shutil.which('keytool')
 if not android.is_file() or not (tools/'aapt2').is_file() or not javac:raise SystemExit('Install Android platform 35, build-tools 35.0.0 and JDK 17+; set ANDROID_SDK_ROOT and JAVA_HOME.')
 OUT.mkdir(exist_ok=True)
 deps=OUT/'deps';deps.mkdir(exist_ok=True);aar=deps/'quickjs.aar'
 expected='b20a0addc8dd091b22f16c730000204030734231678d2b88538be0ac579510e2'
 if not aar.exists():urllib.request.urlretrieve('https://repo.maven.apache.org/maven2/app/cash/quickjs/quickjs-android/0.9.2/quickjs-android-0.9.2.aar',aar)
 if hashlib.sha256(aar.read_bytes()).hexdigest()!=expected:raise SystemExit('QuickJS dependency checksum mismatch')
 with zipfile.ZipFile(aar) as archive:
  (deps/'quickjs.jar').write_bytes(archive.read('classes.jar'))

 if (OUT/'assets').exists():shutil.rmtree(OUT/'assets')
 run(['node','android/bundle.mjs'])
 for name in ['classes','generated','dex']:
  directory=OUT/name
  if directory.exists():shutil.rmtree(directory)
  directory.mkdir()
 run([tools/'aapt2','compile','--dir',ROOT/'android/app/src/main/res','-o',OUT/'resources.zip'])
 run([tools/'aapt2','link','-o',OUT/'resources.ap_','-I',android,'--manifest',ROOT/'android/app/src/main/AndroidManifest.xml','--java',OUT/'generated','-A',OUT/'assets','--min-sdk-version','24','--debug-mode','--target-sdk-version','35','--version-code','1','--version-name','0.3.0','-0','glb','-0','mjs',OUT/'resources.zip'])
 sources=list((ROOT/'android/app/src/main/java').rglob('*.java'))+list((OUT/'generated').rglob('*.java'))
 run([javac,'--release','8','-classpath',str(android)+os.pathsep+str(deps/'quickjs.jar'),'-d',OUT/'classes',*sources])
 run([tools/'d8','--lib',android,'--min-api','24','--output',OUT/'dex',*list((OUT/'classes').rglob('*.class')),deps/'quickjs.jar'])
 unsigned=OUT/'unsigned.apk';shutil.copyfile(OUT/'resources.ap_',unsigned)
 with zipfile.ZipFile(unsigned,'a') as archive:
  for dex in (OUT/'dex').glob('*.dex'):archive.write(dex,dex.name,compress_type=zipfile.ZIP_DEFLATED)
  with zipfile.ZipFile(aar) as dependency:
   for name in dependency.namelist():
    if name.startswith('jni/') and name.endswith('.so'):archive.writestr('lib/'+name[4:],dependency.read(name),compress_type=zipfile.ZIP_STORED)
 apk=OUT/'synthia-codex3-debug.apk';run([tools/'zipalign','-P','16','-f','4',unsigned,apk])
 keystore=Path.home()/'.android/codex3-debug.keystore';keystore.parent.mkdir(exist_ok=True)
 if not keystore.exists():
  run([keytool,'-genkeypair','-keystore',keystore,'-storepass','android','-keypass','android','-alias','androiddebugkey','-keyalg','RSA','-keysize','2048','-validity','10000','-dname','CN=Synthia Development,O=Codex3,C=US'])
  keystore.chmod(0o600)
 run([tools/'apksigner','sign','--ks',keystore,'--ks-key-alias','androiddebugkey','--ks-pass','pass:android','--key-pass','pass:android',apk])
 run([tools/'apksigner','verify','--verbose',apk])
 receipt={'package':'com.synthia.codex3','version':'0.3.0','minSdk':24,'targetSdk':35,'sha256':hashlib.sha256(apk.read_bytes()).hexdigest(),'bytes':apk.stat().st_size,'signing':'development key; not the installed Adaptive app signing identity','runtimeSha256':(OUT/'assets/runtime.sha256').read_text().strip()}
 (OUT/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps(receipt,indent=2))
if __name__=='__main__':build()
