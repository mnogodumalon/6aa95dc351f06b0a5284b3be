import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: [
    'kind',
    { row: ['eltern_vorname', 'eltern_nachname'] },
    'eltern_email',
    'eltern_telefon',
    'einrichtung',
    'zweitwunsch_einrichtung',
    'betreuungsform',
    'gewuenschter_start',
    'betreuungsumfang',
    'berufstaetig',
    'anfragenummer',
    'eingegangen_am',
    'status',
    'wartelistenplatz',
    'entscheidung_am',
    'ablehnungsgrund',
    'interne_notizen',
  ],
  defaults: {
    'eingegangen_am': { kind: 'today' },
    'status': { kind: 'lookup', key: 'eingegangen', label: 'Eingegangen' },
    'berufstaetig': { kind: 'literal', value: true },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
