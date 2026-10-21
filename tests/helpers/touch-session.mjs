/* Send actual Chromium touch sequences, with independently held finger IDs. */
export async function touchSession(context,page){
 const session=await context.newCDPSession(page),points=new Map();let next=101;
 const send=type=>session.send('Input.dispatchTouchEvent',{type,touchPoints:[...points.values()]});
 return{
  async start(locator,fx=.5,fy=.5){const b=await locator.boundingBox();if(!b)throw new Error('Touch target has no visible box');const id=next++;points.set(id,{id,x:b.x+b.width*fx,y:b.y+b.height*fy,radiusX:3,radiusY:3,force:1});await send('touchStart');return id;},
  async move(id,locator,fx,fy){const b=await locator.boundingBox();points.set(id,{...points.get(id),x:b.x+b.width*fx,y:b.y+b.height*fy});await send('touchMove');},
  async end(id){points.delete(id);await send('touchEnd');},
  async cancel(){points.clear();await send('touchCancel');}
 };
}
