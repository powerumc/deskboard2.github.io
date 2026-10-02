/*!
 * DeskBoard2 site playground
 * ---------------------------------------------------------------------------
 * Drives the live macOS desktop on the landing page:
 *   - scales a 1280 x 800 pt "screen" (640 x 800 on phones) into the hero
 *   - routes mouse, touch and modifier keys into the effects engine
 *   - runs an auto demo with a ghost cursor until the visitor takes over
 *   - renders the settings inspector from the app's preference schema
 *   - switches the page copy between English and Korean
 */
(function () {
  'use strict';

  const FX = window.DeskFX;
  if (!FX) return;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const now = () => performance.now() / 1000;
  const clamp = FX.clamp;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarsePointer = window.matchMedia('(pointer: coarse)');

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
      'nav.label': 'Primary',
      'nav.try': 'Try it',
      'nav.features': 'Features',
      'nav.new': "What's new",
      'nav.download': 'Download',
      'theme.label': 'Appearance', 'theme.system': 'Match device', 'theme.light': 'Light', 'theme.dark': 'Dark',
      'hero.eyebrow': 'Screen explanation toolkit for macOS',
      'hero.title': 'Explain <em class="ink">anything</em> on your Mac screen.',
      'hero.lede': 'DeskBoard2 adds click effects, cursor trails, and a focus highlight to your whole screen, so every demo is easy to follow. Try them on the desktop below. They are ported from the app and run right in your browser.',
      'hero.watch': 'Watch the product video',
      'hero.req': 'macOS 12.3 or later',
      'hero.price': 'Free download, Pro is a one-time purchase',
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
      'cue.sub': 'It works like a real Mac screen. Move, click, and right-click, then pick other effects on the right.',
      'cue.done': 'That is DeskBoard2. Try another effect on the right.',
      'cue.title.touch': 'Tap the desktop below.',
      'cue.sub.touch': 'It works like a real Mac screen. Tap or drag, then pick other effects below.',
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
      'new.r271': 'Fills in missing Japanese, Simplified Chinese, and Traditional Chinese strings.',
      'new.r27': 'Focus Effect clicks can play their press animation fully, with a new click perspective slider.',
      'new.r26': 'Focus Effect redesigned with shapes, borders, glow, click colors, and a magnifier.',
      'new.r25': 'Focus Effect, Key Stroke, Click Effects, and Cursor Trails now work in Full Screen.',
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
      'nav.label': '주요 메뉴',
      'nav.try': '체험하기',
      'nav.features': '기능',
      'nav.new': '새로운 기능',
      'nav.download': '다운로드',
      'theme.label': '화면 모드', 'theme.system': '기기 설정 따르기', 'theme.light': '라이트', 'theme.dark': '다크',
      'hero.eyebrow': 'macOS용 화면 설명 도구',
      'hero.title': 'Mac 화면 위에서 <em class="ink">무엇이든</em> 설명하세요.',
      'hero.lede': 'DeskBoard2는 클릭 효과, 커서 잔상, 집중 효과를 화면 전체에 더해 어떤 데모든 따라오기 쉽게 만듭니다. 아래 데스크톱에서 직접 써 보세요. 앱의 효과를 그대로 옮겨 브라우저에서 실행합니다.',
      'hero.watch': '제품 영상 보기',
      'hero.req': 'macOS 12.3 이상',
      'hero.price': '무료 다운로드, Pro는 한 번만 구매',
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
      'cue.sub': '실제 Mac 화면처럼 움직이고, 클릭하고, 우클릭해 보세요. 오른쪽에서 다른 효과도 고를 수 있습니다.',
      'cue.done': '이게 DeskBoard2입니다. 오른쪽에서 다른 효과도 골라 보세요.',
      'cue.title.touch': '아래 바탕화면을 탭해 보세요.',
      'cue.sub.touch': '실제 Mac 화면처럼 탭하거나 드래그해 보세요. 아래에서 다른 효과도 고를 수 있습니다.',
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
      'new.r271': '일본어, 중국어 간체와 번체에서 빠진 문구를 채웠습니다.',
      'new.r27': '집중 효과의 클릭 애니메이션을 끝까지 재생할 수 있고, 클릭 원근감 슬라이더가 추가되었습니다.',
      'new.r26': '집중 효과를 새로 디자인했습니다. 도형, 테두리, 글로우, 클릭 색상, 확대경을 지원합니다.',
      'new.r25': '집중 효과, 키 입력, 클릭 효과, 커서 잔상이 전체 화면에서도 동작합니다.',
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
    $$('.lang-switch button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  }

  /* =============================================================== state */
  const state = {
    click: { enabled: true, type: 'pulse', userPicked: false },
    trail: { enabled: true, type: 'line' },
    focus: { enabled: true, shape: 'squircle' },
  };

  /* =============================================================== stage */
  const stage = $('#stage');
  const desktop = $('#desktop');
  const content = $('#desk-content');
  const canvas = $('#fx');
  const ctx = canvas.getContext('2d');
  const ghost = $('#ghost');
  const stageBar = $('.stage-bar');
  const sbState = $('#sb-state');
  const sbEffect = $('#sb-effect');
  const sbHint = $('#sb-hint');
  const sbCoords = $('#sb-coords');

  const scene = new FX.FxScene();
  const stroke = new FX.StrokeStyle();
  const env = { px: 1 };
  let screen = { w: 1280, h: 800 };
  let scale = 1;
  let dpr = 1;

  const focus = new FX.FocusEffect($('#focus'), { reducedMotion: () => reduceMotion.matches });


  function layout() {
    const width = stage.clientWidth;
    if (!width) return;
    const compact = width < 560;
    screen = compact ? { w: 640, h: 800 } : { w: 1280, h: 800 };
    stage.classList.toggle('is-compact', compact);
    desktop.classList.toggle('is-compact', compact);
    scale = width / screen.w;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    desktop.style.width = `${screen.w}px`;
    desktop.style.height = `${screen.h}px`;
    desktop.style.transform = `scale(${scale})`;
    canvas.style.width = `${screen.w}px`;
    canvas.style.height = `${screen.h}px`;
    canvas.width = Math.max(1, Math.round(screen.w * scale * dpr));
    canvas.height = Math.max(1, Math.round(screen.h * scale * dpr));
    env.px = scale * dpr;
    kick();
  }

  function toLogical(event) {
    const rect = stage.getBoundingClientRect();
    return {
      x: clamp((event.clientX - rect.left) / scale, 0, screen.w),
      y: clamp((event.clientY - rect.top) / scale, 0, screen.h),
    };
  }

  // Logical point inside a [data-tour] element of the live desktop.
  function target(name, fx = 0.5, fy = 0.5) {
    const el = $(`[data-tour="${name}"]`, content);
    if (!el) return { x: screen.w / 2, y: screen.h / 2 };
    const box = el.getBoundingClientRect();
    const base = stage.getBoundingClientRect();
    return {
      x: clamp((box.left - base.left + box.width * fx) / scale, 8, screen.w - 8),
      y: clamp((box.top - base.top + box.height * fy) / scale, 30, screen.h - 8),
    };
  }

  /* ============================================================== render */
  let raf = 0;
  let paused = false;

  function kick() {
    if (!raf && !paused) raf = requestAnimationFrame(frame);
  }

  function frame() {
    raf = 0;
    const time = now();
    tour.update(time);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
    scene.render(ctx, time, env);
    const focusBusy = state.focus.enabled && focus.tick(time);
    if (scene.busy || focusBusy || tour.moving) kick();
  }

  /* ============================================================= effects */
  function playClick(point, override) {
    if (!state.click.enabled) return null;
    const type = override || state.click.type;
    const def = FX.CLICK_BY_ID[type];
    if (!def || !def.play) return null;
    scene.add(def.play({ x: point.x, y: point.y }, { t: now(), stroke: stroke.clickColor() }));
    kick();
    return type;
  }

  function trailMove(point, last) {
    if (!state.trail.enabled) return;
    if (state.trail.type === 'line') scene.trails.line.move(point, last, now(), stroke);
    else scene.trails.snow.move(point, last, now());
  }

  function resetContinuity() {
    scene.trails.line.resetContinuity();
    scene.trails.snow.resetContinuity();
  }

  /* =============================================================== input */
  const input = {
    inside: false,
    last: null,
    pos: { x: 640, y: 400 },
    buttons: new Set(),

    enter(point) {
      this.inside = true;
      this.last = null;
      resetContinuity();
      this.move(point);
    },
    move(point, options = {}) {
      this.pos = point;
      if (this.inside && !options.noTrail) trailMove(point, this.last);
      this.last = point;
      if (state.focus.enabled) focus.pointer(point.x, point.y);
      showCoords(point);
      kick();
    },
    // The focus highlight stays parked where the pointer left, so settings changes stay visible.
    leave() {
      this.inside = false;
      this.last = null;
      resetContinuity();
      this.releaseAll();
    },
    down(button) {
      this.buttons.add(button);
      if (button === 'left') playClick(this.pos, tour.running && !state.click.userPicked ? tour.effect : null);
      if (state.focus.enabled) focus.button(button, true, now());
      kick();
    },
    up(button) {
      if (!this.buttons.delete(button)) return;
      if (state.focus.enabled) focus.button(button, false, now());
      kick();
    },
    releaseAll() {
      [...this.buttons].forEach((b) => this.up(b));
    },
  };

  let interacted = false;

  stage.addEventListener('pointerenter', (event) => {
    if (event.pointerType === 'mouse') takeOver();
    input.enter(toLogical(event));
  });

  stage.addEventListener('pointermove', (event) => {
    if (tour.running) takeOver();
    const point = toLogical(event);
    if (!input.inside) input.enter(point);
    const rightOnly = (event.buttons & 2) && !(event.buttons & 1);
    input.move(point, { noTrail: rightOnly });
  });

  stage.addEventListener('pointerleave', () => {
    input.leave();
    scheduleResume();
  });

  stage.addEventListener('pointerdown', (event) => {
    takeOver();
    const point = toLogical(event);
    if (!input.inside) input.enter(point);
    else input.move(point);
    input.down(event.button === 2 ? 'right' : 'left');
    if (document.activeElement !== stage) stage.focus({ preventScroll: true });
    markTried();
  });

  window.addEventListener('pointerup', (event) => input.up(event.button === 2 ? 'right' : 'left'));
  window.addEventListener('pointercancel', () => input.releaseAll());
  stage.addEventListener('contextmenu', (event) => event.preventDefault());

  /* ========================================================== status bar */
  let barMode = 'demo';

  // The big prompt above the desktop changes once the visitor has clicked it.
  const cue = $('#try-cue');
  let tried = false;
  function updateCue() {
    const touch = coarsePointer.matches;
    const suffix = touch ? '.touch' : '';
    const title = $('.try-title > span:first-child', cue);
    title.dataset.i18n = (tried ? 'cue.done' : 'cue.title') + suffix;
    title.textContent = t(title.dataset.i18n);
    const sub = $('#try-sub');
    sub.dataset.i18n = 'cue.sub' + suffix;
    sub.textContent = t(sub.dataset.i18n);
  }
  function markTried() {
    if (tried) return;
    tried = true;
    cue.classList.add('is-done');
    updateCue();
  }

  function setBar(mode) {
    barMode = mode;
    stageBar.classList.toggle('is-live', mode === 'live');
    sbState.textContent = t(mode === 'live' ? 'bar.live' : 'bar.demo');
    let effect = '';
    if (mode === 'demo' && tour.effect && state.click.enabled) effect = t(`fx.${tour.effect}`);
    else if (mode === 'live' && state.click.enabled) effect = t(`fx.${state.click.type}`);
    sbEffect.textContent = effect ? ` · ${effect}` : '';
  }

  function updateHint() {
    sbHint.textContent = coarsePointer.matches ? t('bar.hint.touch') : t('bar.hint.mouse');
  }

  function showCoords(point) {
    const pad = (n) => String(Math.round(n)).padStart(4, ' ');
    sbCoords.textContent = `x ${pad(point.x)} · y ${pad(point.y)} pt`;
  }

  /* ================================================================ tour */
  const SHOWCASE = ['spark', 'check', 'catPaw', 'pulse'];
  const easeMove = FX.cubicBezier(0.45, 0, 0.25, 1);
  let resumeTimer = 0;

  const tour = {
    gen: 0,
    running: false,
    motion: null,
    effect: null,
    showcase: 0,
    get moving() { return this.motion !== null; },
    update(time) {
      const m = this.motion;
      if (!m) return;
      if (m.start === null) m.start = time;
      const u = clamp((time - m.start) / m.duration, 0, 1);
      const k = easeMove(u);
      const a = 1 - k;
      const point = {
        x: a * a * m.from.x + 2 * a * k * m.ctrl.x + k * k * m.to.x,
        y: a * a * m.from.y + 2 * a * k * m.ctrl.y + k * k * m.to.y,
      };
      placeGhost(point);
      input.move(point);
      if (u >= 1) {
        this.motion = null;
        m.resolve();
      }
    },
  };

  function placeGhost(point) {
    ghost.style.transform = `translate(${(point.x - 3).toFixed(1)}px, ${(point.y - 3).toFixed(1)}px)`;
  }

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function moveTo(to, duration, bend) {
    return new Promise((resolve) => {
      const from = { ...input.pos };
      const dx = to.x - from.x, dy = to.y - from.y;
      const len = Math.hypot(dx, dy) || 1;
      const curve = (bend ?? 0.16) * (Math.random() < 0.5 ? -1 : 1);
      const ctrl = { x: (from.x + to.x) / 2 - (dy / len) * len * curve, y: (from.y + to.y) / 2 + (dx / len) * len * curve };
      tour.motion = { from, to, ctrl, duration: duration / 1000, start: null, resolve };
      kick();
    });
  }

  async function tourClick(gen, button, hold = 110) {
    if (button === 'left') {
      tour.effect = SHOWCASE[tour.showcase++ % SHOWCASE.length];
      if (state.click.userPicked) tour.effect = state.click.type;
      setBar('demo');
    }
    input.down(button);
    await sleep(hold);
    if (gen === tour.gen) input.up(button);
  }

  async function runTour(gen) {
    const live = () => gen === tour.gen;
    await sleep(650);
    while (live()) {
      await moveTo(target('peak', 0.5, 0.22), 950);
      if (!live()) return;
      await tourClick(gen, 'left');
      await sleep(950);
      if (!live()) return;
      await moveTo(target('callout', 0.3, 0.5), 750);
      if (!live()) return;
      await tourClick(gen, 'left');
      await sleep(950);
      if (!live()) return;
      await moveTo(target('pricing', 0.5, 0.45), 1050);
      if (!live()) return;
      await sleep(500);
      if (!live()) return;
      await moveTo(target('title', 0.25, 0.5), 950);
      if (!live()) return;
      await tourClick(gen, 'right', 420);
      await sleep(700);
      if (!live()) return;
      await moveTo(target('mon', 0.5, -1.4), 1250, 0.32);
      if (!live()) return;
      await tourClick(gen, 'left');
      await sleep(1050);
      if (!live()) return;
      await moveTo(target('dock', 0.5, 0.45), 1000);
      if (!live()) return;
      await tourClick(gen, 'left');
      await sleep(1250);
      if (!live()) return;
      await moveTo(target('done', 0.06, 0.5), 950);
      if (!live()) return;
      await tourClick(gen, 'left');
      await sleep(1400);
    }
  }

  function startTour() {
    clearTimeout(resumeTimer);
    if (tour.running || paused) return;
    tour.gen++;
    tour.running = true;
    ghost.toggleAttribute('hidden', false);
    placeGhost(input.pos);
    input.enter(input.pos);
    setBar('demo');
    runTour(tour.gen);
  }

  function stopTour() {
    if (!tour.running) return;
    tour.gen++;
    tour.running = false;
    if (tour.motion) {
      tour.motion.resolve();
      tour.motion = null;
    }
    ghost.toggleAttribute('hidden', true);
    input.leave();
  }

  function takeOver() {
    clearTimeout(resumeTimer);
    interacted = true;
    stopTour();
    if (barMode !== 'live') setBar('live');
  }

  // The demo comes back after a quiet spell, but never while someone is adjusting settings.
  let lastSettingsUse = 0;
  function scheduleResume() {
    clearTimeout(resumeTimer);
    if (reduceMotion.matches) return;
    resumeTimer = setTimeout(() => {
      if (performance.now() - lastSettingsUse < 7000) scheduleResume();
      else if (!input.inside && !paused) startTour();
    }, 7000);
  }
  ['pointerdown', 'keydown', 'input'].forEach((type) =>
    $('.inspector').addEventListener(type, () => { lastSettingsUse = performance.now(); }, true));

  // Keyboard users can press Enter or Space on the focused desktop to click at the current spot.
  stage.addEventListener('keydown', (event) => {
    if ((event.key !== 'Enter' && event.key !== ' ') || event.repeat) return;
    event.preventDefault();
    takeOver();
    input.down('left');
    setTimeout(() => input.up('left'), 110);
  });

  /* =========================================================== inspector */
  function h(tag, attrs = {}, ...children) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (value === undefined || value === null || value === false) continue;
      if (key === 'class') el.className = value;
      else if (key === 'text') el.textContent = value;
      else if (key === 'html') el.innerHTML = value;
      else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2), value);
      else el.setAttribute(key, value === true ? '' : String(value));
    }
    for (const child of children.flat()) {
      if (child === null || child === undefined || child === false) continue;
      el.append(child.nodeType ? child : document.createTextNode(String(child)));
    }
    return el;
  }

  function segmentedField({ id, label, options, value, onChange, readout }) {
    const labelId = `${id}-label`;
    const group = h('div', { class: 'seg', role: 'radiogroup', 'aria-labelledby': labelId, id });
    const readoutEl = readout ? h('span', { class: 'value', text: readout(value) }) : null;
    const buttons = options.map((option) => {
      const selected = option.value === value;
      const button = h('button', {
        type: 'button', role: 'radio', id: `${id}-${option.value}`,
        'aria-checked': String(selected), tabindex: selected ? '0' : '-1',
        'aria-label': option.aria || null, title: option.aria || null,
      });
      if (option.icon) button.innerHTML = option.icon;
      if (option.text) button.append(option.text);
      button.addEventListener('click', () => select(option.value, false));
      group.append(button);
      return button;
    });
    function select(next, moveFocus) {
      value = next;
      buttons.forEach((button, i) => {
        const on = options[i].value === next;
        button.setAttribute('aria-checked', String(on));
        button.tabIndex = on ? 0 : -1;
        if (on && moveFocus) button.focus();
      });
      if (readoutEl) readoutEl.textContent = readout(next);
      onChange(next);
    }
    group.addEventListener('keydown', (event) => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
      if (!step) return;
      event.preventDefault();
      const index = options.findIndex((o) => o.value === value);
      select(options[(index + step + options.length) % options.length].value, true);
    });
    return h('div', { class: 'field' }, h('div', { class: 'field-row' }, h('span', { class: 'field-label', id: labelId, text: label }), readoutEl), group);
  }

  function switchButton({ id, checked, labelledby, label, onChange, small = true }) {
    const button = h('button', {
      type: 'button', role: 'switch', id, class: small ? 'switch is-small' : 'switch',
      'aria-checked': String(checked), 'aria-labelledby': labelledby || null, 'aria-label': label || null,
    });
    button.addEventListener('click', () => {
      const next = button.getAttribute('aria-checked') !== 'true';
      button.setAttribute('aria-checked', String(next));
      onChange(next);
    });
    return button;
  }

  function paneHead(kind, enabled, onToggle) {
    const titleId = `pane-${kind}-title`;
    return h('div', { class: 'pane-head' },
      h('h2', { id: titleId, text: t(`tab.${kind}`) }),
      switchButton({ id: `${kind}-enabled`, checked: enabled, label: t(`enable.${kind}`), small: false, onChange: onToggle }),
      h('p', { text: t(`pane.${kind}.desc`) }));
  }

  const GLYPHS = {
    pulse: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7.5"/></svg>',
    ripple: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="6.5" opacity=".7"/><circle cx="12" cy="12" r="10" opacity=".4"/></svg>',
    radar: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="9" stroke-dasharray="2.6 2.4" opacity=".7"/></svg>',
    spark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5v4.5M12 17v4.5M2.5 12H7M17 12h4.5M5.3 5.3l3 3M15.7 15.7l3 3M18.7 5.3l-3 3M8.3 15.7l-3 3"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 12.5l4.8 4.8L19.5 6.5" stroke-width="2.2"/></svg>',
    catPaw: '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="currentColor" stroke="none"><ellipse cx="6.6" cy="10" rx="1.9" ry="2.4" transform="rotate(-24 6.6 10)"/><ellipse cx="10.2" cy="6.6" rx="2" ry="2.5" transform="rotate(-8 10.2 6.6)"/><ellipse cx="13.8" cy="6.6" rx="2" ry="2.5" transform="rotate(8 13.8 6.6)"/><ellipse cx="17.4" cy="10" rx="1.9" ry="2.4" transform="rotate(24 17.4 10)"/><path d="M12 11.3c2.7 0 5.1 3 5.1 5.3 0 1.8-1.4 2.7-2.9 2.5-1-.1-1.4-.5-2.2-.5s-1.2.4-2.2.5c-1.5.2-2.9-.7-2.9-2.5 0-2.3 2.4-5.3 5.1-5.3z"/></g></svg>',
    emoji: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 3c.6 4.3 2.4 6.3 6.6 7.1-4.2.8-6 2.8-6.6 7.1-.6-4.3-2.4-6.3-6.6-7.1C8.6 9.3 10.4 7.3 11 3z"/><path d="M18.4 14.6c.3 1.6 1 2.3 2.6 2.6-1.6.3-2.3 1-2.6 2.6-.3-1.6-1-2.3-2.6-2.6 1.6-.3 2.3-1 2.6-2.6z"/></svg>',
    lightning: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.2 2.5 5.5 13.6h5.6l-1.2 7.9 7.6-11.1H12z"/></svg>',
    confetti: '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="currentColor" stroke="none"><rect x="4" y="4.5" width="3" height="4.6" rx=".7" transform="rotate(-24 5.5 6.8)"/><rect x="15.5" y="3.5" width="3" height="4.6" rx=".7" transform="rotate(28 17 5.8)"/><circle cx="11.5" cy="11" r="1.7"/><rect x="5.5" y="14.5" width="3" height="4.6" rx=".7" transform="rotate(38 7 16.8)"/><path d="M16.8 13.6l2.4 2.4-2.4 2.4-2.4-2.4z"/></g></svg>',
    confettiBlast: '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="currentColor" stroke="none"><rect x="10.5" y="10.5" width="3" height="3"/><rect x="4" y="4" width="2.6" height="2.6"/><rect x="17.4" y="4" width="2.6" height="2.6"/><rect x="4" y="17.4" width="2.6" height="2.6"/><rect x="17.4" y="17.4" width="2.6" height="2.6"/><rect x="11" y="2.5" width="2" height="2"/><rect x="11" y="19.5" width="2" height="2"/><rect x="2.5" y="11" width="2" height="2"/><rect x="19.5" y="11" width="2" height="2"/></g></svg>',
    fire: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.2c-3.6 0-6.1-2.4-6.1-5.7 0-3.6 2.8-5.3 3.7-8.6 1.9 1.3 2.7 3 2.7 4.7 1-.6 1.7-1.9 1.8-3.1 2.4 1.8 4 4.3 4 7 0 3.3-2.5 5.7-6.1 5.7z"/></svg>',
  };

  const SHAPE_ICONS = {
    circle: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7.5"/></svg>',
    rhombus: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${FX.focusShapePath('rhombus', 4, 4, 16, 16)}"/></svg>`,
    squircle: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${FX.focusShapePath('squircle', 4.5, 4.5, 15, 15)}"/></svg>`,
    rectangle: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4.5" y="4.5" width="15" height="15"/></svg>',
  };


  /* ---------------------------------------------------------- click pane */
  const paneClick = $('#pane-click');
  const paneTrail = $('#pane-trail');
  const paneFocus = $('#pane-focus');

  function renderClickPane() {
    const c = state.click;
    const grid = h('div', { class: 'fx-grid', role: 'radiogroup', 'aria-labelledby': 'click-effect-label' });
    FX.CLICK_EFFECTS.forEach((def) => {
      if (def.separator) grid.append(h('span', { class: 'fx-sep', 'aria-hidden': 'true' }));
      const selected = c.type === def.id;
      const available = !def.locked;
      const chip = h('button', {
        type: 'button', role: 'radio', class: 'fx-chip', id: `fx-${def.id}`,
        'aria-checked': String(selected), tabindex: selected ? '0' : '-1', 'data-effect': def.id,
        disabled: !available,
      });
      chip.innerHTML = GLYPHS[def.id] || '';
      chip.append(h('span', { text: t(`fx.${def.id}`) }));
      chip.addEventListener('click', () => selectClick(def.id));
      grid.append(chip);
    });
    grid.addEventListener('keydown', (event) => {
      const step = { ArrowRight: 1, ArrowDown: 3, ArrowLeft: -1, ArrowUp: -3 }[event.key];
      if (!step) return;
      event.preventDefault();
      const list = FX.CLICK_EFFECTS.filter((e) => !e.locked);
      const index = list.findIndex((e) => e.id === c.type);
      const next = list[(index + step + list.length) % list.length].id;
      selectClick(next);
      const chip = $(`#fx-${next}`);
      if (chip) chip.focus();
    });

    paneClick.replaceChildren(
      paneHead('click', c.enabled, (on) => {
        c.enabled = on;
        updateTabDots();
        setBar(barMode);
      }),
      h('div', { class: 'group' }, h('p', { class: 'group-label', id: 'click-effect-label', text: t('group.effect') }), grid),
    );
  }

  function selectClick(id) {
    const c = state.click;
    c.type = id;
    c.userPicked = true;
    if (!c.enabled) {
      c.enabled = true;
      const toggle = $('#click-enabled');
      if (toggle) toggle.setAttribute('aria-checked', 'true');
      updateTabDots();
    }
    $$('.fx-chip').forEach((chip) => {
      const on = chip.dataset.effect === id;
      chip.setAttribute('aria-checked', String(on));
      chip.tabIndex = on ? 0 : -1;
    });
    setBar(barMode);
    previewClick();
  }

  function previewClick() {
    const point = input.inside ? input.pos : target('peak', 0.5, 0.2);
    playClick(point);
  }

  /* ---------------------------------------------------------- trail pane */
  function renderTrailPane() {
    const tr = state.trail;
    paneTrail.replaceChildren(
      paneHead('trail', tr.enabled, (on) => {
        tr.enabled = on;
        resetContinuity();
        updateTabDots();
      }),
      h('div', { class: 'group' },
        segmentedField({
          id: 'trail-type', label: t('group.type'), value: tr.type,
          options: [{ value: 'line', text: t('trail.line') }, { value: 'snow', text: t('trail.snow') }],
          onChange: (type) => {
            tr.type = type;
            resetContinuity();
            if (!tr.enabled) {
              tr.enabled = true;
              const toggle = $('#trail-enabled');
              if (toggle) toggle.setAttribute('aria-checked', 'true');
              updateTabDots();
            }
          },
        })),
    );
  }

  /* ---------------------------------------------------------- focus pane */
  function setFocusShape(shape) {
    state.focus.shape = shape;
    focus.setShape(shape);
    kick();
  }

  function setFocusEnabled(on) {
    state.focus.enabled = on;
    focus.setActive(on);
    if (on) focus.pointer(input.pos.x, input.pos.y);
    const toggle = $('#focus-enabled');
    if (toggle) toggle.setAttribute('aria-checked', String(on));
    updateTabDots();
    kick();
  }

  function renderFocusPane() {
    const f = state.focus;
    const option = (key) => ({ value: key, text: t(`opt.${key}`) });
    // Locked controls are labels only: they show what the app offers but do nothing here.
    const locked = () => {};
    const holdButton = h('button', { type: 'button', class: 'hold-btn', id: 'focus-hold' }, h('kbd', { text: '⌘' }), t('focus.hold'));

    paneFocus.replaceChildren(
      paneHead('focus', f.enabled, (on) => setFocusEnabled(on)),
      h('div', { class: 'group' },
        h('p', { class: 'group-label', text: t('group.appearance') }),
        segmentedField({
          id: 'focus-shape', label: t('focus.shape'), value: f.shape,
          readout: (v) => t(`opt.${v}`),
          options: ['circle', 'rhombus', 'squircle', 'rectangle'].map((s) => ({ value: s, icon: SHAPE_ICONS[s], aria: t(`opt.${s}`) })),
          onChange: setFocusShape,
        }),
        segmentedField({
          id: 'focus-size', label: t('focus.size'), value: 'regular',
          readout: () => `${FX.FOCUS.size} pt`,
          options: ['small', 'regular', 'large', 'extraLarge'].map(option),
          onChange: locked,
        }),
        segmentedField({
          id: 'focus-style', label: t('focus.borderStyle'), value: 'solid',
          options: ['solid', 'dashed'].map(option),
          onChange: locked,
        }),
        segmentedField({
          id: 'focus-glow', label: t('focus.glow'), value: 'soft',
          options: ['hidden', 'soft', 'shiny'].map(option),
          onChange: locked,
        })),
      h('div', { class: 'group' },
        h('p', { class: 'group-label', text: t('group.magnifier') }),
        holdButton),
    );
    // Only the shape is open in the web preview; every other focus control is shown but disabled.
    $$('button, input', paneFocus).forEach((control) => {
      if (control.closest('#focus-shape') || control.id === 'focus-enabled') return;
      control.disabled = true;
      const field = control.closest('.field');
      if (field) field.classList.add('is-disabled');
    });
  }

  /* ---------------------------------------------------------------- tabs */
  const TABS = ['click', 'trail', 'focus'];

  function selectTab(id, moveFocus) {
    TABS.forEach((key) => {
      const tab = $(`#tab-${key}`);
      const pane = $(`#pane-${key}`);
      const on = key === id;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      pane.hidden = !on;
      if (on && moveFocus) tab.focus();
    });
  }

  function updateTabDots() {
    const on = { click: state.click.enabled, trail: state.trail.enabled, focus: state.focus.enabled };
    TABS.forEach((key) => {
      const dot = $(`#tab-${key} .tab-dot`);
      if (dot) dot.classList.toggle('is-on', on[key]);
    });
  }

  TABS.forEach((key, index) => {
    const tab = $(`#tab-${key}`);
    tab.addEventListener('click', () => selectTab(key));
    tab.addEventListener('keydown', (event) => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
      if (event.key === 'Home') selectTab(TABS[0], true);
      else if (event.key === 'End') selectTab(TABS[TABS.length - 1], true);
      else if (step) selectTab(TABS[(index + step + TABS.length) % TABS.length], true);
      else return;
      event.preventDefault();
    });
  });

  function renderInspector() {
    renderClickPane();
    renderTrailPane();
    renderFocusPane();
    updateTabDots();
  }

  /* =============================================================== misc */
  const clock = $('#mb-clock');
  function updateClock() {
    const date = new Date();
    if (lang === 'ko') {
      const day = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' }).format(date);
      const time = new Intl.DateTimeFormat('ko-KR', { hour: 'numeric', minute: '2-digit' }).format(date);
      clock.textContent = `${day} ${time}`;
    } else {
      const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
      const day = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
      const time = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(date);
      clock.textContent = `${weekday} ${day} ${time}`;
    }
  }

  function setLang(next) {
    if (next === lang) return;
    lang = next;
    try { localStorage.setItem('deskboard2.lang', next); } catch (error) { /* storage unavailable */ }
    applyCopy();
    renderInspector();
    updateClock();
    updateHint();
    setBar(barMode);
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
      frame.replaceChildren(h('iframe', {
        src: `https://www.youtube-nocookie.com/embed/${link.dataset.video}?autoplay=1&rel=0&playsinline=1`,
        title: link.textContent.trim(),
        allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen',
        allowfullscreen: true,
      }));
      dialog.showModal();
    }));
    dialog.addEventListener('close', () => $('#video-frame').replaceChildren());
  }

  $('#sb-replay').addEventListener('click', () => {
    stopTour();
    startTour();
  });

  /* ========================================================== lifecycle */
  const visibility = new IntersectionObserver((entries) => {
    const visible = entries.some((entry) => entry.isIntersecting);
    if (visible) {
      paused = document.hidden;
      kick();
      if (!interacted && !tour.running && !reduceMotion.matches) startTour();
    } else {
      paused = true;
      if (tour.running) {
        stopTour();
        setBar('demo');
      }
    }
  }, { threshold: 0.12 });

  document.addEventListener('visibilitychange', () => {
    paused = document.hidden;
    if (document.hidden) input.releaseAll();
    else kick();
  });

  if ('ResizeObserver' in window) new ResizeObserver(() => layout()).observe(stage);
  else window.addEventListener('resize', layout);

  coarsePointer.addEventListener?.('change', () => { updateHint(); updateCue(); });

  // Boot
  applyCopy();
  renderInspector();
  selectTab('click');
  layout();
  updateClock();
  setInterval(updateClock, 20000);
  updateHint();
  updateCue();
  syncHeader();

  const start = target('peak', 0.5, 0.22);
  input.pos = start;
  placeGhost(start);
  ghost.toggleAttribute('hidden', false);
  focus.setActive(true);
  focus.pointer(start.x, start.y);
  showCoords(start);
  setBar('demo');
  visibility.observe(stage);
  kick();
})();
