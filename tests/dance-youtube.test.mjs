import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {youtubeVideo,YouTubeDanceMusic} from '../games/otthi/assets/js/controls/dance-youtube.js';
import {dancePose} from './helpers/dance-pose-fixture.mjs';

test('YouTube links accept official video routes and reject impostor domains, playlists and script URLs',()=>{
 const id='M7lc1UVf-VE';
 for(const value of [id,'https://youtu.be/'+id+'?si=share','https://www.youtube.com/watch?v='+id+'&t=20','https://music.youtube.com/watch?v='+id,'https://m.youtube.com/shorts/'+id,'https://youtube.com/live/'+id,'https://www.youtube-nocookie.com/embed/'+id])assert.equal(youtubeVideo(value),id,value);
 for(const value of ['https://youtube.com.evil.example/watch?v='+id,'https://evil.example/'+id,'javascript:alert(1)','https://www.youtube.com/playlist?list=foo','https://user:pass@youtube.com/watch?v='+id,'https://youtube.com/watch?v=short'])assert.equal(youtubeVideo(value),null,value);
});
test('YouTube waits for playback, seeks on resume, mutes without another soundtrack and closes the player',()=>{
 const calls=[],holds=[],host={remove:()=>calls.push('remove')},player={seekTo:(...args)=>calls.push(['seek',...args]),playVideo:()=>calls.push('play'),pauseVideo:()=>calls.push('pause'),mute:()=>calls.push('mute'),unMute:()=>calls.push('unmute'),destroy:()=>calls.push('destroy'),getCurrentTime:()=>12,getDuration:()=>200,getVideoData:()=>({title:'Vídeo escolhido'})};
 const music=new YouTubeDanceMusic({host,id:'M7lc1UVf-VE'});music.player=player;music.ready=true;
 let phase='calibration';music.bind(()=>({phase,time:7,done:false}),value=>holds.push(value));music.offset=5;music.tick();assert(!calls.includes('play'));
 phase='playing';music.tick();assert.deepEqual(calls.at(-2),['seek',12,true]);assert.equal(calls.at(-1),'play');assert.equal(holds.at(-1),true);
 music.state=1;music.tick();assert.equal(holds.at(-1),false);music.state=3;music.tick();assert.equal(holds.at(-1),true);
 phase='lost';music.tick();assert.equal(calls.at(-1),'pause');phase='playing';music.tick();assert.equal(calls.at(-1),'play');
 music.setEnabled(false);assert.equal(calls.at(-1),'mute');assert.equal(music.selection(110,10).duration,190);assert.equal(music.track.title,'Vídeo escolhido');assert.throws(()=>music.selection(120,180),/30 segundos/);
 music.close();music.close();assert.equal(calls.filter(x=>x==='destroy').length,1);assert.equal(calls.at(-1),'remove');
});
test('buffering freezes the actual dance clock and scoring until music resumes',()=>{
 const c=vm.createContext({});vm.runInContext(fs.readFileSync('games/otthi/src/modules/44-world-rhythm.js','utf8')+'\nglobalThis.Dance=WorldDanceBody;',c);
 const chart=new c.Dance();let now=100;for(;now<=5100;now+=100)chart.observe(dancePose(),now);
 assert.equal(chart.phase,'playing');chart.setMusicWaiting(true,now);const frozen=chart.activeMs;
 for(let i=0;i<50;i++){now+=100;chart.observe(dancePose(i%2?'up':'neutral'),now);}
 assert.equal(chart.activeMs,frozen);assert.equal(chart.score,0);assert.equal(chart.misses,0);
 chart.setMusicWaiting(false,now);chart.observe(dancePose(),now+100);assert.equal(chart.activeMs,frozen+100);
});
