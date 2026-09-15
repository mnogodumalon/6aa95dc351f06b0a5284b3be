import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: [
    'name',
    'traegerart',
    { row: ['strasse', 'hausnummer'], cols: '2fr 1fr' },
    { row: ['plz', 'ort'], cols: '1fr 2fr' },
    'telefon',
    'email',
    'betreuungsformen',
    'beschreibung',
    'oeffnungszeiten',
  ],
  defaults: {
    'traegerart': { kind: 'lookup', key: 'frei', label: 'Frei' },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
