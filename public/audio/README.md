# 미션 음성 · 효과음

대본(2차) 22~43p의 "– 소리 :" 표기를 서브미션(QR) 단위로 정리한 목록이다.
폴더 번호는 `quests.order_no`(QR을 찍는 순서)와 같다.

## 파일 이름 규칙

| 파일 | 언제 나오나 | 연결되는 곳 |
|---|---|---|
| `start.mp3` | 미션에 들어가면 (등장인물이 사정을 말한다) | `quest_steps.audio_url` |
| `talk.mp3` | 이야기가 이어지는 중간 장 | 해당 스텝의 `audio_url` |
| `action.mp3` | 미션을 수행할 때 (문지르기·퍼즐 등의 효과음) | 해당 스텝의 `audio_url` |
| `clear.mp3` | 미션을 완수했을 때 (고맙다는 대사·완료 효과음) | `quests.clear_audio_url` |

파일을 폴더에 넣기만 하면 화면에 재생 버튼이 나타난다. 없으면 버튼이 뜨지 않는다.
mp3 대신 wav를 쓰려면 DB의 경로도 함께 고쳐야 한다.

## 서브미션별 필요 음성

`○` = 대본에 소리 표기가 있음, `–` = 표기 없음

| 폴더 | 서브미션 | QR | start | action | clear |
|---|---|---|---|---|---|
| `00-prequest` | 사전 퀘스트(동자석) | KM4APR | ○ 동자석 목소리 | – | – |
| `01-suwolbong` | 수월봉의 목소리 | V5H9AG | ○ 수월봉 소리 | ○ 먼지를 툭툭 털어내는 소리 → 빛이 반짝이고 새가 노래하는 소리 | ○ 수월봉 대사 |
| `02-bijarim` | 비자나무 숲의 목소리 | GP2HJ9 | ○ 비자나무 숲의 소리 | – | ○ 숲 대사 |
| `03-cheonggulmul-voice` | 물의 이야기 듣기 | G2FCEZ | ○ 청굴물 소리 | – | – |
| `04-cheonggulmul-clean` | 물길을 덮은 오물 치우기 | DQAHS3 | – | – | ○ 물길 뚫리는 소리 + 청굴물 대사 |
| `05-gwandeokjeong-voice` | 광장의 이야기 듣기 | CFU7L2 | ○ 측간신 목소리 + 음산한 배경음악(차 경적·싸우는 소리) | – | – |
| `06-gwandeokjeong-tile` | 제주목 관아 헌와 이야기 | CLDQYL | ○ 기와 깨지는 소리 | – | ○ 여러 개의 기와가 드르륵 자리를 잡는 소리 |
| `07-gosori-material` | 고소리술 재료 찾기 | 5UDFNM | – | – | – |
| `08-gosori-brew` | 고소리술 완성 | D7CE3L | – | – | – |
| `09-manjanggul` | 측간신의 이야기 듣기 | 878GED | ○ 측간신 소리 | ○ 측간신 소리(고소리술 올리기) | ○ 측간신 소리(취해 넘어감) |
| `10-flowave` | 소원지 작성 · 달기 | RN98BD | – | – | – |
| `11-haenyeo` | 입구 해녀의 이야기 | W6FQEZ | ○ 해녀의 목소리 | – | – |
| `12-windcenter` | 한국남부발전국제풍력센터 | VW2BG5 | ○ 해녀 회장님 목소리 | ○ 물에서 튀어 오르는 소리 + 다금바리 목소리 | ○ 해녀 회장님 목소리 |
| `13-ieodo` | 이어도 길 | HUCBAJ | ○ 신성한 하늘의 악기 소리가 들리는 배경음악 | ○ 알림음(설문대할망 메시지 도착) | ○ 설문대할망 목소리 |

## 대본에 소리 표기가 없는 미션

`07-gosori-material`, `08-gosori-brew`, `10-flowave` 세 곳은 대본에 소리 지시가 없다.
화면 연출만 적혀 있어 폴더는 만들어 두었으니, 필요하면 같은 이름 규칙으로 넣으면 된다.

## 이미 있는 소리

프롤로그(`public/prologue/prologue.mp3`)와 사전 퀘스트 음성(`public/prequest/prequest.mp3`)은
기존 경로를 그대로 쓴다. `public/prequest/`의 알림음은 파일이 `notify.wav`인데
코드는 `notify.mp3`를 찾고 있어 지금은 울리지 않는다.

## 받은 파일이 들어간 자리 (2026-08-18)

| 원본 | 위치 |
|---|---|
| [퀘스트1] 3-1. 청굴물(QR04)_아으 더러워 | `03-cheonggulmul-voice/start.mp3` |
| [퀘스트1] 3-2. 청굴물(완료)_아시원해라 | `04-cheonggulmul-clean/clear.mp3` |
| [퀘스트1] 4-1. 관덕정광장(QR06)_측간신_이광장 | `05-gwandeokjeong-voice/start.mp3` |
| [퀘스트1] 4-2. 제주목관아(QR07)_기와 깨지는 소리 | `06-gwandeokjeong-tile/start.mp3` |
| [퀘스트1] 4-3. 제주목관아(완료)_기와 복구되는 소리 | `06-gwandeokjeong-tile/clear.mp3` |
| [퀘스트1] 5-1. 복숭아나무성장완료효과음 | `quest1-clear/grow.wav` |
| [퀘스트1] 5-2. 복숭아나무따는효과음 | `quest1-clear/pick.wav` |
| [퀘스트1] 5-3. 황금열쇠등장효과음 | `quest1-clear/key.wav` |
| [퀘스트2] 2-1. 측간신(QR10)_누구냐 | `09-manjanggul/start.mp3` |
| [퀘스트2] 2-2. 측간신_뭐야 | `09-manjanggul/talk.mp3` |
| [퀘스트2] 2-3. 측간신_이런 달콤한 | `09-manjanggul/action.mp3` |
| [퀘스트2] 2-4. 잠재우기(완료) 효과음 | `09-manjanggul/clear.wav` |
| [퀘스트2] 3. 정화하기(완료) 효과음 | `10-flowave/clear.mp3` |
| [퀘스트3] 1. 해녀_어서들 | `11-haenyeo/start.mp3` |
| [퀘스트3] 2-1. 해녀회장&다금바리_여기까지 | `12-windcenter/start.mp3` |
| [퀘스트3] 2-2. 다금바리&해녀회장_거긴딱 | `12-windcenter/action.mp3` |
| [퀘스트3] 3. 동자석_마침내 | `13-ieodo/action.mp3` |
| [퀘스트3] 4-2. 설문대할망_제주를 | `13-ieodo/ending.mp3` |
| [효과음] 정기획득알림음 | `common/spirit.mp3` |
| [효과음] 책넘기는소리 | `common/page.wav` |

파일명의 QR 번호는 사전 퀘스트를 QR01로 세므로 **QR번호 = 폴더번호 + 1**이다.

### 아직 재생할 자리가 없는 소리

`quest1-clear/`(퀘스트1 완수 연출)와 `common/`(정기 획득 알림음·책 넘기는 소리)은
해당 화면이 아직 없어 연결하지 않았다. 화면을 만들 때 붙이면 된다.

### 아직 도착하지 않은 소리

`01-suwolbong/action.mp3`, `12-windcenter/clear.mp3`,
`13-ieodo/start.mp3`(신성한 하늘의 악기 배경음악), `13-ieodo/clear.mp3`.
경로는 미리 걸어두었으므로 파일만 넣으면 바로 재생된다.
