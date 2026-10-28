"""Add attributed recordings with steady engine segments and measured loop bounds.

Keep the original bank's attribution. Source model and in-game model are never
conflated: family adaptations remain explicitly identified in the manifest.
"""
from pathlib import Path
import hashlib,json,re,subprocess,shutil,urllib.request
import numpy as np
from audio_loop import smooth_loop
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'games/otthi/audio';TMP=Path('/tmp/ot-vehicle-sources');TMP.mkdir(exist_ok=True)
VERSION='20261028-vehicle4'
# Public preview URLs were observed in these public source pages, not guessed.
SOURCES={
 '365174':('marfisa','1977 Volkswagen Fusca','https://cdn.freesound.org/previews/365/365174_6687602-hq.mp3','CC0-1.0'),
 '181161':('martian','Honda Hornet 600 / 599','https://cdn.freesound.org/previews/181/181161_84709-hq.mp3','CC0-1.0'),
 '335345':('Andreabarata','BMW M4','https://cdn.freesound.org/previews/335/335345_3157579-hq.mp3','CC0-1.0'),
 '23219':('Noizemaker','2002 BMW 1150 GS, air-cooled boxer twin','https://cdn.freesound.org/previews/23/23219_79678-hq.mp3','CC0-1.0'),
 '241083':('PritzProductions','Ferrari 360 Spider','https://cdn.freesound.org/previews/241/241083_3450345-hq.mp3','CC0-1.0'),
 '425158':('sound_catcher99','Fiat Grande Punto petrol engine','https://cdn.freesound.org/previews/425/425158_4370343-hq.mp3','CC0-1.0'),
 '173005':('ninebilly','1988 BMW 320 engine','https://cdn.freesound.org/previews/173/173005_773642-hq.mp3','CC0-1.0'),
 '833742':('chungus43A','2007 New Flyer D40LFR, Cummins ISL inline-six diesel','https://cdn.freesound.org/previews/833/833742_12024110-hq.mp3','CC-BY-4.0'),
 '451935':('kyles','Mack semi trailer diesel, idle and pull away','https://cdn.freesound.org/previews/451/451935_612689-hq.mp3','CC0-1.0'),
 '361407':('richwise','Honda CRF250 single-cylinder motorcycle','https://cdn.freesound.org/previews/361/361407_1481531-hq.mp3','CC0-1.0'),
 '584878':('rodrigocswm','Volkswagen three-cylinder petrol engine, model unspecified','https://cdn.freesound.org/previews/584/584878_8667144-hq.mp3','CC0-1.0'),
 '772802':('jerry.berumen','Porsche 911 boxer engine, generation unspecified','https://cdn.freesound.org/previews/772/772802_6753194-hq.mp3','CC-BY-4.0'),
}
CLIPS=[
 ('triple-idle','584878',6,28,3.6),('triple-load','584878',30,65,3.6),
 ('moto-idle','361407',3,18,3.6),('moto-load','361407',20,75,3.6),
 ('classic-idle','365174',5,28,3.8),('classic-load','365174',28,60,3.8),
 ('twin-idle','23219',6,20,3.6),('twin-load','23219',23,45,3.6),
 ('fiat-idle','425158',3,9,3.0),('fiat-load','425158',3,9,3.6),
 ('hornet-idle','181161',3,22,3.6),('hornet-load','181161',30,130,3.6),
 ('inline6-idle','173005',3,12,3.6),('inline6-load','173005',14,25,3.6),
 ('turbo6-idle','335345',15,120,3.6),('turbo6-load','335345',165,200,3.6),
 ('flat6-idle','772802',5,20,3.6),('flat6-load','772802',21,49,3.6),
 ('flatplane8-idle','241083',6,18,3.6),('flatplane8-load','241083',20,35,3.6),
 ('coach-idle','833742',.3,4.7,3.6),('coach-load','451935',4,15,3.6),
]
sha=lambda b:hashlib.sha256(b).hexdigest()
def steady(a,lo,hi,seconds):
 """Reject quiet/transient stretches; minimize RMS and spectral motion together."""
 n=round(seconds*24000);starts=range(round(lo*24000),max(round(lo*24000)+1,min(len(a),round(hi*24000))-n+1),4800);best=None
 for start in starts:
  x=a[start:start+n]
  if len(x)!=n:continue
  frames=x[:len(x)//2400*2400].reshape(-1,2400);r=np.sqrt(np.mean(frames*frames,axis=1));mean=float(r.mean())
  if mean<.002:continue
  spectrum=np.abs(np.fft.rfft(frames*np.hanning(2400),axis=1))[:,3:600];spectrum/=np.maximum(1e-8,np.sum(spectrum,axis=1,keepdims=True));flux=float(np.mean(np.sum(np.abs(np.diff(spectrum,axis=0)),axis=1)));cv=float(r.std()/mean);peak=float(np.max(np.abs(x)));score=cv+flux*.45+max(0,peak/mean-9)*.03
  if best is None or score<best[0]:best=(score,start,x.copy(),cv,flux)
 if best is None:raise RuntimeError('No audible stable region in recording')
 return best
manifest=json.loads((OUT/'engine-recordings.json').read_text());records={x['file']:x for x in manifest['assets']};decoded={}
for name,sid,lo,hi,length in CLIPS:
 user,source,url,license=SOURCES[sid];path=TMP/(sid+'.mp3')
 if not path.exists():
  with urllib.request.urlopen(url,timeout=45)as response:path.write_bytes(response.read())
 if sid not in decoded:decoded[sid]=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(path),'-ac','1','-ar','24000','-af','highpass=f=35,lowpass=f=8500','-f','f32le','-']),dtype='<f4').copy()
 score,start,a,cv,flux=steady(decoded[sid],lo,hi,length);a-=a.mean();a=smooth_loop(a,24000,.16);rms=float(np.sqrt(np.mean(a*a)));gain=min(.20/max(1e-6,rms),.72/max(1e-6,float(np.max(np.abs(a)))));a=(a*gain).astype('<f4');target=OUT/('engine-'+name+'.ogg')
 subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar','24000','-ac','1','-i','-','-c:a','libvorbis','-q:a','5',str(target)],input=a.tobytes(),check=True)
 records[target.name]={'file':target.name,'source':f'https://freesound.org/people/{user}/sounds/{sid}/','download':url,'sourceSHA256':sha(path.read_bytes()),'sourceStart':start/24000,'sourceEnd':(start+round(length*24000))/24000,'license':license,'licenseURL':'https://creativecommons.org/licenses/by/4.0/' if license=='CC-BY-4.0' else 'https://creativecommons.org/publicdomain/zero/1.0/','author':user,'recordedSource':source,'processingVersion':VERSION,'processing':'Steady segment selected by RMS and spectral motion; mono 24 kHz; HP 35 Hz / LP 8.5 kHz; DC removal; 160 ms complementary cosine loop join; fixed gain normalization. Edited public HQ preview.','sha256':sha(target.read_bytes()),'duration':len(a)/24000,'normalizationGain':gain,'segmentRmsCV':round(cv,4),'segmentSpectralFlux':round(flux,4)}
 print(name,records[target.name]['sourceStart'],round(cv,3),flush=True)
manifest.update(version=VERSION,assets=list(records.values()));manifest['scope']='Attributed recordings selected by engine architecture and calibrated per vehicle. Exact recorded source is retained for each asset. Related-engine adaptations are not represented as factory recordings of every in-game model.'
(OUT/'engine-recordings.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
credits=OUT/'CREDITS.txt';text=credits.read_text().split('\nEngine architecture revision\n')[0];text+='\nEngine architecture revision\nVersion '+VERSION+'. Sources, authors, licenses and edit bounds: engine-recordings.json.\n'
for sid,(user,model,url,license)in SOURCES.items():text+=f'{user} — {model} — https://freesound.org/people/{user}/sounds/{sid}/ — {license}. Edited public HQ preview, steady crop, filters and loop join.\n'
text+='Cummins ISL recording by chungus43A: CC BY 4.0, https://creativecommons.org/licenses/by/4.0/ . Edited crop, filtering and loop join; no endorsement implied.\n'
text+='Porsche 911 recording by jerry.berumen: CC BY 4.0, https://creativecommons.org/licenses/by/4.0/ . Modified as described in engine-recordings.json; no endorsement implied.\n';credits.write_text(text)
for game in ['kart','boxe','tenis','ar','voo','familia/3d']:
 folder=ROOT/'games'/game/'audio'
 for file in [OUT/'engine-recordings.json',credits]+[OUT/('engine-'+name+'.ogg')for name,*_ in CLIPS]:shutil.copyfile(file,folder/file.name)
print('bank assets',len(records),flush=True)
