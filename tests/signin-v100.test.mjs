import test from 'node:test';
import assert from 'node:assert/strict';
import {DEPLOYMENT_CYCLE_MS,NAME_CYCLE_MS,VISUAL_LOOP_MS,namesForCycle} from '../src/signin-model-v099.mjs';

test('names rotate 2.5x faster without changing the 20-second delivery cycle',()=>{
  assert.equal(NAME_CYCLE_MS,8000);
  assert.equal(DEPLOYMENT_CYCLE_MS,20000);
  assert.equal(DEPLOYMENT_CYCLE_MS/NAME_CYCLE_MS,2.5);
  assert.equal(VISUAL_LOOP_MS%NAME_CYCLE_MS,0);
  assert.equal(VISUAL_LOOP_MS%DEPLOYMENT_CYCLE_MS,0);
  const names=['A','B','C','D','E','F'];
  assert.deepEqual(namesForCycle(names,Math.floor(7999/NAME_CYCLE_MS)),['A','B','C']);
  assert.deepEqual(namesForCycle(names,Math.floor(8000/NAME_CYCLE_MS)),['D','E','F']);
});
