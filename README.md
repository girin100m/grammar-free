# 문법바로 v0.4 — 공통 문제풀이 엔진 + 일반동사 100문항

중1~중3 문법 단원 목록을 기반으로, 제공된 모든 단원이 **동일한 객관식·주관식 채점 엔진**을 사용하는 무료 정적 학습 사이트입니다.

## 현재 공개 단원
- **중1 be동사**: 기존 100문항. 문제 원본 `public/data/be-verb-100.json`은 **변경하지 않았습니다.**
- **중1 일반동사**: 신규 100문항 (`public/data/general-verbs-100.json`), 객관식 50 + 주관식 50, 난이도 기초 30 / 기본 40 / 심화 30. 현재형, 3인칭 단수, do/does 부정·의문문, 단답형, 수 일치 등을 다룹니다.
- 다른 단원은 문제은행이 준비되지 않았으므로 여전히 **준비 중**으로 표시합니다.

## 동작 방식
1. `public/data/course-catalog.json`의 `status: "available"`인 강의 카드에 `?unit=강의ID#practice` 링크가 자동으로 생깁니다.
2. `public/assets/units.js`가 선택 단원의 문제은행 주소와 학년·제목을 찾고 기본 형식을 검사합니다.
3. `public/assets/app.js`는 두 단원에서 동일한 10문항씩 풀이, 채점, 필터, 오답 재도전, 기록 저장/초기화를 제공합니다.
4. **학습 기록은 단원별로 분리**해 브라우저 `localStorage`에 저장합니다.
   - be동사: **`grit-grammar:be-verb:v01` 유지** — 기존 기록을 새 버전에서도 그대로 읽습니다.
   - 일반동사: `munbeopbaro:G1-02:v01` — be동사 기록을 덮어쓰지 않습니다.
   - **기록 삭제**는 현재 선택한 단원의 기록에만 적용됩니다.
5. `?unit=G1-02#practice`로 일반동사 단원에 직접 접근할 수 있습니다.

## 다른 단원 추가 방법
새 문제은행을 `public/data/새-단원.json`으로 저장한 다음, `course-catalog.json`의 해당 `lesson`에 `status: "available"`, 정확한 `questionCount`, `questionBank: "/data/새-단원.json"`을 지정합니다. 페이지나 채점 코드를 복제할 필요는 없습니다. 신규 단원마다 별도 기록 키가 자동으로 적용됩니다. 검증 스크립트의 지원 ID 규칙과 단원 수 검증도 업데이트해야 합니다.

## 로컬 검증
```bash
npm run validate
npm test
npm run build
npm run dev
```

현재 자동화 테스트 13개와 정적 빌드 검증을 통과했습니다. 자동 테스트는 영어 문장의 모든 의미적 모호성을 확인해주지 못하므로 **학생에게 배포하기 전 교사 최종 검수**가 필요합니다. 신규 100문항은 AI 생성 초안임을 `review` 필드에 명시했습니다.

## 배포
기존 `grammar-free` Cloudflare Workers 프로젝트를 유지합니다.
- Build: `npm run build`
- Deploy: `npx wrangler deploy --name grammar-free --assets ./dist --compatibility-date 2026-11-04`

Cloudflare 빌드가 정상 동작할 때는 PR을 `main`에 병합하면 자동 배포됩니다. `Initializing` 장애가 반복될 경우 로컬에서 `npm run build` 후 `npx wrangler login` 및 위 배포 명령을 사용하면 됩니다.

## 저작권 / 글꼴
로고는 사용자와 함께 생성하여 확정한 시안을 사용합니다. G마켓 산스와 SUIT는 외부 CSS로 불러오며, 폰트 파일은 프로젝트에 포함하지 않습니다.
