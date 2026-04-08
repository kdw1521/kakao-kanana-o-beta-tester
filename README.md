# 고민고민하지마 휴먼 (Kakao Kanana-O)

카카오의 차세대 AI 'Kanana-O' 베타테스트를 위해 제작된 AI 고민 해결/비교 웹 애플리케이션입니다. 두 가지 상황을 입력하면 카나나가 어떤 선택이 더 나을지 판별하고, 그 이유와 설명을 **텍스트**나 직접 소리내어 말하는 **오디오(음성)** 형태로 알려줍니다.

<br/>

## ✨ 주요 기능
- **직관적인 VS 대결 레이아웃**: 어떤 상황에 처했는지 "상황 1"과 "상황 2"를 적어 넣을 수 있는 미려한 Glassmorphism 기반 UI를 제공합니다.
- **자동 프롬프트 생성**: 사용자의 입력은 백그라운드 서버 액션을 통해 `[상황1] vs [상황2] 둘 중 어느것이 나을까? 나은이유와 설명도 추가해줘` 라는 완성된 LLM 프롬프트로 변환되어 전달됩니다.
- **음성/텍스트 멀티모달 지원**: Kanana-O의 `text` 및 `audio` modalities 기능을 활용하여 텍스트 답변뿐만 아니라 네이티브 서버 사이닝 오디오(WAV 스트리밍 병합) 생성을 지원합니다.
- **공유 및 복사**: API 응답이 성공적으로 팝업창에 나타나면 클립보드에 내용을 복사하거나 모바일 네이티브 공유 다이얼로그(Web Share API - 카카오톡 등 연동)를 띄울 수 있습니다.
- **전역 로딩 경험 차단**: 통신 중에는 뒷배경의 입력을 완벽하게 차단하고 스피너를 보여주는 오버레이를 제공합니다.

<br/>

## 🛠 기술 스택
- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Styling**: Vanilla CSS (커스텀 변수와 CSS 애니메이션으로 구성된 다크톤 디자인)
- **Package Manager**: [pnpm](https://pnpm.io/)
- **API Communication**: Next.js Server Actions (`actions.ts`), SSE (Server-Sent Events) 스트림 PCM 오디오 파싱

<br/>

## 🚀 설치 및 시작 방법

### 1. 환경 변수 설정
프로젝트 최상단 루트에 `.env.local` 파일을 생성하고 발급받은 카나나 O API Key를 설정합니다. 파일에 사용할 양식은 `.env.example` 파일을 참고하세요.

```env
# .env.local 예시
KANANA_O_API_KEY=발급받은_당신의_카카오_카나나_API_KEY
```

### 2. 패키지 설치
이 프로젝트는 `pnpm`을 사용합니다.
```bash
pnpm install
```

### 3. 개발 서버 실행
```bash
pnpm run dev
# 또는
pnpm dev
```
기본적으로 브라우저에서 [http://localhost:3000](http://localhost:3000) 으로 접속하여 사용할 수 있습니다.

<br/>

## 📂 주요 폴더 구조
- `src/app/page.tsx`: 클라이언트 사이드 UI 화면 (레이아웃, 입력 폼, 로딩창, 결과 모달 렌더링).
- `src/app/globals.css`: Tailwind 없이 오직 Vanilla CSS 로 작성된 글로벌 스타일, 애니메이션, 글래스모피즘 효과 파일.
- `src/app/actions.ts`: **서버 사이드 로직**. 클라이언트에서 안전하게 API Key를 보호하며 Kanana-O 서버와 SSE 스트림 통신 및 오디오 바이너리 처리(PCM to WAV Base64 인코딩)를 단독으로 수행합니다.
