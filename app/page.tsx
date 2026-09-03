'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Image from 'next/image';
import {
  AlertTriangle,
  Bell,
  Building2,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronDown,
  Circle,
  ClipboardList,
  Coins,
  Edit3,
  Film,
  Eye,
  Hammer,
  HelpCircle,
  Home as HomeIcon,
  Layers3,
  Library,
  LocateFixed,
  LogOut,
  MapIcon,
  MapPin,
  Plus,
  QrCode,
  ReceiptText,
  Scissors,
  Settings2,
  Shield,
  Sparkles,
  Store,
  Ticket,
  Trash2,
  TreePine,
  Trophy,
  Utensils,
  Upload,
  User,
  Users,
  Waves,
  X,
  type LucideIcon,
} from 'lucide-react';

import { creditRewards, earningGuides } from '@/data/creditRules';
import { partners, type Partner } from '@/data/partners';
import {
  createRewardPass,
  creditTransactions,
  creditsBalance,
  cityCreditStats,
  rewardPasses,
  type CreditTransaction,
  type RewardPass,
} from '@/data/redemptions';
import {
  rewardCategoryLabels,
  rewards,
  type Reward,
  type RewardCategory,
} from '@/data/rewards';
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
  GeoPoint,
  RiskCategory,
  RiskReport,
} from '@/lib/risk-types';

type Role = 'citoyen' | 'mairie';
type CitizenTab =
  | 'accueil'
  | 'carte'
  | 'signaler'
  | 'missions'
  | 'credits'
  | 'profil';
type AuthMode = 'login' | 'signup';
type ProfileSection =
  | 'info'
  | 'preferences'
  | 'availability'
  | 'notifications'
  | 'security';

type DemoSession = {
  firstName: string;
  lastName: string;
  email: string;
  town: string;
};

type ProfileData = DemoSession & {
  phone: string;
  postalCode: string;
  address: string;
  memberSince: string;
  avatarUrl?: string;
  missionInterests: {
    vegetationCare: boolean;
    stormCleanup: boolean;
    terrainCheck: boolean;
    collectiveOperations: boolean;
  };
  maxDistance: string;
  missionDifficulty: {
    simple: boolean;
    supervised: boolean;
  };
  availability: Record<
    string,
    Record<'morning' | 'afternoon' | 'evening', boolean>
  >;
  weekendPreferred: boolean;
  pauseMissions: {
    active: boolean;
    startDate: string;
    endDate: string;
  };
  notifications: {
    reportStatus: boolean;
    reportValidated: boolean;
    missionFromReport: boolean;
    missionValidated: boolean;
    creditsReceived: boolean;
    nearbyMission: boolean;
    missionReminder: boolean;
    missionChange: boolean;
    cityInfo: boolean;
    localAlerts: boolean;
  };
  channels: {
    inApp: boolean;
    email: boolean;
    sms: boolean;
  };
  privacy: {
    cityIdentityVisible: boolean;
    locationAllowed: boolean;
  };
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
const profileKey = 'riskeo-citizen-profile-v1';

const defaultSession: DemoSession = {
  firstName: 'Lucas',
  lastName: 'Martin',
  email: 'lucas.martin@demo.local',
  town: 'Fondettes',
};

const defaultAvailability = {
  Lundi: { morning: false, afternoon: false, evening: false },
  Mardi: { morning: false, afternoon: false, evening: false },
  Mercredi: { morning: false, afternoon: false, evening: false },
  Jeudi: { morning: false, afternoon: false, evening: false },
  Vendredi: { morning: false, afternoon: false, evening: false },
  Samedi: { morning: true, afternoon: true, evening: false },
  Dimanche: { morning: true, afternoon: false, evening: false },
};

const defaultProfileData: ProfileData = {
  ...defaultSession,
  phone: '06 12 34 56 78',
  postalCode: '37230',
  address: '12 rue des Chaussumiers',
  memberSince: 'septembre 2026',
  missionInterests: {
    vegetationCare: true,
    stormCleanup: true,
    terrainCheck: true,
    collectiveOperations: true,
  },
  maxDistance: '5 km',
  missionDifficulty: {
    simple: true,
    supervised: true,
  },
  availability: defaultAvailability,
  weekendPreferred: true,
  pauseMissions: {
    active: false,
    startDate: '',
    endDate: '',
  },
  notifications: {
    reportStatus: true,
    reportValidated: true,
    missionFromReport: true,
    missionValidated: true,
    creditsReceived: true,
    nearbyMission: true,
    missionReminder: true,
    missionChange: true,
    cityInfo: true,
    localAlerts: true,
  },
  channels: {
    inApp: true,
    email: true,
    sms: false,
  },
  privacy: {
    cityIdentityVisible: true,
    locationAllowed: true,
  },
};

const profileSections: {
  id: ProfileSection;
  label: string;
  icon: LucideIcon;
}[] = [
  { id: 'info', label: 'Informations personnelles', icon: User },
  { id: 'preferences', label: 'Mes préférences', icon: Settings2 },
  { id: 'availability', label: 'Disponibilités', icon: CalendarDays },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Sécurité & confidentialité', icon: Shield },
];

const recentProfileActivity = [
  {
    title: '+300 crédits',
    detail: 'Mission Entretien végétation validée',
    date: '12 septembre',
  },
  {
    title: 'Mission terminée',
    detail: 'Nettoyage après intempéries',
    date: '8 septembre',
  },
  {
    title: 'Signalement validé',
    detail: 'Végétation sèche',
    date: '4 septembre',
  },
];

const categoryOptions: RiskCategory[] = [
  'Vegetation',
  'Arbre dangereux',
  'Acces secours',
  'Orage',
  'Autre',
];

const dangerOptions: DangerLevel[] = ['Faible', 'Modere', 'Eleve', 'Critique'];

const reportTypeOptions: { value: RiskCategory; label: string }[] = [
  { value: 'Vegetation', label: 'Végétation' },
  { value: 'Arbre dangereux', label: 'Arbre dangereux' },
  { value: "Risque d'incendie", label: "Risque d'incendie" },
  { value: 'Autre', label: 'Autre' },
];

const reportDangerOptions: { value: DangerLevel; label: string }[] = [
  { value: 'Faible', label: 'Faible' },
  { value: 'Modere', label: 'Modéré' },
  { value: 'Eleve', label: 'Élevé' },
  { value: 'Critique', label: 'Critique' },
];

const rewardFilters: {
  id: RewardCategory | 'all' | 'nearby';
  label: string;
}[] = [
  { id: 'all', label: 'Pour vous' },
  { id: 'nearby', label: 'Près de chez vous' },
  { id: 'food', label: 'Commerces' },
  { id: 'restaurant', label: 'Restaurants' },
  { id: 'hair', label: 'Coiffure' },
  { id: 'wellness', label: 'Bien-être' },
  { id: 'sport', label: 'Sport' },
  { id: 'pool', label: 'Piscine' },
  { id: 'cinema', label: 'Cinéma' },
  { id: 'show', label: 'Spectacles' },
  { id: 'culture', label: 'Culture' },
  { id: 'leisure', label: 'Loisirs' },
];

const categoryIcons: Record<RewardCategory, LucideIcon> = {
  food: Store,
  restaurant: Utensils,
  hair: Scissors,
  wellness: Sparkles,
  sport: Trophy,
  pool: Waves,
  cinema: Film,
  show: Ticket,
  culture: Library,
  leisure: Users,
};

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
  { id: 'credits' as const, label: 'Crédits', icon: Coins },
];

const userMenuItems = [
  {
    label: 'Mon profil',
    icon: User,
    tab: 'profil' as CitizenTab,
    profileSection: 'info' as ProfileSection,
  },
  {
    label: 'Mes signalements',
    icon: ClipboardList,
    tab: 'carte' as CitizenTab,
  },
  { label: 'Mes missions', icon: Trophy, tab: 'missions' as CitizenTab },
  { label: 'Mes crédits', icon: Coins, tab: 'credits' as CitizenTab },
  {
    label: 'Notifications',
    icon: Bell,
    tab: 'profil' as CitizenTab,
    profileSection: 'notifications' as ProfileSection,
  },
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
    title: 'Gagnez des crédits',
    text: 'Vos missions validées vous font progresser et débloquent des récompenses locales.',
    icon: Coins,
  },
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
  const [profileInitialSection, setProfileInitialSection] =
    useState<ProfileSection>('info');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [session, setSession] = useState<DemoSession | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [reports, setReports] = useState<RiskReport[]>(initialRiskReports);
  const [missions, setMissions] = useState<Mission[]>(initialMissions);
  const [selectedReportId, setSelectedReportId] = useState(reports[0].id);
  const [credits, setCredits] = useState(creditsBalance);
  const [transactions, setTransactions] =
    useState<CreditTransaction[]>(creditTransactions);
  const [passes, setPasses] = useState<RewardPass[]>(rewardPasses);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [latestPass, setLatestPass] = useState<RewardPass | null>(null);
  const [validatedMissionIds, setValidatedMissionIds] = useState<string[]>([]);
  const [missionCreditNotice, setMissionCreditNotice] = useState<number | null>(
    null,
  );
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

  function updateSession(data: DemoSession) {
    window.localStorage.setItem(sessionKey, JSON.stringify(data));
    setSession(data);
  }

  function handleReportSubmit(payload: ReportFormPayload) {
    const newReport = createRiskReport(payload);

    setReports((currentReports) => [newReport, ...currentReports]);
    setSelectedReportId(newReport.id);
    return newReport;
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
      creditsReward: creditRewards.lightVegetationMaintenance,
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

  function redeemReward(reward: Reward) {
    const partner = findPartner(reward.partnerId);
    const pass = createRewardPass(reward, partner.name);

    setCredits((currentCredits) => currentCredits - reward.creditsCost);
    setTransactions((currentTransactions) => [
      {
        id: `tx-${reward.id}-${Date.now()}`,
        userId: 'lucas',
        amount: -reward.creditsCost,
        type: 'spend',
        source: 'reward',
        sourceId: reward.id,
        createdAt: new Date().toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
        }),
        label: reward.title,
      },
      ...currentTransactions,
    ]);
    setPasses((currentPasses) => [pass, ...currentPasses]);
    setLatestPass(pass);
    setSelectedReward(null);
  }

  function validateMissionCredits(mission: Mission) {
    if (validatedMissionIds.includes(mission.id)) {
      return;
    }

    const earnedCredits =
      (mission.creditsReward ?? creditRewards.lightVegetationMaintenance) +
      (mission.priorityBonus ?? 0);

    setValidatedMissionIds((currentIds) => [...currentIds, mission.id]);
    setCredits((currentCredits) => currentCredits + earnedCredits);
    setTransactions((currentTransactions) => [
      {
        id: `tx-${mission.id}-${Date.now()}`,
        userId: 'lucas',
        amount: earnedCredits,
        type: 'earn',
        source: 'mission',
        sourceId: mission.id,
        createdAt: new Date().toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
        }),
        label: mission.title,
      },
      ...currentTransactions,
    ]);
    setMissionCreditNotice(earnedCredits);
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
        onNavigate={(tab, profileSection) => {
          setRole('citoyen');
          if (profileSection) {
            setProfileInitialSection(profileSection);
          }
          setActiveTab(tab);
        }}
      />

      {role === 'citoyen' ? (
        <CitizenExperience
          activeTab={activeTab}
          missions={missions}
          nearbyRisks={nearbyRisks}
          passes={passes}
          reports={reports}
          selectedReport={selectedReport}
          session={session ?? defaultSession}
          transactions={transactions}
          credits={credits}
          missionCreditNotice={missionCreditNotice}
          validatedMissionIds={validatedMissionIds}
          onRedeemReward={setSelectedReward}
          onSelectReport={setSelectedReportId}
          onSubmit={handleReportSubmit}
          onTabChange={setActiveTab}
          onValidateMission={validateMissionCredits}
          onLogout={logout}
          onSessionUpdate={updateSession}
          profileInitialSection={profileInitialSection}
        />
      ) : (
        <CityExperience
          cityStats={cityStats}
          missions={missions}
          newMissionAssignee={newMissionAssignee}
          newMissionDate={newMissionDate}
          reports={reports}
          selectedReport={selectedReport}
          credits={credits}
          passes={passes}
          transactions={transactions}
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

      {selectedReward ? (
        <RewardConfirmModal
          balance={credits}
          reward={selectedReward}
          onCancel={() => setSelectedReward(null)}
          onConfirm={() => redeemReward(selectedReward)}
        />
      ) : null}

      {latestPass ? (
        <PassModal pass={latestPass} onClose={() => setLatestPass(null)} />
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

type ReportFormPayload = {
  title: string;
  category: RiskCategory;
  danger: DangerLevel;
  address: string;
  description: string;
  photoLabel: string;
  located: boolean;
  geo?: GeoPoint;
};

type ReportFormErrors = Partial<
  Record<
    'title' | 'category' | 'danger' | 'address' | 'photo' | 'description',
    string
  >
>;

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
  onNavigate: (tab: CitizenTab, profileSection?: ProfileSection) => void;
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
                <MenuButton
                  key={item.label}
                  icon={item.icon}
                  onClick={
                    item.tab
                      ? () => {
                          onNavigate(item.tab, item.profileSection);
                          onMenuToggle();
                        }
                      : undefined
                  }
                >
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
  credits,
  missionCreditNotice,
  missions,
  nearbyRisks,
  passes,
  reports,
  selectedReport,
  session,
  transactions,
  validatedMissionIds,
  onRedeemReward,
  onSelectReport,
  onSubmit,
  onTabChange,
  onValidateMission,
  onLogout,
  onSessionUpdate,
  profileInitialSection,
}: {
  activeTab: CitizenTab;
  credits: number;
  missionCreditNotice: number | null;
  missions: Mission[];
  nearbyRisks: RiskReport[];
  passes: RewardPass[];
  reports: RiskReport[];
  selectedReport: RiskReport;
  session: DemoSession;
  transactions: CreditTransaction[];
  validatedMissionIds: string[];
  onRedeemReward: (reward: Reward) => void;
  onSelectReport: (id: string) => void;
  onSubmit: (payload: ReportFormPayload) => RiskReport;
  onTabChange: (tab: CitizenTab) => void;
  onValidateMission: (mission: Mission) => void;
  onLogout: () => void;
  onSessionUpdate: (session: DemoSession) => void;
  profileInitialSection: ProfileSection;
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
            onViewReport={() => onTabChange('carte')}
            onSubmit={onSubmit}
          />
        </div>
      ) : null}

      {activeTab === 'missions' ? (
        <MissionList
          missions={missions}
          validatedMissionIds={validatedMissionIds}
          onValidateMission={onValidateMission}
        />
      ) : null}

      {activeTab === 'credits' ? (
        <CreditsView
          balance={credits}
          missionCreditNotice={missionCreditNotice}
          missions={missions}
          passes={passes}
          transactions={transactions}
          validatedMissionIds={validatedMissionIds}
          onRedeemReward={onRedeemReward}
          onTabChange={onTabChange}
          onValidateMission={onValidateMission}
        />
      ) : null}

      {activeTab === 'profil' ? (
        <ProfileView
          key={profileInitialSection}
          credits={credits}
          initialSection={profileInitialSection}
          session={session}
          reports={reports}
          missions={missions}
          onLogout={onLogout}
          onSessionUpdate={onSessionUpdate}
          onTabChange={onTabChange}
        />
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
        <MissionList compact missions={missions.slice(0, 2)} />
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
  credits,
  missions,
  newMissionAssignee,
  newMissionDate,
  passes,
  reports,
  selectedReport,
  transactions,
  onAssigneeChange,
  onBackToCitizen,
  onDateChange,
  onMissionCreate,
  onSelectReport,
}: {
  cityStats: { critical: number; unresolved: number };
  credits: number;
  missions: Mission[];
  newMissionAssignee: string;
  newMissionDate: string;
  passes: RewardPass[];
  reports: RiskReport[];
  selectedReport: RiskReport;
  transactions: CreditTransaction[];
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
          <SideNavItem icon={Coins} label="Crédits & territoire" />
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
          <LocalImpactPanel
            balance={credits}
            passes={passes}
            transactions={transactions}
          />
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
          <TerritoryCreditsPanel passes={passes} transactions={transactions} />
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
          <PartnerSpacePreview />
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
          <Button
            type="submit"
            className="h-11 w-full rounded-md bg-[#1E3D2F] text-white hover:bg-[#123426]"
          >
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
  onSubmit,
  onViewReport,
}: {
  onSubmit: (payload: ReportFormPayload) => RiskReport;
  onViewReport: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<RiskCategory | ''>('');
  const [danger, setDanger] = useState<DangerLevel | ''>('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [photoLabel, setPhotoLabel] = useState('Aucune photo');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [locationCoords, setLocationCoords] = useState<GeoPoint | null>(null);
  const [locationStatus, setLocationStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');
  const [errors, setErrors] = useState<ReportFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  function updateField<Key extends keyof ReportFormErrors>(
    key: Key,
    updater: () => void,
  ) {
    updater();
    setErrors((currentErrors) => ({ ...currentErrors, [key]: undefined }));
  }

  function validateForm() {
    const nextErrors: ReportFormErrors = {};

    if (!title.trim()) {
      nextErrors.title = 'Indiquez le nom du signalement.';
    }

    if (!category) {
      nextErrors.category = 'Sélectionnez un type de risque.';
    }

    if (!danger) {
      nextErrors.danger = 'Sélectionnez un niveau de danger.';
    }

    if (!address.trim() && !locationCoords) {
      nextErrors.address = 'Renseignez une localisation.';
    }

    if (!photoPreview) {
      nextErrors.photo = 'Ajoutez une photo du terrain.';
    }

    if (!description.trim()) {
      nextErrors.description = 'Décrivez brièvement la situation.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleLocate() {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      setErrors((currentErrors) => ({
        ...currentErrors,
        address:
          'Impossible de récupérer votre position. Vous pouvez renseigner l’adresse manuellement.',
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const detectedPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setLocationCoords({
          lat: detectedPosition.lat,
          lng: detectedPosition.lng,
        });
        setAddress(
          `Position actuelle détectée (${detectedPosition.lat.toFixed(5)}, ${detectedPosition.lng.toFixed(5)})`,
        );
        setLocationStatus('success');
        setErrors((currentErrors) => ({
          ...currentErrors,
          address: undefined,
        }));
      },
      () => {
        setLocationStatus('error');
        setErrors((currentErrors) => ({
          ...currentErrors,
          address:
            'Impossible de récupérer votre position. Vous pouvez renseigner l’adresse manuellement.',
        }));
      },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 7000 },
    );
  }

  function handlePhotoChange(file?: File) {
    if (!file) {
      return;
    }

    setPhotoPreview((currentPreview) => {
      if (currentPreview) {
        URL.revokeObjectURL(currentPreview);
      }

      return URL.createObjectURL(file);
    });
    setPhotoLabel(file.name || 'Photo ajoutée');
    setErrors((currentErrors) => ({ ...currentErrors, photo: undefined }));
  }

  function removePhoto() {
    setPhotoPreview((currentPreview) => {
      if (currentPreview) {
        URL.revokeObjectURL(currentPreview);
      }

      return null;
    });
    setPhotoLabel('Aucune photo');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function resetForm() {
    setTitle('');
    setCategory('');
    setDanger('');
    setAddress('');
    setDescription('');
    setPhotoLabel('Aucune photo');
    setPhotoPreview((currentPreview) => {
      if (currentPreview) {
        URL.revokeObjectURL(currentPreview);
      }

      return null;
    });
    setLocationCoords(null);
    setLocationStatus('idle');
    setErrors({});
    setIsConfirmed(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handleSubmit(event: FormSubmitEvent) {
    event.preventDefault();

    if (!validateForm() || !category || !danger) {
      return;
    }

    setIsSubmitting(true);
    window.setTimeout(() => {
      onSubmit({
        title: title.trim(),
        category,
        danger,
        address: address.trim() || 'Position GPS à Fondettes',
        description: description.trim(),
        photoLabel,
        located: Boolean(locationCoords),
        geo: locationCoords ?? undefined,
      });
      setIsSubmitting(false);
      setIsConfirmed(true);
    }, 500);
  }

  return (
    <section className="brand-card p-5 sm:p-6">
      <div>
        <h1 className="text-2xl font-extrabold">Signaler un risque</h1>
        <p className="mt-1 text-[#5B7867]">
          Un signalement clair aide la mairie à vérifier rapidement.
        </p>
      </div>

      {isConfirmed ? (
        <div className="mt-6 rounded-md border border-[#A8C5B1] bg-[#F7F5F0] p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-md bg-[#1E3D2F] text-white">
              <CheckCircle2 size={22} />
            </span>
            <div>
              <h2 className="text-xl font-extrabold">Signalement envoyé ✓</h2>
              <p className="mt-2 text-sm leading-6 text-[#5B7867]">
                Merci Lucas. Votre signalement a bien été transmis aux services
                municipaux de Fondettes.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
            <Button
              className="h-11 rounded-md bg-[#D9643D] text-base font-bold text-white hover:bg-[#C6532E]"
              type="button"
              onClick={onViewReport}
            >
              Voir mon signalement
            </Button>
            <Button variant="outline" type="button" onClick={resetForm}>
              Faire un nouveau signalement
            </Button>
          </div>
        </div>
      ) : (
        <form className="mt-6 space-y-4" noValidate onSubmit={handleSubmit}>
          <Field error={errors.title} label="Signalement">
            <Input
              aria-invalid={Boolean(errors.title)}
              name="title"
              placeholder="Ex. Végétation sèche chemin des Pins"
              required
              value={title}
              onChange={(event) =>
                updateField('title', () => setTitle(event.target.value))
              }
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field error={errors.category} label="Type">
              <NativeSelect
                aria-invalid={Boolean(errors.category)}
                className="w-full"
                name="category"
                required
                value={category}
                onChange={(event) =>
                  updateField('category', () =>
                    setCategory(event.target.value as RiskCategory),
                  )
                }
              >
                <NativeSelectOption value="" disabled>
                  Sélectionner
                </NativeSelectOption>
                {reportTypeOptions.map((option) => (
                  <NativeSelectOption key={option.value} value={option.value}>
                    {option.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field error={errors.danger} label="Danger">
              <NativeSelect
                aria-invalid={Boolean(errors.danger)}
                className={`w-full ${danger ? dangerStyles[danger] : ''}`}
                name="danger"
                required
                value={danger}
                onChange={(event) =>
                  updateField('danger', () =>
                    setDanger(event.target.value as DangerLevel),
                  )
                }
              >
                <NativeSelectOption value="" disabled>
                  Sélectionner
                </NativeSelectOption>
                {reportDangerOptions.map((option) => (
                  <NativeSelectOption key={option.value} value={option.value}>
                    {option.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
          </div>

          <Field error={errors.address} label="Localisation">
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <Input
                aria-invalid={Boolean(errors.address)}
                name="address"
                placeholder="Adresse ou lieu à Fondettes"
                required
                value={address}
                onChange={(event) =>
                  updateField('address', () => setAddress(event.target.value))
                }
              />
              <Button
                aria-label="Me localiser"
                className="h-10 px-3"
                type="button"
                variant="outline"
                onClick={handleLocate}
              >
                <LocateFixed size={17} />
              </Button>
            </div>
            {locationStatus === 'success' ? (
              <p className="text-sm text-[#5B7867]">
                Position ajoutée au signalement.
              </p>
            ) : null}
          </Field>

          <Field error={errors.photo} label="Photo">
            <button
              aria-label="Ajouter une photo du terrain"
              className="field-upload"
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              {photoPreview ? (
                <Image
                  alt="Aperçu ajouté"
                  className="h-52 w-full rounded-md object-cover"
                  height={360}
                  unoptimized
                  width={640}
                  src={photoPreview}
                />
              ) : (
                <>
                  <Upload className="mb-2 text-[#1E3D2F]" size={22} />
                  <span className="font-bold">Aucune photo</span>
                  <span className="text-[#5B7867]">
                    Ajouter une photo du terrain
                  </span>
                </>
              )}
            </button>
            {photoPreview ? (
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  size="sm"
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Modifier
                </Button>
                <Button
                  size="sm"
                  type="button"
                  variant="ghost"
                  onClick={removePhoto}
                >
                  Supprimer
                </Button>
              </div>
            ) : null}
            <input
              ref={fileInputRef}
              className="sr-only"
              name="photo"
              type="file"
              accept="image/*"
              onChange={(event) => handlePhotoChange(event.target.files?.[0])}
            />
          </Field>

          <Field error={errors.description} label="Description">
            <Textarea
              aria-invalid={Boolean(errors.description)}
              className="min-h-32"
              name="description"
              placeholder="Décrivez la zone, l’urgence et les conditions d’accès."
              required
              value={description}
              onChange={(event) =>
                updateField('description', () =>
                  setDescription(event.target.value),
                )
              }
            />
          </Field>

          <Button
            className="h-12 w-full rounded-md bg-[#D9643D] text-base font-bold text-white hover:bg-[#C6532E] disabled:opacity-70"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Envoi en cours...' : 'Envoyer le signalement'}
          </Button>
        </form>
      )}
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
        <Button
          type="submit"
          className="h-11 w-full rounded-md bg-[#D9643D] text-white hover:bg-[#C6532E]"
        >
          Créer la mission
        </Button>
      </form>
    </section>
  );
}

function MissionList({
  compact = false,
  missions,
  validatedMissionIds = [],
  onValidateMission,
}: {
  compact?: boolean;
  missions: Mission[];
  validatedMissionIds?: string[];
  onValidateMission?: (mission: Mission) => void;
}) {
  return (
    <section
      className={compact ? 'brand-card p-4' : 'grid gap-3 md:grid-cols-2'}
    >
      {compact ? <SectionTitle>Missions proches</SectionTitle> : null}
      <div className={compact ? 'mt-4 space-y-3' : 'contents'}>
        {missions.map((mission) => (
          <MissionPreview
            key={mission.id}
            mission={mission}
            validated={validatedMissionIds.includes(mission.id)}
            onValidateMission={onValidateMission}
          />
        ))}
      </div>
    </section>
  );
}

function ProfileView({
  credits,
  initialSection,
  session,
  reports,
  missions,
  onLogout,
  onSessionUpdate,
  onTabChange,
}: {
  credits: number;
  initialSection: ProfileSection;
  session: DemoSession;
  reports: RiskReport[];
  missions: Mission[];
  onLogout: () => void;
  onSessionUpdate: (session: DemoSession) => void;
  onTabChange: (tab: CitizenTab) => void;
}) {
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [profile, setProfile] = useState<ProfileData>(() =>
    getInitialProfile(session),
  );
  const [draftProfile, setDraftProfile] = useState<ProfileData>(() =>
    getInitialProfile(session),
  );
  const [activeSection, setActiveSection] =
    useState<ProfileSection>(initialSection);
  const [editingInfo, setEditingInfo] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timer = window.setTimeout(() => setToastMessage(''), 2200);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  function saveProfile(nextProfile: ProfileData, syncSession = false) {
    setProfile(nextProfile);
    setDraftProfile(nextProfile);
    window.localStorage.setItem(profileKey, JSON.stringify(nextProfile));
    setToastMessage('Modifications enregistrées ✓');

    if (syncSession) {
      onSessionUpdate({
        firstName: nextProfile.firstName,
        lastName: nextProfile.lastName,
        email: nextProfile.email,
        town: nextProfile.town,
      });
    }
  }

  function saveInfo() {
    saveProfile(draftProfile, true);
    setEditingInfo(false);
  }

  function cancelInfoEdit() {
    setDraftProfile(profile);
    setEditingInfo(false);
  }

  function handleAvatar(file?: File) {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const avatarUrl =
        typeof reader.result === 'string' ? reader.result : undefined;

      if (avatarUrl) {
        saveProfile({ ...profile, avatarUrl });
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <section className="mx-auto max-w-5xl space-y-5">
      <section className="brand-card p-5 sm:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div>
              <button
                aria-label="Changer ma photo"
                className="grid size-20 place-items-center overflow-hidden rounded-full bg-[#1E3D2F] text-3xl font-extrabold text-white transition hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5BA681]"
                type="button"
                onClick={() => avatarInputRef.current?.click()}
              >
                {profile.avatarUrl ? (
                  <Image
                    alt="Avatar de Lucas"
                    className="h-full w-full object-cover"
                    height={96}
                    src={profile.avatarUrl}
                    unoptimized
                    width={96}
                  />
                ) : (
                  profile.firstName[0]
                )}
              </button>
              <input
                ref={avatarInputRef}
                className="sr-only"
                type="file"
                accept="image/*"
                onChange={(event) => handleAvatar(event.target.files?.[0])}
              />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold">
                {profile.firstName} {profile.lastName}
              </h1>
              <p className="mt-1 flex items-center gap-1 font-semibold text-[#5B7867]">
                <MapPin size={16} />
                {profile.town}
              </p>
              <p className="mt-1 text-sm text-[#5B7867]">
                Membre depuis {profile.memberSince}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  type="button"
                  variant="outline"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  Changer ma photo
                </Button>
                {profile.avatarUrl ? (
                  <>
                    <Button
                      size="sm"
                      type="button"
                      variant="outline"
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      Modifier
                    </Button>
                    <Button
                      size="sm"
                      type="button"
                      variant="ghost"
                      onClick={() =>
                        saveProfile({ ...profile, avatarUrl: undefined })
                      }
                    >
                      Supprimer
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          </div>
          <Button
            className="h-11 rounded-md bg-[#D9643D] text-white hover:bg-[#C6532E]"
            type="button"
            onClick={() => {
              setActiveSection('info');
              setEditingInfo(true);
            }}
          >
            <Edit3 size={16} />
            Modifier mon profil
          </Button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <ProfileMetricButton
            label="Signalements"
            value={reports.length}
            onClick={() => onTabChange('carte')}
          />
          <ProfileMetricButton
            label="Missions"
            value={missions.length}
            onClick={() => onTabChange('missions')}
          />
          <ProfileMetricButton
            label="Mes crédits"
            value={credits}
            tone="orange"
            onClick={() => onTabChange('credits')}
          />
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="brand-card hidden h-fit p-4 lg:block">
          <SectionTitle>Mon compte</SectionTitle>
          <nav className="mt-4 space-y-2">
            {profileSections.map((section) => (
              <ProfileNavButton
                key={section.id}
                active={activeSection === section.id}
                icon={section.icon}
                label={section.label}
                onClick={() => setActiveSection(section.id)}
              />
            ))}
          </nav>
        </aside>

        <div className="space-y-5">
          <div className="grid gap-5 lg:hidden">
            <RecentActivityCard
              onOpenActivity={() => setActiveSection('info')}
            />
            <UpcomingProfileAction
              mission={missions[0]}
              onOpenMission={() => onTabChange('missions')}
            />
          </div>

          <section className="brand-card p-5 sm:p-6">
            <div className="mb-5 lg:hidden">
              <Label>Mon compte</Label>
              <NativeSelect
                className="mt-2 w-full"
                value={activeSection}
                onChange={(event) =>
                  setActiveSection(event.target.value as ProfileSection)
                }
              >
                {profileSections.map((section) => (
                  <NativeSelectOption key={section.id} value={section.id}>
                    {section.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>

            {activeSection === 'info' ? (
              <PersonalInfoSection
                draftProfile={draftProfile}
                editing={editingInfo}
                profile={profile}
                onCancel={cancelInfoEdit}
                onDraftChange={setDraftProfile}
                onEdit={() => setEditingInfo(true)}
                onSave={saveInfo}
              />
            ) : null}

            {activeSection === 'preferences' ? (
              <PreferencesSection profile={profile} onSave={saveProfile} />
            ) : null}

            {activeSection === 'availability' ? (
              <AvailabilitySection profile={profile} onSave={saveProfile} />
            ) : null}

            {activeSection === 'notifications' ? (
              <NotificationsSection profile={profile} onSave={saveProfile} />
            ) : null}

            {activeSection === 'security' ? (
              <SecuritySection
                profile={profile}
                onLogout={onLogout}
                onPasswordChange={() => setShowPasswordModal(true)}
                onSave={saveProfile}
                onDeleteAccount={() => setShowDeleteModal(true)}
              />
            ) : null}
          </section>
        </div>
      </div>

      <div className="hidden grid-cols-2 gap-5 lg:grid">
        <UpcomingProfileAction
          mission={missions[0]}
          onOpenMission={() => onTabChange('missions')}
        />
        <RecentActivityCard onOpenActivity={() => setActiveSection('info')} />
      </div>

      {toastMessage ? (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-md bg-[#1E3D2F] px-4 py-3 text-sm font-bold text-white shadow-xl md:bottom-6">
          {toastMessage}
        </div>
      ) : null}

      {showPasswordModal ? (
        <PasswordModal
          onClose={() => setShowPasswordModal(false)}
          onSave={() => {
            setShowPasswordModal(false);
            setToastMessage('Modifications enregistrées ✓');
          }}
        />
      ) : null}

      {showDeleteModal ? (
        <DeleteAccountModal
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={() => {
            setShowDeleteModal(false);
            onLogout();
          }}
        />
      ) : null}
    </section>
  );
}

function ProfileMetricButton({
  label,
  value,
  tone = 'white',
  onClick,
}: {
  label: string;
  value: number;
  tone?: 'white' | 'orange';
  onClick: () => void;
}) {
  return (
    <button
      className={`rounded-md border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5BA681] ${
        tone === 'orange'
          ? 'border-[#D9643D] bg-[#D9643D] text-white'
          : 'border-[#D9DDD8] bg-white text-[#1E3D2F]'
      }`}
      type="button"
      onClick={onClick}
    >
      <span className="block text-3xl font-extrabold leading-none">
        {value}
      </span>
      <span className="mt-2 block text-sm font-bold">{label}</span>
      {tone === 'orange' ? (
        <span className="mt-2 block text-sm font-semibold">
          Voir mes récompenses →
        </span>
      ) : null}
    </button>
  );
}

function ProfileNavButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-bold transition ${
        active
          ? 'bg-[#EEF1EE] text-[#1E3D2F]'
          : 'text-[#5B7867] hover:bg-[#F7F5F0] hover:text-[#1E3D2F]'
      }`}
      type="button"
      onClick={onClick}
    >
      <Icon size={17} strokeWidth={1.8} />
      {label}
    </button>
  );
}

function PersonalInfoSection({
  draftProfile,
  editing,
  profile,
  onCancel,
  onDraftChange,
  onEdit,
  onSave,
}: {
  draftProfile: ProfileData;
  editing: boolean;
  profile: ProfileData;
  onCancel: () => void;
  onDraftChange: (profile: ProfileData) => void;
  onEdit: () => void;
  onSave: () => void;
}) {
  const rows: {
    key: keyof Pick<
      ProfileData,
      | 'firstName'
      | 'lastName'
      | 'email'
      | 'phone'
      | 'town'
      | 'postalCode'
      | 'address'
    >;
    label: string;
    type?: string;
  }[] = [
    { key: 'firstName', label: 'Prénom' },
    { key: 'lastName', label: 'Nom' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'phone', label: 'Téléphone', type: 'tel' },
    { key: 'town', label: 'Commune' },
    { key: 'postalCode', label: 'Code postal' },
    { key: 'address', label: 'Adresse' },
  ];

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold">Informations personnelles</h2>
          <p className="mt-1 text-sm text-[#5B7867]">
            Ces informations restent modifiables dans ce prototype.
          </p>
        </div>
        {editing ? (
          <div className="flex gap-2">
            <Button variant="outline" type="button" onClick={onCancel}>
              Annuler
            </Button>
            <Button
              className="rounded-md bg-[#D9643D] text-white hover:bg-[#C6532E]"
              type="button"
              onClick={onSave}
            >
              Enregistrer
            </Button>
          </div>
        ) : (
          <Button variant="outline" type="button" onClick={onEdit}>
            Modifier
          </Button>
        )}
      </div>

      <div className="mt-5 grid gap-3">
        {rows.map((row) => (
          <div
            key={row.key}
            className="grid gap-2 rounded-md border border-[#D9DDD8] bg-[#FFFDF8] p-3 sm:grid-cols-[150px_1fr]"
          >
            <Label>{row.label}</Label>
            {editing ? (
              <Input
                type={row.type ?? 'text'}
                value={draftProfile[row.key] as string}
                onChange={(event) =>
                  onDraftChange({
                    ...draftProfile,
                    [row.key]: event.target.value,
                  })
                }
              />
            ) : (
              <p className="font-semibold text-[#1E3D2F]">
                {profile[row.key] as string}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PreferencesSection({
  profile,
  onSave,
}: {
  profile: ProfileData;
  onSave: (profile: ProfileData) => void;
}) {
  const interests: {
    key: keyof ProfileData['missionInterests'];
    label: string;
  }[] = [
    { key: 'vegetationCare', label: 'Entretien de végétation' },
    { key: 'stormCleanup', label: 'Nettoyage après intempéries' },
    { key: 'terrainCheck', label: 'Vérification terrain' },
    { key: 'collectiveOperations', label: 'Opérations collectives' },
  ];
  const distances = ['1 km', '3 km', '5 km', '10 km', 'Toute la commune'];

  return (
    <div>
      <h2 className="text-xl font-extrabold">Mes préférences Riskéo</h2>
      <p className="mt-1 text-sm leading-6 text-[#5B7867]">
        Personnalisez les missions et informations que vous souhaitez recevoir.
      </p>

      <div className="mt-5 space-y-5">
        <section>
          <h3 className="font-extrabold">Je souhaite participer à</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {interests.map((item) => (
              <CheckRow
                key={item.key}
                checked={profile.missionInterests[item.key]}
                label={item.label}
                onChange={(checked) =>
                  onSave({
                    ...profile,
                    missionInterests: {
                      ...profile.missionInterests,
                      [item.key]: checked,
                    },
                  })
                }
              />
            ))}
          </div>
        </section>

        <section>
          <h3 className="font-extrabold">Distance maximale</h3>
          <p className="mt-1 text-sm text-[#5B7867]">
            Affichez en priorité les missions proches de chez vous.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {distances.map((distance) => (
              <button
                key={distance}
                className={`min-h-10 rounded-md border px-3 py-2 text-sm font-bold ${
                  profile.maxDistance === distance
                    ? 'border-[#1E3D2F] bg-[#EEF1EE] text-[#1E3D2F]'
                    : 'border-[#D9DDD8] bg-white text-[#5B7867]'
                }`}
                type="button"
                onClick={() => onSave({ ...profile, maxDistance: distance })}
              >
                {distance}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="font-extrabold">Missions que je souhaite voir</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <CheckRow
              checked={profile.missionDifficulty.simple}
              label="Mission citoyenne simple"
              onChange={(checked) =>
                onSave({
                  ...profile,
                  missionDifficulty: {
                    ...profile.missionDifficulty,
                    simple: checked,
                  },
                })
              }
            />
            <CheckRow
              checked={profile.missionDifficulty.supervised}
              label="Mission citoyenne encadrée"
              onChange={(checked) =>
                onSave({
                  ...profile,
                  missionDifficulty: {
                    ...profile.missionDifficulty,
                    supervised: checked,
                  },
                })
              }
            />
          </div>
          <p className="mt-3 rounded-md bg-[#F7F5F0] p-3 text-sm leading-6 text-[#5B7867]">
            Les interventions nécessitant du matériel ou des compétences
            professionnelles ne sont jamais proposées aux citoyens.
          </p>
        </section>
      </div>
    </div>
  );
}

function AvailabilitySection({
  profile,
  onSave,
}: {
  profile: ProfileData;
  onSave: (profile: ProfileData) => void;
}) {
  const slots = [
    { key: 'morning' as const, label: 'Matin' },
    { key: 'afternoon' as const, label: 'Après-midi' },
    { key: 'evening' as const, label: 'Soir' },
  ];
  const pauseEndLabel = profile.pauseMissions.endDate
    ? new Date(profile.pauseMissions.endDate).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
      })
    : '18 septembre';

  return (
    <div>
      <h2 className="text-xl font-extrabold">Mes disponibilités</h2>
      <p className="mt-1 text-sm leading-6 text-[#5B7867]">
        Indiquez quand vous êtes généralement disponible afin que Riskéo vous
        recommande les missions les plus adaptées.
      </p>

      <div className="mt-5 overflow-x-auto">
        <div className="min-w-[560px] rounded-md border border-[#D9DDD8] bg-[#FFFDF8]">
          {Object.entries(profile.availability).map(([day, values]) => (
            <div
              key={day}
              className="grid grid-cols-[120px_repeat(3,1fr)] gap-2 border-b border-[#E0D6C4] p-3 last:border-b-0"
            >
              <p className="font-extrabold">{day}</p>
              {slots.map((slot) => (
                <button
                  key={`${day}-${slot.key}`}
                  className={`min-h-10 rounded-md border px-3 py-2 text-sm font-bold transition ${
                    values[slot.key]
                      ? 'border-[#1E3D2F] bg-[#EEF1EE] text-[#1E3D2F]'
                      : 'border-[#D9DDD8] bg-white text-[#5B7867] hover:border-[#5BA681]'
                  }`}
                  type="button"
                  onClick={() =>
                    onSave({
                      ...profile,
                      availability: {
                        ...profile.availability,
                        [day]: {
                          ...values,
                          [slot.key]: !values[slot.key],
                        },
                      },
                    })
                  }
                >
                  {slot.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <CheckRow
          checked={profile.weekendPreferred}
          label="Je préfère les missions le week-end"
          onChange={(checked) =>
            onSave({ ...profile, weekendPreferred: checked })
          }
        />
      </div>

      <section className="mt-5 rounded-md border border-[#D9DDD8] bg-[#F7F5F0] p-4">
        <h3 className="font-extrabold">Indisponibilité temporaire</h3>
        <p className="mt-1 text-sm leading-6 text-[#5B7867]">
          Vous partez en vacances ? Suspendez les recommandations de missions
          temporairement.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Date de début">
            <Input
              type="date"
              value={profile.pauseMissions.startDate}
              onChange={(event) =>
                onSave({
                  ...profile,
                  pauseMissions: {
                    ...profile.pauseMissions,
                    startDate: event.target.value,
                  },
                })
              }
            />
          </Field>
          <Field label="Date de fin">
            <Input
              type="date"
              value={profile.pauseMissions.endDate}
              onChange={(event) =>
                onSave({
                  ...profile,
                  pauseMissions: {
                    ...profile.pauseMissions,
                    endDate: event.target.value,
                  },
                })
              }
            />
          </Field>
        </div>
        {profile.pauseMissions.active ? (
          <p className="mt-3 text-sm font-bold text-[#1E3D2F]">
            Missions en pause jusqu’au {pauseEndLabel}.
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            className="rounded-md bg-[#1E3D2F] text-white hover:bg-[#173326]"
            type="button"
            onClick={() =>
              onSave({
                ...profile,
                pauseMissions: {
                  active: true,
                  startDate:
                    profile.pauseMissions.startDate ||
                    new Date().toISOString().slice(0, 10),
                  endDate: profile.pauseMissions.endDate || '2026-09-18',
                },
              })
            }
          >
            Mettre les missions en pause
          </Button>
          {profile.pauseMissions.active ? (
            <Button
              variant="outline"
              type="button"
              onClick={() =>
                onSave({
                  ...profile,
                  pauseMissions: {
                    ...profile.pauseMissions,
                    active: false,
                  },
                })
              }
            >
              Réactiver maintenant
            </Button>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function NotificationsSection({
  profile,
  onSave,
}: {
  profile: ProfileData;
  onSave: (profile: ProfileData) => void;
}) {
  const notificationGroups = [
    {
      title: 'Activité Riskéo',
      items: [
        ['reportStatus', 'Nouveau statut sur mon signalement'],
        ['reportValidated', 'Signalement validé'],
        ['missionFromReport', 'Mission créée depuis mon signalement'],
        ['missionValidated', 'Mission validée'],
        ['creditsReceived', 'Crédits reçus'],
      ],
    },
    {
      title: 'Missions',
      items: [
        ['nearbyMission', 'Nouvelle mission près de chez moi'],
        ['missionReminder', 'Rappel avant une mission'],
        ['missionChange', 'Changement concernant une mission'],
      ],
    },
    {
      title: 'Territoire',
      items: [
        ['cityInfo', 'Informations importantes de la mairie'],
        ['localAlerts', 'Alertes Riskéo à Fondettes'],
      ],
    },
  ] as const;

  return (
    <div>
      <h2 className="text-xl font-extrabold">Notifications</h2>
      <div className="mt-5 grid gap-5">
        {notificationGroups.map((group) => (
          <section key={group.title}>
            <h3 className="font-extrabold">{group.title}</h3>
            <div className="mt-3 grid gap-2">
              {group.items.map(([key, label]) => (
                <CheckRow
                  key={key}
                  checked={profile.notifications[key]}
                  label={label}
                  onChange={(checked) =>
                    onSave({
                      ...profile,
                      notifications: {
                        ...profile.notifications,
                        [key]: checked,
                      },
                    })
                  }
                />
              ))}
            </div>
          </section>
        ))}

        <section>
          <h3 className="font-extrabold">
            Comment souhaitez-vous être informé ?
          </h3>
          <p className="mt-1 text-sm leading-6 text-[#5B7867]">
            Les préférences sont conservées ici, sans envoi réel d’email ou de
            SMS dans ce prototype.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <CheckRow
              checked={profile.channels.inApp}
              label="Notifications dans Riskéo"
              onChange={(checked) =>
                onSave({
                  ...profile,
                  channels: { ...profile.channels, inApp: checked },
                })
              }
            />
            <CheckRow
              checked={profile.channels.email}
              label="Email"
              onChange={(checked) =>
                onSave({
                  ...profile,
                  channels: { ...profile.channels, email: checked },
                })
              }
            />
            <CheckRow
              checked={profile.channels.sms}
              label="SMS"
              onChange={(checked) =>
                onSave({
                  ...profile,
                  channels: { ...profile.channels, sms: checked },
                })
              }
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function SecuritySection({
  profile,
  onLogout,
  onPasswordChange,
  onSave,
  onDeleteAccount,
}: {
  profile: ProfileData;
  onLogout: () => void;
  onPasswordChange: () => void;
  onSave: (profile: ProfileData) => void;
  onDeleteAccount: () => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-extrabold">Sécurité & confidentialité</h2>

      <section className="mt-5 rounded-md border border-[#D9DDD8] bg-[#FFFDF8] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-extrabold">Mot de passe</h3>
            <p className="mt-1 font-semibold text-[#5B7867]">••••••••••••</p>
          </div>
          <Button variant="outline" type="button" onClick={onPasswordChange}>
            Modifier mon mot de passe
          </Button>
        </div>
      </section>

      <section className="mt-5 rounded-md border border-[#D9DDD8] bg-[#FFFDF8] p-4">
        <h3 className="font-extrabold">Visibilité de mes contributions</h3>
        <ToggleRow
          checked={profile.privacy.cityIdentityVisible}
          label="La mairie peut voir mon identité lorsque je réalise un signalement ou une mission."
          onChange={(checked) =>
            onSave({
              ...profile,
              privacy: { ...profile.privacy, cityIdentityVisible: checked },
            })
          }
        />
        <p className="mt-3 text-sm leading-6 text-[#5B7867]">
          Votre identité n’est pas affichée publiquement sur la carte Riskéo.
        </p>
      </section>

      <section className="mt-5 rounded-md border border-[#D9DDD8] bg-[#FFFDF8] p-4">
        <h3 className="font-extrabold">Localisation</h3>
        <ToggleRow
          checked={profile.privacy.locationAllowed}
          label="Autoriser Riskéo à utiliser ma position lorsque je demande à être localisé."
          onChange={(checked) =>
            onSave({
              ...profile,
              privacy: { ...profile.privacy, locationAllowed: checked },
            })
          }
        />
        <p className="mt-3 text-sm leading-6 text-[#5B7867]">
          Votre localisation n’est utilisée que lorsque vous activez
          volontairement une fonctionnalité nécessitant votre position.
        </p>
      </section>

      <section className="mt-5 rounded-md border border-[#D9DDD8] bg-[#F7F5F0] p-4">
        <h3 className="font-extrabold">Session</h3>
        <Button
          className="mt-3"
          variant="outline"
          type="button"
          onClick={onLogout}
        >
          Se déconnecter
        </Button>
      </section>

      <section className="mt-5 rounded-md border border-[#E3B09C] bg-[#FFF3EF] p-4">
        <h3 className="font-extrabold text-[#9E3B1E]">Supprimer mon compte</h3>
        <p className="mt-2 text-sm leading-6 text-[#7D4B3D]">
          Cette action supprimera vos informations personnelles. L’historique
          anonymisé nécessaire au suivi des interventions pourra être conservé.
        </p>
        <Button
          className="mt-4 rounded-md text-[#B84320]"
          type="button"
          variant="outline"
          onClick={onDeleteAccount}
        >
          <Trash2 size={16} />
          Supprimer mon compte
        </Button>
      </section>
    </div>
  );
}

function UpcomingProfileAction({
  mission,
  onOpenMission,
}: {
  mission?: Mission;
  onOpenMission: () => void;
}) {
  return (
    <section className="brand-card p-5">
      <SectionTitle>À venir</SectionTitle>
      {mission ? (
        <div className="mt-4">
          <p className="text-sm font-bold text-[#5B7867]">
            Mission samedi à 9 h
          </p>
          <h3 className="mt-1 text-lg font-extrabold">{mission.title}</h3>
          <p className="mt-1 text-sm text-[#5B7867]">Fondettes</p>
          <p className="mt-3 text-sm font-extrabold text-[#D9643D]">
            +{formatCredits(mission.creditsReward ?? 300)} après validation
          </p>
          <Button
            className="mt-4 rounded-md bg-[#1E3D2F] text-white hover:bg-[#173326]"
            type="button"
            onClick={onOpenMission}
          >
            Voir la mission
          </Button>
        </div>
      ) : (
        <p className="mt-4 text-sm text-[#5B7867]">
          Vous n’avez aucune mission prévue.
        </p>
      )}
    </section>
  );
}

function RecentActivityCard({
  onOpenActivity,
}: {
  onOpenActivity: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const activities = expanded
    ? recentProfileActivity
    : recentProfileActivity.slice(0, 3);

  return (
    <section className="brand-card p-5">
      <SectionTitle>Mon activité récente</SectionTitle>
      <div className="mt-4 space-y-3">
        {activities.map((activity) => (
          <div
            key={`${activity.title}-${activity.date}`}
            className="rounded-md border border-[#D9DDD8] bg-[#FFFDF8] p-3"
          >
            <p className="font-extrabold">{activity.title}</p>
            <p className="mt-1 text-sm text-[#5B7867]">{activity.detail}</p>
            <p className="mt-2 text-xs font-bold text-[#5B7867]">
              {activity.date}
            </p>
          </div>
        ))}
      </div>
      <Button
        className="mt-4"
        disabled={expanded}
        variant="outline"
        type="button"
        onClick={() => {
          setExpanded(true);
          onOpenActivity();
        }}
      >
        {expanded ? 'Activité affichée' : 'Voir toute mon activité'}
      </Button>
    </section>
  );
}

function CheckRow({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-[#D9DDD8] bg-[#FFFDF8] px-3 py-2 text-sm font-bold transition hover:border-[#5BA681]">
      <input
        className="size-4 accent-[#1E3D2F]"
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}

function ToggleRow({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      className="mt-3 flex w-full items-center justify-between gap-4 rounded-md border border-[#D9DDD8] bg-[#FFFDF8] p-3 text-left text-sm font-semibold transition hover:border-[#5BA681]"
      type="button"
      onClick={() => onChange(!checked)}
    >
      <span>{label}</span>
      <span
        className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition ${
          checked ? 'justify-end bg-[#1E3D2F]' : 'justify-start bg-[#D9DDD8]'
        }`}
      >
        <span className="size-5 rounded-full bg-white shadow" />
      </span>
    </button>
  );
}

function PasswordModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [saving, setSaving] = useState(false);
  const canSave =
    currentPassword.length > 0 &&
    newPassword.length >= 6 &&
    newPassword === confirmation;

  return (
    <ModalShell>
      <div className="w-full max-w-md rounded-lg bg-[#FFFDF8] p-5 shadow-2xl">
        <h2 className="text-xl font-extrabold">Modifier mon mot de passe</h2>
        <div className="mt-5 space-y-4">
          <Field label="Mot de passe actuel">
            <Input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </Field>
          <Field label="Nouveau mot de passe">
            <Input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </Field>
          <Field label="Confirmation">
            <Input
              aria-invalid={
                confirmation.length > 0 && newPassword !== confirmation
              }
              type="password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </Field>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button variant="outline" type="button" onClick={onClose}>
            Annuler
          </Button>
          <Button
            className="rounded-md bg-[#D9643D] text-white hover:bg-[#C6532E]"
            disabled={!canSave || saving}
            type="button"
            onClick={() => {
              setSaving(true);
              window.setTimeout(onSave, 450);
            }}
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}

function DeleteAccountModal({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <ModalShell>
      <div className="w-full max-w-md rounded-lg bg-[#FFFDF8] p-5 shadow-2xl">
        <h2 className="text-xl font-extrabold">
          Êtes-vous sûr de vouloir supprimer votre compte ?
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#5B7867]">
          Cette confirmation simule la suppression dans le prototype et vous
          déconnecte de Riskéo.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button variant="outline" type="button" onClick={onCancel}>
            Annuler
          </Button>
          <Button
            className="rounded-md bg-[#D9643D] text-white hover:bg-[#C6532E]"
            type="button"
            onClick={onConfirm}
          >
            Supprimer définitivement
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}

function CreditsView({
  balance,
  missionCreditNotice,
  missions,
  passes,
  transactions,
  validatedMissionIds,
  onRedeemReward,
  onTabChange,
  onValidateMission,
}: {
  balance: number;
  missionCreditNotice: number | null;
  missions: Mission[];
  passes: RewardPass[];
  transactions: CreditTransaction[];
  validatedMissionIds: string[];
  onRedeemReward: (reward: Reward) => void;
  onTabChange: (tab: CitizenTab) => void;
  onValidateMission: (mission: Mission) => void;
}) {
  const [filter, setFilter] = useState<RewardCategory | 'all' | 'nearby'>(
    'all',
  );
  const [view, setView] = useState<'rewards' | 'passes' | 'history' | 'earn'>(
    'rewards',
  );
  const activeRewards = rewards
    .filter((reward) => reward.active)
    .filter(
      (reward) =>
        filter === 'all' || filter === 'nearby' || reward.category === filter,
    )
    .sort((a, b) => a.creditsCost - b.creditsCost);
  const availableRewards = activeRewards.filter(
    (reward) => reward.creditsCost <= balance,
  );
  const soonRewards = activeRewards.filter(
    (reward) =>
      reward.creditsCost > balance && reward.creditsCost - balance <= 400,
  );
  const discoveryRewards = activeRewards.filter(
    (reward) => reward.creditsCost - balance > 400,
  );
  const nextReward = getNextReward(balance);
  const nextPartner = nextReward ? findPartner(nextReward.partnerId) : null;
  const nextMission = missions.find((mission) => mission.creditsReward);

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-5">
        <section className="brand-card p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-extrabold uppercase text-[#5B7867]">
                Mes crédits
              </p>
              <h1 className="mt-2 text-4xl font-extrabold">
                {formatCredits(balance)}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5B7867]">
                Vos missions et signalements validés vous permettent de gagner
                des crédits à utiliser à Fondettes.
              </p>
            </div>
            <Button
              className="h-11 rounded-md"
              type="button"
              variant="outline"
              onClick={() => setView('earn')}
            >
              Voir comment gagner des crédits
            </Button>
          </div>
        </section>

        {nextReward && nextPartner ? (
          <section className="brand-card overflow-hidden p-5 sm:p-6">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
              <div>
                <SectionTitle>Votre prochain objectif</SectionTitle>
                <div className="mt-5 flex items-start gap-4">
                  <CategoryBadge category={nextReward.category} />
                  <div>
                    <h2 className="text-2xl font-extrabold">
                      {nextReward.title}
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-[#5B7867]">
                      {nextPartner.name} · {nextPartner.location}
                    </p>
                    <p className="mt-3 text-lg font-extrabold text-[#1E3D2F]">
                      {formatCredits(nextReward.creditsCost)}
                    </p>
                    <p className="mt-1 text-sm font-bold text-[#D9643D]">
                      Plus que {formatCredits(nextReward.creditsCost - balance)}
                    </p>
                  </div>
                </div>
                <div className="mt-5">
                  <CreditProgress
                    current={balance}
                    target={nextReward.creditsCost}
                  />
                </div>
              </div>

              {nextMission ? (
                <div className="rounded-md border border-[#E0D6C4] bg-[#F7F5F0] p-4">
                  <p className="text-sm font-extrabold">
                    Une mission est disponible
                  </p>
                  <h3 className="mt-2 font-extrabold">{nextMission.title}</h3>
                  <p className="mt-2 text-sm text-[#5B7867]">
                    {nextMission.date} · +
                    {formatCredits(
                      (nextMission.creditsReward ?? 0) +
                        (nextMission.priorityBonus ?? 0),
                    )}
                  </p>
                  {missionCreditNotice ? (
                    <p className="mt-3 rounded-md bg-white px-3 py-2 text-sm font-extrabold text-[#1E3D2F]">
                      Mission validée ✓ +{formatCredits(missionCreditNotice)}
                    </p>
                  ) : null}
                  <div className="mt-4 grid gap-2">
                    <Button
                      className="rounded-md bg-[#D9643D] text-white hover:bg-[#C6532E]"
                      type="button"
                      onClick={() => onTabChange('missions')}
                    >
                      Voir les missions
                    </Button>
                    <Button
                      className="rounded-md"
                      disabled={validatedMissionIds.includes(nextMission.id)}
                      type="button"
                      variant="outline"
                      onClick={() => onValidateMission(nextMission)}
                    >
                      {validatedMissionIds.includes(nextMission.id)
                        ? 'Crédits attribués'
                        : 'Simuler la validation mairie'}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        <section className="brand-card p-5 sm:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <SectionTitle>Récompenses</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {(['rewards', 'passes', 'history', 'earn'] as const).map(
                (tab) => (
                  <button
                    key={tab}
                    className={`rounded-md px-3 py-2 text-sm font-bold ${
                      view === tab
                        ? 'bg-[#1E3D2F] text-white'
                        : 'bg-[#F7F5F0] text-[#5B7867]'
                    }`}
                    type="button"
                    onClick={() => setView(tab)}
                  >
                    {tab === 'rewards'
                      ? 'Catalogue'
                      : tab === 'passes'
                        ? 'Mes avantages'
                        : tab === 'history'
                          ? 'Historique'
                          : 'Gagner'}
                  </button>
                ),
              )}
            </div>
          </div>

          {view === 'rewards' ? (
            <>
              <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
                {rewardFilters.map((item) => (
                  <button
                    key={item.id}
                    className={`shrink-0 rounded-md border px-3 py-2 text-sm font-bold ${
                      filter === item.id
                        ? 'border-[#1E3D2F] bg-[#EEF1EE] text-[#1E3D2F]'
                        : 'border-[#D9DDD8] bg-white text-[#5B7867]'
                    }`}
                    type="button"
                    onClick={() => setFilter(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <RewardGroup
                balance={balance}
                rewards={availableRewards}
                title="Disponibles maintenant"
                onRedeemReward={onRedeemReward}
                onTabChange={onTabChange}
              />
              <RewardGroup
                balance={balance}
                rewards={soonRewards}
                title="Bientôt accessibles"
                onRedeemReward={onRedeemReward}
                onTabChange={onTabChange}
              />
              <RewardGroup
                balance={balance}
                rewards={discoveryRewards.slice(0, 6)}
                title="À découvrir"
                onRedeemReward={onRedeemReward}
                onTabChange={onTabChange}
              />
            </>
          ) : null}

          {view === 'passes' ? <PassesView passes={passes} /> : null}

          {view === 'history' ? (
            <CreditHistory transactions={transactions} />
          ) : null}

          {view === 'earn' ? <EarnCreditsView /> : null}
        </section>
      </div>

      <aside className="space-y-5">
        <CinemaMunicipalCard />
        <CreditLoopCard />
      </aside>
    </section>
  );
}

function RewardGroup({
  balance,
  rewards: rewardItems,
  title,
  onRedeemReward,
  onTabChange,
}: {
  balance: number;
  rewards: Reward[];
  title: string;
  onRedeemReward: (reward: Reward) => void;
  onTabChange: (tab: CitizenTab) => void;
}) {
  if (rewardItems.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <h3 className="text-lg font-extrabold">{title}</h3>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {rewardItems.map((reward) => (
          <RewardCard
            key={reward.id}
            balance={balance}
            reward={reward}
            onRedeemReward={onRedeemReward}
            onTabChange={onTabChange}
          />
        ))}
      </div>
    </div>
  );
}

function RewardCard({
  balance,
  reward,
  onRedeemReward,
  onTabChange,
}: {
  balance: number;
  reward: Reward;
  onRedeemReward: (reward: Reward) => void;
  onTabChange: (tab: CitizenTab) => void;
}) {
  const partner = findPartner(reward.partnerId);
  const canRedeem = balance >= reward.creditsCost;
  const remaining = reward.creditsCost - balance;

  return (
    <article className="grid gap-3 rounded-md border border-[#D9DDD8] bg-[#FFFDF8] p-3 shadow-sm sm:grid-cols-[74px_1fr]">
      <div className="grid h-20 place-items-center rounded-md bg-[#F7F5F0]">
        <CategoryBadge category={reward.category} />
      </div>
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold uppercase text-[#5B7867]">
              {rewardCategoryLabels[reward.category]}
            </p>
            <h4 className="mt-1 font-extrabold">{reward.title}</h4>
            <p className="mt-1 text-sm text-[#5B7867]">
              {partner.name} · Fondettes · {partner.distance}
            </p>
          </div>
          <span className="shrink-0 rounded-md bg-[#EEF1EE] px-2 py-1 text-sm font-extrabold text-[#1E3D2F]">
            {formatCredits(reward.creditsCost)}
          </span>
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {canRedeem ? (
            <p className="text-sm font-semibold text-[#5B7867]">
              Disponible maintenant
            </p>
          ) : (
            <p className="text-sm font-semibold text-[#D9643D]">
              Vous avez {formatCredits(balance)} · Plus que{' '}
              {formatCredits(remaining)}
            </p>
          )}
          <Button
            className={
              canRedeem
                ? 'rounded-md bg-[#D9643D] text-white hover:bg-[#C6532E]'
                : 'rounded-md'
            }
            type="button"
            variant={canRedeem ? 'default' : 'outline'}
            onClick={() =>
              canRedeem ? onRedeemReward(reward) : onTabChange('missions')
            }
          >
            {canRedeem
              ? reward.rewardType === 'booking'
                ? 'Réserver'
                : 'Débloquer'
              : 'Voir les missions'}
          </Button>
        </div>
      </div>
    </article>
  );
}

function PassesView({ passes }: { passes: RewardPass[] }) {
  const groups: { status: RewardPass['status']; title: string }[] = [
    { status: 'Valide', title: 'À utiliser' },
    { status: 'Utilise', title: 'Utilisés' },
    { status: 'Expire', title: 'Expirés' },
  ];

  return (
    <div className="mt-6 grid gap-4">
      {groups.map((group) => {
        const groupPasses = passes.filter(
          (pass) => pass.status === group.status,
        );

        return (
          <div key={group.status}>
            <h3 className="font-extrabold">{group.title}</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {groupPasses.length > 0 ? (
                groupPasses.map((pass) => (
                  <PassCard key={pass.id} pass={pass} />
                ))
              ) : (
                <p className="rounded-md border border-[#D9DDD8] bg-white p-3 text-sm text-[#5B7867]">
                  Aucun pass dans cette section.
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PassCard({ pass }: { pass: RewardPass }) {
  return (
    <article className="rounded-md border border-[#D9DDD8] bg-[#FFFDF8] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase text-[#5B7867]">
            Pass Riskéo
          </p>
          <h4 className="mt-1 font-extrabold">{pass.rewardTitle}</h4>
          <p className="mt-1 text-sm text-[#5B7867]">
            {pass.partnerName} · Fondettes
          </p>
        </div>
        <span className="rounded-full bg-[#EEF1EE] px-2 py-1 text-xs font-bold">
          {pass.status}
        </span>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="text-sm text-[#5B7867]">
          <p>Créé le {pass.createdAt}</p>
          <p>Valable jusqu’au {pass.expiresAt}</p>
          <p className="mt-2 font-mono text-xs">{pass.rewardRedemptionId}</p>
        </div>
        <QrCodeBox token={pass.rewardRedemptionId} />
      </div>
    </article>
  );
}

function CreditHistory({
  transactions,
}: {
  transactions: CreditTransaction[];
}) {
  return (
    <div className="mt-6 divide-y divide-[#E0D6C4] rounded-md border border-[#D9DDD8] bg-[#FFFDF8]">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="grid grid-cols-[80px_1fr_auto] items-center gap-3 p-4"
        >
          <span
            className={`text-xl font-extrabold ${
              transaction.type === 'earn' ? 'text-[#1E7D4A]' : 'text-[#D9643D]'
            }`}
          >
            {transaction.amount > 0 ? '+' : ''}
            {transaction.amount}
          </span>
          <div>
            <p className="font-extrabold">{transaction.label}</p>
            <p className="text-sm text-[#5B7867]">{transaction.createdAt}</p>
          </div>
          <ReceiptText className="text-[#5B7867]" size={18} />
        </div>
      ))}
    </div>
  );
}

function EarnCreditsView() {
  return (
    <div className="mt-6">
      <h3 className="text-xl font-extrabold">
        Gagnez des crédits en agissant pour Fondettes
      </h3>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {earningGuides.map((guide) => (
          <article
            key={guide.title}
            className="rounded-md border border-[#D9DDD8] bg-[#FFFDF8] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <h4 className="font-extrabold">{guide.title}</h4>
              <span className="rounded-md bg-[#EEF1EE] px-2 py-1 text-sm font-extrabold">
                +{formatCredits(guide.credits)}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#5B7867]">
              {guide.description}
            </p>
          </article>
        ))}
      </div>
      <p className="mt-5 rounded-md bg-[#F7F5F0] p-4 text-sm font-semibold text-[#1E3D2F]">
        Les crédits sont attribués après validation par la mairie :
        participation, photos, réalisation, envoi, validation, puis crédit.
      </p>
    </div>
  );
}

function CinemaMunicipalCard() {
  const cinema = partners.find((partner) => partner.id === 'cine-des-rives');

  if (!cinema) {
    return null;
  }

  return (
    <article className="brand-card overflow-hidden">
      <div className="terrain-thumb grid min-h-36 place-items-center">
        <Film className="text-[#1E3D2F]" size={48} />
      </div>
      <div className="p-4">
        <p className="text-xs font-extrabold uppercase text-[#5B7867]">
          Équipement municipal
        </p>
        <h3 className="mt-1 text-xl font-extrabold">{cinema.name}</h3>
        <p className="mt-1 text-sm font-semibold text-[#5B7867]">
          {cinema.subtitle}
        </p>
        <div className="mt-4 grid gap-2 text-sm text-[#5B7867]">
          <SmallMeta icon={MapPin}>{cinema.location}</SmallMeta>
          <SmallMeta icon={Film}>
            Séances généralistes et films famille
          </SmallMeta>
          <SmallMeta icon={Users}>
            Ciné-débats et événements municipaux
          </SmallMeta>
        </div>
      </div>
    </article>
  );
}

function CreditLoopCard() {
  return (
    <article className="brand-card p-4">
      <SectionTitle>Boucle citoyenne</SectionTitle>
      <div className="mt-4 space-y-2 text-sm font-bold text-[#1E3D2F]">
        {[
          'Mission',
          'Crédits',
          'Récompense',
          'Fondettes',
          'Nouvelle mission',
        ].map((item) => (
          <div
            key={item}
            className="rounded-md border border-[#D9DDD8] bg-[#FFFDF8] px-3 py-2"
          >
            {item}
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm leading-6 text-[#5B7867]">
        Agissez pour Fondettes, profitez-en à Fondettes.
      </p>
    </article>
  );
}

function CategoryBadge({ category }: { category: RewardCategory }) {
  const Icon = categoryIcons[category];

  return (
    <span className="grid size-12 shrink-0 place-items-center rounded-md bg-[#1E3D2F] text-white">
      <Icon size={24} strokeWidth={1.8} />
    </span>
  );
}

function CreditProgress({
  current,
  target,
}: {
  current: number;
  target: number;
}) {
  const progress = Math.min(Math.round((current / target) * 100), 100);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm font-bold text-[#5B7867]">
        <span>
          {formatCredits(current)} / {formatCredits(target)}
        </span>
        <span>{progress}%</span>
      </div>
      <div className="h-3 rounded-full bg-[#EEF1EE]">
        <span
          className="block h-3 rounded-full bg-[#D9643D]"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function RewardConfirmModal({
  balance,
  reward,
  onCancel,
  onConfirm,
}: {
  balance: number;
  reward: Reward;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <ModalShell>
      <div className="w-full max-w-md rounded-lg bg-[#FFFDF8] p-5 shadow-2xl">
        <SectionTitle>Utiliser vos crédits ?</SectionTitle>
        <div className="mt-5 rounded-md border border-[#D9DDD8] bg-[#F7F5F0] p-4">
          <h2 className="text-xl font-extrabold">{reward.title}</h2>
          <p className="mt-1 text-sm font-semibold text-[#5B7867]">
            {findPartner(reward.partnerId).name}
          </p>
          <p className="mt-4 text-2xl font-extrabold text-[#D9643D]">
            {formatCredits(reward.creditsCost)}
          </p>
        </div>
        <div className="mt-5 grid gap-2 text-sm font-semibold">
          <div className="flex justify-between">
            <span>Votre solde actuel</span>
            <span>{formatCredits(balance)}</span>
          </div>
          <div className="flex justify-between">
            <span>Nouveau solde</span>
            <span>{formatCredits(balance - reward.creditsCost)}</span>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button variant="outline" type="button" onClick={onCancel}>
            Annuler
          </Button>
          <Button
            className="rounded-md bg-[#D9643D] text-white hover:bg-[#C6532E]"
            type="button"
            onClick={onConfirm}
          >
            Confirmer
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}

function PassModal({
  pass,
  onClose,
}: {
  pass: RewardPass;
  onClose: () => void;
}) {
  return (
    <ModalShell>
      <div className="w-full max-w-md rounded-lg bg-[#FFFDF8] p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase text-[#5B7867]">
              Pass Riskéo
            </p>
            <h2 className="mt-1 text-2xl font-extrabold">{pass.rewardTitle}</h2>
            <p className="mt-1 font-semibold text-[#5B7867]">
              {pass.partnerName} — Fondettes
            </p>
          </div>
          <Button
            aria-label="Fermer"
            size="icon"
            type="button"
            variant="outline"
            onClick={onClose}
          >
            <X size={17} />
          </Button>
        </div>
        <div className="mt-6 grid place-items-center rounded-md border border-[#D9DDD8] bg-[#F7F5F0] p-5">
          <QrCodeBox token={pass.rewardRedemptionId} large />
        </div>
        <div className="mt-5 grid gap-2 text-sm font-semibold text-[#5B7867]">
          <p>Numéro unique : {pass.rewardRedemptionId}</p>
          <p>Créé le {pass.createdAt}</p>
          <p>Valable jusqu’au {pass.expiresAt}</p>
          <p>Statut : {pass.status}</p>
        </div>
        <Button
          className="mt-6 h-11 w-full rounded-md bg-[#1E3D2F] text-white hover:bg-[#173326]"
          type="button"
          onClick={onClose}
        >
          Terminer
        </Button>
      </div>
    </ModalShell>
  );
}

function QrCodeBox({
  token,
  large = false,
}: {
  token: string;
  large?: boolean;
}) {
  const cells = buildQrCells(token);

  return (
    <div
      aria-label={`QR code ${token}`}
      className={`grid grid-cols-7 gap-1 rounded-md bg-white p-2 ${
        large ? 'size-40' : 'size-24'
      }`}
    >
      {cells.map((filled, index) => (
        <span
          key={`${token}-${index}`}
          className={
            filled ? 'rounded-sm bg-[#1E3D2F]' : 'rounded-sm bg-[#EEF1EE]'
          }
        />
      ))}
    </div>
  );
}

function LocalImpactPanel({
  passes,
  transactions,
}: {
  balance: number;
  passes: RewardPass[];
  transactions: CreditTransaction[];
}) {
  const spentCredits = Math.max(
    cityCreditStats.creditsSpent,
    Math.abs(
      transactions
        .filter((transaction) => transaction.type === 'spend')
        .reduce((sum, transaction) => sum + transaction.amount, 0),
    ),
  );

  return (
    <section className="mt-4 rounded-md border border-[#D9DDD8] bg-[#F7F5F0] p-4">
      <SectionTitle>Impact local</SectionTitle>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Metric
          label="utilisés localement"
          value={spentCredits}
          tone="orange"
        />
        <Metric
          label="récompenses utilisées"
          value={Math.max(cityCreditStats.rewardsUsed, passes.length)}
        />
        <Metric label="lieux sollicités" value={cityCreditStats.partnersUsed} />
        <Metric
          label="citoyens bénéficiaires"
          value={cityCreditStats.citizenBeneficiaries}
        />
      </div>
      <p className="mt-4 text-sm leading-6 text-[#5B7867]">
        Les crédits Riskéo transforment l’engagement citoyen en activité locale.
      </p>
    </section>
  );
}

function TerritoryCreditsPanel({
  passes,
  transactions,
}: {
  passes: RewardPass[];
  transactions: CreditTransaction[];
}) {
  const earnedCredits = transactions
    .filter((transaction) => transaction.type === 'earn')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const spentCredits = Math.abs(
    transactions
      .filter((transaction) => transaction.type === 'spend')
      .reduce((sum, transaction) => sum + transaction.amount, 0),
  );

  return (
    <section className="brand-card p-4">
      <SectionTitle>Crédits & territoire</SectionTitle>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Metric
          label="crédits distribués"
          value={Math.max(cityCreditStats.creditsDistributed, earnedCredits)}
        />
        <Metric
          label="crédits dépensés"
          value={Math.max(cityCreditStats.creditsSpent, spentCredits)}
          tone="orange"
        />
        <Metric
          label="récompenses utilisées"
          value={Math.max(cityCreditStats.rewardsUsed, passes.length)}
        />
        <Metric label="commerces partenaires" value={partners.length} />
        <Metric
          label="équipements utilisés"
          value={cityCreditStats.municipalEquipmentsUsed}
        />
        <Metric
          label="bénéficiaires"
          value={cityCreditStats.citizenBeneficiaries}
        />
      </div>
      <div className="mt-5 grid gap-3">
        {cityCreditStats.topCategories.map((category) => (
          <ProgressLine
            key={category.label}
            color={category.label === 'Commerces' ? '#5BA681' : '#D9643D'}
            label={category.label}
            value={category.value}
          />
        ))}
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

function MissionPreview({
  mission,
  validated = false,
  onValidateMission,
}: {
  mission: Mission;
  validated?: boolean;
  onValidateMission?: (mission: Mission) => void;
}) {
  const credits = (mission.creditsReward ?? 0) + (mission.priorityBonus ?? 0);

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
        {credits > 0 ? (
          <SmallMeta icon={Coins}>+{credits} crédits</SmallMeta>
        ) : null}
      </div>
      {onValidateMission ? (
        <Button
          className="mt-4 h-9 rounded-md bg-[#1E3D2F] text-white hover:bg-[#173326]"
          disabled={validated}
          type="button"
          onClick={() => onValidateMission(mission)}
        >
          {validated ? 'Crédits attribués' : 'Mission validée'}
        </Button>
      ) : null}
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

function PartnerSpacePreview() {
  const partnerActions = [
    'Scanner un pass',
    'Vérifier',
    'Valider l’utilisation',
    'Historique',
  ];

  return (
    <div className="brand-card p-4">
      <SectionTitle>Espace partenaire</SectionTitle>
      <p className="mt-3 text-sm leading-6 text-[#5B7867]">
        Route future /partner pour contrôler les pass Riskéo chez les commerces
        et équipements.
      </p>
      <div className="mt-4 grid gap-2">
        {partnerActions.map((action) => (
          <div
            key={action}
            className="flex items-center gap-3 rounded-md border border-[#D9DDD8] bg-[#FFFDF8] px-3 py-2 text-sm font-bold"
          >
            <QrCode size={16} />
            {action}
          </div>
        ))}
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
  onClick,
}: {
  icon: LucideIcon;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-semibold hover:bg-[#F7F5F0]"
      type="button"
      onClick={onClick}
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

function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: ReactNode;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? (
        <p className="text-sm font-semibold text-[#D94A3D]">{error}</p>
      ) : null}
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
  geo?: GeoPoint;
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
      lat:
        payload.geo?.lat ?? fondettesCenter.lat + (Math.random() - 0.5) * 0.028,
      lng:
        payload.geo?.lng ?? fondettesCenter.lng + (Math.random() - 0.5) * 0.05,
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

function findPartner(partnerId: string): Partner {
  return (
    partners.find((partner) => partner.id === partnerId) ?? {
      id: 'unknown',
      name: 'Partenaire local',
      category: 'leisure',
      subtitle: 'Fondettes',
      location: 'Fondettes',
      distance: 'à proximité',
      type: 'commerce',
      isDemoPartner: true,
    }
  );
}

function getNextReward(balance: number) {
  return rewards
    .filter((reward) => reward.active && reward.creditsCost > balance)
    .sort((a, b) => a.creditsCost - b.creditsCost)[0];
}

function formatCredits(value: number) {
  return `${new Intl.NumberFormat('fr-FR').format(value)} crédits`;
}

function buildQrCells(token: string) {
  const seed = token
    .split('')
    .reduce((total, character) => total + character.charCodeAt(0), 0);

  return Array.from({ length: 49 }, (_, index) => {
    const edgeMarker =
      (index < 3 && index % 7 < 3) ||
      (index < 6 && index % 7 > 4) ||
      (index > 34 && index % 7 < 3);

    return edgeMarker || (seed + index * 7) % 5 < 2;
  });
}

function mergeProfileData(data: Partial<ProfileData>): ProfileData {
  return {
    ...defaultProfileData,
    ...data,
    missionInterests: {
      ...defaultProfileData.missionInterests,
      ...data.missionInterests,
    },
    missionDifficulty: {
      ...defaultProfileData.missionDifficulty,
      ...data.missionDifficulty,
    },
    availability: {
      ...defaultProfileData.availability,
      ...data.availability,
    },
    pauseMissions: {
      ...defaultProfileData.pauseMissions,
      ...data.pauseMissions,
    },
    notifications: {
      ...defaultProfileData.notifications,
      ...data.notifications,
    },
    channels: {
      ...defaultProfileData.channels,
      ...data.channels,
    },
    privacy: {
      ...defaultProfileData.privacy,
      ...data.privacy,
    },
  };
}

function getInitialProfile(session: DemoSession): ProfileData {
  const profileSession = {
    firstName: session.firstName,
    lastName: session.lastName,
    town: session.town,
  };

  if (typeof window === 'undefined') {
    return mergeProfileData(profileSession);
  }

  const storedProfile = window.localStorage.getItem(profileKey);

  if (!storedProfile) {
    return mergeProfileData(profileSession);
  }

  try {
    return mergeProfileData(JSON.parse(storedProfile) as Partial<ProfileData>);
  } catch {
    return mergeProfileData(profileSession);
  }
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
