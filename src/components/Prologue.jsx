'use client';
import { useEffect, useRef, useState } from 'react';

const fmt = (s) => {
  if (!Number.isFinite(s)) return '0:00';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

// 컨트롤 아이콘 — 이모지 대신 흰색 픽토그램으로 통일한다
const PATHS = {
  play:  <path d="M8 5.2v13.6L18.4 12z" />,
  pause: <path d="M7.4 5.2h3.3v13.6H7.4zM13.3 5.2h3.3v13.6h-3.3z" />,
  sound: <>
    <path d="M4 9.4v5.2h3.6L12.4 18V6l-4.8 3.4z" />
    <path d="M15.6 9.2a4 4 0 0 1 0 5.6M18.4 6.8a7.6 7.6 0 0 1 0 10.4"
      fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </>,
  mute: <>
    <path d="M4 9.4v5.2h3.6L12.4 18V6l-4.8 3.4z" />
    <path d="m15.6 9.6 5 4.8M20.6 9.6l-5 4.8"
      fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </>,
};

const Icon = ({ name }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    {PATHS[name]}
  </svg>
);

// 세계관 학습 — 세로형 영상을 나레이션과 함께 본다(미션 나레이션도 같은 플레이어를 쓴다)
export default function Prologue({ onEnd, onClose, src = '/prologue.mp4', label = '프롤로그' }) {
  const ref = useRef(null);
  const [needTap, setNeedTap] = useState(false);   // 브라우저가 소리 있는 자동재생을 막은 경우
  const [failed, setFailed] = useState(false);     // 영상을 불러오지 못한 경우
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);

  useEffect(() => { ref.current?.play().catch(() => setNeedTap(true)); }, []);

  const onTap = () => {
    setNeedTap(false);
    ref.current?.play().catch(() => setFailed(true));
  };

  // 네이티브 컨트롤은 재생 중 자동으로 숨겨져서, 항상 보이는 컨트롤바를 직접 쓴다
  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) { setNeedTap(false); v.play().catch(() => setFailed(true)); }
    else v.pause();
  };
  const toggleMute = () => {
    const v = ref.current;
    if (v) v.muted = !v.muted;
  };
  const seek = (e) => {
    const t = Number(e.target.value);
    if (ref.current) ref.current.currentTime = t;
    setTime(t);
  };

  return (
    <div className="prologue">
      <video
        ref={ref}
        className="prologue__video"
        src={src}
        playsInline
        preload="auto"
        onEnded={onEnd}
        onError={() => setFailed(true)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onVolumeChange={e => setMuted(e.currentTarget.muted)}
        onTimeUpdate={e => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={e => setDur(e.currentTarget.duration)}
      />
      {needTap && !failed && (
        <button type="button" className="prologue__tap" onClick={onTap}>
          <span className="prologue__play" />
          <span>탭하여 {label} 보기</span>
        </button>
      )}
      <button type="button" className="prologue__close" onClick={onClose} aria-label="닫기">✕</button>
      {!failed && (
        <div className="prologue__bar">
          <button type="button" className="prologue__toggle" onClick={toggle}
            aria-label={playing ? '일시정지' : '재생'}><Icon name={playing ? 'pause' : 'play'} /></button>
          <input className="prologue__seek" type="range" aria-label="재생 위치"
            min={0} max={dur || 0} step="any" value={time} onChange={seek} />
          <span className="prologue__time">{fmt(time)} / {fmt(dur)}</span>
          <button type="button" className="prologue__mute" onClick={toggleMute}
            aria-label={muted ? '음소거 해제' : '음소거'}><Icon name={muted ? 'mute' : 'sound'} /></button>
        </div>
      )}
      {failed && (
        <div className="prologue__fallback">
          <p className="muted center">{label} 영상을 불러오지 못했어요.</p>
          <button className="btn" onClick={onEnd}>다음</button>
        </div>
      )}
    </div>
  );
}
