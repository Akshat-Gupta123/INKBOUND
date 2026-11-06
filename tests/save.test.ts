import {describe,it,expect,vi,beforeEach} from 'vitest';
const values=new Map<string,string>();
vi.stubGlobal('localStorage',{getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>values.set(k,v)});
const {load,save,complete,RULESET}=await import('../src/save');
const store=(value:unknown)=>values.set('inkbound-v1',JSON.stringify(value));
beforeEach(()=>{values.clear();Object.assign(save,load());});
describe('safe persistent progress',()=>{
 it('recovers from malformed and partially corrupt saves',()=>{
  values.set('inkbound-v1','broken');expect(load().current).toBe(0);
  store([]);expect(load().completed).toEqual([]);
  store({ruleset:RULESET,current:40,completed:[1,1,24,'2'],volume:9,fragments:{0:[0,1,7,'2']},times:{0:-1},progress:{2:-9,3:120}});
  const s=load();expect(s.current).toBe(0);expect(s.completed).toEqual([1]);expect(s.volume).toBe(1);expect(s.fragments[0]).toEqual([0,1]);expect(s.times).toEqual({});expect(s.progress).toEqual({1:100,2:0,3:100});
 });
 it('replaying preserves fragments and the best completion time',()=>{
  complete(0,10000,[0,1]);complete(0,12000,[2]);
  expect(save.completed).toEqual([0]);expect(save.times[0]).toBe(10000);expect(load().fragments[0]).toEqual([0,1,2]);expect(load().current).toBe(0);expect(load().progress[0]).toBe(100);
 });
 it('keeps original Overdrive records while archiving every result for replaced routes',()=>{
  const old={ruleset:2,completed:[0,12],current:2,fragments:{0:[1],19:[2]},progress:{2:73},times:{0:9000,11:18000,12:5000,19:7000},volume:.7,musicVolume:.25,tutorialComplete:true,deaths:18,edits:52};
  store(old);const migrated=load();
  expect(migrated.ruleset).toBe(5);expect(migrated.completed).toEqual([0]);expect(migrated.fragments).toEqual({0:[1]});expect(migrated.progress).toEqual({0:100,2:73});expect(migrated.times).toEqual({0:9000,11:18000});
  expect(migrated.volume).toBe(.7);expect(migrated.musicVolume).toBe(.25);expect(migrated.tutorialComplete).toBe(true);expect(migrated.deaths).toBe(18);expect(migrated.edits).toBe(52);
  expect(JSON.parse(values.get('inkbound-archive-ruleset-2')!)).toEqual(old);
  store({...old,times:{0:4000}});load();expect(JSON.parse(values.get('inkbound-archive-ruleset-2')!).times[0]).toBe(9000);
 });
 it('preserves renamed originals from ruleset4 and resets replacement remixes without losing the archive',()=>{
  const old={ruleset:4,completed:[0,11,12,19],current:19,fragments:{0:[1],11:[0,2],12:[0,1,2]},progress:{5:74,12:100,19:100},times:{0:17000,11:32000,12:8000,19:17000},muted:true,reduced:true,timer:false,tutorialComplete:true,musicVolume:.2,sfxVolume:.8,deaths:25,edits:150};
  store(old);const migrated=load();
  expect(migrated.completed).toEqual([0,11]);expect(migrated.fragments).toEqual({0:[1],11:[0,2]});expect(migrated.progress).toEqual({0:100,5:74,11:100});expect(migrated.times).toEqual({0:17000,11:32000});expect(migrated.current).toBe(0);
  expect(migrated).toMatchObject({ruleset:5,muted:true,reduced:true,timer:false,tutorialComplete:true,musicVolume:.2,sfxVolume:.8,deaths:25,edits:150});
  expect(JSON.parse(values.get('inkbound-archive-ruleset-4')!)).toEqual(old);
  store({...old,current:11,times:{0:15000}});expect(load().current).toBe(11);expect(JSON.parse(values.get('inkbound-archive-ruleset-4')!)).toEqual(old);
  store(migrated);expect(load()).toEqual(migrated);
 });
 it('recovers archived Overdrive achievements without replacing current preferences or using gauntlet times',()=>{
  const archive={ruleset:2,completed:[0,12],fragments:{0:[0],1:[1]},progress:{2:83},times:{0:9000,11:21000,12:8000},volume:.1,current:4,deaths:100};
  const current={ruleset:3,completed:[1,19],current:19,fragments:{0:[2],1:[1,2]},progress:{2:40,3:45},times:{0:3000,19:6000},volume:.8,musicVolume:.2,tutorialComplete:true,deaths:123,edits:222};
  values.set('inkbound-archive-ruleset-2',JSON.stringify(archive));store(current);
  const migrated=load();
  expect(migrated.completed).toEqual([0,1]);expect(migrated.fragments).toEqual({0:[0,2],1:[1,2]});expect(migrated.progress).toEqual({0:100,1:100,2:83,3:45});expect(migrated.times).toEqual({0:9000,11:21000});
  expect(migrated.current).toBe(0);expect(migrated.volume).toBe(.8);expect(migrated.musicVolume).toBe(.2);expect(migrated.tutorialComplete).toBe(true);expect(migrated.deaths).toBe(123);expect(migrated.edits).toBe(222);
  expect(JSON.parse(values.get('inkbound-archive-ruleset-3')!)).toEqual(current);
  store(migrated);expect(load()).toEqual(migrated);
  store({...current,times:{19:1000}});load();expect(JSON.parse(values.get('inkbound-archive-ruleset-3')!)).toEqual(current);
 });
 it('ignores corrupt or misidentified archives and validates recovered result fields',()=>{
  store({ruleset:3,completed:[4],volume:.4});
  values.set('inkbound-archive-ruleset-2','broken');expect(load().completed).toEqual([4]);
  values.set('inkbound-archive-ruleset-2',JSON.stringify({ruleset:4,completed:[0],times:{0:9000}}));expect(load().times).toEqual({});expect(load().completed).toEqual([4]);
  values.set('inkbound-archive-ruleset-2',JSON.stringify({ruleset:2,completed:[0,'1',50],fragments:{0:[0,8,'1']},times:{0:'9000',1:-1,2:12000},progress:{3:'75',5:500}}));
  const s=load();expect(s.completed).toEqual([0,4]);expect(s.fragments).toEqual({0:[0]});expect(s.times).toEqual({2:12000});expect(s.progress).toEqual({0:100,4:100,5:100});expect(s.volume).toBe(.4);
 });
 it('retains legacy achievements and remains usable when archive storage is full',()=>{
  const old={completed:[1],fragments:{1:[2]},times:{1:4000},muted:true,tutorialComplete:true};store(old);
  const write=vi.spyOn(localStorage,'setItem').mockImplementationOnce(()=>{throw new Error('Quota exceeded');});
  const migrated=load();write.mockRestore();
  expect(migrated.completed).toEqual([1]);expect(migrated.fragments).toEqual({1:[2]});expect(migrated.times).toEqual({});expect(migrated.muted).toBe(true);expect(migrated.tutorialComplete).toBe(true);
 });
 it('stores current course times, tutorial and independent music settings',()=>{
  store({ruleset:RULESET,completed:[0,19,23,24],current:23,tutorialComplete:true,musicVolume:.25,sfxVolume:.8,progress:{19:87},times:{19:29000,23:31000}});
  const s=load();expect(s.completed).toEqual([0,19,23]);expect(s.current).toBe(23);expect(s.progress[19]).toBe(100);expect(s.times[19]).toBe(29000);expect(s.times[23]).toBe(31000);expect(s.tutorialComplete).toBe(true);expect(s.musicVolume).toBe(.25);expect(s.sfxVolume).toBe(.8);
 });
});
