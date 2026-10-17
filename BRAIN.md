# Handoff: /brain — immersive 3D page

A separate, spectacular page alongside the normal site, not replacing it. A neural-network brain floats in dark navy space. Its four regions (Work, VUT FIT, KISK, Life) open short summaries and link into the main site.

- Reference: `design/Brain.dc.html`. Open it in a browser with `support.js` and `image-slot.js` beside it, and `public/` copied next to `design/`.
- Data: `content/brain.json`. All copy is final and verbatim, and its links are already mapped to Astro routes.
- The **algorithm and interaction values below are final**. The reference's logic class (`init()` and `loop()`) is the exact implementation. Port it, don't reinvent it.

## Route & architecture
```
src/pages/brain.astro            # full-viewport page, no Header/Footer, own <head> (same fonts)
src/components/brain/
  BrainOverlay.astro             # static DOM: header, intro line, hint, labels, panel shell, memory cards
  brain.ts                       # client script: three.js scene + all interaction (vanilla TS, no framework)
src/data/brain.json              # from content/brain.json
```
- Dependency: `three` from npm, pinned (the reference uses r128 APIs: BufferGeometry, Points, LineSegments, Sprite, FogExp2). Import only what's needed.
- Load the script with `<script>` in `brain.astro`, which Astro bundles. This is the **only** page that ships three.js.
- Render the panel content for all regions and cases statically in `BrainOverlay.astro`, as hidden `<article data-panel="work">` etc. The script only toggles which one is visible. That keeps the copy crawlable and keeps the panel template out of JS strings.
- **Homepage link**: add "Explore in 3D" to the header nav after "Life", linking to `/brain` (see `design/Portfolio v2.dc.html`).

## Homepage anchors (required by brain links)
Add these ids to the homepage, each with `scroll-margin-top` ≈ 4.5–5rem for the sticky header:
- `#work`, `#about`, `#life`, `#contact` (sections)
- `#experience` (the Experience block inside About)
- `#education` (the Education block inside About)
- `#travel` and `#realuxcamp` (the two Life articles)

Native hash scrolling is enough in static Astro. The small hash-retry script in the reference exists only because the prototype renders late, so **don't port it**.

## Visual spec
- Page background: `radial-gradient(120% 90% at 50% 45%, #0d1a4a 0%, #081131 45%, #060b1f 100%)`, with `overflow: hidden` and fixed full viewport.
- Text: #e9eeff. Accents: #8ea4ff (labels and numbers), #b9c6ff (hover and the intro line).
- Fonts are the same as the site: Archivo 78% width, weight 800, caps for the name and titles; IBM Plex Mono caps for labels; IBM Plex Sans for body.
- **Header** (top, gutter padding):
  - left: "Anna Shevchenko" in `.head` and the intro line in mono 300 .76rem, max-width 34ch;
  - right: "← Portfolio" link with a 1px underline.
  - The intro line fades to 0 while a region is open.
- **Hint**, bottom-left: "Drag to rotate · Select a region", mono caps .72rem, rgba(185,198,255,.7).
- **Hub labels**: mono caps .72rem; padding .5/.75rem; background rgba(6,11,31,.6); 1px border rgba(111,140,255,.45); backdrop-blur 4px.
  - Hover: border #b9c6ff, background rgba(31,63,191,.55).
  - Positioned each frame at the projected hub point, offset +16px x and −16px y.
- **Panel**:
  - Desktop: right side, width `min(440px, 38vw)`, full height.
  - Mobile (<720px): bottom sheet starting at 45% height, full width.
  - Background rgba(6,11,31,.84), 1px left/top border rgba(111,140,255,.3), backdrop-blur 10px.
  - Contents in order: crumb ("3 · KISK" or "1.2 · Work / Pockland"), close × button (2.5rem square), kicker, h2 (`.head`, clamp(2rem, 3.4vw, 3rem)), meta (mono, #8ea4ff), optional image (16:10 cover), body paragraph, link rows (mono caps, 1px top rule, →).
  - Footer: "← prev · next →". In a case view it reads "← Work" and "next case →".
- **Work only**: the panel also shows a "Case studies" list of the 5 cases, as buttons that open the case view.
- **Big region name**: VUT FIT, KISK and Life only, not Work.
  - Bottom-left at `bottom: 3.75rem`; Archivo 800, 78% width, caps, `clamp(4.5rem, 12vw, 11rem)`, line-height .8.
  - Transparent fill with `-webkit-text-stroke: 1px rgba(185,198,255,.55)`; fades in over .8s.
- **Memory cards**: VUT FIT, KISK and Life only; hidden on mobile.
  - Polaroid: #eef2ff, padding 7px 7px 0, shadow `0 20px 44px rgba(0,0,0,.5)`.
  - Photo 4:3 cover; caption mono caps .64rem in #1c3aa9.
  - A dashed SVG line (stroke #8ea4ff, dasharray 3 5, opacity .55) runs from the hub to each card's centre.
  - **KISK has no photos yet.** In code, KISK cards with `image: null` are **not rendered**; the line and big name still show. Anna will add images to `brain.json` later.

## Scene (port from `init()`)
- Camera:
  - PerspectiveCamera fov 38, starting z 9 (11 on mobile); intro starts 5 units further back.
  - FogExp2 0x060b1f, density .085.
  - All glow materials use additive blending with `depthWrite: false`.
- Node generation:
  - Seeded LCG (seed 11) so the shape is identical on every load.
  - 1150 nodes, 750 on mobile.
  - The node mix is defined in the reference `pt()`:
    - 12% cerebellum;
    - 3% brain stem;
    - the rest two hemispheres at x ±.55 with radii .78/1.0/1.6, a sinus fold wobble, a medial fissure clamp, a flattened bottom and frontal taper.
- Edges: each node links to its 3 nearest within d² ≤ .17, de-duplicated. Keep an adjacency list for the signal pulses.
- Region membership: the nearest hub within 1.1, with weight `1 − d/1.1`.
- Glow texture: a 64px canvas with a radial gradient, used for points, hubs, pulses and sub-nodes.
- Points: size .065, vertex colours.
  - Base colour (.16, .24, .62) × (0.55 + 0.12·sin(t·1.3 + i)).
  - Region glow is added as `col × glow × weight × 1.1`.
  - When a region is selected, non-member nodes are multiplied by .6.
  - Lines take their node colours, opacity .55.
- Signal pulses: 260 (140 on mobile), size .09, colour #dfe7ff.
  - Each travels edge to edge for 2–7 hops at speed .012–.032 per frame.
  - 60% respawn inside the hovered or selected region.
- Hub sprites: scale .36 + .06·sin(2t + k), plus glow·.3 on hover. The selected hub is ×.45 and the others ×.35 while any region is open.
- **Work sub-nodes**:
  - 5 sprites in a ring of radius .5, centred .35 out from the Work hub along its normal, in the plane perpendicular to it, starting at angle π/2.
  - Lines run from the hub to each node; everything fades in with `subVis` when Work is selected.
  - Labels sit on the side away from the hub (left of the node if it projects left of the hub) and are **clamped** inside the visible canvas area (12px margin, left of the panel).

## Motion
- **Intro**, about 3.1s, skipped entirely with `prefers-reduced-motion`:
  - nodes ease from random positions at radius 5–12 to their targets: easeOutCubic over 1.7s, per-node delay 0–1.1s, starting at .2s;
  - lines fade in from 1.6s to 2.8s; hubs from 2.2s; pulses from 2.4s; labels from 2.7s;
  - the group rotates in from −.9 to .6 rad.
- **Idle**: rotY += .0012 per frame when nothing is hovered or selected; the group bobs on y with sin(.6t)·.04.
- **Drag**: pointer capture on the canvas host; 0.006 rad/px yaw, 0.004 pitch, pitch clamped to ±.9; smoothing .07.
- **Click** (pointer moved < 6px):
  - on a sub-node: open that case;
  - on a hub or region node: select it (raycast on Points with threshold .07, region weight > .25, or within 26px of a hub's screen point);
  - on empty space: deselect.
- **Select**:
  - rotate so the hub faces the camera: rotY = atan2(−x, z) unwrapped to the nearest turn; rotX = atan2(y, z′);
  - the camera eases (.045) to (1.05, 0, 4.5) on desktop, or z 5.4 for Work; on mobile (0, −.95, 5.4/6.2).
- **Memory cards**:
  - placed relative to the hub's screen point using the `memorySlots` offsets × R, where R = min(areaW, H)·.5, rotated by `rot` deg;
  - float ±6px on sin(.8t + 1.7k) with a slight rotation wobble;
  - fade and rise 24px, staggered .7s + k·.15s after selection;
  - clamped to x ∈ [12, areaW − w − 16] and y ∈ [96, bigName.top − 16 − h];
  - card width min(230, areaW·.2, H·.26), at least 130;
  - count: 2 if H < 640 or areaW·H < 420k, 3 if H < 820, otherwise 4.
- **Esc**: closes the case view first, then the region.
- **Hover**: re-pick every 3rd frame, skipped while the pointer is over a DOM label. Cursor: grab, grabbing while dragging, pointer over a hub or region.

## Robustness & accessibility (code-only additions)
- **No WebGL**, or three fails to load: hide the canvas and show the four regions as a plain list of the same panels (static HTML is already there).
- Hub labels and case buttons are real `<button>`s, reachable by keyboard; Enter selects. The panel is `role="dialog"` with `aria-labelledby` its h2; focus moves into the panel on open and returns to the label on close.
- Pause the RAF loop when `document.hidden`; dispose the renderer on page leave.
- `devicePixelRatio` capped at 2. Re-read canvas size on resize; switch to the mobile layout below 720px.
- Use `<title>Anna Shevchenko — 3D map</title>` and a meta description.

## Acceptance
- 1440×900, 924×540, 390×844: the intro plays, all four regions open, Work shows 5 case nodes with no label overlap, and memory cards never cover the big name or leave the canvas area.
- Every panel link lands on the right page or homepage anchor, below the sticky header.
- Reduced motion: no intro and no idle drift; everything still works.
