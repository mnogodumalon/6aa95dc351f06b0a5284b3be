import type { Kinder, Anfragen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';

export interface KinderDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Kinder;
  /** 1:N „Anfragen" (kind): VOLLE Liste — der Block filtert auf diesen Record. */
  anfragenList: Anfragen[];
  /** Zeilen-Klick → overlay.push auf das Anfragen-Detail (nie der Edit-Dialog). */
  onOpenAnfragen: (record: Anfragen) => void;
  /** Kontextuelles „+": öffnet den Anfragen-Dialog mit diesem Record vorgesetzt. */
  onAddAnfragen: () => void;
}

export function KinderDetails({
  record,
  anfragenList,
  onOpenAnfragen,
  onAddAnfragen,
}: KinderDetailsProps) {
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('kinder', 'vorname')} value={record.fields.vorname} format="text" />
        <RecordField label={fieldLabel('kinder', 'nachname')} value={record.fields.nachname} format="text" />
        <RecordField label={fieldLabel('kinder', 'geburtsdatum')} value={record.fields.geburtsdatum} format="date" />
        <RecordField label={fieldLabel('kinder', 'geschlecht')} value={record.fields.geschlecht} format="pill" />
        <RecordField label={fieldLabel('kinder', 'strasse')} value={record.fields.strasse} format="text" />
        <RecordField label={fieldLabel('kinder', 'hausnummer')} value={record.fields.hausnummer} format="text" />
        <RecordField label={fieldLabel('kinder', 'plz')} value={record.fields.plz} format="text" />
        <RecordField label={fieldLabel('kinder', 'ort')} value={record.fields.ort} format="text" />
        <RecordField label={fieldLabel('kinder', 'besonderheiten')} value={record.fields.besonderheiten} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('kinder', 'geschwisterkind')} value={record.fields.geschwisterkind} format="bool" />
      </RecordSection>

      <SatelliteSection
        title={appLabel('anfragen')}
        items={anfragenList.filter(r => extractRecordId(r.fields.kind) === record.record_id)}
        map={r => ({ name: r.fields.eltern_vorname ?? appLabel('anfragen'), meta: r.fields.gewuenschter_start })}
        onOpen={onOpenAnfragen}
        onAdd={onAddAnfragen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.KINDER} recordId={record.record_id} />
    </>
  );
}
