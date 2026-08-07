// 모든 화면이 같은 위치·모양의 로딩을 쓰도록 통일(전환 시 깜빡임 방지)
export default function Loading({ label = '불러오는 중…' }) {
  return (
    <div className="screen center">
      <div className="grow" />
      <div className="lantern" />
      <p className="muted">{label}</p>
      <div className="grow" />
    </div>
  );
}
