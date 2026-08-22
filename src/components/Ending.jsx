'use client';
import { useState } from 'react';
import AudioPlayer from '@/components/AudioPlayer';

// 설문대할망의 메시지 — 퀘스트3까지 모두 끝낸 사람에게만 보여주는 엔딩.
// 그림이 화면을 가득 채우고, 자막은 아래에서 옆으로 넘겨 읽는다.
const LINES = [
  '제주를 어둠으로부터 구원한 수호자여,',
  '막혔던 하늘 문을 열고\n일만 팔천 신들을 이 땅으로 무사히\n인도해 낸 그대의 지혜와 용기에\n진심으로 감사를 전한다.',
  '그대의 공헌을 치하하고자\n자그마한 축복의 증표를 준비하였느니라.',
  '선물을 받으려거든, 동자석을 처음 만났던\n수호 본부(향사당)로 돌아가\n그 간의 거룩한 발걸음을 증명하고',
  '명예의 전당에 그대의 이름을\n당당히 새겨 넣어,\n이 땅의 후세에도 그대의 여정이\n널리 전해지도록 하여라.',
  '끝으로 과업을 완수한 수호자 중\n최고의 수호자를 꼽아\n하늘 문 열쇠의 정기를 품은\n황금 열쇠를 하사할 것이니,',
  '부디 마지막까지 그대에게\n신성한 행운이 따르길 바라노라.',
];

export default function Ending({ onHome, onMap }) {
  const [i, setI] = useState(0);
  const [from, setFrom] = useState(null);   // 넘기려고 누른 자리
  const last = i >= LINES.length - 1;

  const go = (d) => setI(v => Math.min(LINES.length - 1, Math.max(0, v + d)));

  // 옆으로 밀어 넘긴다. 살짝 눌렀다 뗀 것은 '다음'으로 본다.
  const onUp = (e) => {
    if (from === null) return;
    const dx = e.clientX - from;
    setFrom(null);
    if (dx < -40) go(1);
    else if (dx > 40) go(-1);
    else go(1);
  };

  return (
    <div className="ending">
      <img className="ending__bg" src="/seolmundae.png" alt="" />
      <AudioPlayer src="/audio/14-ieodo/ending.mp3" />

      <div className="ending__cap"
           onPointerDown={e => setFrom(e.clientX)}
           onPointerUp={onUp}
           onPointerCancel={() => setFrom(null)}>
        <button type="button" className="ending__arrow" disabled={i === 0}
                onClick={e => { e.stopPropagation(); go(-1); }} aria-label="이전 문장">‹</button>
        <p className="ending__text">{LINES[i]}</p>
        <button type="button" className="ending__arrow" disabled={last}
                onClick={e => { e.stopPropagation(); go(1); }} aria-label="다음 문장">›</button>

        <div className="ending__dots" aria-hidden="true">
          {LINES.map((_, k) => <i key={k} className={k === i ? 'is-on' : ''} />)}
        </div>
      </div>

      {/* 메시지를 끝까지 본 사람에게만 마무리 단추를 보여준다 */}
      {last && (
        <div className="ending__foot">
          <button type="button" className="btn" onClick={onHome}>퀘스트 종료하기</button>
          <button type="button" className="btn outline" onClick={onMap}>수호 본부 바로가기</button>
        </div>
      )}
    </div>
  );
}
