'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Scratch from '@/components/Scratch';
import HintModal from '@/components/HintModal';

// 7-1. 사전 퀘스트 — 대본 2차 기준
//   알림음과 함께 메시지가 화면 한가운데 바로 열린다 → 가려진 힌트 → 코드 탐색
// 동자석의 목소리는 이 모달이 아니라 사전 퀘스트 미션의 '동자석의 메시지' 장에서 들려준다.
const DIR = '/prequest';

const MESSAGE = '“수호자여, 나를 찾아 주세요.”';
const SUB = '메시지 아래에 가려진 힌트를 확인하세요.';
const HINT = '내가 잠들어 있는 곳입니다.\n이곳에 남겨진 식별 코드를 찾아주세요.';

function HintImage() {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return <img className="pq__hintimg" src={`${DIR}/prequest_hint.png`} alt="식별코드가 숨은 물건들"
              onError={() => setFailed(true)} />;
}

export default function PreQuest({ onDone }) {
  const [hint, setHint] = useState(false);
  const router = useRouter();

  // 메시지가 도착했음을 알리는 짧은 알림음만 울린다(막히면 조용히 넘어간다).
  useEffect(() => {
    const a = new Audio(`${DIR}/notify.wav`);
    a.play().catch(() => {});
    return () => { a.pause(); };
  }, []);

  // 사전 퀘스트는 건너뛸 수 없다. 힌트를 다 지워야 코드 탐색으로 나갈 수 있다.
  const toScan = () => { onDone(); router.push('/scan'); };

  return (
    <div className="pq">
      <div className="pq__card">
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

        {/* 힌트를 다 지우기 전에는 다음으로 갈 수 없다 */}
        {hint && (
          <>
            <button type="button" className="btn" onClick={toScan}>코드 탐색</button>
            {/* 지운 그림을 다시 크게 들여다볼 수 있게 따로 띄운다 */}
            <HintModal image={`${DIR}/prequest_hint2.png`} hint="나는 여기에 있어요."
                       className="btn outline pq__hintbtn" />
            <button type="button" className="btn pq__skip" onClick={onDone}>넘어가기</button>
          </>
        )}
      </div>
    </div>
  );
}
