import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const data=JSON.parse(readFileSync(new URL('../public/data/course-catalog.json',import.meta.url),'utf8'));
test('catalog has three grade groups and unique lesson ids',()=>{
  assert.deepEqual(data.grades.map(g=>g.grade),[1,2,3]);
  const all=data.grades.flatMap(g=>g.groups.flatMap(s=>s.lessons));
  assert.equal(new Set(all.map(l=>l.id)).size,all.length);
  assert.equal(data.grades[0].groups.flatMap(s=>s.lessons).length,25);
});
test('only the be-verb lesson is available, other lessons visibly planned',()=>{
  const all=data.grades.flatMap(g=>g.groups.flatMap(s=>s.lessons));
  const ready=all.filter(l=>l.status==='available');
  assert.equal(ready.length,1);
  assert.equal(ready[0].title,'be동사');
  assert.equal(ready[0].questionCount,100);
  assert.ok(all.filter(l=>l.status==='planned').every(l=>l.questionCount===0));
});
