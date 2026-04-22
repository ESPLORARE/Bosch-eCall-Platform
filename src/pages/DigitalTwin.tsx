import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  BatteryCharging,
  Car,
  CheckCircle2,
  ChevronRight,
  Clock,
  Cpu,
  Fuel,
  Gauge,
  GripHorizontal,
  MapPin,
  Maximize2,
  Move,
  Radio,
  Route,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Satellite,
  Thermometer,
  Users,
  Wifi,
  Wrench,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { api } from '../services/api';
import type { Incident, Vehicle } from '../types';
import type {
  TwinHealthStatus,
  TwinSubsystem,
  VehicleTwinSceneState,
} from '../components/VehicleDigitalTwinScene';

const VehicleDigitalTwinScene = lazy(() => import('../components/VehicleDigitalTwinScene'));

const CLOSED_STATUSES = new Set<Incident['status']>(['Resolved', 'Closed']);

const SUBSYSTEMS: Array<{ id: TwinSubsystem; label: string; icon: LucideIcon }> = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'powertrain', label: 'Powertrain', icon: Zap },
  { id: 'safety', label: 'Safety', icon: ShieldCheck },
  { id: 'connectivity', label: 'Connectivity', icon: Radio },
  { id: 'tires', label: 'Tires', icon: Gauge },
];

const VEHICLE_COLORS: Record<string, string> = {
  silver: '#e2e8f0',
  yellow: '#facc15',
  white: '#f8fafc',
  black: '#111827',
  red: '#dc2626',
  blue: '#2563eb',
  grey: '#94a3b8',
  gray: '#94a3b8',
};

const toneClasses = {
  blue: 'border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-300',
  cyan: 'border-cyan-100 bg-cyan-50 text-cyan-700 dark:border-cyan-900/50 dark:bg-cyan-900/20 dark:text-cyan-300',
  emerald:
    'border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-300',
  orange:
    'border-orange-100 bg-orange-50 text-orange-700 dark:border-orange-900/50 dark:bg-orange-900/20 dark:text-orange-300',
  red: 'border-red-100 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300',
  slate:
    'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300',
};

type WorkspacePanelId =
  | 'summary'
  | 'fleet'
  | 'scene'
  | 'telemetry'
  | 'subsystems'
  | 'tires'
  | 'metrics'
  | 'context'
  | 'incidents';

interface WorkspacePanelLayout {
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
}

const WORKSPACE_STORAGE_KEY = 'bosch-digital-twin-workspace-v3';
const WORKSPACE_WIDTH = 1420;
const WORKSPACE_HEIGHT = 1120;

const DEFAULT_WORKSPACE_LAYOUT: Record<WorkspacePanelId, WorkspacePanelLayout> = {
  summary: { x: 0, y: 0, w: 1420, h: 150, z: 1 },
  fleet: { x: 0, y: 174, w: 360, h: 650, z: 2 },
  scene: { x: 384, y: 174, w: 690, h: 520, z: 3 },
  telemetry: { x: 1098, y: 174, w: 322, h: 285, z: 4 },
  subsystems: { x: 1098, y: 483, w: 322, h: 300, z: 5 },
  tires: { x: 1098, y: 807, w: 322, h: 260, z: 6 },
  metrics: { x: 384, y: 718, w: 690, h: 190, z: 7 },
  context: { x: 0, y: 848, w: 520, h: 250, z: 8 },
  incidents: { x: 544, y: 932, w: 530, h: 170, z: 9 },
};

const PANEL_MIN_SIZE: Record<WorkspacePanelId, { w: number; h: number }> = {
  summary: { w: 540, h: 130 },
  fleet: { w: 280, h: 360 },
  scene: { w: 440, h: 360 },
  telemetry: { w: 280, h: 220 },
  subsystems: { w: 280, h: 240 },
  tires: { w: 260, h: 220 },
  metrics: { w: 420, h: 160 },
  context: { w: 320, h: 210 },
  incidents: { w: 320, h: 150 },
};

interface TwinSnapshot {
  scene: VehicleTwinSceneState;
  activeIncident: Incident | null;
  relatedIncidents: Incident[];
  engineTempC: number;
  brakePadPct: number;
  ecuHealthPct: number;
  odometerKm: number;
  riskScore: number;
  healthScore: number;
  tireHealthLabel: string;
  linkQualityLabel: string;
  sampleAgeMs: number;
}

function hashString(value: string) {
  return value.split('').reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeWorkspaceLayout(layout: Record<WorkspacePanelId, WorkspacePanelLayout>) {
  const next = { ...layout };

  (Object.keys(DEFAULT_WORKSPACE_LAYOUT) as WorkspacePanelId[]).forEach((id) => {
    const fallback = DEFAULT_WORKSPACE_LAYOUT[id];
    const minimum = PANEL_MIN_SIZE[id];
    const current = next[id] || fallback;
    const w = clamp(current.w, minimum.w, WORKSPACE_WIDTH);
    const h = clamp(current.h, minimum.h, WORKSPACE_HEIGHT);

    next[id] = {
      x: clamp(current.x, 0, WORKSPACE_WIDTH - w),
      y: clamp(current.y, 0, WORKSPACE_HEIGHT - h),
      w,
      h,
      z: current.z || fallback.z,
    };
  });

  return next;
}

function loadWorkspaceLayout() {
  if (typeof window === 'undefined') return DEFAULT_WORKSPACE_LAYOUT;

  try {
    const saved = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (!saved) return DEFAULT_WORKSPACE_LAYOUT;
    return normalizeWorkspaceLayout({
      ...DEFAULT_WORKSPACE_LAYOUT,
      ...(JSON.parse(saved) as Partial<Record<WorkspacePanelId, WorkspacePanelLayout>>),
    });
  } catch {
    return DEFAULT_WORKSPACE_LAYOUT;
  }
}

function oscillate(seed: number, tick: number, amplitude: number, speed = 1800) {
  return Math.sin(tick / speed + seed) * amplitude;
}

function vehicleColor(colorName: string) {
  return VEHICLE_COLORS[colorName.toLowerCase()] || '#dbe4f0';
}

function latestIncidentsFor(vehicle: Vehicle, incidents: Incident[]) {
  return incidents
    .filter((incident) => incident.vehicleId === vehicle.vehicleId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function buildTirePressure(
  target: number,
  seed: number,
  tick: number,
  activeIncident: Incident | null,
): VehicleTwinSceneState['tirePressure'] {
  const base = {
    fl: target + oscillate(seed + 1, tick, 0.7, 2100),
    fr: target + oscillate(seed + 2, tick, 0.6, 2300),
    rl: target + oscillate(seed + 3, tick, 0.5, 2400),
    rr: target + oscillate(seed + 4, tick, 0.7, 2200),
  };

  const collisionType = activeIncident?.telemetry?.collisionType;
  if (collisionType === 'front') {
    base.fl -= 6.8;
    base.fr -= 5.9;
  }
  if (collisionType === 'rear') {
    base.rl -= 5.6;
    base.rr -= 6.2;
  }
  if (collisionType === 'side') {
    base.fl -= 3.4;
    base.rl -= 3.1;
  }

  return {
    fl: Number(base.fl.toFixed(1)),
    fr: Number(base.fr.toFixed(1)),
    rl: Number(base.rl.toFixed(1)),
    rr: Number(base.rr.toFixed(1)),
  };
}

function buildTwinSnapshot(vehicle: Vehicle, incidents: Incident[], tick: number): TwinSnapshot {
  const seed = hashString(vehicle.vehicleId);
  const relatedIncidents = latestIncidentsFor(vehicle, incidents);
  const activeIncident = relatedIncidents.find((incident) => !CLOSED_STATUSES.has(incident.status)) || null;
  const telemetry = activeIncident?.telemetry;
  const isActiveAlert = Boolean(activeIncident) || vehicle.status === 'In Alert';
  const powertrainTarget = vehicle.fuelType === 'Electric' ? 39 : vehicle.fuelType === 'Hybrid' ? 36 : 35;
  const tirePressure = buildTirePressure(powertrainTarget, seed, tick, activeIncident);
  const tireDelta = Math.max(...Object.values(tirePressure).map((pressure) => Math.abs(pressure - powertrainTarget)));
  const connectivityPct = clamp(
    Math.round((isActiveAlert ? 94 : 88 + (seed % 9)) + oscillate(seed, tick, 2.2, 2600)),
    54,
    100,
  );
  const energyBase =
    vehicle.fuelType === 'Electric' ? 74 : vehicle.fuelType === 'Hybrid' ? 68 : vehicle.status === 'In Alert' ? 46 : 61;
  const energyLevel = clamp(Math.round(energyBase - vehicle.incidentCount * 4 + oscillate(seed + 8, tick, 1.8, 3200)), 9, 98);
  const speedKmh = isActiveAlert
    ? Math.max(0, Math.round(2 + oscillate(seed + 14, tick, 1.4, 1200)))
    : Math.max(0, Math.round(42 + (seed % 38) + oscillate(seed + 14, tick, 7, 1700)));
  const engineTempC = clamp(Math.round(82 + (seed % 12) + (isActiveAlert ? 9 : 0) + oscillate(seed + 2, tick, 2.8, 2500)), 68, 114);
  const gnssSatellites = clamp(Math.round(11 + (seed % 7) + (isActiveAlert ? 2 : 0) + oscillate(seed + 5, tick, 1.3, 2900)), 6, 21);
  const occupants = activeIncident?.passengerCount || ((seed % 3) + 1);
  const passengerCondition = telemetry?.passengerCondition || 'normal';
  const seatbeltsFastened =
    passengerCondition === 'normal' ? occupants : Math.max(0, occupants - (passengerCondition === 'trapped' ? 2 : 1));
  const crashDetected = Boolean(telemetry?.crashDetected || activeIncident?.severity === 'high');
  const impactLevel = telemetry?.impactLevel || (activeIncident?.severity === 'high' ? 'high' : activeIncident?.severity === 'medium' ? 'medium' : 'low');
  const riskBase = vehicle.riskLevel === 'high' ? 54 : vehicle.riskLevel === 'medium' ? 34 : 16;
  const riskScore = clamp(riskBase + vehicle.incidentCount * 9 + (isActiveAlert ? 24 : 0), 1, 99);
  let healthStatus: TwinHealthStatus = 'nominal';

  if (isActiveAlert || impactLevel === 'high' || tireDelta >= 6) {
    healthStatus = 'critical';
  } else if (vehicle.status === 'Resolved' || vehicle.riskLevel !== 'low' || energyLevel < 25 || connectivityPct < 78 || tireDelta >= 3) {
    healthStatus = 'warning';
  }

  const healthScore = clamp(
    Math.round(100 - riskScore * 0.45 - (energyLevel < 25 ? 12 : 0) - (connectivityPct < 78 ? 8 : 0) - tireDelta * 2),
    12,
    99,
  );

  return {
    scene: {
      healthStatus,
      vehicleColor: vehicleColor(vehicle.color),
      speedKmh,
      energyLabel: vehicle.fuelType === 'Electric' ? 'Battery' : vehicle.fuelType === 'Hybrid' ? 'Hybrid energy' : 'Fuel',
      energyLevel,
      tireTargetPsi: powertrainTarget,
      tirePressure,
      connectivityPct,
      gnssSatellites,
      occupants,
      seatbeltsFastened,
      eCallMode: vehicle.eCallMode,
      airbagDeployed: Boolean(telemetry?.airbagDeployed),
      crashDetected,
      impactLevel,
      collisionType: crashDetected ? telemetry?.collisionType || 'front' : 'none',
      possibleEntrapment: Boolean(telemetry?.possibleEntrapment),
      passengerCondition,
      deltaV: telemetry?.deltaV,
    },
    activeIncident,
    relatedIncidents,
    engineTempC,
    brakePadPct: clamp(Math.round(86 - vehicle.incidentCount * 6 - (seed % 8)), 22, 98),
    ecuHealthPct: clamp(Math.round(96 - vehicle.incidentCount * 5 - (isActiveAlert ? 9 : 0)), 41, 99),
    odometerKm: 18000 + (seed % 78000),
    riskScore,
    healthScore,
    tireHealthLabel: tireDelta >= 6 ? 'Critical variance' : tireDelta >= 3 ? 'Pressure watch' : 'Balanced',
    linkQualityLabel: connectivityPct >= 90 ? 'Strong' : connectivityPct >= 75 ? 'Stable' : 'Degraded',
    sampleAgeMs: 420 + (seed % 580),
  };
}

function statusTone(status: TwinHealthStatus) {
  if (status === 'critical') return 'red';
  if (status === 'warning') return 'orange';
  return 'emerald';
}

function statusLabel(status: TwinHealthStatus) {
  if (status === 'critical') return 'Critical';
  if (status === 'warning') return 'Watch';
  return 'Nominal';
}

function LoadingPanel({ label }: { label: string }) {
  return (
    <div className="flex h-[520px] min-h-[420px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
      Loading {label}...
    </div>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
  detail,
  tone = 'slate',
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail?: string;
  tone?: keyof typeof toneClasses;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</span>
        <span className={`rounded-md border p-1.5 ${toneClasses[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
      {detail && <div className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{detail}</div>}
    </div>
  );
}

function GaugeBar({
  icon: Icon,
  label,
  value,
  suffix = '%',
  tone = 'blue',
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  suffix?: string;
  tone?: 'blue' | 'cyan' | 'emerald' | 'orange' | 'red' | 'slate';
}) {
  const barColor = {
    blue: 'bg-[#005691]',
    cyan: 'bg-[#00A8CB]',
    emerald: 'bg-[#00884A]',
    orange: 'bg-orange-500',
    red: 'bg-[#E20015]',
    slate: 'bg-slate-400',
  }[tone];

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          <Icon className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="truncate">{label}</span>
        </div>
        <span className="text-sm font-bold text-slate-900 dark:text-white">
          {value}
          {suffix}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${clamp(value, 0, 100)}%` }} />
      </div>
    </div>
  );
}

function SensorRow({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: keyof typeof toneClasses;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-800/50">
      <div className="flex min-w-0 items-center gap-3">
        <span className={`rounded-md border p-1.5 ${toneClasses[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      </div>
      <span className="shrink-0 text-sm font-bold text-slate-900 dark:text-white">{value}</span>
    </div>
  );
}

function WorkspacePanel({
  id,
  title,
  icon: Icon,
  layout,
  children,
  bodyClassName = 'p-4',
  toolbar,
  onChange,
  onFocus,
}: {
  id: WorkspacePanelId;
  title: string;
  icon: LucideIcon;
  layout: WorkspacePanelLayout;
  children: React.ReactNode;
  bodyClassName?: string;
  toolbar?: React.ReactNode;
  onChange: (id: WorkspacePanelId, layout: WorkspacePanelLayout) => void;
  onFocus: (id: WorkspacePanelId) => void;
}) {
  const interaction = React.useRef<{
    mode: 'move' | 'resize';
    startX: number;
    startY: number;
    start: WorkspacePanelLayout;
  } | null>(null);
  const stopWindowInteraction = React.useRef<(() => void) | null>(null);

  React.useEffect(() => {
    return () => {
      stopWindowInteraction.current?.();
    };
  }, []);

  const startInteraction = (mode: 'move' | 'resize', event: React.PointerEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onFocus(id);
    interaction.current = {
      mode,
      startX: event.clientX,
      startY: event.clientY,
      start: layout,
    };

    stopWindowInteraction.current?.();

    const updateInteraction = (pointerEvent: PointerEvent) => {
      if (!interaction.current) return;

      const minimum = PANEL_MIN_SIZE[id];
      const dx = pointerEvent.clientX - interaction.current.startX;
      const dy = pointerEvent.clientY - interaction.current.startY;
      const start = interaction.current.start;

      if (interaction.current.mode === 'move') {
        onChange(id, {
          ...start,
          x: clamp(start.x + dx, 0, WORKSPACE_WIDTH - start.w),
          y: clamp(start.y + dy, 0, WORKSPACE_HEIGHT - start.h),
        });
        return;
      }

      const w = clamp(start.w + dx, minimum.w, WORKSPACE_WIDTH - start.x);
      const h = clamp(start.h + dy, minimum.h, WORKSPACE_HEIGHT - start.y);
      onChange(id, { ...start, w, h });
    };

    const stopInteraction = () => {
      window.removeEventListener('pointermove', updateInteraction);
      window.removeEventListener('pointerup', stopInteraction);
      window.removeEventListener('pointercancel', stopInteraction);
      interaction.current = null;
      stopWindowInteraction.current = null;
    };

    window.addEventListener('pointermove', updateInteraction);
    window.addEventListener('pointerup', stopInteraction);
    window.addEventListener('pointercancel', stopInteraction);
    stopWindowInteraction.current = stopInteraction;
  };

  return (
    <section
      className="absolute flex select-none flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm ring-1 ring-transparent transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
      style={{
        left: layout.x,
        top: layout.y,
        width: layout.w,
        height: layout.h,
        zIndex: 60 + layout.z,
      }}
      onPointerDown={() => onFocus(id)}
    >
      <header
        className="flex h-11 shrink-0 cursor-move items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-3 dark:border-slate-800 dark:bg-slate-900/80"
        onPointerDown={(event) => startInteraction('move', event)}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <Icon className="h-4 w-4" />
          </span>
          <span className="truncate text-sm font-bold text-slate-900 dark:text-white">{title}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1" onPointerDown={(event) => event.stopPropagation()}>
          {toolbar}
          <GripHorizontal className="h-4 w-4 text-slate-400" />
        </div>
      </header>

      <div className={`min-h-0 flex-1 overflow-auto ${bodyClassName}`}>{children}</div>

      <button
        type="button"
        title="Resize module"
        className="absolute bottom-1 right-1 z-10 rounded-md border border-slate-200 bg-white/90 p-1 text-slate-400 shadow-sm backdrop-blur transition-colors hover:text-[#005691] dark:border-slate-700 dark:bg-slate-900/90 dark:hover:text-blue-300"
        onPointerDown={(event) => startInteraction('resize', event)}
      >
        <Maximize2 className="h-3.5 w-3.5" />
      </button>
    </section>
  );
}

export default function DigitalTwin() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedVehicleId = searchParams.get('vehicle');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedSubsystem, setSelectedSubsystem] = useState<TwinSubsystem>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [tick, setTick] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [workspaceLayout, setWorkspaceLayout] = useState(loadWorkspaceLayout);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        const [vehiclesData, incidentsData] = await Promise.all([api.getVehicles(), api.getIncidents()]);
        if (!mounted) return;
        setVehicles(vehiclesData);
        setIncidents(incidentsData);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    const interval = window.setInterval(fetchData, 5000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(workspaceLayout));
  }, [workspaceLayout]);

  useEffect(() => {
    if (vehicles.length === 0) return;

    if (requestedVehicleId && vehicles.some((vehicle) => vehicle.vehicleId === requestedVehicleId)) {
      setSelectedVehicleId(requestedVehicleId);
      return;
    }

    setSelectedVehicleId((current) =>
      current && vehicles.some((vehicle) => vehicle.vehicleId === current) ? current : vehicles[0].vehicleId,
    );
  }, [requestedVehicleId, vehicles]);

  const selectedVehicle = vehicles.find((vehicle) => vehicle.vehicleId === selectedVehicleId) || null;
  const snapshot = useMemo(
    () => (selectedVehicle ? buildTwinSnapshot(selectedVehicle, incidents, tick) : null),
    [incidents, selectedVehicle, tick],
  );

  const filteredVehicles = vehicles.filter((vehicle) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      vehicle.vehicleId.toLowerCase().includes(term) ||
      vehicle.plateNumber.toLowerCase().includes(term) ||
      vehicle.ownerName.toLowerCase().includes(term) ||
      `${vehicle.brand} ${vehicle.model}`.toLowerCase().includes(term)
    );
  });

  const fleetSummary = useMemo(() => {
    const activeAlerts = vehicles.filter((vehicle) => vehicle.status === 'In Alert').length;
    const ngEcall = vehicles.filter((vehicle) => vehicle.eCallMode === 'NG eCall').length;
    const highRisk = vehicles.filter((vehicle) => vehicle.riskLevel === 'high').length;
    const recentSos = vehicles.filter((vehicle) => vehicle.lastSosTime).length;
    return { activeAlerts, ngEcall, highRisk, recentSos };
  }, [vehicles]);

  const selectVehicle = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    setSearchParams({ vehicle: vehicleId });
  };

  const updatePanelLayout = (panelId: WorkspacePanelId, layout: WorkspacePanelLayout) => {
    setWorkspaceLayout((current) =>
      normalizeWorkspaceLayout({
        ...current,
        [panelId]: {
          ...layout,
          z: current[panelId]?.z || layout.z,
        },
      }),
    );
  };

  const focusPanel = (panelId: WorkspacePanelId) => {
    setWorkspaceLayout((current) => {
      const maxZ = Math.max(...Object.values(current).map((item) => item.z));
      if (current[panelId].z === maxZ) return current;
      return {
        ...current,
        [panelId]: {
          ...current[panelId],
          z: maxZ + 1,
        },
      };
    });
  };

  const resetWorkspaceLayout = () => {
    setWorkspaceLayout(DEFAULT_WORKSPACE_LAYOUT);
    window.localStorage.removeItem(WORKSPACE_STORAGE_KEY);
  };

  if (loading || !selectedVehicle || !snapshot) {
    return <div className="p-8 text-slate-500 dark:text-slate-400">Loading digital twin...</div>;
  }

  const healthTone = statusTone(snapshot.scene.healthStatus);
  const lastSample = new Date(tick).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const summaryContent = (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricTile icon={Car} label="Fleet Connected" value={`${vehicles.length}`} detail={`${fleetSummary.ngEcall} NG eCall vehicles`} tone="blue" />
      <MetricTile icon={AlertTriangle} label="Active Alerts" value={`${fleetSummary.activeAlerts}`} detail={`${fleetSummary.recentSos} vehicles with SOS history`} tone={fleetSummary.activeAlerts > 0 ? 'red' : 'emerald'} />
      <MetricTile icon={ShieldAlert} label="High Risk" value={`${fleetSummary.highRisk}`} detail={`Selected risk score ${snapshot.riskScore}/100`} tone={fleetSummary.highRisk > 0 ? 'orange' : 'emerald'} />
      <MetricTile icon={Cpu} label="Twin Health" value={`${snapshot.healthScore}%`} detail={`ECU confidence ${snapshot.ecuHealthPct}%`} tone={healthTone} />
    </div>
  );

  const fleetContent = (
    <>
      <div className="border-b border-slate-200 p-4 dark:border-slate-800">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Connected vehicles</span>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{filteredVehicles.length} shown</span>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search vehicle..."
            className="w-full rounded-lg border border-slate-300 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
      </div>
      <div className="space-y-2 p-3">
        {filteredVehicles.map((vehicle) => {
          const vehicleSnapshot = buildTwinSnapshot(vehicle, incidents, tick);
          const active = vehicle.vehicleId === selectedVehicle.vehicleId;
          const tone = statusTone(vehicleSnapshot.scene.healthStatus);

          return (
            <button
              key={vehicle.vehicleId}
              onClick={() => selectVehicle(vehicle.vehicleId)}
              className={`w-full rounded-lg border p-3 text-left transition ${
                active
                  ? 'border-blue-300 bg-blue-50 shadow-sm dark:border-blue-800/70 dark:bg-blue-900/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/70'
              }`}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{vehicle.plateNumber}</p>
                  <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                    {vehicle.brand} {vehicle.model}
                  </p>
                </div>
                <span className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${toneClasses[tone]}`}>
                  {statusLabel(vehicleSnapshot.scene.healthStatus)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                <span>{vehicle.assignedRegion}</span>
                <span>{vehicleSnapshot.scene.energyLevel}%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={`h-full rounded-full ${
                    vehicleSnapshot.scene.healthStatus === 'critical'
                      ? 'bg-[#E20015]'
                      : vehicleSnapshot.scene.healthStatus === 'warning'
                        ? 'bg-orange-500'
                        : 'bg-[#00884A]'
                  }`}
                  style={{ width: `${vehicleSnapshot.healthScore}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </>
  );

  const layerControls = (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
      {SUBSYSTEMS.map((item) => {
        const Icon = item.icon;
        const active = item.id === selectedSubsystem;
        return (
          <button
            key={item.id}
            onClick={() => setSelectedSubsystem(item.id)}
            className={`flex min-h-12 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
              active
                ? 'border-blue-300 bg-blue-50 text-[#005691] dark:border-blue-800/70 dark:bg-blue-900/30 dark:text-blue-300'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
            title={`${item.label} layer`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </div>
  );

  const scenePanelContent = (
    <div className="flex h-full min-h-[420px] flex-col gap-3">
      <div className="min-h-0 flex-1">
        <Suspense fallback={<LoadingPanel label="3D twin" />}>
          <VehicleDigitalTwinScene className="h-full min-h-[300px]" state={snapshot.scene} selectedSubsystem={selectedSubsystem} />
        </Suspense>
      </div>
      {layerControls}
    </div>
  );

  const mobileSceneContent = (
    <div className="space-y-3">
      <Suspense fallback={<LoadingPanel label="3D twin" />}>
        <VehicleDigitalTwinScene className="h-[420px]" state={snapshot.scene} selectedSubsystem={selectedSubsystem} />
      </Suspense>
      {layerControls}
    </div>
  );

  const metricsContent = (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <MetricTile icon={Gauge} label="Speed" value={`${snapshot.scene.speedKmh} km/h`} detail="Vehicle bus feed" tone="cyan" />
      <MetricTile
        icon={snapshot.scene.energyLabel === 'Fuel' ? Fuel : BatteryCharging}
        label={snapshot.scene.energyLabel}
        value={`${snapshot.scene.energyLevel}%`}
        detail={`${selectedVehicle.fuelType} powertrain`}
        tone={snapshot.scene.energyLevel < 25 ? 'orange' : 'emerald'}
      />
      <MetricTile icon={Thermometer} label="Thermal" value={`${snapshot.engineTempC} C`} detail="Powertrain temperature" tone={snapshot.engineTempC > 104 ? 'orange' : 'slate'} />
    </div>
  );

  const telemetryContent = (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400">
          {snapshot.sampleAgeMs} ms
        </span>
      </div>
      <GaugeBar icon={Activity} label="Twin health" value={snapshot.healthScore} tone={snapshot.healthScore < 55 ? 'red' : snapshot.healthScore < 78 ? 'orange' : 'emerald'} />
      <GaugeBar icon={BatteryCharging} label={snapshot.scene.energyLabel} value={snapshot.scene.energyLevel} tone={snapshot.scene.energyLevel < 25 ? 'orange' : 'blue'} />
      <GaugeBar icon={Wifi} label="Connectivity" value={snapshot.scene.connectivityPct} tone={snapshot.scene.connectivityPct < 75 ? 'orange' : 'cyan'} />
      <GaugeBar icon={Wrench} label="Brake pad estimate" value={snapshot.brakePadPct} tone={snapshot.brakePadPct < 35 ? 'orange' : 'slate'} />
    </div>
  );

  const subsystemsContent = (
    <div className="space-y-2">
      <SensorRow icon={Radio} label="eCall modem" value={snapshot.scene.eCallMode} tone="blue" />
      <SensorRow icon={Satellite} label="GNSS lock" value={`${snapshot.scene.gnssSatellites} satellites`} tone={snapshot.scene.gnssSatellites < 9 ? 'orange' : 'emerald'} />
      <SensorRow icon={Users} label="Cabin occupants" value={`${snapshot.scene.occupants}`} tone={snapshot.scene.passengerCondition === 'normal' ? 'slate' : 'red'} />
      <SensorRow icon={ShieldCheck} label="Seatbelts" value={`${snapshot.scene.seatbeltsFastened}/${snapshot.scene.occupants}`} tone={snapshot.scene.seatbeltsFastened === snapshot.scene.occupants ? 'emerald' : 'orange'} />
      <SensorRow icon={Cpu} label="ECU health" value={`${snapshot.ecuHealthPct}%`} tone={snapshot.ecuHealthPct < 70 ? 'orange' : 'emerald'} />
    </div>
  );

  const tiresContent = (
    <>
      <div className="mb-4 flex items-center justify-end">
        <span className={`rounded-md border px-2 py-1 text-xs font-bold ${toneClasses[snapshot.tireHealthLabel === 'Balanced' ? 'emerald' : snapshot.tireHealthLabel === 'Pressure watch' ? 'orange' : 'red']}`}>
          {snapshot.tireHealthLabel}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(snapshot.scene.tirePressure).map(([key, pressure]) => {
          const variance = Math.abs(pressure - snapshot.scene.tireTargetPsi);
          const tone = variance >= 6 ? 'red' : variance >= 3 ? 'orange' : 'slate';
          return (
            <div key={key} className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{key}</div>
              <div className={`text-lg font-bold ${tone === 'red' ? 'text-[#E20015]' : tone === 'orange' ? 'text-orange-500' : 'text-slate-900 dark:text-white'}`}>
                {pressure.toFixed(1)}
              </div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">psi</div>
            </div>
          );
        })}
      </div>
    </>
  );

  const contextContent = (
    <div className="space-y-3 text-sm">
      <div className="flex items-start gap-3">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">{selectedVehicle.lastLocation || 'Unknown location'}</p>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{selectedVehicle.assignedRegion}</p>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <Route className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">{snapshot.odometerKm.toLocaleString()} km</p>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Estimated odometer</p>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">
            {selectedVehicle.lastSosTime ? formatDistanceToNow(new Date(selectedVehicle.lastSosTime), { addSuffix: true }) : 'No SOS recorded'}
          </p>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Last SOS event</p>
        </div>
      </div>
    </div>
  );

  const incidentsContent =
    snapshot.relatedIncidents.length > 0 ? (
      <div className="space-y-3">
        {snapshot.relatedIncidents.slice(0, 3).map((incident) => (
          <Link
            key={incident.incidentId}
            to={`/incidents/${incident.incidentId}`}
            className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:bg-slate-800"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{incident.incidentId}</p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {incident.severity} | {formatDistanceToNow(new Date(incident.timestamp), { addSuffix: true })}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
          </Link>
        ))}
      </div>
    ) : (
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No incident trace for this vehicle.</p>
    );

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-bold ${toneClasses[healthTone]}`}>
              {snapshot.scene.healthStatus === 'critical' ? <ShieldAlert className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              {statusLabel(snapshot.scene.healthStatus)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <Clock className="h-3.5 w-3.5" />
              Sample {lastSample}
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Vehicle Digital Twin</h2>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            {selectedVehicle.brand} {selectedVehicle.model} | {selectedVehicle.plateNumber} | {selectedVehicle.vehicleId}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {snapshot.activeIncident && (
            <Link
              to={`/incidents/${snapshot.activeIncident.incidentId}`}
              className="inline-flex items-center gap-2 rounded-lg bg-[#E20015] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700"
            >
              <AlertTriangle className="h-4 w-4" />
              Open Incident
            </Link>
          )}
          <Link
            to="/vehicles"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Car className="h-4 w-4" />
            Vehicle Registry
          </Link>
        </div>
      </div>

      <div className="hidden xl:block">
        <div className="mb-3 flex items-center justify-end">
          <button
            type="button"
            onClick={resetWorkspaceLayout}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            title="Reset workspace layout"
          >
            <RotateCcw className="h-4 w-4" />
            Reset Layout
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-100/60 p-3 dark:border-slate-800 dark:bg-slate-950/40">
          <div className="relative" style={{ width: WORKSPACE_WIDTH, height: WORKSPACE_HEIGHT }}>
            <WorkspacePanel
              id="summary"
              title="Operations Summary"
              icon={Activity}
              layout={workspaceLayout.summary}
              onChange={updatePanelLayout}
              onFocus={focusPanel}
            >
              {summaryContent}
            </WorkspacePanel>
            <WorkspacePanel
              id="fleet"
              title="Fleet"
              icon={Car}
              layout={workspaceLayout.fleet}
              bodyClassName="p-0"
              onChange={updatePanelLayout}
              onFocus={focusPanel}
            >
              {fleetContent}
            </WorkspacePanel>
            <WorkspacePanel
              id="scene"
              title="Vehicle Twin"
              icon={Move}
              layout={workspaceLayout.scene}
              bodyClassName="p-3 overflow-hidden"
              onChange={updatePanelLayout}
              onFocus={focusPanel}
            >
              {scenePanelContent}
            </WorkspacePanel>
            <WorkspacePanel
              id="telemetry"
              title="Live Telemetry"
              icon={Activity}
              layout={workspaceLayout.telemetry}
              onChange={updatePanelLayout}
              onFocus={focusPanel}
            >
              {telemetryContent}
            </WorkspacePanel>
            <WorkspacePanel
              id="subsystems"
              title="Subsystems"
              icon={Cpu}
              layout={workspaceLayout.subsystems}
              onChange={updatePanelLayout}
              onFocus={focusPanel}
            >
              {subsystemsContent}
            </WorkspacePanel>
            <WorkspacePanel
              id="tires"
              title="Tire Pressure"
              icon={Gauge}
              layout={workspaceLayout.tires}
              onChange={updatePanelLayout}
              onFocus={focusPanel}
            >
              {tiresContent}
            </WorkspacePanel>
            <WorkspacePanel
              id="metrics"
              title="Powertrain"
              icon={Zap}
              layout={workspaceLayout.metrics}
              onChange={updatePanelLayout}
              onFocus={focusPanel}
            >
              {metricsContent}
            </WorkspacePanel>
            <WorkspacePanel
              id="context"
              title="Vehicle Context"
              icon={MapPin}
              layout={workspaceLayout.context}
              onChange={updatePanelLayout}
              onFocus={focusPanel}
            >
              {contextContent}
            </WorkspacePanel>
            <WorkspacePanel
              id="incidents"
              title="Incident Trace"
              icon={AlertTriangle}
              layout={workspaceLayout.incidents}
              onChange={updatePanelLayout}
              onFocus={focusPanel}
            >
              {incidentsContent}
            </WorkspacePanel>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto pb-4 xl:hidden">
        <div className="min-w-[720px] space-y-4">
          {summaryContent}
          <section className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">{fleetContent}</section>
          <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">{mobileSceneContent}</section>
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 font-bold text-slate-900 dark:text-white">Live Telemetry</h3>
            {telemetryContent}
          </section>
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 font-bold text-slate-900 dark:text-white">Subsystems</h3>
            {subsystemsContent}
          </section>
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 font-bold text-slate-900 dark:text-white">Tire Pressure</h3>
            {tiresContent}
          </section>
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 font-bold text-slate-900 dark:text-white">Powertrain</h3>
            {metricsContent}
          </section>
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 font-bold text-slate-900 dark:text-white">Vehicle Context</h3>
            {contextContent}
          </section>
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 font-bold text-slate-900 dark:text-white">Incident Trace</h3>
            {incidentsContent}
          </section>
        </div>
      </div>
    </div>
  );
}
