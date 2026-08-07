# reference/ — 디자인 참고 이미지 폴더

여기에 **바꾸고 싶은 디자인의 참고 이미지**를 넣어두면, Claude Code가 이 이미지들을 직접 보고
`src/app/globals.css`의 디자인을 그 톤에 맞게 고쳐줍니다.
(Claude Code는 이미지를 직접 읽을 수 있어요. 별도 플러그인 불필요.)

## 어디에 무엇을 넣나
| 폴더 | 넣을 것 | 예시 파일명 |
|---|---|---|
| `screens/` | 화면 전체 목업/스크린샷 (가장 중요) | `main.png`, `quest.png`, `missions.png`, `admin.png` |
| `components/` | 버튼·카드·입력창 등 부분 컷 | `button.png`, `card.png`, `tabbar.png` |
| `inspiration/` | 톤앤매너·무드보드·색감 참고 | `mood-1.jpg`, `palette.png` |

## 네이밍 규칙 (권장)
- **화면 이미지는 라우트 이름과 맞추기:** `main`, `scan`, `quest`, `missions`, `admin`.
  → Claude가 "이 이미지 = 이 화면"으로 바로 매칭합니다.
- 여러 버전이면 뒤에 번호: `main-1.png`, `main-2.png`.
- 참고만 하는 무드보드는 `inspiration/`에.

## 넣는 방법
1. 디자인 시안(Figma export, 스크린샷, 웹에서 캡처한 참고 등)을 위 폴더에 드래그.
2. 아래 "사용법"대로 Claude Code에 요청.

## 사용법 (Claude Code)
프로젝트 루트에서 Claude Code를 실행하고, 루트의 **`DESIGN_PROMPT.md` 내용을 붙여넣기**만 하면 됩니다.
또는 직접 이렇게 말해도 돼요:
> `reference/` 폴더의 이미지를 참고해서 전체 디자인 톤을 그에 맞게 바꿔줘.
> `docs/디자인_가이드.md`의 토큰 시스템을 기준으로 `src/app/globals.css`부터 수정하고,
> 모바일 360px가 안 깨지게 유지해.

## 팁
- 이미지가 정확할수록 결과가 정확해요. **색·폰트·모서리·간격**이 잘 보이는 시안이 좋아요.
- 특정 색을 꼭 쓰고 싶으면 파일명이나 요청에 HEX를 같이 적어주세요(예: "메인 컬러 #FF6B6B").
- 전체를 한 번에 바꾸기 전에 `main` 한 화면만 먼저 맞춰보고 확정하는 걸 추천해요.
