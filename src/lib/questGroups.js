// 미션 분류(quests.quest_group) — 관리자 선택지와 퀘스트 보기 탭이 함께 쓴다.
export const QUEST_GROUPS = [
  { value: 0, label: '프롤로그' },
  { value: 1, label: '퀘스트1' },
  { value: 2, label: '퀘스트2' },
  { value: 3, label: '퀘스트3' },
];

// 퀘스트 보기에서 좌우로 넘기는 탭(프롤로그는 홈에서 따로 진입한다)
export const QUEST_TABS = QUEST_GROUPS.filter(g => g.value > 0);
