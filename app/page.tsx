'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  Camera,
  Circle,
  Compass,
  Flame,
  Handshake,
  Hammer,
  HardHat,
  Layers3,
  Leaf,
  LocateFixed,
  Map,
  MapPin,
  Mountain,
  Plus,
  Route,
  Search,
  Shield,
  Target,
  TreePine,
  Trees,
  Upload,
  Users,
  type LucideIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import {
  initialMissions,
  initialRiskReports,
  professionals,
} from '@/lib/mock-data';
import type {
  DangerLevel,
  Mission,
  RiskCategory,
  RiskReport,
} from '@/lib/risk-types';

type Role = 'citoyen' | 'mairie';

type WebMcpDocument = Document & {
  modelContext?: {
    registerTool: (
      tool: {
        name: string;
        title?: string;
        description: string;
        inputSchema: object;
        annotations?: {
          readOnlyHint?: boolean;
          untrustedContentHint?: boolean;
        };
        execute: (input: unknown) => unknown;
      },
      options?: { signal?: AbortSignal },
    ) => void | Promise<void>;
  };
};

const categoryOptions: RiskCategory[] = [
  'Vegetation',
  'Arbre dangereux',
  'Acces secours',
  'Orage',
  'Autre',
];

const dangerOptions: DangerLevel[] = ['Faible', 'Modere', 'Eleve', 'Critique'];

const values = [
  { label: 'Nature', icon: Leaf },
  { label: 'Solidarite', icon: Handshake },
  { label: 'Territoire', icon: Mountain },
  { label: 'Prevention', icon: Target },
  { label: 'Fiabilite', icon: Shield },
];

const roleExamples = [
  {
    title: 'Citoyen',
    text: "Je signale un risque en quelques secondes et je suis l'avancement.",
    icon: Camera,
  },
  {
    title: 'Mairie',
    text: "Je priorise, j'organise et je suis toutes les interventions.",
    icon: Building2,
  },
  {
    title: 'Professionnel',
    text: "Je recois les missions adaptees et j'interviens efficacement.",
    icon: HardHat,
  },
];

const roleNav = [
  { id: 'citoyen' as const, label: 'Citoyen', icon: Users },
  { id: 'mairie' as const, label: 'Mairie', icon: Building2 },
];

const statusStyles: Record<RiskReport['status'], string> = {
  Nouveau: 'bg-white text-[#1E3D2F] border-[#D7C9AE]',
  Verifie: 'bg-[#A8C5B1] text-[#123625] border-[#A8C5B1]',
  Priorise: 'bg-[#D9643D] text-white border-[#D9643D]',
  'Mission creee': 'bg-[#5BA681] text-[#102018] border-[#5BA681]',
  Resolu: 'bg-[#1E3D2F] text-white border-[#1E3D2F]',
};

const dangerStyles: Record<DangerLevel, string> = {
  Faible: 'text-[#5BA681]',
  Modere: 'text-[#A36E1E]',
  Eleve: 'text-[#D9643D]',
  Critique: 'text-[#C43F24]',
};

const missionStatuses: Record<Mission['status'], string> = {
  'A preparer': 'bg-[#EBD7B5] text-[#1E3D2F]',
  Planifiee: 'bg-[#5BA681] text-[#102018]',
  'En cours': 'bg-[#D9643D] text-white',
  Terminee: 'bg-[#1E3D2F] text-white',
};

export default function Home() {
  const [role, setRole] = useState<Role>('citoyen');
  const [reports, setReports] = useState<RiskReport[]>(initialRiskReports);
  const [missions, setMissions] = useState<Mission[]>(initialMissions);
  const [selectedReportId, setSelectedReportId] = useState(reports[0].id);
  const [photoLabel, setPhotoLabel] = useState('Aucune photo');
  const [located, setLocated] = useState(false);
  const [newMissionDate, setNewMissionDate] = useState('18 sept.');
  const [newMissionAssignee, setNewMissionAssignee] = useState(
    professionals[0].name,
  );

  const selectedReport =
    reports.find((report) => report.id === selectedReportId) ?? reports[0];

  const cityStats = useMemo(() => {
    const critical = reports.filter(
      (report) => report.danger === 'Critique' || report.danger === 'Eleve',
    ).length;
    const unresolved = reports.filter(
      (report) => report.status !== 'Resolu',
    ).length;

    return { critical, unresolved };
  }, [reports]);

  useEffect(() => {
    const context = (document as WebMcpDocument).modelContext;
    if (!context?.registerTool) {
      return;
    }

    const lifecycle = new AbortController();

    try {
      void Promise.resolve(
        context.registerTool(
          {
            name: 'create_risk_report',
            title: 'Creer un signalement',
            description:
              "Cree un signalement citoyen mocke et l'affiche dans l'espace mairie.",
            inputSchema: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                category: { type: 'string', enum: categoryOptions },
                danger: { type: 'string', enum: dangerOptions },
                address: { type: 'string' },
                description: { type: 'string' },
                photoLabel: { type: 'string' },
              },
              required: ['title', 'category', 'danger', 'address'],
              additionalProperties: false,
            },
            annotations: {
              readOnlyHint: false,
              untrustedContentHint: false,
            },
            execute(input) {
              const payload = parseRiskToolInput(input);
              const newReport = createRiskReport(payload);

              setReports((currentReports) => [newReport, ...currentReports]);
              setSelectedReportId(newReport.id);
              setRole('mairie');

              return {
                id: newReport.id,
                status: newReport.status,
                danger: newReport.danger,
              };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => undefined);
    } catch {
      return;
    }

    return () => lifecycle.abort();
  }, []);

  function handleReportSubmit(event: FormSubmitEvent) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newReport = createRiskReport({
      title: formString(formData, 'title', 'Nouveau signalement'),
      category: formString(formData, 'category', 'Vegetation') as RiskCategory,
      danger: formString(formData, 'danger', 'Modere') as DangerLevel,
      address: formString(formData, 'address', 'Localisation a confirmer'),
      description: formString(formData, 'description', ''),
      photoLabel,
      located,
    });

    setReports((currentReports) => [newReport, ...currentReports]);
    setSelectedReportId(newReport.id);
    setRole('mairie');
    setPhotoLabel('Aucune photo');
    setLocated(false);
    event.currentTarget.reset();
  }

  function handleMissionCreate(event: FormSubmitEvent) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const mission: Mission = {
      id: `MIS-${Math.floor(140 + Math.random() * 500)}`,
      title: formString(formData, 'missionTitle', 'Nouvelle mission'),
      reportId: selectedReport.id,
      status: 'A preparer',
      date: newMissionDate,
      assignee: newMissionAssignee,
      volunteers: formNumber(formData, 'volunteers', 4),
      objective: formString(formData, 'objective', selectedReport.description),
    };

    setMissions((currentMissions) => [mission, ...currentMissions]);
    setReports((currentReports) =>
      currentReports.map((report) =>
        report.id === selectedReport.id
          ? { ...report, status: 'Mission creee' }
          : report,
      ),
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F5F0] text-[#092819]">
      <div className="mx-auto grid min-h-screen max-w-[1680px] grid-cols-1 lg:grid-cols-[286px_minmax(0,1fr)]">
        <aside className="border-r border-[#E0D6C4] bg-[#FFFDF8] px-5 py-5">
          <BrandSignature />

          <p className="mt-4 text-sm font-semibold text-[#1E3D2F]">
            Chaque signalement compte.
          </p>

          <nav className="mt-6 grid grid-cols-2 gap-2 lg:grid-cols-1">
            {roleNav.map((item) => {
              const Icon = item.icon;
              const isActive = role === item.id;

              return (
                <button
                  key={item.id}
                  className={`flex h-11 items-center gap-3 rounded-md border px-3 text-left text-sm font-bold transition ${
                    isActive
                      ? 'border-[#1E3D2F] bg-[#1E3D2F] text-[#F7F5F0]'
                      : 'border-[#D7C9AE] bg-white text-[#1E3D2F] hover:border-[#5BA681]'
                  }`}
                  type="button"
                  onClick={() => setRole(item.id)}
                >
                  <Icon size={18} strokeWidth={1.8} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-7 hidden lg:block">
            <SectionTitle>Valeurs</SectionTitle>
            <div className="mt-3 space-y-3">
              {values.map((value) => (
                <IconLine
                  key={value.label}
                  icon={value.icon}
                  label={value.label}
                />
              ))}
            </div>
          </div>

          <div className="mt-7 hidden rounded-md bg-[#0E4326] p-4 text-[#F7F5F0] lg:block">
            <p className="text-xs font-bold uppercase">Promesse</p>
            <p className="mt-3 text-lg font-semibold leading-7">
              Anticiper aujourd&apos;hui, proteger demain.
            </p>
          </div>
        </aside>

        <section className="px-4 py-4 sm:px-6 lg:px-7">
          <header className="flex flex-col gap-4 border-b border-[#E0D6C4] pb-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm font-extrabold uppercase text-[#1E3D2F]">
                Riskeo - Nature & territoire
              </p>
              <h1 className="mt-1 max-w-3xl text-2xl font-extrabold leading-tight sm:text-3xl">
                Un outil au service des communes et des citoyens
              </h1>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:min-w-[430px]">
              <Metric label="Signalements" value={reports.length} />
              <Metric
                label="En intervention"
                value={cityStats.critical}
                tone="orange"
              />
              <Metric label="Missions" value={missions.length} />
            </div>
          </header>

          {role === 'citoyen' ? (
            <CitizenWorkspace
              reports={reports}
              missions={missions}
              selectedReport={selectedReport}
              located={located}
              photoLabel={photoLabel}
              onSelectReport={setSelectedReportId}
              onLocate={() => setLocated(true)}
              onPhoto={(label) => setPhotoLabel(label)}
              onSubmit={handleReportSubmit}
            />
          ) : (
            <CityWorkspace
              reports={reports}
              missions={missions}
              selectedReport={selectedReport}
              newMissionAssignee={newMissionAssignee}
              newMissionDate={newMissionDate}
              onSelectReport={setSelectedReportId}
              onAssigneeChange={setNewMissionAssignee}
              onDateChange={setNewMissionDate}
              onMissionCreate={handleMissionCreate}
            />
          )}
        </section>
      </div>
    </main>
  );
}

type FormSubmitEvent = {
  preventDefault: () => void;
  currentTarget: HTMLFormElement;
};

function createRiskReport(payload: {
  title: string;
  category: RiskCategory;
  danger: DangerLevel;
  address: string;
  description?: string;
  photoLabel?: string;
  located?: boolean;
}): RiskReport {
  return {
    id: `SIG-${Math.floor(300 + Math.random() * 600)}`,
    title: payload.title,
    category: payload.category,
    status: 'Nouveau',
    danger: payload.danger,
    address: payload.address,
    zone: payload.located ? 'Position detectee' : 'Zone a verifier',
    reporter: 'Vous',
    date: "A l'instant",
    coordinates: {
      x: 28 + Math.round(Math.random() * 45),
      y: 22 + Math.round(Math.random() * 55),
    },
    description: payload.description || '',
    photoLabel: payload.photoLabel || 'photo-terrain.jpg',
    priorityScore: 42 + Math.round(Math.random() * 46),
  };
}

function parseRiskToolInput(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid input');
  }

  const payload = input as Record<string, unknown>;
  const category = typeof payload.category === 'string' ? payload.category : '';
  const danger = typeof payload.danger === 'string' ? payload.danger : '';

  if (
    typeof payload.title !== 'string' ||
    typeof payload.address !== 'string' ||
    !categoryOptions.includes(category as RiskCategory) ||
    !dangerOptions.includes(danger as DangerLevel)
  ) {
    throw new Error('Invalid risk report');
  }

  return {
    title: payload.title,
    category: category as RiskCategory,
    danger: danger as DangerLevel,
    address: payload.address,
    description:
      typeof payload.description === 'string' ? payload.description : '',
    photoLabel:
      typeof payload.photoLabel === 'string'
        ? payload.photoLabel
        : 'photo-terrain.jpg',
  };
}

function formString(formData: FormData, key: string, fallback: string) {
  const value = formData.get(key);
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function formNumber(formData: FormData, key: string, fallback: number) {
  const value = formData.get(key);
  if (typeof value !== 'string') {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function CitizenWorkspace({
  reports,
  missions,
  selectedReport,
  located,
  photoLabel,
  onSelectReport,
  onLocate,
  onPhoto,
  onSubmit,
}: {
  reports: RiskReport[];
  missions: Mission[];
  selectedReport: RiskReport;
  located: boolean;
  photoLabel: string;
  onSelectReport: (id: string) => void;
  onLocate: () => void;
  onPhoto: (label: string) => void;
  onSubmit: (event: FormSubmitEvent) => void;
}) {
  return (
    <div className="mt-5 grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)_410px]">
      <PhonePreview selectedReport={selectedReport} />

      <div className="space-y-5">
        <section className="brand-card overflow-hidden">
          <PanelHeader
            icon={Map}
            title="Carte des risques"
            text="Cartographier les signalements proches."
          >
            <Button className="brand-primary-button">
              <Plus size={16} />
              Envoyer
            </Button>
          </PanelHeader>
          <RiskMap
            reports={reports}
            selectedReport={selectedReport}
            onSelectReport={onSelectReport}
          />
        </section>

        <section className="grid gap-3 md:grid-cols-2">
          {missions.slice(0, 2).map((mission) => (
            <MissionPreview key={mission.id} mission={mission} />
          ))}
        </section>

        <BrandTags />
      </div>

      <section className="brand-card p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold">Signaler</h2>
            <p className="mt-1 text-sm text-[#5B7867]">
              Photo, localisation et niveau de danger.
            </p>
          </div>
          <LineIcon icon={Camera} />
        </div>

        <form className="mt-5 space-y-4" onSubmit={onSubmit}>
          <Field label="Signalement">
            <Input name="title" placeholder="Vegetation a risque" required />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Type">
              <NativeSelect name="category" className="w-full">
                {categoryOptions.map((category) => (
                  <NativeSelectOption key={category} value={category}>
                    {category}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Danger">
              <NativeSelect name="danger" className="w-full">
                {dangerOptions.map((danger) => (
                  <NativeSelectOption key={danger} value={danger}>
                    {danger}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
          </div>

          <Field label="Localisation">
            <div className="flex gap-2">
              <Input name="address" placeholder="Chemin des Pins" required />
              <Button type="button" variant="outline" onClick={onLocate}>
                <LocateFixed size={16} />
              </Button>
            </div>
            <p className="text-xs text-[#5B7867]">
              {located ? 'Position ajoutee.' : 'Position a confirmer.'}
            </p>
          </Field>

          <Field label="Photo">
            <label className="field-upload">
              <Upload className="mb-2 text-[#1E3D2F]" size={20} />
              <span className="font-bold">{photoLabel}</span>
              <span className="text-[#5B7867]">Ajouter une image terrain</span>
              <input
                className="sr-only"
                name="photo"
                type="file"
                accept="image/*"
                onChange={(event) =>
                  onPhoto(event.target.files?.[0]?.name ?? 'Aucune photo')
                }
              />
            </label>
          </Field>

          <Field label="Description">
            <Textarea
              name="description"
              placeholder="Decrivez la zone, l'urgence et l'acces."
              required
            />
          </Field>

          <Button className="h-10 w-full rounded-md bg-[#1E3D2F] text-[#F7F5F0] hover:bg-[#123625]">
            Envoyer le signalement
          </Button>
        </form>
      </section>
    </div>
  );
}

function CityWorkspace({
  reports,
  missions,
  selectedReport,
  newMissionAssignee,
  newMissionDate,
  onSelectReport,
  onAssigneeChange,
  onDateChange,
  onMissionCreate,
}: {
  reports: RiskReport[];
  missions: Mission[];
  selectedReport: RiskReport;
  newMissionAssignee: string;
  newMissionDate: string;
  onSelectReport: (id: string) => void;
  onAssigneeChange: (assignee: string) => void;
  onDateChange: (date: string) => void;
  onMissionCreate: (event: FormSubmitEvent) => void;
}) {
  const pendingReports = reports.filter(
    (report) => report.status !== 'Resolu',
  ).length;

  return (
    <div className="mt-5 grid gap-5 xl:grid-cols-[310px_minmax(0,1fr)_390px]">
      <section className="brand-card p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold">Signalements</h2>
            <p className="text-sm text-[#5B7867]">Prioriser et suivre.</p>
          </div>
          <Button variant="outline" size="icon" aria-label="Rechercher">
            <Search size={17} />
          </Button>
        </div>
        <div className="mt-4 space-y-2">
          {reports.map((report) => (
            <ReportListItem
              key={report.id}
              report={report}
              active={selectedReport.id === report.id}
              onSelect={() => onSelectReport(report.id)}
            />
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <section className="brand-card p-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <Metric label="Signalements" value={reports.length} />
            <Metric
              label="Intervention"
              value={missions.length}
              tone="orange"
            />
            <Metric label="Termines" value={1} />
            <Metric label="En attente" value={pendingReports} />
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div>
              <RiskDetail selectedReport={selectedReport} />
              <RiskDistribution reports={reports} />
            </div>
            <div className="space-y-3">
              <StatusLegend />
              <MiniCalendar />
            </div>
          </div>
        </section>

        <section className="brand-card overflow-hidden">
          <PanelHeader
            icon={MapPin}
            title="Carte mairie"
            text="Repere, parcelles et zones sensibles."
          />
          <RiskMap
            compact
            reports={reports}
            selectedReport={selectedReport}
            onSelectReport={onSelectReport}
          />
        </section>
      </section>

      <section className="space-y-5">
        <section className="brand-card p-4">
          <h2 className="text-xl font-extrabold">Mission disponible</h2>
          <form
            key={selectedReport.id}
            className="mt-4 space-y-4"
            onSubmit={onMissionCreate}
          >
            <Field label="Titre">
              <Input
                name="missionTitle"
                defaultValue={`Intervention ${selectedReport.zone}`}
                required
              />
            </Field>
            <Field label="Intervenant">
              <NativeSelect
                className="w-full"
                value={newMissionAssignee}
                onChange={(event) => onAssigneeChange(event.target.value)}
              >
                {professionals.map((professional) => (
                  <NativeSelectOption
                    key={professional.id}
                    value={professional.name}
                  >
                    {professional.name} - {professional.specialty}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Date">
                <Input
                  value={newMissionDate}
                  onChange={(event) => onDateChange(event.target.value)}
                />
              </Field>
              <Field label="Participants">
                <Input
                  name="volunteers"
                  type="number"
                  min={1}
                  defaultValue={4}
                />
              </Field>
            </div>
            <Field label="Objectif">
              <Textarea
                name="objective"
                defaultValue={selectedReport.description}
              />
            </Field>
            <Button className="h-10 w-full rounded-md bg-[#D9643D] text-white hover:bg-[#C6532E]">
              Accepter la mission
            </Button>
          </form>
        </section>

        <section className="brand-card p-4">
          <h2 className="text-xl font-extrabold">Exemples d&apos;usages</h2>
          <div className="mt-4 space-y-3">
            {roleExamples.map((item) => (
              <UseCaseCard
                key={item.title}
                icon={item.icon}
                text={item.text}
                title={item.title}
              />
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}

function BrandSignature() {
  return (
    <div className="flex items-center gap-3">
      <BrandMark />
      <div>
        <p className="text-[2rem] font-extrabold leading-none tracking-normal text-[#0D4828]">
          riskéo
        </p>
        <p className="mt-1 text-sm font-semibold text-[#1E3D2F]">
          Nature & territoire
        </p>
      </div>
    </div>
  );
}

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <Mountain className="absolute left-[19px] top-[14px]" size={30} />
      <TreePine className="absolute left-[10px] top-[28px]" size={24} />
      <TreePine className="absolute right-[9px] top-[25px]" size={29} />
    </span>
  );
}

function PhonePreview({ selectedReport }: { selectedReport: RiskReport }) {
  return (
    <section className="phone-frame hidden xl:block">
      <div className="phone-camera" />
      <div className="flex items-center justify-between px-3 pt-8 text-xs font-bold">
        <span>6:04</span>
        <Compass size={15} />
      </div>
      <div className="mx-3 mt-3 overflow-hidden rounded-md border border-[#E0D6C4]">
        <RiskMap
          compact
          reports={[selectedReport]}
          selectedReport={selectedReport}
          onSelectReport={() => undefined}
        />
      </div>
      <div className="mx-3 mt-3 rounded-md bg-white p-3 shadow-sm">
        <StatusPill status={selectedReport.status} />
        <h2 className="mt-3 text-base font-extrabold">
          {selectedReport.title}
        </h2>
        <p className="mt-1 text-xs text-[#5B7867]">{selectedReport.address}</p>
        <Button className="mt-4 h-9 w-full rounded-md bg-[#1E3D2F] text-white hover:bg-[#123625]">
          Envoyer
        </Button>
      </div>
    </section>
  );
}

function RiskDetail({ selectedReport }: { selectedReport: RiskReport }) {
  return (
    <article>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold text-[#5B7867]">
            {selectedReport.id}
          </p>
          <h2 className="mt-1 text-2xl font-extrabold">
            {selectedReport.title}
          </h2>
          <p className="mt-2 text-sm text-[#5B7867]">
            {selectedReport.address} - {selectedReport.zone}
          </p>
        </div>
        <StatusPill status={selectedReport.status} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <DetailMetric
          icon={AlertTriangle}
          label="Danger"
          value={selectedReport.danger}
        />
        <DetailMetric
          icon={Layers3}
          label="Categorie"
          value={selectedReport.category}
        />
        <DetailMetric
          icon={Camera}
          label="Photo"
          value={selectedReport.photoLabel}
        />
      </div>

      <p className="mt-5 rounded-md border border-[#E0D6C4] bg-[#FFFDF8] p-4 text-sm leading-6">
        {selectedReport.description}
      </p>
    </article>
  );
}

function RiskMap({
  reports,
  selectedReport,
  compact = false,
  onSelectReport,
}: {
  reports: RiskReport[];
  selectedReport: RiskReport;
  compact?: boolean;
  onSelectReport: (id: string) => void;
}) {
  return (
    <div
      className={`map-terrain relative overflow-hidden ${
        compact ? 'min-h-[230px]' : 'min-h-[500px]'
      }`}
    >
      <div className="absolute left-[6%] top-[13%] h-[70%] w-[20%] rounded-md border border-[#D7C9AE] bg-white/35" />
      <div className="absolute left-[32%] top-[9%] h-[41%] w-[23%] rounded-md border border-[#D7C9AE] bg-white/25" />
      <div className="absolute left-[58%] top-[16%] h-[56%] w-[29%] rounded-md border border-[#D7C9AE] bg-white/30" />
      <div className="absolute left-[25%] top-[57%] h-[29%] w-[25%] rounded-md border border-[#D7C9AE] bg-white/25" />
      <div className="absolute left-[7%] top-[61%] flex w-[86%] items-center gap-2 text-[#5B7867]">
        <Route size={18} />
        <span className="h-1 flex-1 rounded-full bg-[#1E3D2F]/20" />
      </div>
      <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-md border border-[#D7C9AE] bg-[#FFFDF8]/95 px-3 py-2 text-sm font-bold">
        <Trees size={17} />
        Parcelles et pistes
      </div>
      {reports.map((report) => {
        const active = report.id === selectedReport.id;

        return (
          <button
            key={report.id}
            className={`absolute grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 shadow-lg transition ${
              active
                ? 'border-[#1E3D2F] bg-[#D9643D] text-white'
                : 'border-white bg-[#5BA681] text-[#102018] hover:bg-[#D9643D] hover:text-white'
            }`}
            style={{
              left: `${report.coordinates.x}%`,
              top: `${report.coordinates.y}%`,
            }}
            type="button"
            aria-label={`Voir ${report.id}`}
            onClick={() => onSelectReport(report.id)}
          >
            {report.category === 'Vegetation' ? (
              <Flame size={18} />
            ) : (
              <MapPin size={18} />
            )}
          </button>
        );
      })}
    </div>
  );
}

function ReportListItem({
  report,
  active,
  onSelect,
}: {
  report: RiskReport;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={`w-full rounded-md border p-3 text-left transition ${
        active
          ? 'border-[#1E3D2F] bg-[#EFF5EF]'
          : 'border-[#E0D6C4] bg-[#FFFDF8] hover:border-[#5BA681]'
      }`}
      type="button"
      onClick={onSelect}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold">{report.id}</span>
        <StatusPill status={report.status} />
      </div>
      <p className="mt-2 font-bold">{report.title}</p>
      <p className="mt-1 text-sm text-[#5B7867]">{report.address}</p>
      <div className="mt-3 flex items-center justify-between text-sm font-semibold">
        <span className={dangerStyles[report.danger]}>{report.danger}</span>
        <span>{report.priorityScore}/100</span>
      </div>
    </button>
  );
}

function MissionPreview({ mission }: { mission: Mission }) {
  return (
    <article className="rounded-md border border-[#E0D6C4] bg-[#FFFDF8] p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold">{mission.id}</span>
        <span
          className={`rounded-full px-2 py-1 text-xs font-bold ${
            missionStatuses[mission.status]
          }`}
        >
          {mission.status}
        </span>
      </div>
      <h3 className="mt-3 font-extrabold">{mission.title}</h3>
      <p className="mt-2 text-sm leading-5 text-[#5B7867]">
        {mission.objective}
      </p>
      <div className="mt-3 flex flex-wrap gap-3 text-sm">
        <SmallMeta icon={CalendarDays}>{mission.date}</SmallMeta>
        <SmallMeta icon={Users}>{mission.volunteers}</SmallMeta>
        <SmallMeta icon={Hammer}>{mission.assignee}</SmallMeta>
      </div>
    </article>
  );
}

function RiskDistribution({ reports }: { reports: RiskReport[] }) {
  const total = Math.max(reports.length, 1);
  const high = reports.filter((report) => report.danger === 'Critique').length;
  const medium = reports.filter((report) => report.danger === 'Eleve').length;
  const low = reports.length - high - medium;

  return (
    <div className="mt-5 rounded-md border border-[#E0D6C4] bg-white p-4">
      <p className="text-sm font-extrabold">Repartition des risques</p>
      <div className="mt-4 grid gap-2">
        <ProgressLine
          label="Risque eleve"
          value={Math.round(((high + medium) / total) * 100)}
          color="#D9643D"
        />
        <ProgressLine
          label="Risque moyen"
          value={Math.round((medium / total) * 100)}
          color="#E1A641"
        />
        <ProgressLine
          label="Risque faible"
          value={Math.round((low / total) * 100)}
          color="#5BA681"
        />
      </div>
    </div>
  );
}

function ProgressLine({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs font-semibold text-[#5B7867]">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-[#EFE8DB]">
        <span
          className="block h-2 rounded-full"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function StatusLegend() {
  return (
    <div className="rounded-md border border-[#E0D6C4] bg-white p-4">
      <p className="text-sm font-extrabold">Statut</p>
      <div className="mt-3 space-y-2 text-sm">
        <LegendRow color="#5BA681" label="Valide" />
        <LegendRow color="#D9643D" label="En intervention" />
        <LegendRow color="#E1A641" label="En attente" />
        <LegendRow color="#1E3D2F" label="Termine" />
      </div>
    </div>
  );
}

function MiniCalendar() {
  const days = Array.from({ length: 30 }, (_, index) => index + 1);

  return (
    <div className="rounded-md border border-[#E0D6C4] bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-extrabold">Calendrier</p>
        <span className="text-xs font-semibold text-[#5B7867]">Octobre</span>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs">
        {days.map((day) => (
          <span
            key={day}
            className={`grid aspect-square place-items-center rounded-full ${
              day === 16
                ? 'bg-[#5BA681] font-bold text-[#102018]'
                : 'text-[#5B7867]'
            }`}
          >
            {day}
          </span>
        ))}
      </div>
    </div>
  );
}

function BrandTags() {
  const tags = [
    { label: 'Proximite', icon: Users },
    { label: 'Engagement', icon: Target },
    { label: 'Prevention', icon: Shield },
    { label: 'Terrain', icon: MapPin },
    { label: 'Transmission', icon: TreePine },
  ];

  return (
    <div className="flex flex-wrap gap-2 rounded-md border border-[#E0D6C4] bg-[#FFFDF8] p-3">
      {tags.map((tag) => (
        <SmallMeta key={tag.label} icon={tag.icon}>
          {tag.label}
        </SmallMeta>
      ))}
    </div>
  );
}

function UseCaseCard({
  title,
  text,
  icon,
}: {
  title: string;
  text: string;
  icon: LucideIcon;
}) {
  return (
    <article className="flex items-center gap-4 rounded-md border border-[#E0D6C4] bg-[#FFFDF8] p-4">
      <LineIcon icon={icon} />
      <div>
        <h3 className="font-extrabold uppercase">{title}</h3>
        <p className="mt-1 text-sm leading-5 text-[#1E3D2F]">{text}</p>
      </div>
    </article>
  );
}

function Metric({
  label,
  value,
  tone = 'white',
}: {
  label: string;
  value: number;
  tone?: 'white' | 'orange';
}) {
  return (
    <div
      className={`rounded-md border p-3 ${
        tone === 'orange'
          ? 'border-[#D9643D] bg-[#D9643D] text-white'
          : 'border-[#E0D6C4] bg-white'
      }`}
    >
      <p className="text-xs font-bold uppercase">{label}</p>
      <p className="mt-1 text-2xl font-extrabold">{value}</p>
    </div>
  );
}

function DetailMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-[#E0D6C4] bg-white p-3">
      <Icon className="text-[#0D4828]" size={18} strokeWidth={1.8} />
      <p className="mt-3 text-xs font-bold uppercase text-[#5B7867]">{label}</p>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  );
}

function PanelHeader({
  icon,
  title,
  text,
  children,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-[#E0D6C4] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <LineIcon icon={icon} />
        <div>
          <h2 className="text-xl font-extrabold">{title}</h2>
          <p className="text-sm text-[#5B7867]">{text}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function StatusPill({ status }: { status: RiskReport['status'] }) {
  return (
    <span
      className={`rounded-full border px-2 py-1 text-xs font-bold ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <p className="text-xs font-extrabold uppercase text-[#1E3D2F]">
        {children}
      </p>
      <span className="h-px flex-1 bg-[#D7C9AE]" />
    </div>
  );
}

function IconLine({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex items-center gap-3 text-sm font-semibold text-[#1E3D2F]">
      <Icon size={19} strokeWidth={1.7} />
      <span>{label}</span>
    </div>
  );
}

function SmallMeta({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#1E3D2F]">
      <Icon size={15} strokeWidth={1.8} />
      {children}
    </span>
  );
}

function LineIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="grid size-11 shrink-0 place-items-center rounded-md border border-[#A8C5B1] bg-[#F7F5F0] text-[#0D4828]">
      <Icon size={22} strokeWidth={1.7} />
    </span>
  );
}

function LegendRow({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <Circle size={10} fill={color} stroke={color} />
      <span>{label}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
