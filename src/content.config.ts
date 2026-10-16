import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

const fact = z.object({ label: z.string(), value: z.string() });

const cases = defineCollection({
  loader: glob({ pattern: '[!_]*.mdx', base: './src/content/cases' }),
  schema: z.object({
    order: z.number().int().positive(),       // homepage order, newest first
    title: z.string(),
    heroTitle: z.string().optional(),         // HTML override for the case h1 (e.g. italic "&")
    homeTitle: z.string().optional(),         // homepage override (NDA block)
    year: z.string(),
    type: z.string(),                         // homepage meta row
    heroMeta: z.array(z.string()),            // case meta row, after the number
    summary: z.string(),                      // homepage row paragraph
    myPart: z.string(),                       // homepage "My part —" mono line
    lead: z.string(),                         // case hero lead
    leadNote: z.string().optional(),          // mono note under the lead (NDA)
    nda: z.boolean().default(false),          // blue NDA treatment on the homepage
    print: z.boolean().default(false),        // whole case page on the .print surface
    home: z.object({
      image: z.string().optional(),
      alt: z.string().optional(),
      position: z.string().default('center top'),
      uncropped: z.boolean().default(false),
      caption: z.string().optional(),
      stats: z.array(fact).optional(),
    }).default({}),
    cover: z.object({
      src: z.string(),
      alt: z.string(),
      caption: z.string(),
      matte: z.boolean().default(false),
    }).optional(),
    cta: z.object({ label: z.string(), url: z.string() }).optional(),
    facts: z.array(fact),
    inShort: z.array(z.object({ label: z.string(), text: z.string() })).optional(),
    next: reference('cases'),
  }),
});

const kiskIntro = defineCollection({
  loader: glob({ pattern: 'intro.*.md', base: './src/content/kisk' }),
  schema: z.object({ lang: z.enum(['cs', 'en']), title: z.string() }),
});

const kiskSubjects = defineCollection({
  loader: glob({ pattern: '[!_]*.md', base: './src/content/kisk/subjects' }),
  schema: z.object({
    lang: z.enum(['cs', 'en']),
    semester: z.number().int().min(1).max(4),
    code: z.string(),
    title: z.string(),
    order: z.number().int().optional(),
    artefact: z.string().optional(),
    artefactAlt: z.string().optional(),
    links: z.array(z.object({ label: z.string(), url: z.string() })).optional(),
  }),
});

export const collections = { cases, kiskIntro, kiskSubjects };
