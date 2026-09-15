/**
 * Anfrage entscheiden — 3-Schritt-Wizard.
 * Steps: 1) Anfrage wählen (nur offene: eingegangen | in_pruefung | warteliste) →
 *         2) Entscheidung treffen (Status + bedingte Pflichtfelder) →
 *         3) Prüfen & speichern.
 * Reads: anfragen (gefiltert). Writes: anfragen (update: status, entscheidung_am,
 *         wartelistenplatz?, ablehnungsgrund?, interne_notizen).
 * Composes: IntentWizardShell, WizardStep, EntitySelectStep, ChoiceGroup, Bound,
 *            StepNav, SummaryStep, SuccessStep, StatusBadge.
 */
import { useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { ChoiceGroup } from '@/components/blocks/ChoiceGroup';
import { Bound } from '@/components/blocks/Bound';
import { Field } from '@/components/blocks/Field';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { StatusBadge } from '@/components/blocks/StatusBadge';
import {
  useRecordSearch,
  useStepForm,
  useJourneySubmit,
  fieldLookup,
  fieldText,
  fieldDate,
  todayIso,
  optionsOf,
} from '@/lib/journey';
import { servicePort } from '@/services/journeyPort';
import { tx } from '@/i18n';

// Nur entscheidbare Status anzeigen (nicht eingegangen/abgelehnt/zurueckgezogen als Ziel — wir zeigen in_pruefung, warteliste, zugesagt, abgelehnt)
const ZIEL_STATUS_KEYS = ['in_pruefung', 'warteliste', 'zugesagt', 'abgelehnt'];

export default function AnfrageEntscheidenPage() {
  const [step, setStep] = useState(1);

  // Eligible records: nur Anfragen mit status IN [eingegangen, in_pruefung, warteliste]
  const anfragen = useRecordSearch(servicePort, 'anfragen', {
    filter: "r.v_status in ['eingegangen', 'in_pruefung', 'warteliste']",
    where: r => {
      const s = fieldLookup(r, 'status');
      return s === null || ['eingegangen', 'in_pruefung', 'warteliste'].includes(s.key);
    },
    searchFields: ['eltern_nachname', 'eltern_vorname'],
    toItem: (a, ctx) => ({
      id: a.id,
      title: `${fieldText(a, 'eltern_nachname')}, ${fieldText(a, 'eltern_vorname')}`.trim().replace(/^,\s*/, ''),
      subtitle: ctx.ref('kind') ?? tx('Kind unbekannt'),
      status: fieldLookup(a, 'status') ?? undefined,
      stats: [
        { label: tx('Gewünschter Start'), value: fieldDate(a, 'gewuenschter_start') ?? '—' },
      ],
    }),
    orderby: ['r.v_eltern_nachname asc'],
  });

  // Form für den Update-Schritt: status, wartelistenplatz (bedingt), ablehnungsgrund (bedingt), entscheidung_am, interne_notizen
  const entscheidung = useStepForm('anfragen', {
    fields: ['status', 'wartelistenplatz', 'ablehnungsgrund', 'entscheidung_am', 'interne_notizen'],
    steps: {
      status: 2,
      wartelistenplatz: 2,
      ablehnungsgrund: 2,
      entscheidung_am: 2,
      interne_notizen: 2,
    },
    required: {
      // wartelistenplatz und ablehnungsgrund: bedingt required — wird per validate() gesteuert
      wartelistenplatz: false,
      ablehnungsgrund: false,
    },
    initial: {
      entscheidung_am: todayIso(),
    },
  });

  // ID der gewählten Anfrage (State für den Update-Plan)
  const [gewaehltAnfrageId, setGewaehltAnfrageId] = useState<string | null>(null);

  // Plan: Update der Anfrage
  const submit = useJourneySubmit(
    servicePort,
    [
      {
        key: 'anfrage',
        entity: 'anfragen',
        form: entscheidung,
        updates: () => gewaehltAnfrageId ?? '',
        primary: true,
        verb: 'update',
      },
    ],
    { draftKey: 'anfrage-entscheiden' },
  );

  // Aktueller Ziel-Status aus dem Formular
  const statusKey = entscheidung.get('status') as string | null;
  const istWarteliste = statusKey === 'warteliste';
  const istAbgelehnt = statusKey === 'abgelehnt';

  // Ziel-Status-Optionen: gefiltert auf die erlaubten Ziel-Keys
  const alleStatusOptions = optionsOf('anfragen', 'status');
  const zielStatusOptions = alleStatusOptions.filter(o => ZIEL_STATUS_KEYS.includes(o.key));

  const restart = () => {
    submit.reset();
    entscheidung.reset({ entscheidung_am: todayIso() });
    setGewaehltAnfrageId(null);
    setStep(1);
  };

  // Gewählte Anfrage für die Anzeige
  const gewaehltRecord = gewaehltAnfrageId ? anfragen.recordOf(gewaehltAnfrageId) : undefined;
  const kindName = gewaehltRecord ? anfragen.refLabel(gewaehltRecord, 'kind') : undefined;
  const einrichtungName = gewaehltRecord ? anfragen.refLabel(gewaehltRecord, 'einrichtung') : undefined;

  return (
    <IntentWizardShell
      title={tx('Anfrage entscheiden')}
      subtitle={tx('Status einer offenen Anfrage festlegen')}
      currentStep={step}
      onStepChange={setStep}
      forms={[entscheidung]}
      draftKey="anfrage-entscheiden"
      intro={{
        description: tx('Öffne eine offene Anfrage und setze die Entscheidung mit allen Pflichtangaben.'),
        needs: [tx('Name des Elternteils'), tx('Neue Status-Entscheidung')],
      }}
    >
      {/* Schritt 1: Anfrage wählen */}
      <WizardStep
        label={tx('Anfrage wählen')}
        description={tx('Nur offene Anfragen (Eingegangen, In Prüfung, Warteliste) werden angezeigt.')}
      >
        <EntitySelectStep
          {...anfragen.select}
          selectedId={gewaehltAnfrageId}
          avatar="none"
          emptyText={tx('Keine offenen Anfragen gefunden. Neue Anfragen werden über die Plattform erfasst.')}
          searchPlaceholder={tx('Nach Nachname oder Vorname suchen …')}
          onSelect={id => {
            setGewaehltAnfrageId(id);
            setStep(2);
          }}
        />
      </WizardStep>

      {/* Schritt 2: Entscheidung treffen */}
      <WizardStep
        label={tx('Entscheidung')}
        description={tx('Status wählen und alle Pflichtangaben für den gewählten Pfad ausfüllen.')}
        needs={gewaehltAnfrageId ? [] : ['status']}
      >
        {gewaehltAnfrageId ? (
          <div className="space-y-6">
            {/* Kontext der gewählten Anfrage */}
            {gewaehltRecord && (
              <div className="rounded-xl border bg-secondary/40 px-4 py-3 space-y-1 text-sm">
                <div className="font-medium text-foreground">
                  {kindName ?? tx('Kind')}
                </div>
                <div className="text-muted-foreground">
                  {einrichtungName && <span>{einrichtungName} · </span>}
                  {fieldLookup(gewaehltRecord, 'betreuungsform')?.label}
                  {fieldDate(gewaehltRecord, 'gewuenschter_start') && (
                    <span> · {tx('Start')}: {fieldDate(gewaehltRecord, 'gewuenschter_start')}</span>
                  )}
                  {fieldLookup(gewaehltRecord, 'betreuungsumfang') && (
                    <span> · {fieldLookup(gewaehltRecord, 'betreuungsumfang')?.label}</span>
                  )}
                </div>
                <div>
                  <StatusBadge
                    statusKey={fieldLookup(gewaehltRecord, 'status')?.key}
                    label={fieldLookup(gewaehltRecord, 'status')?.label}
                  />
                </div>
              </div>
            )}

            {/* Ziel-Status */}
            <Field form={entscheidung} name="status">
              <ChoiceGroup
                {...entscheidung.choice('status')}
                options={zielStatusOptions}
                required
              />
            </Field>

            {/* Wartelistenplatz — nur wenn warteliste */}
            {istWarteliste && (
              <Bound
                form={entscheidung}
                name="wartelistenplatz"
                hint={tx('Platznummer auf der Warteliste')}
              />
            )}

            {/* Ablehnungsgrund — nur wenn abgelehnt */}
            {istAbgelehnt && (
              <Bound
                form={entscheidung}
                name="ablehnungsgrund"
                rows={4}
                hint={tx('Begründung für die Ablehnung')}
              />
            )}

            {/* Entscheidungsdatum */}
            <Bound
              form={entscheidung}
              name="entscheidung_am"
            />

            {/* Interne Notizen */}
            <Bound
              form={entscheidung}
              name="interne_notizen"
              rows={3}
            />

            <StepNav
              onNext={() => {
                const pflichtFelder: string[] = ['status', 'entscheidung_am'];
                if (istWarteliste) pflichtFelder.push('wartelistenplatz');
                if (istAbgelehnt) pflichtFelder.push('ablehnungsgrund');
                // Wartelistenplatz und Ablehnungsgrund temporär required machen
                if (istWarteliste) {
                  const wpVal = entscheidung.get('wartelistenplatz');
                  if (!wpVal && wpVal !== 0) {
                    return entscheidung.validate(pflichtFelder);
                  }
                }
                if (istAbgelehnt) {
                  const agVal = entscheidung.get('ablehnungsgrund');
                  if (!agVal) {
                    return entscheidung.validate(pflichtFelder);
                  }
                }
                return entscheidung.validate(pflichtFelder);
              }}
              nextStepLabel={tx('Prüfen')}
            />
          </div>
        ) : (
          <StepNav
            onBack={() => setStep(1)}
            nextDisabled
          >
            <p className="text-sm text-muted-foreground">
              {tx('Dieser Schritt braucht eine ausgewählte Anfrage aus Schritt 1.')}
            </p>
          </StepNav>
        )}
      </WizardStep>

      {/* Schritt 3: Zusammenfassung */}
      <WizardStep label={tx('Prüfen')}>
        {!submit.done ? (
          <SummaryStep
            forms={[entscheidung]}
            submit={submit}
            whatHappensNext={tx('Die Anfrage wird sofort aktualisiert und der neue Status ist in der Übersicht sichtbar.')}
            confirmLabel={tx('Entscheidung speichern')}
            items={[
              ...(gewaehltRecord
                ? [
                    {
                      key: '_anfrage',
                      label: tx('Anfrage'),
                      value: `${fieldText(gewaehltRecord, 'eltern_nachname')}, ${fieldText(gewaehltRecord, 'eltern_vorname')}${kindName ? ` (${kindName})` : ''}`,
                      step: 1,
                    },
                  ]
                : []),
            ]}
          />
        ) : null}
      </WizardStep>

      {submit.result && (
        <SuccessStep
          result={submit.result}
          forms={[entscheidung]}
          verb="updated"
          actions={{ copy: false, print: false }}
          whatHappensNext={tx('Der neue Status der Anfrage ist sofort in der Übersicht sichtbar.')}
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
