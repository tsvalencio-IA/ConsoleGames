import test from'node:test';import assert from'node:assert/strict';import{engine}from'./helpers/game-fixture.mjs';
const fresh=settings=>{const f=engine('ar','game_ar',settings);f.game.init({id:'patrol'});f.game.covers=[];f.game.waveDelay=999;return f;};
test('WAR sprint requires forward movement and stops for ADS, crouch, firing and release',()=>{const{game:g}=fresh();g.manualStick={x:0,y:1,active:true};g.sprintHeld=true;g.step(.1);assert(g.sprinting);assert(Math.abs(g.player.z-.9)<1e-8);g.setAiming(true);g.step(.1);assert(!g.sprinting);g.setAiming(false);g.crouched=true;g.step(.1);assert(!g.sprinting);g.crouched=false;g.fireHeld=true;g.step(.1);assert(!g.sprinting);g.release();assert(!g.sprintHeld&&!g.sprinting);});
test('WAR auto fire: immediately fires on aligned visible target, even for a single render frame; stops on loss, cover and allies',()=>{
 const{game:g}=fresh({combatFireMode:'simple'}),target={id:'test',kind:'soldier',x:0,z:20,y:1.8,hp:500,active:true,aim:999};
 g.enemies=[target];g.player.yaw=-.14;g.step(.016);assert.equal(g.stats.shots,0);
 // Emulate a quick right-thumb swipe crossing the target: no 140ms dwell.
 g.lookBy(30,0,390,844);g.step(.016);assert.equal(g.stats.shots,1,'the first valid crossing must fire');assert.equal(g.stats.hits,1);
 g.step(.016);assert.equal(g.stats.shots,1,'weapon cooldown must still apply');
 g.player.yaw=.7;g.step(.5);assert.equal(g.stats.shots,1);
 g.player.yaw=0;g.covers=[{x:0,z:10,w:4,d:2,h:4}];g.step(.5);assert.equal(g.stats.shots,1);
 g.covers=[];target.ally=true;g.step(.5);assert.equal(g.stats.shots,1);
});
test('WAR auto-fire is optional; manual mode still requires FIRE and never bypasses magazine limits',()=>{
 const{game:g}=fresh({combatFireMode:'manual'}),target={id:'test',kind:'soldier',x:0,z:20,y:1.8,hp:1000,active:true,aim:999};
 g.enemies=[target];g.step(.3);assert.equal(g.stats.shots,0);
 g.fireHeld=true;g.step(.016);assert.equal(g.stats.shots,1);g.fireHeld=false;
 g.ammo=0;g.reloadTime=1;g.step(.3);assert.equal(g.stats.shots,1);
});
test('WAR precision assist slows an aligned ADS swipe without moving the camera by itself',()=>{const{game:g}=fresh({combatAimAssist:true,adsSensitivity:.8});g.enemies=[{id:'test',kind:'soldier',x:0,z:20,y:1.8,hp:100,active:true,aim:999}];g.setAiming(true);g.lookBy(10,0,390,844);const assisted=g.player.yaw;g.player.yaw=.5;g.lookBy(10,0,390,844);const clear=g.player.yaw-.5;assert(Math.abs(assisted/clear-.55)<1e-8);const before=g.player.yaw;g.step(.1);assert.equal(g.player.yaw,before);});

test('WAR: a tap entirely between simulation ticks produces one shot and holding retains the weapon rate',()=>{
 const{game:g}=fresh({combatFireMode:'manual'});
 g.requestFire();g.releaseFire();assert(!g.fireHeld);g.step(.016);assert.equal(g.stats.shots,1);assert.equal(g.ammo,g.gun.mag-1);
 for(let i=0;i<30;i++)g.step(.016);assert.equal(g.stats.shots,1,'a released tap must not become a held burst');
 g.requestFire();g.step(.016);assert.equal(g.stats.shots,2);g.step(.016);assert.equal(g.stats.shots,2,'held fire must respect weapon cooldown');
 for(let i=0;i<30;i++)g.step(.016);assert(g.stats.shots>2);g.releaseFire();const stopped=g.stats.shots;g.step(.4);assert.equal(g.stats.shots,stopped);
});
test('WAR: rapid taps cannot bypass reload or cooldown and never remain queued for a later surprise shot',()=>{
 const{game:g}=fresh({combatFireMode:'manual'});g.requestFire();g.releaseFire();g.step(.016);
 for(let i=0;i<5;i++){g.requestFire();g.releaseFire();}g.step(.016);assert.equal(g.stats.shots,1);g.step(.5);assert.equal(g.stats.shots,1);
 g.reloadTime=.2;g.requestFire();g.releaseFire();g.step(.016);g.step(.3);assert.equal(g.stats.shots,1);
});
test('WAR: canceled input, pause, match end and camera mode cannot leave a manual shot pending',()=>{
 const{game:g,window:w}=fresh();g.requestFire();g.releaseFire(true);g.step(.016);assert.equal(g.stats.shots,0);
 g.requestFire();g.release();g.step(.016);assert.equal(g.stats.shots,0);
 w.System.paused=true;assert.equal(g.requestFire(),false);w.System.paused=false;g.step(.016);assert.equal(g.stats.shots,0);
 g.handSession={};assert.equal(g.requestFire(),false);g.handSession=null;
 g.requestFire();g.finish(true);assert(!g.firePressed&&!g.fireHeld);assert.equal(g.requestFire(),false);
});
test('WAR: a short Space press uses the same single-shot path and pause cannot retain keyboard fire',()=>{
 const{game:g,window:w}=fresh();const event={key:' ',preventDefault(){},repeat:false};g.keyDown(event);g.keyUp(event);g.step(.016);assert.equal(g.stats.shots,1);
 g.step(.5);assert.equal(g.stats.shots,1);w.System.paused=true;g.keyDown(event);w.System.paused=false;g.step(.016);assert.equal(g.stats.shots,1);
 g.requestFire();g.keyDown(event);g.keyUp(event);assert(g.fireHeld,'releasing Space cannot release a held touch');g.releaseFire();
});
