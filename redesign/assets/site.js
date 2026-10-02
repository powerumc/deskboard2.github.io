/*!
 * DeskBoard2 site chrome
 * ---------------------------------------------------------------------------
 * Shared by every page: English/Korean copy, the light/dark switch, the
 * header shadow, and the inline product video. Exposes window.DeskSite so the
 * landing-page playground can translate its own controls.
 */
(function () {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const listeners = [];

  /* ================================================================ copy */
  const I18N = {
    en: {
      'group.type': 'Trail effect',
      'trail.line': 'Line', 'trail.snow': 'Snow',
      'group.appearance': 'Appearance',
      'focus.shape': 'Shape', 'focus.size': 'Size', 'focus.borderWeight': 'Border weight', 'focus.borderStyle': 'Border style',
      'focus.glow': 'Glow', 'focus.accent': 'Accent color', 'focus.animateClicks': 'Animate clicks',
      'opt.circle': 'Circle', 'opt.rhombus': 'Rhombus', 'opt.squircle': 'Rounded Rectangle', 'opt.rectangle': 'Rectangle',
      'opt.small': 'Small', 'opt.regular': 'Regular', 'opt.large': 'Large', 'opt.extraLarge': 'Extra large',
      'opt.solid': 'Solid', 'opt.dashed': 'Dashed', 'opt.hidden': 'Hidden', 'opt.soft': 'Soft', 'opt.shiny': 'Shiny',
      'nav.skip': 'Skip to the live demo',
      'nav.skipContent': 'Skip to content',
      'nav.label': 'Primary',
      'nav.try': 'Try it',
      'nav.features': 'Features',
      'nav.new': "What's new",
      'nav.download': 'Download',
      'theme.label': 'Appearance', 'theme.system': 'Match device', 'theme.light': 'Light', 'theme.dark': 'Dark',
      'hero.eyebrow': 'For everyone who works by showing a screen',
      'hero.title': 'Point once. <em class="ink">Everyone</em> follows.',
      'hero.lede': 'The moment your audience hunts for the cursor, they stop listening.',
      'hero.forLabel': 'Made for',
      'hero.for1': 'Teachers',
      'hero.for2': 'Developers',
      'hero.for3': 'Sales & demos',
      'hero.for4': 'YouTubers',
      'hero.for5': 'Designers',
      'hero.for6': 'Customer support',
      'hero.watch': 'Watch the product video',
      'cta.badge': 'Download on the Mac App Store',
      'stage.label': 'Interactive desktop. Move the pointer and click to try the effects.',
      'desk.app': 'Slides', 'desk.file': 'File', 'desk.edit': 'Edit', 'desk.insert': 'Insert', 'desk.format': 'Format',
      'desk.view': 'View', 'desk.play': 'Play', 'desk.window': 'Window', 'desk.help': 'Help',
      'desk.screenshot': 'Screenshot 2026-10-02 at 9.41.12 AM.png',
      'desk.slidesTitle': 'Q3 Launch Review',
      'desk.kicker': 'Launch week',
      'desk.chartTitle': 'Daily active users',
      'desk.mon': 'Mon', 'desk.tue': 'Tue', 'desk.wed': 'Wed', 'desk.thu': 'Thu', 'desk.fri': 'Fri', 'desk.sat': 'Sat', 'desk.sun': 'Sun',
      'desk.callout': '<strong>+118%</strong> on launch day',
      'desk.source': 'Source: product analytics, week of Sep 22',
      'desk.notesTitle': 'Demo script',
      'desk.item1': 'Open the new onboarding flow',
      'desk.item2': 'Show the shortcut',
      'desk.item3': 'Zoom into the pricing table',
      'desk.item4': 'Record a 30-second clip',
      'desk.plan': 'Plan', 'desk.seats': 'Seats', 'desk.price': 'Price',
      'desk.starter': 'Starter', 'desk.team': 'Team', 'desk.business': 'Business',
      'desk.fine': 'Prices in USD, billed monthly. Annual plans save 20%.',
      'cue.title': 'Click the desktop below.',
      'cue.sub': 'Move, click, and right-click. Pick other effects on the right.',
      'cue.done': 'That is DeskBoard2. Try another effect on the right.',
      'cue.title.touch': 'Tap the desktop below.',
      'cue.sub.touch': 'Tap or drag. Pick other effects below.',
      'cue.done.touch': 'That is DeskBoard2. Try another effect below.',
      'bar.demo': 'Auto demo',
      'bar.live': 'Your turn',
      'bar.replay': 'Replay demo',
      'bar.hint.mouse': 'Click or right-click on the desktop',
      'bar.hint.touch': 'Tap or drag on the desktop',
      'insp.label': 'Effect settings',
      'insp.tabs': 'Effects',
      'tab.click': 'Click Effect',
      'tab.trail': 'Cursor Trail',
      'tab.focus': 'Focus Effect',
      'features.eyebrow': 'The rest of the toolkit',
      'features.title': 'Draw, capture, record, and show every shortcut.',
      'features.lede': 'Every tool lives in one light layer above your apps. Open it from the menu bar or the screen edge, explain, and get back to work.',
      'f1.title': 'Drawing',
      'f1.body': 'Pens, shapes, text, markers, and blur, drawn right where the explanation happens. Undo, select, and duplicate like any editor.',
      'f2.title': 'Edge Toolbar',
      'f2.body': 'Pull the toolbar from the screen edge, switch between drawing and pointing, and tuck it away without covering your content.',
      'f3.title': 'Capture',
      'f3.body': 'Grab a region or a window, pin it, edit it, turn the text into Markdown, or translate it live.',
      'f4.title': 'Recording',
      'f4.body': 'Record an area with microphone and system audio, control it from a floating bar, then trim the clip and reuse it.',
      'f5.title': 'Key Stroke',
      'f5.body': 'Show shortcuts as keycaps while you work. Pick the shape, size, and position, and block patterns you never want on screen.',
      'f6.title': 'Camera Overlay',
      'f6.body': 'Stay on screen with subject masking and a blurred, solid, pixelated, or transparent background.',
      'f6.note': 'Video coming soon',
      'watch': 'Watch video',
      'new.eyebrow': 'Changelog',
      'new.title': 'Recent releases',
      'new.all': 'Full changelog',
      'cta.title': 'DeskBoard2 for macOS',
      'cta.body': 'Draw, point, capture, and record with one tool that stays out of the way until you need it.',
      'cta.req': 'Requires macOS 12.3 Monterey or later',
      'cta.note': "The effects on this page are web ports of the app's effects for preview. In DeskBoard2 they draw over every app on your screen.",
      'footer.tag': 'Screen explanation tools for Mac.',
      'footer.label': 'Footer',
      'footer.changelog': 'Changelog',
      'footer.privacy': 'Privacy Policy',
      'footer.contact': 'Contact',
      'video.close': 'Close',

      'pane.click.desc': 'Plays at every click, so viewers never lose the pointer.',
      'pane.trail.desc': 'Leaves a short trail behind the pointer as it moves.',
      'pane.focus.desc': 'Keeps a highlight around the pointer, reacts to clicks, and magnifies on demand.',
      'enable.click': 'Use click effect',
      'enable.trail': 'Use cursor trail',
      'enable.focus': 'Use focus effect',
      'group.effect': 'Effect',
      'group.magnifier': 'Magnifier',
      'fx.pulse': 'Pulse', 'fx.ripple': 'Ripple', 'fx.radar': 'Radar Wave', 'fx.spark': 'Spark Burst',
      'fx.check': 'Check Mark', 'fx.catPaw': 'Cat Paw', 'fx.emoji': 'Emoji', 'fx.lightning': 'Lightning',
      'fx.confetti': 'Confetti', 'fx.confettiBlast': 'Confetti Blast', 'fx.fire': 'Fire',
      'f.size': 'Size', 'f.duration': 'Duration',
      'f.pulse.lineWidth': 'Pulse line width',
      'f.ripple.ringCount': 'Ripple ring count', 'f.ripple.ringDelay': 'Ripple ring delay',
      'f.radar.waveCount': 'Radar wave count', 'f.radar.gap': 'Radar gap', 'f.radar.lineWidth': 'Radar line width',
      'f.spark.particleCount': 'Spark particle count', 'f.spark.segmentLength': 'Spark segment length',
      'f.spark.segmentThickness': 'Spark segment thickness',
      'f.check.thickness': 'Check thickness', 'f.check.jitterRange': 'Check jitter range',
      'f.catPaw.spreadRadius': 'Cat paw spread radius', 'f.catPaw.rotationRange': 'Cat paw rotation range',
      'f.emoji.value': 'Emoji', 'f.emoji.opacity': 'Emoji opacity', 'f.emoji.spreadRadius': 'Emoji spread radius',
      'f.emoji.rotationRange': 'Emoji rotation range',
      'f.lightning.branchCount': 'Lightning branch count', 'f.lightning.detailLevel': 'Lightning detail level',
      'f.confetti.paletteCount': 'Palette count', 'f.confetti.density': 'Confetti density',
      'f.confettiBlast.particleCount': 'Blast particle count', 'f.confettiBlast.speedScale': 'Blast speed scale',
      'f.fire.intensity': 'Fire intensity', 'f.fire.turbulence': 'Fire turbulence chance',
      'focus.hold': 'Hold to magnify',
      'swatch.rainbow': 'Rainbow', 'swatch.cherry': 'Cherry', 'swatch.russet': 'Russet', 'swatch.lemon': 'Lemon',
      'swatch.lime': 'Lime', 'swatch.sprout': 'Sprout', 'swatch.seafoam': 'Sea Foam', 'swatch.seagreen': 'Sea Green',
      'swatch.aqua': 'Aqua', 'swatch.blueberry': 'Blueberry', 'swatch.grape': 'Grape', 'swatch.magenta': 'Magenta',
      'swatch.strawberry': 'Strawberry', 'swatch.white': 'White',
    },
    ko: {
      'group.type': '잔상 효과',
      'trail.line': '선', 'trail.snow': '눈',
      'group.appearance': '외형',
      'focus.shape': '도형', 'focus.size': '크기', 'focus.borderWeight': '테두리 굵기', 'focus.borderStyle': '테두리 스타일',
      'focus.glow': '글로우', 'focus.accent': '강조 색상', 'focus.animateClicks': '클릭 애니메이션',
      'opt.circle': '원', 'opt.rhombus': '마름모', 'opt.squircle': '둥근 사각형', 'opt.rectangle': '사각형',
      'opt.small': '작게', 'opt.regular': '보통', 'opt.large': '크게', 'opt.extraLarge': '매우 크게',
      'opt.solid': '실선', 'opt.dashed': '점선', 'opt.hidden': '없음', 'opt.soft': '부드럽게', 'opt.shiny': '선명하게',
      'nav.skip': '라이브 데모로 건너뛰기',
      'nav.skipContent': '본문으로 건너뛰기',
      'nav.label': '주요 메뉴',
      'nav.try': '체험하기',
      'nav.features': '기능',
      'nav.new': '새로운 기능',
      'nav.download': '다운로드',
      'theme.label': '화면 모드', 'theme.system': '기기 설정 따르기', 'theme.light': '라이트', 'theme.dark': '다크',
      'hero.eyebrow': '화면을 보여주며 일하는 모든 사람을 위해',
      'hero.title': '한 번 가리키면, <em class="ink">모두</em>가 따라옵니다.',
      'hero.lede': '커서를 찾아 헤매는 순간, 듣는 사람은 집중을 잃습니다.',
      'hero.forLabel': '이런 분들을 위해',
      'hero.for1': '강사·교육자',
      'hero.for2': '개발자',
      'hero.for3': '세일즈·제품 데모',
      'hero.for4': '유튜버·크리에이터',
      'hero.for5': '디자이너',
      'hero.for6': '고객 지원',
      'hero.watch': '제품 영상 보기',
      'cta.badge': 'Mac App Store에서 다운로드',
      'stage.label': '체험용 데스크톱입니다. 포인터를 움직이고 클릭해 효과를 확인하세요.',
      'desk.app': '슬라이드', 'desk.file': '파일', 'desk.edit': '편집', 'desk.insert': '삽입', 'desk.format': '포맷',
      'desk.view': '보기', 'desk.play': '재생', 'desk.window': '윈도우', 'desk.help': '도움말',
      'desk.screenshot': '스크린샷 2026-10-02 오전 9.41.12.png',
      'desk.slidesTitle': '3분기 출시 리뷰',
      'desk.kicker': '출시 주간',
      'desk.chartTitle': '일간 활성 사용자',
      'desk.mon': '월', 'desk.tue': '화', 'desk.wed': '수', 'desk.thu': '목', 'desk.fri': '금', 'desk.sat': '토', 'desk.sun': '일',
      'desk.callout': '출시 당일 <strong>+118%</strong>',
      'desk.source': '출처: 제품 분석, 9월 22일 주간',
      'desk.notesTitle': '데모 대본',
      'desk.item1': '새 온보딩 화면 열기',
      'desk.item2': '단축키 보여주기',
      'desk.item3': '가격표 확대해서 보여주기',
      'desk.item4': '30초 클립 녹화하기',
      'desk.plan': '요금제', 'desk.seats': '좌석', 'desk.price': '가격',
      'desk.starter': '스타터', 'desk.team': '팀', 'desk.business': '비즈니스',
      'desk.fine': '가격은 USD 기준이며 매월 청구됩니다. 연간 요금제는 20% 저렴합니다.',
      'cue.title': '아래 바탕화면을 클릭해 보세요.',
      'cue.sub': '움직이고, 클릭하고, 우클릭해 보세요. 다른 효과는 오른쪽에서 고르세요.',
      'cue.done': '이게 DeskBoard2입니다. 오른쪽에서 다른 효과도 골라 보세요.',
      'cue.title.touch': '아래 바탕화면을 탭해 보세요.',
      'cue.sub.touch': '탭하거나 드래그해 보세요. 다른 효과는 아래에서 고르세요.',
      'cue.done.touch': '이게 DeskBoard2입니다. 아래에서 다른 효과도 골라 보세요.',
      'bar.demo': '자동 데모',
      'bar.live': '직접 체험 중',
      'bar.replay': '데모 다시 보기',
      'bar.hint.mouse': '데스크톱에서 클릭하거나 우클릭해 보세요',
      'bar.hint.touch': '데스크톱을 탭하거나 드래그해 보세요',
      'insp.label': '효과 설정',
      'insp.tabs': '효과 종류',
      'tab.click': '클릭 효과',
      'tab.trail': '커서 잔상',
      'tab.focus': '집중 효과',
      'features.eyebrow': '더 많은 도구',
      'features.title': '그리고, 캡처하고, 녹화하고, 단축키까지 보여주세요.',
      'features.lede': '모든 도구가 앱 위의 가벼운 레이어 하나에 있습니다. 메뉴 막대나 화면 가장자리에서 열어 설명하고, 바로 하던 일로 돌아가세요.',
      'f1.title': '드로잉',
      'f1.body': '펜, 도형, 텍스트, 마커, 블러를 설명하는 바로 그 자리에 그립니다. 실행 취소, 선택, 복제도 편집기처럼 됩니다.',
      'f2.title': '엣지 툴바',
      'f2.body': '화면 가장자리에서 툴바를 꺼내 그리기와 포인팅을 오가고, 화면을 가리지 않게 다시 넣어 두세요.',
      'f3.title': '캡처',
      'f3.body': '영역이나 창을 캡처해 고정하고 편집하며, 텍스트를 마크다운으로 추출하거나 실시간으로 번역합니다.',
      'f4.title': '화면 녹화',
      'f4.body': '마이크와 시스템 오디오를 함께 녹화하고, 플로팅 바로 제어한 뒤 클립을 다듬어 바로 활용하세요.',
      'f5.title': '키 입력',
      'f5.body': '작업 중 누르는 단축키를 키캡으로 보여줍니다. 모양, 크기, 위치를 고르고 화면에 나오면 안 되는 입력은 차단하세요.',
      'f6.title': '카메라 오버레이',
      'f6.body': '피사체를 분리하고 배경을 흐림, 단색, 픽셀, 투명으로 바꿔 화면 위에 내 모습을 띄웁니다.',
      'f6.note': '영상 준비 중',
      'watch': '영상 보기',
      'new.eyebrow': '업데이트 내역',
      'new.title': '최근 릴리즈',
      'new.all': '전체 업데이트 내역',
      'cta.title': 'macOS용 DeskBoard2',
      'cta.body': '필요할 때만 나타나는 도구 하나로 그리고, 가리키고, 캡처하고, 녹화하세요.',
      'cta.req': 'macOS 12.3 Monterey 이상 필요',
      'cta.note': '이 페이지의 효과는 미리보기를 위해 앱의 효과를 웹으로 옮긴 것입니다. DeskBoard2에서는 화면의 모든 앱 위에 그려집니다.',
      'footer.tag': 'Mac을 위한 화면 설명 도구.',
      'footer.label': '하단 메뉴',
      'footer.changelog': '업데이트 내역',
      'footer.privacy': '개인정보 처리방침',
      'footer.contact': '문의',
      'video.close': '닫기',

      'pane.click.desc': '클릭할 때마다 효과를 재생해 시청자가 포인터를 놓치지 않습니다.',
      'pane.trail.desc': '포인터가 지나간 자리에 짧은 잔상을 남깁니다.',
      'pane.focus.desc': '포인터 주변을 강조하고, 클릭에 반응하며, 원할 때 확대해 보여줍니다.',
      'enable.click': '클릭 효과 사용',
      'enable.trail': '커서 잔상 사용',
      'enable.focus': '집중 효과 사용',
      'group.effect': '효과',
      'group.magnifier': '확대경',
      'fx.pulse': '펄스', 'fx.ripple': '립플', 'fx.radar': '레이더 파형', 'fx.spark': '스파크',
      'fx.check': '체크 표시', 'fx.catPaw': '고양이 발자국', 'fx.emoji': '이모지', 'fx.lightning': '번개',
      'fx.confetti': '색종이 날림', 'fx.confettiBlast': '색종이 폭발', 'fx.fire': '불꽃',
      'f.size': '크기', 'f.duration': '재생 시간',
      'f.pulse.lineWidth': '펄스 선 두께',
      'f.ripple.ringCount': '립플 링 개수', 'f.ripple.ringDelay': '립플 링 지연',
      'f.radar.waveCount': '레이더 파동 수', 'f.radar.gap': '레이더 간격', 'f.radar.lineWidth': '레이더 선 두께',
      'f.spark.particleCount': '스파크 입자 수', 'f.spark.segmentLength': '스파크 선 길이',
      'f.spark.segmentThickness': '스파크 선 두께',
      'f.check.thickness': '체크 두께', 'f.check.jitterRange': '체크 흔들림 범위',
      'f.catPaw.spreadRadius': '고양이 발자국 퍼짐 반경', 'f.catPaw.rotationRange': '고양이 발자국 회전 범위',
      'f.emoji.value': '이모지', 'f.emoji.opacity': '이모지 투명도', 'f.emoji.spreadRadius': '이모지 퍼짐 반경',
      'f.emoji.rotationRange': '이모지 회전 범위',
      'f.lightning.branchCount': '번개 가지 수', 'f.lightning.detailLevel': '번개 디테일 수준',
      'f.confetti.paletteCount': '팔레트 개수', 'f.confetti.density': '색종이 밀도',
      'f.confettiBlast.particleCount': '폭발 입자 수', 'f.confettiBlast.speedScale': '폭발 속도 배율',
      'f.fire.intensity': '불꽃 세기', 'f.fire.turbulence': '불꽃 난류 확률',
      'focus.hold': '눌러서 확대',
      'swatch.rainbow': '무지개', 'swatch.cherry': '체리', 'swatch.russet': '적갈색', 'swatch.lemon': '레몬',
      'swatch.lime': '라임', 'swatch.sprout': '새싹', 'swatch.seafoam': '물거품', 'swatch.seagreen': '바다 녹색',
      'swatch.aqua': '아쿠아', 'swatch.blueberry': '블루베리', 'swatch.grape': '포도', 'swatch.magenta': '마젠타',
      'swatch.strawberry': '딸기', 'swatch.white': '흰색',
    },
  };

  let lang = initialLang();

  function initialLang() {
    try {
      const saved = localStorage.getItem('deskboard2.lang');
      if (saved === 'en' || saved === 'ko') return saved;
    } catch (error) { /* storage unavailable */ }
    return /^ko\b/i.test(navigator.language || '') ? 'ko' : 'en';
  }

  function t(key, vars) {
    let text = (I18N[lang] && I18N[lang][key]) ?? I18N.en[key] ?? key;
    if (vars) for (const [name, value] of Object.entries(vars)) text = text.replace(`{${name}}`, value);
    return text;
  }

  function applyCopy() {
    document.documentElement.lang = lang;
    $$('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    $$('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
    $$('[data-i18n-attr]').forEach((el) => {
      el.dataset.i18nAttr.split(';').forEach((pair) => {
        const [attr, key] = pair.split(':');
        if (attr && key) el.setAttribute(attr.trim(), t(key.trim()));
      });
    });
    // Text rendered by Jekyll from site data carries its Korean copy in data-ko.
    $$('[data-ko]').forEach((el) => {
      if (el.dataset.en === undefined) el.dataset.en = el.textContent;
      el.textContent = lang === 'ko' && el.dataset.ko ? el.dataset.ko : el.dataset.en;
    });
    $$('.lang-switch button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  }

  function setLang(next) {
    if (next === lang) return;
    lang = next;
    try { localStorage.setItem('deskboard2.lang', next); } catch (error) { /* storage unavailable */ }
    applyCopy();
    listeners.forEach((fn) => fn(lang));
  }

  $$('.lang-switch button').forEach((button) => button.addEventListener('click', () => setLang(button.dataset.lang)));

  // Appearance follows the device until the visitor picks light or dark; the choice is remembered.
  const themeButtons = $$('.theme-switch button');
  function setTheme(choice, moveFocus) {
    const root = document.documentElement;
    if (choice === 'system') delete root.dataset.theme;
    else root.dataset.theme = choice;
    try {
      if (choice === 'system') localStorage.removeItem('deskboard2.theme');
      else localStorage.setItem('deskboard2.theme', choice);
    } catch (error) { /* storage unavailable */ }
    themeButtons.forEach((button) => {
      const on = button.dataset.themeChoice === choice;
      button.setAttribute('aria-checked', String(on));
      button.tabIndex = on ? 0 : -1;
      if (on && moveFocus) button.focus();
    });
  }
  themeButtons.forEach((button, index) => {
    button.addEventListener('click', () => setTheme(button.dataset.themeChoice));
    button.addEventListener('keydown', (event) => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
      if (!step) return;
      event.preventDefault();
      setTheme(themeButtons[(index + step + themeButtons.length) % themeButtons.length].dataset.themeChoice, true);
    });
  });
  let savedTheme = null;
  try { savedTheme = localStorage.getItem('deskboard2.theme'); } catch (error) { /* storage unavailable */ }
  if (savedTheme === 'light' || savedTheme === 'dark') setTheme(savedTheme);
  else themeButtons.forEach((button) => {
    const on = button.dataset.themeChoice === 'system';
    button.setAttribute('aria-checked', String(on));
    button.tabIndex = on ? 0 : -1;
  });

  const header = $('.site-header');
  const syncHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', syncHeader, { passive: true });

  // Inline YouTube player on the real site; plain links elsewhere (for example inside sandboxed previews).
  const dialog = $('#video-dialog');
  const canEmbed = /(^|\.)deskboard2\.com$|(^|\.)github\.io$|^localhost$|^127\.0\.0\.1$/.test(location.hostname);
  if (canEmbed && dialog && typeof dialog.showModal === 'function') {
    $$('a.video-link[data-video]').forEach((link) => link.addEventListener('click', (event) => {
      event.preventDefault();
      const frame = $('#video-frame');
      const player = document.createElement('iframe');
      player.src = `https://www.youtube-nocookie.com/embed/${link.dataset.video}?autoplay=1&rel=0&playsinline=1`;
      player.title = link.textContent.trim();
      player.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      player.allowFullscreen = true;
      frame.replaceChildren(player);
      dialog.showModal();
    }));
    dialog.addEventListener('close', () => $('#video-frame').replaceChildren());
  }

  window.DeskSite = {
    t,
    get lang() { return lang; },
    onLangChange(fn) { listeners.push(fn); },
  };

  applyCopy();
  syncHeader();
})();
