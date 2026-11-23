import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import vm from 'node:vm';

const source=readFileSync('games/otthi/src/modules/84-rio-v51-world.js','utf8');
function setup(){
  const save={properties:{'regional-casa-damha':{owned:true}},constructionOrders:[],constructionInventory:{}};
  const state={profile:{coins:500}};
  const world={interactables:[]};
  const model={save,state,world,modal:null,buttons:[]};
  const registered=[];
  const mockRoot={
    querySelectorAll(selector){
      if(selector==='[data-rio-construction-buy]')return model.buttons=Object.keys(model.stock||{}).map(id=>({
        dataset:{rioConstructionBuy:id},disabled:false,onclick:null
      }));
      if(selector==='[data-rio-deliver-house]')return model.buttons=[{dataset:{rioDeliverHouse:'regional-casa-damha'},disabled:false,onclick:null}];
      return [];
    },
    querySelector(selector){const b={onclick:null};model.single[selector]=b;return b;}
  };
  model.single={};
  const ctx=vm.createContext({
    console,Date,Math,Map,Set,performance:{now:()=>0},window:{},
    RIO_V51:{places:[],sectors:{}},
    updateWorldExpansion:()=>{},expansionMapLocations:()=>[],
    worldExploreDirectoryHtml:()=>'',worldExploreBindDirectory:()=>{},
    world,running:true,paused:false,player:{vehicle:null,boating:false},state,
    compactRio:{sites:[{key:'casa-damha',id:'regional-casa-damha',name:'Casa Damha',kind:'residence',propertyId:'regional-casa-damha',entry:[10,20]}]},
    rioMapSave:()=>save,rioPropertyTitle:id=>save.properties[id],
    registerInteractable:item=>{registered.push(item);world.interactables.push(item);return item;},
    openModal:(title,html,callback)=>{model.modal={title,html};model.single={};callback?.(mockRoot);},
    closeModal:()=>{},toast:()=>{},saveState:()=>{},addCoins:n=>{state.profile.coins+=n;},
    escapeHtml:v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;')
  });
  vm.runInContext(source,ctx);
  return {ctx,model,registered};
}

test('construction shops carry distinct materials and tools with nonzero prices',()=>{
  const {ctx}=setup();
  const result=JSON.parse(vm.runInContext('JSON.stringify(RIO_CONSTRUCTION_CATALOG)',ctx));
  assert(result.materials.length>=10);
  assert(result.tools.length>=6);
  for(const list of Object.values(result))for(const item of list){
    assert(item.id&&item.label&&item.unit&&Number.isSafeInteger(item.price)&&item.price>0);
  }
  assert.equal(new Set(Object.values(result).flat().map(x=>x.id)).size,result.materials.length+result.tools.length);
});

test('buy materials, specify a real owned address, receive after transit and preserve receipts',()=>{
  const {ctx,model,registered}=setup();
  model.stock={cement:true,brick:true};
  vm.runInContext("rioOpenRegionalConstructionStore({id:'regional-planalto_materiais',name:'Planalto Materiais',shop:'materials'})",ctx);
  assert.match(model.modal.html,/Escolha o produto/);
  const purchase=model.buttons.find(b=>b.dataset.rioConstructionBuy==='cement');
  assert(purchase?.onclick);
  purchase.onclick();
  assert.match(model.modal.html,/Escolha qual imóvel/);
  const home=model.buttons[0];
  assert(home.onclick);
  home.onclick();
  assert.equal(model.state.profile.coins,458);
  assert.equal(model.save.constructionOrders.length,1);
  const order=model.save.constructionOrders[0];
  assert.equal(order.destinationId,'regional-casa-damha');
  assert.equal(order.productId,'cement');
  assert.equal(order.status,'en-route');
  assert.equal(model.save.constructionInventory.cement,undefined);
  const receiver=registered.find(x=>x.id==='rio-construction-receive-regional-casa-damha');
  assert(receiver);
  order.readyAt=Date.now()-1000;
  assert(receiver.available());
  receiver.action();
  assert.match(model.modal.html,/Confirme o recebimento/);
  model.single['[data-rio-construction-receive]'].onclick();
  assert.equal(order.status,'delivered');
  assert.equal(model.save.constructionInventory.cement,1);
  assert.equal(receiver.available(),false);
  assert.equal(model.state.profile.coins,458);
  assert.equal(model.save.properties['regional-casa-damha'].owned,true);
});

test('delivery pickup survives a re-created World with retained save data',()=>{
  const {ctx,model,registered}=setup();
  vm.runInContext('rioRegisterHomeDelivery(compactRio.sites[0])',ctx);
  assert.equal(registered.length,1);
  model.world.interactables.length=0;
  vm.runInContext('rioRegisterHomeDelivery(compactRio.sites[0])',ctx);
  assert.equal(registered.length,2);
});
