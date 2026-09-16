import type { Anfragen, Mitarbeiter, Platzkontingente } from './app';

export type EnrichedMitarbeiter = Mitarbeiter & {
  einrichtungName: string;
};

export type EnrichedPlatzkontingente = Platzkontingente & {
  einrichtungName: string;
};

export type EnrichedAnfragen = Anfragen & {
  kindName: string;
  einrichtungName: string;
  zweitwunsch_einrichtungName: string;
};
