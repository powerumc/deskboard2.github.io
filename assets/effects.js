/*!
 * DeskBoard2 web preview effects
 * ---------------------------------------------------------------------------
 * A small, preview-only subset of the app's cursor effects for the website:
 *   - click effects: Pulse, Spark Burst, Check Mark, Cat Paw
 *   - cursor trails: Line, Snow
 *   - focus highlight: shape choice with a fixed look and click feedback
 * Other effects appear on the page as unavailable names only; they have no
 * implementation here. Units are points in a y-down space.
 */
(function (root) {
  'use strict';

  /* ------------------------------------------------------------------ math */
  const TAU = Math.PI * 2;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (lo, hi) => lo + Math.random() * (hi - lo);
  const vary = (base, range) => base + (Math.random() - 0.5) * range;
  const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);

  function cubicBezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sx = (t) => ((ax * t + bx) * t + cx) * t;
    const sy = (t) => ((ay * t + by) * t + cy) * t;
    const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
    function solve(x) {
      let t = x;
      for (let i = 0; i < 8; i++) {
        const err = sx(t) - x;
        if (Math.abs(err) < 1e-6) return t;
        const d = dx(t);
        if (Math.abs(d) < 1e-6) break;
        t -= err / d;
      }
      let lo = 0, hi = 1;
      t = x;
      for (let i = 0; i < 40; i++) {
        const v = sx(t);
        if (Math.abs(v - x) < 1e-6) break;
        if (x > v) lo = t; else hi = t;
        t = (lo + hi) / 2;
      }
      return t;
    }
    return (x) => (x <= 0 ? 0 : x >= 1 ? 1 : sy(solve(x)));
  }

  const Ease = {
    easeIn: cubicBezier(0.42, 0, 1, 1),
    easeOut: cubicBezier(0, 0, 0.58, 1),
  };

  /* ----------------------------------------------------------------- color */
  const rgb = (r, g, b, a = 1) => ({ r, g, b, a });

  function hex(value) {
    let s = String(value).trim().replace('#', '');
    if (s.length === 3) s = s.split('').map((c) => c + c).join('');
    const n = parseInt(s.slice(0, 6), 16);
    if (Number.isNaN(n)) return rgb(1, 1, 1);
    return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
  }

  function css(c, alpha = 1) {
    const a = clamp(c.a * alpha, 0, 1);
    return `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${a.toFixed(3)})`;
  }

  const mix = (a, b, t) => rgb(lerp(a.r, b.r, t), lerp(a.g, b.g, t), lerp(a.b, b.b, t), lerp(a.a, b.a, t));

  // Drawing palette shown in the preview: a rainbow that shifts as you click and move.
  const RAINBOW = [
    [0.85, 0.13, 0.23], [0.94, 0.32, 0.38], [0.99, 0.92, 0.2], [0.7, 0.85, 0.15], [0.56, 0.8, 0.33],
    [0.0, 0.53, 0.47], [0.56, 0.88, 0.82], [0.16, 0.63, 0.86], [0.24, 0.33, 0.7], [0.5, 0.3, 0.6],
    [0.81, 0.13, 0.52], [0.55, 0.26, 0.12], [1, 1, 1],
  ].map((c) => rgb(c[0], c[1], c[2]));

  class StrokeStyle {
    constructor() { this.step = 800; this.offset = 0; }
    sample(distance) {
      const n = Math.max(distance, 0) / this.step;
      const f = Math.floor(n);
      const i = f % RAINBOW.length;
      return mix(RAINBOW[i], RAINBOW[(i + 1) % RAINBOW.length], n - f);
    }
    advance(length) {
      this.offset = (this.offset + Math.max(length, 0)) % (this.step * RAINBOW.length);
    }
    clickColor() {
      const color = this.sample(this.offset + this.step);
      this.advance(this.step * 0.25);
      return color;
    }
    trailColor(length) {
      const color = this.sample(this.offset);
      if (length > 0) this.advance(length * 0.35);
      return color;
    }
  }

  /* ------------------------------------------------------- canvas helpers */
  function shadow(ctx, env, color, radiusPt) {
    ctx.shadowColor = color;
    ctx.shadowBlur = radiusPt * 2 * env.px;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  function partialPolyline(ctx, pts, fraction) {
    let total = 0;
    for (let i = 1; i < pts.length; i++) total += dist(pts[i - 1], pts[i]);
    let remain = total * clamp(fraction, 0, 1);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length && remain > 0; i++) {
      const seg = dist(pts[i - 1], pts[i]);
      if (seg <= remain) {
        ctx.lineTo(pts[i].x, pts[i].y);
        remain -= seg;
      } else {
        const k = remain / seg;
        ctx.lineTo(lerp(pts[i - 1].x, pts[i].x, k), lerp(pts[i - 1].y, pts[i].y, k));
        remain = 0;
      }
    }
  }

  function scatter(point, range) {
    const a = rand(0, TAU);
    const d = rand(0, Math.max(0, range * 0.5));
    return { x: point.x + Math.cos(a) * d, y: point.y + Math.sin(a) * d };
  }

  function pawPath(ctx) {
    ctx.beginPath();
    ctx.moveTo(0, -0.02);
    ctx.bezierCurveTo(0.17, -0.02, 0.31, 0.15, 0.31, 0.29);
    ctx.bezierCurveTo(0.31, 0.41, 0.21, 0.46, 0.11, 0.44);
    ctx.bezierCurveTo(0.05, 0.43, -0.05, 0.43, -0.11, 0.44);
    ctx.bezierCurveTo(-0.21, 0.46, -0.31, 0.41, -0.31, 0.29);
    ctx.bezierCurveTo(-0.31, 0.15, -0.17, -0.02, 0, -0.02);
    ctx.closePath();
    for (const [x, y, rx, ry, r] of [
      [-0.39, -0.07, 0.1, 0.13, -0.42], [-0.15, -0.31, 0.105, 0.14, -0.14],
      [0.15, -0.31, 0.105, 0.14, 0.14], [0.39, -0.07, 0.1, 0.13, 0.42],
    ]) {
      ctx.moveTo(x + rx * Math.cos(r), y + rx * Math.sin(r));
      ctx.ellipse(x, y, rx, ry, r, 0, TAU);
    }
  }

  /* --------------------------------------------------------- click effects */
  // Fixed preview look: 50 pt, 0.5 s.
  const SIZE = 50;
  const DURATION = 0.5;

  function pulse(p, o) {
    const r0 = SIZE * 0.25, r1 = SIZE;
    return {
      draw(ctx, t, env) {
        const u = (t - o.t) / DURATION;
        if (u >= 1) return false;
        const e = Ease.easeOut(u);
        ctx.save();
        ctx.globalAlpha = 1 - e;
        shadow(ctx, env, 'rgba(0,0,0,0.25)', 6);
        ctx.lineWidth = 4;
        ctx.strokeStyle = css(o.stroke, 1);
        ctx.beginPath();
        ctx.arc(p.x, p.y, lerp(r0, r1, e), 0, TAU);
        ctx.stroke();
        ctx.restore();
        return true;
      },
    };
  }

  function spark(p, o) {
    const count = 8;
    const jitter = rand(-0.3, 0.3) * (Math.PI / 16);
    const scale = SIZE / 40;
    const len = 10 * scale;
    const segments = Array.from({ length: count }, (_, i) => {
      const a = (i / count) * TAU + jitter;
      const ux = Math.cos(a), uy = Math.sin(a);
      const e0 = { x: p.x + ux * len, y: p.y + uy * len };
      const s1 = { x: p.x + ux * SIZE, y: p.y + uy * SIZE };
      const e1 = { x: e0.x + ux * SIZE, y: e0.y + uy * SIZE };
      return { e0, s1, e1, s2: { x: e1.x - ux * len * 0.2, y: e1.y - uy * len * 0.2 } };
    });
    return {
      draw(ctx, t) {
        const u = (t - o.t) / DURATION;
        if (u >= 1) return false;
        ctx.save();
        ctx.globalAlpha = 1 - Ease.easeIn(u);
        ctx.strokeStyle = css(o.stroke, 0.95);
        ctx.lineWidth = Math.max(1, scale);
        ctx.beginPath();
        for (const s of segments) {
          let a, b;
          if (u < 0.45) {
            const k = Ease.easeOut(u / 0.45);
            a = { x: lerp(p.x, s.s1.x, k), y: lerp(p.y, s.s1.y, k) };
            b = { x: lerp(s.e0.x, s.e1.x, k), y: lerp(s.e0.y, s.e1.y, k) };
          } else {
            const k = Ease.easeIn((u - 0.45) / 0.55);
            a = { x: lerp(s.s1.x, s.s2.x, k), y: lerp(s.s1.y, s.s2.y, k) };
            b = s.e1;
          }
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
        }
        ctx.stroke();
        ctx.restore();
        return true;
      },
    };
  }

  const checkEase = cubicBezier(0.2, 0.95, 0.2, 1.0);
  function check(p, o) {
    const half = SIZE * 0.5, thickness = 4, lift = 2;
    const bx = p.x + rand(-5, 5), by = p.y + rand(-5, 5);
    const pts = [
      { x: bx - half * 0.5, y: by - half * 0.4 - lift },
      { x: bx, y: by - lift },
      { x: bx + half * 0.7, y: by - half * 0.9 - lift },
    ];
    const drawDur = DURATION * 0.7, fadeDur = DURATION * 0.3;
    return {
      draw(ctx, t) {
        const el = t - o.t;
        if (el >= DURATION) return false;
        ctx.save();
        ctx.globalAlpha = el < drawDur ? 1 : 1 - Ease.easeIn((el - drawDur) / fadeDur);
        ctx.strokeStyle = css(o.stroke, 1);
        ctx.lineWidth = thickness;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        partialPolyline(ctx, pts, el < drawDur ? checkEase(el / drawDur) : 1);
        ctx.stroke();
        ctx.restore();
        return true;
      },
    };
  }

  function catPaw(p, o) {
    const side = SIZE * 0.5;
    const at = scatter(p, 24);
    const rotation = rand(0, TAU);
    return {
      draw(ctx, t) {
        const el = t - o.t;
        if (el >= DURATION + 0.5) return false;
        const alpha = el < DURATION ? 1 : 1 - Ease.easeIn((el - DURATION) / 0.5);
        ctx.save();
        ctx.translate(at.x, at.y);
        ctx.rotate(rotation);
        ctx.scale(side, side);
        ctx.fillStyle = css(o.stroke, 0.8 * alpha);
        pawPath(ctx);
        ctx.fill();
        ctx.restore();
        return true;
      },
    };
  }

  // Order matches the app's list. Locked entries are names only.
  const CLICK_EFFECTS = [
    { id: 'pulse', play: pulse },
    { id: 'ripple', locked: true },
    { id: 'radar', locked: true },
    { id: 'spark', play: spark },
    { id: 'check', play: check },
    { id: 'catPaw', play: catPaw },
    { id: 'emoji', locked: true },
    { id: 'lightning', locked: true },
    { id: 'confetti', locked: true, separator: true },
    { id: 'confettiBlast', locked: true },
    { id: 'fire', locked: true },
  ];
  const CLICK_BY_ID = Object.fromEntries(CLICK_EFFECTS.map((e) => [e.id, e]));

  /* --------------------------------------------------------- cursor trails */
  class LineTrail {
    constructor() { this.segments = []; this.lastEnd = null; }
    get busy() { return this.segments.length > 0; }
    move(point, last, t, style) {
      if (!last) return;
      const color = style.trailColor(dist(last, point));
      const start = this.lastEnd || last;
      const dx = point.x - start.x, dy = point.y - start.y;
      if (dx * dx + dy * dy < 0.25) return;
      if (this.segments.length >= 320) this.segments.shift();
      this.segments.push({ x0: start.x, y0: start.y, x1: point.x, y1: point.y, t0: t, stroke: css(color, 0.9) });
      this.lastEnd = { x: point.x, y: point.y };
    }
    resetContinuity() { this.lastEnd = null; }
    draw(ctx, t) {
      if (!this.segments.length) return;
      ctx.save();
      ctx.lineWidth = 6;
      this.segments = this.segments.filter((s) => {
        const u = (t - s.t0) / 0.15;
        if (u >= 1) return false;
        ctx.globalAlpha = 1 - u;
        ctx.strokeStyle = s.stroke;
        ctx.beginPath();
        ctx.moveTo(s.x0, s.y0);
        ctx.lineTo(s.x1, s.y1);
        ctx.stroke();
        return true;
      });
      ctx.restore();
    }
  }

  class SnowTrail {
    constructor() { this.flakes = []; this.lastSpawn = null; this.last = null; }
    get busy() { return this.flakes.length > 0; }
    move(point, _last, t) {
      const spacing = 20;
      if (this.lastSpawn) {
        const dx = point.x - this.lastSpawn.x, dy = point.y - this.lastSpawn.y;
        const steps = Math.floor(Math.hypot(dx, dy) / spacing);
        for (let i = 1; i <= steps + 1; i++) {
          this.spawn({ x: this.lastSpawn.x + (dx / (steps + 1)) * i, y: this.lastSpawn.y + (dy / (steps + 1)) * i });
        }
      } else {
        this.spawn(point);
      }
      this.lastSpawn = { x: point.x, y: point.y };
    }
    spawn(at) {
      const base = rand(0.6, 1);
      for (let i = 0; i < 2; i++) {
        const a = Math.PI / 2 + vary(0, Math.PI / 6);
        const speed = vary(59, 15);
        this.flakes.push({
          x: at.x + vary(0, 6), y: at.y + vary(0, 6), vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
          age: -i * 0.055, life: Math.max(0.05, vary(0.5, 0.6)),
          alpha: clamp(vary(base, 0.4), 0, 1), r: Math.max(0.2, 5 * Math.max(0.02, vary(0.28, 0.35))),
        });
      }
      if (this.flakes.length > 240) this.flakes.splice(0, this.flakes.length - 240);
    }
    resetContinuity() { this.lastSpawn = null; }
    draw(ctx, t) {
      const dt = this.last === null ? 0 : clamp(t - this.last, 0, 0.05);
      this.last = t;
      if (!this.flakes.length) return;
      ctx.save();
      ctx.fillStyle = '#ffffff';
      this.flakes = this.flakes.filter((f) => {
        f.age += dt;
        if (f.age < 0) return true;
        f.vx += 5 * dt;
        f.vy += 40 * dt;
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        f.alpha -= 0.05 * dt;
        if (f.age >= f.life || f.alpha <= 0) return false;
        ctx.globalAlpha = f.alpha;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, TAU);
        ctx.fill();
        return true;
      });
      ctx.restore();
    }
  }

  class FxScene {
    constructor() {
      this.items = [];
      this.trails = { line: new LineTrail(), snow: new SnowTrail() };
    }
    get busy() { return this.items.length > 0 || this.trails.line.busy || this.trails.snow.busy; }
    add(item) {
      this.items.push(item);
      if (this.items.length > 60) this.items.shift();
    }
    render(ctx, t, env) {
      this.trails.line.draw(ctx, t, env);
      this.trails.snow.draw(ctx, t, env);
      this.items = this.items.filter((item) => item.draw(ctx, t, env) !== false);
    }
  }

  /* -------------------------------------------------------- focus highlight */
  // Fixed preview look: 140 pt, 4 pt solid border, soft glow.
  const FOCUS = {
    size: 140,
    border: 4,
    shapes: ['circle', 'rhombus', 'squircle', 'rectangle'],
    colors: { idle: '#16e6b0', left: '#4f7cff', right: '#ff376a' },
  };

  function focusShapePath(shape, x, y, w, h) {
    const f = (n) => Math.round(n * 100) / 100;
    const maxX = x + w, maxY = y + h, mx = x + w / 2, my = y + h / 2;
    switch (shape) {
      case 'circle':
        return `M${f(x)},${f(my)}A${f(w / 2)},${f(h / 2)} 0 1,0 ${f(maxX)},${f(my)}A${f(w / 2)},${f(h / 2)} 0 1,0 ${f(x)},${f(my)}Z`;
      case 'rhombus': {
        const hc = w * 0.18, vc = h * 0.18;
        return `M${f(mx)},${f(y)}C${f(mx + hc)},${f(y)} ${f(maxX)},${f(my - vc)} ${f(maxX)},${f(my)}` +
          `C${f(maxX)},${f(my + vc)} ${f(mx + hc)},${f(maxY)} ${f(mx)},${f(maxY)}` +
          `C${f(mx - hc)},${f(maxY)} ${f(x)},${f(my + vc)} ${f(x)},${f(my)}` +
          `C${f(x)},${f(my - vc)} ${f(mx - hc)},${f(y)} ${f(mx)},${f(y)}Z`;
      }
      case 'squircle': {
        const rx = w * 0.34, ry = h * 0.34;
        return `M${f(x + rx)},${f(y)}H${f(maxX - rx)}A${f(rx)},${f(ry)} 0 0,1 ${f(maxX)},${f(y + ry)}` +
          `V${f(maxY - ry)}A${f(rx)},${f(ry)} 0 0,1 ${f(maxX - rx)},${f(maxY)}H${f(x + rx)}` +
          `A${f(rx)},${f(ry)} 0 0,1 ${f(x)},${f(maxY - ry)}V${f(y + ry)}A${f(rx)},${f(ry)} 0 0,1 ${f(x + rx)},${f(y)}Z`;
      }
      default:
        return `M${f(x)},${f(y)}H${f(maxX)}V${f(maxY)}H${f(x)}Z`;
    }
  }

  // Damped spring for the press feedback, capped at 0.35 s.
  const PRESS = 0.35;
  function spring(t) {
    if (t <= 0) return 0;
    if (t >= PRESS) return 1;
    const w0 = 18.71, z = 0.668, wd = w0 * Math.sqrt(1 - z * z);
    const e = Math.exp(-z * w0 * t);
    return 1 - e * (Math.cos(wd * t) + ((z * w0) / wd) * Math.sin(wd * t));
  }

  const REST = { angle: 0, scale: 1 };
  const PRESSED = { left: { angle: -0.22, scale: 0.94 }, right: { angle: 0.22, scale: 0.94 } };

  /** Highlight that follows the pointer, recolors on left/right press and tilts briefly. */
  class FocusEffect {
    constructor(el, { reducedMotion }) {
      this.el = el;
      this.reducedMotion = reducedMotion || (() => false);
      el.innerHTML = '<div class="focus-inner"><svg class="focus-ring has-glow" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path/></svg></div>';
      this.inner = el.querySelector('.focus-inner');
      this.svg = el.querySelector('svg');
      this.path = el.querySelector('path');
      this.shape = 'squircle';
      this.active = false;
      this.visible = false;
      this.pressed = [];
      this.shown = null; // button currently displayed
      this.downAt = 0;
      this.releaseAt = null;
      this.anim = null;
      this.current = { ...REST };
      this.layout();
    }

    setShape(shape) {
      this.shape = FOCUS.shapes.includes(shape) ? shape : 'squircle';
      this.layout();
    }

    setActive(active) {
      this.active = active;
      this.el.hidden = !active || !this.visible;
      if (!active) {
        this.pressed = [];
        this.shown = null;
        this.releaseAt = null;
        this.anim = null;
        this.apply(REST);
        this.paint();
      }
    }

    pointer(x, y) {
      this.visible = true;
      this.el.hidden = !this.active;
      const half = FOCUS.size / 2;
      this.el.style.transform = `translate3d(${(x - half).toFixed(2)}px, ${(y - half).toFixed(2)}px, 0)`;
    }

    button(button, down, t) {
      if (!this.active) return;
      this.pressed = this.pressed.filter((b) => b !== button);
      if (down) this.pressed.push(button);
      const active = this.pressed[this.pressed.length - 1] || null;
      if (active) {
        if (active !== this.shown || down) this.show(active, t);
        this.releaseAt = null;
      } else if (this.shown) {
        // Short clicks still play the full press before releasing.
        const releaseAt = this.downAt + PRESS;
        if (t < releaseAt && !this.reducedMotion()) this.releaseAt = releaseAt;
        else this.show(null, t);
      }
    }

    show(button, t) {
      if (button) this.downAt = t;
      this.shown = button;
      this.paint();
      const target = button ? PRESSED[button] : REST;
      if (this.reducedMotion()) {
        this.anim = null;
        this.apply(target);
      } else {
        this.anim = { from: { ...this.current }, to: target, start: t };
      }
    }

    tick(t) {
      if (!this.active) return false;
      if (this.releaseAt !== null && t >= this.releaseAt && !this.pressed.length) {
        this.releaseAt = null;
        this.show(null, t);
      }
      if (this.anim) {
        const el = t - this.anim.start;
        const k = spring(el);
        this.apply({ angle: lerp(this.anim.from.angle, this.anim.to.angle, k), scale: lerp(this.anim.from.scale, this.anim.to.scale, k) });
        if (el >= PRESS) this.anim = null;
      }
      return this.anim !== null || this.releaseAt !== null;
    }

    layout() {
      const size = FOCUS.size, inset = FOCUS.border / 2;
      this.el.style.width = this.el.style.height = `${size}px`;
      this.svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
      this.svg.setAttribute('width', size);
      this.svg.setAttribute('height', size);
      this.path.setAttribute('d', focusShapePath(this.shape, inset, inset, size - inset * 2, size - inset * 2));
      this.paint();
    }

    paint() {
      const color = hex(FOCUS.colors[this.shown || 'idle']);
      this.el.style.setProperty('--focus-color', css(color, 1));
      this.el.style.setProperty('--focus-width', `${FOCUS.border}px`);
      this.el.style.setProperty('--focus-glow-r', '14px');
      this.el.style.setProperty('--focus-glow-a', css(color, 0.55));
    }

    apply(v) {
      this.current = { angle: v.angle, scale: v.scale };
      this.inner.style.transform = Math.abs(v.angle) < 1e-4 && Math.abs(v.scale - 1) < 1e-4
        ? ''
        : `perspective(500px) rotateY(${v.angle.toFixed(4)}rad) scale(${v.scale.toFixed(4)})`;
    }
  }

  root.DeskFX = { clamp, cubicBezier, StrokeStyle, CLICK_EFFECTS, CLICK_BY_ID, FxScene, FOCUS, FocusEffect, focusShapePath };
})(window);
