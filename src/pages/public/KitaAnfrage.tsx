import { useEffect, useMemo, useState } from 'react';
import { PublicShell } from '@/components/PublicShell';
import {
  loadPublicPagesConfig,
  listPublicRecords,
  prepareChallenge,
  type PublicPagesConfig,
  type PublicPageConfig,
} from '@/lib/publicClient';
import { useStepForm, useJourneySubmit } from '@/lib/journey';
import { createPublicPort } from '@/lib/journey/publicPort';
import { IntentWizardShell } from '@/components/blocks/IntentWizardShell';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { Field } from '@/components/blocks/Field';
import { Bound } from '@/components/blocks/Bound';
import { ChoiceGroup } from '@/components/blocks/ChoiceGroup';
import { tx } from '@/i18n';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const SLUG = 'kita-anfrage';

interface EinrichtungItem {
  id: string;
  name: string;
  ort: string;
}

export default function KitaAnfrage() {
  const STEPS = [
  { label: tx('Kind'), key: 'kind', description: tx('Angaben zum Kind, das aufgenommen werden soll') },
  { label: tx('Einrichtung'), key: 'einrichtung', description: tx('Gewünschte Einrichtung und Betreuungswünsche') },
  { label: tx('Elternteil'), key: 'eltern', description: tx('Ihre Kontaktdaten für Rückmeldungen') },
  { label: tx('Prüfen'), key: 'pruefen' },
];

  const [cfg, setCfg] = useState<PublicPagesConfig | null>(null);
  const [page, setPage] = useState<PublicPageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [einrichtungen, setEinrichtungen] = useState<EinrichtungItem[]>([]);
  const [loadingEin, setLoadingEin] = useState(false);

  useEffect(() => {
    loadPublicPagesConfig(SLUG).then(c => {
      setCfg(c);
      setPage(c?.pages[SLUG] ?? null);
      setLoading(false);
    });
  }, []);

  const port = useMemo(() => (cfg && page ? createPublicPort(cfg, page) : null), [cfg, page]);

  // Load Einrichtungen list once port is ready
  useEffect(() => {
    if (!cfg || !page) return;
    const ep = page.endpoints?.find(e => e.entity === 'einrichtungen' && e.op === 'list');
    if (!ep?.app_id) return;
    setLoadingEin(true);
    listPublicRecords(cfg, page, { appId: ep.app_id, limit: 200 }).then(res => {
      setEinrichtungen(
        Object.values(res).map(r => ({
          id: r.id,
          name: (r.fields.name as string) ?? '',
          ort: (r.fields.ort as string) ?? '',
        }))
      );
    }).finally(() => setLoadingEin(false));
  }, [cfg, page]);

  // Step 1: Kind-Daten
  const kind = useStepForm('kinder', {
    fields: [
      'vorname', 'nachname', 'geburtsdatum', 'geschlecht',
      'strasse', 'hausnummer', 'plz', 'ort',
      'besonderheiten', 'geschwisterkind',
    ],
    required: {
      vorname: true, nachname: true, geburtsdatum: true,
      strasse: true, hausnummer: true, plz: true, ort: true,
    },
    steps: {
      vorname: 1, nachname: 1, geburtsdatum: 1, geschlecht: 1,
      strasse: 1, hausnummer: 1, plz: 1, ort: 1,
      besonderheiten: 1, geschwisterkind: 1,
    },
    autoComplete: true,
  });

  // Step 2 + 3: Anfrage-Daten (Einrichtung + Eltern)
  const anfrage = useStepForm('anfragen', {
    fields: [
      'einrichtung', 'zweitwunsch_einrichtung',
      'betreuungsform', 'betreuungsumfang', 'gewuenschter_start',
      'eltern_vorname', 'eltern_nachname', 'eltern_email', 'eltern_telefon',
      'berufstaetig',
    ],
    required: {
      einrichtung: true, betreuungsform: true,
      betreuungsumfang: true, gewuenschter_start: true,
      eltern_vorname: true, eltern_nachname: true, eltern_email: true,
    },
    steps: {
      einrichtung: 2, zweitwunsch_einrichtung: 2,
      betreuungsform: 2, betreuungsumfang: 2, gewuenschter_start: 2,
      eltern_vorname: 3, eltern_nachname: 3,
      eltern_email: 3, eltern_telefon: 3, berufstaetig: 3,
    },
    autoComplete: true,
  });

  const submit = useJourneySubmit(
    port!,
    [
      { key: 'kind', entity: 'kinder', form: kind },
      {
        key: 'anfrage',
        entity: 'anfragen',
        form: anfrage,
        primary: true,
        needs: ['kind'],
        link: { kind: 'kind' },
      },
    ],
    { draftKey: 'kita-anfrage' }
  );

  const kindEpAppId = page?.endpoints?.find(e => e.entity === 'kinder' && e.op === 'create')?.app_id;

  const handlePrepare = () => {
    if (!cfg || !page || !kindEpAppId) return;
    prepareChallenge(cfg, page, 'POST', `/apps/${kindEpAppId}/records`);
  };

  if (loading || (!loading && !cfg)) {
    return <PublicShell loading={loading} unavailable={!loading} />;
  }
  if (!page) {
    return <PublicShell unavailable />;
  }

  const einrichtungOptions = einrichtungen.map(e => ({
    key: e.id,
    label: e.name + (e.ort ? ` (${e.ort})` : ''),
  }));

  const selectedEinrichtungId = anfrage.get('einrichtung') as string | null;
  const selectedZweitwunschId = anfrage.get('zweitwunsch_einrichtung') as string | null;

  const restart = () => {
    kind.reset();
    anfrage.reset();
    submit.reset();
    setStep(1);
  };

  return (
    <PublicShell title={tx('Kita-Aufnahmeanfrage stellen')} description={tx('Stellen Sie eine Anfrage zur Aufnahme Ihres Kindes in eine Kindertageseinrichtung.')}>
      <IntentWizardShell
        steps={STEPS}
        currentStep={step}
        onStepChange={setStep}
        back={false}
        forms={[kind, anfrage]}
        draftKey="kita-anfrage"
      >
        {/* Schritt 1: Kind-Daten */}
        {step === 1 && !submit.done && (
          <div className="space-y-5" onFocus={handlePrepare}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field form={kind} name="vorname">
                <Input {...kind.field('vorname')} placeholder={tx('z. B. Lena')} />
              </Field>
              <Field form={kind} name="nachname">
                <Input {...kind.field('nachname')} placeholder={tx('z. B. Müller')} />
              </Field>
            </div>

            <Bound form={kind} name="geburtsdatum" />

            <Field form={kind} name="geschlecht">
              <ChoiceGroup
                {...kind.choice('geschlecht')}
                allowClear
                options={[
                  { key: 'weiblich', label: tx('Weiblich') },
                  { key: 'maennlich', label: tx('Männlich') },
                  { key: 'divers', label: tx('Divers') },
                ]}
              />
            </Field>

            <fieldset className="space-y-4">
              <legend className="text-sm font-medium text-foreground mb-2">{tx('Adresse des Kindes')}</legend>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Field form={kind} name="strasse">
                    <Input {...kind.field('strasse')} placeholder={tx('Musterstraße')} />
                  </Field>
                </div>
                <Field form={kind} name="hausnummer">
                  <Input {...kind.field('hausnummer')} placeholder={tx('12a')} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field form={kind} name="plz">
                  <Input {...kind.field('plz')} placeholder={tx('12345')} />
                </Field>
                <Field form={kind} name="ort">
                  <Input {...kind.field('ort')} placeholder={tx('Musterstadt')} />
                </Field>
              </div>
            </fieldset>

            <Field form={kind} name="besonderheiten" hint={tx('Allergien, Förderbedarf, Besonderheiten')}>
              <Textarea {...kind.field('besonderheiten')} rows={3} placeholder={tx('Optionale Angaben …')} />
            </Field>

            <Field form={kind} name="geschwisterkind" hideLabel>
              <div className="flex items-start gap-3">
                <Checkbox {...kind.checkbox('geschwisterkind')} />
                <Label htmlFor={kind.checkbox('geschwisterkind').id} className="text-sm leading-snug cursor-pointer">
                  {tx('Ein Geschwisterkind besucht bereits eine Einrichtung')}
                </Label>
              </div>
            </Field>

            <StepNav
              onNext={() => kind.validate(['vorname', 'nachname', 'geburtsdatum', 'strasse', 'hausnummer', 'plz', 'ort'])}
              nextStepLabel={tx('Einrichtung')}
            />
          </div>
        )}

        {/* Schritt 2: Einrichtungswunsch */}
        {step === 2 && !submit.done && (
          <div className="space-y-5">
            <Field form={anfrage} name="einrichtung" label={tx('Gewünschte Einrichtung')}>
              {loadingEin ? (
                <p className="text-sm text-muted-foreground">{tx('Einrichtungen werden geladen …')}</p>
              ) : (
                <ChoiceGroup
                  {...anfrage.choice('einrichtung')}
                  options={einrichtungOptions}
                  onChange={key => {
                    anfrage.set('einrichtung', key ?? null, einrichtungen.find(e => e.id === key)?.name);
                  }}
                />
              )}
            </Field>

            <Field form={anfrage} name="zweitwunsch_einrichtung" label={tx('Zweitwunsch Einrichtung')} hint={tx('Optional — falls die erste Wahl nicht verfügbar ist')}>
              <ChoiceGroup
                {...anfrage.choice('zweitwunsch_einrichtung')}
                allowClear
                options={einrichtungOptions.filter(o => o.key !== selectedEinrichtungId)}
                onChange={key => {
                  anfrage.set('zweitwunsch_einrichtung', key ?? null, einrichtungen.find(e => e.id === key)?.name);
                }}
              />
            </Field>

            <Field form={anfrage} name="betreuungsform">
              <ChoiceGroup
                {...anfrage.choice('betreuungsform')}
                options={[
                  { key: 'krippe', label: tx('Krippe (unter 3 Jahre)') },
                  { key: 'kindergarten', label: tx('Kindergarten (3–6 Jahre)') },
                  { key: 'hort', label: tx('Hort') },
                ]}
              />
            </Field>

            <Field form={anfrage} name="betreuungsumfang">
              <ChoiceGroup
                {...anfrage.choice('betreuungsumfang')}
                options={[
                  { key: 'halbtags', label: tx('Halbtags') },
                  { key: 'ganztags', label: tx('Ganztags') },
                  { key: 'verlaengert', label: tx('Verlängert') },
                ]}
              />
            </Field>

            <Bound form={anfrage} name="gewuenschter_start" label={tx('Gewünschter Betreuungsstart')} />

            <StepNav
              onBack={() => setStep(1)}
              onNext={() => anfrage.validate(['einrichtung', 'betreuungsform', 'betreuungsumfang', 'gewuenschter_start'])}
              nextStepLabel={tx('Ihre Daten')}
            />
          </div>
        )}

        {/* Schritt 3: Elterndaten */}
        {step === 3 && !submit.done && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field form={anfrage} name="eltern_vorname" label={tx('Ihr Vorname')}>
                <Input {...anfrage.field('eltern_vorname')} placeholder={tx('z. B. Maria')} />
              </Field>
              <Field form={anfrage} name="eltern_nachname" label={tx('Ihr Nachname')}>
                <Input {...anfrage.field('eltern_nachname')} placeholder={tx('z. B. Müller')} />
              </Field>
            </div>

            <Field form={anfrage} name="eltern_email" label={tx('Ihre E-Mail-Adresse')} hint={tx('Wir senden Ihnen eine Bestätigung an diese Adresse.')}>
              <Input {...anfrage.field('eltern_email')} type="email" placeholder={tx('name@beispiel.de')} />
            </Field>

            <Field form={anfrage} name="eltern_telefon" label={tx('Ihre Telefonnummer')} hint={tx('Optional — für Rückfragen')}>
              <Input {...anfrage.field('eltern_telefon')} type="tel" placeholder={tx('z. B. 0123 456789')} />
            </Field>

            <Field form={anfrage} name="berufstaetig" hideLabel>
              <div className="flex items-start gap-3">
                <Checkbox {...anfrage.checkbox('berufstaetig')} />
                <Label htmlFor={anfrage.checkbox('berufstaetig').id} className="text-sm leading-snug cursor-pointer">
                  {tx('Beide Elternteile sind berufstätig')}
                </Label>
              </div>
            </Field>

            <StepNav
              onBack={() => setStep(2)}
              onNext={() => anfrage.validate(['eltern_vorname', 'eltern_nachname', 'eltern_email'])}
              nextStepLabel={tx('Prüfen & Absenden')}
            />
          </div>
        )}

        {/* Schritt 4: Zusammenfassung */}
        {step === 4 && !submit.done && (
          <SummaryStep
            forms={[kind, anfrage]}
            submit={submit}
            whatHappensNext={tx('Ihre Anfrage wird geprüft. Sie erhalten eine Bestätigung per E-Mail.')}
            confirmLabel={tx('Anfrage absenden')}
          />
        )}

        {/* Erfolg */}
        {submit.result && (
          <SuccessStep
            result={submit.result}
            forms={[kind, anfrage]}
            title={tx('Anfrage eingegangen!')}
            whatHappensNext={tx('Wir haben Ihre Anfrage erhalten und werden uns per E-Mail bei Ihnen melden.')}
            next={[{ label: tx('Weitere Anfrage stellen'), onClick: restart }]}
            referencePrefix="A"
          />
        )}
      </IntentWizardShell>
    </PublicShell>
  );
}
