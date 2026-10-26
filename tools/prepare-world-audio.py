"""Prepare attributed recordings; source archives stay outside the repository."""
from pathlib import Path
import urllib.request, subprocess, zipfile, hashlib, json, shutil
import numpy as np
import py7zr
TMP=Path('/tmp/ot-world-audio');TMP.mkdir(exist_ok=True)
OUT=Path('games/otthi/audio');OUT.mkdir(exist_ok=True)
downloads={'car.wav':'https://opengameart.org/sites/default/files/loop_0.wav','firearms.7z':'https://opengameart.org/sites/default/files/Prepared%20SFX%20Library.7z','motorcycles.zip':'https://opengameart.org/sites/default/files/Startup%2C%20Idle%20%26%20Rev.zip','heli.ogg':'https://opengameart.org/sites/default/files/heli_0.ogg'}
for name,url in downloads.items():
 if not (TMP/name).exists():
  with urllib.request.urlopen(url,timeout=45) as r:(TMP/name).write_bytes(r.read())
 print('Downloaded',name,(TMP/name).stat().st_size,flush=True)
names=['AR-15/D_32P.wav','AR-15/D_24P.wav','Carl Gustav M45/G_31P.wav','Carl Gustav M45/G_20P.wav','Tikka/W_24P.wav']
with py7zr.SevenZipFile(TMP/'firearms.7z') as z:z.extract(path=TMP/'guns',targets=['Prepared SFX Library/'+n for n in names])
with zipfile.ZipFile(TMP/'motorcycles.zip') as z:z.extract('090912-003.mp3',TMP/'motos')
def pcm(path):return np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(path),'-ac','1','-ar','24000','-f','f32le','-']),dtype='<f4').copy()
records=[]
def save(name,a,source,start,end,license,author):
 a=np.asarray(a,dtype=np.float32);a-=a.mean();a=a/max(.001,float(np.max(np.abs(a))))*.72;n=min(1200,len(a)//4);a[-n:]*=np.linspace(1,0,n);a[:48]*=np.linspace(0,1,48)
 subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar','24000','-ac','1','-i','-','-af','highpass=f=35,lowpass=f=9500','-c:a','libvorbis','-q:a','5',str(OUT/(name+'.ogg'))],input=a.tobytes(),check=True)
 records.append({'file':name+'.ogg','source':source,'sourceStart':start,'sourceEnd':end,'license':license,'author':author,'sha256':hashlib.sha256((OUT/(name+'.ogg')).read_bytes()).hexdigest(),'duration':len(a)/24000})
for name,path,duration in zip(['rifle-1','rifle-2','smg-1','smg-2','marksman'],names,[1.15,1.15,.8,.8,1.6]):
 a=pcm(TMP/'guns/Prepared SFX Library'/path);on=np.flatnonzero(np.abs(a)>np.max(np.abs(a))*.16)[0];start=max(0,on-240);end=min(len(a),start+int(24000*duration));save(name,a[start:end],'https://opengameart.org/content/the-free-firearm-sound-library#'+path,start/24000,end/24000,'CC0-1.0','Ben Jaszczak, Brian Nelson, Kevin Heras, Matthew Nanney')
a=pcm(TMP/'car.wav');n=420;a[:n]=(a[:n]+a[-n:])/2;a[-n:]=a[:n];save('engine-car',np.tile(a,4),'https://opengameart.org/content/racing-car-engine-sound-loops',0,len(a)/24000,'CC0-1.0','domasx2 / public-domain pdsounds recording')
a=pcm(TMP/'motos/090912-003.mp3');save('engine-moto',a[8*24000:int(11.5*24000)],'https://opengameart.org/content/engines-startup-idle-rev#090912-003.mp3',8,11.5,'CC-BY-SA-3.0','dklon')
a=pcm(TMP/'heli.ogg');cs=np.r_[0,np.cumsum(a.astype(np.float64)**2)];energy=cs[24000:]-cs[:-24000];start=max(0,float(np.argmax(energy))/24000-.5);end=min(len(a)/24000,start+4);save('engine-heli',a[int(start*24000):int(end*24000)],'https://opengameart.org/content/helicopter-sfx',start,end,'CC0-1.0','WuxiaScrub')
(OUT/'sources.json').write_text(json.dumps({'version':'20261026-recorded1','processing':'Mono24k Vorbis, trim, DC removal, peak normalization, HP35/LP9500, fade. Runtime loop seam. Vehicle variants are authored mixes, not factory recordings of named models.','assets':records},ensure_ascii=False,indent=2)+'\n')
(OUT/'CREDITS.txt').write_text('Recorded game audio\nFree Firearm Sound Library: Ben Jaszczak, Brian Nelson, Kevin Heras, Matthew Nanney. CC0. https://opengameart.org/content/the-free-firearm-sound-library\nCar loop: domasx2 / public-domain pdsounds source. CC0. https://opengameart.org/content/racing-car-engine-sound-loops\nHelicopter: WuxiaScrub. CC0. https://opengameart.org/content/helicopter-sfx\nMotorcycle: dklon, CC BY-SA 3.0. This trimmed/equalized adaptation engine-moto.ogg remains CC BY-SA 3.0: https://creativecommons.org/licenses/by-sa/3.0/ and https://opengameart.org/content/engines-startup-idle-rev\nVehicle sounds are designed mixes, not model-specific factory recordings.\n')
for p in Path('games').rglob('game-audio.js'):shutil.copytree(OUT,p.parent/'audio',dirs_exist_ok=True) if p.parent.name!='otthi' else None
print('Prepared',len(records),'recordings;',sum(p.stat().st_size for p in OUT.iterdir()),'bytes',flush=True)
