import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync('games/otthi/src/modules/95-rio-open-buildings.js','utf8');
const npc=readFileSync('games/otthi/src/modules/13-houses-npcs-vehicles-base.js','utf8');

test('residential pool belongs to exterior shared leisure instead of the furnished room',()=>{
 const start=src.indexOf('function rioBuildResidence(site,room){');
 const end=src.indexOf('\n  function rioBuildBakeryService',start);
 assert(start>0&&end>start);
 const body=src.slice(start,end);
 const poolStart=body.indexOf('// Outdoor leisure: independent from the apartment');
 const poolEnd=body.indexOf('if(condominium){\n      // Apartment towers',poolStart);
 assert(poolStart>0&&poolEnd>poolStart);
 const pool=body.slice(poolStart,poolEnd);
 assert.match(pool,/const exterior=new THREE\.Group\(\)/);
 assert.match(pool,/\(room\.root\.parent\|\|worldGroup\)\.add\(exterior\)/);
 assert.match(pool,/rioCreateBatch\(exterior\)/);
 assert.match(pool,/outdoor\.box\(px/);
 assert.doesNotMatch(pool,/room\.box\(px/);
 assert.match(pool,/label:condominium\?'Usar piscina da área comum do condomínio'/);
 assert.match(pool,/room\.isOutdoorLeisurePoint/);
 assert.match(pool,/room\.isOutdoorLeisurePoint\(player\.x,player\.z\)/);
 assert.match(pool,/beginCharacterActivity\('rio-pool'/);
});

test('modern Rio Preto NPCs keep human proportions while classic toy-themed NPC identities remain intact',()=>{
 assert.match(npc,/const rioModernNpc=!otToyHeroes\.has\(id\)/);
 assert.match(npc,/porteiro-\|rio-\|regional-/);
 assert.match(npc,/otToyHeroes=new Set/);
 assert.match(npc,/npc\.visualStyle='rio-human'/);
 assert.match(npc,/else if\(id!=='michelle-ottovias'&&!OT_CHILD_WORLD\)applyNpcToyTheme/);
 assert.match(npc,/createNPC\(id,name,x,z,color,pathRadius=3\)/);
});


test('shopping stores include real visible in-world 3D clerks, not just art references',()=>{
  assert.match(src,/const clerk=createNPC\('rio-mall-staff-'/);
  assert.match(src,/clerk\.stationary=true;clerk\.cityLifeManaged=true/);
  assert.match(src,/room\.root\.add\(clerk\.group\)/);
  assert.match(src,/room\.npcs\.push\(clerk\)/);
  assert.match(src,/room\.action\('store-'\+slot/,'native store actions and purchases are preserved');
});

test('character selection is directly accessible in pause menu and saves existing avatar variants',()=>{
 const fs=readFileSync('games/otthi/src/modules/30-pause-tests-public-api-bootstrap.js','utf8');
 const avatar=readFileSync('games/otthi/src/modules/34-avatar-studio-professional-v3.js','utf8');
 assert.match(fs,/data-avatar-pause/);
 assert.match(fs,/\$\('\[data-avatar-pause\]',root\)\.onclick=.*openAvatarStudio\(\)/);
 assert.match(avatar,/worldAvatarOptions\('bodyStyle','Quem você quer controlar\?'\)/);
 assert.match(avatar,/data-world-avatar-save/);
 assert.match(avatar,/saveState\(true\)/);
});
