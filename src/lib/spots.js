// 코드 지도(8. 전체 과업 지도) — 대본 2차 기준 장소 안내
// quests.place에 아래 code를 넣으면 해당 장소의 해결 상태가 지도에 표시된다.
// 관리툴에서 고치면 DB(page_content.code_map)에 저장되고, 여기 값은 처음 한 번의 밑그림이 된다.
export const SPOT_GROUPS = [
  {
    group: '수호 본부',
    items: [
      { code: 'hyangsadang', name: '향사당',
        address: '제주 제주시 삼도이동 향사당', map: '제주 향사당',
        hours: '매일 09:00 ~ 18:00' },
    ],
  },
  {
    group: '퀘스트1',
    items: [
      { code: 'gwandeokjeong', name: '관덕정 & 제주목 관아',
        address: '제주 제주시 관덕로 19 / 제주 제주시 관덕로 25 (삼도이동)', map: '제주목 관아',
        hours: '매일 09:00 ~ 18:00', tel: '064-710-6717',
        notes: ['입장료 : 어른 1,500원 / 청소년·군인 800원 / 어린이 400원'] },
      { code: 'suwolbong', name: '수월봉',
        address: '제주 제주시 한경면 고산리', map: '수월봉' },
      { code: 'cheonggulmul', name: '청굴물',
        address: '제주 제주시 구좌읍 김녕로1길 75-1', map: '청굴물' },
      { code: 'bijarim', name: '평대리 비자나무 숲',
        address: '제주 제주시 구좌읍 비자숲길 55', map: '제주 비자림',
        hours: '매일 09:00 ~ 18:00', tel: '064-710-7912',
        notes: ['입장료 : 일반 3,000원 / 청소년 1,500원 / 어린이 1,500원'] },
    ],
  },
  {
    group: '퀘스트2',
    items: [
      { code: 'suligneunjip', name: '제주술익는집',
        sub: '',
        address: '제주 서귀포시 표선면 중산간동로 4726', map: '제주술익는집',
        hours: '월-토 10:30 ~ 17:00 / 일 12:00 ~ 17:00', tel: '064-787-5046' },
      { code: 'manjanggul', name: '만장굴',
        address: '제주 제주시 구좌읍 만장굴길 182', map: '만장굴',
        hours: '매일 09:00 ~ 18:00 (17:00 입장 마감)', tel: '064-710-7903',
        notes: ['휴관일 : 매월 첫째 수요일',
                '입장료 : 성인 4,000원 / 군인·청소년 2,000원 / 어린이 2,000원'] },
    ],
  },
  {
    group: '퀘스트3',
    items: [
      { code: 'singyemul', name: '싱계물공원',
        sub: '신창 풍차해안 공영주차장',
        address: '제주 제주시 한경면 신창리 1322-1', map: '싱계물공원',
        notes: ['방문 전 당일 물때표(간조 시간)를 꼭 확인하세요!'],
        link: { label: '물때표 확인하기', url: 'https://www.badatime.com/67/daily/2026-08' } },
    ],
  },
];

// 네이버 지도 검색 주소 — map에 적어둔 검색어로 찾고, 없으면 장소 이름으로 찾는다
export const naverMapUrl = (spot) =>
  `https://map.naver.com/p/search/${encodeURIComponent(spot.map || spot.name)}`;

// 코드 지도 화면 전체의 기본값 — 관리툴에서 아직 저장한 적이 없을 때 쓰인다
export const DEFAULT_CODE_MAP = {
  lead: '활동 장소와 운영 시간을 확인하고\n가장 가까운 파수꾼 코드부터 찾아보세요.',
  image: '/map.png',
  groups: SPOT_GROUPS,
};

// 관리자 미션 편집의 장소 선택용(불러오기 전 기본값)
export const SPOT_OPTIONS = SPOT_GROUPS.flatMap(g => g.items.map(s => ({ code: s.code, name: s.name })));

// 저장된 지도에서 장소 선택지를 뽑는다
export const spotOptions = (map) =>
  (map?.groups || []).flatMap(g => (g.items || []).map(s => ({ code: s.code, name: s.name })))
    .filter(s => s.code);
