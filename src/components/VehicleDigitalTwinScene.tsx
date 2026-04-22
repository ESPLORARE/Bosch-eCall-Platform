import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, Grid, Html, Line, OrbitControls, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { PremiumTeslaEV } from './Incident3DView';

export type TwinHealthStatus = 'nominal' | 'warning' | 'critical';
export type TwinSubsystem = 'overview' | 'powertrain' | 'safety' | 'connectivity' | 'tires';

type TireKey = 'fl' | 'fr' | 'rl' | 'rr';

export interface VehicleTwinSceneState {
  healthStatus: TwinHealthStatus;
  vehicleColor: string;
  speedKmh: number;
  energyLabel: string;
  energyLevel: number;
  tireTargetPsi: number;
  tirePressure: Record<TireKey, number>;
  connectivityPct: number;
  gnssSatellites: number;
  occupants: number;
  seatbeltsFastened: number;
  eCallMode: string;
  airbagDeployed: boolean;
  crashDetected: boolean;
  impactLevel: 'low' | 'medium' | 'high';
  collisionType: 'front' | 'side' | 'rear' | 'rollover' | 'none';
  possibleEntrapment: boolean;
  passengerCondition: 'normal' | 'unconscious' | 'trapped';
  deltaV?: number;
}

interface VehicleDigitalTwinSceneProps {
  state: VehicleTwinSceneState;
  selectedSubsystem: TwinSubsystem;
  className?: string;
}

const TIRE_POSITIONS: Array<{ key: TireKey; label: string; position: [number, number, number] }> = [
  { key: 'fl', label: 'FL', position: [1.08, 0.36, 1.58] },
  { key: 'fr', label: 'FR', position: [-1.08, 0.36, 1.58] },
  { key: 'rl', label: 'RL', position: [1.08, 0.36, -1.52] },
  { key: 'rr', label: 'RR', position: [-1.08, 0.36, -1.52] },
];

const QASHQAI_MODEL_URL =
  'https://sketchfab.com/models/ef3c5a9808b44b44ac600ad4431b8680/embed?autostart=1&ui_theme=dark&ui_infos=0';
const QASHQAI_VIEWER_URL =
  'https://sketchfab.com/3d-models/2018-nissan-qashqai-ef3c5a9808b44b44ac600ad4431b8680';
const QASHQAI_LICENSE_URL = 'https://creativecommons.org/licenses/by-nc-sa/4.0/';
const SKETCHFAB_IFRAME_CAPABILITIES = {
  mozallowfullscreen: 'true',
  webkitallowfullscreen: 'true',
  'xr-spatial-tracking': 'true',
  'execution-while-out-of-viewport': 'true',
  'execution-while-not-rendered': 'true',
  'web-share': 'true',
};

function healthColor(status: TwinHealthStatus) {
  if (status === 'critical') return '#ef4444';
  if (status === 'warning') return '#f97316';
  return '#22c55e';
}

function pressureColor(pressure: number, target: number) {
  const diff = Math.abs(pressure - target);
  if (diff >= 6) return '#ef4444';
  if (diff >= 3) return '#f97316';
  return '#22c55e';
}

function impactColor(level: VehicleTwinSceneState['impactLevel']) {
  if (level === 'high') return '#ef4444';
  if (level === 'medium') return '#f97316';
  return '#eab308';
}

function TwinTag({
  position,
  label,
  value,
  color,
}: {
  position: [number, number, number];
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Html position={position} center zIndexRange={[90, 0]}>
      <div className="pointer-events-none min-w-28 rounded-md border border-slate-700/70 bg-slate-950/75 px-2.5 py-2 text-[10px] shadow-2xl backdrop-blur-md">
        <div className="mb-1 flex items-center gap-1.5 text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
          <span className="font-bold uppercase tracking-wider">{label}</span>
        </div>
        <div className="text-xs font-semibold text-white">{value}</div>
      </div>
    </Html>
  );
}

function TireBeacon({
  position,
  label,
  pressure,
  target,
  active,
}: {
  position: [number, number, number];
  label: string;
  pressure: number;
  target: number;
  active: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const color = pressureColor(pressure, target);

  useFrame((state) => {
    if (!groupRef.current) return;
    const pulse = active ? Math.sin(state.clock.elapsedTime * 5) * 0.1 + 1.08 : 1;
    groupRef.current.scale.setScalar(pulse);
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.27, 0.31, 36]} />
        <meshBasicMaterial color={color} transparent opacity={active ? 0.95 : 0.55} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.055, 16, 16]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      {active && <TwinTag position={[0, 0.55, 0]} label={label} value={`${pressure.toFixed(1)} psi`} color={color} />}
    </group>
  );
}

function ConnectionMast({
  connectivityPct,
  gnssSatellites,
  eCallMode,
  active,
}: {
  connectivityPct: number;
  gnssSatellites: number;
  eCallMode: string;
  active: boolean;
}) {
  const mastRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!mastRef.current) return;
    mastRef.current.rotation.y = state.clock.elapsedTime * 0.35;
  });

  const color = connectivityPct > 85 ? '#22c55e' : connectivityPct > 65 ? '#f97316' : '#ef4444';

  return (
    <group ref={mastRef} position={[0, 2.05, 0]}>
      <mesh>
        <sphereGeometry args={[0.08, 24, 24]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      {[0.44, 0.78, 1.12].map((radius, index) => (
        <mesh key={radius} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius, 0.006, 8, 72]} />
          <meshBasicMaterial color={color} transparent opacity={active ? 0.64 - index * 0.14 : 0.26} toneMapped={false} />
        </mesh>
      ))}
      {active && (
        <TwinTag
          position={[0, 0.86, 0]}
          label="Connectivity"
          value={`${connectivityPct}% | ${gnssSatellites} GNSS | ${eCallMode}`}
          color={color}
        />
      )}
    </group>
  );
}

function CabinOccupants({
  occupants,
  seatbeltsFastened,
  passengerCondition,
  active,
}: {
  occupants: number;
  seatbeltsFastened: number;
  passengerCondition: VehicleTwinSceneState['passengerCondition'];
  active: boolean;
}) {
  const statusColor =
    passengerCondition === 'trapped' ? '#ef4444' : passengerCondition === 'unconscious' ? '#f59e0b' : '#22c55e';
  const seats: [number, number, number][] = [
    [0.35, 0.72, 0.45],
    [-0.35, 0.72, 0.45],
    [0.35, 0.72, -0.42],
    [-0.35, 0.72, -0.42],
    [0, 0.72, -0.48],
  ];

  return (
    <group>
      {seats.slice(0, Math.max(1, occupants)).map((position, index) => (
        <group key={index} position={position}>
          <mesh>
            <sphereGeometry args={[0.11, 24, 24]} />
            <meshBasicMaterial color={index < seatbeltsFastened ? '#38bdf8' : statusColor} toneMapped={false} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.19, 24, 24]} />
            <meshBasicMaterial
              color={index < seatbeltsFastened ? '#38bdf8' : statusColor}
              transparent
              opacity={active ? 0.24 : 0.12}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
      {active && (
        <TwinTag
          position={[1.45, 1.55, -0.45]}
          label="Cabin"
          value={`${occupants} occupants | ${seatbeltsFastened} belted`}
          color={statusColor}
        />
      )}
    </group>
  );
}

function PowertrainFlow({ energyLevel, speedKmh, active }: { energyLevel: number; speedKmh: number; active: boolean }) {
  const lineColor = energyLevel > 35 ? '#00a8cb' : energyLevel > 18 ? '#f97316' : '#ef4444';
  const opacity = active ? 0.95 : 0.32;

  return (
    <group>
      <Line
        points={[
          [-1.55, 0.22, 0],
          [-0.5, 0.22, 0],
          [0.5, 0.22, 0],
          [1.55, 0.22, 0],
        ]}
        color={lineColor}
        lineWidth={active ? 3 : 1.5}
        transparent
        opacity={opacity}
      />
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[1.15, 0.08, 0.8]} />
        <meshBasicMaterial color={lineColor} transparent opacity={active ? 0.16 : 0.08} toneMapped={false} />
      </mesh>
      {active && <TwinTag position={[0, 0.95, -1.25]} label="Powertrain" value={`${energyLevel}% | ${speedKmh} km/h`} color={lineColor} />}
    </group>
  );
}

function ImpactMarker({
  collisionType,
  level,
}: {
  collisionType: VehicleTwinSceneState['collisionType'];
  level: VehicleTwinSceneState['impactLevel'];
}) {
  const groupRef = useRef<THREE.Group>(null);
  const color = impactColor(level);
  const markerPositions: Record<VehicleTwinSceneState['collisionType'], [number, number, number][]> = {
    front: [[0, 0.72, 2.18]],
    rear: [[0, 0.72, -2.18]],
    side: [
      [1.18, 0.72, 0.1],
      [-1.18, 0.72, 0.1],
    ],
    rollover: [[0, 1.72, 0]],
    none: [],
  };

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.scale.setScalar(Math.sin(state.clock.elapsedTime * 5) * 0.08 + 1);
  });

  return (
    <group ref={groupRef}>
      {markerPositions[collisionType].map((position, index) => (
        <group key={index} position={position}>
          <mesh>
            <sphereGeometry args={[0.32, 32, 32]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.28}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.12, 24, 24]} />
            <meshBasicMaterial color={color} toneMapped={false} />
          </mesh>
          <Sparkles count={22} scale={1.4} size={3} speed={0.35} color={color} opacity={0.75} />
        </group>
      ))}
    </group>
  );
}

function StatusHalo({ healthStatus }: { healthStatus: TwinHealthStatus }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const color = healthColor(healthStatus);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = (state.clock.elapsedTime * 0.5) % 1;
    meshRef.current.scale.setScalar(1 + t * 0.24);
    const material = meshRef.current.material as THREE.MeshBasicMaterial;
    material.opacity = 0.22 - t * 0.14;
  });

  return (
    <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
      <ringGeometry args={[2.75, 2.82, 96]} />
      <meshBasicMaterial color={color} transparent opacity={0.18} toneMapped={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

function TwinOverlayTag({
  className,
  label,
  value,
  color,
}: {
  className: string;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      className={`pointer-events-none absolute min-w-28 rounded-md border border-slate-700/70 bg-slate-950/75 px-2.5 py-2 text-[10px] shadow-2xl backdrop-blur-md ${className}`}
    >
      <div className="mb-1 flex items-center gap-1.5 text-slate-400">
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
        <span className="font-bold uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-xs font-semibold text-white">{value}</div>
    </div>
  );
}

function SketchfabTelemetryLayer({
  state,
  selectedSubsystem,
}: {
  state: VehicleTwinSceneState;
  selectedSubsystem: TwinSubsystem;
}) {
  const powerColor = state.energyLevel > 35 ? '#00a8cb' : state.energyLevel > 18 ? '#f97316' : '#ef4444';
  const signalColor = state.connectivityPct > 85 ? '#22c55e' : state.connectivityPct > 65 ? '#f97316' : '#ef4444';
  const safetyColor =
    state.passengerCondition === 'trapped' ? '#ef4444' : state.passengerCondition === 'unconscious' ? '#f59e0b' : '#22c55e';
  const tireTags: Array<{ key: TireKey; className: string; label: string }> = [
    { key: 'fl', className: 'left-[67%] top-[56%]', label: 'FL' },
    { key: 'fr', className: 'left-[30%] top-[55%]', label: 'FR' },
    { key: 'rl', className: 'left-[64%] top-[34%]', label: 'RL' },
    { key: 'rr', className: 'left-[30%] top-[34%]', label: 'RR' },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_34%,rgba(2,6,23,0.42)_100%)]" />
      <div className="absolute left-1/2 top-1/2 h-[58%] w-[74%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-red-500/35 shadow-[0_0_42px_rgba(239,68,68,0.18)]" />

      {selectedSubsystem === 'powertrain' && (
        <TwinOverlayTag
          className="bottom-[18%] left-[42%]"
          label={state.energyLabel}
          value={`${state.energyLevel}% | ${state.speedKmh} km/h`}
          color={powerColor}
        />
      )}

      {selectedSubsystem === 'connectivity' && (
        <TwinOverlayTag
          className="right-[14%] top-[18%]"
          label="Connectivity"
          value={`${state.connectivityPct}% | ${state.gnssSatellites} GNSS`}
          color={signalColor}
        />
      )}

      {selectedSubsystem === 'safety' && (
        <TwinOverlayTag
          className="left-[16%] top-[21%]"
          label="Cabin"
          value={`${state.occupants} occupants | ${state.seatbeltsFastened} belted`}
          color={safetyColor}
        />
      )}

      {state.airbagDeployed && (selectedSubsystem === 'safety' || selectedSubsystem === 'overview') && (
        <TwinOverlayTag className="left-[19%] bottom-[24%]" label="Safety" value="Airbag deployed" color="#ef4444" />
      )}

      {selectedSubsystem === 'tires' &&
        tireTags.map((tag) => (
          <TwinOverlayTag
            key={tag.key}
            className={tag.className}
            label={tag.label}
            value={`${state.tirePressure[tag.key].toFixed(1)} psi`}
            color={pressureColor(state.tirePressure[tag.key], state.tireTargetPsi)}
          />
        ))}

      {state.crashDetected && (
        <div
          className="absolute h-5 w-5 rounded-full bg-red-500 shadow-[0_0_28px_rgba(239,68,68,0.95)]"
          style={{
            left: state.collisionType === 'rear' ? '34%' : state.collisionType === 'side' ? '49%' : '68%',
            top: state.collisionType === 'rollover' ? '28%' : '52%',
          }}
        />
      )}
    </div>
  );
}

function SketchfabVehicleTwin({
  state,
  selectedSubsystem,
  active,
}: {
  state: VehicleTwinSceneState;
  selectedSubsystem: TwinSubsystem;
  active: boolean;
}) {
  return (
    <div className="absolute inset-0 bg-slate-950">
      {active ? (
        <iframe
          title="2018 Nissan Qashqai"
          src={QASHQAI_MODEL_URL}
          allow="autoplay; fullscreen; xr-spatial-tracking"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          className="h-full w-full border-0"
          {...SKETCHFAB_IFRAME_CAPABILITIES}
        />
      ) : (
        <div className="h-full w-full bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.72),rgba(2,6,23,1))]" />
      )}
      <SketchfabTelemetryLayer state={state} selectedSubsystem={selectedSubsystem} />
      <div className="pointer-events-auto absolute bottom-3 left-3 z-20 rounded border border-slate-800/70 bg-slate-950/75 px-2.5 py-1.5 text-[10px] font-medium text-slate-400 backdrop-blur-sm">
        <a href={QASHQAI_VIEWER_URL} target="_blank" rel="noreferrer" className="text-slate-200 hover:text-white">
          2018 Nissan Qashqai
        </a>
        <span className="px-1">by</span>
        <a href="https://sketchfab.com/ddiaz-design" target="_blank" rel="noreferrer" className="text-slate-200 hover:text-white">
          Ddiaz Design
        </a>
        <span className="px-1">|</span>
        <a href={QASHQAI_LICENSE_URL} target="_blank" rel="noreferrer" className="text-slate-200 hover:text-white">
          CC BY-NC-SA
        </a>
      </div>
    </div>
  );
}

function TwinVehicle({ state, selectedSubsystem }: VehicleDigitalTwinSceneProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((frame) => {
    if (!groupRef.current) return;
    const hover = Math.sin(frame.clock.elapsedTime * 1.1) * 0.018;
    groupRef.current.position.y = hover;
    if (state.collisionType === 'rollover' && state.crashDetected) {
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, Math.PI / 2, 0.04);
    } else {
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, 0.04);
    }
  });

  const safetyActive = selectedSubsystem === 'safety';
  const tiresActive = selectedSubsystem === 'tires';
  const connectivityActive = selectedSubsystem === 'connectivity';
  const powertrainActive = selectedSubsystem === 'powertrain';

  return (
    <group ref={groupRef}>
      <StatusHalo healthStatus={state.healthStatus} />
      <PremiumTeslaEV color={state.vehicleColor} />
      <PowertrainFlow energyLevel={state.energyLevel} speedKmh={state.speedKmh} active={powertrainActive} />
      <CabinOccupants
        occupants={state.occupants}
        seatbeltsFastened={state.seatbeltsFastened}
        passengerCondition={state.passengerCondition}
        active={safetyActive}
      />
      <ConnectionMast
        connectivityPct={state.connectivityPct}
        gnssSatellites={state.gnssSatellites}
        eCallMode={state.eCallMode}
        active={connectivityActive}
      />
      {TIRE_POSITIONS.map((tire) => (
        <TireBeacon
          key={tire.key}
          position={tire.position}
          label={tire.label}
          pressure={state.tirePressure[tire.key]}
          target={state.tireTargetPsi}
          active={tiresActive}
        />
      ))}
      {state.crashDetected && <ImpactMarker collisionType={state.collisionType} level={state.impactLevel} />}
      {state.airbagDeployed && safetyActive && (
        <TwinTag position={[-1.55, 1.48, 0.2]} label="Safety" value="Airbag deployed" color="#ef4444" />
      )}
    </group>
  );
}

export default function VehicleDigitalTwinScene({ state, selectedSubsystem, className }: VehicleDigitalTwinSceneProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [modelMode, setModelMode] = useState<'qashqai' | 'telemetry'>('qashqai');
  const [isRenderable, setIsRenderable] = useState(false);
  const statusLabel =
    state.healthStatus === 'critical' ? 'Critical' : state.healthStatus === 'warning' ? 'Watch' : 'Nominal';
  const statusColor = healthColor(state.healthStatus);

  useEffect(() => {
    const element = rootRef.current;
    if (!element) return;

    const updateRenderable = () => {
      const bounds = element.getBoundingClientRect();
      setIsRenderable(bounds.width > 120 && bounds.height > 120);
    };

    updateRenderable();
    const resizeObserver = new ResizeObserver(updateRenderable);
    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div
      ref={rootRef}
      className={`relative w-full overflow-hidden rounded-lg border border-slate-800 bg-[#020617] shadow-[inset_0_0_56px_rgba(0,0,0,0.78)] ${className || 'h-[520px] min-h-[420px]'}`}
    >
      <div className="pointer-events-none absolute left-4 top-4 z-10 flex flex-wrap items-center gap-3">
        <div className="rounded-md border border-slate-700/70 bg-slate-950/70 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-200 backdrop-blur-md">
          Digital Twin Online
        </div>
        <div className="flex items-center gap-2 rounded-md border border-slate-700/70 bg-slate-950/70 px-3 py-2 text-xs font-bold text-white backdrop-blur-md">
          <span className="h-2 w-2 rounded-full shadow-[0_0_12px_currentColor]" style={{ backgroundColor: statusColor, color: statusColor }} />
          {statusLabel}
        </div>
      </div>

      <div className="absolute right-4 top-4 z-20 flex rounded-md border border-slate-700/70 bg-slate-950/70 p-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 backdrop-blur-md">
        {[
          ['qashqai', 'Real Model'],
          ['telemetry', '3D Twin'],
        ].map(([mode, label]) => (
          <button
            key={mode}
            type="button"
            onClick={() => setModelMode(mode as 'qashqai' | 'telemetry')}
            className={`rounded px-2.5 py-1.5 transition ${
              modelMode === mode ? 'bg-white text-slate-950 shadow-sm' : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {modelMode === 'qashqai' ? (
        <SketchfabVehicleTwin state={state} selectedSubsystem={selectedSubsystem} active={isRenderable} />
      ) : (
        <Canvas shadows camera={{ position: [-6, 4.2, 6], fov: 43 }} dpr={[1, 1.5]}>
          <color attach="background" args={['#020617']} />
          <fog attach="fog" args={['#020617', 12, 28]} />
          <ambientLight intensity={0.2} />
          <directionalLight
            position={[5, 9, 6]}
            intensity={1.15}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-bias={-0.0001}
          />
          <pointLight position={[-4, 3, -4]} intensity={0.58} color="#00a8cb" />
          <pointLight position={[4, 3, 4]} intensity={0.36} color={statusColor} />

          <TwinVehicle state={state} selectedSubsystem={selectedSubsystem} />

          <Grid
            renderOrder={-1}
            position={[0, 0, 0]}
            infiniteGrid
            cellSize={0.5}
            cellThickness={0.45}
            sectionSize={2}
            sectionThickness={1}
            sectionColor={new THREE.Color(0.05, 0.2, 0.36)}
            cellColor={new THREE.Color(0.02, 0.08, 0.14)}
            fadeDistance={20}
          />
          <ContactShadows position={[0, 0.01, 0]} opacity={0.72} scale={10} blur={2.3} far={4} color="#000000" />
          <Environment preset="city" />
          <EffectComposer>
            <Bloom luminanceThreshold={1.05} mipmapBlur intensity={0.48} />
            <Vignette eskil={false} offset={0.08} darkness={1.05} />
          </EffectComposer>
          <OrbitControls
            enablePan={false}
            minPolarAngle={0.1}
            maxPolarAngle={Math.PI / 2 - 0.05}
            minDistance={4.4}
            maxDistance={11.5}
            autoRotate
            autoRotateSpeed={0.35}
          />
        </Canvas>
      )}

      <div className="pointer-events-none absolute bottom-3 right-3 rounded border border-slate-800/70 bg-slate-950/50 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-slate-500 backdrop-blur-sm">
        {selectedSubsystem.replace('-', ' ')} layer
      </div>
    </div>
  );
}
