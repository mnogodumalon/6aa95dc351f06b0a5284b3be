/**
 * Field rules — GENERATED from the app metadata. Do not edit.
 *
 * The mechanical truth about every field: what kind it is, whether the
 * platform's base view marks it required, which lookup keys exist, where an
 * applookup points, what the label is. `useStepForm` validates against these
 * rules and phrases its messages with the real labels; `toWirePayload` uses
 * them to shape the create payload; `SHAPES` tells a page which input FORM
 * fits the data (a date pair wants a calendar, not two fields) — it is a
 * signal, not a gate.
 */
import { appLabel, fieldLabel, lookupLabel } from '@/i18n';
import { LOOKUP_OPTIONS } from '@/types/app';

export type EntityKey = 'einrichtungen' | 'mitarbeiter' | 'platzkontingente' | 'kinder' | 'anfragen';

/** The text fields of each entity — what a search may run over (generated;
 *  `never` for an entity without text of its own, e.g. a link table). */
export interface StringFields {
  "einrichtungen": "name" | "beschreibung" | "strasse" | "hausnummer" | "plz" | "ort" | "telefon" | "email" | "oeffnungszeiten";
  "mitarbeiter": "vorname" | "nachname" | "email_ma" | "telefon_ma";
  "platzkontingente": "kita_jahr";
  "kinder": "vorname" | "nachname" | "strasse" | "hausnummer" | "plz" | "ort" | "besonderheiten";
  "anfragen": "eltern_vorname" | "eltern_nachname" | "eltern_email" | "eltern_telefon" | "anfragenummer" | "ablehnungsgrund" | "interne_notizen";
}
export type StringFieldKey<E extends EntityKey> = E extends keyof StringFields ? StringFields[E] : never;

/** The applookup fields of each entity (generated). A pick stored through
 *  `form.set` on one of these must carry its display name — at compile time
 *  (`StepForm.set`), because the review would otherwise show the id. */
export interface RecordFields {
  "einrichtungen": never;
  "mitarbeiter": "einrichtung";
  "platzkontingente": "einrichtung";
  "kinder": never;
  "anfragen": "kind" | "einrichtung" | "zweitwunsch_einrichtung";
}
export type RecordFieldKey<E extends EntityKey> = E extends keyof RecordFields ? RecordFields[E] : never;

export type FieldKind =
  | 'text'
  | 'textarea'
  | 'email'
  | 'tel'
  | 'url'
  | 'number'
  | 'bool'
  | 'date'
  | 'datetime'
  | 'lookup'
  | 'multilookup'
  | 'record'
  | 'multirecord'
  | 'file'
  | 'geo';

export interface FieldRule {
  key: string;
  fulltype: string;
  kind: FieldKind;
  /** From the app's base view. A public page may override this per field. */
  required: boolean;
  /** Build-time label — `labelOf()` prefers the runtime i18n bundle. */
  label: string;
  /** Whether a journey may write it (`file` is upload-only, never via a journey). */
  writable: boolean;
  maxLength?: number;
  /** lookup / multilookup: the ONLY valid write values. */
  options?: string[];
  /** record / multirecord: the target app (always) and its entity key (when inside this appgroup). */
  targetAppId?: string;
  targetEntity?: EntityKey;
  format?: 'currency';
  /** HTML autocomplete token derived from the field name (given-name, email, tel, …). */
  autoComplete?: string;
}

export interface EntityInfo {
  key: EntityKey;
  appId: string;
  label: string;
  /** PascalCase plural — `get<pascal>()` on the service. */
  pascal: string;
  /** The single-record suffix — `create<single>()` on the service. */
  single: string;
}

/** Input-form signals per entity: which data shape each field (pair) has.
 *  `range`  — two date fields that form a stay/period → AvailabilityRangePicker
 *  `choice` — a lookup with few options → ChoiceGroup pills instead of a select
 *  `record` — an applookup → EntitySelectStep with search, never a raw id field
 *  `stock`  — a quantity that has a stock/capacity counterpart → show it, warn on overshoot */
export type Shape =
  | { kind: 'range'; from: string; to: string }
  | { kind: 'choice'; field: string; count: number }
  | { kind: 'record'; field: string; targetEntity?: EntityKey }
  | { kind: 'stock'; field: string };

export const ENTITIES: Record<EntityKey, EntityInfo> = {
  "einrichtungen": {
    "key": "einrichtungen",
    "appId": "6aa95d9522cd16bf318fc896",
    "label": "Einrichtungen",
    "pascal": "Einrichtungen",
    "single": "EinrichtungenEntry"
  },
  "mitarbeiter": {
    "key": "mitarbeiter",
    "appId": "6aa95d9de38462db33f2ed31",
    "label": "Mitarbeiter",
    "pascal": "Mitarbeiter",
    "single": "MitarbeiterEntry"
  },
  "platzkontingente": {
    "key": "platzkontingente",
    "appId": "6aa95d9ea2bf16980067e647",
    "label": "Platzkontingente",
    "pascal": "Platzkontingente",
    "single": "PlatzkontingenteEntry"
  },
  "kinder": {
    "key": "kinder",
    "appId": "6aa95d9f705c3b105a495885",
    "label": "Kinder",
    "pascal": "Kinder",
    "single": "KinderEntry"
  },
  "anfragen": {
    "key": "anfragen",
    "appId": "6aa95da03d9608636c3c2843",
    "label": "Anfragen",
    "pascal": "Anfragen",
    "single": "AnfragenEntry"
  }
};

export const FIELD_RULES: Record<EntityKey, Record<string, FieldRule>> = {
  "einrichtungen": {
    "name": {
      "key": "name",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Name der Einrichtung",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "name"
    },
    "traegerart": {
      "key": "traegerart",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": true,
      "label": "Trägerart",
      "writable": true,
      "options": [
        "kirchlich",
        "frei",
        "staedtisch"
      ]
    },
    "beschreibung": {
      "key": "beschreibung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Beschreibung",
      "writable": true
    },
    "foto": {
      "key": "foto",
      "fulltype": "file",
      "kind": "file",
      "required": false,
      "label": "Foto der Einrichtung",
      "writable": false
    },
    "strasse": {
      "key": "strasse",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Straße",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "address-line1"
    },
    "hausnummer": {
      "key": "hausnummer",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Hausnummer",
      "writable": true,
      "maxLength": 4000
    },
    "plz": {
      "key": "plz",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Postleitzahl",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "postal-code"
    },
    "ort": {
      "key": "ort",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Ort",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "address-level2"
    },
    "telefon": {
      "key": "telefon",
      "fulltype": "string/tel",
      "kind": "tel",
      "required": false,
      "label": "Telefon",
      "writable": true,
      "autoComplete": "tel"
    },
    "email": {
      "key": "email",
      "fulltype": "string/email",
      "kind": "email",
      "required": false,
      "label": "E-Mail",
      "writable": true,
      "autoComplete": "email"
    },
    "betreuungsformen": {
      "key": "betreuungsformen",
      "fulltype": "multiplelookup/checkbox",
      "kind": "multilookup",
      "required": true,
      "label": "Betreuungsformen",
      "writable": true,
      "options": [
        "krippe",
        "kindergarten",
        "hort"
      ]
    },
    "oeffnungszeiten": {
      "key": "oeffnungszeiten",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Öffnungszeiten",
      "writable": true
    }
  },
  "mitarbeiter": {
    "vorname": {
      "key": "vorname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Vorname",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "given-name"
    },
    "nachname": {
      "key": "nachname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Nachname",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "family-name"
    },
    "rolle": {
      "key": "rolle",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": true,
      "label": "Rolle",
      "writable": true,
      "options": [
        "traeger",
        "einrichtungsleitung"
      ]
    },
    "einrichtung": {
      "key": "einrichtung",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Einrichtung",
      "writable": true,
      "targetAppId": "6aa95d9522cd16bf318fc896",
      "targetEntity": "einrichtungen"
    },
    "email_ma": {
      "key": "email_ma",
      "fulltype": "string/email",
      "kind": "email",
      "required": true,
      "label": "E-Mail",
      "writable": true,
      "autoComplete": "email"
    },
    "telefon_ma": {
      "key": "telefon_ma",
      "fulltype": "string/tel",
      "kind": "tel",
      "required": false,
      "label": "Telefon",
      "writable": true,
      "autoComplete": "tel"
    }
  },
  "platzkontingente": {
    "einrichtung": {
      "key": "einrichtung",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Einrichtung",
      "writable": true,
      "targetAppId": "6aa95d9522cd16bf318fc896",
      "targetEntity": "einrichtungen"
    },
    "kita_jahr": {
      "key": "kita_jahr",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Kita-Jahr",
      "writable": true,
      "maxLength": 4000
    },
    "betreuungsform": {
      "key": "betreuungsform",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": true,
      "label": "Betreuungsform",
      "writable": true,
      "options": [
        "kindergarten",
        "hort",
        "krippe"
      ]
    },
    "plaetze_gesamt": {
      "key": "plaetze_gesamt",
      "fulltype": "number",
      "kind": "number",
      "required": true,
      "label": "Plätze gesamt",
      "writable": true,
      "format": "currency"
    }
  },
  "kinder": {
    "vorname": {
      "key": "vorname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Vorname",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "given-name"
    },
    "nachname": {
      "key": "nachname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Nachname",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "family-name"
    },
    "geburtsdatum": {
      "key": "geburtsdatum",
      "fulltype": "date/date",
      "kind": "date",
      "required": true,
      "label": "Geburtsdatum",
      "writable": true,
      "autoComplete": "bday"
    },
    "geschlecht": {
      "key": "geschlecht",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": false,
      "label": "Geschlecht",
      "writable": true,
      "options": [
        "weiblich",
        "maennlich",
        "divers"
      ]
    },
    "strasse": {
      "key": "strasse",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Straße",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "address-line1"
    },
    "hausnummer": {
      "key": "hausnummer",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Hausnummer",
      "writable": true,
      "maxLength": 4000
    },
    "plz": {
      "key": "plz",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Postleitzahl",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "postal-code"
    },
    "ort": {
      "key": "ort",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Ort",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "address-level2"
    },
    "besonderheiten": {
      "key": "besonderheiten",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Besonderheiten (Allergien, Förderbedarf)",
      "writable": true
    },
    "geschwisterkind": {
      "key": "geschwisterkind",
      "fulltype": "bool",
      "kind": "bool",
      "required": false,
      "label": "Geschwisterkind bereits in einer Einrichtung",
      "writable": true
    }
  },
  "anfragen": {
    "kind": {
      "key": "kind",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Kind",
      "writable": true,
      "targetAppId": "6aa95d9f705c3b105a495885",
      "targetEntity": "kinder"
    },
    "eltern_vorname": {
      "key": "eltern_vorname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Vorname des Elternteils",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "given-name"
    },
    "eltern_nachname": {
      "key": "eltern_nachname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Nachname des Elternteils",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "family-name"
    },
    "eltern_email": {
      "key": "eltern_email",
      "fulltype": "string/email",
      "kind": "email",
      "required": true,
      "label": "E-Mail des Elternteils",
      "writable": true,
      "autoComplete": "email"
    },
    "eltern_telefon": {
      "key": "eltern_telefon",
      "fulltype": "string/tel",
      "kind": "tel",
      "required": false,
      "label": "Telefon des Elternteils",
      "writable": true,
      "autoComplete": "tel"
    },
    "einrichtung": {
      "key": "einrichtung",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Gewünschte Einrichtung",
      "writable": true,
      "targetAppId": "6aa95d9522cd16bf318fc896",
      "targetEntity": "einrichtungen"
    },
    "zweitwunsch_einrichtung": {
      "key": "zweitwunsch_einrichtung",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Zweitwunsch Einrichtung",
      "writable": true,
      "targetAppId": "6aa95d9522cd16bf318fc896",
      "targetEntity": "einrichtungen"
    },
    "betreuungsform": {
      "key": "betreuungsform",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": true,
      "label": "Betreuungsform",
      "writable": true,
      "options": [
        "krippe",
        "kindergarten",
        "hort"
      ]
    },
    "gewuenschter_start": {
      "key": "gewuenschter_start",
      "fulltype": "date/date",
      "kind": "date",
      "required": true,
      "label": "Gewünschter Betreuungsstart",
      "writable": true
    },
    "betreuungsumfang": {
      "key": "betreuungsumfang",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": true,
      "label": "Betreuungsumfang",
      "writable": true,
      "options": [
        "halbtags",
        "ganztags",
        "verlaengert"
      ]
    },
    "berufstaetig": {
      "key": "berufstaetig",
      "fulltype": "bool",
      "kind": "bool",
      "required": false,
      "label": "Beide Elternteile berufstätig",
      "writable": true
    },
    "anfragenummer": {
      "key": "anfragenummer",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Anfragenummer",
      "writable": true,
      "maxLength": 4000
    },
    "eingegangen_am": {
      "key": "eingegangen_am",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Eingegangen am",
      "writable": true
    },
    "status": {
      "key": "status",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": false,
      "label": "Status",
      "writable": true,
      "options": [
        "eingegangen",
        "in_pruefung",
        "warteliste",
        "zugesagt",
        "abgelehnt",
        "zurueckgezogen"
      ]
    },
    "wartelistenplatz": {
      "key": "wartelistenplatz",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Wartelistenplatz",
      "writable": true
    },
    "entscheidung_am": {
      "key": "entscheidung_am",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Entscheidung am",
      "writable": true
    },
    "ablehnungsgrund": {
      "key": "ablehnungsgrund",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Ablehnungsgrund",
      "writable": true
    },
    "interne_notizen": {
      "key": "interne_notizen",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Interne Notizen",
      "writable": true
    }
  }
};

export const SHAPES: Record<EntityKey, Shape[]> = {
  "einrichtungen": [
    {
      "kind": "choice",
      "field": "traegerart",
      "count": 3
    }
  ],
  "mitarbeiter": [
    {
      "kind": "choice",
      "field": "rolle",
      "count": 2
    },
    {
      "kind": "record",
      "field": "einrichtung",
      "targetEntity": "einrichtungen"
    }
  ],
  "platzkontingente": [
    {
      "kind": "choice",
      "field": "betreuungsform",
      "count": 3
    },
    {
      "kind": "record",
      "field": "einrichtung",
      "targetEntity": "einrichtungen"
    }
  ],
  "kinder": [
    {
      "kind": "choice",
      "field": "geschlecht",
      "count": 3
    }
  ],
  "anfragen": [
    {
      "kind": "choice",
      "field": "betreuungsform",
      "count": 3
    },
    {
      "kind": "choice",
      "field": "betreuungsumfang",
      "count": 3
    },
    {
      "kind": "choice",
      "field": "status",
      "count": 6
    },
    {
      "kind": "record",
      "field": "kind",
      "targetEntity": "kinder"
    },
    {
      "kind": "record",
      "field": "einrichtung",
      "targetEntity": "einrichtungen"
    },
    {
      "kind": "record",
      "field": "zweitwunsch_einrichtung",
      "targetEntity": "einrichtungen"
    }
  ]
};

/** The fields a record of this entity is recognised by (a person: first and
 *  last name; else its title-like text field) — the same choice the dashboard's
 *  enrichment makes for `<key>Name`. `useRecordSearch` resolves an applookup to
 *  this name (`ctx.ref('gast')` in `toItem`). */
export const DISPLAY_FIELDS: Record<EntityKey, string[]> = {
  "einrichtungen": [
    "name"
  ],
  "mitarbeiter": [
    "vorname",
    "nachname"
  ],
  "platzkontingente": [
    "kita_jahr"
  ],
  "kinder": [
    "vorname",
    "nachname"
  ],
  "anfragen": [
    "eltern_vorname"
  ]
};

/** The display name of a record: its display fields joined, else the first
 *  non-empty text value, else ''. */
export function displayNameOf(entity: EntityKey, fields: Record<string, unknown>): string {
  const parts = (DISPLAY_FIELDS[entity] ?? [])
    .map(k => fields[k])
    .filter((v): v is string => typeof v === 'string' && v.trim() !== '')
    .map(v => v.trim());
  if (parts.length > 0) return parts.join(' ');
  for (const [k, rule] of Object.entries(FIELD_RULES[entity] ?? {})) {
    if (rule.kind !== 'text' && rule.kind !== 'email') continue;
    const v = fields[k];
    if (typeof v === 'string' && v.trim() !== '') return v.trim();
  }
  return '';
}

export function ruleOf(entity: EntityKey, key: string): FieldRule | undefined {
  return FIELD_RULES[entity]?.[key];
}

/** The field label as the user sees it — runtime bundle first, generated label second. */
export function labelOf(entity: EntityKey, key: string): string {
  const fromBundle = fieldLabel(entity, key);
  if (fromBundle !== key) return fromBundle;
  return ruleOf(entity, key)?.label ?? key;
}

export function entityLabel(entity: EntityKey): string {
  const fromBundle = appLabel(entity);
  if (fromBundle !== entity) return fromBundle;
  return ENTITIES[entity]?.label ?? entity;
}

/** Lookup options with runtime labels — the only legitimate source of `{key,label}` pairs. */
export function optionsOf(entity: EntityKey, key: string): Array<{ key: string; label: string }> {
  const generated = (LOOKUP_OPTIONS as Record<string, Record<string, Array<{ key: string; label: string }>>>)[entity]?.[key];
  if (generated && generated.length) return generated.map(o => ({ key: o.key, label: o.label }));
  const keys = ruleOf(entity, key)?.options ?? [];
  return keys.map(k => ({ key: k, label: lookupLabel(entity, key, k) ?? k }));
}

export function isEmptyValue(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'object' && 'from' in (v as object) && 'to' in (v as object)) {
    const r = v as { from: unknown; to: unknown };
    return isEmptyValue(r.from) && isEmptyValue(r.to);
  }
  return false;
}
