# DeskBoard2 웹사이트 리디자인 시안

`gh-pages`(Jekyll) 운영 사이트를 바꾸기 전에 검토하기 위한 정적 시안입니다.

## 미리보기

```bash
npx http-server redesign -p 8080   # 또는 아무 정적 서버
```

## 구성

- `index.html` — 랜딩 페이지 (EN/한국어 전환)
- `assets/effects.js` — 앱 효과의 웹 이식본
  - 클릭 효과: `DeskBoard2/Effects/ClickEffects/*.swift` (펄스, 립플, 레이더 파형, 스파크, 체크 표시, 고양이 발자국, 이모지, 번개, 색종이 날림, 색종이 폭발, 불꽃)
  - 커서 잔상: `CursorTrailEffects/*.swift` (선, 눈)
  - 집중 효과: `FocusEffect{Overlay,State,Configuration}.swift` (도형, 테두리, 글로우, 클릭 원근 스프링, 확대경, 비활성 동작)
- `assets/playground.js` — 데스크톱 무대, 입력 처리, 자동 데모, 설정 패널, 다국어 문구
- `assets/site.css` — 라이트/다크 토큰과 레이아웃

## 참고

- 유튜브 영상은 deskboard2.com / localhost / github.io 에서만 인라인 플레이어로 열리고, 그 외에는 새 탭 링크로 동작합니다.
- 운영 반영 시 섹션을 `_includes/*.html`로 나누고 `assets/` 파일을 그대로 옮기면 됩니다.
