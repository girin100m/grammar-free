# 배포 방법: 추천은 GitHub 연동

## A안 — GitHub + Cloudflare Pages (추천)

장점: 앞으로 문제를 추가할 때 GitHub에 올리면 사이트가 자동 업데이트됩니다.

1. `GRIT_중1_be동사_온라인문법사이트_v0.1_프로젝트.zip`을 풉니다.
2. 안쪽 `grammar-site-v0.1` 폴더 내 파일을 모두 GitHub 저장소의 **최상위 폴더**에 업로드합니다.
3. Cloudflare → Workers & Pages → Pages → Connect to Git → GitHub 저장소를 선택합니다.
4. 빌드 명령 `npm run build`, 출력 디렉터리 `dist`, 루트 디렉터리는 비웁니다.
5. 배포 후 제공되는 `*.pages.dev` 주소로 이용합니다.

## B안 — Cloudflare Pages 직접 업로드 (빠른 공개 테스트)

1. `GRIT_중1_be동사_v0.1_Cloudflare바로업로드.zip` 파일을 받습니다.
2. Cloudflare → Workers & Pages → Create application → Pages → **Use direct upload** 선택.
3. 프로젝트 이름을 정하고 업로드 화면에 ZIP 파일을 끌어다 놓습니다.
4. Deploy 버튼을 누르면 테스트 웹주소가 생성됩니다.

**중요:** Cloudflare Pages에서 직접 업로드 방식으로 만든 프로젝트는 나중에 같은 프로젝트를 Git 연동 방식으로 **전환할 수 없습니다**. 코드 수정·자동 배포를 이어갈 계획이라면 처음부터 A안을 선택하세요. (Cloudflare 공식 안내)

## 공통 주의사항

- 로컬에서 HTML 파일을 더블클릭하는 방식이 아니라, 배포된 URL로 Safari/Chrome에서 열어야 합니다.
- 사이트는 로그인·서버 DB 없이 브라우저 로컬 저장소를 사용합니다.
- 배포는 현재 프로젝트 파일만으로 가능합니다. 다만 실제 배포 버튼 클릭 및 계정 연결은 사용자 Cloudflare/GitHub 계정에서 수행해야 합니다.
