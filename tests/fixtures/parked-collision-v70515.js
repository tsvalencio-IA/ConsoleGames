// Golden collision predicate from runtime 043d82ab (705.28.15).
// Kept as fixture data so shallow CI checkouts can compare exact old behavior.
function brazilSpecialFootprint(v){const model=v?.group?.userData?.brazilRoot||v?.userData?.brazilRoot,data=model?.userData;if(!data?.bus&&!data?.articulated)return null;return{front:Number(data.front),rear:Number(data.rear),halfWidth:data.bus?1.03:1.02,trailerAngle:model.getObjectByName('articulated-trailer')?.rotation.y||0};}
function brazilParkedContains(v,x,z,margin=.0){const root=v?.group?.userData?.brazilRoot||v?.userData?.brazilRoot,data=root?.userData,f=brazilSpecialFootprint(v)||(data?{front:data.front,rear:data.rear,halfWidth:data.halfWidth||.76,trailerAngle:0}:null);if(!f)return null;const group=v?.group||v,heading=Number(group.rotation.y||0),dx=x-group.position.x,dz=z-group.position.z,lx=dx*Math.cos(heading)-dz*Math.sin(heading),lz=dx*Math.sin(heading)+dz*Math.cos(heading);if(!Number.isFinite(lx)||!Number.isFinite(lz))return false;
  if(!f.trailerAngle)return Math.abs(lx)<f.halfWidth+margin&&lz<f.front+margin&&lz>f.rear-margin;
  if(Math.abs(lx)<1.02+margin&&lz<1.64+margin&&lz>-2.3-margin)return true;const tz=lz+1.50,a=f.trailerAngle,tx=lx*Math.cos(a)-tz*Math.sin(a),zz=lx*Math.sin(a)+tz*Math.cos(a);return Math.abs(tx)<1.02+margin&&zz<.6+margin&&zz>-7.75-margin;
}
