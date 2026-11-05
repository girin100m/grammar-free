# GRIT Grammar Lab — 중1 be동사 100문제 v0.1

회원가입 없이 중1 be동사 100문제를 온라인으로 학습하는 **정적 웹사이트**입니다.

## 구현된 기능

- 원본 문제은행 100개 연결(객관식 50개/주관식 50개, 기초 30개/기본 40개/심화 30개)
- **10문제씩** 표시, 유형·난이도 필터, 페이지 이동
- 객관식 즉시 채점, 주관식 허용답안 비교(복수 정답·축약형 처리)
- 문항별 정답, 상세 해설, 허용 답안 표시
- 틀렸거나 검토가 필요한 문제를 모아 다시 풀기
- `localStorage`를 통한 자동 저장(회원가입/서버/DB 불필요)
- 학습 기록 JSON 내려받기, 전체 초기화
- 모바일 Safari/Chrome/PC 반응형 UI

## 왜 React가 아닌 정적 JS인가요?

v0.1에서 중요한 것은 **학생들이 모바일에서 안정적으로 문제를 풀고, GitHub/Cloudflare에 무료로 배포하는 것**입니다. 이 프로젝트는 React 빌드 의존성을 의도적으로 배제해 패키지 설치 없이도 바로 실행할 수 있게 만들었습니다. 향후 로그인·문제관리·데이터베이스를 도입할 때 React로 확장 가능합니다.

## 로컬 실행

Node.js 20 이상에서 터미널을 열어 프로젝트 폴더로 이동한 후:

```bash
npm run validate
npm test
npm run dev
```

브라우저에서 `http://localhost:4173` 접속. 중지하려면 터미널에서 Ctrl+C.

**주의:** `public/index.html` 파일을 더블클릭하거나 아이폰 파일 미리보기로 열면 JSON을 불러오지 못합니다. **웹서버**로 접속해야 합니다.

## Cloudflare Pages 배포: GitHub 연동

1. `https://github.com/new`에서 저장소를 생성합니다(예: `grit-grammar-lab`).
2. 이 ZIP의 `grammar-site-v0.1` 폴더 **안에 있는 파일과 폴더 전체**를 저장소 루트에 업로드합니다. `public` 폴더 안의 `index.html`만 업로드하는 것이 아닙니다.
3. [Cloudflare 대시보드](https://dash.cloudflare.com/) → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**에서 위 GitHub 저장소를 선택합니다.
4. 다음 빌드 설정을 입력합니다.

   | 설정 | 값 |
   |---|---|
   | Framework preset | None 또는 없음 |
   | Production branch | `main` |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Root directory | (비워 둠, 저장소 루트) |
   | Node.js version | 20 이상 |

5. **Save and Deploy** 후 발급된 `https://프로젝트명.pages.dev` 주소를 아이폰 Safari 등에서 엽니다.
6. 이후 GitHub에 변경 사항을 푸시하면 사이트가 다시 배포됩니다.

> 이 프로젝트의 빌드는 별도 npm 패키지 설치 없이 `public/`을 검증한 뒤 `dist/`로 복사합니다. `dist/` 폴더는 생성물이므로 GitHub에 업로드하지 않아도 됩니다.

## 폴더 설명

```
grammar-site-v0.1/
├── public/
│   ├── index.html             # 사이트 첫 화면
│   ├── assets/
│   │   ├── styles.css         # 반응형 디자인
│   │   ├── app.js             # 풀이·채점·복습·저장 UI
│   │   ├── grading.js         # 순수 채점 로직
│   │   └── favicon.svg
│   └── data/
│       └── be-verb-100.json   # 이전에 만든 문제 100개 그대로 포함
├── scripts/
│   ├── validate-data.mjs      # 데이터 구조 검증
│   ├── build.mjs              # Cloudflare 빌드
│   └── dev-server.mjs         # 로컬 서버
├── tests/
│   └── grading.test.mjs       # 자동 채점 단위 테스트
└── package.json
```

## 온라인 자동 채점의 한계

- 주관식 허용 답안은 원본 JSON의 `answer_parts`에 정의되어 있습니다. 원본의 `accepted_answers`만 보지 않고 **`answer_parts`를 우선 사용**하므로 Q14, Q16, Q17, Q19, Q20 같은 변형 답안을 인식합니다.
- 기초적인 단어형 빈칸은 명확한 오답으로 분류합니다. 다만 문장 전체를 쓰는 자유 영작은 등록된 답안에 일치하지 않더라도 문법적으로 맞을 수 있으므로 **검토 필요**로 표시합니다. 학생은 표준 답안·해설과 비교해 자가 확인할 수 있습니다.
- 실제 학교 시험용으로 배포하기 전에 **교사 최종 검수**가 필요합니다. 코드 테스트는 문항의 문법적 완전성을 증명하지 않습니다.

## 학생 기록과 개인정보

회원가입, 이름, 전화번호를 수집하지 않습니다. 답안과 채점 기록은 브라우저의 `localStorage`에만 저장하며 서버에 업로드하지 않습니다. 다른 기기 또는 시크릿 모드와 기록을 자동 동기화하지 않습니다. 사이트 데이터 삭제 시 기록이 사라질 수 있으므로 학습 기록 다운로드 기능을 제공합니다.

## 현재 제공하지 않는 기능

학생 계정·교사 승인 화면·Supabase 연동·유튜브 강의 자동 연결·교과서별 매핑·광고·통계 분석·클라우드 동기화. 이 기능들은 후속 버전에서 별도로 구축해야 합니다.

## 원본 데이터와의 차이

파일 `docs/QUESTION_CHANGES.md`를 참고하세요. 검증 과정에서 동일한 제시 문장 2개와 짧은 해설 3개를 수정했습니다. 100문항의 ID 및 분포는 그대로 유지했습니다.
