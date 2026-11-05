export type Save={ruleset:number;completed:number[];fragments:Record<string,number[]>;times:Record<string,number>;current:number;muted:boolean;volume:number;reduced:boolean;timer:boolean;deaths:number;edits:number};
const defaults=():Save=>({ruleset:2,completed:[],fragments:{},times:{},current:0,muted:false,volume:.35,reduced:false,timer:false,deaths:0,edits:0});
export function load():Save{try{
 const raw=JSON.parse(localStorage.getItem('inkbound-v1')||'null');if(!raw||typeof raw!=='object')return defaults();
 const s=defaults(),valid=(n:unknown)=>Number.isInteger(n)&&Number(n)>=0&&Number(n)<12;
 s.completed=Array.isArray(raw.completed)?[...new Set<number>(raw.completed.filter(valid))]:[];
 s.current=valid(raw.current)?raw.current:0;
 if(raw.fragments&&typeof raw.fragments==='object')for(let i=0;i<12;i++)if(Array.isArray(raw.fragments[i]))s.fragments[i]=[...new Set<number>(raw.fragments[i].filter((n:unknown)=>Number.isInteger(n)&&Number(n)>=0&&Number(n)<3))];
 if(raw.ruleset===2&&raw.times&&typeof raw.times==='object')for(let i=0;i<12;i++)if(Number.isFinite(raw.times[i])&&raw.times[i]>0)s.times[i]=raw.times[i];
 for(const key of ['muted','reduced','timer'] as const)s[key]=raw[key]===true;
 s.volume=Number.isFinite(raw.volume)?Math.max(0,Math.min(1,raw.volume)):.35;
 for(const key of ['deaths','edits'] as const)s[key]=Number.isFinite(raw[key])?Math.max(0,Math.floor(raw[key])):0;
 return s;
 }catch{return defaults();}}
export let save=load();
export function persist(){try{localStorage.setItem('inkbound-v1',JSON.stringify(save));}catch{/* Private browsing still permits play. */}}
export function complete(index:number,time:number,fragments:number[]){if(!save.completed.includes(index))save.completed.push(index);save.times[index]=Math.min(save.times[index]??Infinity,time);save.fragments[index]=[...new Set([...(save.fragments[index]??[]),...fragments])];save.current=Math.min(11,index+1);persist();}
export function achievementNames(){return [save.completed.length>=1?'First breach':null,save.edits>=10?'Ink operator':null,Object.values(save.fragments).flat().length>=18?'Route hunter':null,save.completed.length===12?'Eraser offline':null].filter(Boolean);}
