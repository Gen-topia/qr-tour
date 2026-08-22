'use client';
import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Protected from '@/components/Protected';
import { api } from '@/lib/apiClient';
import AudioPlayer from '@/components/AudioPlayer';
import HintModal from '@/components/HintModal';
import PhotoShare from '@/components/PhotoShare';
import Loading from '@/components/Loading';
import InfoModal from '@/components/InfoModal';
import Prologue from '@/components/Prologue';
import Ending from '@/components/Ending';
import Sparkle from '@/components/Sparkle';
import QuizStep from '@/components/steps/QuizStep';
import PuzzleStep from '@/components/steps/PuzzleStep';
import ClearStep from '@/components/steps/ClearStep';
import DrawStep from '@/components/steps/DrawStep';
import ScratchStep from '@/components/steps/ScratchStep';
import GaugeStep from '@/components/steps/GaugeStep';
import DialStep from '@/components/steps/DialStep';

const PLAY_COMPONENTS = { quiz: QuizStep, puzzle: PuzzleStep, clear: ClearStep, draw: DrawStep, scratch: ScratchStep, gauge: GaugeStep, dial: DialStep };

// 장에 붙는 그림 — 그 장에 적어둔 주소를 먼저 쓰고,
// 없으면 첫 장에 한해 관리툴의 '첫 페이지 이미지 URL'을,
// 그것도 없으면 public/quest_intro_{미션번호}.png를 찾는다.
// 어느 쪽도 없으면 아무것도 그리지 않는다.
function StepImage({ src, fallback }) {
  const url = src || fallback;
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [url]);
  if (!url || failed) return null;
  return <img src={url} alt="" style={{ width: '100%', borderRadius: 12 }} onError={() => setFailed(true)} />;
}

function Quest() {
  const { id } = useParams();
  const router = useRouter();
  const [quest, setQuest] = useState(null);
  const [steps, setSteps] = useState(null);
  const [idx, setIdx] = useState(0);
  const [err, setErr] = useState('');
  const [result, setResult] = useState(null);
  const [ending, setEnding] = useState(false);   // 설문대할망의 메시지를 보는 중
  const [narration, setNarration] = useState(false);
  const [locked, setLocked] = useState('');   // 선행 퀘스트를 못 깬 경우의 안내 문구

  useEffect(() => {
    api.questSteps(id)
      .then(r => { setQuest(r.quest); setLocked(r.locked || ''); setSteps(r.steps); })
      .catch(e => setErr(e.message));
  }, [id]);

  // 테스트용 — 미션 화면에서 Ctrl+2를 누르면 이 미션을 곧바로 완수 처리한다.
  // 키 배열에 따라 key가 달라질 수 있어 code(Digit2)도 함께 본다.
  // 행사 전에는 이 블록과 /api/me/testclear를 함께 지운다.
  useEffect(() => {
    if (!steps || result) return;
    const onKey = (e) => {
      if (!e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.key !== '2' && e.code !== 'Digit2') return;
      e.preventDefault();
      e.stopPropagation();
      api.testClear(id)
        .then(r => setResult({ awarded: r.awarded, alreadyCleared: r.alreadyCleared,
                               mainCleared: r.mainCleared, groupCleared: r.groupCleared, mainNo: r.mainNo }))
        .catch(e2 => setErr(e2.message));
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [id, steps, result]);

  const stepId = steps?.[idx]?.id;
  const isLastStep = steps ? idx >= steps.length - 1 : false;

  // 모든 유형이 공유하는 제출 — 통과했으면 true를 돌려준다.
  // silent를 주면 마지막 장이라도 완료 화면을 띄우지 않는다(바로 다른 곳으로 보낼 때 쓴다)
  const submit = useCallback(async (payload, silent = false) => {
    try {
      const r = await api.submitAnswer(id, stepId, payload);
      if (!r.correct) return false;
      if (r.isFinal) {
        if (!silent) setResult({ awarded: r.awarded, alreadyCleared: r.alreadyCleared,
                                 mainCleared: r.mainCleared, groupCleared: r.groupCleared, mainNo: r.mainNo });
      } else setIdx(i => i + 1);
      return true;
    } catch (e) { setErr(e.message); return false; }
  }, [id, stepId]);

  if (err) return <div className="screen center"><p className="muted">{err}</p></div>;
  if (!steps) return <Loading label="퀘스트를 여는 중…" />;
  // URL로 바로 들어와도 서버가 잠금을 알려준다
  if (locked) return (
    <>
      <Loading label="퀘스트를 여는 중…" />
      <InfoModal eyebrow="아직 도전할 수 없어요" title="선행 퀘스트를 먼저 완수해 주세요"
                 confirmLabel="확인" onClose={() => router.replace('/')}>
        {locked}
      </InfoModal>
    </>
  );
  // 퀘스트3까지 모두 끝낸 사람이 '메시지 듣기'를 누르면 설문대할망의 엔딩으로 넘어간다
  if (ending) return (
    <Ending onHome={() => router.replace('/')}
            onMap={() => router.replace('/map?spot=hyangsadang')} />
  );
  if (result) return (
    <ResultView result={result} quest={quest}
                onHome={() => router.replace('/')}
                onQuestList={() => router.replace(`/missions?quest=${quest?.quest_group}`)}
                onScan={() => router.replace('/scan')}
                onEnding={() => setEnding(true)} />
  );

  const step = steps[idx];
  const isLast = isLastStep;
  const next = () => { if (!isLast) setIdx(i => i + 1); };
  const prev = () => setIdx(i => Math.max(0, i - 1));
  const Play = PLAY_COMPONENTS[step.type];

  // 갈래가 있는 이야기 장 — 관리툴 config에 적어둔 만큼 단추를 만들고,
  // 고른 단추의 장 번호(step_no)로 건너뛴다.
  // { "choices": [{ "label": "이야기를 듣는다", "step": 2 }, ...] }
  const choices = step.type === 'story' && Array.isArray(step.config?.choices)
    ? step.config.choices : null;
  const goStep = (no) => {
    const at = steps.findIndex(s => s.step_no === Number(no));
    if (at >= 0) setIdx(at);
  };
  // 코드 탐색으로 이어지는 장 — 마지막 장이면 완수 처리부터 하고 넘어간다
  const goScan = async () => {
    if (isLast) await submit({ done: true }, true);
    router.push('/scan');
  };

  // 관리툴에 적어둔 이름 → public/{이름}.mp4
  if (narration) return (
    <Prologue src={`/${quest.narration_video}.mp4`} label="나레이션"
              onEnd={() => setNarration(false)} onClose={() => setNarration(false)} />
  );

  // 짧은 안내 장은 화면 대신 모달로 띄운다(관리툴 config에 { "modal": true }).
  // 확인 단추를 누르면 다음 장으로 이어진다.
  if (step.type === 'story' && step.config?.modal) return (
    <>
      <AudioPlayer src={step.audio_url} />
      <InfoModal eyebrow={quest?.title || '미션'} title={step.title}
                 confirmLabel={step.config.cta || '확인'}
                 onClose={isLast ? () => submit({ done: true }) : next}>
        {step.body_text}
      </InfoModal>
    </>
  );

  // 첫 장(활동 안내)은 수호자 지침서와 같은 톤 — 큰 여백, 옅은 본문
  const isIntro = idx === 0;
  return (
    <div className={`screen stack fade-in qpage${isIntro ? ' qintro' : ''}`}>
      <div className="spread">
        <div className="eyebrow">{quest?.title || '미션'}</div>
        <span className="badge">{idx + 1} / {steps.length}</span>
      </div>
      {step.title && <h1 style={{ margin: '4px 0' }}>{step.title}</h1>}
      <StepImage src={step.image_url}
                 fallback={isIntro ? (quest?.cover_image_url || `/quest_intro_${id}.png`) : null} />
      {step.body_text && <p style={{ whiteSpace: 'pre-wrap' }}>{step.body_text}</p>}
      <AudioPlayer src={step.audio_url} />
      {/* 문제 푸는 장은 하단 이동 단추 줄에 힌트를 두므로 여기서는 그리지 않는다 */}
      {!Play && <HintModal hint={step.hint_text} image={step.hint_image_url} />}
      {/* 나레이션 영상은 미션 첫 장에서만 안내한다 */}
      {idx === 0 && quest?.narration_video && (
        <button className="btn ghost" onClick={() => setNarration(true)}>▶ 나레이션 보기</button>
      )}

      {/* 이야기로 끝나는 미션은 마지막 장에서 바로 완수 처리한다.
          현장 코드를 찾아야 이어지는 장은 관리툴 config에 { "next": "scan" }을 넣어 코드 탐색으로 보낸다.
          갈래가 있는 장은 { "choices": [...] }를 넣어 '다음' 대신 고르는 단추를 둔다 */}
      {step.type === 'story' && (<><div className="grow" />
        {step.config?.next === 'scan'
          ? <button className="btn" onClick={goScan}>코드 탐색</button>
          : choices
            ? choices.map(c => (
                <button key={c.label} className="btn" onClick={() => goStep(c.step)}>{c.label}</button>
              ))
            : <button className="btn" onClick={isLast ? () => submit({ done: true }) : next}>{isLast ? '퀘스트 완료' : '다음'}</button>}
      </>)}
      {step.type === 'photo' && (<><PhotoShare /><div className="grow" /><button className="btn" onClick={next}>다음</button></>)}
      {Play && <Play key={step.id} step={step} submit={submit} />}

      {/* 첫 장에서는 '다음' 아래에 메인으로 빠져나갈 길을 둔다 */}
      {isIntro && !Play && (
        <button type="button" className="btn outline" onClick={() => router.replace('/')}>이전으로</button>
      )}

      {/* 문제를 푸는 장에서는 앞 장으로 돌아가거나 그만두고 나갈 수 있어야 한다 */}
      {Play && (
        <div className="qnav">
          <button type="button" className="btn ghost" onClick={prev} disabled={idx === 0}>이전으로</button>
          <HintModal hint={step.hint_text} image={step.hint_image_url} className="btn outline" />
          <button type="button" className="btn ghost" onClick={() => router.replace('/')}>메인으로</button>
        </div>
      )}
    </div>
  );
}

// 완료 화면 그림 — 관리툴에 미션별로 적어둔 주소를 먼저 쓰고,
// 없으면 퀘스트 묶음 공용 그림(public/quest_clear_{그룹번호}.png)을 쓴다.
// 정기 그림과 같은 자리(제목 바로 아래)에 같은 크기로 놓는다.
function ClearImage({ src, group }) {
  const url = src || (group ? `/quest_clear_${group}.png` : null);
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [url]);
  if (!url || failed) return null;
  return <img className="qc__spirit" src={url} alt="" onError={() => setFailed(true)} />;
}

// 한 이야기를 모두 완수하면 얻는 그림 — 퀘스트1은 정기, 퀘스트2는 고소리술 같은 결과물.
// 퀘스트1: public/quest_spirit_{메인번호}.png (먼저 만든 규칙 그대로 둔다)
// 퀘스트2부터: public/quest_spirit_{퀘스트번호}_{메인번호}.png
function SpiritImage({ group, no }) {
  const [failed, setFailed] = useState(false);
  const src = group === 1 ? `/quest_spirit_${no}.png` : `/quest_spirit_${group}_${no}.png`;
  useEffect(() => { setFailed(false); }, [src]);
  if (!no || failed) return null;
  return <img className="qc__spirit" src={src} alt="" onError={() => setFailed(true)} />;
}

// 리워드 문구에서 **…**로 감싼 부분은 두 배 크기로 키운다(비밀번호처럼 크게 보여야 하는 값)
const big = (text) =>
  text.split(/\*\*([\s\S]+?)\*\*/).map((part, i) =>
    (i % 2 ? <b key={i} className="qc__big">{part}</b> : part));

// 이야기를 다 끝냈을 때 진행 그림을 보러 가는 버튼 — 퀘스트1은 복숭아나무, 퀘스트2는 측간신
const HERO_BUTTON = { 1: '복숭아 나무 보기', 2: '측간신 상태보기' };

function ResultView({ result, quest, onHome, onQuestList, onScan, onEnding }) {
  // 퀘스트3까지 모두 끝내면 최종 완료 — 설문대할망의 메시지로 이어진다
  const isFinal = quest?.quest_group === 3 && result.groupCleared;
  // 이야기를 다 끝냈으면 진행 그림을 보러 '나의 퀘스트'의 그 탭으로 보낸다.
  // 퀘스트1은 아직 남았을 때 다음 코드를 찾으러 보낸다.
  const heroLabel = result.mainCleared ? HERO_BUTTON[quest?.quest_group] : null;
  const toScan = quest?.quest_group === 1 && !result.mainCleared;
  return (
    <div className="sheet qc">
      <div className="sheet__panel qc__panel">
        <div className="qc__body">
          <div className="qc__rule">
            <Sparkle className="qc__star" /><i /><Sparkle className="qc__star" />
          </div>
          <h1 className="qc__title">퀘스트 완료</h1>
          {isFinal && <p className="qc__final">최종 퀘스트 완료</p>}
          {/* 제목 바로 아래 그림 — 이야기를 다 끝냈으면 정기를, 아니면 그 퀘스트의 완료 그림을.
              최종 완료는 열린 하늘 문 그림을 쓴다 */}
          {result.mainCleared && !isFinal
            ? <SpiritImage group={quest?.quest_group} no={result.mainNo} />
            : <ClearImage src={quest?.clear_image_url} group={quest?.quest_group} />}
          {/* 관리툴에 적어둔 리워드 문구(대본의 '리워드 획득') */}
          {quest?.clear_text && <p className="qc__reward">{big(quest.clear_text)}</p>}
          {/* 완수했을 때 들려주는 소리 — 파일이 없으면 버튼이 뜨지 않는다 */}
          <AudioPlayer src={quest?.clear_audio_url} />
          <p className="qc__text">
            {result.alreadyCleared ? '이미 완료한 퀘스트에요.' : ``}
          </p>
        </div>
        <div className="qc__foot">
          <button className="btn" onClick={isFinal ? onEnding : heroLabel ? onQuestList : toScan ? onScan : onHome}>
            {isFinal ? '메시지 듣기' : heroLabel || (toScan ? '코드 탐색' : '메인으로')}
          </button>
          {/* 주 단추가 메인으로가 아닐 때만 빠져나갈 길을 하나 더 둔다 */}
          {(isFinal || heroLabel || toScan) && (
            <button type="button" className="btn outline" onClick={onHome}>이전으로</button>
          )}
        </div>
      </div>
    </div>
  );
}
export default function Page() { return <Protected><Quest /></Protected>; }
