import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {answerParts,normalizeAnswer} from '../public/assets/grading.js';
const dir=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const bank=JSON.parse(readFileSync(resolve(dir,'public/data/be-verb-100.json'),'utf-8'));
const questions=bank.questions;
const fail=[];
const assert=(ok,msg)=>{if(!ok)fail.push(msg);};
assert(Array.isArray(questions),'questions must be an array');
assert(questions.length===100,`expected 100 questions, found ${questions.length}`);
const ids=new Set();
for(const q of questions){
  assert(typeof q.id==='string'&&/^G1-BE-\d{3}$/.test(q.id),`invalid ID ${q.id}`);
  assert(!ids.has(q.id),`duplicate ID ${q.id}`);ids.add(q.id);
  assert(['객관식','주관식'].includes(q.kind),`${q.id}: invalid kind`);
  assert(['기초','기본','심화'].includes(q.level),`${q.id}: invalid difficulty`);
  assert(typeof q.question==='string'&&q.question.trim().length>4,`${q.id}: empty question`);
  assert(typeof q.guide==='string'&&q.guide.trim(),`${q.id}: empty guide`);
  assert(typeof q.explanation==='string'&&q.explanation.trim().length>20,`${q.id}: insufficient explanation`);
  assert(typeof q.tags==='string'&&q.tags.trim(),`${q.id}: no tags`);
  if(q.kind==='객관식'){
    assert(Array.isArray(q.options)&&q.options.length===4,`${q.id}: wrong option count`);
    assert(new Set((q.options||[]).map(normalizeAnswer)).size===4,`${q.id}: duplicate options`);
    assert(Number.isInteger(q.answer_index)&&q.answer_index>=0&&q.answer_index<4,`${q.id}: invalid answer index`);
    assert((q.accepted_answers||[]).some(v=>normalizeAnswer(v)===normalizeAnswer(q.options?.[q.answer_index])),`${q.id}: official answer disagrees with options`);
  }else {
    const parts=answerParts(q);
    assert(parts.length>=1&&parts.length<=2,`${q.id}: unexpected part count ${parts.length}`);
    for(const p of parts){
      assert(Array.isArray(p)&&p.length>0&&p.every(a=>typeof a==='string'&&a.trim()),`${q.id}: missing accepted answers`);
      assert(new Set(p.map(normalizeAnswer)).size===p.length,`${q.id}: duplicate normalized accepted answers`);
    }
  }
}
const count=(kind,level)=>questions.filter(q=>q.kind===kind&&q.level===level).length;
for(const kind of ['객관식','주관식'])for(const [level,needed] of [['기초',15],['기본',20],['심화',15]])assert(count(kind,level)===needed,`${kind} ${level} expected ${needed}, found ${count(kind,level)}`);
const nums=questions.map(q=>q.display_no).sort((a,b)=>a-b);
assert(nums.every((n,i)=>n===i+1),'display_no must cover 1..100 exactly');
const normalizedPrompts=new Map();
for(const q of questions){const n=normalizeAnswer(q.question);if(normalizedPrompts.has(n))fail.push(`duplicate question text: ${normalizedPrompts.get(n)} and ${q.id}`);else normalizedPrompts.set(n,q.id);}
if(fail.length){console.error('VALIDATION FAILED:\n- '+fail.join('\n- '));process.exit(1);}
console.log('VALIDATION PASSED: 100 questions | 50 MC + 50 written | difficulty 30/40/30 | 100 unique IDs | answer keys and explanations present');
console.log('Note: static checks cannot prove every English sentence is grammatically unambiguous; teacher review is still required.');
