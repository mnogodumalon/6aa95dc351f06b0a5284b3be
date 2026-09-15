import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: [
    'einrichtung',
    'kita_jahr',
    'betreuungsform',
    'plaetze_gesamt',
  ],
  defaults: {
    'betreuungsform': { kind: 'lookup', key: 'kindergarten', label: 'Kindergarten (3–6 Jahre)' },
    'plaetze_gesamt': { kind: 'literal', value: 1 },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
