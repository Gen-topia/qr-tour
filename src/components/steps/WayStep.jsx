'use client';
import { useRouter } from 'next/navigation';

// 다음 장소로 가는 길 — config.photos에 적어둔 사진을 차례로 보여준다.
// '코드 탐색'을 누르면 이 미션을 완수 처리하고 코드 탐색 화면으로 넘어간다.
export default function WayStep({ step, submit, onPrev }) {
  const photos = step.config?.photos || [];
  const router = useRouter();

  const goScan = async () => {
    await submit({ done: true });
    router.replace('/scan');
  };

  return (
    <div className="stack">
      {photos.map((src, i) => (
        <img key={src} className="way__photo" src={src} alt={`가는 길 ${i + 1}`} />
      ))}
      <div className="grow" />
      <button type="button" className="btn" onClick={goScan}>코드 탐색</button>
      <button type="button" className="btn outline outline--bare" onClick={onPrev}>이전으로</button>
    </div>
  );
}
