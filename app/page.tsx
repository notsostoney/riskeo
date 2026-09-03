'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  Camera,
  ClipboardList,
  Flame,
  Hammer,
  Layers3,
  LocateFixed,
  MapPin,
  Plus,
  Route,
  Search,
  ShieldCheck,
  Trees,
  Upload,
  Users,
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

const statusStyles: Record<RiskReport['status'], string> = {
  Nouveau: 'bg-white text-[#1E3D2F] border-[#D7C9AE]',
  Verifie: 'bg-[#EBD7B5] text-[#1E3D2F] border-[#D9C59C]',
  Priorise: 'bg-[#D9643D] text-white border-[#D9643D]',
  'Mission creee': 'bg-[#5BA681] text-[#102018] border-[#5BA681]',
  Resolu: 'bg-[#1E3D2F] text-white border-[#1E3D2F]',
};

const dangerStyles: Record<DangerLevel, string> = {
  Faible: 'text-[#527164]',
  Modere: 'text-[#A16B24]',
  Eleve: 'text-[#D9643D]',
  Critique: 'text-[#D6381E]',
};

const missionStatuses: Record<Mission['status'], string> = {
  'A preparer': 'bg-[#EBD7B5] text-[#1E3D2F]',
  Planifiee: 'bg-[#5BA681] text-[#102018]',
  'En cours': 'bg-[#D9643D] text-white',
  Terminee: 'bg-[#1E3D2F] text-white',
};

const roleNav = [
  { id: 'citoyen' as const, label: 'Citoyen', icon: Users },
  { id: 'mairie' as const, label: 'Mairie', icon: Building2 },
];

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
    <main className="min-h-screen bg-[#F7F5F0] text-[#1E3D2F]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="bg-[#1E3D2F] px-5 py-5 text-[#F7F5F0] lg:min-h-screen">
          <div className="flex items-center justify-between gap-4 lg:block">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-md bg-[#5BA681] text-[#102018]">
                <ShieldCheck size={22} />
              </span>
              <div>
                <p className="text-xl font-extrabold">Riskeo</p>
                <p className="text-sm text-[#CFE0D4]">Nature & territoire</p>
              </div>
            </div>
            <div className="hidden rounded-md border border-[#38634D] bg-[#173326] p-3 lg:mt-7 lg:block">
              <p className="text-sm font-semibold">Parcours MVP</p>
              <p className="mt-1 text-sm text-[#CFE0D4]">
                Signalement, priorisation, mission et suivi local.
              </p>
            </div>
          </div>

          <nav className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-1">
            {roleNav.map((item) => {
              const Icon = item.icon;
              const isActive = role === item.id;

              return (
                <button
                  key={item.id}
                  className={`flex h-11 items-center gap-3 rounded-md border px-3 text-left text-sm font-semibold transition ${
                    isActive
                      ? 'border-[#5BA681] bg-[#5BA681] text-[#102018]'
                      : 'border-[#38634D] bg-transparent text-[#F7F5F0] hover:bg-[#244A39]'
                  }`}
                  type="button"
                  onClick={() => setRole(item.id)}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-6 hidden space-y-3 text-sm text-[#CFE0D4] lg:block">
            <SidebarLine icon={MapPin} label="Carte des risques" />
            <SidebarLine icon={Camera} label="Signalement photo" />
            <SidebarLine icon={ClipboardList} label="Instruction mairie" />
            <SidebarLine icon={Hammer} label="Creation mission" />
          </div>
        </aside>

        <section className="px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
          <header className="flex flex-col gap-4 border-b border-[#D7C9AE] pb-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase text-[#5B7867]">
                Prototype vibecoding
              </p>
              <h1 className="mt-2 max-w-3xl text-3xl font-extrabold sm:text-4xl">
                Orchestrer les risques communaux, du signalement a la mission.
              </h1>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:min-w-[420px]">
              <Metric label="Risques actifs" value={cityStats.unresolved} />
              <Metric
                label="Prioritaires"
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
    <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_420px]">
      <div className="space-y-5">
        <section className="app-surface overflow-hidden rounded-lg">
          <div className="flex flex-col gap-3 border-b border-[#D7C9AE] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">Carte citoyenne</h2>
              <p className="text-sm text-[#5B7867]">
                Les points orange demandent une verification rapide.
              </p>
            </div>
            <Button className="bg-[#D9643D] text-white hover:bg-[#C6532E]">
              <Plus size={16} />
              Signaler
            </Button>
          </div>
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
      </div>

      <section className="app-surface rounded-lg p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Signaler un risque</h2>
            <p className="mt-1 text-sm text-[#5B7867]">
              Photo, adresse et niveau percu suffisent pour lancer le tri.
            </p>
          </div>
          <span className="grid size-10 place-items-center rounded-md bg-[#EBD7B5]">
            <Camera size={20} />
          </span>
        </div>

        <form className="mt-5 space-y-4" onSubmit={onSubmit}>
          <Field label="Probleme observe">
            <Input
              name="title"
              placeholder="Ex. branches mortes pres d'une maison"
              required
            />
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
            <Field label="Danger percu">
              <NativeSelect name="danger" className="w-full">
                {dangerOptions.map((danger) => (
                  <NativeSelectOption key={danger} value={danger}>
                    {danger}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
          </div>

          <Field label="Adresse ou repere">
            <div className="flex gap-2">
              <Input
                name="address"
                placeholder="Chemin, quartier, point de repere"
                required
              />
              <Button type="button" variant="outline" onClick={onLocate}>
                <LocateFixed size={16} />
              </Button>
            </div>
            <p className="text-xs text-[#5B7867]">
              {located
                ? 'Position locale ajoutee au signalement.'
                : 'Localisation a ajouter.'}
            </p>
          </Field>

          <Field label="Photo">
            <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#BFAF91] bg-[#FFFDF8] p-4 text-center text-sm">
              <Upload className="mb-2" size={20} />
              <span className="font-semibold">{photoLabel}</span>
              <span className="text-[#5B7867]">
                Ajouter une image du terrain
              </span>
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
              placeholder="Ce que vous voyez, ce qui bloque, ce qui semble urgent..."
              required
            />
          </Field>

          <Button className="h-10 w-full bg-[#1E3D2F] text-[#F7F5F0] hover:bg-[#2A523F]">
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
  return (
    <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)_380px]">
      <section className="app-surface rounded-lg p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Signalements</h2>
            <p className="text-sm text-[#5B7867]">A verifier et prioriser.</p>
          </div>
          <Button variant="outline" size="icon" aria-label="Rechercher">
            <Search size={17} />
          </Button>
        </div>
        <div className="mt-4 space-y-2">
          {reports.map((report) => (
            <button
              key={report.id}
              className={`w-full rounded-lg border p-3 text-left transition ${
                selectedReport.id === report.id
                  ? 'border-[#1E3D2F] bg-[#EBD7B5]'
                  : 'border-[#D7C9AE] bg-[#FFFDF8] hover:border-[#5BA681]'
              }`}
              type="button"
              onClick={() => onSelectReport(report.id)}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold">{report.id}</span>
                <StatusPill status={report.status} />
              </div>
              <p className="mt-2 font-semibold">{report.title}</p>
              <p className="mt-1 text-sm text-[#5B7867]">{report.address}</p>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className={dangerStyles[report.danger]}>
                  {report.danger}
                </span>
                <span>{report.priorityScore}/100</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <section className="app-surface rounded-lg p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#5B7867]">
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

          <p className="mt-5 rounded-lg border border-[#D7C9AE] bg-[#FFFDF8] p-4 text-sm leading-6">
            {selectedReport.description}
          </p>
        </section>

        <section className="app-surface overflow-hidden rounded-lg">
          <div className="border-b border-[#D7C9AE] p-4">
            <h2 className="text-xl font-bold">Carte mairie</h2>
            <p className="text-sm text-[#5B7867]">
              Visualisation operationnelle des zones a traiter.
            </p>
          </div>
          <RiskMap
            compact
            reports={reports}
            selectedReport={selectedReport}
            onSelectReport={onSelectReport}
          />
        </section>
      </section>

      <section className="space-y-5">
        <section className="app-surface rounded-lg p-4">
          <h2 className="text-xl font-bold">Creer une mission</h2>
          <form className="mt-4 space-y-4" onSubmit={onMissionCreate}>
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
            <Button className="h-10 w-full bg-[#D9643D] text-white hover:bg-[#C6532E]">
              <Plus size={16} />
              Creer la mission
            </Button>
          </form>
        </section>

        <section className="app-surface rounded-lg p-4">
          <h2 className="text-xl font-bold">Missions actives</h2>
          <div className="mt-4 space-y-3">
            {missions.map((mission) => (
              <MissionPreview key={mission.id} mission={mission} />
            ))}
          </div>
        </section>
      </section>
    </div>
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
        compact ? 'min-h-[290px]' : 'min-h-[500px]'
      }`}
    >
      <div className="absolute left-[8%] top-[15%] h-[68%] w-[18%] rounded-lg border border-[#D7C9AE] bg-white/35" />
      <div className="absolute left-[32%] top-[12%] h-[38%] w-[21%] rounded-lg border border-[#D7C9AE] bg-white/25" />
      <div className="absolute left-[58%] top-[18%] h-[55%] w-[28%] rounded-lg border border-[#D7C9AE] bg-white/30" />
      <div className="absolute left-[26%] top-[56%] h-[28%] w-[25%] rounded-lg border border-[#D7C9AE] bg-white/25" />
      <div className="absolute left-[7%] top-[61%] flex w-[86%] items-center gap-2 text-[#5B7867]">
        <Route size={18} />
        <span className="h-1 flex-1 rounded-full bg-[#1E3D2F]/20" />
      </div>
      <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-md border border-[#D7C9AE] bg-[#FFFDF8]/90 px-3 py-2 text-sm font-semibold">
        <Trees size={17} />
        Parcelles, pistes et zones sensibles
      </div>
      {reports.map((report) => {
        const active = report.id === selectedReport.id;

        return (
          <button
            key={report.id}
            className={`absolute grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 shadow-lg transition ${
              active
                ? 'border-[#1E3D2F] bg-[#D9643D] text-white'
                : 'border-white bg-[#1E3D2F] text-[#F7F5F0] hover:bg-[#D9643D]'
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

function MissionPreview({ mission }: { mission: Mission }) {
  return (
    <article className="rounded-lg border border-[#D7C9AE] bg-[#FFFDF8] p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold">{mission.id}</span>
        <span
          className={`rounded-md px-2 py-1 text-xs font-bold ${
            missionStatuses[mission.status]
          }`}
        >
          {mission.status}
        </span>
      </div>
      <h3 className="mt-3 font-bold">{mission.title}</h3>
      <p className="mt-2 text-sm leading-5 text-[#5B7867]">
        {mission.objective}
      </p>
      <div className="mt-3 flex flex-wrap gap-3 text-sm">
        <span className="inline-flex items-center gap-1">
          <CalendarDays size={15} />
          {mission.date}
        </span>
        <span className="inline-flex items-center gap-1">
          <Users size={15} />
          {mission.volunteers}
        </span>
        <span className="inline-flex items-center gap-1">
          <Hammer size={15} />
          {mission.assignee}
        </span>
      </div>
    </article>
  );
}

function Metric({
  label,
  value,
  tone = 'green',
}: {
  label: string;
  value: number;
  tone?: 'green' | 'orange';
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        tone === 'orange'
          ? 'border-[#D9643D] bg-[#D9643D] text-white'
          : 'border-[#D7C9AE] bg-[#FFFDF8]'
      }`}
    >
      <p className="text-xs font-semibold uppercase">{label}</p>
      <p className="mt-1 text-2xl font-extrabold">{value}</p>
    </div>
  );
}

function DetailMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof AlertTriangle;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-[#D7C9AE] bg-[#FFFDF8] p-3">
      <Icon className="text-[#5BA681]" size={18} />
      <p className="mt-3 text-xs font-semibold uppercase text-[#5B7867]">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: RiskReport['status'] }) {
  return (
    <span
      className={`rounded-md border px-2 py-1 text-xs font-bold ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}

function SidebarLine({
  icon: Icon,
  label,
}: {
  icon: typeof MapPin;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon size={17} />
      <span>{label}</span>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
