---
name: gsap
description: GSAP animation reference for HyperFrames. Covers gsap.to(), from(), fromTo(), easing, stagger, defaults, timelines (gsap.timeline(), position parameter, labels, nesting, playback), and performance (transforms, will-change, quickTo). Use when writing GSAP animations in HyperFrames compositions.
---

# GSAP

## HyperFrames Contract

HyperFrames controls GSAP through its `gsap` runtime adapter. Create a paused timeline synchronously, register it on `window.__timelines` with the exact `data-composition-id`, and let HyperFrames seek it.

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<script>
  window.__timelines = window.__timelines || {};
  const tl = gsap.timeline({ paused: true });

  tl.from(".title", { y: 48, opacity: 0, duration: 0.6, ease: "power3.out" }, 0);
  tl.to(".accent", { scaleX: 1, duration: 0.5, ease: "power2.out" }, 0.25);

  window.__timelines["main"] = tl;
</script>
```

- The registry key must match the composition root's `data-composition-id`.
- Do not call `tl.play()` for render-critical motion.
- Do not build timelines inside async code, timers, or event handlers.
- Keep loops finite. HyperFrames renders finite video durations.

## Core Tween Methods

- **gsap.to(targets, vars)** — animate from current state to `vars`. Most common.
- **gsap.from(targets, vars)** — animate from `vars` to current state (entrances).
- **gsap.fromTo(targets, fromVars, toVars)** — explicit start and end.
- **gsap.set(targets, vars)** — apply immediately (duration 0).

Always use **camelCase** property names (e.g. `backgroundColor`, `rotationX`).

## Common vars

| Property       | Description                                              |
| -------------- | -------------------------------------------------------- |
| `duration`     | seconds (default 0.5)                                    |
| `delay`        | seconds before start                                     |
| `ease`         | `"power1.out"`, `"power3.inOut"`, `"back.out(1.7)"`     |
| `stagger`      | number `0.1` or object: `{ amount: 0.3, from: "center" }` |
| `overwrite`    | `false` (default), `true`, or `"auto"`                  |
| `repeat`       | finite number; never `-1` in HyperFrames                 |
| `yoyo`         | alternates direction with repeat                         |
| `onComplete`   | callback when tween finishes                            |

## Transform Aliases

| GSAP property               | Equivalent          |
| --------------------------- | ------------------- |
| `x`, `y`, `z`               | translateX/Y/Z (px) |
| `xPercent`, `yPercent`      | translateX/Y in %   |
| `scale`, `scaleX`, `scaleY` | scale               |
| `rotation`                  | rotate (deg)         |
| `rotationX`, `rotationY`    | 3D rotate           |
| `skewX`, `skewY`            | skew                |
| `transformOrigin`           | transform-origin    |
| `autoAlpha`                 | opacity + visibility |

## Easing

Built-in eases: `power1`–`power4`, `back`, `bounce`, `circ`, `elastic`, `expo`, `sine`. Each has `.in`, `.out`, `.inOut`.

## Defaults

```javascript
gsap.defaults({ duration: 0.6, ease: "power2.out" });
```

## Timeline Position Parameter

Third argument controls placement:

| Format | Meaning |
|--------|---------|
| `1` | at 1s (absolute) |
| `"+=0.5"` | after end (relative) |
| `"-=0.2"` | before end (relative) |
| `"intro"` | at label |
| `"<"` | same start as previous |
| `">"` | after previous ends |
| `"<0.2"` | 0.2s after previous starts |

## Labels

```javascript
tl.addLabel("intro", 0);
tl.to(".a", { x: 100 }, "intro");
tl.addLabel("outro", "+=0.5");
tl.play("outro");
tl.tweenFromTo("intro", "outro");
```

## Performance

### Prefer Transform and Opacity

Animating `x`, `y`, `scale`, `rotation`, `opacity` stays on the compositor. Avoid `width`, `height`, `top`, `left` when transforms suffice.

### will-change

```css
will-change: transform;
```

Only on elements that actually animate.

### gsap.quickTo()

```javascript
let xTo = gsap.quickTo("#id", "x", { duration: 0.4, ease: "power3" }),
  yTo = gsap.quickTo("#id", "y", { duration: 0.4, ease: "power3" });
container.addEventListener("mousemove", (e) => {
  xTo(e.pageX);
  yTo(e.pageY);
});
```

## Do Not

- Animate layout properties (width/height/top/left) when transforms suffice
- Use both svgOrigin and transformOrigin on the same SVG element
- Chain animations with delay when a timeline can sequence them
- Create tweens before the DOM exists
- Skip cleanup — always kill tweens when no longer needed
- Use infinite repeat values in HyperFrames compositions