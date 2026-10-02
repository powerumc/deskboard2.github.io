# DeskBoard2 웹사이트 리디자인 시안

`gh-pages`(Jekyll) 운영 사이트를 바꾸기 전에 검토하기 위한 정적 시안입니다.

## 미리보기

```bash
npx http-server redesign -p 8080   # 또는 아무 정적 서버
```

## 구성

- `index.html`: 랜딩 페이지 (EN/한국어, 라이트/다크/기기 설정)
- `assets/effects.js`: 웹 미리보기 전용 효과 (클릭 효과 4종, 선·눈 잔상, 도형만 바꿀 수 있는 집중 효과)
- `assets/playground.js`: 데스크톱 무대, 입력 처리, 자동 데모, 설정 패널, 다국어 문구
- `assets/site.css`: 라이트/다크 토큰과 레이아웃

## 참고

- 웹 미리보기에서 잠긴 효과와 옵션은 이름만 표시되며, 이 저장소에는 구현이 포함되어 있지 않습니다.
- 유튜브 영상은 deskboard2.com / localhost / github.io 에서만 인라인 플레이어로 열리고, 그 외에는 새 탭 링크로 동작합니다.
- 한글·본문 폰트 Pretendard는 jsDelivr에서, 영문 제목 Inter Tight와 Geist Mono는 Google Fonts에서 불러옵니다.
