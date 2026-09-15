import type { Platzkontingente, Einrichtungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';

export interface PlatzkontingenteDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Platzkontingente;
  /** N:1-Ziel „Einrichtungen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  einrichtungenList: Einrichtungen[];
  /** Klick auf die Einrichtungen-Relation → overlay.push auf dessen Detail. */
  onOpenEinrichtungen?: (record: Einrichtungen) => void;
}

export function PlatzkontingenteDetails({
  record,
  einrichtungenList,
  onOpenEinrichtungen,
}: PlatzkontingenteDetailsProps) {
  const einrichtungTarget = einrichtungenList.find(r => r.record_id === extractRecordId(record.fields.einrichtung));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('platzkontingente', 'kita_jahr')} value={record.fields.kita_jahr} format="text" />
        <RecordField label={fieldLabel('platzkontingente', 'betreuungsform')} value={record.fields.betreuungsform} format="pill" />
        <RecordField label={fieldLabel('platzkontingente', 'plaetze_gesamt')} value={record.fields.plaetze_gesamt} format="text" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={1}>
        <RecordRelation
          label={fieldLabel('platzkontingente', 'einrichtung')}
          name={einrichtungTarget?.fields.name ?? '—'}
          meta={[einrichtungTarget?.fields.telefon, einrichtungTarget?.fields.email].filter(Boolean).join(' · ') || undefined}
          onClick={einrichtungTarget && onOpenEinrichtungen ? () => onOpenEinrichtungen!(einrichtungTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.PLATZKONTINGENTE} recordId={record.record_id} />
    </>
  );
}
