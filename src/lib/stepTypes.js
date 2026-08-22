// 미션 스텝 유형 정의 — 관리자 기본값과 서버 검증 규칙의 단일 출처.
// 새 유형을 추가할 땐 여기 한 곳만 늘리면 관리자 화면·검증이 함께 따라온다.

export const STEP_TYPES = {
  story: {
    label: '이야기',
    hint: '읽고 넘어가는 페이지. config에 { "modal": true, "cta": "메시지 보기" }를 넣으면 '
        + '화면 대신 모달로 뜨고, 단추를 누르면 다음 장으로 이어진다. '
        + 'config에 { "choices": [{ "label": "단추 글", "step": 2 }] }를 두면 '
        + '‘다음’ 대신 갈래 단추가 뜨고 고른 장 번호로 건너뛴다',
    sample: { type: 'story', title: '1장', body_text: '이야기 도입...' },
  },
  quiz: {
    label: '퀴즈(주관식·객관식)',
    hint: 'options에 보기를 배열로 넣으면 골라서 푸는 문제가 되고, 비우면 직접 입력하는 문제가 된다. '
        + 'answer에는 정답 보기와 똑같은 글자를 적는다. '
        + 'config에 { "skip": true }를 두면 정답을 정하기 전까지 넘어가기 단추가 나온다',
    sample: { type: 'quiz', title: '퀴즈', question: '질문을 입력하세요', answer: '정답' },
  },
  choice: {
    label: '퀴즈(4지선다)',
    hint: '보기 네 개 중에 고른다. answer는 보기 중 하나와 똑같이 적는다',
    sample: {
      type: 'quiz', title: '보기에서 고르기', question: '질문을 입력하세요',
      options: ['보기1', '보기2', '보기3', '보기4'], answer: '보기1',
    },
  },
  puzzle: {
    label: '퍼즐(4조각)',
    hint: '흩어진 조각을 끌어다 제자리에 놓으면 성공. pieces는 좌상·우상·좌하·우하 순서',
    sample: {
      type: 'puzzle', title: '퍼즐 맞추기',
      config: { pieces: ['/puzzle/1.jpg', '/puzzle/2.jpg', '/puzzle/3.jpg', '/puzzle/4.jpg'] },
    },
  },
  clear: {
    label: '걷어내기(4조각)',
    hint: '배경 사진을 덮은 네 조각을 판 바깥으로 끌어내면 성공. background_url은 밑에 깔 사진, '
        + 'pieces는 그 위를 덮는 조각으로 좌상·우상·좌하·우하 순서(비우면 1~4 숫자가 뜬다)',
    sample: {
      type: 'clear', title: '덮인 것을 걷어내기',
      config: { background_url: '/clear/bg.png', pieces: [] },
    },
  },
  scratch: {
    label: '문지르기',
    hint: '화면을 문질러 덮개를 지우면 성공',
    sample: {
      type: 'scratch', title: '문질러서 지우기',
      config: { cover_color: '#c9cede', reveal_image_url: '', threshold: 0.7 },
    },
  },
  gauge: {
    label: '게이지 올리기',
    hint: '아래에서 위로 밀어 끝까지 올리면 성공',
    sample: { type: 'gauge', title: '게이지를 끝까지 올리세요', config: { label: '밀어 올리기' } },
  },
  dial: {
    label: '다이얼 돌리기',
    hint: '가운데 링을 목표 각도까지 돌리면 성공',
    sample: {
      type: 'dial', title: '다이얼을 맞추세요',
      config: { rings: 3, active_ring: 1, target_angle: 120, tolerance: 12 },
    },
  },
  photo: {
    label: '사진 공유',
    hint: '사진을 찍어 공유하는 페이지',
    sample: { type: 'photo', title: '인증샷' },
  },
};

// 완료 판정을 서버가 하는 유형(그 외는 클라이언트가 완료를 알린다)
export const SERVER_VERIFIED = ['quiz', 'dial'];

// 클라이언트 조작만으로 통과할 수 있는 유형(= 완료 신호를 신뢰하는 유형)
export const CLIENT_COMPLETED = ['puzzle', 'clear', 'scratch', 'gauge'];

export const isPlayable = (type) => type in STEP_TYPES && type !== 'story' && type !== 'photo';
