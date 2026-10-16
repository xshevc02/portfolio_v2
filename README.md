# Handoff: Portfolio v3 — Anna Shevchenko

## Overview
A full rebuild of Anna Shevchenko's UX portfolio as a **new, clean repository**, deployed with **GitHub Pages**. It replaces the current `xshevc02/portfolio` site, which should stay live until the new one is ready.

Scope:
- Homepage: hero, numbers, five-project Work list, About, Life, Contact
- Five case-study pages: Analyticity, Pockland, Wake & Wine, Thermo Fisher (NDA, abstracted), PeePoint
- KISK study-reflections page, bilingual EN/CZ

## About the design files
The files in `design/` are **design references built in HTML**: prototypes showing the intended look, copy and behaviour. They are **not production code**, so don't copy their markup. Every style is inline, by design of the prototyping tool. The task is to **recreate them in a clean Astro project** using the architecture below.

To view them, open any `design/*.dc.html` in a browser with `support.js` beside it. For images to resolve, copy the old repo's `public/` folder next to `design/`, so paths like `public/images/...` work.

## Fidelity
**High fidelity.** Colours, type, spacing, layout, copy and interactions are final. Recreate them pixel-close. All copy in the design files is final and must be moved over **verbatim**.

## Target stack & architecture (new repo)
- **Astro** with static output, **plain CSS** (no Tailwind, no CSS-in-JS) and **zero client JS** except a few small islands (listed under Interactions).
- **Content collections**: every case study and every KISK reflection is a Markdown/MDX file. Code holds layout only.
- **One design-system stylesheet**: `src/styles/system.css`, from `system.css` in this bundle. Components use its variables and classes; no hard-coded colours in components.
- Small, single-purpose components. Each visual pattern exists exactly once.

```
src/
  styles/system.css
  layouts/Base.astro            # <head>, fonts, Header, Footer
  components/
    Header.astro                # full name (left) + nav (Work, About, Life, CV ↗) / case variant (All work ←, Next case)
    Footer.astro
    HeroHome.astro
    NumbersRow.astro            # 2+ years / 7+ sessions / 6+ teams
    ProjectRow.astro            # editorial strip, image left/right alternating
    NdaBlock.astro              # blue .print block (homepage + case)
    CaseHero.astro              # meta row, h1, lead, facts <dl>
    InShort.astro               # 1px-gap grid of label/text cells, last cell blue
    CaseSection.astro           # number + label column | h2 + body column, top rule
    Figure.astro / FigurePair.astro / FigureGrid.astro
    NumberedList.astro          # R1…R11, Change 1…6
    Gallery.astro               # horizontal scroll-snap track + prev/next buttons (Pockland critique log, Life)
    CopyEmail.astro             # island
    LangToggle.astro            # island (KISK)
    PhotoTaped.astro            # hero photo treatment
  content/
    config.ts                   # zod schemas for cases + kisk
    cases/*.mdx
    kisk/intro.{cs,en}.md
    kisk/subjects/*.{cs,en}.md
  pages/
    index.astro
    work/[slug].astro
    kisk/index.astro            # renders by ?lang or toggle, see Interactions
public/images/                  # copied from old repo (same subpaths)
.github/workflows/deploy.yml    # withastro/action → GitHub Pages
```

`content/` in this bundle already has the KISK intro in both languages, a subject template and a case frontmatter schema. **Extract the rest of the case-study copy verbatim from `design/Case - *.dc.html`** into `src/content/cases/*.mdx`.

## Global rules (decided with the client, keep them)
1. **No leading zeros anywhere.** Use 1, 2, 3, never 01. This covers section numbers, R1–R11, "Change 1", "Next · 2" and semesters.
2. **Light paper is the default.** Blue `.print` sections are rare accents:
   - Homepage: only the **NDA block** and **About**. Life, Contact and the footer stay light, separated by a 1px cobalt top rule.
   - Case pages: dark sections in the references become `.print` (e.g. "Outcome", "AI-assisted workflow", "Product strategy", "Eleven design requirements" panel).
   - The Thermo Fisher page is fully `.print` in the reference. The client may still change this, so keep it switchable with a page-level prop.
3. **All headlines** (h1–h3, big numbers, the header name, next-case titles) use `.head`: Archivo, 78% width, weight 800, uppercase.
4. **Body text** uses IBM Plex Sans. **Labels, captions, nav and buttons** use IBM Plex Mono in uppercase, usually cobalt.
5. **Header** shows the **full name "Anna Shevchenko"** in `.head` at 1.2rem.
6. No custom cursor.
7. Hairlines are cobalt (`--cobalt-line`). Major section rules are solid 1px `--cobalt`.

## Screens

### Homepage — `design/Portfolio v2.dc.html`
- **Sticky header**: 1.25rem vertical padding, `--gutter` sides, bottom border `--cobalt-line`, background rgba(245,247,249,.92) with backdrop-blur 16px.
- **Hero**: two columns via `repeat(auto-fit, minmax(min(100%, 22rem), 1fr))`.
  - Left column:
    - eyebrow in `.label`: "UX for scientific and data-heavy products · Brno, open to Prague & remote EU"
    - h1: "Complex software that feels simple to use."
    - lead paragraph
    - buttons: "See my work ↗" (solid) and "Copy my email" (line, island)
  - Right column: **PhotoTaped**, then a caption.
- **PhotoTaped** (max-width 19rem):
  - a cobalt rectangle behind, offset translate(10px, 10px), not rotated;
  - on top, the photo card rotated **2.5deg**: 8px padding, matte `--cobalt-pale`, 1px cobalt border;
  - image object-position 50% 30% with `filter: saturate(.8) brightness(1.04) contrast(1.03)`, plus an overlay `#7f9cff` at opacity .55 with `mix-blend-mode: soft-light`, which gives a cool colour grade;
  - one tape strip 72×20px centred on the top edge (top -10px), background rgba(245,247,249,.82), 1px border rgba(31,63,191,.22), rotate(-4deg), shadow 0 1px 2px rgba(15,26,74,.12).
  - Never black & white (client rejected it).
- **NumbersRow**: a 1px-gap grid of three cells, each a big `.head` number with a mono caption.
- **Work**: header row "Work · newest first", then h2 "Four projects I can talk about for an hour, and one I can’t show you."
  - **ProjectRow** ×4, alternating image side, top rule.
  - **NdaBlock** sits between Wake & Wine and PeePoint.
  - The PeePoint row image is `ai-prototype/ai-prototype-preview.png`, shown **uncropped** (height auto), with the caption "Screens reworked with AI in 2026 from the original 2024 mockups".
- **About** (`.print`):
  - experience and education;
  - the KISK education entry has a link "Study reflections ↗" to `/kisk`.
- **Life**: two horizontal galleries with location/date labels.
- **Contact**: large h2 and email copy.
- **Footer**: light, cobalt text, cobalt top rule.

### Case pages — `design/Case - *.dc.html`
Shared skeleton:
- case header (All work ← / Next case)
- CaseHero: meta row, h1, lead, facts `<dl>` with 8.5rem label column
- cover Figure
- InShort
- numbered CaseSections
- Next-case link: big `.head` title with ↗
- footer

Per-page specials:
- **Analyticity**: R1–R11 list on `.print`; four detail figures in a 4:3 grid with contained images; testing changes in a 1px-gap grid; references list.
- **Pockland**: "Open the live app" button (https://xshevc02.github.io/book_app/); Home/Feed/Shelves/Profile strip; **Gallery** of 24 critique notes (scroll-snap, prev/next scroll by two cards); before/after pair; sections 7 (done, solid rules) and 8 (backlog, dashed rules) side by side.
- **Wake & Wine**: "&" in the h1 set in cobalt italic; four interviewee cells; three competitor columns; two-step entry flow with pull-quotes (IBM Plex Sans italic, cobalt, left rule); stack table.
- **Thermo Fisher**: no UI, only diagrams built in HTML/CSS:
  - collaboration map ("Me" card in `--on-print-label`)
  - quarter cycle (5 steps)
  - six-phase vertical timeline
  - before/after principles (struck-through left column)
  - "talk" card with the copy-email island
- **PeePoint**: survey stats 85/65/75% large; personas grid next to the map; Keep/Gap cells; laptop → QR → phone flow on `.print`; 2024 mockups vs 2026 AI rework clearly dated; Next goes back to Analyticity.

### KISK reflections — `design/KISK Reflections.dc.html`
- Header with an "About ←" link and an **EN/CZ toggle**.
- **Intro**, two columns:
  - Left, labelled "Kdo jsem a kam směřuji": four questions (who / why KISK / expectations / goal), each a numbered `.head` question with a paragraph. Content is in `content/kisk/intro.*.md`.
  - Right, labelled "O studiu": programme and length `<dl>`.
  - Both column labels and their top rules align.
- **Semester overview**: two year blocks.
  - Each has a cobalt header bar with the year label ("1. ročník" / "Year 1", `white-space: nowrap`) and the span "2026 / 2027" or "2027 / 2028".
  - Under it, two semester cells: Podzim 2026, Jaro 2027, Podzim 2027, Jaro 2028.
- **Subjects**: generated from `content/kisk/subjects`, grouped or ordered by semester. Each has:
  - number, title, code and semester meta;
  - the reflection text;
  - an optional artefact image (4:3, `--cobalt-pale` matte);
  - an optional assignment links list.
  - While a semester has no subjects, show one dashed placeholder row with "[ doplním ]" / "[ to be written ]".
- **Year summary** on `.print`, as a placeholder until written.
- No deadlines are shown on the page (client request).

## Interactions & behaviour
- **Copy email** (homepage hero and Thermo Fisher): writes `anna.shevchenko.20042015@gmail.com` to the clipboard, the label changes to "Copied ✓" for 1.8s, then reverts. This needs a tiny inline script, not a framework island.
- **Gallery**: native horizontal scroll with `scroll-snap-type: x mandatory` and a hidden scrollbar. Prev/next buttons call `scrollBy` by two card widths, with smooth scrolling.
- **LangToggle (KISK)**: build both languages statically, `/kisk/` (cs) and `/kisk/en/`. The toggle is a link, and the last choice is stored in `localStorage['kisk-lang']` for a redirect on first visit. Czech is the default for the school.
- Links: underline animation on header/footer links. A 1px currentColor line scales from 0 to 1 on hover in 250ms, with origin right → left.
- **Responsive**: every layout is fluid, using `auto-fit/minmax` grids and flex-wrap with `gap`. No fixed widths on text boxes, and `min-width: 0` on grid children. Check down to 360px.

## Design tokens
See `system.css` (source of truth).
- **Colours**:
  - paper #f5f7f9, ink #14161c
  - cobalt #1f3fbf, cobalt-pale #e6ebfb
  - print blue #1c3aa9, on-print #f2f5ff, on-print label #b9c6ff
- **Grid background**: 24px, line rgba(31,63,191,.07) on paper, rgba(255,255,255,.08) on blue.
- **Fonts**: Archivo (variable width; headlines at 78%), IBM Plex Sans, IBM Plex Mono.
- **Radii**: 0 everywhere. **Shadows**: none, except the photo tape.

## Assets
All images come from the old repo `xshevc02/portfolio/public/images/`: thesis, pockland (incl. research and iteration-notes), wake-wine, peepoint (incl. ai-prototype), profile and hobbies. Keep the same subpaths under `public/images/`. The old flower cursor PNGs are **not** used.

## Files in this bundle
- `design/Portfolio v2.dc.html`: homepage
- `design/Case - Analyticity.dc.html`, `Case - Pockland.dc.html`, `Case - Wake and Wine.dc.html`, `Case - Thermo Fisher.dc.html`, `Case - PeePoint.dc.html`
- `design/KISK Reflections.dc.html`: KISK page; EN/CZ copy is in its logic class
- `design/Visual Directions.dc.html`: exploration history; the chosen direction is **6a + photo 10a**. For context only.
- `design/support.js`: runtime needed to open the references
- `system.css`: design tokens and base classes
- `content/kisk/intro.cs.md`, `intro.en.md`: final copy
- `content/kisk/subjects/_template.md`: subject file format
- `content/cases/_schema.md`: case frontmatter and MDX component usage

## Suggested order of work
1. Scaffold Astro and add `system.css`, Base layout, Header and Footer.
2. Build the homepage and its components.
3. Set up the case content collection and `work/[slug]`, starting with Analyticity, then the rest.
4. Build the KISK page with the content collection and both languages.
5. Add the GitHub Pages workflow. Set `site` and `base` in `astro.config` to match the new repo name, or a custom domain.
6. Test at 360 / 768 / 1280 / 1600px.
