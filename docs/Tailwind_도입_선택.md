# (선택) Tailwind 도입 가이드

> 리테마(톤 변경)만 목적이면 **도입하지 마세요.** 지금 토큰 시스템이 더 빠릅니다.
> 앞으로 새 화면을 유틸리티 클래스로 많이 만들 때만 고려하세요.

## 설치 (Next.js)
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

`tailwind.config.js`:
```js
export default {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // 기존 토큰과 연결해 두면 Tailwind에서도 같은 색을 씀
      colors: {
        night: 'var(--night)', lantern: 'var(--lantern)',
        paper: 'var(--paper)', talisman: 'var(--talisman)',
      },
      borderRadius: { token: 'var(--radius)' },
    },
  },
  plugins: [],
};
```

`src/app/globals.css` 맨 위에 추가:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## 주의
- **기존 화면은 커스텀 CSS 클래스(.btn/.card 등)라 자동으로 안 바뀝니다.** Tailwind는 새로 만드는 마크업에만 적용돼요.
- 기존 것을 Tailwind로 옮기려면 컴포넌트별 수동 변환이 필요(16일 일정엔 비추천).
- 추천 전략: **기존 화면은 토큰 CSS 유지 + 새 컴포넌트만 Tailwind** 혼용.

## 그 외 유용할 수 있는 플러그인 (필요 시)
- `@tailwindcss/forms` — 폼 요소 기본 스타일.
- `clsx` 또는 `tailwind-merge` — 조건부 className 정리.
- 아이콘: `lucide-react` (탭바/버튼 아이콘을 이모지 대신 SVG로).
