import { useMemo, useState } from 'react';
import type { DashboardData } from '@/hooks/useDashboardData';
import { useEntityCrud } from '@/components/EntityCrud';
import { tx, appLabel } from '@/i18n';
import { gruss, useClock, namen, undoToast } from '@/lib/polish';
import { lookupKey, formatDate } from '@/lib/formatters';
import { lookupOption, LOOKUP_OPTIONS, APP_IDS } from '@/types/app';
import { LivingAppsService, extractRecordId } from '@/services/livingAppsService';
import { DashboardGrid } from '@/components/DashboardGrid';
import { StatStrip, StatStripItem } from '@/components/StatCard';
import { WorkList } from '@/components/WorkList';
import { HeroBanner } from '@/components/HeroBanner';
import { KanbanWidget, type KanbanCard, type KanbanColumn, type KanbanTone } from '@/components/widgets/KanbanWidget';
import {
  IconSchool,
  IconAlertTriangle,
  IconClipboardList,
  IconHourglass,
  IconUserCheck,
  IconUserX,
  IconUsers,
  IconPlus,
} from '@tabler/icons-react';

function toneForStatus(status: string | undefined): KanbanTone {
  if (status === 'zugesagt') return 'success';
  if (status === 'in_pruefung') return 'primary';
  if (status === 'warteliste') return 'warning';
  if (status === 'abgelehnt' || status === 'zurueckgezogen') return 'default';
  return 'warning'; // eingegangen → braucht Aufmerksamkeit
}

export default function DashboardOverview({ data }: { data: DashboardData }) {
  const {
    einrichtungen, anfragen, platzkontingente,
    einrichtungenMap,
    fetchAll,
  } = data;

  const clock = useClock();

  const crud = useEntityCrud(data, {
    footer: (top) => {
      if (top.type === 'anfragen') {
        const status = lookupKey(top.record.fields.status);
        if (status === 'eingegangen') return { label: tx('In Prüfung setzen'), onClick: () => advanceAnfrage(top.record.record_id, 'in_pruefung') };
        if (status === 'in_pruefung') return { label: tx('Zusagen'), onClick: () => advanceAnfrage(top.record.record_id, 'zugesagt') };
        if (status === 'warteliste') return { label: tx('Zusagen'), onClick: () => advanceAnfrage(top.record.record_id, 'zugesagt') };
      }
      return undefined;
    },
  });

  const enrichedAnfragen = crud.enriched.anfragen;
  const enrichedEinrichtungen = crud.enriched.einrichtungen;

  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Kontingente per Einrichtung aggregieren
  const kontingentByEinrichtung = useMemo(() => {
    const map = new Map<string, { gesamt: number; vergeben: number }>();
    // Vergeben = Anfragen mit Status "zugesagt" pro Einrichtung
    const zugesagtByEinrichtung = new Map<string, number>();
    for (const a of anfragen) {
      if (lookupKey(a.fields.status) === 'zugesagt') {
        const eid = extractRecordId(a.fields.einrichtung);
        if (eid) zugesagtByEinrichtung.set(eid, (zugesagtByEinrichtung.get(eid) ?? 0) + 1);
      }
    }
    for (const k of platzkontingente) {
      const eid = extractRecordId(k.fields.einrichtung);
      if (!eid) continue;
      const gesamt = k.fields.plaetze_gesamt ?? 0;
      const vergeben = zugesagtByEinrichtung.get(eid) ?? 0;
      const existing = map.get(eid);
      if (existing) {
        map.set(eid, { gesamt: existing.gesamt + gesamt, vergeben: existing.vergeben + vergeben });
      } else {
        map.set(eid, { gesamt, vergeben });
      }
    }
    return map;
  }, [platzkontingente, anfragen]);

  // KPI-Werte
  const offene = useMemo(
    () => anfragen.filter(a => {
      const s = lookupKey(a.fields.status);
      return s === 'eingegangen' || s === 'in_pruefung';
    }),
    [anfragen]
  );
  const warteliste = useMemo(() => anfragen.filter(a => lookupKey(a.fields.status) === 'warteliste'), [anfragen]);
  const zugesagt = useMemo(() => anfragen.filter(a => lookupKey(a.fields.status) === 'zugesagt'), [anfragen]);
  const abgelehnt = useMemo(() => anfragen.filter(a => lookupKey(a.fields.status) === 'abgelehnt'), [anfragen]);

  // Einrichtungen mit vollen Kontingenten
  const volleEinrichtungen = useMemo(() => {
    return einrichtungen.filter(e => {
      const k = kontingentByEinrichtung.get(e.record_id);
      return k && k.gesamt > 0 && k.vergeben >= k.gesamt;
    });
  }, [einrichtungen, kontingentByEinrichtung]);

  // Neu eingegangene (letzte 7 Tage)
  const neuEingegangen = useMemo(() => {
    const cutoff = new Date(clock);
    cutoff.setDate(cutoff.getDate() - 7);
    return anfragen.filter(a => {
      const s = lookupKey(a.fields.status);
      if (s !== 'eingegangen') return false;
      const d = a.fields.eingegangen_am;
      return d ? new Date(d) >= cutoff : true;
    });
  }, [anfragen, clock]);

  // Status-Advance-Helper
  const advanceAnfrage = async (id: string, newStatus: string) => {
    const snapshot = anfragen.map(a => a);
    data.setAnfragen(prev =>
      prev.map(a =>
        a.record_id === id
          ? { ...a, fields: { ...a.fields, status: lookupOption('anfragen', 'status', newStatus) } }
          : a
      )
    );
    try {
      await LivingAppsService.updateAnfragenEntry(id, { status: newStatus });
      const label = LOOKUP_OPTIONS['anfragen']?.['status']?.find(o => o.key === newStatus)?.label ?? newStatus;
      undoToast(tx`Status auf ${label} gesetzt`, async () => {
        data.setAnfragen(snapshot);
        const old = snapshot.find(a => a.record_id === id);
        if (old) {
          await LivingAppsService.updateAnfragenEntry(id, { status: lookupKey(old.fields.status) ?? 'eingegangen' });
        }
      });
    } catch {
      data.setAnfragen(snapshot);
      fetchAll();
    }
  };

  // Kontext-Zeile
  const kontextZeile = useMemo(() => {
    if (neuEingegangen.length > 0) {
      const names = neuEingegangen.map(a => a.fields.eltern_nachname ?? '').filter(Boolean);
      return namen(names) + (neuEingegangen.length === 1 ? tx` — neue Anfrage eingegangen.` : tx` — neue Anfragen in der letzten Woche.`);
    }
    if (offene.length > 0) return tx`${offene.length} offene Anfragen warten auf Entscheidung.`;
    return tx`Alle Anfragen bearbeitet — gute Arbeit!`;
  }, [neuEingegangen, offene]);

  // Kanban-Spalten (aus Schema)
  const COLUMNS = useMemo<KanbanColumn[]>(
    () => (LOOKUP_OPTIONS['anfragen']?.['status'] ?? []).map(o => ({ key: o.key, label: o.label })),
    []
  );

  // Anfragen → KanbanCards (gefiltert nach Einrichtung wenn Filter aktiv)
  const filteredAnfragen = useMemo(() => {
    if (!statusFilter) return enrichedAnfragen;
    return enrichedAnfragen.filter(a => lookupKey(a.fields.status) === statusFilter);
  }, [enrichedAnfragen, statusFilter]);

  const cards = useMemo<KanbanCard[]>(
    () =>
      enrichedAnfragen.map(a => {
        const status = lookupKey(a.fields.status) ?? COLUMNS[0]?.key ?? '';
        return {
          id: `anfrage:${a.record_id}`,
          column: status,
          title: a.kindName || (a.fields.eltern_vorname + ' ' + a.fields.eltern_nachname).trim() || tx('Unbekannt'),
          subtitle: a.einrichtungName || undefined,
          tone: toneForStatus(status),
          meta: a.fields.gewuenschter_start ? formatDate(a.fields.gewuenschter_start) : undefined,
        };
      }),
    [enrichedAnfragen, COLUMNS]
  );

  const moveCard = async (cardId: string, newColumn: string) => {
    const rid = cardId.split(':')[1];
    if (!rid) return;
    await advanceAnfrage(rid, newColumn);
  };

  // Hero: volle Einrichtungen
  const hasVoll = volleEinrichtungen.length > 0;

  // Aside: Neu eingegangene Anfragen
  const neueAnfragenItems = useMemo(() =>
    neuEingegangen.slice(0, 8).map(a => {
      const status = lookupKey(a.fields.status) ?? 'eingegangen';
      return {
        id: a.record_id,
        title: (a.fields.eltern_vorname ?? '') + ' ' + (a.fields.eltern_nachname ?? ''),
        secondLine: (
          <>
            <span className="text-amber-600 font-medium">{tx('Eingegangen')}</span>
            {a.fields.eingegangen_am && <span className="text-muted-foreground"> · {formatDate(a.fields.eingegangen_am)}</span>}
          </>
        ),
        action: {
          label: tx('Prüfen'),
          onClick: () => advanceAnfrage(a.record_id, 'in_pruefung'),
        },
      };
    }),
    [neuEingegangen]
  );

  // Aside: Wartelisten-Anfragen
  const wartelisteItems = useMemo(() =>
    warteliste.slice(0, 6).map(a => ({
      id: a.record_id,
      title: (a.fields.eltern_vorname ?? '') + ' ' + (a.fields.eltern_nachname ?? ''),
      secondLine: (
        <>
          <span className="text-amber-500 font-medium">{tx('Warteliste')}</span>
          {a.fields.wartelistenplatz && <span className="text-muted-foreground"> {tx('· Platz')} {a.fields.wartelistenplatz}</span>}
        </>
      ),
      action: {
        label: tx('Zusagen'),
        onClick: () => advanceAnfrage(a.record_id, 'zugesagt'),
      },
    })),
    [warteliste]
  );

  return (
    <div className="space-y-6">
      {/* Kopfzeile */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight truncate">{gruss(clock)}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{kontextZeile}</p>
        </div>
        <button
          onClick={() => crud.anfragen.openCreate({ status: 'eingegangen' })}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors shrink-0"
        >
          <IconPlus size={16} className="shrink-0" />
          {tx('Neue Anfrage')}
        </button>
      </div>

      <DashboardGrid
        variant="wide"
        hero={
          hasVoll ? (
            <HeroBanner
              icon={<IconAlertTriangle size={18} />}
              action={{
                label: tx('Einrichtung öffnen'),
                onClick: () => crud.einrichtungen.openDetail(volleEinrichtungen[0]),
              }}
            >
              <b>{namen(volleEinrichtungen.map(e => e.fields.name ?? ''))}</b>{' '}
              {volleEinrichtungen.length === 1 ? tx`ist vollständig belegt — keine freien Plätze.` : tx` sind vollständig belegt — keine freien Plätze.`}
            </HeroBanner>
          ) : undefined
        }
        kpis={
          <StatStrip>
            <StatStripItem
              title={tx('Offen')}
              value={offene.length}
              icon={<IconClipboardList size={16} className="shrink-0" />}
              tone={offene.length > 0 ? 'warning' : 'default'}
            />
            <StatStripItem
              title={tx('Warteliste')}
              value={warteliste.length}
              icon={<IconHourglass size={16} className="shrink-0" />}
              tone={warteliste.length > 10 ? 'warning' : 'default'}
            />
            <StatStripItem
              title={tx('Zugesagt')}
              value={zugesagt.length}
              icon={<IconUserCheck size={16} className="shrink-0" />}
              tone="success"
            />
            <StatStripItem
              title={tx('Abgelehnt')}
              value={abgelehnt.length}
              icon={<IconUserX size={16} className="shrink-0" />}
              tone="default"
            />
            <StatStripItem
              title={appLabel('einrichtungen')}
              value={einrichtungen.length}
              icon={<IconSchool size={16} className="shrink-0" />}
              tone="default"
            />
          </StatStrip>
        }
        primary={
          <KanbanWidget
            cards={cards}
            columns={COLUMNS}
            defaultCollapsed={['abgelehnt', 'zurueckgezogen']}
            onCardClick={card => {
              const rid = card.id.split(':')[1];
              const anfrage = anfragen.find(a => a.record_id === rid);
              if (anfrage) crud.anfragen.openDetail(anfrage);
            }}
            onCardMove={moveCard}
            onAddCard={column => crud.anfragen.openCreate({ status: column })}
          />
        }
        aside={
          <>
            <WorkList
              title={tx('Neu eingegangen (7 Tage)')}
              items={neueAnfragenItems}
              onItemClick={id => {
                const a = anfragen.find(x => x.record_id === id);
                if (a) crud.anfragen.openDetail(a);
              }}
              empty={{
                text: tx('Keine neuen Anfragen in der letzten Woche.'),
                action: { label: tx('Anfrage erfassen'), onClick: () => crud.anfragen.openCreate({ status: 'eingegangen' }) },
              }}
            />
            <WorkList
              title={tx('Auf Warteliste')}
              items={wartelisteItems}
              onItemClick={id => {
                const a = anfragen.find(x => x.record_id === id);
                if (a) crud.anfragen.openDetail(a);
              }}
              empty={{
                text: tx('Keine Anfragen auf der Warteliste.'),
              }}
            />
          </>
        }
      />

      {/* Einrichtungsübersicht */}
      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <IconSchool size={18} className="text-muted-foreground shrink-0" />
            {tx('Einrichtungen & Auslastung')}
          </h2>
          <button
            onClick={() => crud.einrichtungen.openCreate({})}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            <IconPlus size={14} className="shrink-0" />
            {tx('Einrichtung')}
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {einrichtungen.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
              <IconSchool size={40} stroke={1.5} />
              <p className="text-sm">{tx('Noch keine Einrichtungen angelegt.')}</p>
              <button
                onClick={() => crud.einrichtungen.openCreate({})}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {tx('Erste Einrichtung anlegen')}
              </button>
            </div>
          ) : (
            einrichtungen.map(e => {
              const kontingent = kontingentByEinrichtung.get(e.record_id);
              const gesamt = kontingent?.gesamt ?? 0;
              const vergeben = kontingent?.vergeben ?? 0;
              const frei = Math.max(0, gesamt - vergeben);
              const auslastung = gesamt > 0 ? Math.round((vergeben / gesamt) * 100) : 0;
              const offeneHier = anfragen.filter(a => {
                const eid = extractRecordId(a.fields.einrichtung);
                const s = lookupKey(a.fields.status);
                return eid === e.record_id && (s === 'eingegangen' || s === 'in_pruefung');
              }).length;
              const istVoll = gesamt > 0 && frei === 0;

              return (
                <div
                  key={e.record_id}
                  onClick={() => crud.einrichtungen.openDetail(e)}
                  className="group cursor-pointer rounded-xl border bg-background p-4 hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="min-w-0">
                      <div className="font-medium truncate text-sm">{e.fields.name ?? tx('Unbekannte Einrichtung')}</div>
                      <div className="text-xs text-muted-foreground truncate mt-0.5">
                        {e.fields.traegerart?.label} · {e.fields.ort}
                      </div>
                    </div>
                    {istVoll && (
                      <span className="shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
                        {tx('Voll')}
                      </span>
                    )}
                  </div>

                  {/* Betreuungsformen */}
                  {e.fields.betreuungsformen && e.fields.betreuungsformen.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {e.fields.betreuungsformen.map(bf => (
                        <span key={bf.key} className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          {bf.label}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Auslastungsbalken */}
                  {gesamt > 0 ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{tx`${vergeben} von ${gesamt} Plätzen`}</span>
                        <span className={auslastung >= 90 ? 'text-destructive font-medium' : auslastung >= 70 ? 'text-amber-600' : 'text-emerald-600'}>
                          {auslastung}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${auslastung >= 90 ? 'bg-destructive' : auslastung >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(100, auslastung)}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">{tx('Kein Kontingent hinterlegt')}</div>
                  )}

                  {offeneHier > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-600">
                      <IconUsers size={12} className="shrink-0" />
                      <span>{offeneHier === 1 ? tx`${offeneHier} offene Anfrage` : tx`${offeneHier} offene Anfragen`}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {crud.surfaces}
    </div>
  );
}
