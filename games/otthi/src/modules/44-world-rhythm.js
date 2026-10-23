/** Deterministic rhythm rules; clock and input are supplied by the real venue. */
// @otthi-module-body
  class WorldRhythm {
    constructor(level=0){
      this.level=Math.max(0,Math.min(2,Math.floor(level)));this.bpm=[84,104,120][this.level];this.beat=60/this.bpm;
      this.window=[.20,.17,.145][this.level];this.notes=[];const count=[32,48,64][this.level];
      for(let i=0;i<count;i++){
        const at=(i+2)*this.beat,lane=[0,2,1,3,2,0,3,1][(i+this.level*3)%8];this.notes.push({at,lane,state:'pending'});
        if(this.level===2&&i%8===7)this.notes.push({at,lane:(lane+2)%4,state:'pending'});
      }
      this.end=this.notes.at(-1).at+this.window+.5;this.score=0;this.combo=0;this.bestCombo=0;this.hits=0;this.misses=0;this.strays=0;this.weight=0;this.time=-3;this.done=false;
    }
    update(time){
      if(this.done)return;this.time=Math.max(this.time,time);
      for(const n of this.notes)if(n.state==='pending'&&this.time>n.at+this.window){n.state='miss';this.misses++;this.combo=0;}
      this.done=this.time>=this.end;
    }
    hit(lane,time){
      this.update(time);if(this.done||time<0||!Number.isInteger(lane)||lane<0||lane>3)return null;
      const n=this.notes.filter(n=>n.state==='pending'&&n.lane===lane&&Math.abs(n.at-time)<=this.window).sort((a,b)=>Math.abs(a.at-time)-Math.abs(b.at-time))[0];
      if(!n){this.combo=0;this.strays++;this.score=Math.max(0,this.score-30);return 'FORA DO TEMPO';}
      const error=Math.abs(n.at-time),weight=error<=.055?1:error<=.11?.8:.5;
      n.state='hit';this.hits++;this.weight+=weight;this.combo++;this.bestCombo=Math.max(this.bestCombo,this.combo);this.score+=Math.round(100*weight)+Math.min(50,this.combo*2);
      return weight===1?'PERFEITO':weight===.8?'BOM':'CERTO';
    }
    snapshot(){return {level:this.level,bpm:this.bpm,time:this.time,end:this.end,score:this.score,combo:this.combo,bestCombo:this.bestCombo,hits:this.hits,misses:this.misses,strays:this.strays,total:this.notes.length,accuracy:Math.max(0,(this.weight-this.strays*.2)/this.notes.length),done:this.done,notes:this.notes.filter(n=>n.state==='pending').map(n=>({at:n.at,lane:n.lane}))};}
  }
