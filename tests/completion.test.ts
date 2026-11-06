import {describe,it,expect} from 'vitest';
import {hasClearedEveryLevel} from '../src/completion';
describe('the final page',()=>{
 it('requires every course, even if the final numbered course is already cleared',()=>{
  const all=Array.from({length:104},(_,i)=>i);
  expect(hasClearedEveryLevel(all,104)).toBe(true);
  expect(hasClearedEveryLevel(all.filter(i=>i!==37),104)).toBe(false);
  expect(hasClearedEveryLevel([...all.filter(i=>i!==37),103,-1,104],104)).toBe(false);
 });
 it('accepts any clear order and remains locked for an earlier completed catalogue',()=>{
  expect(hasClearedEveryLevel(Array.from({length:24},(_,i)=>i),104)).toBe(false);
  expect(hasClearedEveryLevel(Array.from({length:104},(_,i)=>103-i),104)).toBe(true);
  expect(hasClearedEveryLevel([],0)).toBe(false);
 });
});
