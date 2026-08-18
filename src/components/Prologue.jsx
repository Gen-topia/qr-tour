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

// 세계관 학습 — 세로형 영상을 나레이션과 함께 본다(미션 나레이션도 같은 플레이어를 쓴다).
// audioSrc를 주면 영상 위에 나레이션 음성을 얹어 함께 재생한다.
export default function Prologue({ onEnd, onClose, src = '/prologue.mp4', audioSrc = null, label = '프롤로그' }) {
  const ref = useRef(null);
  const audioRef = useRef(null);
  const [needTap, setNeedTap] = useState(false);   // 브라우저가 소리 있는 자동재생을 막은 경우
  const [failed, setFailed] = useState(false);     // 영상을 불러오지 못한 경우
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [time, setTime] = useState(0);
  const [videoDur, setVideoDur] = useState(0);
  const [audioDur, setAudioDur] = useState(0);

  // 나레이션이 영상보다 길 수 있으므로 긴 쪽을 전체 길이로 삼는다
  const dur = Math.max(videoDur, audioDur);
  const ended = useRef({ video: false, audio: !audioSrc });

  const finish = (which) => {
    ended.current[which] = true;
    if (ended.current.video && ended.current.audio) onEnd?.();
  };

  // 영상과 음성을 같이 재생/정지한다
  const playBoth = () => {
    const a = audioRef.current;
    if (a && audioSrc) a.play().catch(() => {});
    return ref.current?.play();
  };
  const pauseBoth = () => {
    ref.current?.pause();
    audioRef.current?.pause();
  };

  useEffect(() => { playBoth()?.catch(() => setNeedTap(true)); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onTap = () => {
    setNeedTap(false);
    playBoth()?.catch(() => setFailed(true));
  };

  // 네이티브 컨트롤은 재생 중 자동으로 숨겨져서, 항상 보이는 컨트롤바를 직접 쓴다
  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) { setNeedTap(false); playBoth()?.catch(() => setFailed(true)); }
    else pauseBoth();
  };
  const toggleMute = () => {
    const next = !muted;
    if (ref.current) ref.current.muted = next;
    if (audioRef.current) audioRef.current.muted = next;
    setMuted(next);
  };
  const seek = (e) => {
    const t = Number(e.target.value);
    const v = ref.current, a = audioRef.current;
    if (v) { v.currentTime = Math.min(t, videoDur || t); ended.current.video = false; }
    if (a && audioSrc) { a.currentTime = Math.min(t, audioDur || t); ended.current.audio = false; }
    setTime(t);
    if (playing) playBoth();
  };

  // 영상이 먼저 끝나면 시계는 나레이션이 이어받는다
  const tick = (t) => setTime(prev => (t > prev || Math.abs(t - prev) > 1 ? t : prev));

  return (
    <div className="prologue">
      <video
        ref={ref}
        className="prologue__video"
        src={src}
        playsInline
        preload="auto"
        onEnded={() => finish('video')}
        onError={() => setFailed(true)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onVolumeChange={e => setMuted(e.currentTarget.muted)}
        onTimeUpdate={e => tick(e.currentTarget.currentTime)}
        onLoadedMetadata={e => setVideoDur(e.currentTarget.duration)}
      />
      {audioSrc && (
        <audio
          ref={audioRef}
          src={audioSrc}
          preload="auto"
          onEnded={() => finish('audio')}
          /* 음성이 없어도 영상은 그대로 볼 수 있게 실패는 넘긴다 */
          onError={() => { ended.current.audio = true; }}
          onTimeUpdate={e => tick(e.currentTarget.currentTime)}
          onLoadedMetadata={e => setAudioDur(e.currentTarget.duration)}
        />
      )}
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
