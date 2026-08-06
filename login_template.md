# 카카오 · 네이버 웹 로그인 연동 가이드

이 프로젝트의 참가자 로그인은 **카카오/네이버 OAuth 2.0 인가 코드 방식(Authorization Code Grant)** 으로 구현되어 있다.
코드는 이미 모두 들어가 있고, **개발자 콘솔에서 키를 발급받아 `.env.local`에 넣으면 바로 동작**한다.

- 브라우저에 앱 키를 노출하는 JS SDK 방식이 아니라, **서버(Route Handler)가 토큰을 교환**하는 방식이다.
- 액세스 토큰은 서버 밖으로 나가지 않는다. 클라이언트에는 우리 서비스의 JWT만 전달된다.

---

## 1. 전체 흐름

```
[브라우저]  "카카오로 시작하기" 클릭
     │  <a href="/api/auth/kakao/start?next=/scan">
     ▼
[서버] GET /api/auth/{provider}/start
     │  · state(랜덤 UUID) 생성 → httpOnly 쿠키 oauth_state 저장
     │  · 복귀 경로 → httpOnly 쿠키 oauth_next 저장
     │  · 302 → 카카오/네이버 인가 페이지
     ▼
[카카오/네이버]  사용자 로그인 + 동의
     │  302 → 우리가 등록한 Redirect URI (?code=...&state=...)
     ▼
[서버] GET /api/auth/{provider}/callback
     │  ① state 쿠키와 쿼리 state 대조 (CSRF 방지)
     │  ② code → access_token 교환   (POST 토큰 URL)
     │  ③ access_token → 프로필 조회 (GET 프로필 URL)
     │  ④ users 테이블 UPSERT → 내부 user.id 확보
     │  ⑤ 우리 JWT 발급 → httpOnly 쿠키 tour_session(5분)
     │  302 → /auth/complete?next=/scan
     ▼
[브라우저] /auth/complete
     │  POST /api/auth/session  (쿠키 자동 전송)
     ▼
[서버] 쿠키의 JWT 검증 → { uuid, token, user } JSON 반환 + 쿠키 삭제
     ▼
[브라우저] localStorage 저장 → next 경로로 이동
```

**왜 `/auth/complete`를 한 번 거치는가**
콜백에서 곧바로 `/?token=xxx`로 리다이렉트하면 토큰이 URL·브라우저 히스토리·Referer 헤더에 남는다.
httpOnly 쿠키에 담아 1회만 소비하게 하면 그 노출이 없다.

---

## 2. 카카오 개발자센터 설정

<https://developers.kakao.com>

| 단계 | 위치 | 할 일 |
|---|---|---|
| 1 | 내 애플리케이션 → 애플리케이션 추가하기 | 앱 이름·회사명 입력 |
| 2 | 앱 설정 → 플랫폼 → **Web** | 사이트 도메인 등록<br>`http://localhost:3000`, `https://<배포도메인>` |
| 3 | 제품 설정 → 카카오 로그인 | **활성화 설정 ON** |
| 4 | 제품 설정 → 카카오 로그인 → **Redirect URI** | `http://localhost:3000/api/auth/kakao/callback`<br>`https://<배포도메인>/api/auth/kakao/callback` |
| 5 | 제품 설정 → 카카오 로그인 → **동의항목** | **닉네임(profile_nickname)** 을 «필수 동의» 또는 «선택 동의»로 설정 |
| 6 | 앱 설정 → 앱 키 | **REST API 키** 복사 → `KAKAO_REST_API_KEY` |
| 7 | 제품 설정 → 카카오 로그인 → 보안 | Client Secret을 «사용함»으로 켰다면 코드 복사 → `KAKAO_CLIENT_SECRET`<br>(안 켰으면 빈 값으로 두면 된다) |

> **Redirect URI는 문자 단위로 정확히 일치**해야 한다. 끝의 `/` 유무, `http`/`https`, 포트까지 모두.
> 불일치 시 `KOE006` 오류가 뜬다.

**동의항목 주의** — 닉네임을 «선택 동의»로 두면 사용자가 거부할 수 있고, 그 경우
`kakao_account.profile.nickname`이 응답에 없다. 코드는 이때 `nickname`을 `NULL`로 저장하고,
화면에서는 "어서 오세요"로 대체 표시한다.

### 카카오 API 스펙 (코드가 호출하는 것)

**인가 요청** `GET https://kauth.kakao.com/oauth/authorize`

| 파라미터 | 값 |
|---|---|
| `response_type` | `code` (고정) |
| `client_id` | REST API 키 |
| `redirect_uri` | `{APP_BASE_URL}/api/auth/kakao/callback` |
| `state` | 서버가 만든 랜덤 UUID |
| `scope` | `profile_nickname` |

**토큰 교환** `POST https://kauth.kakao.com/oauth/token`
`Content-Type: application/x-www-form-urlencoded;charset=utf-8`

| 파라미터 | 값 |
|---|---|
| `grant_type` | `authorization_code` |
| `client_id` | REST API 키 |
| `redirect_uri` | 인가 때와 **동일한** 값 |
| `code` | 콜백으로 받은 인가 코드 |
| `client_secret` | (설정한 경우만) |

응답: `{ "access_token": "...", "refresh_token": "...", "expires_in": 21599, ... }`

**프로필 조회** `GET https://kapi.kakao.com/v2/user/me`
헤더: `Authorization: Bearer {access_token}`

```json
{
  "id": 3456789012,
  "kakao_account": {
    "profile_nickname_needs_agreement": false,
    "profile": { "nickname": "밤길나그네" }
  }
}
```

---

## 3. 네이버 개발자센터 설정

<https://developers.naver.com/apps>

| 단계 | 위치 | 할 일 |
|---|---|---|
| 1 | Application → 애플리케이션 등록 | 애플리케이션 이름 입력 |
| 2 | 사용 API | **네이버 로그인** 선택 |
| 3 | 제공 정보 선택 | **별명(nickname)** 체크 (필수/추가 중 택1) |
| 4 | 환경 추가 → **PC 웹** | 서비스 URL: `http://localhost:3000`, `https://<배포도메인>` |
| 5 | 네이버 로그인 Callback URL | `http://localhost:3000/api/auth/naver/callback`<br>`https://<배포도메인>/api/auth/naver/callback` |
| 6 | 개요 탭 | **Client ID** → `NAVER_CLIENT_ID`<br>**Client Secret** → `NAVER_CLIENT_SECRET` |

> 네이버는 서비스 URL 1개당 환경 1개다. 로컬과 배포 도메인을 **각각** 추가해야 한다.
> Client Secret은 카카오와 달리 **필수**다.

### 네이버 API 스펙

**인가 요청** `GET https://nid.naver.com/oauth2.0/authorize`

| 파라미터 | 값 |
|---|---|
| `response_type` | `code` (고정) |
| `client_id` | Client ID |
| `redirect_uri` | `{APP_BASE_URL}/api/auth/naver/callback` |
| `state` | 서버가 만든 랜덤 UUID (네이버는 **필수**) |

**토큰 교환** `POST https://nid.naver.com/oauth2.0/token`

| 파라미터 | 값 |
|---|---|
| `grant_type` | `authorization_code` |
| `client_id` | Client ID |
| `client_secret` | Client Secret |
| `code` | 인가 코드 |
| `state` | 인가 때와 동일한 state |

**프로필 조회** `GET https://openapi.naver.com/v1/nid/me`
헤더: `Authorization: Bearer {access_token}`

```json
{
  "resultcode": "00",
  "message": "success",
  "response": { "id": "32742776", "nickname": "밤길나그네" }
}
```

> 카카오는 최상위 `id`, 네이버는 `response.id`다. 이 차이는 `src/lib/oauth.js`의
> `parseProfile`이 흡수해서 두 provider 모두 `{ providerId, nickname }` 형태로 통일한다.

---

## 4. 환경변수 (`.env.local` / Vercel Environment Variables)

```bash
# 콜백 URL 생성 기준. 배포 시 반드시 실제 도메인으로 지정
APP_BASE_URL=http://localhost:3000

KAKAO_REST_API_KEY=여기에_REST_API_키
KAKAO_CLIENT_SECRET=            # Client Secret 사용 안 하면 빈 값

NAVER_CLIENT_ID=여기에_클라이언트_ID
NAVER_CLIENT_SECRET=여기에_클라이언트_시크릿
```

`APP_BASE_URL`을 비워두면 요청 origin에서 자동으로 유도한다. 로컬 개발은 그래도 되지만,
**Vercel 배포 시에는 반드시 지정**해야 한다. 프리뷰 배포 도메인이 매번 달라지면
콘솔에 등록한 Redirect URI와 불일치해 실패하기 때문이다.

---

## 5. DB 변경 사항

### 추가된 컬럼 (`users` 테이블)

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `provider` | `VARCHAR(10) NOT NULL` | `kakao` \| `naver` (기존 익명 계정은 `legacy`) |
| `provider_id` | `VARCHAR(64) NOT NULL` | 소셜 계정 고유 ID. 카카오 `id`, 네이버 `response.id` |

**유지되는 컬럼** — `uuid`(내부 영구 신원), `nickname`, `total_points`, `created_at`.
`quest_progress`, `point_log`는 계속 `users.id`를 FK로 참조하므로 **구조 변경이 없다.**

### 추가된 유니크 키

```sql
UNIQUE KEY uq_provider_account (provider, provider_id)
```

같은 소셜 계정으로 재로그인하면 새 행이 생기지 않고 기존 `users.id`를 그대로 되찾는다.
`provider_id`만으로는 카카오와 네이버 ID가 우연히 겹칠 수 있으므로 **복합 유니크**여야 한다.

### 적용 방법

```bash
# 새로 만드는 DB — schema.sql에 이미 반영됨
mysql -h <host> -u <user> -p < db/schema.sql

# 이미 운영 중인 DB — 마이그레이션만 실행
mysql -h <host> -u <user> -p qr_tour < db/migration_social_login.sql
```

마이그레이션은 기존 익명 참가자의 `provider`를 `legacy`, `provider_id`를 `uuid` 값으로 채운다.
유니크 키를 걸기 전에 빈 문자열 중복을 없애기 위한 처리다. 이 참가자들은 소셜 로그인 이력이
없으므로 다시 접속하면 새 계정으로 가입되며, 기존 포인트는 이어지지 않는다.
(이어주려면 별도 계정 연결 UI가 필요하다 — 현재 범위 밖.)

### UPSERT 쿼리

```sql
INSERT INTO users (uuid, provider, provider_id, nickname)
VALUES (?, ?, ?, ?)
ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id);
```

`LAST_INSERT_ID(id)` 덕분에 신규 가입이든 재로그인이든 `insertId`가 항상 올바른 `users.id`가 된다.
닉네임은 최초 가입 시점 값만 저장하고, 이후 소셜 프로필이 바뀌어도 갱신하지 않는다.

---

## 6. 소셜 응답 → DB 컬럼 매핑

| 소셜 응답 필드 | | DB 컬럼 | 비고 |
|---|---|---|---|
| 카카오 `id` (숫자) | → | `users.provider_id` | 문자열로 변환해 저장 |
| 네이버 `response.id` (문자열) | → | `users.provider_id` | |
| 경로 세그먼트 `kakao`/`naver` | → | `users.provider` | |
| 카카오 `kakao_account.profile.nickname` | → | `users.nickname` | 미동의 시 `NULL` |
| 네이버 `response.nickname` | → | `users.nickname` | 미동의 시 `NULL` |
| (서버 생성 `randomUUID()`) | → | `users.uuid` | 신규 가입 시에만 |

**저장하지 않는 값** — 액세스 토큰·리프레시 토큰은 DB에 남기지 않는다. 프로필을 한 번 읽고 버린다.
이메일·프로필 이미지 등을 쓰려면 콘솔에서 동의항목을 추가하고 `users`에 컬럼을 늘린 뒤
`src/lib/oauth.js`의 `parseProfile`에 필드를 더하면 된다.

---

## 7. 클라이언트에서 오가는 값

### 로그인 버튼 (`src/app/page.jsx`)

`fetch`가 아니라 **`<a>` 태그로 전체 페이지를 이동**시켜야 한다. 소셜 인가 페이지는
CORS를 허용하지 않으므로 XHR로는 갈 수 없다.

```jsx
const startUrl = (provider) => `/api/auth/${provider}/start?next=${encodeURIComponent(next)}`;

<a className="btn btn--kakao" href={startUrl('kakao')}>카카오로 시작하기</a>
<a className="btn btn--naver" href={startUrl('naver')}>네이버로 시작하기</a>
```

`next`는 로그인 후 복귀할 내부 경로다. QR을 먼저 찍고 로그인하게 되는 경우
`Protected` 컴포넌트가 `/?next=/quest/3` 형태로 보내주므로 그 값을 그대로 넘긴다.
서버는 `/`로 시작하는 내부 경로만 허용한다(open redirect 방지).

### 세션 교환 (`src/app/auth/complete/page.jsx`)

```js
POST /api/auth/session      // 요청 바디 없음. 쿠키가 인증 수단
```

응답:

```json
{
  "uuid":  "3f2a…",                                  // localStorage 'tour_uuid'
  "token": "eyJhbGciOi…",                            // localStorage 'token'
  "user":  { "id": 12, "nickname": "밤길나그네", "total_points": 0 }   // localStorage 'user'
}
```

이 3개가 `localStorage`에 저장되고, 이후 모든 API 호출은 `Authorization: Bearer {token}`을 붙인다
(`src/lib/apiClient.js`). 쿠키는 응답과 함께 삭제되므로 **재사용할 수 없다.**

> `/api/auth/session`은 **1회용**이다. React StrictMode가 effect를 두 번 실행하면 두 번째는
> 401이 나므로, `complete` 페이지는 `useRef` 가드로 한 번만 호출한다.

### localStorage 키

| 키 | 값 | 쓰는 곳 |
|---|---|---|
| `tour_uuid` | 참가자 UUID | 재방문 시 `POST /api/auth/resume`로 토큰 재발급 |
| `token` | 우리 서비스 JWT (30일) | 모든 API의 `Authorization` 헤더 |
| `user` | `{ id, nickname, total_points }` JSON | 화면 표시용 |

앱을 열면 `AuthProvider`가 `token`이 있으면 그대로 쓰고, 없고 `tour_uuid`만 있으면
`resume`으로 토큰을 다시 받는다. 둘 다 없으면 로그인 화면이 뜬다.

---

## 8. 관련 파일

| 경로 | 역할 |
|---|---|
| `src/lib/oauth.js` | provider별 URL·스코프·프로필 파싱, 토큰 교환/프로필 조회 |
| `src/app/api/auth/[provider]/start/route.js` | state 발급 → 인가 페이지 리다이렉트 |
| `src/app/api/auth/[provider]/callback/route.js` | 토큰 교환 → 프로필 → users UPSERT → JWT 쿠키 |
| `src/app/api/auth/session/route.js` | 쿠키 1회 소비 → `{ uuid, token, user }` 반환 |
| `src/app/api/auth/resume/route.js` | uuid로 토큰 재발급 (재방문) |
| `src/app/auth/complete/page.jsx` | 세션 교환 후 localStorage 저장 → 복귀 |
| `src/app/page.jsx` | 소셜 로그인 버튼 |
| `src/lib/authClient.jsx` | `completeSocialLogin()` / `reset()` |
| `db/migration_social_login.sql` | 기존 DB용 컬럼 추가 |

새 provider(구글 등)를 붙이려면 `PROVIDERS`에 항목 하나만 추가하면 된다. 라우트는 그대로 재사용된다.

---

## 9. 배포 체크리스트

- [ ] 카카오 Redirect URI에 `https://<배포도메인>/api/auth/kakao/callback` 등록
- [ ] 네이버 Callback URL에 `https://<배포도메인>/api/auth/naver/callback` 등록
- [ ] Vercel 환경변수: `APP_BASE_URL`을 **배포 도메인**으로 지정
- [ ] Vercel 환경변수: `KAKAO_REST_API_KEY`, `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`
- [ ] RDS에 `db/migration_social_login.sql` 실행
- [ ] 카카오 로그인 → «비즈 앱» 전환 여부 확인 (개인 개발 앱은 팀원 외 로그인이 제한될 수 있음)
- [ ] 네이버 애플리케이션 «검수 요청» — 미검수 상태에서는 등록된 테스트 계정만 로그인 가능

---

## 10. 자주 겪는 오류

| 증상 | 원인 | 해결 |
|---|---|---|
| 카카오 `KOE006` | Redirect URI 미등록/불일치 | 콘솔 등록값과 `APP_BASE_URL` 대조 |
| 카카오 `KOE101` | REST API 키가 아닌 다른 키 사용 | JavaScript 키가 아니라 **REST API 키** |
| 네이버 `invalid_request` | Callback URL 불일치 또는 state 누락 | 콘솔 등록값 확인 |
| "로그인 요청이 만료되었습니다" | `oauth_state` 쿠키 만료(5분) 또는 유실 | 다시 시도. 시크릿 창 쿠키 차단 여부 확인 |
| `/auth/complete`에서 401 | 세션 쿠키가 이미 소비됨 | 정상 동작. 새로고침 말고 처음부터 다시 로그인 |
| 닉네임이 계속 비어 있음 | 동의항목 미설정 또는 사용자 거부 | 콘솔에서 닉네임 항목 «필수 동의»로 변경 |
