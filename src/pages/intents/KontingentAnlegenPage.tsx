/**
 * Kontingent anlegen — 3-Schritt-Wizard.
 * Steps: 1) Einrichtung wählen → 2) Kontingentdaten erfassen → 3) Prüfen & anlegen.
 * Reads: einrichtungen. Writes: platzkontingente (createPlatzkontingenteEntry).
 * Composes: IntentWizardShell, WizardStep, EntitySelectStep, Bound, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { useStepForm, useJourneySubmit, useRecordSearch, fieldText, fieldLookup } from '@/lib/journey';
import { servicePort } from '@/services/journeyPort';
import { tx } from '@/i18n';

export default function KontingentAnlegenPage() {
  const [step, setStep] = useState(1);

  const einrichtungen = useRecordSearch(servicePort, 'einrichtungen', {
    searchFields: ['name'],
    toItem: e => ({
      id: e.id,
      title: fieldText(e, 'name'),
      subtitle: fieldLookup(e, 'traegerart')?.label ?? undefined,
    }),
  });

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

  return (
    <IntentWizardShell
      title={tx('Platzkontingent anlegen')}
      currentStep={step}
      onStepChange={setStep}
      forms={[kontingent]}
      draftKey="kontingent-anlegen"
      intro={{
        description: tx('Legt ein neues Platzkontingent für eine Einrichtung, ein Kita-Jahr und eine Betreuungsform an.'),
        needs: [tx('Einrichtung'), tx('Kita-Jahr (z. B. 2026/27)'), tx('Betreuungsform'), tx('Gesamtanzahl der Plätze')],
      }}
    >
      <WizardStep
        label={tx('Einrichtung')}
        description={tx('Einrichtung wählen, für die das Kontingent gilt.')}
      >
        <EntitySelectStep
          {...einrichtungen.select}
          selectedId={kontingent.get('einrichtung') as string | null}
          onSelect={id => {
            kontingent.set('einrichtung', id, einrichtungen.labelOf(id));
            setStep(2);
          }}
          searchPlaceholder={tx('Einrichtung suchen …')}
          avatar="none"
          create={false}
        />
      </WizardStep>

      <WizardStep
        label={tx('Kontingent')}
        description={tx('Kita-Jahr, Betreuungsform und Gesamtzahl der Plätze festlegen.')}
        needs={['einrichtung']}
      >
        <div className="space-y-4">
          <Bound
            form={kontingent}
            name="kita_jahr"
            placeholder={tx('z. B. 2026/27')}
          />
          <Bound
            form={kontingent}
            name="betreuungsform"
          />
          <Bound
            form={kontingent}
            name="plaetze_gesamt"
            hint={tx('Gesamtanzahl der verfügbaren Plätze')}
          />
          <StepNav
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
            whatHappensNext={tx('Das Kontingent steht sofort für die Belegungsplanung zur Verfügung.')}
            confirmLabel={tx('Kontingent anlegen')}
          />
        )}
      </WizardStep>

      {submit.result && (
        <SuccessStep
          result={submit.result}
          forms={[kontingent]}
          submit={submit}
          restartLabel={tx('Weiteres Kontingent anlegen')}
          whatHappensNext={tx('Jetzt können Anfragen diesem Kontingent zugeordnet und entschieden werden.')}
          next={[
            { label: tx('Anfrage entscheiden'), href: '#/intents/anfrage-entscheiden' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}
