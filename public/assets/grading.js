/** Pure scoring helpers. No server calls; the student's answers never leave the browser. */
export function normalizeAnswer(raw) {
  return String(raw ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[‘’ʻ`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[\u00a0\s]+/g, ' ')
    .trim()
    .replace(/[.!?。．！？]+$/g, '')
    .trim();
}
export function answerParts(question) {
  if (Array.isArray(question.answer_parts) && question.answer_parts.length) {
    return question.answer_parts.map(part => Array.isArray(part) ? part : [String(part)]);
  }
  return [Array.isArray(question.accepted_answers) ? question.accepted_answers : []];
}
export function isAnswered(question, answer) {
  if (question.kind === '객관식') return answer !== undefined && answer !== null && String(answer).trim() !== '';
  const parts = answerParts(question);
  const values = Array.isArray(answer) ? answer : [answer];
  return parts.every((_, i) => normalizeAnswer(values[i]) !== '');
}
export function gradeQuestion(question, answer) {
  if (!isAnswered(question, answer)) return {status:'unanswered'};
  if (question.kind === '객관식') {
    return {status: Number(answer) === question.answer_index ? 'correct' : 'wrong'};
  }
  const parts = answerParts(question);
  const values = Array.isArray(answer) ? answer : [answer];
  const matches = parts.every((accepted, i) => accepted.some(a => normalizeAnswer(a) === normalizeAnswer(values[i])));
  if (matches) return {status:'correct'};
  // A predictable, tightly constrained one-word blank can be graded deterministically.
  // Unregistered free-form sentences might be correct: do NOT falsely call them wrong.
  const tightlyConstrained = parts.every(accepted => accepted.every(a => /^[a-z]+(?:'[a-z]+)?$/i.test(normalizeAnswer(a))));
  return {status:tightlyConstrained ? 'wrong' : 'review'};
}
export function expectedAnswer(question) {
  if (question.kind === '객관식') return question.options[question.answer_index];
  return answerParts(question).map(part => part[0] ?? '').join(' / ');
}
export function acceptedVariants(question) {
  if (question.kind === '객관식') return [];
  const parts = answerParts(question);
  if (parts.every(p => p.length === 1)) return [];
  return parts.map((p,i) => p.length > 1 ? `답 ${i+1}: ${p.join(' · ')}` : '').filter(Boolean);
}
export function summary(questions, answers = {}, results = {}, retryPool = []) {
  const ids = new Set(questions.map(q => q.id));
  const answered = questions.filter(q => isAnswered(q, answers[q.id])).length;
  const graded = questions.filter(q => results[q.id] && results[q.id].status !== 'unanswered').length;
  const correct = questions.filter(q => results[q.id] && results[q.id].status === 'correct').length;
  const retry = retryPool.filter(id=>ids.has(id)).length;
  return {answered,graded,correct,retry,total:questions.length};
}
