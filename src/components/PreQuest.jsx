'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Scratch from '@/components/Scratch';

// 7-1. 사전 퀘스트 — 대본 2차 기준
//   소리: 알림음 → 화면 아래에서 공지가 올라온다 → 메시지 → 가려진 힌트 → 코드 탐색
// 음성·알림음은 public/prequest/ 에 둔다(없으면 조용히 건너뛴다).
const DIR = '/prequest';

const MESSAGE = '“수호자여, 나를 찾아 주세요.”';
const SUB = '메시지 아래에 가려진 힌트를 확인하세요.';
const HINT = '내가 있는 곳에 남겨진 비밀 식별코드를 찾아 거울을 비춰 보세요.';

function HintImage() {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return <img className="pq__hintimg" src={`${DIR}/hint.png`} alt="" onError={() => setFailed(true)} />;
}

export default function PreQuest({ onDone }) {
  const [opened, setOpened] = useState(false);   // 공지를 눌러 메시지를 연 상태
  const [hint, setHint] = useState(false);
  const router = useRouter();
  const voiceRef = useRef(null);

  // 알림음 — 공지가 올라올 때 한 번
  useEffect(() => {
    const a = new Audio(`${DIR}/notify.mp3`);
    a.play().catch(() => {});
    return () => { a.pause(); };
  }, []);

  const open = () => {
    setOpened(true);
    voiceRef.current?.play().catch(() => {});
  };

  const close = () => { voiceRef.current?.pause(); onDone(); };
  const toScan = () => { voiceRef.current?.pause(); onDone(); router.push('/scan'); };

  // 음성은 메시지를 연 순간(사용자 조작) 재생해야 브라우저가 막지 않는다.
  // 공지↔메시지를 오가도 다시 마운트되지 않도록 오디오는 늘 같은 자리에 둔다.
  return (
    <>
      <audio ref={voiceRef} src={`${DIR}/prequest.mp3`} preload="auto" />

      {!opened ? (
        <button type="button" className="pq__notice" onClick={open}>
          <span className="pq__dot" />
          <span className="pq__noticetext">
            <b>사전 퀘스트가 도착했습니다.</b>
            <i>메시지 보기</i>
          </span>
        </button>
      ) : (
        <div className="pq" onClick={close}>
          <div className="pq__card" onClick={e => e.stopPropagation()}>
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
      )}
    </>
  );
}
