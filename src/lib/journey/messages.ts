/**
 * Required-field messages — WRITTEN BY THE BUILD AGENT, never by a heuristic.
 *
 * The layer knows two things about an empty required field: that it is
 * required and what its label is. Out of that it can only say „„Anreise" ist
 * ein Pflichtfeld". What the person should do instead („Bitte einen Gast
 * auswählen.") is meaning, and meaning is the agent's: the Phase-2 orchestrator
 * writes one short instruction per required field — what is needed, not why — to
 * `.intents-staging/messages.json`, the integration step validates it against
 * the app metadata and renders it into the block below. Scaffold updates keep
 * the block. Do not edit outside the markers.
 *
 * Every door reads this and nothing else: `useStepForm` (flows and public
 * pages), the generated {Entity}Dialog and the public form's server-error line.
 * A field without a sentence falls back to the label sentence — never to a
 * bare „Dieses Feld ist erforderlich".
 *
 * Required fields per entity (from the base view):
 *   - einrichtungen: name (Name der Einrichtung), traegerart (Trägerart), strasse (Straße), hausnummer (Hausnummer), plz (Postleitzahl), ort (Ort), betreuungsformen (Betreuungsformen)
 *   - mitarbeiter: vorname (Vorname), nachname (Nachname), rolle (Rolle), email_ma (E-Mail)
 *   - platzkontingente: einrichtung (Einrichtung), kita_jahr (Kita-Jahr), betreuungsform (Betreuungsform), plaetze_gesamt (Plätze gesamt)
 *   - kinder: vorname (Vorname), nachname (Nachname), geburtsdatum (Geburtsdatum), strasse (Straße), hausnummer (Hausnummer), plz (Postleitzahl), ort (Ort)
 *   - anfragen: kind (Kind), eltern_vorname (Vorname des Elternteils), eltern_nachname (Nachname des Elternteils), eltern_email (E-Mail des Elternteils), einrichtung (Gewünschte Einrichtung), betreuungsform (Betreuungsform), gewuenschter_start (Gewünschter Betreuungsstart), betreuungsumfang (Betreuungsumfang)
 */
import { t, tx } from '@/i18n';
import { labelOf, type EntityKey } from './rules';

/** The writable fields of each entity — the keys a message may address (generated). */
export interface MessageFields {
  "einrichtungen": "name" | "traegerart" | "beschreibung" | "strasse" | "hausnummer" | "plz" | "ort" | "telefon" | "email" | "betreuungsformen" | "oeffnungszeiten";
  "mitarbeiter": "vorname" | "nachname" | "rolle" | "einrichtung" | "email_ma" | "telefon_ma";
  "platzkontingente": "einrichtung" | "kita_jahr" | "betreuungsform" | "plaetze_gesamt";
  "kinder": "vorname" | "nachname" | "geburtsdatum" | "geschlecht" | "strasse" | "hausnummer" | "plz" | "ort" | "besonderheiten" | "geschwisterkind";
  "anfragen": "kind" | "eltern_vorname" | "eltern_nachname" | "eltern_email" | "eltern_telefon" | "einrichtung" | "zweitwunsch_einrichtung" | "betreuungsform" | "gewuenschter_start" | "betreuungsumfang" | "berufstaetig" | "anfragenummer" | "eingegangen_am" | "status" | "wartelistenplatz" | "entscheidung_am" | "ablehnungsgrund" | "interne_notizen";
}
export type MessageFieldKey<E extends EntityKey> = E extends keyof MessageFields ? MessageFields[E] : never;

export const REQUIRED_MESSAGES: { [E in EntityKey]?: Partial<Record<MessageFieldKey<E>, string>> } = {
  // <custom:messages>
  einrichtungen: { name: "Bitte den Namen der Einrichtung eingeben.", traegerart: "Bitte die Trägerart auswählen.", strasse: "Bitte die Straße eingeben.", hausnummer: "Bitte die Hausnummer eingeben.", plz: "Bitte die Postleitzahl eingeben.", ort: "Bitte den Ort eingeben.", betreuungsformen: "Bitte mindestens eine Betreuungsform auswählen." },
  mitarbeiter: { vorname: "Bitte den Vornamen eingeben.", nachname: "Bitte den Nachnamen eingeben.", rolle: "Bitte die Rolle auswählen.", email_ma: "Bitte die E-Mail-Adresse eingeben." },
  platzkontingente: { einrichtung: "Bitte eine Einrichtung auswählen.", kita_jahr: "Bitte das Kita-Jahr eingeben (z. B. 2026/27).", betreuungsform: "Bitte die Betreuungsform auswählen.", plaetze_gesamt: "Bitte die Gesamtanzahl der Plätze eingeben." },
  kinder: { vorname: "Bitte den Vornamen des Kindes eingeben.", nachname: "Bitte den Nachnamen des Kindes eingeben.", geburtsdatum: "Bitte das Geburtsdatum des Kindes angeben.", strasse: "Bitte die Straße der Wohnadresse eingeben.", hausnummer: "Bitte die Hausnummer eingeben.", plz: "Bitte die Postleitzahl eingeben.", ort: "Bitte den Wohnort eingeben." },
  anfragen: { kind: "Bitte ein Kind auswählen oder neu anlegen.", eltern_vorname: "Bitte den Vornamen des Elternteils eingeben.", eltern_nachname: "Bitte den Nachnamen des Elternteils eingeben.", eltern_email: "Bitte die E-Mail-Adresse des Elternteils eingeben.", einrichtung: "Bitte die gewünschte Einrichtung auswählen.", betreuungsform: "Bitte die Betreuungsform auswählen.", gewuenschter_start: "Bitte das gewünschte Startdatum angeben.", betreuungsumfang: "Bitte den Betreuungsumfang auswählen." },
  // </custom:messages>
};

/** The sentence shown when `key` of `entity` is required and empty — the
 *  agent's own text (translated at runtime like every page string), else the
 *  label sentence. Call it while rendering, not at module scope. */
export function requiredMessage(entity: EntityKey, key: string): string {
  const own = (REQUIRED_MESSAGES as Record<string, Record<string, string | undefined> | undefined>)[entity]?.[key];
  if (own && own.trim()) return tx(own);
  return t('v_required', { label: labelOf(entity, key) });
}

/** True when the agent wrote a sentence for the field. */
export function hasOwnMessage(entity: EntityKey, key: string): boolean {
  const own = (REQUIRED_MESSAGES as Record<string, Record<string, string | undefined> | undefined>)[entity]?.[key];
  return Boolean(own && own.trim());
}
