import {save,persist} from './save';
class Sound {
 ctx:AudioContext|undefined; ambient:ReturnType<typeof setInterval>|undefined;
 unlock(){if(!this.ctx)this.ctx=new AudioContext();void this.ctx.resume();if(!this.ambient)this.ambient=setInterval(()=>{if(document.hidden)return;const notes=[130.81,164.81,196,261.63,293.66,329.63];this.tone(notes[Math.floor(Math.random()*notes.length)],2.8,'sine',.022);},2400);}
 tone(freq:number,duration=.12,type:OscillatorType='sine',gain=.15,end?:number){if(save.muted||!this.ctx)return;const c=this.ctx,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,c.currentTime);if(end)o.frequency.exponentialRampToValueAtTime(end,c.currentTime+duration);g.gain.setValueAtTime(.001,c.currentTime);g.gain.linearRampToValueAtTime(gain*save.volume,c.currentTime+.015);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+duration);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+duration);}
 play(kind:string){const f:Record<string,number>={jump:330,land:100,draw:700,collect:880,complete:523,checkpoint:440,page:220,click:390,error:90};this.tone(f[kind]||330,kind==='complete'?.7:.17,kind==='draw'?'triangle':'sine',.18,kind==='jump'?650:undefined);if(kind==='collect'||kind==='complete')setTimeout(()=>this.tone(1046,.25),100);}
 mute(){save.muted=!save.muted;persist();}
}
export const sound=new Sound();
