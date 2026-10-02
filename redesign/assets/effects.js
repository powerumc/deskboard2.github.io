/*!
 * DeskBoard2 web effects engine
 * ---------------------------------------------------------------------------
 * Browser ports of the macOS app's cursor effects, used by the site playground.
 *   Click effects  <- DeskBoard2/Effects/ClickEffects/*.swift
 *   Cursor trails  <- DeskBoard2/Effects/CursorTrailEffects/*.swift
 *   Focus effect   <- DeskBoard2/Effects/FocusEffect{Overlay,State,Configuration}.swift
 *
 * Units are logical points (pt) in a y-down space. AppKit is y-up, so every
 * "upward" offset from the Swift sources is mirrored here.
 * Core Animation timing, SpriteKit emitter ranges (value ± range / 2) and the
 * app's default values are reproduced as closely as the canvas allows.
 */
(function (root) {
  'use strict';

  /* ------------------------------------------------------------------ math */
  const TAU = Math.PI * 2;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (lo, hi) => lo + Math.random() * (hi - lo);
  const randInt = (lo, hiExclusive) => lo + Math.floor(Math.random() * (hiExclusive - lo));
  const vary = (base, range) => base + (Math.random() - 0.5) * range; // SpriteKit *Range semantics
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const deg = (d) => (d * Math.PI) / 180;
  const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);

  /* ------------------------------------------- CAMediaTimingFunction ports */
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
    linear: (t) => clamp(t, 0, 1),
    easeIn: cubicBezier(0.42, 0, 1, 1),
    easeOut: cubicBezier(0, 0, 0.58, 1),
    easeInOut: cubicBezier(0.42, 0, 0.58, 1),
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

  const toHex = (c) =>
    '#' + [c.r, c.g, c.b].map((v) => Math.round(clamp(v, 0, 1) * 255).toString(16).padStart(2, '0')).join('');

  function css(c, alpha = 1) {
    const a = clamp(c.a * alpha, 0, 1);
    return `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${a.toFixed(3)})`;
  }

  const mix = (a, b, t) => rgb(lerp(a.r, b.r, t), lerp(a.g, b.g, t), lerp(a.b, b.b, t), lerp(a.a, b.a, t));
  const sameColor = (a, b) =>
    Math.abs(a.r - b.r) < 0.002 && Math.abs(a.g - b.g) < 0.002 && Math.abs(a.b - b.b) < 0.002 && Math.abs(a.a - b.a) < 0.002;

  // AppDefaults.ColorSwatch: the "Rainbow" gradient order and the solid swatches.
  const RAINBOW = [
    [0.85, 0.13, 0.23], [0.94, 0.32, 0.38], [0.99, 0.92, 0.2], [0.7, 0.85, 0.15], [0.56, 0.8, 0.33],
    [0.0, 0.53, 0.47], [0.56, 0.88, 0.82], [0.16, 0.63, 0.86], [0.24, 0.33, 0.7], [0.5, 0.3, 0.6],
    [0.81, 0.13, 0.52], [0.55, 0.26, 0.12], [1, 1, 1],
  ].map((c) => rgb(c[0], c[1], c[2]));

  const SWATCHES = [
    { id: 'rainbow', label: 'Rainbow', gradient: true },
    { id: 'cherry', label: 'Cherry', color: rgb(0.85, 0.13, 0.23) },
    { id: 'russet', label: 'Russet', color: rgb(0.55, 0.26, 0.12) },
    { id: 'lemon', label: 'Lemon', color: rgb(0.99, 0.92, 0.2) },
    { id: 'lime', label: 'Lime', color: rgb(0.7, 0.85, 0.15) },
    { id: 'sprout', label: 'Sprout', color: rgb(0.56, 0.8, 0.33) },
    { id: 'seafoam', label: 'Sea Foam', color: rgb(0.56, 0.88, 0.82) },
    { id: 'seagreen', label: 'Sea Green', color: rgb(0.0, 0.53, 0.47) },
    { id: 'aqua', label: 'Aqua', color: rgb(0.16, 0.63, 0.86) },
    { id: 'blueberry', label: 'Blueberry', color: rgb(0.24, 0.33, 0.7) },
    { id: 'grape', label: 'Grape', color: rgb(0.5, 0.3, 0.6) },
    { id: 'magenta', label: 'Magenta', color: rgb(0.81, 0.13, 0.52) },
    { id: 'strawberry', label: 'Strawberry', color: rgb(0.94, 0.32, 0.38) },
    { id: 'white', label: 'White', color: rgb(1, 1, 1) },
  ];

  /**
   * StrokeStyle + GradientSampler + StrokeGradientState in one object.
   * The gradient advances by distance, exactly like the app: clicks take the
   * next colour and move a quarter step; line trails move 0.35 x distance.
   */
  class StrokeStyle {
    constructor() {
      this.kind = 'gradient';
      this.solid = RAINBOW[0];
      this.colors = RAINBOW;
      this.step = 800; // GradientSampler.defaultStepSize
      this.offset = 0;
    }
    setSolid(color) { this.kind = 'solid'; this.solid = color; }
    setRainbow() { this.kind = 'gradient'; }
    sample(distance) {
      const n = Math.max(distance, 0) / this.step;
      const f = Math.floor(n);
      const i = f % this.colors.length;
      return mix(this.colors[i], this.colors[(i + 1) % this.colors.length], n - f);
    }
    advance(length) {
      const cycle = this.step * this.colors.length;
      this.offset = (this.offset + Math.max(length, 0)) % cycle;
    }
    clickColor() {
      if (this.kind === 'solid') return this.solid;
      const color = this.sample(this.offset + this.step);
      this.advance(this.step * 0.25);
      return color;
    }
    trailColor(length) {
      if (this.kind === 'solid') return this.solid;
      const color = this.sample(this.offset);
      if (length > 0) this.advance(length * 0.35);
      return color;
    }
    preview() { return this.kind === 'solid' ? this.solid : this.sample(this.offset + this.step); }
  }

  /* ------------------------------------------------------- canvas helpers */
  // CALayer.shadowRadius is half of a CSS/canvas blur radius.
  function shadow(ctx, env, color, radiusPt) {
    ctx.shadowColor = color;
    ctx.shadowBlur = radiusPt * 2 * env.px;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  function polyline(ctx, pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  }

  // Draws the first `fraction` of a polyline (CAShapeLayer.strokeEnd).
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

  function roundRectPath(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  // RandomizedClickEffectLayout.placement: uniform angle, uniform distance in [0, range / 2].
  function scatter(point, range) {
    const radius = Math.max(0, range * 0.5);
    const a = rand(0, TAU);
    const d = rand(0, radius);
    return { x: point.x + Math.cos(a) * d, y: point.y + Math.sin(a) * d };
  }

  // Keyframe opacity flash used by the lightning slots: 0 -> 1 (easeOut) -> 0 (easeIn).
  function flash(u, mid) {
    if (u < 0 || u > 1) return 0;
    return u < mid ? Ease.easeOut(u / mid) : 1 - Ease.easeIn((u - mid) / (1 - mid));
  }

  /* --------------------------------------------------- particle emitters */
  /** Minimal SKEmitterNode: birth rate, emit count, linear physics, alpha/scale speeds. */
  class Emitter {
    constructor(spec) {
      this.spec = spec;
      this.particles = [];
      this.age = 0;
      this.carry = 0;
      this.emitted = 0;
    }
    get done() {
      const s = this.spec;
      const exhausted = (s.count && this.emitted >= s.count) || this.age >= (s.stopAfter ?? Infinity);
      return exhausted && this.particles.length === 0;
    }
    update(dt) {
      const s = this.spec;
      this.age += dt;
      const canEmit = (!s.count || this.emitted < s.count) && this.age <= (s.stopAfter ?? Infinity);
      if (canEmit) {
        this.carry += s.birthRate * dt;
        while (this.carry >= 1 && (!s.count || this.emitted < s.count)) {
          this.carry -= 1;
          this.emitted++;
          this.particles.push(s.spawn());
        }
      }
      for (const p of this.particles) {
        p.age += dt;
        p.vx += (s.ax + (p.noise ? p.noise(p.age) : 0)) * dt;
        p.vy += s.ay * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.alpha += (s.alphaSpeed || 0) * dt;
        p.scale += (s.scaleSpeed || 0) * dt;
        p.rot += (p.spin || 0) * dt;
      }
      this.particles = this.particles.filter((p) => p.age < p.life && p.scale > 0 && p.alpha > 0.003);
    }
  }

  function colorAt(sequence, u) {
    const keys = sequence.keys;
    if (u <= keys[0]) return sequence.colors[0];
    for (let i = 1; i < keys.length; i++) {
      if (u <= keys[i]) return mix(sequence.colors[i - 1], sequence.colors[i], (u - keys[i - 1]) / (keys[i] - keys[i - 1]));
    }
    return sequence.colors[sequence.colors.length - 1];
  }

  // Soft round sprite (Assets.xcassets/CursorEffects/spark.png is a 64 pt white glow).
  const spriteCache = new Map();
  function glowSprite(color) {
    const key = `${Math.round(color.r * 40)}-${Math.round(color.g * 40)}-${Math.round(color.b * 40)}`;
    let sprite = spriteCache.get(key);
    if (sprite) return sprite;
    sprite = document.createElement('canvas');
    sprite.width = sprite.height = 64;
    const g = sprite.getContext('2d');
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, css(color, 1));
    grad.addColorStop(0.35, css(color, 0.55));
    grad.addColorStop(1, css(color, 0));
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    spriteCache.set(key, sprite);
    return sprite;
  }

  const CONFETTI_SHAPES = ['rectangle', 'roundedRectangle', 'circle', 'diamond'];
  function confettiShape(ctx, shape, w, h) {
    switch (shape) {
      case 'rectangle':
        ctx.fillRect(-w / 2, -h / 2, w, h);
        break;
      case 'roundedRectangle':
        roundRectPath(ctx, -w / 2, -h / 2, w, h, Math.min(w, h) * 0.3);
        ctx.fill();
        break;
      case 'circle':
        ctx.beginPath();
        ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, TAU);
        ctx.fill();
        break;
      default:
        ctx.beginPath();
        ctx.moveTo(0, -h / 2);
        ctx.lineTo(w / 2, 0);
        ctx.lineTo(0, h / 2);
        ctx.lineTo(-w / 2, 0);
        ctx.closePath();
        ctx.fill();
    }
  }

  // SF Symbol "pawprint.fill", drawn in a unit box centred on the origin.
  function pawPath(ctx) {
    ctx.beginPath();
    ctx.moveTo(0, -0.02);
    ctx.bezierCurveTo(0.17, -0.02, 0.31, 0.15, 0.31, 0.29);
    ctx.bezierCurveTo(0.31, 0.41, 0.21, 0.46, 0.11, 0.44);
    ctx.bezierCurveTo(0.05, 0.43, -0.05, 0.43, -0.11, 0.44);
    ctx.bezierCurveTo(-0.21, 0.46, -0.31, 0.41, -0.31, 0.29);
    ctx.bezierCurveTo(-0.31, 0.15, -0.17, -0.02, 0, -0.02);
    ctx.closePath();
    const toes = [
      [-0.39, -0.07, 0.1, 0.13, -0.42],
      [-0.15, -0.31, 0.105, 0.14, -0.14],
      [0.15, -0.31, 0.105, 0.14, 0.14],
      [0.39, -0.07, 0.1, 0.13, 0.42],
    ];
    for (const [x, y, rx, ry, r] of toes) {
      ctx.moveTo(x + rx * Math.cos(r), y + rx * Math.sin(r));
      ctx.ellipse(x, y, rx, ry, r, 0, TAU);
    }
  }

  /* --------------------------------------------------------- click effects */
  // Each factory returns { draw(ctx, t, env) -> alive }. `o` carries
  // { t, size, duration, stroke, cfg } resolved by the playground.

  function pulse(p, o) {
    const t0 = o.t, d = o.duration;
    const r0 = Math.max(1, o.size * 0.25), r1 = Math.max(1, o.size);
    const width = Math.max(1, o.cfg.lineWidth);
    return {
      draw(ctx, t, env) {
        const u = (t - t0) / d;
        if (u >= 1) return false;
        const e = Ease.easeOut(u);
        ctx.save();
        ctx.globalAlpha = 1 - e;
        shadow(ctx, env, 'rgba(0,0,0,0.25)', 6);
        ctx.lineWidth = width;
        ctx.strokeStyle = css(o.stroke, 1);
        ctx.beginPath();
        ctx.arc(p.x, p.y, lerp(r0, r1, e), 0, TAU);
        ctx.stroke();
        ctx.restore();
        return true;
      },
    };
  }

  function ripple(p, o) {
    const d = o.duration;
    const r0 = Math.max(1, o.size * 0.2), r1 = Math.max(1, o.size);
    const count = Math.max(1, o.cfg.ringCount);
    const rings = Array.from({ length: count }, (_, i) => ({
      begin: o.t + i * o.cfg.ringDelay,
      alpha: 0.9 - (i / Math.max(1, count - 1)) * 0.5,
    }));
    return {
      draw(ctx, t) {
        let alive = false;
        ctx.save();
        ctx.lineWidth = 3;
        for (const ring of rings) {
          const u = (t - ring.begin) / d;
          if (u >= 1) continue;
          alive = true;
          // Before its delayed start a ring rests at the model values (start radius, opacity 1).
          const e = u > 0 ? Ease.easeOut(u) : 0;
          ctx.globalAlpha = 1 - e;
          ctx.strokeStyle = css(o.stroke, ring.alpha);
          ctx.beginPath();
          ctx.arc(p.x, p.y, lerp(r0, r1, e), 0, TAU);
          ctx.stroke();
        }
        ctx.restore();
        return alive;
      },
    };
  }

  function radar(p, o) {
    const d = o.duration;
    const r0 = Math.max(1, o.size * 0.3), r1 = Math.max(1, o.size);
    const count = Math.max(1, o.cfg.waveCount);
    const waves = Array.from({ length: count }, (_, i) => o.t + i * o.cfg.gap);
    return {
      draw(ctx, t) {
        let alive = false;
        ctx.save();
        ctx.lineWidth = o.cfg.lineWidth;
        ctx.strokeStyle = css(o.stroke, 0.5);
        for (const begin of waves) {
          const u = (t - begin) / d;
          if (u >= 1) continue;
          alive = true;
          let radius = r0, opacity = 1;
          if (u > 0) {
            radius = lerp(r0, r1, Ease.easeOut(clamp(u / 0.9, 0, 1)));
            opacity = 0.9 * (1 - Ease.easeOut(u));
          }
          ctx.globalAlpha = opacity;
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius, 0, TAU);
          ctx.stroke();
        }
        ctx.restore();
        return alive;
      },
    };
  }

  function spark(p, o) {
    const t0 = o.t, d = o.duration, size = o.size;
    const count = Math.max(1, o.cfg.particleCount);
    const jitter = rand(-0.3, 0.3) * (Math.PI / 16);
    const scale = Math.max(0.25, size / 40);
    const len = o.cfg.segmentLength * scale;
    const thickness = Math.max(1, o.cfg.segmentThickness * scale);
    const segments = Array.from({ length: count }, (_, i) => {
      const a = (i / count) * TAU + jitter;
      const ux = Math.cos(a), uy = Math.sin(a);
      const s0 = { x: p.x, y: p.y }, e0 = { x: p.x + ux * len, y: p.y + uy * len };
      const s1 = { x: s0.x + ux * size, y: s0.y + uy * size }, e1 = { x: e0.x + ux * size, y: e0.y + uy * size };
      const s2 = { x: e1.x - ux * len * 0.2, y: e1.y - uy * len * 0.2 };
      return { s0, e0, s1, e1, s2 };
    });
    return {
      draw(ctx, t) {
        const u = (t - t0) / d;
        if (u >= 1) return false;
        ctx.save();
        ctx.globalAlpha = 1 - Ease.easeIn(u);
        ctx.strokeStyle = css(o.stroke, 0.95);
        ctx.lineWidth = thickness;
        ctx.lineCap = 'butt';
        ctx.beginPath();
        for (const s of segments) {
          let a, b;
          if (u < 0.45) {
            const k = Ease.easeOut(u / 0.45);
            a = { x: lerp(s.s0.x, s.s1.x, k), y: lerp(s.s0.y, s.s1.y, k) };
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
    const t0 = o.t, d = o.duration;
    const s = Math.max(8, o.size), half = s * 0.5;
    const thickness = Math.max(2, o.cfg.thickness);
    const lift = thickness * 0.5;
    const j = o.cfg.jitterRange;
    const bx = p.x + rand(-j, j), by = p.y + rand(-j, j);
    // The cursor sits on the lower vertex; both arms rise above it.
    const pts = [
      { x: bx - half * 0.5, y: by - half * 0.4 - lift },
      { x: bx, y: by - lift },
      { x: bx + half * 0.7, y: by - half * 0.9 - lift },
    ];
    const drawDur = d * 0.7, fadeDur = d * 0.3;
    return {
      draw(ctx, t) {
        const el = t - t0;
        if (el >= drawDur + fadeDur) return false;
        const fraction = el < drawDur ? checkEase(el / drawDur) : 1;
        const alpha = el < drawDur ? 1 : 1 - Ease.easeIn((el - drawDur) / fadeDur);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = css(o.stroke, 1);
        ctx.lineWidth = thickness;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        partialPolyline(ctx, pts, fraction);
        ctx.stroke();
        ctx.restore();
        return true;
      },
    };
  }

  // Shared timeline for Cat Paw and Emoji: hold for `duration`, then a fixed 0.5 s ease-in fade.
  function holdThenFade(t0, hold, t) {
    const el = t - t0;
    if (el >= hold + 0.5) return -1;
    return el < hold ? 1 : 1 - Ease.easeIn((el - hold) / 0.5);
  }

  function catPaw(p, o) {
    const spreadRadius = o.cfg.spreadRadius > 0 ? o.cfg.spreadRadius : o.size * 0.5;
    const side = Math.max(12, o.size * 0.5);
    const at = scatter(p, spreadRadius);
    const rotation = deg(rand(0, Math.max(0, o.cfg.rotationRange)));
    return {
      draw(ctx, t) {
        const alpha = holdThenFade(o.t, o.duration, t);
        if (alpha < 0) return false;
        ctx.save();
        ctx.translate(at.x, at.y);
        ctx.rotate(-rotation);
        ctx.scale(side, side);
        ctx.fillStyle = css(o.stroke, 0.8 * alpha);
        pawPath(ctx);
        ctx.fill();
        ctx.restore();
        return true;
      },
    };
  }

  const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Segoe UI Symbol",sans-serif';
  function emoji(p, o) {
    const spreadRadius = o.cfg.spreadRadius > 0 ? o.cfg.spreadRadius : o.size * 0.5;
    const side = Math.max(12, o.size * 0.5);
    const at = scatter(p, spreadRadius);
    const rotation = deg(rand(0, Math.max(0, o.cfg.rotationRange)));
    const text = String(o.cfg.emoji || '').trim() || '✨';
    const opacity = clamp(o.cfg.opacity, 0, 1);
    return {
      draw(ctx, t) {
        const alpha = holdThenFade(o.t, o.duration, t);
        if (alpha < 0) return false;
        ctx.save();
        ctx.translate(at.x, at.y);
        ctx.rotate(-rotation);
        ctx.globalAlpha = opacity * alpha;
        ctx.font = `${side}px ${EMOJI_FONT}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = css(o.stroke, 1);
        ctx.fillText(text, 0, 0);
        ctx.restore();
        return true;
      },
    };
  }

  /* lightning ------------------------------------------------------------ */
  const BRANCH_CHOICES = [0, 0, 0, 1, 1, 1, 1, 2, 2];

  // Midpoint displacement. With `side` set, every offset stays on one side of the line.
  function boltPath(a, b, maxDisplacement, levels, side) {
    let pts = [a, b];
    let disp = maxDisplacement;
    for (let level = 0; level < levels; level++) {
      const next = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i], p1 = pts[i + 1];
        const len = Math.max(0.001, dist(p0, p1));
        const nx = -(p1.y - p0.y) / len, ny = (p1.x - p0.x) / len;
        const offset = side === undefined ? rand(-disp, disp) : rand(0, disp) * (side >= 0 ? 1 : -1);
        next.push(p0, { x: (p0.x + p1.x) / 2 + nx * offset, y: (p0.y + p1.y) / 2 + ny * offset });
      }
      next.push(pts[pts.length - 1]);
      pts = next;
      disp *= 0.52;
    }
    const fine = Math.max(0, maxDisplacement * (side === undefined ? 0.06 : 0.05));
    return pts.map((q, i) =>
      i === 0 || i === pts.length - 1 ? q : { x: q.x + rand(-fine, fine), y: q.y + rand(-fine, fine) });
  }

  function branchTarget(a, b, side, fraction, lateral) {
    const t = rand(fraction[0], fraction[1]);
    const len = Math.max(0.001, dist(a, b));
    const ux = (b.x - a.x) / len, uy = (b.y - a.y) / len;
    const mag = rand(lateral[0], lateral[1]);
    return { x: a.x + ux * len * t - uy * side * mag, y: a.y + uy * len * t + ux * side * mag };
  }

  function lightning(p, o) {
    const size = o.size, t0 = o.t;
    const total = Math.max(0.04, o.duration);
    let slots = pick([1, 2, 2, 3, 3]);
    if (total <= 0.12) slots = Math.min(slots, 2);
    if (total <= 0.07) slots = 1;
    const slotDur = Math.max(0.02, (total * 0.6) / slots);
    const sparkDur = Math.max(0, total - slotDur * slots);
    const maxBranches = Math.max(0, o.cfg.branchCount);
    const detail = Math.max(3, o.cfg.detailLevel);
    const scale = Math.max(0.5, Math.sqrt(Math.max(20, size) / 40));
    const coreWidth = Math.max(1.5, 2 * scale);
    const glow = o.stroke;
    const end = { x: p.x, y: p.y };
    const bolts = [];
    const shards = [];

    for (let i = 0; i < slots; i++) {
      const begin = t0 + slotDur * i;
      const slotEnd = t0 + slotDur * (i + 1) + 0.01;
      const start = {
        x: rand(end.x - size * 0.8, end.x + size * 0.8),
        y: end.y - Math.max(60, size * 1.3) + rand(-size * 0.15, size * 0.15),
      };
      const main = boltPath(start, end, Math.max(size * 0.18, 10), detail);
      const core = Math.max(0.6, coreWidth * rand(0.35, 1.1));
      const glowWidth = Math.max(core * rand(1.6, 2.4), core + 0.4);
      bolts.push({ pts: main, core, glow: glowWidth, begin, dur: slotDur, mid: 0.5, until: slotEnd });

      const branches = Math.min(maxBranches, pick(BRANCH_CHOICES));
      if (branches > 0 && main.length >= 4) {
        const lastIndex = Math.max(3, main.length - 2);
        let side = Math.random() < 0.5 ? 1 : -1;
        for (let b = 0; b < branches; b++) {
          const base = main[randInt(1, lastIndex)];
          const target = branchTarget(base, end, side, [0.5, 1.05], [10, Math.max(30, size * 0.4)]);
          const maxDisp = Math.max(8, Math.min(size * 0.11, dist(base, target) * 0.18));
          bolts.push({
            pts: boltPath(base, target, maxDisp, Math.max(3, detail - 1), side),
            core: Math.max(1, core * 0.75),
            glow: Math.max(1.2, glowWidth * 0.75),
            begin: begin + slotDur * rand(0, 0.12),
            dur: slotDur * 0.95,
            mid: 0.52,
            until: slotEnd,
          });
          side *= -1;
        }
      }

      if (sparkDur > 0) {
        const heading = Math.atan2(end.y - start.y, end.x - start.x);
        const burst = Math.max(10, size * 0.3);
        for (let j = 0; j < 10; j++) {
          const w = Math.max(0.6, Math.min(1.6, size * 0.028));
          const theta = heading + rand(-0.4, 0.4);
          const reach = burst * rand(0.35, 0.7);
          const spin0 = rand(-Math.PI * 0.25, Math.PI * 0.25);
          shards.push({
            begin, dur: sparkDur, w, h: w * rand(1.5, 2.4),
            x: end.x + Math.cos(theta) * reach, y: end.y + Math.sin(theta) * reach,
            spin0, spin1: spin0 + rand(-Math.PI * 0.8, Math.PI * 0.8),
          });
        }
      }
    }

    const finish = t0 + slotDur * slots + sparkDur + 0.06;
    return {
      draw(ctx, t, env) {
        if (t > finish) return false;
        ctx.save();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        for (const bolt of bolts) {
          if (t > bolt.until) continue;
          const a = flash((t - bolt.begin) / bolt.dur, bolt.mid);
          if (a <= 0) continue;
          ctx.globalAlpha = a;
          shadow(ctx, env, css(glow, 0.81), 8 * scale);
          ctx.strokeStyle = css(glow, 0.8);
          ctx.lineWidth = bolt.glow;
          polyline(ctx, bolt.pts);
          ctx.stroke();
          ctx.shadowColor = 'transparent';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = bolt.core;
          polyline(ctx, bolt.pts);
          ctx.stroke();
        }
        for (const s of shards) {
          const u = (t - s.begin) / s.dur;
          if (u < 0 || u >= 1) continue;
          const k = Ease.easeInOut(u);
          ctx.save();
          ctx.globalAlpha = 1 - Ease.easeIn(u);
          ctx.translate(lerp(end.x, s.x, u), lerp(end.y, s.y, u));
          ctx.rotate(lerp(s.spin0, s.spin1, Ease.easeOut(u)));
          ctx.scale(lerp(1, 0.9, k), lerp(1, 0.9, k));
          shadow(ctx, env, css(glow, 0.3), 2);
          roundRectPath(ctx, -s.w / 2, -s.h / 2, s.w, s.h, s.w * 0.25);
          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          ctx.fill();
          ctx.lineWidth = Math.max(0.3, s.w * 0.3);
          ctx.strokeStyle = css(glow, 0.8);
          ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
        return true;
      },
    };
  }

  /* confetti (SpriteKitConfettiClickEffect) ------------------------------ */
  const CONFETTI_BASE = [
    rgb(0.15, 0.8, 1.0), rgb(0.64, 0.35, 0.99), rgb(1.0, 0.37, 0.49),
    rgb(0.53, 1.0, 0.35), rgb(0.99, 1.0, 0.26), rgb(1.0, 0.65, 0.18),
  ];

  function withStroke(palette, stroke) {
    const list = palette.slice();
    if (!list.some((c) => sameColor(c, stroke))) list.push(stroke);
    return list;
  }

  function particleEffect(emitters, render) {
    let last = null;
    return {
      draw(ctx, t, env) {
        const dt = last === null ? 0 : clamp(t - last, 0, 0.05);
        last = t;
        let alive = false;
        for (const e of emitters) {
          e.update(dt);
          if (!e.done) alive = true;
        }
        render(ctx, env);
        return alive;
      },
    };
  }

  function confetti(p, o) {
    const k = Math.max(0.25, o.size / 80);
    const palette = withStroke(CONFETTI_BASE, o.stroke);
    const emitterCount = Math.max(1, Math.min(palette.length, o.cfg.paletteCount));
    const rate = (350 * k * o.cfg.density) / emitterCount;
    const count = Math.floor(rate * 0.12);
    const emitters = palette.map((color) => {
      const shape = pick(CONFETTI_SHAPES); // one texture per emitter, as in the app
      return new Emitter({
        birthRate: rate, count, ax: 0, ay: 450 * k, alphaSpeed: -0.65,
        spawn: () => {
          const speed = vary(200 * k, 80 * k);
          const a = -Math.PI / 2 + vary(0, Math.PI / 4.5);
          return {
            x: p.x + vary(0, 16), y: p.y + vary(0, 16),
            vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
            age: 0, life: vary(1.0, 0.35),
            alpha: Math.min(1, vary(1, 0.35)), scale: vary(0.55, 0.3),
            rot: vary(0, 5), spin: 3, color, shape,
          };
        },
      });
    });
    return particleEffect(emitters, (ctx) => {
      for (const e of emitters) {
        for (const q of e.particles) {
          ctx.save();
          ctx.translate(q.x, q.y);
          ctx.rotate(q.rot);
          ctx.fillStyle = css(q.color, clamp(q.alpha, 0, 1));
          confettiShape(ctx, q.shape, 10 * q.scale, 14 * q.scale);
          ctx.restore();
        }
      }
    });
  }

  /* confetti blast (SpriteKitConfettiBlastClickEffect) ------------------- */
  const BLAST_PALETTE = ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff'].map(hex);

  function confettiBlast(p, o) {
    const t0 = o.t, lifetime = 0.6;
    const k = Math.max(0.25, o.size / 80);
    const palette = withStroke(BLAST_PALETTE, o.stroke);
    const pixels = Array.from({ length: Math.max(1, o.cfg.particleCount) }, () => {
      const a = rand(0, TAU);
      const travel = rand(50, 130) * k * o.cfg.speedScale * lifetime;
      return {
        side: pick([3, 4, 6]), color: pick(palette),
        dx: Math.cos(a) * travel, dy: Math.sin(a) * travel, spin: rand(-5, 5),
      };
    });
    return {
      draw(ctx, t) {
        const u = (t - t0) / lifetime;
        if (u >= 1) return false;
        const m = 1 - Math.pow(1 - u, 4); // the app's custom ease-out (p = 4)
        const alpha = clamp(1 - u / 0.9, 0, 1);
        for (const px of pixels) {
          ctx.save();
          ctx.translate(p.x + px.dx * m, p.y + px.dy * m);
          ctx.rotate(px.spin * u);
          ctx.fillStyle = css(px.color, alpha);
          ctx.fillRect(-px.side / 2, -px.side / 2, px.side, px.side);
          ctx.restore();
        }
        return true;
      },
    };
  }

  /* fire (SpriteKitFireClickEffect) -------------------------------------- */
  const FIRE_COLORS = {
    keys: [0, 0.25, 0.6, 1],
    colors: [rgb(0.45, 0.18, 0.05), rgb(0.95, 0.45, 0.1), rgb(1, 0.92, 0.65), rgb(0.1, 0.05, 0.02)],
  };
  const EMBER_COLORS = {
    keys: [0, 0.25, 0.7, 1],
    colors: [rgb(1, 0.78, 0.46, 0.95), rgb(0.98, 0.45, 0.1, 0.9), rgb(0.75, 0.15, 0.05, 0.6), rgb(0.1, 0.05, 0.02, 0)],
  };

  function fire(p, o) {
    const k = clamp(o.size / 70, 0.35, 2.4) * o.cfg.intensity;
    const total = Math.max(0.12, o.duration);
    const ts = clamp(total / 0.5, 0.25, 4);
    const riseK = Math.pow(k, 0.65);
    let wind = 0, noiseAmp = 0;
    if (Math.random() < o.cfg.turbulenceProbability) {
      const sign = Math.random() < 0.5 ? -1 : 1;
      // SKFieldNode strengths in m/s^2 at SpriteKit's 150 pt per metre.
      wind = (sign * 0.5 * rand(0.5, 3.0) * 150) / ts;
      noiseAmp = (rand(0.3, 1.4) * riseK * 150 * 0.6) / ts;
    }
    const noise = () => {
      if (!noiseAmp) return null;
      const w = rand(5, 9), phase = rand(0, TAU);
      return (age) => noiseAmp * Math.sin(age * w + phase);
    };
    const flames = new Emitter({
      birthRate: 165 * k * (0.5 / total), stopAfter: total, ax: wind, ay: (-140 * k) / ts,
      alphaSpeed: -0.6 / ts, scaleSpeed: -0.5 / ts,
      spawn: () => {
        const a = -Math.PI / 2 + vary(0, deg(25));
        const speed = vary(170 * k, 70 * k) / ts;
        return {
          x: p.x + vary(0, 5), y: p.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
          age: 0, life: vary(1.6 * ts, 0.5 * ts), alpha: vary(0.85, 0.25),
          scale: vary(0.32 * k, 0.22 * k), rot: 0, noise: noise(),
        };
      },
    });
    const embers = new Emitter({
      birthRate: 70 * k * (0.5 / total), stopAfter: total * 1.25, ax: wind, ay: (-80 * k) / ts,
      alphaSpeed: -0.6 / ts, scaleSpeed: -0.18 / ts,
      spawn: () => {
        const a = -Math.PI / 2 + vary(0, deg(55));
        const speed = vary(130 * k, 85 * k) / ts;
        return {
          x: p.x + vary(0, 9), y: p.y + vary(0, 6), vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
          age: 0, life: vary(2.2 * ts, 0.7 * ts), alpha: vary(0.9, 0.2),
          scale: vary(0.13 * k, 0.11 * k), rot: 0, noise: noise(),
        };
      },
    });
    const layers = [
      [flames, FIRE_COLORS],
      [embers, EMBER_COLORS],
    ];
    return particleEffect([flames, embers], (ctx) => {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter'; // SKBlendMode.add
      for (const [emitter, sequence] of layers) {
        for (const q of emitter.particles) {
          const color = colorAt(sequence, q.age / q.life);
          const sizePt = 64 * q.scale;
          ctx.globalAlpha = clamp(q.alpha * color.a, 0, 1);
          ctx.drawImage(glowSprite(color), q.x - sizePt / 2, q.y - sizePt / 2, sizePt, sizePt);
        }
      }
      ctx.restore();
    });
  }

  /* ------------------------------------------------------ effect catalogue */
  const sizeField = { key: 'size', label: 'size', min: 10, max: 300, step: 10, unit: 'pt' };
  const durationField = { key: 'duration', label: 'duration', min: 0.1, max: 3, step: 0.1, unit: 's' };
  const base = { size: 50, duration: 0.5 }; // AppDefaults.ClickEffect

  /** Mirrors CursorPreferenceView.clickEffectRows: order, Pro gating, AutoForm fields and defaults. */
  const CLICK_EFFECTS = [
    {
      id: 'pulse', pro: false, play: pulse, defaults: { ...base, lineWidth: 4 },
      fields: [sizeField, durationField, { key: 'lineWidth', label: 'pulse.lineWidth', min: 1, max: 12, step: 0.5, unit: 'pt' }],
    },
    {
      id: 'ripple', pro: true, play: ripple, defaults: { ...base, ringCount: 3, ringDelay: 0.08 },
      fields: [sizeField, durationField,
        { key: 'ringCount', label: 'ripple.ringCount', min: 1, max: 6, step: 1 },
        { key: 'ringDelay', label: 'ripple.ringDelay', min: 0.02, max: 0.2, step: 0.01, unit: 's' }],
    },
    {
      id: 'radar', pro: true, play: radar, defaults: { ...base, waveCount: 2, gap: 0.15, lineWidth: 2 },
      fields: [sizeField, durationField,
        { key: 'waveCount', label: 'radar.waveCount', min: 1, max: 4, step: 1 },
        { key: 'gap', label: 'radar.gap', min: 0.05, max: 0.3, step: 0.01, unit: 's' },
        { key: 'lineWidth', label: 'radar.lineWidth', min: 1, max: 6, step: 0.5, unit: 'pt' }],
    },
    {
      id: 'spark', pro: true, play: spark, defaults: { ...base, particleCount: 8, segmentLength: 10, segmentThickness: 1 },
      fields: [sizeField, durationField,
        { key: 'particleCount', label: 'spark.particleCount', min: 4, max: 16, step: 1 },
        { key: 'segmentLength', label: 'spark.segmentLength', min: 4, max: 30, step: 1, unit: 'pt' },
        { key: 'segmentThickness', label: 'spark.segmentThickness', min: 1, max: 8, step: 0.5, unit: 'pt' }],
    },
    {
      id: 'check', pro: true, play: check, defaults: { ...base, thickness: 4, jitterRange: 5 },
      fields: [sizeField, durationField,
        { key: 'thickness', label: 'check.thickness', min: 2, max: 24, step: 0.5, unit: 'pt' },
        { key: 'jitterRange', label: 'check.jitterRange', min: 0, max: 12, step: 1, unit: 'pt' }],
    },
    {
      id: 'catPaw', pro: true, play: catPaw, defaults: { ...base, spreadRadius: 24, rotationRange: 360 },
      fields: [sizeField, durationField,
        { key: 'spreadRadius', label: 'catPaw.spreadRadius', min: 0, max: 100, step: 1, unit: 'pt' },
        { key: 'rotationRange', label: 'catPaw.rotationRange', min: 0, max: 360, step: 5, unit: '°' }],
    },
    {
      id: 'emoji', pro: true, play: emoji,
      defaults: { ...base, emoji: '✨', opacity: 1, spreadRadius: 24, rotationRange: 360 },
      fields: [sizeField, durationField,
        { key: 'emoji', label: 'emoji.value', type: 'text', placeholder: '✨', presets: ['✨', '👍', '🎉', '❤️', '👀', '🔥'] },
        { key: 'opacity', label: 'emoji.opacity', min: 0.1, max: 1, step: 0.05, unit: '%' },
        { key: 'spreadRadius', label: 'emoji.spreadRadius', min: 0, max: 100, step: 1, unit: 'pt' },
        { key: 'rotationRange', label: 'emoji.rotationRange', min: 0, max: 360, step: 5, unit: '°' }],
    },
    {
      id: 'lightning', pro: true, play: lightning, defaults: { ...base, branchCount: 2, detailLevel: 5 },
      fields: [sizeField, durationField,
        { key: 'branchCount', label: 'lightning.branchCount', min: 0, max: 4, step: 1 },
        { key: 'detailLevel', label: 'lightning.detailLevel', min: 3, max: 8, step: 1 }],
    },
    {
      id: 'confetti', pro: true, play: confetti, fixedDuration: true, separator: true,
      defaults: { ...base, paletteCount: 6, density: 1 },
      fields: [sizeField,
        { key: 'paletteCount', label: 'confetti.paletteCount', min: 3, max: 8, step: 1 },
        { key: 'density', label: 'confetti.density', min: 0.5, max: 2, step: 0.1, unit: '×' }],
    },
    {
      id: 'confettiBlast', pro: true, play: confettiBlast, fixedDuration: true,
      defaults: { ...base, particleCount: 60, speedScale: 1 },
      fields: [sizeField,
        { key: 'particleCount', label: 'confettiBlast.particleCount', min: 30, max: 160, step: 10 },
        { key: 'speedScale', label: 'confettiBlast.speedScale', min: 0.5, max: 2, step: 0.1, unit: '×' }],
    },
    {
      id: 'fire', pro: true, play: fire, defaults: { ...base, intensity: 1, turbulenceProbability: 0.65 },
      fields: [sizeField, durationField,
        { key: 'intensity', label: 'fire.intensity', min: 0.5, max: 2.5, step: 0.1, unit: '×' },
        { key: 'turbulenceProbability', label: 'fire.turbulence', min: 0, max: 1, step: 0.05, unit: '%' }],
    },
  ];
  const CLICK_BY_ID = Object.fromEntries(CLICK_EFFECTS.map((e) => [e.id, e]));

  /* --------------------------------------------------------- cursor trails */
  /** LineCursorTrailEffect: one fading segment per move, continuous from the last end point. */
  class LineTrail {
    constructor() { this.segments = []; this.lastEnd = null; }
    get busy() { return this.segments.length > 0; }
    move(point, last, t, cfg, style) {
      if (!last) return;
      const color = style.trailColor(dist(last, point));
      const start = this.lastEnd || last;
      const dx = point.x - start.x, dy = point.y - start.y;
      if (dx * dx + dy * dy < 0.25) return;
      if (this.segments.length >= 320) this.segments.splice(0, this.segments.length - 319);
      this.segments.push({
        x0: start.x, y0: start.y, x1: point.x, y1: point.y, t0: t,
        life: cfg.duration, width: Math.max(0.5, cfg.lineWidth), stroke: css(color, cfg.opacity),
      });
      this.lastEnd = { x: point.x, y: point.y };
    }
    resetContinuity() { this.lastEnd = null; }
    clear() { this.segments = []; this.lastEnd = null; }
    draw(ctx, t) {
      if (!this.segments.length) return;
      ctx.save();
      ctx.lineCap = 'butt';
      ctx.lineJoin = 'miter';
      this.segments = this.segments.filter((s) => {
        const u = (t - s.t0) / s.life;
        if (u >= 1) return false;
        ctx.globalAlpha = 1 - clamp(u, 0, 1);
        ctx.strokeStyle = s.stroke;
        ctx.lineWidth = s.width;
        ctx.beginPath();
        ctx.moveTo(s.x0, s.y0);
        ctx.lineTo(s.x1, s.y1);
        ctx.stroke();
        return true;
      });
      ctx.restore();
    }
  }

  /** SpriteKitSnowCursorTrailEffect: tiny emitters spaced along the path, 2 flakes each. */
  class SnowTrail {
    constructor() { this.emitters = []; this.lastSpawn = null; this.last = null; }
    get busy() { return this.emitters.length > 0; }
    move(point, _last, t, cfg) {
      const spawnAt = (q) => this.spawn(q, t, cfg);
      if (this.lastSpawn) {
        const dx = point.x - this.lastSpawn.x, dy = point.y - this.lastSpawn.y;
        const d = Math.hypot(dx, dy);
        if (d <= cfg.spacing) {
          spawnAt(point);
        } else {
          const steps = Math.floor(d / cfg.spacing);
          for (let i = 1; i <= steps + 1; i++) {
            spawnAt({ x: this.lastSpawn.x + (dx / (steps + 1)) * i, y: this.lastSpawn.y + (dy / (steps + 1)) * i });
          }
        }
      } else {
        spawnAt(point);
      }
      this.lastSpawn = { x: point.x, y: point.y };
    }
    spawn(at, t, cfg) {
      if (this.emitters.length > 60) this.emitters.splice(0, this.emitters.length - 60);
      const baseAlpha = rand(0.6, 1.0);
      const color = cfg.color;
      const emitter = new Emitter({
        birthRate: 18, count: 2, ax: 5, ay: 40, alphaSpeed: -0.05, scaleSpeed: -0.02,
        spawn: () => {
          const a = Math.PI / 2 + vary(0, Math.PI / 6);
          const speed = vary(59, 15);
          return {
            x: at.x + vary(0, 6), y: at.y + vary(0, 6), vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
            age: 0, life: Math.max(0.05, vary(cfg.lifetime, 0.6)),
            alpha: clamp(vary(baseAlpha, 0.4), 0, 1), scale: Math.max(0.02, vary(0.28, 0.35)), rot: 0, color,
          };
        },
      });
      emitter.carry = 1; // first flake appears immediately
      emitter.removeAt = t + cfg.lifetime + 0.5;
      this.emitters.push(emitter);
    }
    resetContinuity() { this.lastSpawn = null; }
    clear() { this.emitters = []; this.lastSpawn = null; }
    draw(ctx, t) {
      const dt = this.last === null ? 0 : clamp(t - this.last, 0, 0.05);
      this.last = t;
      if (!this.emitters.length) return;
      ctx.save();
      this.emitters = this.emitters.filter((e) => {
        e.update(dt);
        for (const q of e.particles) {
          ctx.fillStyle = css(q.color, q.alpha);
          ctx.beginPath();
          ctx.arc(q.x, q.y, Math.max(0.2, 5 * q.scale), 0, TAU);
          ctx.fill();
        }
        return t < e.removeAt;
      });
      ctx.restore();
    }
  }

  /* ----------------------------------------------------------- fx scene */
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
    clear() {
      this.items = [];
      this.trails.line.clear();
      this.trails.snow.clear();
    }
    render(ctx, t, env) {
      this.trails.line.draw(ctx, t, env);
      this.trails.snow.draw(ctx, t, env);
      this.items = this.items.filter((item) => item.draw(ctx, t, env) !== false);
    }
  }

  /* ---------------------------------------------------------- focus effect */
  const FOCUS = {
    sizes: { small: 96, regular: 140, large: 200, extraLarge: 280 },
    weights: { light: 2, regular: 4, bold: 7, heavy: 10 },
    glows: { hidden: { radius: 0, opacity: 0 }, soft: { radius: 7, opacity: 0.55 }, shiny: { radius: 16, opacity: 0.9 } },
    zooms: [2, 4, 10, 20],
    delays: [1, 3, 5, 10],
    defaults: {
      shape: 'squircle', size: 'regular', borderWeight: 'regular', borderStyle: 'solid', glow: 'soft',
      usesAccent: true, accent: '#16e6b0', clickAnimation: true, completeShortClick: true, perspective: 0.5,
      usesLeft: true, left: '#4f7cff', usesRight: true, right: '#ff376a',
      magnifier: true, zoom: 2, key: 'meta', autoHide: false, attract: false, delay: 3,
    },
  };

  /** Path for a highlight shape inside (x, y, w, h). Mirrors FocusEffectOverlay.makePath. */
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
        const rx = Math.min(w * 0.34, w / 2), ry = Math.min(h * 0.34, h / 2);
        return `M${f(x + rx)},${f(y)}H${f(maxX - rx)}A${f(rx)},${f(ry)} 0 0,1 ${f(maxX)},${f(y + ry)}` +
          `V${f(maxY - ry)}A${f(rx)},${f(ry)} 0 0,1 ${f(maxX - rx)},${f(maxY)}H${f(x + rx)}` +
          `A${f(rx)},${f(ry)} 0 0,1 ${f(x)},${f(maxY - ry)}V${f(y + ry)}A${f(rx)},${f(ry)} 0 0,1 ${f(x + rx)},${f(y)}Z`;
      }
      default:
        return `M${f(x)},${f(y)}H${f(maxX)}V${f(maxY)}H${f(x)}Z`;
    }
  }

  /** FocusEffectState: pressed buttons, magnifier key and idle time -> presentation. */
  class FocusState {
    constructor() { this.pressed = []; this.magnifierKey = false; this.lastActivity = 0; }
    activity(t) { this.lastActivity = t; }
    setButton(button, down, t) {
      this.pressed = this.pressed.filter((b) => b !== button);
      if (down) this.pressed.push(button);
      this.activity(t);
    }
    setMagnifierKey(down, t) {
      if (this.magnifierKey !== down) {
        this.magnifierKey = down;
        this.activity(t);
      }
    }
    reset(t) { this.pressed = []; this.magnifierKey = false; this.activity(t); }
    get hasActiveInput() { return this.pressed.length > 0 || this.magnifierKey; }
    get active() { return this.pressed.length ? this.pressed[this.pressed.length - 1] : null; }
    presentation(t, cfg) {
      const inactive = !this.hasActiveInput && t - this.lastActivity >= cfg.delay;
      return {
        button: this.active,
        magnifier: cfg.magnifier && this.magnifierKey,
        hidden: inactive && cfg.autoHide,
        attract: inactive && cfg.attract,
      };
    }
  }

  /** FocusClickPlaybackState: keeps a short click "down" on screen for the full press animation. */
  class ClickPlayback {
    constructor() { this.reset(); }
    reset() { this.displayed = null; this.deferredAt = null; this.downAt = null; }
    restartDown(button, t) { this.displayed = button; this.deferredAt = null; this.downAt = t; }
    update(active, t, completesShortClick, downDuration) {
      if (active) {
        if (this.displayed !== active) {
          this.displayed = active;
          this.downAt = t;
        }
        this.deferredAt = null;
        return null;
      }
      if (!this.displayed || this.downAt === null) {
        this.reset();
        return null;
      }
      const releaseAt = this.downAt + Math.max(0, downDuration);
      if (completesShortClick && t < releaseAt) {
        this.deferredAt = releaseAt;
        return releaseAt;
      }
      this.reset();
      return null;
    }
    completeDeferred(active, t) {
      if (active || this.deferredAt === null || t < this.deferredAt) return false;
      this.reset();
      return true;
    }
  }

  // CASpringAnimation(mass 0.8, stiffness 280, damping 20), capped at 0.35 s like the app.
  const SPRING = (() => {
    const m = 0.8, k = 280, c = 20;
    const w0 = Math.sqrt(k / m), zeta = c / (2 * Math.sqrt(k * m)), wd = w0 * Math.sqrt(1 - zeta * zeta);
    const duration = 0.35;
    return {
      duration,
      at(t) {
        if (t <= 0) return 0;
        if (t >= duration) return 1;
        const e = Math.exp(-zeta * w0 * t);
        return 1 - e * (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t));
      },
    };
  })();

  const IDENTITY = { angle: 0, scale: 1 };

  /**
   * DOM renderer for the focus highlight. The host supplies a positioned element
   * inside the scaled desktop and a function that returns a fresh clone of the
   * desktop content for the magnifier (effect layers are never part of it).
   */
  class FocusEffect {
    constructor(el, { cloneContent, screenSize, reducedMotion }) {
      this.el = el;
      this.cloneContent = cloneContent;
      this.screenSize = screenSize;
      this.reducedMotion = reducedMotion || (() => false);
      el.innerHTML =
        '<div class="focus-inner"><div class="focus-lens"><div class="focus-lens-content"></div></div>' +
        '<svg class="focus-ring" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path/></svg></div>';
      this.inner = el.querySelector('.focus-inner');
      this.lens = el.querySelector('.focus-lens');
      this.lensContent = el.querySelector('.focus-lens-content');
      this.svg = el.querySelector('.focus-ring');
      this.path = el.querySelector('.focus-ring path');
      this.lens.hidden = true;
      this.cfg = { ...FOCUS.defaults };
      this.state = new FocusState();
      this.playback = new ClickPlayback();
      this.pres = { button: null, magnifier: false, hidden: false, attract: false };
      this.active = false;
      this.inside = false;
      this.x = 0;
      this.y = 0;
      this.anim = null;
      this.current = { ...IDENTITY };
      this.releaseAt = null;
      this.inactiveAt = null;
      this.lensReady = false;
      this.geometryKey = '';
    }

    get sizePt() { return FOCUS.sizes[this.cfg.size] || 140; }
    get borderPt() { return FOCUS.weights[this.cfg.borderWeight] || 4; }
    get completesShortClick() { return this.cfg.clickAnimation && this.cfg.completeShortClick && !this.reducedMotion(); }

    setConfig(cfg, t) {
      this.cfg = { ...this.cfg, ...cfg };
      this.reconcileClick(t);
      this.updatePresentation(t, false, true);
    }

    setActive(active, t) {
      if (this.active === active) return;
      this.active = active;
      this.el.hidden = !active || !this.inside;
      if (active) {
        this.state.reset(t);
        this.playback.reset();
        this.releaseAt = null;
        this.updatePresentation(t, false, true);
      } else {
        this.anim = null;
        this.releaseAt = null;
        this.inactiveAt = null;
        this.applyTransform(IDENTITY);
        this.el.classList.remove('is-attract', 'is-blink');
      }
    }

    pointer(x, y, inside, t) {
      this.x = x;
      this.y = y;
      this.inside = inside;
      if (inside) this.state.activity(t);
      this.updateGeometry();
      this.updatePresentation(t, true);
      if (this.pres.magnifier && inside) this.updateLens();
    }

    button(button, down, t) {
      const restarts = down && this.completesShortClick && (this.releaseAt !== null || this.anim !== null);
      this.state.setButton(button, down, t);
      if (restarts && this.state.active) {
        this.playback.restartDown(this.state.active, t);
        this.releaseAt = null;
      } else {
        this.reconcileClick(t);
      }
      this.updatePresentation(t, this.cfg.clickAnimation, restarts, restarts);
    }

    magnifierKey(down, t) {
      this.state.setMagnifierKey(down, t);
      this.updatePresentation(t, true);
    }

    resetInput(t) {
      this.state.reset(t);
      this.playback.reset();
      this.releaseAt = null;
      this.updatePresentation(t, false);
    }

    /** Advances timers and the click spring. Returns true while an animation needs frames. */
    tick(t) {
      if (!this.active) return false;
      if (this.releaseAt !== null && t >= this.releaseAt) {
        this.releaseAt = null;
        if (this.playback.completeDeferred(this.state.active, t)) this.updatePresentation(t, true);
        else this.releaseAt = this.playback.deferredAt;
      }
      if (this.inactiveAt !== null && t >= this.inactiveAt) {
        this.inactiveAt = null;
        this.updatePresentation(t, true);
      }
      if (this.anim) {
        const el = t - this.anim.start;
        if (el >= SPRING.duration) {
          this.applyTransform(this.anim.to);
          this.anim = null;
        } else {
          const k = SPRING.at(el);
          this.applyTransform({
            angle: lerp(this.anim.from.angle, this.anim.to.angle, k),
            scale: lerp(this.anim.from.scale, this.anim.to.scale, k),
          });
        }
      }
      return this.anim !== null || this.releaseAt !== null;
    }

    reconcileClick(t) {
      this.releaseAt = this.playback.update(this.state.active, t, this.completesShortClick, SPRING.duration);
    }

    scheduleInactivity(t) {
      this.inactiveAt = null;
      if (!this.active || !(this.cfg.autoHide || this.cfg.attract) || this.state.hasActiveInput) return;
      const remaining = this.cfg.delay - (t - this.state.lastActivity);
      if (remaining > 0) this.inactiveAt = t + remaining;
    }

    updatePresentation(t, animated, force = false, restart = false) {
      const next = this.state.presentation(t, this.cfg);
      next.button = this.playback.displayed;
      const p = this.pres;
      const changed = next.button !== p.button || next.magnifier !== p.magnifier || next.hidden !== p.hidden || next.attract !== p.attract;
      const lensOpened = next.magnifier && !p.magnifier;
      this.pres = next;
      this.scheduleInactivity(t);
      if (lensOpened) this.lensReady = false;
      if (changed || force) this.render(t, animated, restart);
    }

    render(t, animated, restart) {
      if (!this.active) return;
      this.updateGeometry(true);
      this.updateAppearance();
      this.updateClickAnimation(t, animated, restart);
      this.updateAttention();
      if (this.pres.magnifier && this.inside) this.updateLens();
    }

    updateGeometry(force = false) {
      const size = this.sizePt;
      const half = size / 2;
      this.el.hidden = !this.active || !this.inside;
      this.el.style.transform = `translate3d(${(this.x - half).toFixed(2)}px, ${(this.y - half).toFixed(2)}px, 0)`;
      const key = `${this.cfg.shape}|${size}|${this.borderPt}`;
      if (!force && key === this.geometryKey) return;
      this.geometryKey = key;
      const inset = this.borderPt / 2;
      this.el.style.width = this.el.style.height = `${size}px`;
      this.svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
      this.svg.setAttribute('width', size);
      this.svg.setAttribute('height', size);
      this.path.setAttribute('d', focusShapePath(this.cfg.shape, inset, inset, size - inset * 2, size - inset * 2));
      this.lens.style.clipPath = `path('${focusShapePath(this.cfg.shape, 0, 0, size, size)}')`;
    }

    strokeColor() {
      const c = this.cfg;
      if (this.pres.button === 'left' && c.usesLeft) return c.left;
      if (this.pres.button === 'right' && c.usesRight) return c.right;
      return c.accent;
    }

    get showsStroke() {
      const c = this.cfg;
      if (this.pres.magnifier) return true;
      if (this.pres.button === 'left' && c.usesLeft) return true;
      if (this.pres.button === 'right' && c.usesRight) return true;
      return c.usesAccent;
    }

    updateAppearance() {
      const color = hex(this.strokeColor());
      const glow = FOCUS.glows[this.cfg.glow] || FOCUS.glows.soft;
      const s = this.el.style;
      s.setProperty('--focus-color', css(color, 1));
      s.setProperty('--focus-width', `${this.borderPt}px`);
      s.setProperty('--focus-glow-r', `${glow.radius * 2}px`);
      s.setProperty('--focus-glow-a', css(color, glow.opacity));
      s.setProperty('--focus-glow-b', css(color, glow.radius ? 1 : 0));
      this.path.setAttribute('stroke-dasharray', this.cfg.borderStyle === 'dashed' ? '10 7' : 'none');
      this.svg.classList.toggle('has-glow', glow.radius > 0);
      this.svg.style.visibility = this.showsStroke ? 'visible' : 'hidden';
      this.lens.hidden = !(this.pres.magnifier && this.inside);
      this.el.classList.toggle('is-hidden', this.pres.hidden);
    }

    updateLens() {
      if (this.lens.hidden) return;
      if (!this.lensReady) {
        const clone = this.cloneContent();
        this.lensContent.replaceChildren(clone);
        this.lensReady = true;
      }
      const size = this.sizePt;
      const zoom = this.cfg.zoom;
      const screen = this.screenSize();
      const sample = size / zoom;
      // ScreenCapture crop is clamped to the display, so the lens shifts near edges.
      const sx = clamp(this.x - sample / 2, 0, Math.max(0, screen.w - sample));
      const sy = clamp(this.y - sample / 2, 0, Math.max(0, screen.h - sample));
      const first = this.lensContent.firstElementChild;
      if (first) {
        first.style.width = `${screen.w}px`;
        first.style.height = `${screen.h}px`;
        first.style.transform = `translate(${(-sx * zoom).toFixed(2)}px, ${(-sy * zoom).toFixed(2)}px) scale(${zoom})`;
      }
    }

    refreshLens() {
      this.lensReady = false;
      this.updateLens();
    }

    clickTarget(button) {
      if (!this.cfg.clickAnimation || !button) return { ...IDENTITY };
      const intensity = clamp(this.cfg.perspective, 0, 1);
      if (intensity <= 0) return { angle: 0, scale: 0.9 };
      return {
        angle: (button === 'left' ? -1 : 1) * 0.22 * intensity * 2,
        scale: 0.9 + 0.04 * Math.min(intensity * 2, 1),
      };
    }

    updateClickAnimation(t, animated, restartFromIdle) {
      const target = this.clickTarget(this.pres.button);
      const from = restartFromIdle ? { ...IDENTITY } : { ...this.current };
      if (!animated || !this.cfg.clickAnimation || this.reducedMotion()) {
        this.anim = null;
        this.applyTransform(target);
        return;
      }
      this.anim = { from, to: target, start: t };
    }

    applyTransform(v) {
      this.current = { angle: v.angle, scale: v.scale };
      this.inner.style.transform =
        Math.abs(v.angle) < 1e-4 && Math.abs(v.scale - 1) < 1e-4
          ? ''
          : `perspective(500px) rotateY(${v.angle.toFixed(4)}rad) scale(${v.scale.toFixed(4)})`;
    }

    updateAttention() {
      const motion = !this.reducedMotion();
      this.el.classList.toggle('is-blink', motion && this.pres.attract && this.pres.hidden);
      this.el.classList.toggle('is-attract', motion && this.pres.attract && !this.pres.hidden);
    }
  }

  root.DeskFX = {
    Ease, cubicBezier, clamp, lerp, rand,
    color: { rgb, hex, css, mix, toHex },
    RAINBOW, SWATCHES, StrokeStyle,
    CLICK_EFFECTS, CLICK_BY_ID,
    FxScene, LineTrail, SnowTrail,
    FOCUS, FocusEffect, focusShapePath,
  };
})(window);
