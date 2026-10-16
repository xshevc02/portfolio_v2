---
# Frontmatter for src/content/cases/<slug>.md
order: 1                      # homepage order (newest first), no leading zeros in UI
slug: analyticity
title: Analyticity platform overhaul
year: 2026
type: Data platform · UX + frontend
summary: …                    # homepage row paragraph
myPart: …                     # homepage "My part —" mono line
cover: /images/thesis/final-solution-overview.png
coverAlt: …
nda: false                    # true renders the blue NDA treatment (Thermo Fisher)
facts:                        # hero <dl> rows
  - { label: Research inputs, value: … }
inShort:                      # "In short" grid; last item usually Outcome (blue cell)
  - { label: Problem, text: … }
next: pockland
---

## Context {#context}
Body copy as Markdown. Use the components below inside .mdx where needed:
<Figure src="…" alt="…" label="Before · Original Traffic Jams dashboard" caption="…" />
<FigurePair>…</FigurePair>
<NumberedList items={[…]} prefix="R" />
<BlueSection>…</BlueSection>
