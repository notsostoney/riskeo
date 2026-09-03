'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Image from 'next/image';
import {
  AlertTriangle,
  Bell,
  Building2,
  CalendarDays,
  Camera,
  ChevronDown,
  Circle,
  ClipboardList,
  Coins,
  Eye,
  Handshake,
  Hammer,
  HelpCircle,
  Home as HomeIcon,
  Layers3,
  Leaf,
  LocateFixed,
  LogOut,
  MapIcon,
  MapPin,
  Mountain,
  Plus,
  Shield,
  Target,
  TreePine,
  Trophy,
  Upload,
  User,
  Users,
  X,
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
import { fondettesCenter, parcelLayers } from '@/lib/map-layers';
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
type CitizenTab = 'accueil' | 'carte' | 'signaler' | 'missions' | 'profil';
type AuthMode = 'login' | 'signup';

type DemoSession = {
  firstName: string;
  lastName: string;
  email: string;
  town: string;
};

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

const sessionKey = 'riskeo-demo-session-v2';
const onboardingKey = 'riskeo-onboarding-seen-v2';

const defaultSession: DemoSession = {
  firstName: 'Lucas',
  lastName: 'Martin',
  email: 'lucas.martin@demo.local',
  town: 'Fondettes',
};

const categoryOptions: RiskCategory[] = [
  'Vegetation',
  'Arbre dangereux',
  'Acces secours',
  'Orage',
  'Autre',
];

const dangerOptions: DangerLevel[] = ['Faible', 'Modere', 'Eleve', 'Critique'];

const headerCounters = [
  { value: 7, label: 'Signalements' },
  { value: 3, label: 'En intervention', tone: 'orange' as const },
  { value: 1, label: 'Mission' },
];

const citizenNav = [
  { id: 'accueil' as const, label: 'Accueil', icon: HomeIcon },
  { id: 'carte' as const, label: 'Carte', icon: MapIcon },
  { id: 'signaler' as const, label: 'Signaler', icon: Camera },
  { id: 'missions' as const, label: 'Missions', icon: Trophy },
  { id: 'profil' as const, label: 'Profil', icon: User },
];

const userMenuItems = [
  { label: 'Mon profil', icon: User },
  { label: 'Mes signalements', icon: ClipboardList },
  { label: 'Mes missions', icon: Trophy },
  { label: 'Mes credits', icon: Coins },
  { label: 'Notifications', icon: Bell },
];

const onboardingSteps = [
  {
    title: 'Signalez un risque',
    text: 'Prenez une photo d’une zone qui vous paraît dangereuse et indiquez sa localisation.',
    icon: Camera,
  },
  {
    title: 'La mairie verifie',
    text: 'Les services municipaux vérifient le signalement et définissent sa priorité.',
    icon: Shield,
  },
  {
    title: 'Participez a une mission',
    text: 'Certaines interventions accessibles aux citoyens sont proposées près de chez vous.',
    icon: Users,
  },
  {
    title: 'Gagnez des credits',
    text: 'Vos missions validées vous font progresser et débloquent des récompenses locales.',
    icon: Coins,
  },
];

const values = [
  { label: 'Nature', icon: Leaf },
  { label: 'Solidarite', icon: Handshake },
  { label: 'Territoire', icon: Mountain },
  { label: 'Prevention', icon: Target },
  { label: 'Fiabilite', icon: Shield },
];

const statusStyles: Record<RiskReport['status'], string> = {
  Nouveau: 'bg-white text-[#1E3D2F] border-[#D9DDD8]',
  Verifie: 'bg-[#A8C5B1] text-[#123426] border-[#A8C5B1]',
  Priorise: 'bg-[#D9643D] text-white border-[#D9643D]',
  'Mission creee': 'bg-[#5BA681] text-[#102018] border-[#5BA681]',
  Resolu: 'bg-[#1E3D2F] text-white border-[#1E3D2F]',
};

const dangerStyles: Record<DangerLevel, string> = {
  Faible: 'text-[#4D9B64]',
  Modere: 'text-[#E59B2F]',
  Eleve: 'text-[#D9643D]',
  Critique: 'text-[#D94A3D]',
};

const missionStatuses: Record<Mission['status'], string> = {
  'A preparer': 'bg-[#EBD7B5] text-[#173328]',
  Planifiee: 'bg-[#5BA681] text-[#102018]',
  'En cours': 'bg-[#D9643D] text-white',
  Terminee: 'bg-[#1E3D2F] text-white',
};

export default function Home() {
  const [role, setRole] = useState<Role>('citoyen');
  const [activeTab, setActiveTab] = useState<CitizenTab>('accueil');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [session, setSession] = useState<DemoSession | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
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

  const nearbyRisks = reports.slice(0, 2);

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
    const timer = window.setTimeout(() => {
      const stored = window.localStorage.getItem(sessionKey);
      if (stored) {
        setSession(JSON.parse(stored) as DemoSession);
        return;
      }

      setShowAuth(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

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

  function completeAuth(data: DemoSession = defaultSession) {
    window.localStorage.setItem(sessionKey, JSON.stringify(data));
    setSession(data);
    setShowAuth(false);

    if (!window.localStorage.getItem(onboardingKey)) {
      setOnboardingStep(0);
      setShowOnboarding(true);
    }
  }

  function finishOnboarding() {
    window.localStorage.setItem(onboardingKey, 'true');
    setShowOnboarding(false);
  }

  function logout() {
    window.localStorage.removeItem(sessionKey);
    setSession(null);
    setRole('citoyen');
    setShowUserMenu(false);
    setShowAuth(true);
  }

  function handleReportSubmit(event: FormSubmitEvent) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newReport = createRiskReport({
      title: formString(formData, 'title', 'Nouveau signalement'),
      category: formString(formData, 'category', 'Vegetation') as RiskCategory,
      danger: formString(formData, 'danger', 'Modere') as DangerLevel,
      address: formString(formData, 'address', 'Fondettes'),
      description: formString(formData, 'description', ''),
      photoLabel,
      located,
    });

    setReports((currentReports) => [newReport, ...currentReports]);
    setSelectedReportId(newReport.id);
    setActiveTab('carte');
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
    <main className="min-h-screen bg-[#F7F5F0] pb-20 text-[#173328] md:pb-0">
      <ProductHeader
        activeTab={activeTab}
        session={session ?? defaultSession}
        showUserMenu={showUserMenu}
        onLogout={logout}
        onMairieAccess={() => {
          setRole('mairie');
          setShowUserMenu(false);
        }}
        onMenuToggle={() => setShowUserMenu((visible) => !visible)}
        onNavigate={(tab) => {
          setRole('citoyen');
          setActiveTab(tab);
        }}
      />

      {role === 'citoyen' ? (
        <CitizenExperience
          activeTab={activeTab}
          located={located}
          missions={missions}
          nearbyRisks={nearbyRisks}
          photoLabel={photoLabel}
          reports={reports}
          selectedReport={selectedReport}
          session={session ?? defaultSession}
          onLocate={() => setLocated(true)}
          onPhoto={(label) => setPhotoLabel(label)}
          onSelectReport={setSelectedReportId}
          onSubmit={handleReportSubmit}
          onTabChange={setActiveTab}
        />
      ) : (
        <CityExperience
          cityStats={cityStats}
          missions={missions}
          newMissionAssignee={newMissionAssignee}
          newMissionDate={newMissionDate}
          reports={reports}
          selectedReport={selectedReport}
          onAssigneeChange={setNewMissionAssignee}
          onBackToCitizen={() => setRole('citoyen')}
          onDateChange={setNewMissionDate}
          onMissionCreate={handleMissionCreate}
          onSelectReport={setSelectedReportId}
        />
      )}

      {role === 'citoyen' ? (
        <MobileBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      ) : null}

      {showAuth ? (
        <AuthModal
          authMode={authMode}
          onModeChange={setAuthMode}
          onSubmit={completeAuth}
        />
      ) : null}

      {showOnboarding ? (
        <OnboardingModal
          currentStep={onboardingStep}
          onNext={() => {
            if (onboardingStep >= onboardingSteps.length - 1) {
              finishOnboarding();
              return;
            }

            setOnboardingStep((step) => step + 1);
          }}
          onSkip={finishOnboarding}
        />
      ) : null}
    </main>
  );
}

type FormSubmitEvent = {
  preventDefault: () => void;
  currentTarget: HTMLFormElement;
};

function ProductHeader({
  activeTab,
  session,
  showUserMenu,
  onLogout,
  onMairieAccess,
  onMenuToggle,
  onNavigate,
}: {
  activeTab: CitizenTab;
  session: DemoSession;
  showUserMenu: boolean;
  onLogout: () => void;
  onMairieAccess: () => void;
  onMenuToggle: () => void;
  onNavigate: (tab: CitizenTab) => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#D9DDD8] bg-[#FFFDF8]/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1440px] items-center gap-4 px-4 py-3 sm:px-6">
        <button
          className="flex shrink-0 items-center"
          type="button"
          onClick={() => onNavigate('accueil')}
        >
          <Image
            src="/brand/logo-horizontal.png"
            alt="Riskéo"
            width={391}
            height={120}
            className="hidden h-11 w-auto sm:block"
            priority
          />
          <Image
            src="/brand/logo-principal.png"
            alt="Riskéo"
            width={160}
            height={180}
            className="h-11 w-11 sm:hidden"
            priority
          />
        </button>

        <nav className="ml-auto hidden items-center gap-1 lg:flex">
          {citizenNav.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;

            return (
              <button
                key={item.id}
                className={`flex h-10 items-center gap-2 rounded-md px-3 text-sm font-bold transition ${
                  active
                    ? 'bg-[#EEF1EE] text-[#1E3D2F]'
                    : 'text-[#5B7867] hover:bg-[#F7F5F0] hover:text-[#1E3D2F]'
                }`}
                type="button"
                onClick={() => onNavigate(item.id)}
              >
                <Icon size={17} strokeWidth={1.8} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="ml-auto hidden items-center gap-2 md:flex lg:ml-4">
          {headerCounters.map((counter) => (
            <HeaderCounter key={counter.label} {...counter} />
          ))}
        </div>

        <div className="relative ml-auto md:ml-0">
          <button
            className="flex h-10 items-center gap-2 rounded-full border border-[#D9DDD8] bg-white py-1 pl-1 pr-3 text-sm font-bold"
            type="button"
            onClick={onMenuToggle}
          >
            <span className="grid size-8 place-items-center rounded-full bg-[#1E3D2F] text-white">
              {session.firstName[0]}
            </span>
            <span>{session.firstName}</span>
            <ChevronDown size={16} />
          </button>

          {showUserMenu ? (
            <div className="absolute right-0 top-12 w-64 rounded-md border border-[#D9DDD8] bg-white p-2 shadow-xl">
              {userMenuItems.map((item) => (
                <MenuButton key={item.label} icon={item.icon}>
                  {item.label}
                </MenuButton>
              ))}
              <div className="my-2 h-px bg-[#D9DDD8]" />
              <button
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-semibold text-[#5B7867] hover:bg-[#F7F5F0]"
                type="button"
                onClick={onMairieAccess}
              >
                <Building2 size={17} />
                Acces mairie
              </button>
              <MenuButton icon={HelpCircle}>Aide</MenuButton>
              <button
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-semibold text-[#D94A3D] hover:bg-[#FFF3EF]"
                type="button"
                onClick={onLogout}
              >
                <LogOut size={17} />
                Deconnexion
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function CitizenExperience({
  activeTab,
  located,
  missions,
  nearbyRisks,
  photoLabel,
  reports,
  selectedReport,
  session,
  onLocate,
  onPhoto,
  onSelectReport,
  onSubmit,
  onTabChange,
}: {
  activeTab: CitizenTab;
  located: boolean;
  missions: Mission[];
  nearbyRisks: RiskReport[];
  photoLabel: string;
  reports: RiskReport[];
  selectedReport: RiskReport;
  session: DemoSession;
  onLocate: () => void;
  onPhoto: (label: string) => void;
  onSelectReport: (id: string) => void;
  onSubmit: (event: FormSubmitEvent) => void;
  onTabChange: (tab: CitizenTab) => void;
}) {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 lg:py-7">
      {activeTab === 'accueil' ? (
        <CitizenHome
          missions={missions}
          nearbyRisks={nearbyRisks}
          reports={reports}
          selectedReport={selectedReport}
          session={session}
          onSelectReport={onSelectReport}
          onTabChange={onTabChange}
        />
      ) : null}

      {activeTab === 'carte' ? (
        <FullMapView
          reports={reports}
          selectedReport={selectedReport}
          onSelectReport={onSelectReport}
        />
      ) : null}

      {activeTab === 'signaler' ? (
        <div className="mx-auto max-w-2xl">
          <ReportForm
            located={located}
            photoLabel={photoLabel}
            onLocate={onLocate}
            onPhoto={onPhoto}
            onSubmit={onSubmit}
          />
        </div>
      ) : null}

      {activeTab === 'missions' ? <MissionList missions={missions} /> : null}

      {activeTab === 'profil' ? (
        <ProfileView session={session} reports={reports} missions={missions} />
      ) : null}
    </div>
  );
}

function CitizenHome({
  missions,
  nearbyRisks,
  reports,
  selectedReport,
  session,
  onSelectReport,
  onTabChange,
}: {
  missions: Mission[];
  nearbyRisks: RiskReport[];
  reports: RiskReport[];
  selectedReport: RiskReport;
  session: DemoSession;
  onSelectReport: (id: string) => void;
  onTabChange: (tab: CitizenTab) => void;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_390px]">
      <section className="space-y-5">
        <div className="brand-card p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-extrabold uppercase text-[#5B7867]">
                Fondettes - Indre-et-Loire
              </p>
              <h1 className="mt-2 text-3xl font-extrabold leading-tight sm:text-4xl">
                Bonjour {session.firstName} 👋
              </h1>
              <p className="mt-2 text-lg font-semibold text-[#1E3D2F]">
                2 risques signalés près de chez vous
              </p>
            </div>
            <Button
              className="h-12 rounded-md bg-[#D9643D] px-5 text-base font-bold text-white hover:bg-[#C6532E]"
              onClick={() => onTabChange('signaler')}
            >
              <Plus size={19} />
              Signaler un risque
            </Button>
          </div>
        </div>

        <section className="brand-card overflow-hidden">
          <PanelHeader
            icon={MapIcon}
            text="Fondettes, 37230 - secteurs citoyens et zones à vérifier."
            title="Carte de Fondettes"
          />
          <FondettesMap
            height={460}
            reports={reports}
            selectedReport={selectedReport}
            onSelectReport={onSelectReport}
          />
        </section>

        <section className="grid gap-3 md:grid-cols-2">
          {nearbyRisks.map((report) => (
            <RiskCard key={report.id} report={report} />
          ))}
        </section>
      </section>

      <aside className="space-y-5">
        <FondettesContext />
        <MissionList compact missions={missions.slice(0, 2)} />
        <BrandTags />
      </aside>
    </div>
  );
}

function FullMapView({
  reports,
  selectedReport,
  onSelectReport,
}: {
  reports: RiskReport[];
  selectedReport: RiskReport;
  onSelectReport: (id: string) => void;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="brand-card overflow-hidden">
        <PanelHeader
          icon={MapPin}
          text="Zoom, déplacement et marqueurs Riskéo interactifs."
          title="Carte opérationnelle"
        />
        <FondettesMap
          height={620}
          reports={reports}
          selectedReport={selectedReport}
          onSelectReport={onSelectReport}
        />
      </section>
      <aside className="space-y-4">
        <RiskDetail selectedReport={selectedReport} />
        <LayerPanel />
      </aside>
    </div>
  );
}

function CityExperience({
  cityStats,
  missions,
  newMissionAssignee,
  newMissionDate,
  reports,
  selectedReport,
  onAssigneeChange,
  onBackToCitizen,
  onDateChange,
  onMissionCreate,
  onSelectReport,
}: {
  cityStats: { critical: number; unresolved: number };
  missions: Mission[];
  newMissionAssignee: string;
  newMissionDate: string;
  reports: RiskReport[];
  selectedReport: RiskReport;
  onAssigneeChange: (assignee: string) => void;
  onBackToCitizen: () => void;
  onDateChange: (date: string) => void;
  onMissionCreate: (event: FormSubmitEvent) => void;
  onSelectReport: (id: string) => void;
}) {
  return (
    <div className="mx-auto grid max-w-[1440px] gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[250px_minmax(0,1fr)] lg:py-7">
      <aside className="brand-card h-fit p-4">
        <Image
          src="/brand/logo-empile.png"
          alt="Riskéo"
          width={244}
          height={174}
          className="mx-auto h-28 w-auto object-contain"
        />
        <div className="mt-4 rounded-md bg-[#F7F5F0] p-3 text-sm">
          <p className="font-bold">Hôtel de Ville de Fondettes</p>
          <p className="mt-1 text-[#5B7867]">
            35 rue Eugène Goüin, 37230 Fondettes
          </p>
        </div>
        <nav className="mt-4 space-y-2 text-sm font-bold">
          <SideNavItem active icon={ClipboardList} label="Signalements" />
          <SideNavItem icon={Hammer} label="Missions" />
          <SideNavItem icon={MapIcon} label="Parcelles" />
          <SideNavItem icon={Users} label="Citoyens" />
        </nav>
        <Button
          className="mt-5 w-full rounded-md"
          variant="outline"
          onClick={onBackToCitizen}
        >
          Retour citoyen
        </Button>
      </aside>

      <section className="grid gap-5 xl:grid-cols-[310px_minmax(0,1fr)_370px]">
        <section className="brand-card p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-extrabold">Tableau de bord</h1>
              <p className="text-sm text-[#5B7867]">
                Fondettes aujourd&apos;hui.
              </p>
            </div>
            <Button variant="outline" size="icon" aria-label="Rechercher">
              <SearchIcon />
            </Button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Metric label="Signalements" value={7} />
            <Metric
              label="Intervention"
              value={missions.length}
              tone="orange"
            />
            <Metric label="Termines" value={1} />
            <Metric label="En attente" value={cityStats.unresolved} />
          </div>
          <div className="mt-4 space-y-2">
            {reports.map((report) => (
              <ReportListItem
                key={report.id}
                active={selectedReport.id === report.id}
                report={report}
                onSelect={() => onSelectReport(report.id)}
              />
            ))}
          </div>
        </section>

        <section className="space-y-5">
          <section className="brand-card overflow-hidden">
            <PanelHeader
              icon={MapIcon}
              text="Carte OpenStreetMap centrée sur Fondettes."
              title="Carte mairie"
            />
            <FondettesMap
              height={400}
              reports={reports}
              selectedReport={selectedReport}
              onSelectReport={onSelectReport}
            />
          </section>
          <RiskDetail selectedReport={selectedReport} />
          <RiskDistribution reports={reports} />
        </section>

        <section className="space-y-5">
          <MissionCreateForm
            newMissionAssignee={newMissionAssignee}
            newMissionDate={newMissionDate}
            selectedReport={selectedReport}
            onAssigneeChange={onAssigneeChange}
            onDateChange={onDateChange}
            onMissionCreate={onMissionCreate}
          />
          <StatusLegend />
          <MiniCalendar />
        </section>
      </section>
    </div>
  );
}

function AuthModal({
  authMode,
  onModeChange,
  onSubmit,
}: {
  authMode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onSubmit: (session?: DemoSession) => void;
}) {
  function submit(event: FormSubmitEvent) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    if (authMode === 'signup') {
      onSubmit({
        firstName: formString(formData, 'firstName', 'Lucas'),
        lastName: formString(formData, 'lastName', 'Martin'),
        email: formString(formData, 'email', defaultSession.email),
        town: formString(formData, 'town', 'Fondettes'),
      });
      return;
    }

    onSubmit(defaultSession);
  }

  return (
    <ModalShell>
      <div className="w-full max-w-[520px] rounded-lg bg-[#FFFDF8] p-5 shadow-2xl sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <Image
            src="/brand/logo-horizontal.png"
            alt="Riskéo"
            width={391}
            height={120}
            className="h-14 w-auto"
          />
        </div>
        <h2 className="mt-6 text-2xl font-extrabold">Bienvenue sur Riskéo</h2>
        <p className="mt-2 text-[#5B7867]">
          Ensemble, protégeons notre territoire.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-md bg-[#F7F5F0] p-1">
          <AuthTab
            active={authMode === 'login'}
            label="Se connecter"
            onClick={() => onModeChange('login')}
          />
          <AuthTab
            active={authMode === 'signup'}
            label="Créer un compte"
            onClick={() => onModeChange('signup')}
          />
        </div>

        <form className="mt-5 space-y-4" onSubmit={submit}>
          {authMode === 'signup' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Prénom">
                <Input name="firstName" defaultValue="Lucas" required />
              </Field>
              <Field label="Nom">
                <Input name="lastName" defaultValue="Martin" required />
              </Field>
            </div>
          ) : null}
          <Field label="Email">
            <Input
              name="email"
              type="email"
              defaultValue={defaultSession.email}
              required
            />
          </Field>
          <Field label="Mot de passe">
            <Input name="password" type="password" defaultValue="demo-riskeo" />
          </Field>
          {authMode === 'signup' ? (
            <Field label="Commune">
              <Input name="town" defaultValue="Fondettes" required />
            </Field>
          ) : (
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" defaultChecked />
              Se souvenir de moi
            </label>
          )}
          <Button className="h-11 w-full rounded-md bg-[#1E3D2F] text-white hover:bg-[#123426]">
            {authMode === 'signup' ? 'Créer mon compte' : 'Se connecter'}
          </Button>
        </form>
      </div>
    </ModalShell>
  );
}

function OnboardingModal({
  currentStep,
  onNext,
  onSkip,
}: {
  currentStep: number;
  onNext: () => void;
  onSkip: () => void;
}) {
  const step = onboardingSteps[currentStep];
  const Icon = step.icon;

  return (
    <ModalShell>
      <div className="w-full max-w-[520px] rounded-lg bg-[#FFFDF8] p-5 shadow-2xl sm:p-7">
        <button
          className="ml-auto grid size-9 place-items-center rounded-full text-[#5B7867] hover:bg-[#F7F5F0]"
          type="button"
          aria-label="Passer le tutoriel"
          onClick={onSkip}
        >
          <X size={18} />
        </button>
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-[#EBD7B5] text-[#1E3D2F]">
          <Icon size={30} strokeWidth={1.7} />
        </div>
        <p className="mt-6 text-center text-sm font-extrabold text-[#5B7867]">
          Étape {currentStep + 1} sur {onboardingSteps.length}
        </p>
        <h2 className="mt-2 text-center text-2xl font-extrabold">
          {step.title}
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-center leading-7 text-[#5B7867]">
          {step.text}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          {onboardingSteps.map((item) => (
            <span
              key={item.title}
              className={`h-2 rounded-full ${
                item.title === step.title
                  ? 'w-8 bg-[#1E3D2F]'
                  : 'w-2 bg-[#D9DDD8]'
              }`}
            />
          ))}
        </div>
        <div className="mt-7 grid gap-2 sm:grid-cols-[1fr_auto]">
          <Button variant="outline" onClick={onSkip}>
            Passer le tutoriel
          </Button>
          <Button
            className="rounded-md bg-[#D9643D] text-white hover:bg-[#C6532E]"
            onClick={onNext}
          >
            {currentStep === onboardingSteps.length - 1
              ? 'Commencer'
              : 'Suivant'}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}

function ReportForm({
  located,
  photoLabel,
  onLocate,
  onPhoto,
  onSubmit,
}: {
  located: boolean;
  photoLabel: string;
  onLocate: () => void;
  onPhoto: (label: string) => void;
  onSubmit: (event: FormSubmitEvent) => void;
}) {
  return (
    <section className="brand-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">Signaler un risque</h1>
          <p className="mt-1 text-[#5B7867]">
            Un signalement clair aide la mairie à vérifier rapidement.
          </p>
        </div>
        <LineIcon icon={Camera} />
      </div>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <Field label="Signalement">
          <Input name="title" placeholder="Végétation à risque" required />
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
            <Input
              name="address"
              placeholder="Chemin ou secteur de Fondettes"
              required
            />
            <Button type="button" variant="outline" onClick={onLocate}>
              <LocateFixed size={16} />
            </Button>
          </div>
          <p className="text-sm text-[#5B7867]">
            {located
              ? 'Position ajoutée au signalement.'
              : 'Position à confirmer.'}
          </p>
        </Field>

        <Field label="Photo">
          <label className="field-upload">
            <Upload className="mb-2 text-[#1E3D2F]" size={22} />
            <span className="font-bold">{photoLabel}</span>
            <span className="text-[#5B7867]">Ajouter une photo du terrain</span>
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
            placeholder="Décrivez simplement la zone, l’accès et ce qui vous semble urgent."
            required
          />
        </Field>

        <Button className="h-12 w-full rounded-md bg-[#D9643D] text-base font-bold text-white hover:bg-[#C6532E]">
          Envoyer le signalement
        </Button>
      </form>
    </section>
  );
}

function FondettesMap({
  height,
  reports,
  selectedReport,
  onSelectReport,
}: {
  height: number;
  reports: RiskReport[];
  selectedReport: RiskReport;
  onSelectReport: (id: string) => void;
}) {
  const mapNode = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapNode.current) {
      return;
    }

    let disposed = false;
    let map: import('leaflet').Map | null = null;

    async function mountMap() {
      const L = await import('leaflet');
      if (!mapNode.current || disposed) {
        return;
      }

      map = L.map(mapNode.current, {
        center: [fondettesCenter.lat, fondettesCenter.lng],
        zoom: 13,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
      }).addTo(map);

      reports.forEach((report) => {
        const isSelected = report.id === selectedReport.id;
        const marker = L.marker([report.geo.lat, report.geo.lng], {
          icon: L.divIcon({
            className: '',
            html: `<span class="riskeo-marker ${isSelected ? 'is-selected' : ''}">${report.category === 'Vegetation' ? '!' : '•'}</span>`,
            iconSize: [34, 34],
            iconAnchor: [17, 17],
          }),
        }).addTo(map as import('leaflet').Map);

        marker.bindPopup(
          `<strong>${report.title}</strong><br/>${report.address}<br/>Danger : ${report.danger}`,
        );
        marker.on('click', () => onSelectReport(report.id));
      });
    }

    void mountMap();

    return () => {
      disposed = true;
      map?.remove();
    };
  }, [onSelectReport, reports, selectedReport]);

  return (
    <div className="relative">
      <div
        ref={mapNode}
        className="z-0 w-full bg-[#EEF1EE]"
        style={{ height }}
      />
      <div className="pointer-events-none absolute bottom-4 left-4 z-[400] rounded-md border border-[#D9DDD8] bg-[#FFFDF8]/95 px-3 py-2 text-sm font-bold shadow-sm">
        Fondettes, 37230
      </div>
    </div>
  );
}

function FondettesContext() {
  return (
    <section className="brand-card p-4">
      <SectionTitle>Contexte local</SectionTitle>
      <div className="mt-4 space-y-3 text-sm leading-6">
        <p>
          Prototype centré sur Fondettes, commune d’Indre-et-Loire avec services
          techniques et police municipale.
        </p>
        <p className="rounded-md bg-[#F7F5F0] p-3 font-semibold">
          Hôtel de Ville de Fondettes
          <br />
          35 rue Eugène Goüin
          <br />
          37230 Fondettes
        </p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {values.map((value) => (
          <SmallMeta key={value.label} icon={value.icon}>
            {value.label}
          </SmallMeta>
        ))}
      </div>
    </section>
  );
}

function MissionCreateForm({
  newMissionAssignee,
  newMissionDate,
  selectedReport,
  onAssigneeChange,
  onDateChange,
  onMissionCreate,
}: {
  newMissionAssignee: string;
  newMissionDate: string;
  selectedReport: RiskReport;
  onAssigneeChange: (assignee: string) => void;
  onDateChange: (date: string) => void;
  onMissionCreate: (event: FormSubmitEvent) => void;
}) {
  return (
    <section className="brand-card p-4">
      <h2 className="text-xl font-extrabold">Créer une mission</h2>
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
            <Input name="volunteers" type="number" min={1} defaultValue={4} />
          </Field>
        </div>
        <Field label="Objectif">
          <Textarea
            name="objective"
            defaultValue={selectedReport.description}
          />
        </Field>
        <Button className="h-11 w-full rounded-md bg-[#D9643D] text-white hover:bg-[#C6532E]">
          Créer la mission
        </Button>
      </form>
    </section>
  );
}

function MissionList({
  compact = false,
  missions,
}: {
  compact?: boolean;
  missions: Mission[];
}) {
  return (
    <section
      className={compact ? 'brand-card p-4' : 'grid gap-3 md:grid-cols-2'}
    >
      {compact ? <SectionTitle>Missions proches</SectionTitle> : null}
      <div className={compact ? 'mt-4 space-y-3' : 'contents'}>
        {missions.map((mission) => (
          <MissionPreview key={mission.id} mission={mission} />
        ))}
      </div>
    </section>
  );
}

function ProfileView({
  session,
  reports,
  missions,
}: {
  session: DemoSession;
  reports: RiskReport[];
  missions: Mission[];
}) {
  return (
    <section className="mx-auto max-w-3xl brand-card p-6">
      <div className="flex items-center gap-4">
        <span className="grid size-16 place-items-center rounded-full bg-[#1E3D2F] text-2xl font-extrabold text-white">
          {session.firstName[0]}
        </span>
        <div>
          <h1 className="text-2xl font-extrabold">
            {session.firstName} {session.lastName}
          </h1>
          <p className="font-semibold text-[#5B7867]">{session.town}</p>
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Metric label="Signalements" value={reports.length} />
        <Metric label="Missions" value={missions.length} />
        <Metric label="Crédits" value={120} tone="orange" />
      </div>
    </section>
  );
}

function RiskDetail({ selectedReport }: { selectedReport: RiskReport }) {
  return (
    <article className="brand-card p-4">
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

      <p className="mt-5 rounded-md border border-[#D9DDD8] bg-[#FFFDF8] p-4 text-sm leading-6">
        {selectedReport.description}
      </p>
    </article>
  );
}

function RiskCard({ report }: { report: RiskReport }) {
  return (
    <article className="brand-card grid grid-cols-[1fr_116px] gap-4 p-4">
      <div>
        <StatusPill status={report.status} />
        <h3 className="mt-3 font-extrabold">{report.title}</h3>
        <p className="mt-2 text-sm text-[#5B7867]">{report.address}</p>
        <p className={`mt-3 text-sm font-bold ${dangerStyles[report.danger]}`}>
          Danger : {report.danger.toLowerCase()}
        </p>
      </div>
      <div className="terrain-thumb grid place-items-center rounded-md">
        <TreePine className="text-[#1E3D2F]" size={38} />
      </div>
    </article>
  );
}

function LayerPanel() {
  return (
    <section className="brand-card p-4">
      <SectionTitle>Couches prévues</SectionTitle>
      <div className="mt-4 space-y-2">
        {parcelLayers.map((layer) => (
          <label
            key={layer.id}
            className="flex items-center justify-between gap-3 rounded-md border border-[#D9DDD8] bg-white px-3 py-2 text-sm font-semibold"
          >
            <span>{layer.label}</span>
            <input type="checkbox" checked={layer.enabled} readOnly />
          </label>
        ))}
      </div>
      <p className="mt-3 text-xs leading-5 text-[#5B7867]">
        Prévu pour brancher cadastre, parcelles, terrains, zones OLD, incendie
        et météo via des sources officielles.
      </p>
    </section>
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
          : 'border-[#D9DDD8] bg-[#FFFDF8] hover:border-[#5BA681]'
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
    <article className="rounded-md border border-[#D9DDD8] bg-[#FFFDF8] p-3 shadow-sm">
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
    <div className="brand-card p-4">
      <p className="text-sm font-extrabold">Répartition des risques</p>
      <div className="mt-4 grid gap-2">
        <ProgressLine
          color="#D9643D"
          label="Risque élevé"
          value={Math.round(((high + medium) / total) * 100)}
        />
        <ProgressLine
          color="#E59B2F"
          label="Risque moyen"
          value={Math.round((medium / total) * 100)}
        />
        <ProgressLine
          color="#5BA681"
          label="Risque faible"
          value={Math.round((low / total) * 100)}
        />
      </div>
    </div>
  );
}

function ProgressLine({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs font-semibold text-[#5B7867]">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-[#EEF1EE]">
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
    <div className="brand-card p-4">
      <p className="text-sm font-extrabold">Statut</p>
      <div className="mt-3 space-y-2 text-sm">
        <LegendRow color="#5BA681" label="Validé" />
        <LegendRow color="#D9643D" label="En intervention" />
        <LegendRow color="#E59B2F" label="En attente" />
        <LegendRow color="#1E3D2F" label="Terminé" />
      </div>
    </div>
  );
}

function MiniCalendar() {
  const days = Array.from({ length: 30 }, (_, index) => index + 1);

  return (
    <div className="brand-card p-4">
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
    { label: 'Proximité', icon: Users },
    { label: 'Engagement', icon: Target },
    { label: 'Prévention', icon: Shield },
    { label: 'Terrain', icon: MapPin },
    { label: 'Transmission', icon: TreePine },
  ];

  return (
    <div className="brand-card flex flex-wrap gap-2 p-3">
      {tags.map((tag) => (
        <SmallMeta key={tag.label} icon={tag.icon}>
          {tag.label}
        </SmallMeta>
      ))}
    </div>
  );
}

function MobileBottomNav({
  activeTab,
  onTabChange,
}: {
  activeTab: CitizenTab;
  onTabChange: (tab: CitizenTab) => void;
}) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[#D9DDD8] bg-[#FFFDF8] px-2 pb-2 pt-1 md:hidden">
      {citizenNav.map((item) => {
        const Icon = item.icon;
        const active = activeTab === item.id;

        return (
          <button
            key={item.id}
            className={`flex flex-col items-center gap-1 rounded-md px-1 py-2 text-[11px] font-bold ${
              active ? 'text-[#D9643D]' : 'text-[#5B7867]'
            }`}
            type="button"
            onClick={() => onTabChange(item.id)}
          >
            <Icon size={20} strokeWidth={1.8} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

function HeaderCounter({
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
      className={`flex min-w-[92px] items-center gap-2 rounded-md border px-3 py-2 ${
        tone === 'orange'
          ? 'border-[#D9643D] bg-[#D9643D] text-white'
          : 'border-[#D9DDD8] bg-white text-[#1E3D2F]'
      }`}
    >
      <span className="text-xl font-extrabold leading-none">{value}</span>
      <span className="text-xs font-bold leading-tight">{label}</span>
    </div>
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
          : 'border-[#D9DDD8] bg-white'
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
    <div className="rounded-md border border-[#D9DDD8] bg-white p-3">
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
    <div className="flex flex-col gap-3 border-b border-[#D9DDD8] p-4 sm:flex-row sm:items-center sm:justify-between">
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
      <span className="h-px flex-1 bg-[#D9DDD8]" />
    </div>
  );
}

function SideNavItem({
  active = false,
  icon: Icon,
  label,
}: {
  active?: boolean;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-md px-3 py-2 ${
        active ? 'bg-[#EEF1EE] text-[#1E3D2F]' : 'text-[#5B7867]'
      }`}
    >
      <Icon size={17} />
      {label}
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

function MenuButton({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <button
      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-semibold hover:bg-[#F7F5F0]"
      type="button"
    >
      <Icon size={17} />
      {children}
    </button>
  );
}

function AuthTab({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`h-10 rounded-md text-sm font-bold ${
        active ? 'bg-white text-[#1E3D2F] shadow-sm' : 'text-[#5B7867]'
      }`}
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function ModalShell({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#123426]/55 p-4">
      {children}
    </div>
  );
}

function SearchIcon() {
  return <Eye size={17} />;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

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
    zone: payload.located ? 'Position détectée' : 'Secteur Fondettes',
    reporter: 'Vous',
    date: "A l'instant",
    coordinates: {
      x: 28 + Math.round(Math.random() * 45),
      y: 22 + Math.round(Math.random() * 55),
    },
    geo: {
      lat: fondettesCenter.lat + (Math.random() - 0.5) * 0.028,
      lng: fondettesCenter.lng + (Math.random() - 0.5) * 0.05,
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
