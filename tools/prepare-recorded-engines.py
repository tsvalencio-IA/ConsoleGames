"""Prepare licensed engine recordings, retaining input hashes and exact edits.

These are category/engine-family adaptations, not factory recordings of every
named in-game vehicle. Public preview encodings are identified explicitly.
"""
from pathlib import Path
import hashlib, json, shutil, subprocess, urllib.request
import numpy as np
from audio_loop import smooth_loop

ROOT = Path(__file__).resolve().parents[1]
TMP = Path('/tmp/ot-real-engines'); TMP.mkdir(exist_ok=True)
OUT = ROOT / 'games/otthi/audio'
VERSION = '20261028-recorded3'
BB = 'https://bigsoundbank.com/'
sources = {
 '0189': ('0189.wav', BB+'UPLOAD/bwf-en/0189.wav', BB+'car-starting-and-departure-s0189.html', 'Joseph SARDIN', 'Citroën Saxo 1.1'),
 '0291': ('0291.wav', BB+'UPLOAD/bwf-en/0291.wav', BB+'car-engine-2-s0291.html', 'DenisChardonnet', 'Car accelerations; model unspecified'),
 '0534': ('0534.wav', BB+'UPLOAD/bwf-en/0534.wav', BB+'ac-cobra-engine-s0534.html', 'Joseph SARDIN', 'AC Cobra 427'),
 '1145': ('1145.wav', BB+'UPLOAD/bwf-en/1145.wav', BB+'truck-engine-s1145.html', 'Joseph SARDIN', 'Iveco Daily 3.0 40C14 HPI'),
 '1147': ('1147.wav', BB+'UPLOAD/bwf-en/1147.wav', BB+'truck-engine-big-accelerations-s1147.html', 'Joseph SARDIN', 'Iveco Daily 3.0 40C14 HPI'),
 '0281': ('0281.wav', BB+'UPLOAD/bwf-en/0281.wav', BB+'motorcycle-s0281.html', 'DenisChardonnet', 'Motorcycle; model unspecified'),
 '0884': ('0884.wav', BB+'UPLOAD/bwf-en/0884.wav', BB+'starting-a-motorcycle-s0884.html', 'Joseph SARDIN', 'Ducati Granturismo'),
 '0603': ('0603.wav', BB+'UPLOAD/bwf-en/0603.wav', BB+'75-cm3-motorcycle-acceleration-s0603.html', 'Joseph SARDIN', '75 cm³ motorcycle; model unspecified'),
 '0263': ('0263.wav', BB+'UPLOAD/bwf-en/0263.wav', BB+'helicopter-1-s0263.html', 'Joseph SARDIN', 'Helicopter interior; model unspecified'),
 '0501': ('0501.wav', BB+'UPLOAD/bwf-en/0501.wav', BB+'sound-s0501.html', 'Joseph SARDIN', 'Small propeller aircraft; model unspecified'),
 '579211': ('579211.mp3', 'https://cdn.freesound.org/previews/579/579211_485650-hq.mp3', 'https://freesound.org/people/bowlingballout/sounds/579211/', 'bowlingballout', '1970 VW Beetle; public HQ preview'),
 '534856': ('534856.mp3', 'https://cdn.freesound.org/previews/534/534856_7108357-hq.mp3', 'https://freesound.org/people/m_cel/sounds/534856/', 'm_cel', 'Jet engine static test; public HQ preview'),
 '577425': ('577425.mp3', 'https://cdn.freesound.org/previews/577/577425_10485775-hq.mp3', 'https://freesound.org/people/Legnalegna55/sounds/577425/', 'Legnalegna55', 'Small motor boat; public HQ preview'),
}
clips = [
 ('engine-road-idle','0189',1.3,4.6), ('engine-road-load','0291',.8,4.8),
 ('engine-classic-idle','579211',4.2,9.4), ('engine-classic-load','579211',18.7,20.8),
 ('engine-sport-idle','0534',12.5,19.5), ('engine-sport-load','0534',2.2,10.6),
 ('engine-heavy-idle','1145',2,10), ('engine-heavy-load','1147',4,11),
 ('engine-moto-idle','0281',.8,3.2), ('engine-moto-load','0281',7,10.8),
 ('engine-twin-idle','0884',12,19), ('engine-twin-load','0884',31,34.8),
 ('engine-small-moto','0603',.8,5.8), ('engine-rotor-recorded','0263',.25,5.9),
 ('engine-prop-recorded','0501',.25,7), ('engine-jet-recorded','534856',.4,9.4),
 ('engine-boat-recorded','577425',10,20),
]
def sha(b): return hashlib.sha256(b).hexdigest()
old_path=OUT/'engine-recordings.json'
old={a['file']:a for a in json.loads(old_path.read_text()).get('assets',[])} if old_path.exists() else {}
decoded={}; records=[]
for name, key, start, end in clips:
 filename,url,page,author,model=sources[key];src=TMP/filename
 if not src.exists():
  with urllib.request.urlopen(url,timeout=45) as response:src.write_bytes(response.read())
 input_hash=sha(src.read_bytes());target=OUT/(name+'.ogg')
 entry={'file':target.name,'source':page,'download':url,'sourceSHA256':input_hash,'sourceStart':start,'sourceEnd':end,'license':'CC0-1.0','author':author,'recordedSource':model,'processingVersion':VERSION,'processing':'Mono 24 kHz; HP 35 Hz / LP 9 kHz; DC removal; fixed level normalization; 150 ms complementary cosine loop seam. No synthetic ignition impulses.'}
 previous=old.get(target.name,{})
 if target.exists() and all(previous.get(k)==v for k,v in entry.items()) and previous.get('sha256')==sha(target.read_bytes()):
  records.append(previous);continue
 if key not in decoded:
  decoded[key]=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(src),'-ac','1','-ar','24000','-af','highpass=f=35,lowpass=f=9000','-f','f32le','-']),dtype='<f4').copy()
 a=decoded[key][round(start*24000):round(end*24000)].copy()
 if len(a)<24000:raise ValueError('Recording too short: '+name)
 a-=a.mean();a=smooth_loop(a,24000,.15)
 rms=float(np.sqrt(np.mean(a*a)));gain=min(.23/max(.00001,rms),.78/max(.00001,float(np.max(np.abs(a)))))
 a=(a*gain).astype('<f4')
 subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar','24000','-ac','1','-i','-','-c:a','libvorbis','-q:a','5',str(target)],input=a.tobytes(),check=True)
 entry.update(sha256=sha(target.read_bytes()),duration=len(a)/24000,normalizationGain=gain)
 records.append(entry);print(name,entry['duration'],target.stat().st_size,flush=True)
manifest={'version':VERSION,'kind':'real-recordings','scope':'Engine-family adaptations. Except for the explicitly identified source vehicles, these are not factory recordings of each named in-game model. Electric hum remains synthesized; bicycles, skates and balloons have no combustion motor.','assets':records}
old_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
credits=OUT/'CREDITS.txt';s=credits.read_text();marker='\nActive recorded engine bank\n';s=s.split(marker)[0]+marker+'Version '+VERSION+'. All newly added engine clips: CC0-1.0. Exact source, author, input hash, edits and encoded output hash: engine-recordings.json.\n'
for key in dict.fromkeys(key for _,key,_,_ in clips):
 filename,url,page,author,model=sources[key];s+=author+' — '+model+' — '+page+'\n'
s+='Recordings are adapted by engine family, not represented as factory recordings of every model. Freesound public preview encodings are identified above and in the manifest.\n';credits.write_text(s)
for game in ['kart','boxe','tenis','ar','voo','familia/3d']:
 folder=ROOT/'games'/game/'audio';folder.mkdir(exist_ok=True)
 for path in [old_path,credits]+[OUT/(name+'.ogg') for name,_,_,_ in clips]:shutil.copyfile(path,folder/path.name)
print('Prepared',len(records),'real engine clips',flush=True)
