const catalogRoot=document.querySelector('#catalog-grid');
const gradeTabs=document.querySelector('#grade-tabs');
const searchInput=document.querySelector('#catalog-search');
const titleCount=document.querySelector('#catalog-count');
const note=document.querySelector('#catalog-note');
let catalogData=null;
let selectedGrade=1;
const escapeHtml=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
function renderCatalog(){
 if(!catalogData)return;
 const grade=catalogData.grades.find(g=>g.grade===selectedGrade);
 const query=searchInput.value.trim().toLocaleLowerCase();
 const all=grade.groups.flatMap(g=>g.lessons);
 const ready=all.filter(item=>item.status==='available').length;
 titleCount.textContent=`${grade.label} ${all.length}강 · 학습 가능 ${ready}강`;
 note.textContent=grade.confirmed?'8종 교과서의 공통 문법을 묶은 커리큘럼 초안이야.':'중'+selectedGrade+' 커리큘럼은 구성 초안이며, 문항 제작 전이야.';
 gradeTabs.querySelectorAll('[data-grade]').forEach(tab=>{
   const sel=Number(tab.dataset.grade)===selectedGrade;
   tab.classList.toggle('active',sel);tab.setAttribute('aria-selected',String(sel));
   tab.querySelector('span')?.remove();
   const extra=document.createElement('span');extra.textContent=`${all.length}강`; if(sel)tab.appendChild(extra);
 });
 let totalMatched=0;
 const parts=grade.groups.map((group,idx)=>{
   const matches=group.lessons.filter(lesson=>!query||lesson.title.toLocaleLowerCase().includes(query));
   if(!matches.length)return '';
   totalMatched+=matches.length;
   const cards=matches.map(lesson=>{
      const available=lesson.status==='available';
      return `<article class="lesson-card ${available?'lesson-ready':'lesson-soon'}">
        <div class="lesson-card-top"><span class="lesson-number">${escapeHtml(lesson.id.replace(/^G\d-/,''))}</span><span class="lesson-status ${available?'open':'closed'}">${available?'학습 가능':'준비 중'}</span></div>
        <h4>${escapeHtml(lesson.title)}</h4>
        <div class="lesson-card-bottom"><span>${available?`${lesson.questionCount}문제 · 해설 포함`:'차례대로 공개 예정'}</span>${available?'<a class="lesson-open" href="#practice" aria-label="be동사 문제 풀러 가기">문제 풀기 →</a>':'<span class="lesson-disabled" aria-label="아직 열리지 않은 단원">곧 만나요</span>'}</div>
      </article>`;
   }).join('');
   return `<section class="catalog-group" aria-label="${escapeHtml(group.group)}"><div class="catalog-group-heading"><h3>${escapeHtml(group.group)}</h3><span>${matches.length}강</span></div><div class="lesson-grid">${cards}</div></section>`;
 }).join('');
 catalogRoot.innerHTML=totalMatched?parts:'<div class="catalog-empty">일치하는 문법이 없어. 다른 검색어를 입력해 봐.</div>';
}
gradeTabs.addEventListener('click',e=>{
 const button=e.target.closest('[data-grade]');if(!button)return;
 selectedGrade=Number(button.dataset.grade); searchInput.value='';renderCatalog();
});
searchInput.addEventListener('input',renderCatalog);
async function initCatalog(){
 try{
  const r=await fetch('/data/course-catalog.json',{cache:'no-cache'});if(!r.ok)throw new Error('문법 단원 목록 오류');
  const data=await r.json();if(!Array.isArray(data.grades)||data.grades.length!==3)throw new Error('목록 데이터 형식 오류');
  catalogData=data;renderCatalog();
 }catch(err){catalogRoot.innerHTML='<div class="catalog-empty">문법 목록을 불러오지 못했어. 페이지를 새로고침해 줘.</div>';console.error(err);}
}
initCatalog();
