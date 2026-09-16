import { lookupLabel } from '@/i18n';

// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
/** A raw record URL (applookup reference). NEVER render this directly
 *  in JSX — it is a URL, not a display value. Show the enriched `*Name`
 *  field or resolve it via the entity map instead. Assignable to/from
 *  string everywhere; the `& {}` keeps the alias NAME visible in tsc
 *  error messages (a plain primitive alias gets normalized away). */
export type RecordUrl = string & {};
export type GeoLocation = { lat: number; long: number; info?: string };

export type AttachmentType = 'file' | 'note' | 'url' | 'json';
export interface Attachment {
  id: string;
  type: AttachmentType;
  label: string | null;
  value: string | null;
  active: boolean;
  createdat?: string | null;
  updatedat?: string | null;
}

export interface AttachmentInput {
  type: AttachmentType;
  label?: string;
  value: string;
  active?: boolean;
}

export interface Einrichtungen {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    name?: string;
    traegerart?: LookupValue;
    beschreibung?: string;
    foto?: string;
    strasse?: string;
    hausnummer?: string;
    plz?: string;
    ort?: string;
    telefon?: string;
    email?: string;
    betreuungsformen?: LookupValue[];
    oeffnungszeiten?: string;
  };
}

export interface Mitarbeiter {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    vorname?: string;
    nachname?: string;
    rolle?: LookupValue;
    einrichtung?: RecordUrl; // applookup -> URL zu 'Einrichtungen' Record
    email_ma?: string;
    telefon_ma?: string;
  };
}

export interface Platzkontingente {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    einrichtung?: RecordUrl; // applookup -> URL zu 'Einrichtungen' Record
    kita_jahr?: string;
    betreuungsform?: LookupValue;
    plaetze_gesamt?: number;
  };
}

export interface Kinder {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    vorname?: string;
    nachname?: string;
    geburtsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    geschlecht?: LookupValue;
    strasse?: string;
    hausnummer?: string;
    plz?: string;
    ort?: string;
    besonderheiten?: string;
    geschwisterkind?: boolean;
  };
}

export interface Anfragen {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    kind?: RecordUrl; // applookup -> URL zu 'Kinder' Record
    eltern_vorname?: string;
    eltern_nachname?: string;
    eltern_email?: string;
    eltern_telefon?: string;
    einrichtung?: RecordUrl; // applookup -> URL zu 'Einrichtungen' Record
    zweitwunsch_einrichtung?: RecordUrl; // applookup -> URL zu 'Einrichtungen' Record
    betreuungsform?: LookupValue;
    gewuenschter_start?: string; // Format: YYYY-MM-DD oder ISO String
    betreuungsumfang?: LookupValue;
    berufstaetig?: boolean;
    anfragenummer?: string;
    eingegangen_am?: string; // Format: YYYY-MM-DD oder ISO String
    status?: LookupValue;
    wartelistenplatz?: number;
    entscheidung_am?: string; // Format: YYYY-MM-DD oder ISO String
    ablehnungsgrund?: string;
    interne_notizen?: string;
  };
}

export const APP_IDS = {
  EINRICHTUNGEN: '6aa95d9522cd16bf318fc896',
  MITARBEITER: '6aa95d9de38462db33f2ed31',
  PLATZKONTINGENTE: '6aa95d9ea2bf16980067e647',
  KINDER: '6aa95d9f705c3b105a495885',
  ANFRAGEN: '6aa95da03d9608636c3c2843',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'einrichtungen': {
    traegerart: [{ key: "kirchlich", get label() { return lookupLabel('einrichtungen', 'traegerart', "kirchlich") ?? "Kirchlich"; } }, { key: "frei", get label() { return lookupLabel('einrichtungen', 'traegerart', "frei") ?? "Frei"; } }, { key: "staedtisch", get label() { return lookupLabel('einrichtungen', 'traegerart', "staedtisch") ?? "Städtisch"; } }],
    betreuungsformen: [{ key: "krippe", get label() { return lookupLabel('einrichtungen', 'betreuungsformen', "krippe") ?? "Krippe (unter 3 Jahre)"; } }, { key: "kindergarten", get label() { return lookupLabel('einrichtungen', 'betreuungsformen', "kindergarten") ?? "Kindergarten (3–6 Jahre)"; } }, { key: "hort", get label() { return lookupLabel('einrichtungen', 'betreuungsformen', "hort") ?? "Hort"; } }],
  },
  'mitarbeiter': {
    rolle: [{ key: "traeger", get label() { return lookupLabel('mitarbeiter', 'rolle', "traeger") ?? "Träger (Stadtverwaltung)"; } }, { key: "einrichtungsleitung", get label() { return lookupLabel('mitarbeiter', 'rolle', "einrichtungsleitung") ?? "Einrichtungsleitung"; } }],
  },
  'platzkontingente': {
    betreuungsform: [{ key: "kindergarten", get label() { return lookupLabel('platzkontingente', 'betreuungsform', "kindergarten") ?? "Kindergarten (3–6 Jahre)"; } }, { key: "hort", get label() { return lookupLabel('platzkontingente', 'betreuungsform', "hort") ?? "Hort"; } }, { key: "krippe", get label() { return lookupLabel('platzkontingente', 'betreuungsform', "krippe") ?? "Krippe (unter 3 Jahre)"; } }],
  },
  'kinder': {
    geschlecht: [{ key: "weiblich", get label() { return lookupLabel('kinder', 'geschlecht', "weiblich") ?? "Weiblich"; } }, { key: "maennlich", get label() { return lookupLabel('kinder', 'geschlecht', "maennlich") ?? "Männlich"; } }, { key: "divers", get label() { return lookupLabel('kinder', 'geschlecht', "divers") ?? "Divers"; } }],
  },
  'anfragen': {
    betreuungsform: [{ key: "krippe", get label() { return lookupLabel('anfragen', 'betreuungsform', "krippe") ?? "Krippe (unter 3 Jahre)"; } }, { key: "kindergarten", get label() { return lookupLabel('anfragen', 'betreuungsform', "kindergarten") ?? "Kindergarten (3–6 Jahre)"; } }, { key: "hort", get label() { return lookupLabel('anfragen', 'betreuungsform', "hort") ?? "Hort"; } }],
    betreuungsumfang: [{ key: "halbtags", get label() { return lookupLabel('anfragen', 'betreuungsumfang', "halbtags") ?? "Halbtags"; } }, { key: "ganztags", get label() { return lookupLabel('anfragen', 'betreuungsumfang', "ganztags") ?? "Ganztags"; } }, { key: "verlaengert", get label() { return lookupLabel('anfragen', 'betreuungsumfang', "verlaengert") ?? "Verlängert"; } }],
    status: [{ key: "eingegangen", get label() { return lookupLabel('anfragen', 'status', "eingegangen") ?? "Eingegangen"; } }, { key: "in_pruefung", get label() { return lookupLabel('anfragen', 'status', "in_pruefung") ?? "In Prüfung"; } }, { key: "warteliste", get label() { return lookupLabel('anfragen', 'status', "warteliste") ?? "Warteliste"; } }, { key: "zugesagt", get label() { return lookupLabel('anfragen', 'status', "zugesagt") ?? "Zugesagt"; } }, { key: "abgelehnt", get label() { return lookupLabel('anfragen', 'status', "abgelehnt") ?? "Abgelehnt"; } }, { key: "zurueckgezogen", get label() { return lookupLabel('anfragen', 'status', "zurueckgezogen") ?? "Zurückgezogen"; } }],
  },
};

// Optimistic LookupValue writes: never re-type a label — resolve the schema
// option instead (its label is a locale-aware getter; falls back to the key).
// WRONG: status: { key: 'offen', label: 'Offen' }   (frozen in one language)
// RIGHT: status: lookupOption('<appKey>', 'status', 'offen')
export function lookupOption(app: string, field: string, key: string): LookupValue {
  return LOOKUP_OPTIONS[app]?.[field]?.find(o => o.key === key) ?? { key, label: key };
}

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'einrichtungen': {
    'name': 'string/text',
    'traegerart': 'lookup/radio',
    'beschreibung': 'string/textarea',
    'foto': 'file',
    'strasse': 'string/text',
    'hausnummer': 'string/text',
    'plz': 'string/text',
    'ort': 'string/text',
    'telefon': 'string/tel',
    'email': 'string/email',
    'betreuungsformen': 'multiplelookup/checkbox',
    'oeffnungszeiten': 'string/textarea',
  },
  'mitarbeiter': {
    'vorname': 'string/text',
    'nachname': 'string/text',
    'rolle': 'lookup/radio',
    'einrichtung': 'applookup/select',
    'email_ma': 'string/email',
    'telefon_ma': 'string/tel',
  },
  'platzkontingente': {
    'einrichtung': 'applookup/select',
    'kita_jahr': 'string/text',
    'betreuungsform': 'lookup/radio',
    'plaetze_gesamt': 'number',
  },
  'kinder': {
    'vorname': 'string/text',
    'nachname': 'string/text',
    'geburtsdatum': 'date/date',
    'geschlecht': 'lookup/radio',
    'strasse': 'string/text',
    'hausnummer': 'string/text',
    'plz': 'string/text',
    'ort': 'string/text',
    'besonderheiten': 'string/textarea',
    'geschwisterkind': 'bool',
  },
  'anfragen': {
    'kind': 'applookup/select',
    'eltern_vorname': 'string/text',
    'eltern_nachname': 'string/text',
    'eltern_email': 'string/email',
    'eltern_telefon': 'string/tel',
    'einrichtung': 'applookup/select',
    'zweitwunsch_einrichtung': 'applookup/select',
    'betreuungsform': 'lookup/radio',
    'gewuenschter_start': 'date/date',
    'betreuungsumfang': 'lookup/radio',
    'berufstaetig': 'bool',
    'anfragenummer': 'string/text',
    'eingegangen_am': 'date/date',
    'status': 'lookup/select',
    'wartelistenplatz': 'number',
    'entscheidung_am': 'date/date',
    'ablehnungsgrund': 'string/textarea',
    'interne_notizen': 'string/textarea',
  },
};

export const HUB_TOPOLOGY: Record<string, { field: string; entity: string }[]> = {
  'einrichtungen': [
    { field: 'einrichtung', entity: 'mitarbeiter' },
    { field: 'einrichtung', entity: 'platzkontingente' },
    { field: 'einrichtung', entity: 'anfragen' },
    { field: 'zweitwunsch_einrichtung', entity: 'anfragen' },
  ],
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateEinrichtungen = StripLookup<Einrichtungen['fields']>;
export type CreateMitarbeiter = StripLookup<Mitarbeiter['fields']>;
export type CreatePlatzkontingente = StripLookup<Platzkontingente['fields']>;
export type CreateKinder = StripLookup<Kinder['fields']>;
export type CreateAnfragen = StripLookup<Anfragen['fields']>;