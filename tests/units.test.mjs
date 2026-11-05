import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {availableLessons,findLesson,storageKeyForLesson,DEFAULT_LESSON_ID} from '../public/assets/units.js';
import {answerParts,gradeQuestion} from '../public/assets/grading.js';
const catalog=JSON.parse(readFileSync(new URL('../public/data/course-catalog.json',import.meta.url),'utf8'));
const general=JSON.parse(readFileSync(new URL('../public/data/general-verbs-100.json',import.meta.url),'utf8')).questions;
test('both lessons available with separate data and progress',()=>{
 const lessons=availableLessons(catalog);
 assert.deepEqual(lessons.map(l=>l.title),['be동사','일반동사']);
 assert.equal(lessons[0].questionBank,'/data/be-verb-100.json');
 assert.equal(lessons[1].questionBank,'/data/general-verbs-100.json');
 assert.equal(storageKeyForLesson('G1-01'),'grit-grammar:be-verb:v01');
 assert.equal(storageKeyForLesson('G1-02'),'munbeopbaro:G1-02:v01');
 assert.notEqual(storageKeyForLesson('G1-01'),storageKeyForLesson('G1-02'));
 assert.equal(findLesson(catalog,'INVALID').id,DEFAULT_LESSON_ID);
 assert.equal(findLesson(catalog,'G1-02').title,'일반동사');
 assert.equal(findLesson(catalog,'G1-03').id,DEFAULT_LESSON_ID);
});
test('general verbs bank exactly 50/50 with 30/40/30 difficulty',()=>{
 assert.equal(general.length,100);
 assert.equal(general.filter(q=>q.kind==='객관식').length,50);
 assert.equal(general.filter(q=>q.kind==='주관식').length,50);
 for(const [level,n] of [['기초',30],['기본',40],['심화',30]]) assert.equal(general.filter(q=>q.level===level).length,n);
 assert.equal(new Set(general.map(q=>q.id)).size,100);
});
test('all 100 official answers and registered alternatives pass scoring',()=>{
 for(const q of general){
  const answers=q.kind==='객관식'?String(q.answer_index):answerParts(q).map(parts=>parts[0]);
  assert.equal(gradeQuestion(q,answers).status,'correct',q.id);
  if(q.kind==='주관식')for(let i=0;i<q.answer_parts.length;i++)for(const alternative of q.answer_parts[i]){
   const candidate=answers.slice();candidate[i]=alternative;
   assert.equal(gradeQuestion(q,candidate).status,'correct',q.id+' '+alternative);
  }
 }
});
test('common grammar errors are rejected and two-part blanks need both answers',()=>{
 const byQuestion=prefix=>general.find(q=>q.question.startsWith(prefix));
 assert.equal(gradeQuestion(byQuestion('Does Kevin'),['has']).status,'wrong');
 assert.equal(gradeQuestion(byQuestion('Does Kevin'),['have']).status,'correct');
 assert.equal(gradeQuestion(byQuestion('Tom ______ not'),['does','eats']).status,'wrong');
 assert.equal(gradeQuestion(byQuestion('Tom ______ not'),['does','']).status,'unanswered');
 assert.equal(gradeQuestion(byQuestion('Tom ______ not'),['does','eat']).status,'correct');
 assert.equal(gradeQuestion(byQuestion('She ______ to school'), '0').status,'wrong');
});
