'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Scratch from '@/components/Scratch';

// 7-1. 사전 퀘스트 — 대본 2차 기준
//   알림음과 함께 메시지가 화면 한가운데 바로 열린다 → 가려진 힌트 → 코드 탐색
// 음성·알림음은 public/prequest/ 에 둔다(없으면 조용히 건너뛴다).
const DIR = '/prequest';

const MESSAGE = '“수호자여, 나를 찾아 주세요.”';
const SUB = '메시지 아래에 가려진 힌트를 확인하세요.';
const HINT = '내가 있는 곳에 남겨진 비밀 식별코드를 찾아 거울을 비춰 보세요.';

function HintImage() {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return <img className="pq__hintimg" src={`${DIR}/hint.png`} alt="동자석" onError={() => setFailed(true)} />;
}

export default function PreQuest({ onDone }) {
  const [hint, setHint] = useState(false);
  const router = useRouter();
  const voiceRef = useRef(null);

  // 아직 화면을 누른 적이 없으면 브라우저가 소리를 막는다.
  // 막히더라도 카드를 누르는 순간 이어서 재생된다.
  const playVoice = () => {
    const v = voiceRef.current;
    if (v && v.paused) v.play().catch(() => {});
  };

  useEffect(() => {
    const a = new Audio(`${DIR}/notify.wav`);
    a.play().catch(() => {});
    playVoice();
    return () => { a.pause(); };
  }, []);

  const close = () => { voiceRef.current?.pause(); onDone(); };
  const toScan = () => { voiceRef.current?.pause(); onDone(); router.push('/scan'); };

  return (
    <div className="pq" onClick={close}>
      <audio ref={voiceRef} src={`${DIR}/prequest.mp3`} preload="auto" />
      <div className="pq__card" onClick={e => { e.stopPropagation(); playVoice(); }}>
        <div className="pq__eyebrow">사전 퀘스트가 도착했습니다.</div>
        <p className="pq__msg">{MESSAGE}</p>
        <p className="pq__sub">{SUB}</p>

        {/* 하얀 입김을 손가락으로 지우면 그 아래에서 그림과 글이 함께 나타난다 */}
        <div className={`pq__hint${hint ? ' is-open' : ''}`}>
          {hint ? (
            <div className="pq__under"><HintImage /><p className="pq__hinttext">{HINT}</p></div>
          ) : (
            <Scratch className="pq__scratch" cover="#f6f7f9" radius={26}
                     onProgress={p => { if (p >= 0.55) setHint(true); }}>
              <div className="pq__under"><HintImage /><p className="pq__hinttext">{HINT}</p></div>
              <span className="pq__rub">손가락으로 문질러 힌트를 확인하세요</span>
            </Scratch>
          )}
        </div>

        <button type="button" className="btn" onClick={toScan}>코드 탐색</button>
        <button type="button" className="pq__later" onClick={close}>나중에 하기</button>
      </div>
    </div>
  );
}
