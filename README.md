# QR 미션 투어 게임 — Next.js

프론트엔드 + API가 **하나의 Next.js(App Router) 프로젝트**로 통합됨.
Vercel에 올리면 API도 함께 서버리스로 동작 → **AWS Lambda·API Gateway·CORS·API주소 env 불필요.**
DB만 **AWS RDS(MySQL)** 로 연결.

- 스택: Next.js 15 / React 18 / mysql2 / AWS RDS(MySQL)
- 배포: GitHub → Vercel (프론트+API 한 번에), DB는 RDS

## 로컬 실행
```bash
cp .env.example .env.local        # DB(RDS 또는 로컬 MySQL)·JWT_SECRET 입력
mysql -h <host> -u <user> -p < db/schema.sql   # 스키마 + 시드
npm install
npm run dev                       # http://localhost:3000
```
- 참가자: http://localhost:3000  (최초 접속 → 회원가입 → uuid 저장)
- 관리자: http://localhost:3000/admin  (`admin` / `admin1234`)
- 미션 테스트: 로그인 후 `/scan` 또는 주소창 `/q/GHOST-01`

## 구조
```
src/
  app/
    layout.jsx · providers.jsx · globals.css · page.jsx(메인)
    scan/ · q/[code]/ · quest/[id]/ · missions/     ← 사용자 화면
    admin/ · admin/quests · admin/qr · admin/users  ← 관리자 화면
    api/                                            ← API (Route Handler)
      auth/register · auth/resume
      quests/by-code/[code] · quests/[id]/steps · quests/[id]/answer
      me/missions
      admin/login · admin/quests · admin/quests/[id] · admin/quests/[id]/steps · admin/users
  components/  AppShell · AdminShell · Protected · AudioPlayer · HintModal · ProgressBar · PhotoShare
  lib/         db.js(mysql2 풀) · auth.js(JWT) · apiClient.js · authClient.jsx
db/schema.sql  users(uuid)·quests·quest_steps·quest_progress·point_log·admins
```

## 무엇이 바뀌었나 (React+Vite → Next.js)
- `client/` + `server/`(Express) 두 프로젝트 → **Next.js 한 프로젝트**.
- Express 라우트 → `app/api/**/route.js` (Route Handler). 로직은 그대로.
- react-router-dom → Next 파일 기반 라우팅 + `next/navigation`.
- `mariadb` 드라이버 → `mysql2/promise` (AWS RDS 호환·SSL).
- **삭제됨:** 별도 API 배포, `vercel.json` 리라이트, `VITE_API_BASE`, CORS 설정.

## 배포는 `docs/배포_Vercel_RDS.md` 참조.
