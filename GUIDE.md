# Quiet Bloom — 실행 · 공유 · 배포 안내

향과 자극에 민감한 사람을 위한 풀부케 구성 서비스 **Quiet Bloom**의 모바일 웹 화면입니다.
이 문서 하나로 새 컴퓨터에서 화면을 띄우고, 수정한 내용을 올리고, 배포할 수 있게 정리했습니다.

- **저장소:** https://github.com/yijoonie-ux/QUIET-BLOOM-UI (GitHub 계정 `yijoonie-ux`)
- **만든 것:** React 19 · Vite 8 · react-router 7 · 순수 CSS. 서버·데이터베이스 없음 (데이터는 모두 `src/data/`의 예시 데이터)
- **기준 화면:** iPhone 13 (390×844)

---

## 1. 새 컴퓨터에서 처음 시작하기

처음 한 번만 하면 됩니다. 파일을 USB로 옮길 필요 없이 GitHub에서 내려받습니다.

1. **설치**
   - GitHub Desktop: https://desktop.github.com → `yijoonie-ux`로 로그인
   - Node.js: https://nodejs.org → **LTS** 버전 (22 이상)
   - VS Code: https://code.visualstudio.com
2. **내려받기:** GitHub Desktop → **File → Clone repository** → `yijoonie-ux/QUIET-BLOOM-UI` 선택 → 저장 위치 고르고 **Clone**
3. **열기:** GitHub Desktop에서 **Open in Visual Studio Code**
4. **필요한 패키지 설치:** VS Code에서 `` Ctrl+` ``로 터미널을 열고

   ```
   npm install
   ```

   (몇 분 걸립니다. 컴퓨터마다 처음 한 번만)

## 2. 화면 띄우기

VS Code 터미널에서:

```
npm run dev -- --host
```

| 어디서 | 주소 | 조건 |
|---|---|---|
| 이 컴퓨터 | http://localhost:5173/ | 터미널이 켜져 있는 동안 |
| 휴대폰 | 터미널의 `Network:` 줄에 나온 주소 (예: `http://192.168.45.245:5173/`) | 컴퓨터와 **같은 와이파이** |

- **PC 브라우저**에서는 아이폰 목업 안에 앱이 보입니다. 목업 없이 보려면 주소 뒤에 `?frame=off`를 붙입니다.
- **휴대폰 사파리**에서 **공유 → 홈 화면에 추가**하면 주소창 없는 앱처럼 열립니다.
- 터미널을 닫거나 컴퓨터를 끄면 화면도 꺼집니다. 다시 `npm run dev -- --host`를 실행하면 됩니다.
- 와이파이 주소(`192.168…`)는 공유기에 따라 바뀔 수 있으니 매번 터미널에 나온 주소를 씁니다.
- 외부 데이터·다른 와이파이에서 보려면 아래 **4. 배포**가 필요합니다.

## 3. 수정한 내용 올리기 · 받기

집 컴퓨터와 회사 컴퓨터 둘 다에서 작업한다면 이 순서를 지키면 내용이 엇갈리지 않습니다.

- **작업 시작 전 (받기):** GitHub Desktop → **Fetch origin** → **Pull origin**
- **작업 끝 (올리기):**
  1. 왼쪽 **Changes** 탭에 바뀐 파일이 뜹니다.
  2. 왼쪽 아래 **Summary**에 한 줄 메모 (예: `홈 카드 여백 수정`) → **Commit to main**
  3. 위쪽 **Push origin**
- 화면에 **No local changes**가 나오면 모두 올라간 상태입니다.
- 같은 저장소를 새로 만들어 다시 올리지 않습니다. 저장소가 두 개가 되어 헷갈립니다.

## 4. 배포 (외부에서 열리는 주소 만들기)

배포하면 `https://….vercel.app` 같은 주소가 생기고, 어떤 인터넷에서든 열립니다.

| 항목 | 값 |
|---|---|
| 프레임워크 | Vite |
| 설치 명령 | `npm install` |
| 빌드 명령 | `npm run build` |
| 결과 폴더 | `dist` |
| Node 버전 | 22 이상 |

- **Vercel · Netlify:** 저장소를 연결하면 위 값이 자동으로 잡힙니다. 화면 주소(`/compose`, `/blooms/still` 등)에서 새로고침해도 404가 나지 않도록 `vercel.json`, `public/_redirects`를 넣어 두었습니다.
- **GitHub Pages:** 무료 계정은 저장소를 **공개(Public)** 로 바꿔야 하고, 주소가 `/QUIET-BLOOM-UI/` 아래로 잡혀서 `vite.config.js`에 `base` 설정을 추가해야 합니다.
- 저장소가 **비공개(Private)** 여도 Vercel · Netlify로 배포한 사이트는 누구나 볼 수 있습니다. 비공개는 "코드"를 누가 보는지에 대한 설정입니다.
- 다른 사람이 배포하려면 저장소에 초대가 필요합니다: GitHub 저장소 → **Settings → Collaborators → Add people**.
  (공개 저장소로 바꾸려면 **Settings → 맨 아래 Danger Zone → Change visibility → Make public**)

## 5. GitHub에 없는 파일

용량 제한(100MB) 때문에 아래 파일은 GitHub에 올리지 않았습니다. 앱 화면과는 관계없는 작업 파일이라, 필요하면 USB · 드라이브로 따로 옮깁니다.

- 프로젝트 폴더 맨 위의 목업 `*.psd` (폰 목업, 심볼로고 목업, PPT 첫 장 목업 등)
- 프로젝트 폴더 맨 위의 영상 `*.mp4` (온보딩 · 부케 구성 녹화)
- `node_modules` (`npm install`로 다시 생김), `dist` (`npm run build`로 다시 생김)

## 6. 앱 흐름 한눈에

```
온보딩 ─▶ 홈 ─▶ Make Quiet Bloom ─▶ 부케 구성 ─▶ Bloom Preview ─▶ AI 프리뷰 (인상 다듬기 · 다시 요청)
                      └▶ 조건 수정                                        │ 실제 제작 준비하기
                                                                          ▼
                                     Make This Bloom (예상 제작비 · 구매처 · 대체 식물 · 연출 소재)
                                                                          │ 완성하기
                                                                          ▼
                                                   Bloom Complete ─▶ Bloom Card 저장 ─▶ 홈 / My Blooms
홈 ─▶ My Blooms ─▶ Bloom Details (공유 링크 복사)
홈 ↔ 부케구성 ↔ 마이페이지 (하단 탭)
```

화면별 주소와 폴더 구조, 작업 규칙은 [README.md](README.md)에 있습니다.

## 7. 막힐 때

| 증상 | 해결 |
|---|---|
| `npm`을 찾을 수 없다고 나옴 | Node.js 설치 후 VS Code를 껐다 켜기 |
| 화면이 안 열림 (localhost) | 터미널에서 `npm run dev -- --host`가 실행 중인지 확인 |
| 휴대폰에서 안 열림 | 같은 와이파이인지, 주소가 터미널의 `Network:` 주소와 같은지 확인 |
| GitHub Desktop에 저장소가 안 보임 | `yijoonie-ux`로 로그인했는지 확인 (**File → Options → Accounts**) |
| 배포 주소에서 새로고침하면 404 | `vercel.json` / `public/_redirects`가 저장소에 있는지 확인 |
| 내용이 안 맞음 (집·회사) | 작업 전에 **Pull origin**을 했는지 확인 |
