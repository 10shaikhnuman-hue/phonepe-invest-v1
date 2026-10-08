# PhonePe Invest — landing page (Figma frame 210:3182)

1:1 recreation of the Figma design **PhonePe-Invest › Frame 2147263712** (1440 × 7480) with a GSAP motion layer.

## Run

```bash
python3 -m http.server 8418
```

Then open http://localhost:8418/ (any static server works — there is no build step).

- `?motion=0` renders the page without animation (used for pixel-diff QA against the Figma export).
- `prefers-reduced-motion: reduce` disables the motion layer automatically.

## Files

| File | What it is |
| --- | --- |
| `index.html` | Markup, one `<section class="frame">` per Figma section, node ids in `data-node` |
| `styles.css` | Figma coordinates (1440 frame), auto-layout groups as flex, carousel + motion states |
| `script.js` | Carousel (5 slides, tabs, autoplay + progress, peek-to-navigate), sign-up form |
| `motion.js` | GSAP 3 + ScrollTrigger: hero intro, scroll reveals, parallax, ambient loops |
| `assets/` | Exports from Figma — illustrations as 2× PNG, icons/logos/arcs as SVG |

The 1440px composition scales to narrower viewports with `zoom: var(--fit)` (set in `<head>`), so proportions stay identical to the design at every width.
