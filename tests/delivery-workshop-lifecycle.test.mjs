import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = name => fs.readFileSync('games/otthi/src/modules/' + name, 'utf8');
const serviceSource = read('74-workshop-npc-service.js');
function extract(source, name) {
  const start = source.search(new RegExp(' (?:async )?function ' + name + '\\('));
  assert(start >= 0, name);
  let end = source.indexOf('){', start) + 2, depth = 1;
  for (; depth; end++) {
    if (source[end] === '{') depth++;
    if (source[end] === '}') depth--;
  }
  return source.slice(start, end);
}

test('a collected NPC that returns for another service blocks the delivery driver again', () => {
  const car = {id: 'npc', group: {}, trafficActorId: 'road'}, claims = {}, player = {};
  const record = {serviceOpenedAt: 100, npcCollectedAt: 200, serviceStatus: 'delivered'};
  const state = {vehicles: {owned: [], workshopComponents: {npc: record}}};
  const context = vm.createContext({
    state, world: {vehicles: [car]}, player, remotePresence: new Map(),
    groundHeightAt: () => 0,
    trafficBody: v => ({id: v.id}), trafficBodiesOverlap: () => true,
    phoneVehicleProbes: () => [], nearbyTrafficActors: () => [],
    workshopIsCurrentUserVehicle: v => state.vehicles.owned.includes(v.id),
    trafficLocalClaims: () => claims
  });
  vm.runInContext(extract(serviceSource, 'workshopNpcWasCollected'), context);
  vm.runInContext(extract(read('73-world-phone-dispatch.js'), 'phoneVehiclePoseClear'), context);
  assert.equal(context.phoneVehiclePoseClear({id: 'van'}, 0, 0, 0), true,
    'the old, collected representation does not obstruct the route');
  Object.assign(record, {serviceOpenedAt: 300, serviceStatus: 'pending'});
  assert.equal(context.phoneVehiclePoseClear({id: 'van'}, 0, 0, 0), false,
    'a new service must restore the physical obstacle despite its previous collection timestamp');
  Object.assign(record, {serviceOpenedAt: 100, serviceStatus: 'delivered'});
  state.vehicles.owned.push('npc');
  assert.equal(context.phoneVehiclePoseClear({id: 'van'}, 0, 0, 0), false,
    'a vehicle now owned by the player remains a physical obstacle');
  state.vehicles.owned.length = 0;
  claims.road = {uid: 'me'};
  assert.equal(context.phoneVehiclePoseClear({id: 'van'}, 0, 0, 0), false,
    'a returned traffic car claimed again must block the driver');
  delete claims.road;
  Object.assign(player, {vehicle: true, car: {id: 'npc'}});
  assert.equal(context.phoneVehiclePoseClear({id: 'van'}, 0, 0, 0), false,
    'the vehicle currently driven by the player remains a physical obstacle');
});
