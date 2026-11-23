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
 assert.match(npc,/const rioModernNpc=\/\^\(porteiro-\|rio-\|regional-\)\//);
 assert.match(npc,/npc\.visualStyle='rio-human'/);
 assert.match(npc,/else if\(id!=='michelle-ottovias'&&!OT_CHILD_WORLD\)applyNpcToyTheme/);
 assert.match(npc,/createNPC\(id,name,x,z,color,pathRadius=3\)/);
});
