// 미션 분류(quests.quest_group) — 관리자 선택지와 퀘스트 보기 탭이 함께 쓴다.
export const QUEST_GROUPS = [
  { value: 0, label: '프롤로그' },
  { value: 1, label: '퀘스트1' },
  { value: 2, label: '퀘스트2' },
  { value: 3, label: '퀘스트3' },
];

// 퀘스트 보기에서 좌우로 넘기는 탭(프롤로그는 홈에서 따로 진입한다)
export const QUEST_TABS = QUEST_GROUPS.filter(g => g.value > 0);

// 진행 조건 — { 잠긴 퀘스트: 먼저 모두 완수해야 하는 퀘스트 }
export const QUEST_REQUIRES = { 3: 1 };

// 이야기가 이어지는 퀘스트 — 앞 순서(order_no)를 모두 완수해야 다음 미션이 열린다.
// 퀘스트1은 네 장소를 자유롭게 돌 수 있어 넣지 않는다.
export const SEQUENTIAL_GROUPS = [2, 3];

export const groupLabel = (v) => QUEST_GROUPS.find(g => g.value === v)?.label || `퀘스트${v}`;
