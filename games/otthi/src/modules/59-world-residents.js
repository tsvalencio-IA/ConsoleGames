/** Residents use the same physical walkways and interaction places as players. */
// @otthi-module-body
 const worldResidents={ready:false,lastAt:0,actors:[],ticks:0};
 function cityOrderPerformance(shop,item){
  const kind=item.hunger?(/juice|breakfast/.test(item.id)?'drink':'meal'):'bag',coast=shop.id.startsWith('shop-coast-'),face=shop.face||1,target=kind==='bag'?{x:player.x,z:player.z}:coast?{x:shop.x-5.35,z:495.5}:{x:shop.x-4.05,z:shop.z+face*3.9},pose={...target,y:kind==='bag'?player.y:.53,yaw:kind==='bag'?player.facing:-Math.PI/2,sitting:kind!=='bag'},commit=()=>{if(item.hunger){setFlag('ateMeal');state.stats.restaurantMeals=(state.stats.restaurantMeals||0)+1;saveState(true);evaluateMissions();}return true;};
  const seller=cityCoast.citizens.find(n=>n.commerceShop===shop.id);if(seller)seller.servingUntil=performance.now()+2800;
  if(!beginCharacterActivity(kind,{target,pose,shop,commit}))beginCharacterActivity(kind,{target:{x:player.x,z:player.z},pose:{x:player.x,y:player.y,z:player.z,yaw:player.facing},shop,commit});
 }
 function addResident(id,name,stops,color){const p=stops[0],npc=cityCommercialNPC(id,name,p.x,p.z,color);npc.cityLifeManaged=true;npc.routine={index:0,remaining:0,stops};npc.lifeAction=p.action;worldResidents.actors.push(npc);return npc;}
 function ensureWorldResidents(){
  if(worldResidents.ready||!cityCoast.ready)return;
  for(const npc of cityCoast.citizens){npc.cityLifeManaged=true;if(npc.commerceRoute)npc.routine={index:0,remaining:0,stops:npc.commerceRoute.map((p,i)=>({...p,action:i===npc.commerceRoute.length-1?'talk':'walk',duration:i===npc.commerceRoute.length-1?4:0}))};worldResidents.actors.push(npc);}
  for(const[i,x]of[-346,-258].entries()){
   const n=cityCommercialNPC('coast-vendor-'+i,i?'Cecília':'Marcos',x,490.9,[0x3c8b7b,0xaf5744][i],null,'shop-coast-'+i);n.stationaryHeading=Math.PI;n.cityLifeManaged=true;worldResidents.actors.push(n);
   addResident('coast-diner-'+i,['Patrícia','Eduardo'][i],[{x:x-5.35,z:495.5,action:'eat',duration:18,seat:.48,yaw:-Math.PI/2},{x:x-5.35,z:489,action:'walk'},{x:x-10,z:486.5,action:'talk',duration:7},{x:x-7,z:492,action:'walk'}],0xa2764f+i*0x111111);
  }
  for(let i=0;i<6;i++){const x=-397+i*31,z=502+(i%2)*4;addResident('beach-visitor-'+i,['Lara','André','Renata','Felipe','Sofia','Rafael'][i],[{x,z,action:i%2?'stretch':'talk',duration:9+i},{x:x+7,z:z+3,action:'walk'},{x:x+8,z:509,action:'look',duration:10},{x:x-2,z:z+1,action:'walk'}],[0x649ca2,0xc58b55,0x9b7399,0x538469][i%4]);}
  for(let i=0;i<3;i++){const x=-400+i*42;addResident('beach-rest-'+i,['Helena','Caio','Denise'][i],[{x:x+1.25,z:502.4,action:'sit',duration:28,seat:.20,yaw:Math.PI},{x:x+4,z:499,action:'stretch',duration:10}],[0xb27f67,0x708e9a,0x9a829c][i]);}
  for(let i=0;i<2;i++){const x=-375+i*32;addResident('beach-swimmer-'+i,['Julia','Vinícius'][i],[{x,z:522,action:'swim',duration:9,yaw:Math.PI/2},{x:x+10,z:525,action:'swim',duration:9,yaw:-Math.PI/2}],[0x7a90ad,0xc17c69][i]);}
  for(const[i,x,z]of[[0,11,179],[1,27,176],[2,10,-154],[3,37,-154]])addResident('travel-resident-'+i,['Luís','Fernanda','Joana','Henrique'][i],[{x,z,action:'look',duration:9},{x:x+4,z,action:'walk'},{x:x+4,z:z+2,action:'talk',duration:9}],[0x567b99,0xa5685b,0x6d927a,0xa58d51][i]);worldResidents.ready=true;
 }
 function poseResident(npc,action,time,seat){
  const l=npc.limbs,w=Math.sin(time*7.5+npc.phase),walk=action==='walk',swim=action==='swim',sitting=seat!==undefined;npc.lifeAction=action;npc.group.rotation.x=swim?-1.22:0;npc.group.position.y=swim?-.06:sitting?Number(seat)-.82*npc.group.scale.y:groundHeightAt(npc.group.position.x,npc.group.position.z);
  if(l){l.leftLeg.rotation.x=swim?w*.35:sitting?-1.25:walk?-w*.4:0;l.rightLeg.rotation.x=swim?-w*.35:sitting?-1.25:walk?w*.4:0;l.leftArm.rotation.x=swim?-1.5+w*.7:walk?w*.5:action==='stretch'?-2.1+Math.sin(time*2)*.25:action==='eat'?-.45:0;l.rightArm.rotation.x=swim?-1.5-w*.7:walk?-w*.5:action==='eat'?-1.2-Math.sin(time*3)*.35:action==='talk'?-.7-Math.sin(time*4)*.22:action==='serve'?-1:action==='stretch'?-2.1-Math.sin(time*2)*.25:0;}
  if(npc.body)npc.body.position.y=1.28+(walk?Math.abs(w)*.023:Math.sin(time*2)*.006);
  if(!npc.mealProp&&action==='eat'){npc.mealProp=new THREE.Mesh(new THREE.SphereGeometry(.11,8,6),renderMat(0xd3a268));npc.mealProp.scale.y=.50;npc.mealProp.position.set(0,-.66,.07);l.rightArm.add(npc.mealProp);}if(npc.mealProp)npc.mealProp.visible=action==='eat';
 }
 function updateWorldResidents(){
  ensureWorldResidents();if(!worldResidents.ready||paused)return;const now=performance.now(),dt=Math.min(.10,Math.max(0,(now-(worldResidents.lastAt||now))/1000)),time=now/1000,focus=otGamesFocus(),authority=typeof sharedWorldIsAuthority!=='function'||sharedWorldIsAuthority();worldResidents.lastAt=now;worldResidents.ticks++;
  for(const n of worldResidents.actors){if(n.following||n.passengerMode||n.pendingRide||n.coopRaceMode)continue;const distant=Math.hypot(focus.x-n.group.position.x,focus.z-n.group.position.z)>125;let actorDt=dt;if(distant){if(now<Number(n.nextBackgroundLifeAt||0))continue;actorDt=Math.min(1,Math.max(0,(now-Number(n.lastLifeAt||now))/1000));n.nextBackgroundLifeAt=now+1000;}n.lastLifeAt=now;const r=n.routine;if(!r){poseResident(n,now<(n.servingUntil||0)?'serve':'work',time);continue;}const p=r.stops[r.index],dx=p.x-n.group.position.x,dz=p.z-n.group.position.z,d=Math.hypot(dx,dz);let action=p.action||'look',seat;
   if(d>.22){action=p.action==='swim'?'swim':'walk';if(authority&&actorDt){if(action==='swim'){const step=Math.min(d,actorDt*.75);n.group.position.x+=dx/d*step;n.group.position.z+=dz/d*step;n.group.rotation.y=Math.atan2(dx,dz);}else if(Math.hypot(player.x-n.group.position.x,player.z-n.group.position.z)>1.1)v705NpcWalk(n,actorDt,p,1.15);}r.remaining=0;}else{seat=p.seat;if(p.yaw!==undefined)n.group.rotation.y=p.yaw;if(!r.remaining)r.remaining=Number(p.duration)||.15;r.remaining-=actorDt;if(r.remaining<=0){r.index=(r.index+1)%r.stops.length;r.remaining=0;}}if(distant){n.lifeAction=action;n.group.position.y=groundHeightAt(n.group.position.x,n.group.position.z);}else poseResident(n,action,time,seat);
  }
 }
 const residentsPreviousExpansion=updateWorldExpansion;updateWorldExpansion=function(){residentsPreviousExpansion();updateWorldResidents();};
 window.OT_WORLD_RESIDENTS={diagnostics:()=>({ready:worldResidents.ready,total:world.npcs.length,actors:worldResidents.actors.map(n=>({id:n.id,name:n.name,x:n.group.position.x,y:n.group.position.y,z:n.group.position.z,action:n.lifeAction||'work',visible:n.group.visible,stop:n.routine?.index??null}))})};
