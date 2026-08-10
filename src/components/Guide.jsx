'use client';

// 6. 수호자 지침서(프로그램 기본 정보) — 대본 2차 기준
const INFO = [
  ['장소', '제주도 일원'],
  ['장르', '대체현실게임투어'],
  ['내용', '사라진 제주 신들을 찾아 떠나는 신비로운 여정'],
  ['연령', '만 7세 이상 누구나'],
];

const QUESTS = [
  ['제주의 유산에 깃든 가치',
   '측간신의 동티로 어둠에 물든 제주의 유산을 찾아가 그 가치를 회복시켜 주세요. 유산의 정기가 되살아날 때마다 결계 속 복숭아나무의 생명력이 차오릅니다.'],
  ['제주의 상생과 포용의 어울림',
   '냄새 콤플렉스로 삐뚤어진 측간신을 찾아 오랜 외로움을 달래 주세요. 재앙의 시작이 된 그의 열등감을 따뜻한 온기로 정화하면 더 이상의 액운을 막을 수 있습니다. 그리고 그를 다시 제주의 복된 수호신으로 품어주세요.'],
  ['일만 팔천 신들의 고향, 신비로운 섬 제주',
   '무사히 키워낸 열쇠(복숭아 씨앗)로 오랫동안 닫혀 있던 하늘 문을 열고, 사라진 일만 팔천 신들을 제주로 복귀시켜 주세요.'],
];

const SCHEDULE = [
  ['작전 기간', '2026년 8월 24일(월) ~ 9월 6일(일), 단 14일간'],
  ['퀘스트 수행', '매일 오전 9시 ~ 오후 9시'],
  ['본부 운영', '매일 오전 9시 ~ 오후 6시'],
  ['본부 위치', '제주 제주시 삼도이동 향사당'],
];

const SCHEDULE_NOTES = [
  '퀘스트는 수호자님의 속도에 맞춰 여유롭게 완수해 주세요.',
  '‘첫 출발’과 ‘최종 과업 완수 인증’은 안내자가 상주하는 본부 운영 시간에만 가능합니다.',
  '오후 6시 이후에는 완수 인증을 확인할 수 없습니다. 늦은 밤 모든 퀘스트를 마치셨다면 다음 날 운영 시간에 맞춰 인증해 주세요.',
];

const RULES = [
  ['오디오 안내', [
    '이야기를 소리로 들으며 활동하면 더욱 생생한 투어가 완성됩니다.',
    '다른 분들에게 방해가 되지 않도록 이어폰 사용을 권장합니다.',
  ]],
  ['안전 수칙', [
    '이동할 때나 오디오 안내가 없을 때는 이어폰을 빼고, 화면 대신 주변을 살피며 걸어주세요.',
    '퀘스트 수행 지역은 차량 통제가 불가능한 일반 관광지입니다. 장난치거나 뛰지 마시고, 차도로 이동하지 말아 주세요.',
    '다른 분들과의 질서를 지켜 더욱 안전한 이야기 여행이 되기를 바랍니다.',
  ]],
];

export default function Guide({ onDone }) {
  return (
    <div className="onboard">
      <div className="screen">
        <div className="eyebrow center">수호자 지침서</div>
        <h1 className="center" style={{ marginBottom: 16 }}>3대 과업 안내</h1>

        <p className="guide__lead">
          반가워요, 수호자님!{'\n'}
          곧 다가올 8월 백중날 지옥문이 열리기 전까지, 수호자님이 완수해야 할 3대 과업을 말씀드립니다.
          꼭 완수하셔서 제주의 눈부신 내일을 만들어 주세요.
        </p>

        <section className="guide__sec">
          <h2 className="guide__head">프로그램 기본 정보</h2>
          <div className="card">
            <dl className="guide__info">
              {INFO.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
            </dl>
            <p className="guide__note">
              이야기를 따라 ‘온라인 공간’과 제주의 ‘현실 공간’을 넘나들며 제주 유산을 체험하는 대체현실게임투어입니다.
              온라인 공간의 지침과 제주의 지형지물을 이용해 각자만의 이야기 여행을 완성하세요.
            </p>
          </div>
        </section>

        <section className="guide__sec">
          <h2 className="guide__head">3대 과업</h2>
          <ol className="guide">
            {QUESTS.map(([t, d]) => (
              <li key={t} className="card"><b>{t}</b><span>{d}</span></li>
            ))}
          </ol>
        </section>

        <section className="guide__sec">
          <h2 className="guide__head">운영 안내</h2>
          <div className="card">
            <dl className="guide__info">
              {SCHEDULE.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
            </dl>
            <ul className="guide__notes">
              {SCHEDULE_NOTES.map(n => <li key={n}>{n}</li>)}
            </ul>
          </div>
        </section>

        <section className="guide__sec">
          <h2 className="guide__head">반드시 숙지해 주세요</h2>
          {RULES.map(([t, lines]) => (
            <div key={t} className="card guide__rule">
              <b>{t}</b>
              <ul className="guide__notes">{lines.map(l => <li key={l}>{l}</li>)}</ul>
            </div>
          ))}
        </section>

        <button className="btn" style={{ marginTop: 26 }} onClick={onDone}>처음으로 돌아가기</button>
      </div>
    </div>
  );
}
