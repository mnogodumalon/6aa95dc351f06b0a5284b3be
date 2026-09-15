/**
 * Kontingent anlegen — 3-Schritt-Wizard.
 * Steps: 1) Einrichtung wählen → 2) Kita-Jahr & Betreuungsform & Plätze → 3) Prüfen & anlegen.
 * Reads: einrichtungen. Writes: platzkontingente (createPlatzkontingenteEntry).
 * Composes: IntentWizardShell, WizardStep, EntitySelectStep, ChoiceGroup, Bound, StepNav, SummaryStep, SuccessStep.
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
import {
  useStepForm,
  useJourneySubmit,
  useRecordSearch,
  fieldText,
  fieldLookup,
  optionsOf,
} from '@/lib/journey';
import { servicePort } from '@/services/journeyPort';
import { tx } from '@/i18n';

export default function KontingentAnlegenPage() {
  const einrichtungen = useRecordSearch(servicePort, 'einrichtungen', {
    searchFields: ['name'],
    toItem: e => ({
      id: e.id,
      title: fieldText(e, 'name'),
      subtitle: [
        fieldText(e, 'ort'),
        fieldLookup(e, 'traegerart')?.label,
      ].filter(Boolean).join(' · '),
    }),
  });

  const [step, setStep] = useState(1);

  const kontingent = useStepForm('platzkontingente', {
    steps: {
      einrichtung: 1,
      kita_jahr: 2,
      betreuungsform: 2,
      plaetze_gesamt: 2,
    },
  });

  const submit = useJourneySubmit(servicePort, [
    { key: 'kontingent', entity: 'platzkontingente', form: kontingent, primary: true },
  ], { draftKey: 'kontingent-anlegen' });

  // Derive available Betreuungsformen from selected Einrichtung
  const selectedEinrichtungId = kontingent.get('einrichtung') as string | null;
  const selectedEinrichtungRecord = selectedEinrichtungId
    ? einrichtungen.recordOf(selectedEinrichtungId)
    : undefined;

  // All possible betreuungsform options from schema
  const allBetreuungsformOptions = optionsOf('platzkontingente', 'betreuungsform');

  // Betreuungsformen offered by the selected Einrichtung
  const einrichtungBetreuungsformen: string[] = selectedEinrichtungRecord
    ? (() => {
        const val = selectedEinrichtungRecord.fields['betreuungsformen'];
        if (Array.isArray(val)) {
          return (val as Array<{ key: string; label: string }>).map(v => v.key);
        }
        return [];
      })()
    : allBetreuungsformOptions.map(o => o.key);

  const filteredBetreuungsformOptions = allBetreuungsformOptions.filter(o =>
    einrichtungBetreuungsformen.includes(o.key)
  );

  return (
    <IntentWizardShell
      title={tx('Platzkontingent anlegen')}
      currentStep={step}
      onStepChange={setStep}
      forms={[kontingent]}
      draftKey="kontingent-anlegen"
      intro={{
        description: tx('Lege ein neues Platzkontingent für eine Einrichtung und ein Kita-Jahr an.'),
        needs: [tx('Name der Einrichtung'), tx('Kita-Jahr (z. B. 2026/27)'), tx('Betreuungsform und Gesamtplätze')],
      }}
    >
      <WizardStep
        label={tx('Einrichtung')}
        description={tx('Wähle die Einrichtung, für die du das Kontingent anlegst.')}
      >
        <EntitySelectStep
          {...einrichtungen.select}
          selectedId={kontingent.get('einrichtung') as string | null}
          onSelect={id => {
            kontingent.set('einrichtung', id, einrichtungen.labelOf(id));
            // Reset betreuungsform when Einrichtung changes
            kontingent.set('betreuungsform', null as unknown as string);
            setStep(2);
          }}
          avatar="none"
          searchPlaceholder={tx('Einrichtung suchen …')}
          create={false}
          emptyText={tx('Keine Einrichtungen gefunden.')}
        />
      </WizardStep>

      <WizardStep
        label={tx('Kita-Jahr & Plätze')}
        description={tx('Kita-Jahr, Betreuungsform und Gesamtanzahl der Plätze eintragen.')}
        needs={['einrichtung']}
      >
        <div className="space-y-6">
          <Bound
            form={kontingent}
            name="kita_jahr"
            placeholder={tx('z. B. 2026/27')}
            hint={tx('Format frei wählbar, z. B. 2026/27 oder 2026–2027')}
          />

          <Field
            form={kontingent}
            name="betreuungsform"
            hint={
              filteredBetreuungsformOptions.length < allBetreuungsformOptions.length
                ? tx('Nur Betreuungsformen dieser Einrichtung werden angezeigt.')
                : undefined
            }
          >
            <ChoiceGroup
              {...kontingent.choice('betreuungsform')}
              options={filteredBetreuungsformOptions}
            />
          </Field>

          <Bound
            form={kontingent}
            name="plaetze_gesamt"
            hint={tx('Plätze vergeben und Plätze frei werden automatisch aus den Zusagen berechnet — hier nur Gesamtplätze eintragen.')}
          />

          <StepNav
            onBack={() => setStep(1)}
            onNext={() => kontingent.validate(['kita_jahr', 'betreuungsform', 'plaetze_gesamt'])}
            nextStepLabel={tx('Prüfen')}
          />
        </div>
      </WizardStep>

      <WizardStep label={tx('Prüfen')}>
        {!submit.done && (
          <SummaryStep
            forms={[kontingent]}
            submit={submit}
            whatHappensNext={tx('Das Kontingent erscheint sofort in der Platzkontingent-Übersicht der Einrichtung.')}
          />
        )}
      </WizardStep>

      {submit.result && (
        <SuccessStep
          result={submit.result}
          forms={[kontingent]}
          submit={submit}
          restartLabel={tx('Weiteres Kontingent anlegen')}
          next={[
            { label: tx('Anfrage entscheiden'), href: '#/intents/anfrage-entscheiden' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
          whatHappensNext={tx('Die vergebenen und freien Plätze werden automatisch auf Basis der Zusagen berechnet.')}
        />
      )}
    </IntentWizardShell>
  );
}
