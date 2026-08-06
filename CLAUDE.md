# CLAUDE.md — QR 미션 투어 (Next.js)

## 프로젝트
QR로 진입하는 단기 이벤트 투어 게임. **Next.js(App Router) 한 프로젝트**에 프론트+API 통합.
Vercel 배포(프론트+API 서버리스), DB는 AWS RDS(MySQL). Lambda·CORS·API주소 env 불필요.

## 실행
```bash
cp .env.example .env.local          # DB·JWT_SECRET
mysql -h <host> -u <user> -p < db/schema.sql
npm install && npm run dev          # :3000
npm run build                       # 배포 전 검증
```

## 구조 규칙
- 화면: `src/app/**/page.jsx` (상호작용 화면은 `'use client'`).
- API: `src/app/api/**/route.js` (Route Handler). 동적 세그먼트는 `const { id } = await params;`.
- DB 접근: `@/lib/db`의 `q(sql, params)` / 트랜잭션은 `pool.getConnection()`.
- 인증: `@/lib/auth`의 `verifyFrom(request, 'user'|'admin')`. 클라는 `@/lib/authClient`(uuid).
- 라우팅/네비: `next/navigation`(useRouter/useParams/useSearchParams/usePathname), `next/link`.
- 레이아웃: `AppShell`(모바일 하단탭), 관리자 화면은 `AdminShell`.

## 반드시 지킬 것
- **미션은 데이터**(quests/quest_steps). 화면 하드코딩 금지, `quest/[id]`가 데이터로 렌더.
- **퀴즈 정답은 서버에서만 검증.** `/steps` 응답에 `answer` 미포함.
- 모바일 360px 우선, 데스크톱 420px 중앙 프레임. 색·간격은 `globals.css` 토큰.
- 포인트 적립 등은 트랜잭션 + 중복 방지.
- `useSearchParams` 쓰는 페이지는 `Suspense`로 감싸기(빌드 오류 방지).

## 하지 말 것
- 정답 클라이언트 노출 / 서버 검증 생략.
- DB 커넥션 풀을 요청마다 새로 생성(전역 싱글톤 재사용).
- SSR 중 localStorage 접근(반드시 effect/handler 안에서).

## 배포
`docs/배포_Vercel_RDS.md` 참조. GitHub push → Vercel Import → 환경변수(DB_*, JWT_SECRET) → Deploy.


## 클로드 규칙
## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
