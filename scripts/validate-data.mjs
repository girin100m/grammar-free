import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {answerParts,normalizeAnswer,gradeQuestion} from '../public/assets/grading.js';
import {availableLessons,DEFAULT_LESSON_ID,LEGACY_BE_STORAGE_KEY,storageKeyForLesson} from '../public/assets/units.js';
const dir=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const fail=[];
const assert=(ok,msg)=>{if(!ok)fail.push(msg);};
const catalog=JSON.parse(readFileSync(resolve(dir,'public/data/course-catalog.json'),'utf-8'));
const lessons=availableLessons(catalog);
assert(lessons.length===2,`expected 2 available units, found ${lessons.length}`);
assert(storageKeyForLesson(DEFAULT_LESSON_ID)===LEGACY_BE_STORAGE_KEY,'legacy be동사 progress key must not change');
const allIds=new Set();
for(const lesson of lessons){
  assert(typeof lesson.questionBank==='string'&&lesson.questionBank.startsWith('/data/'),`${lesson.id} missing bank path`);
  const bank=JSON.parse(readFileSync(resolve(dir,'public'+lesson.questionBank),'utf-8'));
  const questions=bank.questions;
  assert(Array.isArray(questions),`${lesson.id} must contain questions array`);
  if(!Array.isArray(questions))continue;
  assert(questions.length===lesson.questionCount,`${lesson.id} question count mismatch ${questions.length} / ${lesson.questionCount}`);
  assert(questions.length===100,`${lesson.id} expected 100 questions`);
  const ids=new Set();const prompts=new Map();
  for(const q of questions){
    assert(typeof q.id==='string'&&/^G1-(BE|GV)-\d{3}$/.test(q.id),`${lesson.id}: invalid ID ${q.id}`);
    assert(!ids.has(q.id),`${lesson.id}: duplicate ID ${q.id}`);ids.add(q.id);
    assert(!allIds.has(q.id),`duplicate global ID ${q.id}`);allIds.add(q.id);
    assert(['객관식','주관식'].includes(q.kind),`${q.id}: invalid kind`);
    assert(['기초','기본','심화'].includes(q.level),`${q.id}: invalid difficulty`);
    assert(typeof q.question==='string'&&q.question.trim().length>4,`${q.id}: empty question`);
    assert(typeof q.guide==='string'&&q.guide.trim(),`${q.id}: empty guide`);
    assert(typeof q.explanation==='string'&&q.explanation.trim().length>20,`${q.id}: insufficient explanation`);
    assert(typeof q.tags==='string'&&q.tags.trim(),`${q.id}: no tags`);
    assert(Number.isInteger(q.display_no),`${q.id}: missing display_no`);
    const key=normalizeAnswer(q.question);assert(!prompts.has(key),`${q.id}: repeated prompt ${prompts.get(key)}`);prompts.set(key,q.id);
    if(q.kind==='객관식'){
      assert(Array.isArray(q.options)&&q.options.length===4,`${q.id}: wrong option count`);
      assert(new Set((q.options||[]).map(normalizeAnswer)).size===4,`${q.id}: duplicate options`);
      assert(Number.isInteger(q.answer_index)&&q.answer_index>=0&&q.answer_index<4,`${q.id}: invalid answer index`);
      assert((q.accepted_answers||[]).some(v=>normalizeAnswer(v)===normalizeAnswer(q.options?.[q.answer_index])),`${q.id}: official answer differs from options`);
    }else {
      const parts=answerParts(q);
      assert(parts.length>=1&&parts.length<=2,`${q.id}: unexpected part count`);
      for(const part of parts){
        assert(Array.isArray(part)&&part.length>0&&part.every(a=>typeof a==='string'&&a.trim()),`${q.id}: missing accepted answers`);
        assert(new Set(part.map(normalizeAnswer)).size===part.length,`${q.id}: duplicate normalized accepted answers`);
      }
    }
    const canonical=q.kind==='객관식'?String(q.answer_index):answerParts(q).map(p=>p[0]);
    assert(gradeQuestion(q,canonical).status==='correct',`${q.id}: canonical answer fails the score engine`);
  }
  for(const kind of ['객관식','주관식'])for(const [level,n] of [['기초',15],['기본',20],['심화',15]]){
    const count=questions.filter(q=>q.kind===kind&&q.level===level).length;
    assert(count===n,`${lesson.id} ${kind}/${level} expected ${n}, found ${count}`);
  }
  const nums=questions.map(q=>q.display_no).sort((a,b)=>a-b);
  assert(nums.every((n,i)=>n===i+1),`${lesson.id}: display numbers must cover 1..100`);
  console.log(`${lesson.gradeLabel} ${lesson.title}: ${questions.length}문항 · 객관식 50 + 주관식 50 · 기초/기본/심화 30/40/30`);
}
if(fail.length){console.error('VALIDATION FAILED:\n- '+fail.join('\n- '));process.exit(1);}
console.log('VALIDATION PASSED: 2 units / 200 unique questions; be동사 storage key preserved.');
console.log('AI content still requires final teacher review before relying on classroom use.');
