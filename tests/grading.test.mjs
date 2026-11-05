import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeAnswer,gradeQuestion,isAnswered,summary} from '../public/assets/grading.js';
const qs=JSON.parse(readFileSync(new URL('../public/data/be-verb-100.json',import.meta.url),'utf-8')).questions;
const get=id=>qs.find(q=>q.id===`G1-BE-${id}`);
test('100 questions and exact target distribution',()=>{
  assert.equal(qs.length,100);
  assert.equal(qs.filter(q=>q.kind==='객관식').length,50);
  assert.equal(qs.filter(q=>q.kind==='주관식').length,50);
  for(const [level,count] of [['기초',30],['기본',40],['심화',30]])assert.equal(qs.filter(q=>q.level===level).length,count);
});
test('multiple choice 0-indexed answer and wrong answer',()=>{
  assert.equal(gradeQuestion(get('001'),'0').status,'correct');
  assert.equal(gradeQuestion(get('001'),'1').status,'wrong');
  assert.equal(gradeQuestion(get('001'),undefined).status,'unanswered');
});
test('Korean punctuation, case, curly apostrophe are normalized',()=>{
  assert.equal(normalizeAnswer('  Mina ISN’T tired. '),"mina isn't tired");
  assert.equal(gradeQuestion(get('014'),['MINA’S NOT TIRED.']).status,'correct');
  assert.equal(gradeQuestion(get('016'),['She is NOT.']).status,'correct');
});
test('Q17 and Q20 two-part accepted grading',()=>{
  assert.equal(gradeQuestion(get('017'),['are','are']).status,'correct');
  assert.equal(gradeQuestion(get('017'),['are','']).status,'unanswered');
  assert.equal(gradeQuestion(get('017'),['is','are']).status,'wrong');
  assert.equal(gradeQuestion(get('020'),['Are you and your brother at home?',"we're not"]).status,'correct');
  assert.equal(gradeQuestion(get('020'),['Are you and your brother at home?','I am not']).status,'review');
});
test('known alternative valid answers accepted; unknown full sentence reviewed not wrong',()=>{
  assert.equal(gradeQuestion(get('019'),['Why are your classmates not in the classroom?']).status,'correct');
  assert.equal(gradeQuestion(get('019'),['Why are not your classmates in the classroom?']).status,'review');
  assert.equal(gradeQuestion(get('011'),['is']).status,'wrong');
});
test('summary reflects saved answers, grades and retry pool',()=>{
  const s=summary(qs,{'G1-BE-001':'0','G1-BE-014':['Mina is not tired.']},{'G1-BE-001':{status:'correct'},'G1-BE-014':{status:'review'}},['G1-BE-014']);
  assert.deepEqual(s,{answered:2,graded:2,correct:1,retry:1,total:100});
});
test('all 100 canonical answers and registered written variants are accepted',()=>{
  for(const q of qs){
    const answer=q.kind==='객관식'?String(q.answer_index):q.answer_parts.map(p=>p[0]);
    assert.equal(gradeQuestion(q,answer).status,'correct',q.id+' official answer failed');
    if(q.kind==='주관식'){
      for(let i=0;i<q.answer_parts.length;i++)for(const alt of q.answer_parts[i]){
        const candidate=[...answer];candidate[i]=alt;
        assert.equal(gradeQuestion(q,candidate).status,'correct',q.id+' accepted variant failed: '+alt);
      }
    }
  }
});
