/**
 * Anfrage entscheiden — 4-Schritt-Wizard.
 * Steps: 1) Anfrage wählen (nur 'eingegangen' | 'in_pruefung') →
 *         2) Entscheidung (status: zugesagt|warteliste|abgelehnt, wartelistenplatz, ablehnungsgrund, entscheidung_am) →
 *         3) Prüfen & bestätigen →
 *         4) Fertig.
 * Reads: anfragen (gefiltert nach status).
 * Writes: anfragen (UPDATE der gewählten Anfrage, updateAnfragenEntry).
 * Composes: IntentWizardShell, WizardStep, EntitySelectStep, ChoiceGroup, Field, Bound,
 *           StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { ChoiceGroup } from '@/components/blocks/ChoiceGroup';
import { Field } from '@/components/blocks/Field';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { StatusBadge } from '@/components/blocks/StatusBadge';
import {
  useRecordSearch,
  useStepForm,
  useJourneySubmit,
  fieldText,
  fieldLookup,
  fieldDate,
  todayIso,
  optionsOf,
} from '@/lib/journey';
import { servicePort } from '@/services/journeyPort';
import { tx } from '@/i18n';
import { formatDate } from '@/lib/formatters';

const ENTSCHEIDUNG_KEYS = ['zugesagt', 'warteliste', 'abgelehnt'];

export default function AnfrageEntscheidenPage() {
  const [step, setStep] = useState(1);
  const [anfrageId, setAnfrageId] = useState<string | null>(null);

  // Anfragen-Suche — nur offene / in Prüfung
  const anfragen = useRecordSearch(servicePort, 'anfragen', {
    searchFields: ['eltern_nachname', 'eltern_vorname', 'anfragenummer'],
    filter: "r.v_status in ['eingegangen', 'in_pruefung']",
    where: r => {
      const key = fieldLookup(r, 'status')?.key;
      return key === 'eingegangen' || key === 'in_pruefung';
    },
    orderby: ['r.v_eingegangen_am asc'],
    toItem: (a, ctx) => {
      const kindName = ctx.ref('kind') ?? tx('Unbekanntes Kind');
      const einrichtungName = ctx.ref('einrichtung') ?? tx('Unbekannte Einrichtung');
      const start = fieldDate(a, 'gewuenschter_start');
      const statusVal = fieldLookup(a, 'status');
      return {
        id: a.id,
        title: `${fieldText(a, 'eltern_vorname')} ${fieldText(a, 'eltern_nachname')}`.trim() || tx('Ohne Name'),
        subtitle: kindName + ' · ' + einrichtungName + (start ? ' · ' + formatDate(start) : ''),
        status: statusVal ? { key: statusVal.key, label: statusVal.label } : undefined,
      };
    },
  });

  // Entscheidungsformular — nur die Entscheidungsfelder
  const entscheidung = useStepForm('anfragen', {
    steps: {
      status: 2,
      wartelistenplatz: 2,
      ablehnungsgrund: 2,
      entscheidung_am: 2,
    },
    required: {
      // ablehnungsgrund ist kein Pflichtfeld des Formulars — wir prüfen bedingt
      ablehnungsgrund: false,
      // wartelistenplatz ist optional
      wartelistenplatz: false,
    },
    initial: {
      entscheidung_am: todayIso(),
    },
  });

  const statusKey = (entscheidung.get('status') as string | null) ?? null;
  const istWarteliste = statusKey === 'warteliste';
  const istAbgelehnt = statusKey === 'abgelehnt';

  // Nur die 3 Entscheidungsoptionen aus dem Schema
  const allStatusOptions = optionsOf('anfragen', 'status');
  const entscheidungsOptionen = allStatusOptions.filter(o => ENTSCHEIDUNG_KEYS.includes(o.key));

  // Anfrage-Datensatz für Übersicht in der Zusammenfassung
  const anfrageRecord = anfrageId ? anfragen.recordOf(anfrageId) : undefined;
  const anfragenummer = anfrageRecord ? fieldText(anfrageRecord, 'anfragenummer') : '';

  // Plan: UPDATE der gewählten Anfrage
  const submit = useJourneySubmit(
    servicePort,
    [
      {
        key: 'entscheidung',
        entity: 'anfragen',
        form: entscheidung,
        updates: anfrageId ?? undefined,
        primary: true,
        verb: 'update',
        values: () => {
          const vals: Record<string, unknown> = {};
          // ablehnungsgrund nur mitsenden wenn abgelehnt
          if (statusKey !== 'abgelehnt') {
            vals.ablehnungsgrund = undefined;
          }
          // wartelistenplatz nur mitsenden wenn warteliste
          if (statusKey !== 'warteliste') {
            vals.wartelistenplatz = undefined;
          }
          return vals;
        },
      },
    ],
    { draftKey: 'anfrage-entscheiden' }
  );

  const restart = () => {
    submit.reset();
    entscheidung.reset({ entscheidung_am: todayIso() });
    setAnfrageId(null);
    setStep(1);
  };

  // Zusätzliche Summary-Items für die Anfragenübersicht aus Schritt 1
  const summaryItems = anfrageRecord
    ? [
        {
          key: '_anfrage_name',
          label: tx('Antragsteller'),
          value:
            `${fieldText(anfrageRecord, 'eltern_vorname')} ${fieldText(anfrageRecord, 'eltern_nachname')}`.trim(),
          step: 1,
          keys: ['_anfrageId'],
        },
        ...(anfragenummer
          ? [{ key: '_anfragenummer', label: tx('Anfragenummer'), value: anfragenummer, step: 1, keys: ['_anfrageId'] }]
          : []),
      ]
    : [];

  return (
    <IntentWizardShell
      title={tx('Anfrage entscheiden')}
      subtitle={tx('Zusage, Warteliste oder Ablehnung für eine offene Anfrage festhalten.')}
      currentStep={step}
      onStepChange={setStep}
      forms={[entscheidung]}
      draftKey="anfrage-entscheiden"
      intro={{
        description: tx('Eine offene Anfrage prüfen und eine verbindliche Entscheidung treffen.'),
        needs: [tx('Anfragenummer oder Name des Elternteils')],
      }}
    >
      {/* Schritt 1: Anfrage wählen */}
      <WizardStep
        label={tx('Anfrage wählen')}
        description={tx('Nur Anfragen mit Status „Eingegangen" oder „In Prüfung" werden angezeigt.')}
      >
        <EntitySelectStep
          {...anfragen.select}
          selectedId={anfrageId}
          emptyText={tx('Keine offenen Anfragen gefunden. Alle Anfragen wurden bereits bearbeitet.')}
          searchPlaceholder={tx('Name oder Anfragenummer suchen …')}
          avatar="initials"
          onSelect={id => {
            setAnfrageId(id);
            setStep(2);
          }}
        />
      </WizardStep>

      {/* Schritt 2: Entscheidung */}
      <WizardStep
        label={tx('Entscheidung')}
        description={tx('Status der Anfrage festlegen und — falls nötig — einen Ablehnungsgrund angeben.')}
        needs={['_anfrageId']}
      >
        <div className="space-y-5">
          {/* Vollständige Informationsbox über die gewählte Anfrage */}
          {anfrageRecord && (
            <div className="rounded-xl border bg-secondary/40 p-4 text-sm space-y-4">
              {/* Abschnitt: Kind */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{tx('Kind')}</p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <dt className="text-muted-foreground">{tx('Name')}</dt>
                  <dd className="font-medium text-foreground">{anfragen.refLabel(anfrageRecord, 'kind') ?? tx('—')}</dd>
                </dl>
              </div>
              <div className="border-t" />
              {/* Abschnitt: Eltern */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{tx('Eltern')}</p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <dt className="text-muted-foreground">{tx('Name')}</dt>
                  <dd className="font-medium text-foreground">
                    {`${fieldText(anfrageRecord, 'eltern_vorname')} ${fieldText(anfrageRecord, 'eltern_nachname')}`.trim() || tx('—')}
                  </dd>
                  <dt className="text-muted-foreground">{tx('E-Mail')}</dt>
                  <dd className="text-foreground">{fieldText(anfrageRecord, 'eltern_email') || tx('—')}</dd>
                  {fieldText(anfrageRecord, 'eltern_telefon') && (
                    <>
                      <dt className="text-muted-foreground">{tx('Telefon')}</dt>
                      <dd className="text-foreground">{fieldText(anfrageRecord, 'eltern_telefon')}</dd>
                    </>
                  )}
                </dl>
              </div>
              <div className="border-t" />
              {/* Abschnitt: Anfrage-Details */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{tx('Anfrage-Details')}</p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <dt className="text-muted-foreground">{tx('Gewünschte Einrichtung')}</dt>
                  <dd className="font-medium text-foreground">{anfragen.refLabel(anfrageRecord, 'einrichtung') ?? tx('—')}</dd>
                  {anfragen.refLabel(anfrageRecord, 'zweitwunsch_einrichtung') && (
                    <>
                      <dt className="text-muted-foreground">{tx('Zweitwunsch')}</dt>
                      <dd className="text-foreground">{anfragen.refLabel(anfrageRecord, 'zweitwunsch_einrichtung')}</dd>
                    </>
                  )}
                  <dt className="text-muted-foreground">{tx('Betreuungsform')}</dt>
                  <dd className="text-foreground">{fieldLookup(anfrageRecord, 'betreuungsform')?.label ?? tx('—')}</dd>
                  <dt className="text-muted-foreground">{tx('Betreuungsumfang')}</dt>
                  <dd className="text-foreground">{fieldLookup(anfrageRecord, 'betreuungsumfang')?.label ?? tx('—')}</dd>
                  <dt className="text-muted-foreground">{tx('Gewünschter Start')}</dt>
                  <dd className="text-foreground">{fieldDate(anfrageRecord, 'gewuenschter_start') ? formatDate(fieldDate(anfrageRecord, 'gewuenschter_start')!) : tx('—')}</dd>
                  <dt className="text-muted-foreground">{tx('Berufstätig')}</dt>
                  <dd className="text-foreground">{anfrageRecord.fields.berufstaetig ? tx('Ja') : tx('Nein')}</dd>
                  <dt className="text-muted-foreground">{tx('Bisheriger Status')}</dt>
                  <dd className="text-foreground">
                    <StatusBadge
                      statusKey={fieldLookup(anfrageRecord, 'status')?.key}
                      label={fieldLookup(anfrageRecord, 'status')?.label}
                    />
                  </dd>
                  <dt className="text-muted-foreground">{tx('Eingegangen am')}</dt>
                  <dd className="text-foreground">{fieldDate(anfrageRecord, 'eingegangen_am') ? formatDate(fieldDate(anfrageRecord, 'eingegangen_am')!) : tx('—')}</dd>
                  {fieldText(anfrageRecord, 'interne_notizen') && (
                    <>
                      <dt className="text-muted-foreground">{tx('Interne Notizen')}</dt>
                      <dd className="text-foreground whitespace-pre-line col-span-2 mt-1 border-t pt-2">{fieldText(anfrageRecord, 'interne_notizen')}</dd>
                    </>
                  )}
                </dl>
              </div>
            </div>
          )}

          {/* Status-Entscheidung: nur 3 Optionen */}
          <Field form={entscheidung} name="status" label={tx('Entscheidung')}>
            <ChoiceGroup
              {...entscheidung.choice('status')}
              options={entscheidungsOptionen}
            />
          </Field>

          {/* Wartelistenplatz — nur bei 'warteliste' */}
          {istWarteliste && (
            <Bound form={entscheidung} name="wartelistenplatz" hint={tx('Platz auf der Warteliste')} />
          )}

          {/* Ablehnungsgrund — nur bei 'abgelehnt' */}
          {istAbgelehnt && (
            <Bound
              form={entscheidung}
              name="ablehnungsgrund"
              rows={4}
              hint={tx('Wird intern gespeichert und kann für Rückmeldungen genutzt werden.')}
            />
          )}

          {/* Entscheidungsdatum */}
          <Bound form={entscheidung} name="entscheidung_am" />

          <StepNav
            onNext={() => {
              const fieldsToValidate: string[] = ['status', 'entscheidung_am'];
              if (istAbgelehnt) {
                // Ablehnungsgrund ist bei 'abgelehnt' Pflicht — bedingte Prüfung
                const grund = (entscheidung.get('ablehnungsgrund') as string | undefined) ?? '';
                if (!grund.trim()) {
                  return tx('Bitte einen Ablehnungsgrund angeben.');
                }
              }
              return entscheidung.validate(fieldsToValidate);
            }}
            nextStepLabel={tx('Prüfen')}
          />
        </div>
      </WizardStep>

      {/* Schritt 3: Prüfen */}
      <WizardStep label={tx('Prüfen')}>
        {!submit.done && (
          <SummaryStep
            forms={[entscheidung]}
            submit={submit}
            items={summaryItems}
            whatHappensNext={tx(
              'Die Anfrage wird sofort aktualisiert. Eltern können anschließend per E-Mail benachrichtigt werden.'
            )}
            confirmLabel={tx('Entscheidung speichern')}
          />
        )}
      </WizardStep>

      {/* Schritt 4: Fertig */}
      {submit.result && (
        <SuccessStep
          result={submit.result}
          forms={[entscheidung]}
          verb="updated"
          title={tx('Entscheidung gespeichert')}
          whatHappensNext={tx('Die Anfrage wurde aktualisiert. Du kannst nun weitere Anfragen bearbeiten.')}
          actions={{ copy: false, print: false }}
          next={[
            { label: tx('Weitere Anfrage entscheiden'), onClick: restart },
            { label: tx('Kontingent anlegen'), href: '#/intents/kontingent-anlegen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}
