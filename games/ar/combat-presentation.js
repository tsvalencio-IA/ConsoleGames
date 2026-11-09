/* WAR presentation. All positions, damage, ammunition and controls remain in the simulation. */
(()=>{'use strict';
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function motion(game){
  const last=game.weaponMotion||{at:game.elapsed,yaw:game.player.yaw,pitch:game.player.pitch,x:0,y:0},dt=clamp(game.elapsed-last.at,0,.1),blend=1-Math.exp(-14*dt);
  const yaw=Math.atan2(Math.sin(game.player.yaw-last.yaw),Math.cos(game.player.yaw-last.yaw));
  last.x+=(clamp(-yaw*.65,-.035,.035)-last.x)*blend;last.y+=(clamp((game.player.pitch-last.pitch)*.5,-.025,.025)-last.y)*blend;
  last.at=game.elapsed;last.yaw=game.player.yaw;last.pitch=game.player.pitch;game.weaponMotion=last;
  const walking=game.autoWalking&&!game.aiming,bob=walking?Math.sin(game.elapsed*(game.sprinting?13:9)):0,kick=clamp((game.weaponKick||0),0,1),reload=game.reloadTime>0?1-game.reloadTime/game.gun.reload:0;
  const lower=reload?Math.sin(Math.PI*clamp(reload/.9,0,1)):0;
  return{x:last.x+bob*(game.sprinting?.009:.004),y:last.y+Math.abs(bob)*.006,kick,lower,reload};
 }
 function weapon2D(ctx,w,h,game){
  const m=motion(game),id=game.gun?.id||'rifle',ads=game.aiming,s=Math.min(w,h)*(ads?.45:.39),sight=id==='marksman'?.92:.89,x=ads?w*.5+(id==='marksman'?.005:.037)*s:w*.5+Math.min(w,h)*.31,y=ads?h*.48+sight*s:h*1.06;
  ctx.save();ctx.translate(x+m.x*s,y+m.lower*s*.34-m.kick*s*.025);ctx.rotate((ads?0:-.26)+m.lower*.38-m.kick*.035);ctx.scale(s,s);
  const path=(points,fill,stroke)=>{ctx.beginPath();for(let i=0;i<points.length;i++)i?ctx.lineTo(...points[i]):ctx.moveTo(...points[i]);ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=.008;ctx.stroke();}};
  const metal=ctx.createLinearGradient(-.2,0,.15,-1.25);metal.addColorStop(0,'#11191b');metal.addColorStop(.38,'#354044');metal.addColorStop(.6,'#687072');metal.addColorStop(.68,'#242c2f');metal.addColorStop(1,'#0e1417');
  const glove=ctx.createLinearGradient(-.8,0,.1,-.45);glove.addColorStop(0,'#29312c');glove.addColorStop(.6,'#5f6656');glove.addColorStop(1,'#3e483d');
  const fore=id==='smg'?-1.05:-1.27,barrel=id==='smg'?-1.19:id==='marksman'?-1.60:-1.43;
  // Perspective faces keep the receiver broad nearby and shorten the exposed barrel.
  path([[-.92,.22],[-.68,-.18],[-.43,-.57],[-.18,-.80],[-.07,-.73],[-.15,-.55],[-.32,-.38],[-.49,.22]],glove,'#1e2925');
  path([[.86,.22],[.58,-.15],[.27,-.37],[.16,-.28],[.31,.22]],glove,'#1c2824');
  path([[-.20,.22],[-.25,-.36],[-.19,-.69],[-.095,-.79],[.075,-.74],[.22,-.39],[.35,.22]],metal,'#525f5c');
  path([[-.19,-.69],[-.15,-.85],[-.09,fore],[.025,fore],[.105,-.80],[.075,-.74]],'#3a4546','#697976');
  path([[.025,fore],[.075,fore+.05],[.16,-.79],[.22,-.39],[.075,-.74]],'#192328','#465653');
  path([[-.09,fore],[-.075,fore-.035],[.02,fore-.035],[.025,fore]],'#7c8780','#293633');
  path([[-.048,fore],[-.039,barrel],[-.006,barrel-.018],[.024,barrel],[.028,fore]],'#172125','#758079');
  path([[-.055,barrel+.085],[-.058,barrel+.018],[.037,barrel+.018],[.04,barrel+.085]],'#242f32','#7f8880');
  for(let i=0;i<9;i++){const t=i/9,yy=-.80+(fore+.045+.80)*t,ww=.085-.04*t;path([[-ww,yy],[-ww-.008,yy-.015],[ww*.7,yy-.015],[ww*.7+.012,yy]],'#10191b','#4e605a');}
  path([[-.16,-.70],[-.19,-.81],[.065,-.81],[.105,-.72]],'#182226','#71817b');
  ctx.fillStyle='#99a296';ctx.fillRect(-.115,-.69,.16,.012);ctx.fillStyle='#10191d';ctx.fillRect(-.13,-.59,.13,.045);ctx.fillRect(.09,-.50,.04,.075);
  for(let i=0;i<4;i++){const yy=-.28+i*.075;path([[.18,yy],[.23,yy+.03],[.27,yy+.07],[.205,yy+.04]],'#111b1d','#47544c');}
  path([[-.24,-.35],[-.33,-.39],[-.36,-.51],[-.25,-.65],[-.17,-.73],[-.11,-.67],[-.17,-.53],[-.21,-.48]],glove,'#28352d');
  for(let i=0;i<4;i++){const yy=-.64+i*.043;path([[-.20,yy],[-.13,yy-.012],[-.08,yy+.012],[-.10,yy+.038],[-.19,yy+.038]],'#505e4f','#2a382e');}
  ctx.strokeStyle='#87917b';ctx.lineWidth=.004;ctx.beginPath();ctx.moveTo(-.59,-.05);ctx.lineTo(-.37,-.37);ctx.stroke();
  if(id==='marksman'){
   const scope=ctx.createLinearGradient(-.17,-.87,.13,-.86);scope.addColorStop(0,'#142329');scope.addColorStop(.45,'#58727c');scope.addColorStop(.65,'#243b46');scope.addColorStop(1,'#0a151c');
   ctx.fillStyle=scope;ctx.beginPath();ctx.ellipse(-.005,-.92,.16,.105,0,0,Math.PI*2);ctx.ellipse(-.005,-.92,.125,.073,0,0,Math.PI*2);ctx.fill('evenodd');ctx.fillStyle='rgba(83,132,143,.13)';ctx.beginPath();ctx.ellipse(-.005,-.92,.125,.073,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#19252a';ctx.fillRect(-.12,-.823,.23,.025);
  }else{ctx.beginPath();ctx.moveTo(-.12,-.81);ctx.lineTo(-.13,-.96);ctx.lineTo(.045,-.96);ctx.lineTo(.07,-.81);ctx.closePath();ctx.rect(-.097,-.936,.12,.092);ctx.fillStyle='#11191d';ctx.fill('evenodd');ctx.fillStyle='rgba(85,140,147,.16)';ctx.fillRect(-.097,-.936,.12,.092);ctx.strokeStyle='#9bafa8';ctx.lineWidth=.004;ctx.strokeRect(-.097,-.936,.12,.092);ctx.fillStyle='#bc5144';ctx.beginPath();ctx.arc(-.037,-.89,.006,0,Math.PI*2);ctx.fill();ctx.fillStyle='#191e20';ctx.fillRect(-.105,-.824,.13,.018);}
  ctx.strokeStyle='#8c927b';ctx.lineWidth=.006;for(const side of[-1,1]){ctx.beginPath();ctx.moveTo(side*.21,-.21);ctx.lineTo(side*.38,-.32);ctx.stroke();}
  if(game.muzzle>0){ctx.globalAlpha=Math.min(1,game.muzzle/.04);path([[-.06,barrel],[ -.16,barrel-.15],[-.025,barrel-.1],[0,barrel-.32],[.045,barrel-.1],[.18,barrel-.16],[.05,barrel]],'#ffe7b0');ctx.globalAlpha=1;}
  ctx.restore();
 }
 function soldierFaces(face,e,game){
  const yaw=Math.atan2(game.player.x-e.x,game.player.z-e.z),cy=Math.cos(yaw),sy=Math.sin(yaw),time=game.elapsed,walk=e.moving?Math.sin(e.stride||time*7)*.12:0,duck=e.crouched?.33:0,fall=e.active?0:clamp((time-e.defeatedAt)/.7,0,1);
  const point=(x,y,z)=>{if(fall){const a=fall*1.45;[x,y]=[x*Math.cos(a)+(y-.1)*Math.sin(a),.1-x*Math.sin(a)+(y-.1)*Math.cos(a)];}return[e.x+x*cy+z*sy,y,e.z-x*sy+z*cy];};
  const prism=(a,b,r1,r2,color)=>{const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],length=Math.hypot(dx,dy,dz)||1,u=Math.abs(dy/length)>.8?[1,0,0]:[0,1,0],vx=dy*u[2]-dz*u[1],vy=dz*u[0]-dx*u[2],vz=dx*u[1]-dy*u[0],vl=Math.hypot(vx,vy,vz)||1,v=[vx/vl,vy/vl,vz/vl],ww=[(dy*v[2]-dz*v[1])/length,(dz*v[0]-dx*v[2])/length,(dx*v[1]-dy*v[0])/length],rings=[a,b].map((p,k)=>Array.from({length:6},(_,i)=>p.map((n,j)=>n+(v[j]*Math.cos(i*Math.PI/3)+ww[j]*Math.sin(i*Math.PI/3))*(k?r2:r1))));
   face(rings[1].map(p=>point(...p)),color);for(let i=0;i<6;i++)face([rings[0][i],rings[0][(i+1)%6],rings[1][(i+1)%6],rings[1][i]].map(p=>point(...p)),['#303d38',color,color,'#3a4840',color,'#293630'][i]);
  };
  for(const side of[-1,1]){const x=side*.16,knee=[x,.55-duck*.4,side*walk+.06],ankle=[x,.12,-side*walk];prism([x,1-duck,0],knee,.145,.12,'#55604e');prism(knee,ankle,.115,.09,'#64705a');prism([x,.105,-.1-side*walk],[x,.105,.23-side*walk],.115,.12,'#27302b');}
  prism([0,1-duck,0],[0,1.63-duck,0],.29,.34,'#52604d');prism([0,1.12-duck,.14],[0,1.57-duck,.14],.235,.24,'#3b483a');
  prism([0,1.63-duck,0],[0,1.95-duck,0],.145,.17,'#8c8268');prism([0,1.91-duck,0],[0,2.12-duck,0],.215,.19,'#3b4838');
  prism([-.15,1.9-duck,.16],[.15,1.9-duck,.16],.045,.045,'#273733');
  for(const side of[-1,1]){const shoulder=[side*.38,1.56-duck,0],elbow=[side*.39,1.25-duck,.14],hand=[side<0?-.07:.16,1.35-duck,side<0?.7:.44];prism(shoulder,elbow,.13,.11,'#69735c');prism(elbow,hand,.105,.075,'#56634f');prism(hand,[hand[0],hand[1],hand[2]+.12],.075,.08,'#2b352e');}
  prism([.13,1.36-duck,.18],[.13,1.36-duck,1],.055,.033,'#252d2f');prism([.13,1.31-duck,.4],[.16,1.11-duck,.39],.055,.045,'#252d2f');
 }
 window.WarPresentation=Object.freeze({motion,weapon2D,soldierFaces,version:'20261109-tactical4'});
})();
