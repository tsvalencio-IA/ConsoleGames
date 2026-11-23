import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Execute the same door handler used by the built game, without rendering
// the entire map; preserve the original condominium ownership key.
const src=readFileSync('games/otthi/src/modules/95-rio-open-buildings.js','utf8');
const begin=src.indexOf('  function rioResidenceDoor(site,room,target){');
const end=src.indexOf('\n  function rioBuildResidence(site,room){',begin);
assert(begin>=0&&end>begin,'Apartment door function must remain in the native game');

function fixture(siteStyle='rios-ditalia'){
  const saved={};
  const records=[],dialogs=[];
  const room={root:{visible:true},gate:{disabled:false},door:{visible:true},
    refreshDecor(){},manageFurniture(){}};
  const site={id:'regional-rios_candelaro',key:'rios_candelaro',
    propertyId:'regional-rios_candelaro',style:siteStyle,name:'Rio Candelaro',
    price:600,entry:[10,20]};
  const context=vm.createContext({
    room,site,saved,Math,document:{},window:{},setFlag(){},
    rioPlayerAt:()=>true,
    rioPropertyTitle:id=>saved[id]||null,
    rioEnterPlace:()=>true,
    rioPropertyDoor:args=>{records.push(args);return true;},
    openModal:(title,html,bind)=>{
      const buttons=[...html.matchAll(/data-rio-apartment="(\d+)"/g)].map(m=>({dataset:{rioApartment:m[1]},onclick:null}));
      const dialog={title,html,buttons};dialogs.push(dialog);
      bind({querySelectorAll:()=>buttons});return true;
    }
  });
  vm.runInContext(src.slice(begin,end),context);
  return {context,room,site,saved,records,dialogs};
}

test('six condominium apartments have six stable independently purchasable IDs',()=>{
  const f=fixture();
  vm.runInContext('rioResidenceDoor(site,room,{x:10,z:20})',f.context);
  assert.equal(f.dialogs.length,1);
  const buttons=f.dialogs[0].buttons;
  assert.deepEqual(buttons.map(b=>b.dataset.rioApartment),['101','102','201','202','301','302']);
  for(const button of buttons)button.onclick();
  assert.equal(f.records.length,6);
  const ids=f.records.map(r=>r.id);
  assert.equal(new Set(ids).size,6);
  assert.equal(ids[0],f.site.propertyId,'legacy ownership of the existing first unit is preserved');
  assert.deepEqual(ids.slice(1),['102','201','202','301','302'].map(n=>f.site.propertyId+'-unit-'+n));
  for(const record of f.records){
    assert.equal(typeof record.enter,'function');
    assert.equal(typeof record.decorate,'function');
    assert(record.price>0);
  }
});

test('unit selection follows independent saved ownership without mixing furnishings',()=>{
  const f=fixture();f.saved[f.site.propertyId]={owned:true,furniture:['sofa-modular']};
  const other=f.site.propertyId+'-unit-202';
  f.saved[other]={owned:true,furniture:['tv-premium'],decorLayout:{'tv-premium':{x:1,z:2,rotation:1}}};
  vm.runInContext('rioResidenceDoor(site,room,{x:10,z:20})',f.context);
  const buttons=f.dialogs[0].buttons;
  buttons[0].onclick();
  assert.equal(f.room.selectedUnitId,f.site.propertyId);
  assert.equal(f.saved[f.room.selectedUnitId].furniture[0],'sofa-modular');
  buttons[3].onclick();
  assert.equal(f.room.selectedUnitId,other);
  assert.equal(f.saved[f.room.selectedUnitId].furniture[0],'tv-premium');
  assert.equal(f.saved[f.site.propertyId].furniture[0],'sofa-modular');
});

test('older single-family residences still open their original property directly',()=>{
  const f=fixture('damha');
  vm.runInContext('rioResidenceDoor(site,room,{x:10,z:20})',f.context);
  assert.equal(f.dialogs.length,0);
  assert.equal(f.records.length,1);
  assert.equal(f.records[0].id,f.site.propertyId);
});
