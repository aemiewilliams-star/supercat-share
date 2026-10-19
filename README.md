# supercat 공유 포털

팀이 만든 HTML을 한 곳에 모아 **URL로 공유**하는 정적 사이트.
Fly.io(Caddy 정적 서버)에 올라가며, `main` 에 push 하면 자동 배포됩니다.

## 쓰는 법 (자료 공유)

1. `public/` 폴더에 HTML 파일을 넣는다. (하위 폴더도 OK)
   - 예: `public/report.html`, `public/2026/q4.html`
2. 커밋하고 push 한다.
   ```bash
   git add . && git commit -m "add report" && git push
   ```
3. 잠시 뒤 아래 주소로 공유된다.
   - `https://<앱주소>/report`  (또는 `/report.html`)
   - `https://<앱주소>/2026/q4`
   - 메인 페이지 `https://<앱주소>/` 에 **자동으로 목록(갤러리)** 으로도 등록된다.

> 팁: 각 HTML 의 `<title>` 과 `<meta name="description">` 이 목록 카드의 제목·설명으로 쓰입니다. 넣어두면 보기 좋아요.

## 로컬에서 미리보기

```bash
npm run preview
# → http://localhost:8080 에서 index 포함 전체 확인
```

또는 index 만 생성:

```bash
npm run build   # public/index.html 재생성
```

## 구조

```
public/           ← 여기에 HTML 을 넣으세요 (공유 대상)
  welcome.html    ← 샘플 (지워도 됨)
  index.html      ← 자동 생성되는 갤러리 (손대지 마세요, .gitignore 됨)
scripts/
  build-index.mjs ← public/ 스캔 → index.html 생성 (의존성 없음)
Dockerfile        ← node 로 index 빌드 → caddy 로 서빙 (멀티스테이지)
Caddyfile         ← 정적 서빙 + 깔끔한 URL(try_files)
fly.toml          ← Fly 설정 (auto-stop 으로 유휴비용 ~0)
.github/workflows/deploy.yml ← push → 자동 배포
```

## 최초 배포 (한 번만)

```bash
fly launch --no-deploy   # 앱 이름/리전 확인 (fly.toml 이미 있음)
fly deploy               # 첫 배포
```

이후 **git push → 자동 배포**를 쓰려면 GitHub 레포에 Fly 토큰을 등록:

```bash
fly tokens create deploy -x 999999h   # 토큰 발급
# GitHub → repo → Settings → Secrets and variables → Actions
#   → New secret: 이름 FLY_API_TOKEN, 값 위 토큰
```

## 커스텀 도메인 (선택)

```bash
fly certs add share.supercat.xxx
# 안내되는 DNS 레코드(A/AAAA/CNAME)를 도메인에 추가
```
