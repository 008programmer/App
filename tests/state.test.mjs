import test from 'node:test';
import assert from 'node:assert/strict';
import { validSaved } from '../src/state.ts';
const valid = () => ({schemaVersion:1,selectedColour:'pink',activity:'garden',garden:{flower1:'pink',flower2:'yellow',flower3:'blue',butterfly:'purple'},strokes:[]});
test('validates saved artwork without truncating drawings over twenty strokes',()=>{
 const state=valid(); state.strokes=Array.from({length:45},()=>({colour:'green',points:[[0,0],[.5,.7],[1,1]]}));
 assert.equal(validSaved(state),true); assert.equal(state.strokes.length,45);
});
test('rejects invalid colour, target, version and activity before rendering',()=>{
 for(const patch of [{schemaVersion:2},{selectedColour:'toString'},{activity:'other'},{garden:{flower1:'pink'}},{strokes:[{colour:'nope',points:[[0,0]]}]}]) assert.equal(validSaved({...valid(),...patch}),false);
});
test('rejects malformed stroke geometry and nonfinite coordinates',()=>{
 for(const points of [null,[],[[NaN,0]],[[Infinity,0]],[[0]],[[0,'0']]]) assert.equal(validSaved({...valid(),strokes:[{colour:'pink',points}]}),false);
 for(const value of [null,undefined,3,[],{}]) assert.equal(validSaved(value),false);
});
test('preserves normalized strokes and valid pointer excursions outside the canvas',()=>{
 const state={...valid(),strokes:[{colour:'blue',points:[[-.02,0],[1.05,.7]]}]};
 const copy=structuredClone(state); assert.equal(validSaved(state),true); assert.deepEqual(state,copy);
});
