-- 소셜 로그인(카카오/네이버) 도입 마이그레이션
-- 이미 운영 중인 DB에만 실행. 새로 만드는 DB는 schema.sql에 이미 반영되어 있음.
-- 실행: mysql -h <host> -u <user> -p qr_tour < db/migration_social_login.sql
USE qr_tour;

ALTER TABLE users
  ADD COLUMN provider    VARCHAR(10) NOT NULL DEFAULT '' AFTER uuid,
  ADD COLUMN provider_id VARCHAR(64) NOT NULL DEFAULT '' AFTER provider;

-- 기존 익명(uuid만 있는) 참가자는 provider='' 상태로 남는다.
-- provider=''인 행이 여러 개면 (provider, provider_id)가 중복되어 아래 인덱스 생성이 실패하므로,
-- 기존 행의 provider_id를 uuid로 채워 유일성을 확보한다.
UPDATE users SET provider = 'legacy', provider_id = uuid WHERE provider = '';

ALTER TABLE users
  ADD UNIQUE KEY uq_provider_account (provider, provider_id);
