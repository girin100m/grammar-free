/** Shared lesson routing and per-lesson browser progress. No server-side student data. */
export const LEGACY_BE_STORAGE_KEY = 'grit-grammar:be-verb:v01';
export const DEFAULT_LESSON_ID = 'G1-01';
export function availableLessons(catalog) {
  return catalog.grades.flatMap(grade => grade.groups.flatMap(group =>
    group.lessons.filter(lesson => lesson.status === 'available').map(lesson => ({...lesson, grade: grade.grade, gradeLabel: grade.label}))));
}
export function findLesson(catalog, id) {
  const lessons=availableLessons(catalog);
  return lessons.find(lesson=>lesson.id===id) ?? lessons.find(lesson=>lesson.id===DEFAULT_LESSON_ID) ?? lessons[0] ?? null;
}
export function storageKeyForLesson(id) {
  return id===DEFAULT_LESSON_ID ? LEGACY_BE_STORAGE_KEY : `munbeopbaro:${id}:v01`;
}
export function validateBank(lesson,bank) {
  if(!bank || !Array.isArray(bank.questions) || bank.questions.length!==lesson.questionCount) throw new Error('문제은행 문항 수가 목록과 달라요.');
  const ids=new Set();
  for(const q of bank.questions) {
    if(!q || typeof q.id!=='string' || ids.has(q.id) || !['객관식','주관식'].includes(q.kind) ||
      typeof q.question!=='string' || typeof q.explanation!=='string' || !['기초','기본','심화'].includes(q.level)) throw new Error('문제은행 형식이 올바르지 않습니다.');
    ids.add(q.id);
  }
  return bank.questions;
}
