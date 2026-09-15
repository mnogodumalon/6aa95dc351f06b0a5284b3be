import type { EnrichedAnfragen, EnrichedMitarbeiter, EnrichedPlatzkontingente } from '@/types/enriched';
import type { Anfragen, Einrichtungen, Kinder, Mitarbeiter, Platzkontingente } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface MitarbeiterMaps {
  einrichtungenMap: Map<string, Einrichtungen>;
}

export function enrichMitarbeiter(
  mitarbeiter: Mitarbeiter[],
  maps: MitarbeiterMaps
): EnrichedMitarbeiter[] {
  return mitarbeiter.map(r => ({
    ...r,
    einrichtungName: resolveDisplay(r.fields.einrichtung, maps.einrichtungenMap, 'name'),
  }));
}

interface PlatzkontingenteMaps {
  einrichtungenMap: Map<string, Einrichtungen>;
}

export function enrichPlatzkontingente(
  platzkontingente: Platzkontingente[],
  maps: PlatzkontingenteMaps
): EnrichedPlatzkontingente[] {
  return platzkontingente.map(r => ({
    ...r,
    einrichtungName: resolveDisplay(r.fields.einrichtung, maps.einrichtungenMap, 'name'),
  }));
}

interface AnfragenMaps {
  kinderMap: Map<string, Kinder>;
  einrichtungenMap: Map<string, Einrichtungen>;
}

export function enrichAnfragen(
  anfragen: Anfragen[],
  maps: AnfragenMaps
): EnrichedAnfragen[] {
  return anfragen.map(r => ({
    ...r,
    kindName: resolveDisplay(r.fields.kind, maps.kinderMap, 'vorname', 'nachname'),
    einrichtungName: resolveDisplay(r.fields.einrichtung, maps.einrichtungenMap, 'name'),
    zweitwunsch_einrichtungName: resolveDisplay(r.fields.zweitwunsch_einrichtung, maps.einrichtungenMap, 'name'),
  }));
}
