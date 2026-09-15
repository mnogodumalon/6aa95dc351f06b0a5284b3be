/**
 * EntityCrud — pre-generated CRUD + overlay plumbing for the dashboard.
 * Compose it; NEVER re-roll dialog state, submit handlers, an overlay stack
 * or a RecordOverlayHost in the page — this file owns all of it.
 *
 * API at a glance:
 *   const data = useDashboardData();
 *   const crud = useEntityCrud(data, {
 *     // optional — the ONE semantic slot on the overlay: the record's next
 *     // workflow step. Return undefined for types without one.
 *     footer: (top) => top.type === 'einrichtungen'
 *       ? { label: …, onClick: () => … }
 *       : undefined,
 *   });
 *
 *   `top.type` is the SAME camelCase key as `crud.<entity>` — one spelling
 *   per entity, everywhere in this API.
 *   …
 *   crud.einrichtungen.openCreate({ …defaults })   // create dialog, prefilled — defaults are
 *                                       // shape-tolerant: bare lookup keys / record ids are fine
 *   crud.einrichtungen.openEdit(record)            // edit dialog (recordId + defaults wired)
 *   crud.einrichtungen.openDetail(record)          // record overlay — pass the RAW record,
 *                                       // enrichment is resolved inside
 *   crud.overlay                         // RecordOverlayStack<OverlayItem> for drills:
 *                                       // push / pop / replace / close
 *   crud.enriched.einrichtungen              // the display-ready array for EVERY entity —
 *                                       // Enriched* where relations exist, the raw array
 *                                       // otherwise. Reuse these; never call enrich*()
 *                                       // in the page, and never guess which entity has
 *                                       // one: they all do.
 *   {crud.surfaces}                      // render ONCE at the end of the page JSX:
 *                                       // all entity dialogs + the overlay host
 *
 * Built in (do NOT re-implement): optimistic update + Rückgängig counter-write
 * on edit, fetchAll-on-error, edit-from-overlay, and per-entity overlay bodies
 * (RecordHeader + <{Entity}Details> with every relation reachable and the
 * contextual "+" prefilled; list-field back-references additionally get a
 * "choose existing" picker that links an EXISTING record — built in, do not
 * re-roll). Drag writes (onEventDrop/onCardMove) stay YOURS:
 * optimistic setter first, PATCH in background, undoToast with counter-write.
 *
 * Overlay content per entity (the host renders these — you never compose
 * Details blocks yourself):
 *   einrichtungen: name, traegerart, beschreibung, foto, strasse, hausnummer, plz, ort, …  ·  ← mitarbeiter (list + contextual +) · ← platzkontingente (list + contextual +) · ← anfragen (list + contextual +) · ← anfragen (list + contextual +)
 *   mitarbeiter: vorname, nachname, rolle, einrichtung, email_ma, telefon_ma  ·  → einrichtungen
 *   platzkontingente: einrichtung, kita_jahr, betreuungsform, plaetze_gesamt  ·  → einrichtungen
 *   kinder: vorname, nachname, geburtsdatum, geschlecht, strasse, hausnummer, plz, ort, …  ·  ← anfragen (list + contextual +)
 *   anfragen: kind, eltern_vorname, eltern_nachname, eltern_email, eltern_telefon, einrichtung, zweitwunsch_einrichtung, betreuungsform, …  ·  → kinder · → einrichtungen
 */
import { useState, useMemo, type ReactNode } from 'react';
import type { Einrichtungen, Mitarbeiter, Platzkontingente, Kinder, Anfragen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, createRecordUrl } from '@/services/livingAppsService';
import { enrichMitarbeiter, enrichPlatzkontingente, enrichAnfragen } from '@/lib/enrich';
import type { EnrichedMitarbeiter, EnrichedPlatzkontingente, EnrichedAnfragen } from '@/types/enriched';
import { useDashboardData } from '@/hooks/useDashboardData';
import {
  useRecordOverlayStack, RecordOverlayHost, RecordHeader,
  type RecordOverlayStack,
} from '@/components/widgets/RecordView';
import { EinrichtungenDialog, type EinrichtungenDialogDefaults } from '@/components/dialogs/EinrichtungenDialog';
import { EinrichtungenDetails } from '@/components/details/EinrichtungenDetails';
import { MitarbeiterDialog, type MitarbeiterDialogDefaults } from '@/components/dialogs/MitarbeiterDialog';
import { MitarbeiterDetails } from '@/components/details/MitarbeiterDetails';
import { PlatzkontingenteDialog, type PlatzkontingenteDialogDefaults } from '@/components/dialogs/PlatzkontingenteDialog';
import { PlatzkontingenteDetails } from '@/components/details/PlatzkontingenteDetails';
import { KinderDialog, type KinderDialogDefaults } from '@/components/dialogs/KinderDialog';
import { KinderDetails } from '@/components/details/KinderDetails';
import { AnfragenDialog, type AnfragenDialogDefaults } from '@/components/dialogs/AnfragenDialog';
import { AnfragenDetails } from '@/components/details/AnfragenDetails';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { t, appLabel } from '@/i18n';
import { undoToast } from '@/lib/polish';
import { formatDate } from '@/lib/formatters';

// The overlay union — one branch per entity, `record` typed the way the data
// flows: Enriched* where enrichment exists, the raw record type otherwise.
// The host resolves enrichment itself; pages pass raw records everywhere.
export type OverlayItem =
  | { type: 'einrichtungen'; record: Einrichtungen }
  | { type: 'mitarbeiter'; record: EnrichedMitarbeiter }
  | { type: 'platzkontingente'; record: EnrichedPlatzkontingente }
  | { type: 'kinder'; record: Kinder }
  | { type: 'anfragen'; record: EnrichedAnfragen };

/** The useDashboardData() return — pass it in, never re-fetch inside. */
export type EntityCrudData = ReturnType<typeof useDashboardData>;

export interface EntityCrudOptions {
  /** Per-type overlay footer — the record's next workflow step. */
  footer?: (top: OverlayItem) => ReactNode | { label: ReactNode; onClick: () => void } | undefined;
  placement?: 'side' | 'center';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface EntityCrudApi<TRecord, TDefaults> {
  /** Open the create dialog, optionally prefilled (shape-tolerant defaults). */
  openCreate: (defaults?: TDefaults) => void;
  /** Open the edit dialog for a record (recordId + defaults are wired). */
  openEdit: (record: TRecord) => void;
  /** Open the record overlay (raw record is fine — enrichment resolved inside). */
  openDetail: (record: TRecord) => void;
}

export interface EntityCrud {
  /** The overlay stack for drills: push / pop / replace / close. */
  overlay: RecordOverlayStack<OverlayItem>;
  /** Render ONCE at the end of the page JSX — all dialogs + the overlay host. */
  surfaces: ReactNode;
  einrichtungen: EntityCrudApi<Einrichtungen, EinrichtungenDialogDefaults>;
  mitarbeiter: EntityCrudApi<Mitarbeiter, MitarbeiterDialogDefaults>;
  platzkontingente: EntityCrudApi<Platzkontingente, PlatzkontingenteDialogDefaults>;
  kinder: EntityCrudApi<Kinder, KinderDialogDefaults>;
  anfragen: EntityCrudApi<Anfragen, AnfragenDialogDefaults>;
  /** The display-ready array per entity: Enriched* where an enrich function
   *  exists, the raw array otherwise. One key per entity so no page has to
   *  know which is which. Reuse these; never re-enrich in the page. */
  enriched: { einrichtungen: Einrichtungen[]; mitarbeiter: EnrichedMitarbeiter[]; platzkontingente: EnrichedPlatzkontingente[]; kinder: Kinder[]; anfragen: EnrichedAnfragen[] };
}

export function useEntityCrud(data: EntityCrudData, options?: EntityCrudOptions): EntityCrud {
  const overlay = useRecordOverlayStack<OverlayItem>();
  const [einrichtungenDialog, setEinrichtungenDialog] = useState<{ defaults?: EinrichtungenDialogDefaults; editing?: Einrichtungen } | null>(null);
  const [mitarbeiterDialog, setMitarbeiterDialog] = useState<{ defaults?: MitarbeiterDialogDefaults; editing?: Mitarbeiter } | null>(null);
  const [platzkontingenteDialog, setPlatzkontingenteDialog] = useState<{ defaults?: PlatzkontingenteDialogDefaults; editing?: Platzkontingente } | null>(null);
  const [kinderDialog, setKinderDialog] = useState<{ defaults?: KinderDialogDefaults; editing?: Kinder } | null>(null);
  const [anfragenDialog, setAnfragenDialog] = useState<{ defaults?: AnfragenDialogDefaults; editing?: Anfragen } | null>(null);
  const enrichedMitarbeiter = useMemo(() => enrichMitarbeiter(data.mitarbeiter, { einrichtungenMap: data.einrichtungenMap }), [data.mitarbeiter, data.einrichtungenMap]);
  const enrichedPlatzkontingente = useMemo(() => enrichPlatzkontingente(data.platzkontingente, { einrichtungenMap: data.einrichtungenMap }), [data.platzkontingente, data.einrichtungenMap]);
  const enrichedAnfragen = useMemo(() => enrichAnfragen(data.anfragen, { kinderMap: data.kinderMap, einrichtungenMap: data.einrichtungenMap }), [data.anfragen, data.kinderMap, data.einrichtungenMap]);

  function detailEinrichtungen(record: Einrichtungen, push = false) {
    const item: OverlayItem = { type: 'einrichtungen', record };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitEinrichtungen(fields: Einrichtungen['fields']) {
    const editing = einrichtungenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setEinrichtungen(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateEinrichtungenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('einrichtungen')} — ${t('crud_updated')}`, async () => {
        data.setEinrichtungen(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateEinrichtungenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createEinrichtungenEntry(fields);
      undoToast(`${appLabel('einrichtungen')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailMitarbeiter(record: Mitarbeiter, push = false) {
    const rec = enrichedMitarbeiter.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'mitarbeiter', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitMitarbeiter(fields: Mitarbeiter['fields']) {
    const editing = mitarbeiterDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setMitarbeiter(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateMitarbeiterEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('mitarbeiter')} — ${t('crud_updated')}`, async () => {
        data.setMitarbeiter(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateMitarbeiterEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createMitarbeiterEntry(fields);
      undoToast(`${appLabel('mitarbeiter')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailPlatzkontingente(record: Platzkontingente, push = false) {
    const rec = enrichedPlatzkontingente.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'platzkontingente', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitPlatzkontingente(fields: Platzkontingente['fields']) {
    const editing = platzkontingenteDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setPlatzkontingente(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updatePlatzkontingenteEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('platzkontingente')} — ${t('crud_updated')}`, async () => {
        data.setPlatzkontingente(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updatePlatzkontingenteEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createPlatzkontingenteEntry(fields);
      undoToast(`${appLabel('platzkontingente')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailKinder(record: Kinder, push = false) {
    const item: OverlayItem = { type: 'kinder', record };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitKinder(fields: Kinder['fields']) {
    const editing = kinderDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setKinder(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateKinderEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('kinder')} — ${t('crud_updated')}`, async () => {
        data.setKinder(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateKinderEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createKinderEntry(fields);
      undoToast(`${appLabel('kinder')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailAnfragen(record: Anfragen, push = false) {
    const rec = enrichedAnfragen.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'anfragen', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitAnfragen(fields: Anfragen['fields']) {
    const editing = anfragenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setAnfragen(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateAnfragenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('anfragen')} — ${t('crud_updated')}`, async () => {
        data.setAnfragen(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateAnfragenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createAnfragenEntry(fields);
      undoToast(`${appLabel('anfragen')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  const surfaces = (
    <>
      <EinrichtungenDialog
        open={einrichtungenDialog !== null}
        onClose={() => setEinrichtungenDialog(null)}
        onSubmit={submitEinrichtungen}
        defaultValues={einrichtungenDialog?.defaults}
        recordId={einrichtungenDialog?.editing?.record_id}
        enablePhotoScan={AI_PHOTO_SCAN['Einrichtungen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Einrichtungen']}
      />
      <MitarbeiterDialog
        open={mitarbeiterDialog !== null}
        onClose={() => setMitarbeiterDialog(null)}
        onSubmit={submitMitarbeiter}
        defaultValues={mitarbeiterDialog?.defaults}
        recordId={mitarbeiterDialog?.editing?.record_id}
        einrichtungenList={data.einrichtungen}
        enablePhotoScan={AI_PHOTO_SCAN['Mitarbeiter']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Mitarbeiter']}
      />
      <PlatzkontingenteDialog
        open={platzkontingenteDialog !== null}
        onClose={() => setPlatzkontingenteDialog(null)}
        onSubmit={submitPlatzkontingente}
        defaultValues={platzkontingenteDialog?.defaults}
        recordId={platzkontingenteDialog?.editing?.record_id}
        einrichtungenList={data.einrichtungen}
        enablePhotoScan={AI_PHOTO_SCAN['Platzkontingente']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Platzkontingente']}
      />
      <KinderDialog
        open={kinderDialog !== null}
        onClose={() => setKinderDialog(null)}
        onSubmit={submitKinder}
        defaultValues={kinderDialog?.defaults}
        recordId={kinderDialog?.editing?.record_id}
        enablePhotoScan={AI_PHOTO_SCAN['Kinder']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Kinder']}
      />
      <AnfragenDialog
        open={anfragenDialog !== null}
        onClose={() => setAnfragenDialog(null)}
        onSubmit={submitAnfragen}
        defaultValues={anfragenDialog?.defaults}
        recordId={anfragenDialog?.editing?.record_id}
        kinderList={data.kinder}
        einrichtungenList={data.einrichtungen}
        enablePhotoScan={AI_PHOTO_SCAN['Anfragen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Anfragen']}
      />
      <RecordOverlayHost
        overlay={overlay}
        placement={options?.placement}
        size={options?.size}
        footer={options?.footer}
        render={(top) => {
          if (top.type === 'einrichtungen') {
            return (
              <>
                <RecordHeader title={top.record.fields.name ?? appLabel('einrichtungen')} subtitle={undefined} />
                <EinrichtungenDetails
                  record={top.record}
                  mitarbeiterList={data.mitarbeiter}
                  onOpenMitarbeiter={(r) => detailMitarbeiter(r, true)}
                  onAddMitarbeiter={() => setMitarbeiterDialog({ defaults: { einrichtung: createRecordUrl(APP_IDS.EINRICHTUNGEN, top.record.record_id) } })}
                  platzkontingenteList={data.platzkontingente}
                  onOpenPlatzkontingente={(r) => detailPlatzkontingente(r, true)}
                  onAddPlatzkontingente={() => setPlatzkontingenteDialog({ defaults: { einrichtung: createRecordUrl(APP_IDS.EINRICHTUNGEN, top.record.record_id) } })}
                  anfragenEinrichtungList={data.anfragen}
                  onOpenAnfragenEinrichtung={(r) => detailAnfragen(r, true)}
                  onAddAnfragenEinrichtung={() => setAnfragenDialog({ defaults: { einrichtung: createRecordUrl(APP_IDS.EINRICHTUNGEN, top.record.record_id) } })}
                  anfragenZweitwunschEinrichtungList={data.anfragen}
                  onOpenAnfragenZweitwunschEinrichtung={(r) => detailAnfragen(r, true)}
                  onAddAnfragenZweitwunschEinrichtung={() => setAnfragenDialog({ defaults: { zweitwunsch_einrichtung: createRecordUrl(APP_IDS.EINRICHTUNGEN, top.record.record_id) } })}
                />
              </>
            );
          }
          if (top.type === 'mitarbeiter') {
            return (
              <>
                <RecordHeader title={top.record.fields.vorname ?? appLabel('mitarbeiter')} subtitle={undefined} />
                <MitarbeiterDetails
                  record={top.record}
                  einrichtungenList={data.einrichtungen}
                  onOpenEinrichtungen={(r) => detailEinrichtungen(r, true)}
                />
              </>
            );
          }
          if (top.type === 'platzkontingente') {
            return (
              <>
                <RecordHeader title={top.record.fields.kita_jahr ?? appLabel('platzkontingente')} subtitle={undefined} />
                <PlatzkontingenteDetails
                  record={top.record}
                  einrichtungenList={data.einrichtungen}
                  onOpenEinrichtungen={(r) => detailEinrichtungen(r, true)}
                />
              </>
            );
          }
          if (top.type === 'kinder') {
            return (
              <>
                <RecordHeader title={top.record.fields.vorname ?? appLabel('kinder')} subtitle={top.record.fields.geburtsdatum ? formatDate(top.record.fields.geburtsdatum) : undefined} />
                <KinderDetails
                  record={top.record}
                  anfragenList={data.anfragen}
                  onOpenAnfragen={(r) => detailAnfragen(r, true)}
                  onAddAnfragen={() => setAnfragenDialog({ defaults: { kind: createRecordUrl(APP_IDS.KINDER, top.record.record_id) } })}
                />
              </>
            );
          }
          if (top.type === 'anfragen') {
            return (
              <>
                <RecordHeader title={top.record.fields.eltern_vorname ?? appLabel('anfragen')} subtitle={top.record.fields.gewuenschter_start ? formatDate(top.record.fields.gewuenschter_start) : undefined} />
                <AnfragenDetails
                  record={top.record}
                  kinderList={data.kinder}
                  onOpenKinder={(r) => detailKinder(r, true)}
                  einrichtungenList={data.einrichtungen}
                  onOpenEinrichtungen={(r) => detailEinrichtungen(r, true)}
                />
              </>
            );
          }
          return null;
        }}
        onEdit={(top) => {
          overlay.close();
          if (top.type === 'einrichtungen') setEinrichtungenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'mitarbeiter') setMitarbeiterDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'platzkontingente') setPlatzkontingenteDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'kinder') setKinderDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'anfragen') setAnfragenDialog({ editing: top.record, defaults: top.record.fields });
        }}
      />
    </>
  );

  return {
    overlay,
    surfaces,
    einrichtungen: {
      openCreate: (defaults?: EinrichtungenDialogDefaults) => setEinrichtungenDialog({ defaults }),
      openEdit: (record: Einrichtungen) => setEinrichtungenDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: Einrichtungen) => detailEinrichtungen(record, false),
    },
    mitarbeiter: {
      openCreate: (defaults?: MitarbeiterDialogDefaults) => setMitarbeiterDialog({ defaults }),
      openEdit: (record: Mitarbeiter) => setMitarbeiterDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: Mitarbeiter) => detailMitarbeiter(record, false),
    },
    platzkontingente: {
      openCreate: (defaults?: PlatzkontingenteDialogDefaults) => setPlatzkontingenteDialog({ defaults }),
      openEdit: (record: Platzkontingente) => setPlatzkontingenteDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: Platzkontingente) => detailPlatzkontingente(record, false),
    },
    kinder: {
      openCreate: (defaults?: KinderDialogDefaults) => setKinderDialog({ defaults }),
      openEdit: (record: Kinder) => setKinderDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: Kinder) => detailKinder(record, false),
    },
    anfragen: {
      openCreate: (defaults?: AnfragenDialogDefaults) => setAnfragenDialog({ defaults }),
      openEdit: (record: Anfragen) => setAnfragenDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: Anfragen) => detailAnfragen(record, false),
    },
    enriched: { einrichtungen: data.einrichtungen, mitarbeiter: enrichedMitarbeiter, platzkontingente: enrichedPlatzkontingente, kinder: data.kinder, anfragen: enrichedAnfragen },
  };
}
