import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  Html,
  Environment,
  ContactShadows,
  Grid,
  Sparkles,
  Line,
  Float,
} from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { VehicleTelemetry } from '../types';

interface Incident3DViewProps {
  telemetry?: VehicleTelemetry;
  passengerCount: number;
}

const Scanner = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.z = Math.sin(state.clock.elapsedTime * 0.8) * 2.7;
    }
  });
  return (
    <mesh ref={meshRef} position={[0, 0.58, 0]}>
      <boxGeometry args={[2.35, 1.6, 0.02]} />
      <meshBasicMaterial
        color="#0ea5e9"
        transparent
        opacity={0.045}
        toneMapped={false}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(2.35, 1.6, 0.02)]} />
        <lineBasicMaterial color="#38bdf8" transparent opacity={0.45} toneMapped={false} />
      </lineSegments>
    </mesh>
  );
};

const ImpactZone = ({
  position,
  color,
  scale = 1,
}: {
  position: [number, number, number];
  color: string;
  scale?: number;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      const pulse = Math.sin(t * 4) * 0.1 + 1;
      groupRef.current.scale.setScalar(scale * pulse);
    }
    if (ring1Ref.current) {
      const s1 = 1 + ((t * 2) % 2);
      ring1Ref.current.scale.setScalar(s1);
      (ring1Ref.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - ((t * 2) % 2));
    }
    if (ring2Ref.current) {
      const s2 = 1 + ((t * 2 + 1) % 2);
      ring2Ref.current.scale.setScalar(s2);
      (ring2Ref.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - ((t * 2 + 1) % 2));
    }
  });

  return (
    <group position={position}>
      <group ref={groupRef}>
        <mesh>
          <sphereGeometry args={[0.4, 32, 32]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.3}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      </group>

      <mesh ref={ring1Ref} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.4, 0.45, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh ref={ring2Ref} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.4, 0.45, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <Sparkles count={20} scale={1.5} size={3} speed={0.4} opacity={0.8} color={color} />
    </group>
  );
};

const PassengerMarker = ({
  position,
  status,
  index,
}: {
  position: [number, number, number];
  status: 'normal' | 'unconscious' | 'trapped';
  index: number;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const color = status === 'normal' ? '#38bdf8' : status === 'unconscious' ? '#fbbf24' : '#ef4444';
  const isCritical = status !== 'normal';

  useFrame((state) => {
    if (meshRef.current && isCritical) {
      const pulse = Math.sin(state.clock.elapsedTime * 6) * 0.15 + 1;
      meshRef.current.scale.setScalar(pulse);
    }
  });

  const hudY = 0.8 + (index % 2) * 0.4;
  const hudX = position[0] > 0 ? 1.2 : -1.2;

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.12, 32, 32]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.2, 32, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.2}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {isCritical && (
        <>
          <Line
            points={[[0, 0, 0], [hudX / 2, hudY / 2, 0], [hudX, hudY, 0]]}
            color={color}
            lineWidth={1.5}
            transparent
            opacity={0.6}
          />
          <Html position={[hudX, hudY, 0]} center zIndexRange={[100, 0]}>
            <div
              className={`px-2.5 py-1.5 rounded text-[10px] font-bold text-white whitespace-nowrap shadow-[0_0_15px_rgba(0,0,0,0.5)] border backdrop-blur-md flex items-center gap-2
              ${status === 'trapped' ? 'bg-red-950/80 border-red-500/50' : 'bg-amber-950/80 border-amber-500/50'}`}
            >
              <span
                className={`w-2 h-2 rounded-full ${status === 'trapped' ? 'bg-red-400 animate-ping' : 'bg-amber-400 animate-pulse'}`}
              ></span>
              {status === 'trapped' ? 'TRAPPED' : 'UNCONSCIOUS'}
            </div>
          </Html>
        </>
      )}
    </group>
  );
};

const AeroWheel = ({ position }: { position: [number, number, number] }) => {
  return (
    <group position={position}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <torusGeometry args={[0.29, 0.1, 18, 44]} />
        <meshStandardMaterial color="#0f172a" roughness={0.96} />
      </mesh>

      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.295, 0.295, 0.12, 36]} />
        <meshStandardMaterial color="#a8b1bf" metalness={0.88} roughness={0.16} />
      </mesh>

      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.24, 0.24, 0.125, 5]} />
        <meshStandardMaterial color="#1e293b" metalness={0.45} roughness={0.46} />
      </mesh>

      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.068, 0.068, 0.13, 24]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.95} roughness={0.08} />
      </mesh>
    </group>
  );
};

const FenderBulge = ({ position, color }: { position: [number, number, number]; color: string }) => (
  <mesh position={position} castShadow>
    <sphereGeometry args={[0.42, 28, 28]} />
    <meshPhysicalMaterial color={color} metalness={0.6} roughness={0.22} clearcoat={1} clearcoatRoughness={0.1} />
  </mesh>
);

const PremiumTeslaEV = ({ color = '#f3f6fb' }: { color?: string }) => {
  const bodyShape = React.useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-2.35, 0.16);
    s.quadraticCurveTo(-2.48, 0.2, -2.46, 0.32);
    s.quadraticCurveTo(-2.42, 0.68, -2.05, 0.86);
    s.quadraticCurveTo(-1.72, 1.0, -1.1, 1.03);
    s.lineTo(0.45, 1.03);
    s.quadraticCurveTo(1.15, 0.99, 1.78, 0.86);
    s.quadraticCurveTo(2.18, 0.75, 2.42, 0.54);
    s.quadraticCurveTo(2.57, 0.4, 2.56, 0.26);
    s.quadraticCurveTo(2.5, 0.12, 2.25, 0.1);
    s.lineTo(-2.16, 0.1);
    s.quadraticCurveTo(-2.3, 0.11, -2.35, 0.16);
    return s;
  }, []);

  const greenhouseShape = React.useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(1.02, 0.92);
    s.quadraticCurveTo(0.78, 1.18, 0.42, 1.33);
    s.quadraticCurveTo(0.04, 1.49, -0.48, 1.5);
    s.quadraticCurveTo(-0.95, 1.49, -1.35, 1.34);
    s.quadraticCurveTo(-1.73, 1.16, -2.02, 0.93);
    s.quadraticCurveTo(-1.2, 0.97, -0.05, 0.98);
    s.quadraticCurveTo(0.72, 0.98, 1.02, 0.92);
    return s;
  }, []);

  const bodyExtrudeSettings = React.useMemo(
    () => ({
      depth: 1.94,
      bevelEnabled: true,
      bevelSegments: 18,
      steps: 2,
      bevelSize: 0.12,
      bevelThickness: 0.1,
      curveSegments: 28,
    }),
    [],
  );

  const greenhouseExtrudeSettings = React.useMemo(
    () => ({
      depth: 1.5,
      bevelEnabled: true,
      bevelSegments: 16,
      steps: 2,
      bevelSize: 0.08,
      bevelThickness: 0.04,
      curveSegments: 28,
    }),
    [],
  );

  const wheelPositions: [number, number, number][] = [
    [-0.98, 0.34, 1.46],
    [0.98, 0.34, 1.46],
    [-0.98, 0.34, -1.38],
    [0.98, 0.34, -1.38],
  ];

  const bodyMaterial = (
    <meshPhysicalMaterial
      color={color}
      metalness={0.68}
      roughness={0.18}
      clearcoat={1}
      clearcoatRoughness={0.08}
      reflectivity={1}
      envMapIntensity={1.35}
    />
  );

  return (
    <group>
      <group rotation={[0, -Math.PI / 2, 0]}>
        <mesh position={[0, -0.02, -0.97]} castShadow receiveShadow>
          <extrudeGeometry args={[bodyShape, bodyExtrudeSettings]} />
          {bodyMaterial}
        </mesh>

        <mesh position={[0, 0.03, -0.75]} castShadow>
          <extrudeGeometry args={[greenhouseShape, greenhouseExtrudeSettings]} />
          <meshPhysicalMaterial
            color="#020617"
            metalness={0.25}
            roughness={0.08}
            transmission={0.92}
            transparent
            thickness={0.7}
            ior={1.5}
            envMapIntensity={2.2}
          />
        </mesh>

        {/* Hood highlight / front sculpting */}
        <mesh position={[1.65, 0.9, 0]} rotation={[0, 0, -0.04]}>
          <boxGeometry args={[1.4, 0.02, 1.42]} />
          <meshPhysicalMaterial color="#ffffff" transparent opacity={0.08} metalness={0.4} roughness={0.12} />
        </mesh>

        {/* Windshield */}
        <mesh position={[0.62, 1.06, 0]} rotation={[0, Math.PI / 2, -0.38]}>
          <planeGeometry args={[1.42, 0.7]} />
          <meshPhysicalMaterial
            color="#07111f"
            transmission={0.95}
            transparent
            opacity={0.98}
            roughness={0.05}
            metalness={0.05}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Rear glass */}
        <mesh position={[-1.46, 1.02, 0]} rotation={[0, -Math.PI / 2, 0.28]}>
          <planeGeometry args={[1.08, 0.62]} />
          <meshPhysicalMaterial
            color="#07111f"
            transmission={0.95}
            transparent
            opacity={0.98}
            roughness={0.05}
            metalness={0.05}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Panoramic roof */}
        <mesh position={[-0.34, 1.36, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.82, 1.34]} />
          <meshPhysicalMaterial
            color="#020617"
            transmission={0.9}
            transparent
            opacity={0.95}
            roughness={0.05}
            metalness={0.15}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Side windows */}
        {[0.79, -0.79].map((z, idx) => (
          <React.Fragment key={idx}>
            <mesh position={[0.1, 1.14, z]}>
              <boxGeometry args={[1.68, 0.52, 0.02]} />
              <meshPhysicalMaterial color="#07111f" transmission={0.88} transparent opacity={0.92} roughness={0.06} />
            </mesh>
            <mesh position={[-1.28, 1.08, z]} rotation={[0, 0, 0.02]}>
              <boxGeometry args={[0.75, 0.42, 0.02]} />
              <meshPhysicalMaterial color="#07111f" transmission={0.88} transparent opacity={0.92} roughness={0.06} />
            </mesh>
          </React.Fragment>
        ))}

        {/* Frunk shut line */}
        <mesh position={[1.62, 0.95, 0]}>
          <boxGeometry args={[0.03, 0.02, 1.5]} />
          <meshStandardMaterial color="#64748b" roughness={0.8} />
        </mesh>

        {/* Door handles */}
        {[0.83, -0.83].map((z, idx) => (
          <React.Fragment key={idx}>
            <mesh position={[0.12, 0.88, z]}>
              <boxGeometry args={[0.18, 0.025, 0.02]} />
              <meshPhysicalMaterial color="#dbe4f0" metalness={0.85} roughness={0.18} />
            </mesh>
            <mesh position={[-0.72, 0.88, z]}>
              <boxGeometry args={[0.18, 0.025, 0.02]} />
              <meshPhysicalMaterial color="#dbe4f0" metalness={0.85} roughness={0.18} />
            </mesh>
          </React.Fragment>
        ))}

        {/* B-pillars */}
        {[0.77, -0.77].map((z, idx) => (
          <mesh key={idx} position={[-0.34, 1.11, z]}>
            <boxGeometry args={[0.05, 0.5, 0.02]} />
            <meshStandardMaterial color="#020617" roughness={0.35} metalness={0.2} />
          </mesh>
        ))}

        {/* Side mirrors */}
        {[0.95, -0.95].map((z, idx) => (
          <group key={idx} position={[0.74, 0.98, z]}>
            <mesh rotation={[0, z > 0 ? 0.12 : -0.12, 0]} castShadow>
              <boxGeometry args={[0.08, 0.08, 0.16]} />
              {bodyMaterial}
            </mesh>
            <mesh position={[0.03, -0.08, 0]} rotation={[0, 0, z > 0 ? -0.18 : 0.18]}>
              <boxGeometry args={[0.03, 0.1, 0.03]} />
              <meshStandardMaterial color="#111827" roughness={0.65} />
            </mesh>
          </group>
        ))}

        {/* Front fascia / EV nose */}
        <mesh position={[2.48, 0.56, 0]}>
          <boxGeometry args={[0.04, 0.24, 1.48]} />
          <meshStandardMaterial color="#101826" roughness={0.5} metalness={0.2} />
        </mesh>
        <mesh position={[2.42, 0.28, 0]}>
          <boxGeometry args={[0.03, 0.12, 1.05]} />
          <meshStandardMaterial color="#060b13" roughness={0.95} />
        </mesh>

        {/* Slim Tesla-like headlights */}
        <mesh position={[2.38, 0.73, 0.63]} rotation={[0, 0.12, -0.1]}>
          <boxGeometry args={[0.04, 0.08, 0.46]} />
          <meshBasicMaterial color="#e2f3ff" toneMapped={false} />
          <pointLight color="#ffffff" intensity={0.8} distance={3.5} />
        </mesh>
        <mesh position={[2.38, 0.73, -0.63]} rotation={[0, -0.12, -0.1]}>
          <boxGeometry args={[0.04, 0.08, 0.46]} />
          <meshBasicMaterial color="#e2f3ff" toneMapped={false} />
          <pointLight color="#ffffff" intensity={0.8} distance={3.5} />
        </mesh>

        {/* Rear light bar */}
        <mesh position={[-2.42, 0.86, 0]}>
          <boxGeometry args={[0.04, 0.06, 1.5]} />
          <meshBasicMaterial color="#ff304f" toneMapped={false} />
          <pointLight color="#ff304f" intensity={0.75} distance={3.2} />
        </mesh>

        {/* Lower black rocker */}
        {[0.86, -0.86].map((z, idx) => (
          <mesh key={idx} position={[0, 0.2, z]}>
            <boxGeometry args={[4.35, 0.12, 0.04]} />
            <meshStandardMaterial color="#020617" roughness={0.95} />
          </mesh>
        ))}

        {/* Rear diffuser */}
        <mesh position={[-2.32, 0.18, 0]}>
          <boxGeometry args={[0.05, 0.12, 1.32]} />
          <meshStandardMaterial color="#040812" roughness={0.95} />
        </mesh>
      </group>

      {/* World-space wheel arch shoulders */}
      {wheelPositions.map((pos, i) => (
        <FenderBulge key={`fender-${i}`} position={[pos[0], pos[1] + 0.25, pos[2]]} color={color} />
      ))}

      {/* Side character lines */}
      <Line
        points={[
          [-1.95, 1.02, 0.84],
          [-1.2, 1.09, 0.84],
          [0.25, 1.09, 0.84],
          [1.72, 0.93, 0.84],
        ]}
        color="#ffffff"
        lineWidth={0.6}
        transparent
        opacity={0.26}
      />
      <Line
        points={[
          [-1.95, 1.02, -0.84],
          [-1.2, 1.09, -0.84],
          [0.25, 1.09, -0.84],
          [1.72, 0.93, -0.84],
        ]}
        color="#ffffff"
        lineWidth={0.6}
        transparent
        opacity={0.26}
      />

      {/* Window trim */}
      <Line
        points={[
          [0.92, 0.94, 0.83],
          [0.6, 1.22, 0.83],
          [0.12, 1.42, 0.83],
          [-0.72, 1.42, 0.83],
          [-1.5, 1.25, 0.83],
          [-1.95, 0.96, 0.83],
        ]}
        color="#e2e8f0"
        lineWidth={0.75}
        transparent
        opacity={0.35}
      />
      <Line
        points={[
          [0.92, 0.94, -0.83],
          [0.6, 1.22, -0.83],
          [0.12, 1.42, -0.83],
          [-0.72, 1.42, -0.83],
          [-1.5, 1.25, -0.83],
          [-1.95, 0.96, -0.83],
        ]}
        color="#e2e8f0"
        lineWidth={0.75}
        transparent
        opacity={0.35}
      />

      {wheelPositions.map((pos, i) => (
        <AeroWheel key={i} position={pos} />
      ))}
    </group>
  );
};

const CarModel = ({ telemetry, passengerCount }: { telemetry?: VehicleTelemetry; passengerCount: number }) => {
  const group = useRef<THREE.Group>(null);

  useFrame(() => {
    if (group.current && telemetry?.collisionType === 'rollover') {
      group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, Math.PI / 2, 0.05);
      group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, 0.5, 0.05);
    }
  });

  const getImpactColor = (level: string) => {
    switch (level) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f97316';
      case 'low':
        return '#eab308';
      default:
        return '#22c55e';
    }
  };

  const impactColor = telemetry ? getImpactColor(telemetry.impactLevel) : '#22c55e';

  const seats = [
    [0.35, 0.6, 0.4],
    [-0.35, 0.6, 0.4],
    [0.35, 0.6, -0.4],
    [-0.35, 0.6, -0.4],
    [0, 0.6, -0.4],
  ];

  return (
    <group ref={group}>
      <Scanner />

      <PremiumTeslaEV color="#f1f5f9" />

      {telemetry?.collisionType === 'front' && <ImpactZone position={[0, 0.5, 2.2]} color={impactColor} scale={1.5} />}
      {telemetry?.collisionType === 'rear' && <ImpactZone position={[0, 0.5, -2.2]} color={impactColor} scale={1.5} />}
      {telemetry?.collisionType === 'side' && (
        <>
          <ImpactZone position={[1, 0.5, 0]} color={impactColor} scale={1.2} />
          <ImpactZone position={[-1, 0.5, 0]} color={impactColor} scale={1.2} />
        </>
      )}

      {seats.slice(0, passengerCount).map((pos, i) => {
        const isUnconscious = telemetry?.passengerCondition === 'unconscious';
        const isTrapped = telemetry?.passengerCondition === 'trapped';
        const status = isTrapped ? 'trapped' : isUnconscious ? 'unconscious' : 'normal';

        return <PassengerMarker key={i} index={i} position={pos as [number, number, number]} status={status} />;
      })}

      {telemetry?.airbagDeployed && (
        <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
          <group position={[0.35, 0.7, 0.8]}>
            <mesh>
              <sphereGeometry args={[0.25, 32, 32]} />
              <meshPhysicalMaterial
                color="#f8fafc"
                transmission={0.8}
                opacity={0.9}
                transparent
                roughness={0.1}
                thickness={0.5}
              />
            </mesh>
            <Html position={[0, 0.4, 0]} center zIndexRange={[100, 0]}>
              <div className="px-2 py-1 bg-white/10 backdrop-blur-md text-white text-[9px] font-bold rounded shadow-[0_0_10px_rgba(255,255,255,0.2)] whitespace-nowrap border border-white/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                AIRBAG DEPLOYED
              </div>
            </Html>
          </group>
        </Float>
      )}
    </group>
  );
};

export const Incident3DView: React.FC<Incident3DViewProps> = ({ telemetry, passengerCount }) => {
  return (
    <div className="w-full h-[450px] bg-[#020617] rounded-xl overflow-hidden relative border border-slate-800 shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]">
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-3 pointer-events-none">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></div>
          <span className="text-blue-400 text-xs font-mono tracking-wider font-bold">SYSTEM ACTIVE</span>
        </div>
        {telemetry?.crashDetected && (
          <div className="bg-red-950/40 border border-red-500/30 text-red-400 px-3 py-2 rounded-lg text-sm font-medium backdrop-blur-md flex items-center gap-3 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
            </div>
            CRASH DETECTED
          </div>
        )}
        {telemetry?.impactLevel === 'high' && (
          <div className="bg-orange-950/40 border border-orange-500/30 text-orange-400 px-3 py-2 rounded-lg text-sm font-medium backdrop-blur-md shadow-[0_0_20px_rgba(249,115,22,0.15)] flex items-center gap-2">
            <span className="text-lg">⚠️</span> HIGH IMPACT ({telemetry.deltaV} km/h ΔV)
          </div>
        )}
        {telemetry?.possibleEntrapment && (
          <div className="bg-red-950/40 border border-red-500/30 text-red-400 px-3 py-2 rounded-lg text-sm font-medium backdrop-blur-md shadow-[0_0_20px_rgba(239,68,68,0.15)] flex items-center gap-2">
            <span className="text-lg">🚨</span> POSSIBLE ENTRAPMENT
          </div>
        )}
      </div>

      <Canvas shadows camera={{ position: [-5, 4, 6], fov: 45 }}>
        <color attach="background" args={['#020617']} />
        <fog attach="fog" args={['#020617', 10, 30]} />

        <ambientLight intensity={0.2} />
        <directionalLight
          position={[5, 10, 5]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0001}
        />
        <spotLight position={[-5, 5, -5]} intensity={0.5} color="#3b82f6" />

        <CarModel telemetry={telemetry} passengerCount={passengerCount} />

        <Grid
          renderOrder={-1}
          position={[0, 0, 0]}
          infiniteGrid
          cellSize={0.5}
          cellThickness={0.5}
          sectionSize={2}
          sectionThickness={1}
          sectionColor={new THREE.Color(0.1, 0.2, 0.5)}
          cellColor={new THREE.Color(0.05, 0.1, 0.2)}
          fadeDistance={20}
        />

        <ContactShadows position={[0, 0.01, 0]} opacity={0.7} scale={10} blur={2} far={4} color="#000000" />

        <Environment preset="city" />

        <EffectComposer>
          <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} />
          <ChromaticAberration offset={new THREE.Vector2(0.002, 0.002)} />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>

        <OrbitControls
          enablePan={false}
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2 - 0.05}
          minDistance={4}
          maxDistance={12}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>

      <div className="absolute bottom-3 right-3 text-[10px] text-slate-500 font-mono tracking-widest pointer-events-none bg-slate-900/40 px-2 py-1 rounded border border-slate-800/50 backdrop-blur-sm">
        INTERACTIVE DIGITAL TWIN
      </div>
    </div>
  );
};
