import { levels } from './levels';
export type Save = {
  ruleset:number; completed:number[]; fragments:Record<string,number[]>; times:Record<string,number>;
  progress:Record<string,number>; current:number; tutorialComplete:boolean;
  muted:boolean; volume:number; musicVolume:number; sfxVolume:number; reduced:boolean; timer:boolean; deaths:number; edits:number;
};
const defaults=():Save=>({ruleset:2,completed:[],fragments:{},times:{},progress:{},current:0,tutorialComplete:false,muted:false,volume:.65,musicVolume:.45,sfxVolume:.7,reduced:false,timer:true,deaths:0,edits:0});
const valid=(n:unknown)=>Number.isInteger(n)&&Number(n)>=0&&Number(n)<levels.length;
export function load():Save {
  try {
    const raw=JSON.parse(localStorage.getItem('inkbound-v1')||'null');if(!raw||typeof raw!=='object')return defaults();
    const s=defaults();s.completed=Array.isArray(raw.completed)?[...new Set<number>(raw.completed.filter(valid))]:[];
    s.current=valid(raw.current)?raw.current:0;
    for(let i=0;i<levels.length;i++){
      if(Array.isArray(raw.fragments?.[i]))s.fragments[i]=[...new Set<number>(raw.fragments[i].filter((n:unknown)=>Number.isInteger(n)&&Number(n)>=0&&Number(n)<3))];
      if(raw.ruleset===2&&Number.isFinite(raw.times?.[i])&&raw.times[i]>0)s.times[i]=raw.times[i];
      if(Number.isFinite(raw.progress?.[i]))s.progress[i]=Math.max(0,Math.min(100,raw.progress[i]));
      if(s.completed.includes(i))s.progress[i]=100;
    }
    for(const key of ['muted','reduced','timer','tutorialComplete'] as const)s[key]=raw[key]===true;
    for(const key of ['volume','musicVolume','sfxVolume'] as const)if(Number.isFinite(raw[key]))s[key]=Math.max(0,Math.min(1,raw[key]));
    for(const key of ['deaths','edits'] as const)s[key]=Number.isFinite(raw[key])?Math.max(0,Math.floor(raw[key])):0;
    return s;
  }catch{return defaults();}
}
export let save=load();
export function persist(){try{localStorage.setItem('inkbound-v1',JSON.stringify(save));}catch{/* Session play remains available if storage is restricted. */}}
export function complete(index:number,time:number,fragments:number[]){
  if(!valid(index))return;
  if(!save.completed.includes(index))save.completed.push(index);
  save.times[index]=Math.min(save.times[index]??Infinity,time);
  save.fragments[index]=[...new Set([...(save.fragments[index]??[]),...fragments])];
  save.current=index;save.progress[index]=100;persist();
}
export function achievementNames(){return [save.completed.length>=1?'First clear':null,save.edits>=10?'Ink operator':null,Object.values(save.fragments).flat().length>=18?'Route hunter':null,save.completed.length===levels.length?'Full spectrum':null].filter(Boolean);}
