-- QR 미션 투어 게임 — MariaDB 스키마 (v2: UUID 신원 + 멀티 서브페이지)
-- 실행: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS qr_tour
  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE qr_tour;

-- 참가자 : 소셜 로그인(카카오/네이버) 시 가입 → uuid 발급(내부 저장) ---
CREATE TABLE IF NOT EXISTS users (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  uuid          CHAR(36)     NOT NULL,                 -- 클라이언트가 보관하는 영구 신원
  provider      VARCHAR(10)  NOT NULL,                 -- kakao | naver
  provider_id   VARCHAR(64)  NOT NULL,                 -- 소셜 계정 고유 ID (카카오 id / 네이버 response.id)
  nickname      VARCHAR(50)  NULL,                     -- 소셜 프로필 닉네임(동의 안 하면 NULL)
  total_points  INT          NOT NULL DEFAULT 0,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_uuid (uuid),
  UNIQUE KEY uq_provider_account (provider, provider_id)
) ENGINE=InnoDB;

-- 미션(= QR 지점 = 개별 페이지). 여러 개의 서브페이지(step)를 가짐 ----
CREATE TABLE IF NOT EXISTS quests (
  id               BIGINT AUTO_INCREMENT PRIMARY KEY,
  code             VARCHAR(32)  NOT NULL,              -- QR URL: /q/{code}
  title            VARCHAR(100) NOT NULL,
  order_no         INT          NOT NULL DEFAULT 0,
  cover_image_url  VARCHAR(255) NULL,
  reward_points    INT          NOT NULL DEFAULT 100,
  is_active        TINYINT(1)   NOT NULL DEFAULT 1,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_code (code)
) ENGINE=InnoDB;

-- 서브페이지(step) : 스토리 / 퀴즈(=미션수행) / 사진 등 -------------
CREATE TABLE IF NOT EXISTS quest_steps (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  quest_id      BIGINT       NOT NULL,
  step_no       INT          NOT NULL,                -- 1,2,3... 순서
  type          VARCHAR(20)  NOT NULL DEFAULT 'story',-- story | quiz | photo
  title         VARCHAR(120) NULL,
  body_text     TEXT         NULL,
  image_url     VARCHAR(255) NULL,
  audio_url     VARCHAR(255) NULL,
  hint_text     TEXT         NULL,
  -- 퀴즈용
  question      TEXT         NULL,
  options       JSON         NULL,                    -- 객관식 보기 배열. 주관식이면 NULL
  answer        VARCHAR(255) NULL,                    -- 정답(서버에서만 검증, 클라 미노출)
  FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE,
  UNIQUE KEY uq_quest_step (quest_id, step_no)
) ENGINE=InnoDB;

-- 미션 진행/결과 ----------------------------------------------------
CREATE TABLE IF NOT EXISTS quest_progress (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT      NOT NULL,
  quest_id   BIGINT      NOT NULL,
  status     VARCHAR(20) NOT NULL DEFAULT 'unlocked', -- unlocked | cleared
  cleared_at DATETIME    NULL,
  UNIQUE KEY uq_user_quest (user_id, quest_id),
  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
  FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS point_log (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT   NOT NULL,
  quest_id   BIGINT   NULL,
  points     INT      NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS admins (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_username (username)
) ENGINE=InnoDB;

-- 시드 ---------------------------------------------------------------
-- 관리자: admin / admin1234
INSERT IGNORE INTO admins (username, password_hash) VALUES
  ('admin', '$2a$10$JiBOPDyihdEn/okCvJo3zuKdz1MB71u0fRIYNdzRXTgknlXGWoXjS');

-- 샘플 미션 1개 + 서브페이지 3개(스토리→스토리→퀴즈)
INSERT IGNORE INTO quests (id, code, title, order_no, reward_points) VALUES
  (1, 'GHOST-01', '측간신의 첫 번째 부탁', 1, 100);

INSERT IGNORE INTO quest_steps (quest_id, step_no, type, title, body_text, question, options, answer) VALUES
  (1, 1, 'story', '뒷간 앞에서', '오래된 뒷간 앞. 측간신이 말을 건다...', NULL, NULL, NULL),
  (1, 2, 'story', '수수께끼', '"내 물음에 답하면 다음 길을 열어주마."', NULL, NULL, NULL),
  (1, 3, 'quiz',  '미션: 수수께끼 풀기', NULL, '측간신이 사는 곳은 어디인가?',
       JSON_ARRAY('부엌', '뒷간', '대문', '우물'), '뒷간');
