export type Lang = 'cs' | 'en';

export const kiskPath = { cs: '/kisk/', en: '/kisk/en/' } as const;

const plural = (n: number, one: string, few: string, many: string) =>
  n === 1 ? one : n >= 2 && n <= 4 ? few : many;

export const t = {
  en: {
    back: 'About',
    eyebrow: 'KISK · Masaryk University · study reflections',
    title: 'Two years at KISK, subject by subject.',
    studyLabel: 'About the studies',
    programmeLabel: 'Programme',
    programme: 'Information Studies and Librarianship (KISK), Faculty of Arts, Masaryk University',
    lengthLabel: 'Length',
    length: '2 years · 4 semesters',
    empty: '[ to be written ]',
    years: ['Year 1', 'Year 2'],
    spans: ['2026 / 2027', '2027 / 2028'],
    overview: 'Semester overview',
    subjects: 'Subjects',
    subjectsCount: (n: number) => `${n} ${n === 1 ? 'subject' : 'subjects'} · added as I go`,
    semesterCount: (n: number) => (n === 0 ? 'subjects to be added' : `${n} ${n === 1 ? 'subject' : 'subjects'}`),
    artefact: 'Artefact',
    linksLabel: 'Assignments',
    summaryLabel: 'Year summary',
    summaryTitle: 'Looking back on the year.',
    summaryEmpty: '[ summary — written at the end of the year ]',
    sem: ['Autumn 2026', 'Spring 2027', 'Autumn 2027', 'Spring 2028'],
  },
  cs: {
    back: 'O mně',
    eyebrow: 'KISK · Masarykova univerzita · studijní reflexe',
    title: 'Dva roky na KISKu, předmět po předmětu.',
    studyLabel: 'O studiu',
    programmeLabel: 'Obor',
    programme: 'Informační studia a knihovnictví (KISK), Filozofická fakulta, Masarykova univerzita',
    lengthLabel: 'Délka',
    length: '2 roky · 4 semestry',
    empty: '[ doplním ]',
    years: ['1. ročník', '2. ročník'],
    spans: ['2026 / 2027', '2027 / 2028'],
    overview: 'Přehled semestrů',
    subjects: 'Předměty',
    subjectsCount: (n: number) => `${n} ${plural(n, 'předmět', 'předměty', 'předmětů')} · doplňuji průběžně`,
    semesterCount: (n: number) => (n === 0 ? 'předměty doplním' : `${n} ${plural(n, 'předmět', 'předměty', 'předmětů')}`),
    artefact: 'Výstup',
    linksLabel: 'Úkoly',
    summaryLabel: 'Shrnutí roku',
    summaryTitle: 'Ohlédnutí za rokem.',
    summaryEmpty: '[ shrnutí — napíšu na konci roku ]',
    sem: ['Podzim 2026', 'Jaro 2027', 'Podzim 2027', 'Jaro 2028'],
  },
} as const;
