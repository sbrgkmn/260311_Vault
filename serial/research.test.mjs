import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {CASES,EXPERIMENTS,caseConfig,matrixSamples,variationConfig,editorURL,ruleGlyph} from './research.mjs';
import {generateFaceStudy} from './face-rules.mjs';
const recipes=JSON.parse(await readFile(new URL('./assets/rhino-recursion.json',import.meta.url)));
test('four reference cases produce 24 unique reproducible samples',()=>{
  const samples=matrixSamples();assert.equal(samples.length,24);assert.equal(new Set(samples.map(s=>s.id)).size,24);
  assert.equal(new Set(samples.map(s=>JSON.stringify(s.config))).size,24);
  assert.deepEqual(samples,matrixSamples());assert.deepEqual(CASES.map(c=>c.page),[19,17,16,18]);
});
test('all matrix meshes are finite and four-way recursive',()=>{
  for(const s of matrixSamples()){
    const stages=generateFaceStudy(recipes[1],s.config).stages;
    const final=stages.at(-1);assert.equal(final.faces.length,stages[0].faces.length*4**3);
    assert.ok(final.positions.every(Number.isFinite));assert.equal(final.types.length,final.faces.length/3);
  }
});
test('experiments hold rise and decay constant and survive editor links',()=>{
  for(const c of CASES)for(const exp of EXPERIMENTS){
    const config=variationConfig(c.id,exp.id,4),url=new URL(editorURL(config),'http://localhost/serial/');
    assert.deepEqual(JSON.parse(url.searchParams.get('config')),config);assert.equal(config.depth,4);
    assert.equal(config.rise,2.19);assert.equal(config.decay,1);
  }
});
test('compact glyph states actual signed lifts and inheritance',()=>{
  const config=variationConfig('rhino','alternate');const svg=ruleGlyph(config);
  assert.ok(svg.includes('h -0.120'));assert.ok(svg.includes('t 0.60'));
  assert.deepEqual(config.inherit[0],['B','B','B','B']);assert.deepEqual(config.inherit[1],['A','A','A','A']);
  assert.equal((svg.match(/<polygon /g)||[]).length,12);
  assert.deepEqual(caseConfig('rhino').seed,['A','A','A','A']);
});
