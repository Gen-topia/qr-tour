# 배포 — GitHub → Vercel + AWS RDS(MySQL)

## A. AWS RDS(MySQL) 준비
1. RDS에서 MySQL 인스턴스 생성(엔진 MySQL 8.x). 마스터 계정/비번 메모.
2. **네트워크 접근** — Vercel 서버리스는 고정 IP가 없다. 셋 중 택1:
   - (간단·이벤트용) RDS를 **퍼블릭 액세스 허용** + 보안그룹 인바운드 `3306`을 `0.0.0.0/0` 허용.
     반드시 **강력한 비밀번호 + SSL**로 보완. 이벤트 종료 후 인스턴스 삭제.
   - (안전) **RDS Proxy** 사용 또는 Vercel 고정 IP(Enterprise) + 화이트리스트.
3. **스키마 적용** — 로컬에서 RDS로 접속해 실행:
   ```bash
   mysql -h <RDS엔드포인트> -u <user> -p < db/schema.sql
   ```

## B. GitHub 푸시
```bash
git init && git add . && git commit -m "init: next.js qr tour"
git branch -M main
git remote add origin https://github.com/<아이디>/qr-tour-next.git
git push -u origin main
```
> 이 프로젝트는 **레포 루트가 곧 Next 앱**이라, 지난번 같은 "Root Directory=client" 설정이 필요 없다.

## C. Vercel 배포
1. vercel.com → Add New… → Project → 레포 Import.
2. Framework: **Next.js 자동 감지** (빌드/출력 설정 손댈 것 없음).
3. **Environment Variables**(Production)에 등록:
   ```
   DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
   DB_SSL=1
   DB_POOL_LIMIT=5
   JWT_SECRET=<긴 랜덤 문자열>
   ```
4. **Deploy** → `https://<프로젝트>.vercel.app` 접속.
5. 이후 `git push` 마다 프론트+API 자동 재배포.

## D. 접속 확인
- 메인(회원가입) 뜨는지 → 회원가입 → `/scan` 또는 `/q/GHOST-01` → 미션 진행 → 포인트 저장 확인.
- 관리자 `/admin`에서 미션·QR·사용자 확인.

## 서버리스 + MySQL 주의
- 풀은 전역 싱글톤으로 재사용(`lib/db.js`). `DB_POOL_LIMIT`은 낮게(5).
- 트래픽 스파이크가 크면 **RDS Proxy** 또는 Vercel **Fluid Compute + `attachDatabasePool`** 검토.
- RDS 인스턴스 클래스의 `max_connections`를 초과하지 않도록 동시성 관리.

## 체크리스트
- [ ] RDS 생성 + 보안그룹 인바운드 허용
- [ ] db/schema.sql 적용(시드 관리자 admin/admin1234 → 비번 변경)
- [ ] GitHub push
- [ ] Vercel Import + 환경변수 등록 + Deploy
- [ ] 접속·회원가입·미션 클리어·포인트 저장 확인
