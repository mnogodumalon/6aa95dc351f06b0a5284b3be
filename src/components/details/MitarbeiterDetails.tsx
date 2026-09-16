import type { Mitarbeiter, Einrichtungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';

export interface MitarbeiterDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Mitarbeiter;
  /** N:1-Ziel „Einrichtungen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  einrichtungenList: Einrichtungen[];
  /** Klick auf die Einrichtungen-Relation → overlay.push auf dessen Detail. */
  onOpenEinrichtungen?: (record: Einrichtungen) => void;
}

export function MitarbeiterDetails({
  record,
  einrichtungenList,
  onOpenEinrichtungen,
}: MitarbeiterDetailsProps) {
  const einrichtungTarget = einrichtungenList.find(r => r.record_id === extractRecordId(record.fields.einrichtung));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('mitarbeiter', 'vorname')} value={record.fields.vorname} format="text" />
        <RecordField label={fieldLabel('mitarbeiter', 'nachname')} value={record.fields.nachname} format="text" />
        <RecordField label={fieldLabel('mitarbeiter', 'rolle')} value={record.fields.rolle} format="pill" />
        <RecordField label={fieldLabel('mitarbeiter', 'email_ma')} value={record.fields.email_ma} format="email" />
        <RecordField label={fieldLabel('mitarbeiter', 'telefon_ma')} value={record.fields.telefon_ma} format="text" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={1}>
        <RecordRelation
          label={fieldLabel('mitarbeiter', 'einrichtung')}
          name={einrichtungTarget?.fields.name ?? '—'}
          meta={[einrichtungTarget?.fields.telefon, einrichtungTarget?.fields.email].filter(Boolean).join(' · ') || undefined}
          onClick={einrichtungTarget && onOpenEinrichtungen ? () => onOpenEinrichtungen!(einrichtungTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.MITARBEITER} recordId={record.record_id} />
    </>
  );
}
