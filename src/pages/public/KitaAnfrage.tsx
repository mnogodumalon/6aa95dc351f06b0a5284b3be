import { useEffect, useMemo, useState } from 'react';
import { PublicShell } from '@/components/PublicShell';
import {
  loadPublicPagesConfig, PageUnavailableError,
  type PublicPagesConfig, type PublicPageConfig,
} from '@/lib/publicClient';
import { createPublicPort } from '@/lib/journey/publicPort';
import {
  useStepForm, useJourneySubmit, useRecordSearch,
  type JourneyRecord,
} from '@/lib/journey';
import { IntentWizardShell, type WizardStep } from '@/components/blocks/IntentWizardShell';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { Bound } from '@/components/blocks/Bound';
import { Field } from '@/components/blocks/Field';
import { EntitySelectStep, type SelectItem } from '@/components/blocks/EntitySelectStep';
import { tx } from '@/i18n';

const SLUG = 'kita-anfrage';

function toSelectItem(r: JourneyRecord): SelectItem {
  const name = (r.fields.name as string) ?? '';
  const ort = (r.fields.ort as string) ?? '';
  return { id: r.id, title: name, subtitle: ort };
}

export default function KitaAnfrage() {
  const STEPS: WizardStep[] = [
  {
    label: tx('Kind'),
    key: 'kind',
    heading: tx('Angaben zum Kind'),
    description: tx('Bitte gib die persönlichen Daten deines Kindes ein.'),
  },
  {
    label: tx('Eltern'),
    key: 'eltern',
    heading: tx('Deine Kontaktdaten'),
    description: tx('Wie können wir dich erreichen?'),
  },
  {
    label: tx('Einrichtung'),
    key: 'einrichtung',
    heading: tx('Einrichtungswunsch und Betreuung'),
    description: tx('Welche Einrichtung und welche Betreuungsform wünschst du dir?'),
  },
  {
    label: tx('Prüfen'),
    key: 'zusammenfassung',
    heading: tx('Alles richtig?'),
    description: tx('Bitte prüfe deine Angaben und sende die Anfrage ab.'),
  },
];

  const [cfg, setCfg] = useState<PublicPagesConfig | null>(null);
  const [page, setPage] = useState<PublicPageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);

  // Einrichtungs-search state
  const [einrichtungId, setEinrichtungId] = useState<string | null>(null);
  const [zweitwunschId, setZweitwunschId] = useState<string | null>(null);

  useEffect(() => {
    loadPublicPagesConfig(SLUG).then(c => {
      setCfg(c);
      setPage(c?.pages[SLUG] ?? null);
      setLoading(false);
    }).catch(err => {
      if (err instanceof PageUnavailableError) {
        setLoading(false);
      }
    });
  }, []);

  const port = useMemo(
    () => (cfg && page ? createPublicPort(cfg, page) : null),
    [cfg, page],
  );

  // Schritt 1: Kind-Daten
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

  // Schritt 2+3: Eltern- und Anfrage-Daten
  const anfrage = useStepForm('anfragen', {
    fields: [
      'eltern_vorname', 'eltern_nachname', 'eltern_email', 'eltern_telefon',
      'einrichtung', 'zweitwunsch_einrichtung',
      'betreuungsform', 'gewuenschter_start', 'betreuungsumfang', 'berufstaetig',
    ],
    required: {
      eltern_vorname: true, eltern_nachname: true, eltern_email: true,
      einrichtung: true, betreuungsform: true,
      gewuenschter_start: true, betreuungsumfang: true,
    },
    steps: {
      eltern_vorname: 2, eltern_nachname: 2, eltern_email: 2, eltern_telefon: 2,
      einrichtung: 3, zweitwunsch_einrichtung: 3,
      betreuungsform: 3, gewuenschter_start: 3, betreuungsumfang: 3, berufstaetig: 3,
    },
    autoComplete: true,
  });

  // Einrichtungen-Suche für Erst- und Zweitwunsch
  const einrichtungSearch = useRecordSearch(port!, 'einrichtungen', {
    searchFields: ['name'],
    toItem: toSelectItem,
    orderby: ['r.v_name asc'],
  });

  const submit = useJourneySubmit(
    port!,
    [
      {
        key: 'kind',
        entity: 'kinder',
        form: kind,
        primary: false,
      },
      {
        key: 'anfrage',
        entity: 'anfragen',
        form: anfrage,
        primary: true,
        needs: ['kind'],
        link: { kind: 'kind' },
      },
    ],
    { draftKey: SLUG },
  );

  if (loading || !cfg || !page) {
    return <PublicShell loading={loading} unavailable={!loading && (!cfg || !page)} />;
  }

  // Sync einrichtungId → form
  const handleEinrichtungSelect = (id: string) => {
    setEinrichtungId(id);
    const label = einrichtungSearch.labelOf(id);
    anfrage.set('einrichtung', id, label);
  };

  const handleZweitwunschSelect = (id: string) => {
    const newId = id === zweitwunschId ? null : id;
    setZweitwunschId(newId);
    if (newId) {
      const label = einrichtungSearch.labelOf(newId);
      anfrage.set('zweitwunsch_einrichtung', newId, label);
    } else {
      anfrage.set('zweitwunsch_einrichtung', null, '');
    }
  };

  const restart = () => {
    kind.reset();
    anfrage.reset();
    setEinrichtungId(null);
    setZweitwunschId(null);
    submit.reset();
    setStep(1);
  };

  const currentAnfragenummer =
    submit.result
      ? (submit.result.records['anfrage']?.fields?.anfragenummer as string | undefined)
      : undefined;

  return (
    <PublicShell
      title={tx('Kita-Aufnahmeanfrage stellen')}
      description={tx('Stelle ohne Login eine Anfrage für einen Kita-Platz für dein Kind.')}
    >
      <IntentWizardShell
        steps={STEPS}
        currentStep={step}
        onStepChange={setStep}
        back={false}
        forms={[kind, anfrage]}
        draftKey={SLUG}
      >
        {/* Schritt 1: Kind */}
        {step === 1 && !submit.done && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Bound form={kind} name="vorname" />
              <Bound form={kind} name="nachname" />
            </div>
            <Bound form={kind} name="geburtsdatum" />
            <Bound form={kind} name="geschlecht" allowClear />
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <Bound form={kind} name="strasse" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Bound form={kind} name="hausnummer" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Bound form={kind} name="plz" />
              <Bound form={kind} name="ort" />
            </div>
            <Bound form={kind} name="besonderheiten" rows={3} />
            <Field form={kind} name="geschwisterkind" hideLabel>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  {...kind.checkbox('geschwisterkind')}
                  onChange={e => kind.checkbox('geschwisterkind').onCheckedChange(e.target.checked)}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <span className="text-sm">{tx('Geschwisterkind bereits in einer Einrichtung')}</span>
              </label>
            </Field>
            <StepNav
              onNext={() => kind.validate(['vorname', 'nachname', 'geburtsdatum', 'strasse', 'hausnummer', 'plz', 'ort'])}
              nextStepLabel={tx('Kontaktdaten')}
              hideBack
            />
          </div>
        )}

        {/* Schritt 2: Eltern */}
        {step === 2 && !submit.done && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Bound form={anfrage} name="eltern_vorname" />
              <Bound form={anfrage} name="eltern_nachname" />
            </div>
            <Bound form={anfrage} name="eltern_email" />
            <Bound form={anfrage} name="eltern_telefon" />
            <Field form={anfrage} name="berufstaetig" hideLabel>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  {...anfrage.checkbox('berufstaetig')}
                  onChange={e => anfrage.checkbox('berufstaetig').onCheckedChange(e.target.checked)}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <span className="text-sm">{tx('Beide Elternteile sind berufstätig')}</span>
              </label>
            </Field>
            <StepNav
              onBack={() => setStep(1)}
              onNext={() => anfrage.validate(['eltern_vorname', 'eltern_nachname', 'eltern_email'])}
              nextStepLabel={tx('Einrichtungswunsch')}
            />
          </div>
        )}

        {/* Schritt 3: Einrichtungswunsch & Betreuung */}
        {step === 3 && !submit.done && (
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium mb-2">
                {tx('Gewünschte Einrichtung')}
                <span className="text-destructive ml-1" aria-hidden="true">*</span>
              </p>
              <EntitySelectStep
                {...einrichtungSearch.select}
                id={anfrage.fieldId('einrichtung')}
                invalid={!!anfrage.error('einrichtung')}
                selectedId={einrichtungId}
                onSelect={handleEinrichtungSelect}
                searchPlaceholder={tx('Einrichtung nach Name suchen …')}
                avatar="none"
                columns={1}
              />
            </div>

            <div>
              <p className="text-sm font-medium mb-1">{tx('Zweitwunsch Einrichtung')}</p>
              <p className="text-xs text-muted-foreground mb-2">{tx('Optional — wird berücksichtigt falls der Erstwunsch nicht erfüllt werden kann.')}</p>
              <EntitySelectStep
                {...einrichtungSearch.select}
                id={anfrage.fieldId('zweitwunsch_einrichtung')}
                invalid={false}
                selectedId={zweitwunschId}
                onSelect={handleZweitwunschSelect}
                searchPlaceholder={tx('Einrichtung nach Name suchen …')}
                avatar="none"
                columns={1}
              />
            </div>

            <Bound form={anfrage} name="betreuungsform" />
            <Bound form={anfrage} name="betreuungsumfang" />
            <Bound form={anfrage} name="gewuenschter_start" />

            <StepNav
              onBack={() => setStep(2)}
              onNext={() => {
                if (!einrichtungId) {
                  anfrage.validate(['einrichtung']);
                  return false;
                }
                return anfrage.validate(['einrichtung', 'betreuungsform', 'gewuenschter_start', 'betreuungsumfang']);
              }}
              nextStepLabel={tx('Zusammenfassung')}
            />
          </div>
        )}

        {/* Schritt 4: Zusammenfassung */}
        {step === 4 && !submit.done && (
          <SummaryStep
            forms={[kind, anfrage]}
            submit={submit}
            whatHappensNext={tx('Wir bestätigen deine Anfrage per E-Mail. Das Kita-Team meldet sich dann mit weiteren Informationen.')}
            confirmLabel={tx('Anfrage absenden')}
          />
        )}

        {/* Erfolg */}
        {submit.result && (
          <SuccessStep
            result={submit.result}
            forms={[kind, anfrage]}
            title={tx('Anfrage erfolgreich eingegangen!')}
            whatHappensNext={
              <span>
                {currentAnfragenummer
                  ? tx`Deine Anfragenummer lautet: ${currentAnfragenummer}. Eine Bestätigung wird an deine E-Mail-Adresse gesendet.`
                  : tx('Eine Bestätigung wird an deine E-Mail-Adresse gesendet. Das Kita-Team prüft deine Anfrage und meldet sich bei dir.')}
              </span>
            }
            next={[{ label: tx('Weitere Anfrage stellen'), onClick: restart }]}
            submit={submit}
            restartLabel={tx('Neue Anfrage')}
          />
        )}
      </IntentWizardShell>
    </PublicShell>
  );
}
