import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: [
    { row: ['vorname', 'nachname'] },
    'rolle',
    'einrichtung',
    'email_ma',
    'telefon_ma',
  ],
  defaults: {
    'rolle': { kind: 'lookup', key: 'einrichtungsleitung', label: 'Einrichtungsleitung' },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
