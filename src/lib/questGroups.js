// 미션 분류(quests.quest_group) — 관리자 선택지와 퀘스트 보기 탭이 함께 쓴다.
export const QUEST_GROUPS = [
  { value: 0, label: '프롤로그' },
  { value: 1, label: '퀘스트1',
    title: '제주의 유산에 깃든 가치',
    desc: '어둠에 물든 제주의 유산을 정화하고\n복숭아나무의 생명력을 채워주세요.' },
  { value: 2, label: '퀘스트2',
    title: '제주의 상생과 포용의 어울림',
    desc: '측간신을 다시 제주의 복된\n수호신으로 품어주세요.' },
  { value: 3, label: '퀘스트3',
    title: '일만 팔천 신들의 고향, 신비로운 섬 제주',
    desc: '하늘 문을 열고, 사라진\n일만 팔천 신들을 되찾아 주세요.' },
];

// 퀘스트 보기에서 좌우로 넘기는 탭(프롤로그는 홈에서 따로 진입한다)
export const QUEST_TABS = QUEST_GROUPS.filter(g => g.value > 0);

// 진행 조건 — { 잠긴 퀘스트: 먼저 모두 완수해야 하는 퀘스트들 }
export const QUEST_REQUIRES = { 3: [1, 2] };

// 선행 퀘스트를 사람이 읽는 이름으로 — '퀘스트1·퀘스트2'
export const requireLabel = (groups) => groups.map(groupLabel).join('·');

// 이야기가 이어지는 퀘스트 — 앞 순서(order_no)를 모두 완수해야 다음 미션이 열린다.
// 퀘스트1은 네 장소를 자유롭게 돌 수 있어 넣지 않는다.
export const SEQUENTIAL_GROUPS = [2, 3];

export const groupLabel = (v) => QUEST_GROUPS.find(g => g.value === v)?.label || `퀘스트${v}`;
