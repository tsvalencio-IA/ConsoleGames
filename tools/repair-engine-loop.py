"""Repair repeated seams in the existing attributed recording, without downloads."""
from pathlib import Path
import hashlib, json, shutil, subprocess
import numpy as np
from audio_loop import smooth_loop
ROOT = Path(__file__).resolve().parents[1]
directory = ROOT / 'games/otthi/audio'
path = directory / 'engine-car.ogg'
metadata = json.loads((directory / 'sources.json').read_text())
record = next(a for a in metadata['assets'] if a['file'] == path.name)
revision = '20261027-continuous2'
if record.get('repair', {}).get('revision') != revision:
    original_hash = hashlib.sha256(path.read_bytes()).hexdigest()
    samples = np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(path),'-ac','1','-ar','24000','-f','f32le','-']), dtype='<f4').copy()
    start, boundary, overlap = 960, len(samples)//4-960, 1920
    head = samples[start:start+overlap].astype(np.float64)
    end = min(range(start+12000,boundary,12), key=lambda e: float(np.mean((samples[e-overlap:e].astype(np.float64)-head)**2)))
    loop = smooth_loop(samples[start:end], seconds=overlap/24000)
    loop -= loop.mean();loop *= .72/max(.001,float(np.max(np.abs(loop))))
    audio = np.tile(loop,max(4,round(3/(len(loop)/24000))))
    temporary = path.with_suffix('.repair.ogg')
    subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar','24000','-ac','1','-i','-','-c:a','libvorbis','-q:a','5',str(temporary)], input=audio.astype('<f4').tobytes(), check=True)
    temporary.replace(path)
    record.update(duration=len(audio)/24000,sha256=hashlib.sha256(path.read_bytes()).hexdigest())
    record['repair']={'revision':revision,'inputSHA256':original_hash,'selectedStart':start/24000,'selectedEnd':end/24000,'crossfadeSeconds':overlap/24000,'method':'Uninterrupted original region, phase-matched overlap; no loop fade to silence.'}
    metadata['version']=revision
    metadata['processing']+=' Car: repeated discontinuous seams repaired from shipped recording; continuous overlap and playback gain envelopes.'
    (directory/'sources.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n')
assert hashlib.sha256(path.read_bytes()).hexdigest()==record['sha256']
for folder in ['kart','boxe','tenis','ar','voo','familia/3d']:
    for filename in ['engine-car.ogg','sources.json']:shutil.copyfile(directory/filename,ROOT/'games'/folder/'audio'/filename)
print(json.dumps({'revision':revision,'sha256':record['sha256'],'copies':7}))
