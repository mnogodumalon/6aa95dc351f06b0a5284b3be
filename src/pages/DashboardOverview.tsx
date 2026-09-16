import { useState } from 'react';
import type { DashboardData } from '@/hooks/useDashboardData';
import { useEntityCrud } from '@/components/EntityCrud';
import { tx, appLabel } from '@/i18n';
import { LOOKUP_OPTIONS, lookupOption } from '@/types/app';
import { lookupKey } from '@/lib/formatters';
import { formatDate } from '@/lib/formatters';
import { useClock, gruss, namen, undoToast } from '@/lib/polish';
import { DashboardGrid } from '@/components/DashboardGrid';
import { StatStrip, StatStripItem } from '@/components/StatCard';
import { WorkList } from '@/components/WorkList';
import { HeroBanner } from '@/components/HeroBanner';
import { KanbanWidget } from '@/components/widgets/KanbanWidget';
import type { KanbanCard } from '@/components/widgets/KanbanWidget';
import { ChartWidget } from '@/components/widgets/ChartWidget';
import { LivingAppsService } from '@/services/livingAppsService';
import {
  IconAlertCircle,
  IconClipboardList,
  IconCircleCheck,
  IconListDetails,
  IconClock,
  IconX,
} from '@tabler/icons-react';
import { format, parseISO, differenceInDays } from 'date-fns';

export default function DashboardOverview({ data }: { data: DashboardData }) {
  const {
    einrichtungen, anfragen, setAnfragen, fetchAll,
  } = data;

  const crud = useEntityCrud(data, {
    footer: (top) => {
      if (top.type !== 'anfragen') return undefined;
      const rec = top.record;
      const currentKey = lookupKey(rec.fields.status);
      const nextMap: Record<string, string> = {
        eingegangen: 'in_pruefung',
        in_pruefung: 'zugesagt',
      };
      const nextKey = currentKey ? nextMap[currentKey] : undefined;
      if (!nextKey) return undefined;
      const nextLabel = lookupOption('anfragen', 'status', nextKey).label;
      return {
        label: tx`→ ${nextLabel}`,
        onClick: () => advanceAnfrage(rec, nextKey),
      };
    },
  });

  const enrichedAnfragen = crud.enriched.anfragen;

  const clock = useClock();
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  // ── Derived state ─────────────────────────────────────────────────────
  const todayKey = format(clock, 'yyyy-MM-dd');

  const offeneAnfragen = anfragen.filter(a => {
    const k = lookupKey(a.fields.status);
    return k === 'eingegangen' || k === 'in_pruefung' || k === 'warteliste';
  });

  const zugesagteAnfragen = anfragen.filter(a => lookupKey(a.fields.status) === 'zugesagt');
  const wartelisteAnfragen = anfragen.filter(a => lookupKey(a.fields.status) === 'warteliste');

  // Anfragen ohne Entscheidung die > 14 Tage warten
  const wartendeAnfragen = enrichedAnfragen.filter(a => {
    const k = lookupKey(a.fields.status);
    if (k !== 'eingegangen' && k !== 'in_pruefung') return false;
    const eingegangen = a.fields.eingegangen_am;
    if (!eingegangen) return true;
    try {
      return differenceInDays(parseISO(todayKey), parseISO(eingegangen)) > 14;
    } catch {
      return false;
    }
  });

  // ── Advance helper ────────────────────────────────────────────────────
  async function advanceAnfrage(rec: (typeof anfragen)[0], newStatus: string) {
    const snapshot = anfragen.map(a => ({ ...a }));
    const newLv = lookupOption('anfragen', 'status', newStatus);
    setAnfragen(prev => prev.map(a =>
      a.record_id === rec.record_id
        ? { ...a, fields: { ...a.fields, status: newLv } }
        : a
    ));
    undoToast(
      tx`Status → ${newLv.label}`,
      async () => {
        setAnfragen(snapshot);
        await LivingAppsService.updateAnfragenEntry(rec.record_id, {
          status: lookupKey(rec.fields.status) ?? 'eingegangen',
        });
      }
    );
    try {
      await LivingAppsService.updateAnfragenEntry(rec.record_id, { status: newStatus });
    } catch {
      setAnfragen(snapshot);
      await fetchAll();
    }
  }

  // ── Kanban ───────────────────────────────────────────────────────────
  const columns = (LOOKUP_OPTIONS['anfragen']?.['status'] ?? []).map(o => ({
    key: o.key,
    label: o.label,
    tone: (o.key === 'zugesagt' ? 'success'
      : o.key === 'abgelehnt' || o.key === 'zurueckgezogen' ? 'destructive'
      : o.key === 'warteliste' ? 'warning'
      : 'default') as 'default' | 'success' | 'warning' | 'destructive',
  }));

  const filteredAnfragen = filterStatus
    ? enrichedAnfragen.filter(a => lookupKey(a.fields.status) === filterStatus)
    : enrichedAnfragen;

  const cards: KanbanCard[] = filteredAnfragen.map(a => ({
    id: `anfrage:${a.record_id}`,
    column: lookupKey(a.fields.status) ?? '',
    title: a.kindName || `${a.fields.eltern_vorname ?? ''} ${a.fields.eltern_nachname ?? ''}`.trim(),
    subtitle: (
      <span className="text-xs text-muted-foreground">
        {a.einrichtungName ? a.einrichtungName : ''}
        {a.fields.betreuungsform?.label ? ` · ${a.fields.betreuungsform.label}` : ''}
        {a.fields.gewuenschter_start ? ` · ${formatDate(a.fields.gewuenschter_start)}` : ''}
      </span>
    ),
    tone: (
      lookupKey(a.fields.status) === 'zugesagt' ? 'success'
      : lookupKey(a.fields.status) === 'abgelehnt' ? 'destructive'
      : 'default'
    ) as 'default' | 'success' | 'destructive',
  }));

  async function handleCardMove(cardId: string, newColumn: string) {
    const id = cardId.split(':')[1];
    const rec = anfragen.find(a => a.record_id === id);
    if (!rec) return;

    const snapshot = anfragen.map(a => ({ ...a }));
    const newLv = lookupOption('anfragen', 'status', newColumn);
    setAnfragen(prev => prev.map(a =>
      a.record_id === id
        ? { ...a, fields: { ...a.fields, status: newLv } }
        : a
    ));
    const oldLabel = lookupKey(rec.fields.status)
      ? lookupOption('anfragen', 'status', lookupKey(rec.fields.status)!).label
      : '—';
    undoToast(
      tx`${newLv.label} (vorher: ${oldLabel})`,
      async () => {
        setAnfragen(snapshot);
        await LivingAppsService.updateAnfragenEntry(id, {
          status: lookupKey(rec.fields.status) ?? 'eingegangen',
        });
      }
    );
    try {
      await LivingAppsService.updateAnfragenEntry(id, { status: newColumn });
    } catch {
      setAnfragen(snapshot);
      await fetchAll();
    }
  }

  // ── Neue Anfragen WorkList ────────────────────────────────────────────
  const neueAnfragen = enrichedAnfragen
    .filter(a => lookupKey(a.fields.status) === 'eingegangen')
    .sort((a, b) => (a.fields.eingegangen_am ?? '').localeCompare(b.fields.eingegangen_am ?? ''));

  // ── Context line ──────────────────────────────────────────────────────
  const einrichtungNames = einrichtungen.map(e => e.fields.name ?? '').filter(Boolean);
  let contextLine = '';
  if (anfragen.length === 0) {
    contextLine = tx('Noch keine Anfragen — richte Einrichtungen ein und teile das öffentliche Formular.');
  } else if (wartendeAnfragen.length > 0) {
    contextLine = tx`${namen(wartendeAnfragen.map(a => (a.kindName || a.fields.eltern_nachname) ?? ''))} wartet auf Entscheidung — bitte prüfen.`;
  } else if (neueAnfragen.length > 0) {
    contextLine = tx`${neueAnfragen.length} neue ${neueAnfragen.length === 1 ? tx('Anfrage') : tx('Anfragen')} eingegangen — ${namen(einrichtungNames)} aktiv.`;
  } else {
    contextLine = tx`${anfragen.length} ${anfragen.length === 1 ? tx('Anfrage') : tx('Anfragen')} insgesamt — ${zugesagteAnfragen.length} zugesagt.`;
  }

  // ── ChartWidget rows ──────────────────────────────────────────────────
  const chartRows = enrichedAnfragen.map(a => ({
    id: `anfrage:${a.record_id}`,
    data: a,
  }));

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{gruss(clock)}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{contextLine}</p>
        </div>
        <button
          className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          onClick={() => crud.anfragen.openCreate({ status: 'eingegangen' })}
        >
          <IconClipboardList size={16} className="shrink-0" />
          {tx('Neue Anfrage')}
        </button>
      </div>

      <DashboardGrid
        variant="wide"
        hero={wartendeAnfragen.length > 0 ? (
          <HeroBanner
            icon={<IconAlertCircle size={18} />}
            action={{
              label: tx('In Prüfung setzen'),
              onClick: () => advanceAnfrage(wartendeAnfragen[0], 'in_pruefung'),
            }}
          >
            <b>{namen(wartendeAnfragen.map(a => (a.kindName || a.fields.eltern_nachname) ?? ''))}</b>
            {wartendeAnfragen.length === 1
              ? tx` wartet seit mehr als 14 Tagen auf eine Entscheidung.`
              : tx` warten seit mehr als 14 Tagen auf eine Entscheidung.`
            }
          </HeroBanner>
        ) : undefined}
        kpis={
          <StatStrip>
            <StatStripItem
              title={tx('Alle Anfragen')}
              value={anfragen.length}
              icon={<IconClipboardList size={16} className="shrink-0" />}
              onClick={() => setFilterStatus(f => f === null ? null : null)}
            />
            <StatStripItem
              title={tx('Offen')}
              value={offeneAnfragen.length}
              icon={<IconClock size={16} className="shrink-0" />}
              tone={offeneAnfragen.length > 0 ? 'warning' : 'default'}
              onClick={() => setFilterStatus(f => f === 'eingegangen' ? null : 'eingegangen')}
              active={filterStatus === 'eingegangen'}
            />
            <StatStripItem
              title={tx('Warteliste')}
              value={wartelisteAnfragen.length}
              icon={<IconListDetails size={16} className="shrink-0" />}
              tone={wartelisteAnfragen.length > 0 ? 'warning' : 'default'}
              onClick={() => setFilterStatus(f => f === 'warteliste' ? null : 'warteliste')}
              active={filterStatus === 'warteliste'}
            />
            <StatStripItem
              title={tx('Zugesagt')}
              value={zugesagteAnfragen.length}
              icon={<IconCircleCheck size={16} className="shrink-0" />}
              tone={zugesagteAnfragen.length > 0 ? 'success' : 'default'}
              onClick={() => setFilterStatus(f => f === 'zugesagt' ? null : 'zugesagt')}
              active={filterStatus === 'zugesagt'}
            />
            {filterStatus && (
              <StatStripItem
                title={tx('Filter zurücksetzen')}
                value=""
                icon={<IconX size={16} className="shrink-0" />}
                onClick={() => setFilterStatus(null)}
              />
            )}
          </StatStrip>
        }
        primary={
          <KanbanWidget
            columns={columns}
            cards={cards}
            defaultCollapsed={['abgelehnt', 'zurueckgezogen']}
            onCardClick={(card) => {
              const id = card.id.split(':')[1];
              const rec = anfragen.find(a => a.record_id === id);
              if (rec) crud.anfragen.openDetail(rec);
            }}
            onCardMove={handleCardMove}
            onAddCard={(column) => crud.anfragen.openCreate({ status: column })}
          />
        }
        aside={
          <>
            <WorkList
              title={tx('Neue Anfragen')}
              items={neueAnfragen.slice(0, 8).map(a => ({
                id: a.record_id,
                title: a.kindName || `${a.fields.eltern_vorname ?? ''} ${a.fields.eltern_nachname ?? ''}`.trim(),
                secondLine: (
                  <>
                    <span className="font-medium text-amber-600">{tx('Eingegangen')}</span>
                    {a.einrichtungName ? <span className="text-muted-foreground"> · {a.einrichtungName}</span> : null}
                    {a.fields.eingegangen_am ? <span className="text-muted-foreground"> · {formatDate(a.fields.eingegangen_am)}</span> : null}
                  </>
                ),
                action: {
                  label: tx('In Prüfung'),
                  onClick: () => advanceAnfrage(a, 'in_pruefung'),
                },
              }))}
              onItemClick={(id) => {
                const rec = anfragen.find(a => a.record_id === id);
                if (rec) crud.anfragen.openDetail(rec);
              }}
              empty={{
                text: tx('Keine neuen Anfragen — alles in Bearbeitung.'),
                action: {
                  label: tx('Anfrage erfassen'),
                  onClick: () => crud.anfragen.openCreate({ status: 'eingegangen' }),
                },
              }}
            />
            <ChartWidget
              title={tx('Anfragen nach Einrichtung')}
              rows={chartRows}
              dimension={{
                kind: 'category',
                accessor: r => r.data.einrichtungName || null,
              }}
            />
          </>
        }
      />

      {crud.surfaces}
    </div>
  );
}
