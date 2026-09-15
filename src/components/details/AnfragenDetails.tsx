import type { Anfragen, Kinder, Einrichtungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';

export interface AnfragenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Anfragen;
  /** N:1-Ziel „Kinder": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  kinderList: Kinder[];
  /** Klick auf die Kinder-Relation → overlay.push auf dessen Detail. */
  onOpenKinder?: (record: Kinder) => void;
  /** N:1-Ziel „Einrichtungen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  einrichtungenList: Einrichtungen[];
  /** Klick auf die Einrichtungen-Relation → overlay.push auf dessen Detail. */
  onOpenEinrichtungen?: (record: Einrichtungen) => void;
}

export function AnfragenDetails({
  record,
  kinderList,
  onOpenKinder,
  einrichtungenList,
  onOpenEinrichtungen,
}: AnfragenDetailsProps) {
  const kindTarget = kinderList.find(r => r.record_id === extractRecordId(record.fields.kind));
  const einrichtungTarget = einrichtungenList.find(r => r.record_id === extractRecordId(record.fields.einrichtung));
  const zweitwunsch_einrichtungTarget = einrichtungenList.find(r => r.record_id === extractRecordId(record.fields.zweitwunsch_einrichtung));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('anfragen', 'eltern_vorname')} value={record.fields.eltern_vorname} format="text" />
        <RecordField label={fieldLabel('anfragen', 'eltern_nachname')} value={record.fields.eltern_nachname} format="text" />
        <RecordField label={fieldLabel('anfragen', 'eltern_email')} value={record.fields.eltern_email} format="email" />
        <RecordField label={fieldLabel('anfragen', 'eltern_telefon')} value={record.fields.eltern_telefon} format="text" />
        <RecordField label={fieldLabel('anfragen', 'betreuungsform')} value={record.fields.betreuungsform} format="pill" />
        <RecordField label={fieldLabel('anfragen', 'gewuenschter_start')} value={record.fields.gewuenschter_start} format="date" />
        <RecordField label={fieldLabel('anfragen', 'betreuungsumfang')} value={record.fields.betreuungsumfang} format="pill" />
        <RecordField label={fieldLabel('anfragen', 'berufstaetig')} value={record.fields.berufstaetig} format="bool" />
        <RecordField label={fieldLabel('anfragen', 'anfragenummer')} value={record.fields.anfragenummer} format="text" />
        <RecordField label={fieldLabel('anfragen', 'eingegangen_am')} value={record.fields.eingegangen_am} format="date" />
        <RecordField label={fieldLabel('anfragen', 'status')} value={record.fields.status} format="pill" />
        <RecordField label={fieldLabel('anfragen', 'wartelistenplatz')} value={record.fields.wartelistenplatz} format="text" />
        <RecordField label={fieldLabel('anfragen', 'entscheidung_am')} value={record.fields.entscheidung_am} format="date" />
        <RecordField label={fieldLabel('anfragen', 'ablehnungsgrund')} value={record.fields.ablehnungsgrund} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('anfragen', 'interne_notizen')} value={record.fields.interne_notizen} format="longtext" className="md:col-span-2" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('anfragen', 'kind')}
          name={kindTarget?.fields.vorname ?? '—'}
          meta={[kindTarget?.fields.nachname, kindTarget?.fields.strasse].filter(Boolean).join(' · ') || undefined}
          onClick={kindTarget && onOpenKinder ? () => onOpenKinder!(kindTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('anfragen', 'einrichtung')}
          name={einrichtungTarget?.fields.name ?? '—'}
          meta={[einrichtungTarget?.fields.telefon, einrichtungTarget?.fields.email].filter(Boolean).join(' · ') || undefined}
          onClick={einrichtungTarget && onOpenEinrichtungen ? () => onOpenEinrichtungen!(einrichtungTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('anfragen', 'zweitwunsch_einrichtung')}
          name={zweitwunsch_einrichtungTarget?.fields.name ?? '—'}
          meta={[zweitwunsch_einrichtungTarget?.fields.telefon, zweitwunsch_einrichtungTarget?.fields.email].filter(Boolean).join(' · ') || undefined}
          onClick={zweitwunsch_einrichtungTarget && onOpenEinrichtungen ? () => onOpenEinrichtungen!(zweitwunsch_einrichtungTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.ANFRAGEN} recordId={record.record_id} />
    </>
  );
}
