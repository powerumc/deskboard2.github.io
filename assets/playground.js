/*!
 * DeskBoard2 site playground
 * ---------------------------------------------------------------------------
 * Drives the live macOS desktop on the landing page:
 *   - scales a 1280 x 800 pt "screen" (640 x 800 on phones) into the hero
 *   - routes mouse, touch and modifier keys into the effects engine
 *   - runs an auto demo with a ghost cursor until the visitor takes over
 *   - renders the settings inspector from the app's preference schema
 * Page copy, language and theme live in site.js, which must load first.
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

  const site = window.DeskSite;
  if (!site) return;
  const t = site.t;

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
    if (site.lang === 'ko') {
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

  site.onLangChange(() => {
    renderInspector();
    updateClock();
    updateHint();
    setBar(barMode);
  });

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
  renderInspector();
  selectTab('click');
  layout();
  updateClock();
  setInterval(updateClock, 20000);
  updateHint();
  updateCue();

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
