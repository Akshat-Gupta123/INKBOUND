import { levels, originalCount } from './levels';
export type Save = {
  ruleset:number; completed:number[]; fragments:Record<string,number[]>; times:Record<string,number>;
  progress:Record<string,number>; current:number; tutorialComplete:boolean;
  muted:boolean; volume:number; musicVolume:number; sfxVolume:number; reduced:boolean; timer:boolean; deaths:number; edits:number;
};
export const RULESET = 5;
const defaults=():Save=>({ruleset:RULESET,completed:[],fragments:{},times:{},progress:{},current:0,tutorialComplete:false,muted:false,volume:.65,musicVolume:.45,sfxVolume:.7,reduced:false,timer:true,deaths:0,edits:0});
const valid=(n:unknown):n is number=>Number.isInteger(n)&&Number(n)>=0&&Number(n)<levels.length;
type StoredSave=Record<string,unknown>;
const record=(value:unknown):StoredSave=>value!==null&&typeof value==='object'&&!Array.isArray(value)?value as StoredSave:{};
function readStored(key:string):StoredSave {
  try{return record(JSON.parse(localStorage.getItem(key)||'null'));}catch{return {};}
}
function mergeResults(s:Save,raw:StoredSave,keepResult:(index:number)=>boolean,keepTime:(index:number)=>boolean){
  if(Array.isArray(raw.completed))s.completed=[...new Set([...s.completed,...raw.completed.filter(valid).filter(keepResult)])];
  const fragments=record(raw.fragments),times=record(raw.times),progress=record(raw.progress);
  for(let i=0;i<levels.length;i++){
    if(!keepResult(i))continue;
    const found=fragments[i],time=times[i],reached=progress[i];
    if(Array.isArray(found))s.fragments[i]=[...new Set([...(s.fragments[i]??[]),...found.filter((n:unknown):n is number=>Number.isInteger(n)&&Number(n)>=0&&Number(n)<3)])];
    if(keepTime(i)&&typeof time==='number'&&Number.isFinite(time)&&time>0)s.times[i]=Math.min(s.times[i]??Infinity,time);
    if(typeof reached==='number'&&Number.isFinite(reached))s.progress[i]=Math.max(s.progress[i]??0,Math.min(100,Math.max(0,reached)));
    if(s.completed.includes(i))s.progress[i]=100;
  }
}
export function load():Save {
  const raw=readStored('inkbound-v1'),s=defaults();
  if(!Object.keys(raw).length)return s;
  if(raw.ruleset!==RULESET){
    // Keep the complete previous save once, including times for layouts that changed.
    const version=Number.isInteger(raw.ruleset)&&Number(raw.ruleset)>=0?String(raw.ruleset):'legacy';
    try{const archive='inkbound-archive-ruleset-'+version;if(!localStorage.getItem(archive))localStorage.setItem(archive,JSON.stringify(raw));}catch{/* A full quota must not prevent play. */}
  }
  if(raw.ruleset===3){
    // The gauntlet update archived Overdrive results. Recover those original routes;
    // current preferences and lifetime statistics still come from the latest save.
    const overdrive=readStored('inkbound-archive-ruleset-2');
    if(overdrive.ruleset===2)mergeResults(s,overdrive,i=>i<originalCount,()=>true);
  }
  // Renaming the original twelve leaves their records valid. The old easier courses
  // now hold different remixes, so their results belong only in the previous archive.
  const keepResult=(index:number)=>raw.ruleset===RULESET||index<originalCount;
  mergeResults(s,raw,keepResult,()=>raw.ruleset===RULESET||raw.ruleset===4||raw.ruleset===2);
  s.completed.sort((a,b)=>a-b);
  s.current=valid(raw.current)&&keepResult(raw.current)?raw.current:0;
  for(const key of ['muted','reduced','timer','tutorialComplete'] as const)if(typeof raw[key]==='boolean')s[key]=raw[key];
  for(const key of ['volume','musicVolume','sfxVolume'] as const){const value=raw[key];if(typeof value==='number'&&Number.isFinite(value))s[key]=Math.max(0,Math.min(1,value));}
  for(const key of ['deaths','edits'] as const){const value=raw[key];if(typeof value==='number'&&Number.isFinite(value))s[key]=Math.max(0,Math.floor(value));}
  return s;
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
