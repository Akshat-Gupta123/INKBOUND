import {describe,it,expect,vi,beforeEach} from 'vitest';
const values=new Map<string,string>();vi.stubGlobal('localStorage',{getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>values.set(k,v)});
const {load,save,complete}=await import('../src/save');
beforeEach(()=>values.clear());
describe('safe persistent progress',()=>{
 it('recovers from malformed and partially corrupt saves',()=>{values.set('inkbound-v1','broken');expect(load().current).toBe(0);values.set('inkbound-v1',JSON.stringify({current:40,completed:[1,1,22,'2'],volume:9,fragments:{0:[0,1,7,'2']},times:{0:-1}}));const s=load();expect(s.current).toBe(0);expect(s.completed).toEqual([1]);expect(s.volume).toBe(1);expect(s.fragments[0]).toEqual([0,1]);expect(s.times).toEqual({});});
 it('replaying preserves fragments and the best completion time',()=>{Object.assign(save,{completed:[],fragments:{},times:{},current:0});complete(0,10000,[0,1]);complete(0,12000,[2]);expect(save.completed).toEqual([0]);expect(save.times[0]).toBe(10000);expect(load().fragments[0]).toEqual([0,1,2]);expect(load().current).toBe(1);});
 it('preserves progress while retiring best times from the old slow ruleset',()=>{values.set('inkbound-v1',JSON.stringify({completed:[0,1],current:2,fragments:{0:[1]},times:{0:9000},volume:.7}));const migrated=load();expect(migrated.ruleset).toBe(2);expect(migrated.completed).toEqual([0,1]);expect(migrated.fragments[0]).toEqual([1]);expect(migrated.times).toEqual({});expect(migrated.volume).toBe(.7);});
});
