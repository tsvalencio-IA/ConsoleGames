/* Two explicitly registered views of one toy. No automatic recapture. */
(()=>{'use strict';
class ObjectViews{
 constructor(Tracker=globalThis.WarObjectTracker){this.Tracker=Tracker;this.primary=new Tracker();this.reference=null;this.active=this.primary;this.output=null;this.probes=0;this.confirmations=0;}
 initialize(pixels,w,h,roi,referenceTemplate){
  const primary=new this.Tracker(),result=primary.initialize(pixels,w,h,roi);let reference=null;
  if(referenceTemplate){reference=new this.Tracker();reference.importTemplate(referenceTemplate);}
  this.primary=primary;this.reference=reference;this.active=primary;this.output=result;this.probes=this.confirmations=0;return result;
 }
 importTemplate(template){
  const views=template?.referenceViews;if(views!==undefined&&(!Array.isArray(views)||views.length>1))throw Error('Cadastro com vistas inválidas. Capture novamente.');
  const primary=new this.Tracker();primary.importTemplate(template);let reference=null;
  if(views?.length){reference=new this.Tracker();reference.importTemplate(views[0]);}
  this.primary=primary;this.reference=reference;this.active=primary;this.output=null;this.probes=this.confirmations=0;
 }
 exportTemplate(){const template=this.primary.exportTemplate();if(!template)return null;if(this.reference)template.referenceViews=[this.reference.exportTemplate()];return template;}
 setAxis(axis){this.primary.setAxis(axis);}
 track(pixels){
  const result=this.active.track(pixels);if(result){this.output={...result,registeredView:this.active===this.primary?'play':'reference'};this.confirmations=0;return this.output;}
  this.output=null;
  // The second view is tried only after confirmed loss, in bounded intervals.
  // It needs two fresh identity matches; a background is never registered here.
  if(!this.reference||!this.active.lost||++this.probes%3!==0)return null;
  const alternate=this.active===this.primary?this.reference:this.primary,match=alternate.track(pixels);
  if(!match){this.confirmations=0;return null;}
  if(++this.confirmations<2)return null;
  this.active=alternate;this.confirmations=0;this.output={...match,recovered:true,registeredView:this.active===this.primary?'play':'reference'};return this.output;
 }
 get ready(){return this.primary.ready;}
 get lost(){return !!this.active.lost;}
 get matches(){return this.output?.matches||0;}
 get quality(){return this.active.quality;}
 get recoveryProbe(){return this.active.recoveryProbe;}
}
if(typeof module!=='undefined'&&module.exports)module.exports={ObjectViews};else globalThis.WarObjectViews=ObjectViews;
})();
