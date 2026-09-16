import type { Einrichtungen, Mitarbeiter, Platzkontingente, Anfragen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { MediaThumbnail } from '@/components/widgets/MediaViewer';
import { SatelliteSection } from '@/components/SatelliteSection';

export interface EinrichtungenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Einrichtungen;
  /** 1:N „Mitarbeiter" (einrichtung): VOLLE Liste — der Block filtert auf diesen Record. */
  mitarbeiterList: Mitarbeiter[];
  /** Zeilen-Klick → overlay.push auf das Mitarbeiter-Detail (nie der Edit-Dialog). */
  onOpenMitarbeiter: (record: Mitarbeiter) => void;
  /** Kontextuelles „+": öffnet den Mitarbeiter-Dialog mit diesem Record vorgesetzt. */
  onAddMitarbeiter: () => void;
  /** 1:N „Platzkontingente" (einrichtung): VOLLE Liste — der Block filtert auf diesen Record. */
  platzkontingenteList: Platzkontingente[];
  /** Zeilen-Klick → overlay.push auf das Platzkontingente-Detail (nie der Edit-Dialog). */
  onOpenPlatzkontingente: (record: Platzkontingente) => void;
  /** Kontextuelles „+": öffnet den Platzkontingente-Dialog mit diesem Record vorgesetzt. */
  onAddPlatzkontingente: () => void;
  /** 1:N „Anfragen" (einrichtung): VOLLE Liste — der Block filtert auf diesen Record. */
  anfragenEinrichtungList: Anfragen[];
  /** Zeilen-Klick → overlay.push auf das Anfragen-Detail (nie der Edit-Dialog). */
  onOpenAnfragenEinrichtung: (record: Anfragen) => void;
  /** Kontextuelles „+": öffnet den Anfragen-Dialog mit diesem Record vorgesetzt. */
  onAddAnfragenEinrichtung: () => void;
  /** 1:N „Anfragen" (zweitwunsch_einrichtung): VOLLE Liste — der Block filtert auf diesen Record. */
  anfragenZweitwunschEinrichtungList: Anfragen[];
  /** Zeilen-Klick → overlay.push auf das Anfragen-Detail (nie der Edit-Dialog). */
  onOpenAnfragenZweitwunschEinrichtung: (record: Anfragen) => void;
  /** Kontextuelles „+": öffnet den Anfragen-Dialog mit diesem Record vorgesetzt. */
  onAddAnfragenZweitwunschEinrichtung: () => void;
}

export function EinrichtungenDetails({
  record,
  mitarbeiterList,
  onOpenMitarbeiter,
  onAddMitarbeiter,
  platzkontingenteList,
  onOpenPlatzkontingente,
  onAddPlatzkontingente,
  anfragenEinrichtungList,
  onOpenAnfragenEinrichtung,
  onAddAnfragenEinrichtung,
  anfragenZweitwunschEinrichtungList,
  onOpenAnfragenZweitwunschEinrichtung,
  onAddAnfragenZweitwunschEinrichtung,
}: EinrichtungenDetailsProps) {
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('einrichtungen', 'name')} value={record.fields.name} format="text" />
        <RecordField label={fieldLabel('einrichtungen', 'traegerart')} value={record.fields.traegerart} format="pill" />
        <RecordField label={fieldLabel('einrichtungen', 'beschreibung')} value={record.fields.beschreibung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('einrichtungen', 'foto')} className="md:col-span-2">
          {record.fields.foto ? (
            <MediaThumbnail src={record.fields.foto as string} fit="contain" className="max-h-64 w-full rounded-lg" />
          ) : '—'}
        </RecordField>
        <RecordField label={fieldLabel('einrichtungen', 'strasse')} value={record.fields.strasse} format="text" />
        <RecordField label={fieldLabel('einrichtungen', 'hausnummer')} value={record.fields.hausnummer} format="text" />
        <RecordField label={fieldLabel('einrichtungen', 'plz')} value={record.fields.plz} format="text" />
        <RecordField label={fieldLabel('einrichtungen', 'ort')} value={record.fields.ort} format="text" />
        <RecordField label={fieldLabel('einrichtungen', 'telefon')} value={record.fields.telefon} format="text" />
        <RecordField label={fieldLabel('einrichtungen', 'email')} value={record.fields.email} format="email" />
        <RecordField label={fieldLabel('einrichtungen', 'betreuungsformen')} value={Array.isArray(record.fields.betreuungsformen) ? record.fields.betreuungsformen.map((v: unknown) => (v && typeof v === 'object' && 'label' in v) ? (v as {label: unknown}).label : v).join(', ') : null} format="text" />
        <RecordField label={fieldLabel('einrichtungen', 'oeffnungszeiten')} value={record.fields.oeffnungszeiten} format="longtext" className="md:col-span-2" />
      </RecordSection>

      <SatelliteSection
        title={appLabel('mitarbeiter')}
        items={mitarbeiterList.filter(r => extractRecordId(r.fields.einrichtung) === record.record_id)}
        map={r => ({ name: r.fields.vorname ?? appLabel('mitarbeiter'), meta: undefined })}
        onOpen={onOpenMitarbeiter}
        onAdd={onAddMitarbeiter}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('platzkontingente')}
        items={platzkontingenteList.filter(r => extractRecordId(r.fields.einrichtung) === record.record_id)}
        map={r => ({ name: r.fields.kita_jahr ?? appLabel('platzkontingente'), meta: undefined })}
        onOpen={onOpenPlatzkontingente}
        onAdd={onAddPlatzkontingente}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={`${appLabel('anfragen')} · ${fieldLabel('anfragen', 'einrichtung')}`}
        items={anfragenEinrichtungList.filter(r => extractRecordId(r.fields.einrichtung) === record.record_id)}
        map={r => ({ name: r.fields.eltern_vorname ?? appLabel('anfragen'), meta: r.fields.gewuenschter_start })}
        onOpen={onOpenAnfragenEinrichtung}
        onAdd={onAddAnfragenEinrichtung}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={`${appLabel('anfragen')} · ${fieldLabel('anfragen', 'zweitwunsch_einrichtung')}`}
        items={anfragenZweitwunschEinrichtungList.filter(r => extractRecordId(r.fields.zweitwunsch_einrichtung) === record.record_id)}
        map={r => ({ name: r.fields.eltern_vorname ?? appLabel('anfragen'), meta: r.fields.gewuenschter_start })}
        onOpen={onOpenAnfragenZweitwunschEinrichtung}
        onAdd={onAddAnfragenZweitwunschEinrichtung}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.EINRICHTUNGEN} recordId={record.record_id} />
    </>
  );
}
