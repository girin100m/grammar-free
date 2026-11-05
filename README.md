# 문법바로 v0.2 — 중1 be동사 100문제

기존 **grammar-free** GitHub 저장소에 파일을 덮어쓰면 자동 배포되는 무료 중학 영문법 학습 사이트입니다.

## 이번 디자인 업데이트

- 서비스 브랜드: GRIT Grammar Lab → **문법바로**
- 한글 중심의 친근한 문구, 아이보리·딥네이비·머스타드 색상
- 큰 제목: **G마켓 산스**, 문제·본문: **SUIT** 웹폰트 사용(CDN 연결, 폰트 파일 동봉하지 않음)
- 모바일 학습 화면 및 하단 고정 채점 조작 개선
- 기존 100문제·정답·해설·오답노트·자동 저장 기능 유지
- **기존 학습 기록 유지**: `localStorage` 키를 변경하지 않음

## 지금 쓰는 Cloudflare Workers 배포 방식

1. 다운로드 ZIP 압축 해제.
2. GitHub `girin100m/grammar-free` 저장소에 **압축 푼 폴더 안의 모든 파일·폴더**를 업로드하고 기존 파일을 덮어씁니다. `public`, `scripts`, `tests`, `docs`, `package.json`은 저장소 루트에 위치해야 합니다.
3. Cloudflare Workers의 Git 연결 자동 배포가 실행됩니다. 기존 설정을 그대로 사용하세요.
   - Build command: `npm run build`
   - Deploy command: `npx wrangler deploy --name grammar-free --assets ./dist --compatibility-date 2026-11-04`
4. 배포 완료 후 `https://grammar-free.girin100m.workers.dev`에서 확인합니다. 이전 버전이 보이면 강력 새로고침하거나 시크릿 창에서 확인하세요.

**주의:** GitHub 웹 업로드에서 파일이 기존 파일 위에 덮어써지지 않는 경우, 저장소 웹 편집 기능이나 git 푸시로 업데이트해 주세요. `dist/`는 빌드로 재생성되니 GitHub에 업로드하지 않아도 됩니다.

## 로컬 실행 및 데이터 검증

Node.js 20 이상에서:

```bash
npm run validate
npm test
npm run build
npm run dev
```

`http://localhost:4173`에서 확인할 수 있습니다.

- 자료: `public/data/be-verb-100.json` (객관식 50 / 주관식 50 / 난이도 30:40:30)
- 화면: `public/index.html`
- 디자인: `public/assets/styles.css`
- 학습·채점 UI: `public/assets/app.js`, `public/assets/grading.js`
- 문항 자체의 문법적 모호성은 교사가 최종 검수해야 합니다.
- 주관식 자유 답변은 등록된 허용 표현 외에는 **검토 필요**로 표시할 수 있습니다.
- 학습 데이터는 브라우저 저장소에만 있으며 다른 기기와 동기화하지 않습니다.

## 폰트 및 라이선스

웹폰트는 각각 공개 CDN에서 로드되며 폰트 바이너리 파일을 프로젝트 ZIP에 포함하지 않았습니다. 공식 배포 페이지에서 이용 조건과 라이선스를 확인할 수 있습니다.

- G마켓 산스: https://corp.gmarket.com/fonts/
- SUIT: https://github.com/sun-typeface/SUIT

네트워크 차단이나 CDN 오류가 발생하면 기기 시스템 글꼴로 표시됩니다.
