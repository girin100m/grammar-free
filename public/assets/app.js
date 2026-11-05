import {answerParts, isAnswered, gradeQuestion, expectedAnswer, acceptedVariants, summary} from './grading.js';
import {findLesson,storageKeyForLesson,validateBank} from './units.js';

// The be동사 key stays unchanged to preserve all existing student progress.
let STORAGE_KEY = storageKeyForLesson('G1-01');
let activeLesson = null;
const QUESTIONS_PER_PAGE = 10;
const root = document.querySelector('#questions');
const $ = selector => document.querySelector(selector);
const escapeHTML = value => String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const NEW_STATE = () => ({ mainAnswers:{}, mainResults:{}, retryAnswers:{}, retryResults:{}, retryPool:[] });
let state = NEW_STATE();
let questions = [];
let mode = 'all';
let kind = 'all';
let level = 'all';
let page = 0;
let storageAvailable = true;
let toastTimeout;
let quizInView = false;
function syncMobileActions() { const bar=$('#mobile-actions'); if (bar) bar.hidden = !quizInView || filtered().length === 0; }
function watchQuizVisibility() {
  const quiz=$('#practice');
  if (!('IntersectionObserver' in window)) {quizInView=true;return;}
  const observer=new IntersectionObserver(entries=>{quizInView=entries.some(entry=>entry.isIntersecting);syncMobileActions();},{threshold:0});
  observer.observe(quiz);
}

function loadStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    for (const key of ['mainAnswers','mainResults','retryAnswers','retryResults']) {
      if (saved[key] && typeof saved[key] === 'object' && !Array.isArray(saved[key])) state[key] = saved[key];
    }
    if (Array.isArray(saved.retryPool)) state.retryPool = saved.retryPool.filter(id => typeof id === 'string');
  } catch (e) { storageAvailable = false; }
}
function saveStorage() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); storageAvailable = true; }
  catch { storageAvailable = false; }
}
function alertToast(message) {
  const el = $('#toast'); el.textContent = message; el.hidden = false;
  clearTimeout(toastTimeout); toastTimeout = setTimeout(() => {el.hidden = true;}, 3200);
}
function activeAnswers() {return mode === 'all' ? state.mainAnswers : state.retryAnswers;}
function activeResults() {return mode === 'all' ? state.mainResults : state.retryResults;}
function filtered() {
  const pool = new Set(state.retryPool);
  return questions.filter(q => (mode === 'all' || pool.has(q.id)) && (kind === 'all' || q.kind === kind) && (level === 'all' || q.level === level));
}
function currentPage() {return filtered().slice(page*QUESTIONS_PER_PAGE,(page+1)*QUESTIONS_PER_PAGE);}
function statusLabel(status) {return ({correct:'정답이에요!',wrong:'다시 확인해 보세요',review:'허용 답안과 비교해 주세요'})[status]||'';}
function feedbackHTML(q, result) {
  if (!result || result.status === 'unanswered') return '';
  const status=result.status;
  const icon=status==='correct'?'✓':status==='wrong'?'↻':'?';
  const accepted=acceptedVariants(q);
  return `<div class="feedback ${status}" aria-live="polite"><div class="feedback-header"><span aria-hidden="true">${icon}</span>${escapeHTML(statusLabel(status))}${result.selfChecked?' · 스스로 확인한 답안':''}</div>
    <div class="feedback-body"><div class="feedback-answer">정답: ${escapeHTML(expectedAnswer(q))}</div>
    ${accepted.map(a=>`<div class="feedback-accepted">허용 답안 — ${escapeHTML(a)}</div>`).join('')}
    <p class="feedback-explanation"><strong>해설</strong> ${escapeHTML(q.explanation)}</p>
    ${status==='review'?`<p class="feedback-accepted">입력한 문장이 허용 답안 목록과 일치하지 않아요. 정답과 비교해 뜻·어순·문법이 모두 맞는지 확인해 주세요. 이 결과는 자동 오답 판정이 아닙니다.</p><div class="self-grade"><button type="button" data-self-grade="correct" data-id="${escapeHTML(q.id)}">내 답도 맞아요</button><button type="button" data-self-grade="wrong" data-id="${escapeHTML(q.id)}">다시 풀래요</button></div>`:''}
    </div></div>`;
}
function questionHTML(q) {
  const answer=activeAnswers()[q.id];
  const result=activeResults()[q.id];
  const position=Number(q.display_no) || questions.indexOf(q)+1;
  const options=q.kind==='객관식' ? `<div class="choice-list" role="radiogroup" aria-label="${escapeHTML(q.id)} 답안 선택">${q.options.map((option,i)=>`<label class="choice"><input type="radio" name="${escapeHTML(q.id)}" value="${i}" data-id="${escapeHTML(q.id)}" data-type="mc" ${String(answer??'')===String(i)?'checked':''} /><span class="choice-index" aria-hidden="true">${['①','②','③','④'][i]??(i+1)}</span><span class="choice-text">${escapeHTML(option)}</span></label>`).join('')}</div>`:
    `<div class="answer-fields">${answerParts(q).map((_,i)=>`<div class="answer-field"><label for="input-${escapeHTML(q.id)}-${i}">${answerParts(q).length===1?'내 답안':`답안 ${i+1}`}</label><input id="input-${escapeHTML(q.id)}-${i}" type="text" data-type="text" data-id="${escapeHTML(q.id)}" data-part="${i}" value="${escapeHTML(Array.isArray(answer)?answer[i]??'':(i===0?answer??'':''))}" placeholder="영어로 입력하세요" autocomplete="off" spellcheck="false" /></div>`).join('')}</div><p class="answer-tip">대소문자와 문장 끝 마침표 차이는 채점에서 무시해요.</p>`;
  return `<article class="question-card ${result?.status??''}" id="question-${escapeHTML(q.id)}"><div class="question-meta"><span class="question-no">Q${String(position).padStart(2,'0')}</span><span class="pill kind">${escapeHTML(q.kind)}</span><span class="pill level-${escapeHTML(q.level)}">${escapeHTML(q.level)}</span><span class="qid">${escapeHTML(q.id)}</span></div><div class="guide">${escapeHTML(q.guide)}</div><div class="question-text">${escapeHTML(q.question)}</div>${options}${feedbackHTML(q,result)}</article>`;
}
function updateStats() {
  const s=summary(questions,state.mainAnswers,state.mainResults,state.retryPool);
  const values=[s.answered,s.graded,s.correct,s.retry];
  for (const [i,node] of [...document.querySelectorAll('.stat strong')].entries()) node.textContent=String(values[i]);
  const percent=Math.round(100*s.answered/(s.total||1));
  $('#progress-percent').textContent=`${percent}%`;
  $('#progress-fill').style.width=`${percent}%`;
  $('#tab-review-count').textContent=String(s.retry);
  const mobile=$('#mobile-page-label'); if(mobile)mobile.textContent=mode==='review'?'오답 다시 풀기':`${page*QUESTIONS_PER_PAGE+1}~${Math.min((page+1)*QUESTIONS_PER_PAGE,filtered().length)}번 풀이`; 
  const end=$('.data-section p');
  if (!storageAvailable && end && !end.textContent.includes('저장할 수 없습니다')) {
    end.textContent+=' 현재 브라우저에서는 저장할 수 없습니다. 일반 브라우저 모드에서 이용해 주세요.';
  }
}
function renderPageNumbers(totalPages) {
  $('#page-numbers').innerHTML=Array.from({length:totalPages},(_,i)=>`<button class="page-number ${i===page?'current':''}" type="button" data-go-page="${i}" aria-label="${i+1}페이지로 이동" ${i===page?'aria-current="page"':''}>${i+1}</button>`).join('');
  $('#page-filter').innerHTML=Array.from({length:totalPages},(_,i)=>`<option value="${i}" ${i===page?'selected':''}>${i+1} / ${totalPages}페이지</option>`).join('');
}
function render() {
  const items=filtered();
  const totalPages=Math.ceil(items.length/QUESTIONS_PER_PAGE);
  if (page >= totalPages) page=Math.max(0,totalPages-1);
  const display=currentPage();
  document.querySelectorAll('[data-mode]').forEach(el=>{const active=el.dataset.mode===mode; el.classList.toggle('active',active);el.setAttribute('aria-selected',String(active));});
  $('#kind-filter').value=kind;$('#level-filter').value=level;
  $('#results-info').textContent=items.length?`${mode==='all'?'전체':'오답 재도전'} · ${items.length}문항 중 ${page*10+1}–${Math.min((page+1)*10,items.length)}번 표시`:`${mode==='review'?'현재 복습할 문제가 없어요.':'선택한 조건에 맞는 문제가 없어요.'}`;
  if (!items.length) {
    root.innerHTML=`<div class="empty-state"><div class="empty-state-icon">${mode==='review'?'🎉':'🔎'}</div><h3>${mode==='review'?'복습할 문제가 없어요!':'조건에 맞는 문제가 없어요'}</h3><p>${mode==='review'?'전체 문제에서 먼저 채점하거나, 복습 문제를 모두 해결했다면 다른 문제에 도전해 보세요.':'다른 유형이나 난이도를 선택해 보세요.'}</p><button type="button" class="ghost-button" data-go-all="true">전체 문제 보기</button></div>`;
  } else root.innerHTML=display.map(questionHTML).join('');
  $('#quiz-footer').hidden=!items.length;
  const mobileBar=$('#mobile-actions');if(mobileBar)mobileBar.hidden=!items.length || !quizInView;
  $('#prev-button').disabled=page<=0;
  $('#next-button').disabled=page>=totalPages-1;
  $('#grade-button').textContent=mode==='all'?'이 페이지 채점하기 →':'복습 답안 채점하기 →';
  renderPageNumbers(totalPages);
  updateStats();
}
function goPage(next){page=Math.max(0,Math.min(Math.ceil(filtered().length/10)-1,next));render();$('#questions').scrollIntoView({behavior:'smooth',block:'start'});}
function updateAnswer(el){
  const id=el.dataset.id, q=questions.find(item=>item.id===id);if(!q)return;
  const answers=activeAnswers();
  if(el.dataset.type==='mc') answers[id]=el.value;
  else {const a=Array.isArray(answers[id])?[...answers[id]]:[];a[Number(el.dataset.part)]=el.value;answers[id]=a;}
  delete activeResults()[id];
  const parent=el.closest('.question-card');parent.classList.remove('wrong','correct','review');parent.querySelector('.feedback')?.remove();
  saveStorage();updateStats();
}
function gradeCurrentPage(){
  let scored=0,unanswered=0, flagged=0;
  const answers=activeAnswers(),results=activeResults();
  const pool=new Set(state.retryPool);
  for(const q of currentPage()){
    const r=gradeQuestion(q,answers[q.id]);
    if(r.status==='unanswered'){unanswered++;delete results[q.id];continue;}
    results[q.id]=r;scored++;
    if(r.status==='correct')pool.delete(q.id);
    else{pool.add(q.id);flagged++;}
  }
  state.retryPool=[...pool];saveStorage();render();
  alertToast(scored===0?'먼저 답안을 입력해 주세요.':`채점 완료 ${scored}문제${unanswered?` · 미응답 ${unanswered}문제`:''}${flagged?` · 복습 ${flagged}문제`:''}`);
}
function selfGrade(id,newStatus){
  const q=questions.find(q=>q.id===id);if(!q)return;
  const current=activeResults()[id];if(current?.status!=='review')return;
  activeResults()[id]={status:newStatus,selfChecked:true};
  const pool=new Set(state.retryPool);
  if(newStatus==='correct')pool.delete(id);else pool.add(id);
  state.retryPool=[...pool];saveStorage();render();alertToast(newStatus==='correct'?'자가 확인 결과 정답으로 반영했어요.':'복습 목록에 남겨 두었어요.');
}
function exportRecord(){
  const payload={exportedAt:new Date().toISOString(),schema:'munbeopbaro-v04',lessonId:activeLesson.id,unit:`${activeLesson.gradeLabel} ${activeLesson.title}`,...state};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=`${activeLesson.id}-study-${new Date().toISOString().slice(0,10)}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
  alertToast('학습 기록 JSON 파일을 내려받았어요.');
}
function resetRecord(){
  if(!confirm(`이 브라우저에 저장된 ${activeLesson.title} 풀이·채점·오답 기록만 사라집니다. 초기화할까요?`))return;
  state=NEW_STATE();try{localStorage.removeItem(STORAGE_KEY);}catch{}mode='all';kind='all';level='all';page=0;render();alertToast('학습 기록을 초기화했어요.');
}
function attachEvents(){
  root.addEventListener('change',e=>{if(e.target.matches('[data-type="mc"]'))updateAnswer(e.target);});
  root.addEventListener('input',e=>{if(e.target.matches('[data-type="text"]'))updateAnswer(e.target);});
  root.addEventListener('click',e=>{
    const self=e.target.closest('[data-self-grade]');if(self){selfGrade(self.dataset.id,self.dataset.selfGrade);return;}
    if(e.target.closest('[data-go-all]')){mode='all';kind='all';level='all';page=0;render();}
  });
  document.querySelectorAll('[data-mode]').forEach(el=>el.addEventListener('click',()=>{mode=el.dataset.mode;page=0;render();}));
  $('#kind-filter').addEventListener('change',e=>{kind=e.target.value;page=0;render();});
  $('#level-filter').addEventListener('change',e=>{level=e.target.value;page=0;render();});
  $('#page-filter').addEventListener('change',e=>goPage(Number(e.target.value)));
  $('#prev-button').addEventListener('click',()=>goPage(page-1));
  $('#next-button').addEventListener('click',()=>goPage(page+1));
  $('#grade-button').addEventListener('click',gradeCurrentPage);
  $('#mobile-grade-button')?.addEventListener('click',gradeCurrentPage);
  $('#continue-button')?.addEventListener('click',()=>{
    mode='all';kind='all';level='all';
    const first=questions.findIndex(q=>!isAnswered(q,state.mainAnswers[q.id]));
    page=Math.floor((first<0?0:first)/QUESTIONS_PER_PAGE);render();
    $('#practice').scrollIntoView({behavior:'smooth',block:'start'});
  });
  $('#page-numbers').addEventListener('click',e=>{const el=e.target.closest('[data-go-page]');if(el)goPage(Number(el.dataset.goPage));});
  $('#export-button').addEventListener('click',exportRecord);
  $('#reset-button').addEventListener('click',resetRecord);
}
function updateLessonLabels(){
  const name=`${activeLesson.gradeLabel} · ${activeLesson.title} ${activeLesson.questionCount}문제`;
  $('#practice .quiz-heading h2').textContent=name;
  $('#practice .quiz-label').textContent=`문법 ${activeLesson.id.split('-')[1]}`;
  $('#tab-all span').textContent=String(activeLesson.questionCount);
  document.querySelectorAll('.stat small').forEach((el,i)=>{if(i<2)el.textContent=`/ ${activeLesson.questionCount}문제`;});
  $('#continue-button').textContent=`${activeLesson.title} 이어 풀기 ↗`;
  $('#practice').setAttribute('aria-label',`${activeLesson.gradeLabel} ${activeLesson.title} 문제 풀이`);
}
async function init(){
  attachEvents();watchQuizVisibility();
  try{
    const catalogResponse=await fetch('/data/course-catalog.json',{cache:'no-cache'});
    if(!catalogResponse.ok)throw new Error(`단원 목록 서버 응답 ${catalogResponse.status}`);
    const catalog=await catalogResponse.json();
    const params=new URLSearchParams(window.location.search);
    activeLesson=findLesson(catalog,params.get('unit'));
    if(!activeLesson)throw new Error('학습 가능한 단원이 없어요.');
    STORAGE_KEY=storageKeyForLesson(activeLesson.id);
    updateLessonLabels();
    const res=await fetch(activeLesson.questionBank,{cache:'no-cache'});
    if(!res.ok)throw new Error(`문제은행 서버 응답 ${res.status}`);
    questions=validateBank(activeLesson,await res.json());
    // Only load records after identifying the lesson; be동사 keeps its legacy key.
    loadStorage();
    const validIds=new Set(questions.map(q=>q.id));
    state.retryPool=state.retryPool.filter(id=>validIds.has(id));
    render();
  }catch(err){
    console.error('문제은행 로딩 실패:',err);
    root.innerHTML=`<div class="empty-state"><div class="empty-state-icon">⚠</div><h3>문제를 불러오지 못했어요</h3><p>새로고침하거나 문법 목록에서 다른 단원을 선택해 줘.</p><p class="file-tip">오류: ${escapeHTML(err.message)}</p></div>`;
    $('#results-info').textContent='문제 로드 실패';
  }
}
init();
