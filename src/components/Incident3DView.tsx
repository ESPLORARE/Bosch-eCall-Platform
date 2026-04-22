import React, { useMemo, useRef } from 'react';
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
  RoundedBox,
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

const AeroWheel = ({ position, side }: { position: [number, number, number]; side: 1 | -1 }) => {
  return (
    <group position={position}>
      <mesh rotation={[0, Math.PI / 2, 0]} castShadow>
        <torusGeometry args={[0.32, 0.11, 22, 56]} />
        <meshStandardMaterial color="#020617" roughness={0.92} metalness={0.08} />
      </mesh>

      <mesh rotation={[0, 0, Math.PI / 2]} position={[side * 0.015, 0, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.16, 48]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.18} />
      </mesh>

      {[0, 1, 2, 3, 4].map((spoke) => (
        <mesh key={spoke} rotation={[Math.PI / 2, 0, (spoke * Math.PI * 2) / 5]} position={[side * 0.105, 0, 0]}>
          <boxGeometry args={[0.055, 0.48, 0.035]} />
          <meshStandardMaterial color="#64748b" metalness={0.72} roughness={0.2} />
        </mesh>
      ))}

      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.075, 0.075, 0.18, 28]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.95} roughness={0.08} />
      </mesh>
    </group>
  );
};

const WheelWell = ({ position, side }: { position: [number, number, number]; side: 1 | -1 }) => (
  <group position={position}>
    <mesh rotation={[0, Math.PI / 2, 0]} position={[-side * 0.02, 0, 0]}>
      <circleGeometry args={[0.48, 48]} />
      <meshStandardMaterial color="#030712" roughness={0.96} side={THREE.DoubleSide} />
    </mesh>
    <mesh rotation={[0, Math.PI / 2, 0]}>
      <torusGeometry args={[0.48, 0.025, 10, 56]} />
      <meshStandardMaterial color="#111827" metalness={0.35} roughness={0.55} />
    </mesh>
  </group>
);

type PaintProps = {
  color: string;
  metalness: number;
  roughness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  envMapIntensity: number;
};

type BodySection = {
  z: number;
  lowerHalfWidth: number;
  shoulderHalfWidth: number;
  crownHalfWidth: number;
  bottomY: number;
  shoulderY: number;
  crownY: number;
};

type CabinSection = {
  z: number;
  lowerHalfWidth: number;
  roofHalfWidth: number;
  bottomY: number;
  roofY: number;
};

function createSectionedBodyGeometry(sections: BodySection[]) {
  const vertices: number[] = [];
  const indices: number[] = [];
  const ringSize = 6;

  sections.forEach((section) => {
    vertices.push(
      -section.lowerHalfWidth,
      section.bottomY,
      section.z,
      -section.shoulderHalfWidth,
      section.shoulderY,
      section.z,
      -section.crownHalfWidth,
      section.crownY,
      section.z,
      section.crownHalfWidth,
      section.crownY,
      section.z,
      section.shoulderHalfWidth,
      section.shoulderY,
      section.z,
      section.lowerHalfWidth,
      section.bottomY,
      section.z,
    );
  });

  for (let sectionIndex = 0; sectionIndex < sections.length - 1; sectionIndex += 1) {
    const current = sectionIndex * ringSize;
    const next = (sectionIndex + 1) * ringSize;
    for (let pointIndex = 0; pointIndex < ringSize; pointIndex += 1) {
      const following = (pointIndex + 1) % ringSize;
      indices.push(current + pointIndex, next + pointIndex, next + following);
      indices.push(current + pointIndex, next + following, current + following);
    }
  }

  const startCenter = vertices.length / 3;
  const first = sections[0];
  vertices.push(0, (first.bottomY + first.crownY) / 2, first.z);
  for (let pointIndex = 0; pointIndex < ringSize; pointIndex += 1) {
    indices.push(startCenter, pointIndex, (pointIndex + 1) % ringSize);
  }

  const endCenter = vertices.length / 3;
  const last = sections[sections.length - 1];
  const lastOffset = (sections.length - 1) * ringSize;
  vertices.push(0, (last.bottomY + last.crownY) / 2, last.z);
  for (let pointIndex = 0; pointIndex < ringSize; pointIndex += 1) {
    indices.push(endCenter, lastOffset + ((pointIndex + 1) % ringSize), lastOffset + pointIndex);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createSectionedCabinGeometry(sections: CabinSection[]) {
  const vertices: number[] = [];
  const indices: number[] = [];
  const ringSize = 4;

  sections.forEach((section) => {
    vertices.push(
      -section.lowerHalfWidth,
      section.bottomY,
      section.z,
      -section.roofHalfWidth,
      section.roofY,
      section.z,
      section.roofHalfWidth,
      section.roofY,
      section.z,
      section.lowerHalfWidth,
      section.bottomY,
      section.z,
    );
  });

  for (let sectionIndex = 0; sectionIndex < sections.length - 1; sectionIndex += 1) {
    const current = sectionIndex * ringSize;
    const next = (sectionIndex + 1) * ringSize;
    for (let pointIndex = 0; pointIndex < ringSize; pointIndex += 1) {
      const following = (pointIndex + 1) % ringSize;
      indices.push(current + pointIndex, next + pointIndex, next + following);
      indices.push(current + pointIndex, next + following, current + following);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createPanelGeometry(points: Array<[number, number, number]>) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points.flat(), 3));
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  geometry.computeVertexNormals();
  return geometry;
}

const SculptedBody = ({ paint }: { paint: PaintProps }) => {
  const geometry = useMemo(
    () =>
      createSectionedBodyGeometry([
        { z: -2.34, lowerHalfWidth: 0.68, shoulderHalfWidth: 0.88, crownHalfWidth: 0.64, bottomY: 0.28, shoulderY: 0.72, crownY: 0.74 },
        { z: -1.92, lowerHalfWidth: 1.04, shoulderHalfWidth: 1.1, crownHalfWidth: 0.86, bottomY: 0.2, shoulderY: 0.86, crownY: 0.92 },
        { z: -0.72, lowerHalfWidth: 1.13, shoulderHalfWidth: 1.17, crownHalfWidth: 0.95, bottomY: 0.18, shoulderY: 0.9, crownY: 0.96 },
        { z: 0.68, lowerHalfWidth: 1.12, shoulderHalfWidth: 1.15, crownHalfWidth: 0.88, bottomY: 0.18, shoulderY: 0.9, crownY: 0.88 },
        { z: 1.56, lowerHalfWidth: 0.98, shoulderHalfWidth: 1.02, crownHalfWidth: 0.62, bottomY: 0.22, shoulderY: 0.8, crownY: 0.72 },
        { z: 2.34, lowerHalfWidth: 0.66, shoulderHalfWidth: 0.74, crownHalfWidth: 0.44, bottomY: 0.34, shoulderY: 0.62, crownY: 0.58 },
      ]),
    [],
  );

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshPhysicalMaterial {...paint} />
    </mesh>
  );
};

const SculptedCabin = () => {
  const geometry = useMemo(
    () =>
      createSectionedCabinGeometry([
        { z: -1.12, lowerHalfWidth: 0.74, roofHalfWidth: 0.5, bottomY: 0.92, roofY: 1.22 },
        { z: -0.66, lowerHalfWidth: 0.86, roofHalfWidth: 0.66, bottomY: 1, roofY: 1.48 },
        { z: 0.16, lowerHalfWidth: 0.86, roofHalfWidth: 0.7, bottomY: 1.02, roofY: 1.58 },
        { z: 0.82, lowerHalfWidth: 0.62, roofHalfWidth: 0.4, bottomY: 0.9, roofY: 1.2 },
      ]),
    [],
  );

  return (
    <mesh geometry={geometry} castShadow>
      <meshPhysicalMaterial color="#06101d" metalness={0.08} roughness={0.18} transparent opacity={0.58} depthWrite={false} envMapIntensity={0.7} />
    </mesh>
  );
};

const BodyPanel = ({
  points,
  color,
  opacity = 0.88,
}: {
  points: Array<[number, number, number]>;
  color: string;
  opacity?: number;
}) => {
  const geometry = useMemo(() => createPanelGeometry(points), [points]);

  return (
    <mesh geometry={geometry}>
      <meshPhysicalMaterial color={color} transparent opacity={opacity} roughness={0.05} metalness={0.12} side={THREE.DoubleSide} envMapIntensity={1.8} />
    </mesh>
  );
};

export const PremiumTeslaEV = ({ color = '#f3f6fb' }: { color?: string }) => {
  const paintColor = useMemo(() => {
    const base = new THREE.Color(color);
    base.lerp(new THREE.Color('#aebdcc'), 0.26);
    return `#${base.getHexString()}`;
  }, [color]);

  const wheelPositions: Array<{ position: [number, number, number]; side: 1 | -1 }> = [
    { position: [-1.16, 0.38, 1.42], side: -1 },
    { position: [1.16, 0.38, 1.42], side: 1 },
    { position: [-1.16, 0.38, -1.45], side: -1 },
    { position: [1.16, 0.38, -1.45], side: 1 },
  ];

  const bodyMaterialProps = {
    color: paintColor,
    metalness: 0.46,
    roughness: 0.28,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    envMapIntensity: 1.22,
  };

  return (
    <group>
      <SculptedBody paint={bodyMaterialProps} />
      <SculptedCabin />

      <RoundedBox args={[1.42, 0.055, 1.18]} radius={0.055} smoothness={5} position={[0, 1.57, -0.22]}>
        <meshPhysicalMaterial color="#020617" metalness={0.1} roughness={0.42} clearcoat={0.7} envMapIntensity={0.38} />
      </RoundedBox>

      <BodyPanel
        color="#08111f"
        points={[
          [-0.62, 0.92, 0.82],
          [-0.42, 1.42, 0.28],
          [0.42, 1.42, 0.28],
          [0.62, 0.92, 0.82],
        ]}
      />
      <BodyPanel
        color="#08111f"
        points={[
          [-0.62, 0.93, -1.18],
          [-0.48, 1.34, -0.84],
          [0.48, 1.34, -0.84],
          [0.62, 0.93, -1.18],
        ]}
        opacity={0.82}
      />

      {/* Body-colored pillars make the glasshouse read like a real cabin instead of one dark block. */}
      {[-0.74, 0.74].map((x) => (
        <React.Fragment key={`pillar-${x}`}>
          <mesh position={[x, 1.2, 0.5]} rotation={[0.24, 0, 0]}>
            <boxGeometry args={[0.075, 0.62, 0.06]} />
            <meshPhysicalMaterial {...bodyMaterialProps} />
          </mesh>
          <mesh position={[x, 1.2, -0.28]}>
            <boxGeometry args={[0.075, 0.66, 0.06]} />
            <meshPhysicalMaterial {...bodyMaterialProps} />
          </mesh>
          <mesh position={[x, 1.18, -0.98]} rotation={[-0.18, 0, 0]}>
            <boxGeometry args={[0.075, 0.6, 0.06]} />
            <meshPhysicalMaterial {...bodyMaterialProps} />
          </mesh>
        </React.Fragment>
      ))}

      {/* Side glass, handles, and door cuts */}
      {[-1, 1].map((side) => (
        <group key={`side-${side}`}>
          <BodyPanel
            color="#07111f"
            points={[
              [side * 0.9, 1.02, 0.68],
              [side * 0.73, 1.43, 0.18],
              [side * 0.75, 1.46, -0.26],
              [side * 0.91, 1.04, -0.28],
            ]}
          />
          <BodyPanel
            color="#07111f"
            points={[
              [side * 0.91, 1.03, -0.36],
              [side * 0.75, 1.45, -0.34],
              [side * 0.68, 1.28, -1.06],
              [side * 0.86, 0.95, -1.1],
            ]}
            opacity={0.84}
          />
          {[-0.2, 0.62].map((z) => (
            <mesh key={`handle-${side}-${z}`} position={[side * 1.1, 0.88, z]}>
              <boxGeometry args={[0.035, 0.035, 0.24]} />
              <meshPhysicalMaterial color="#e5edf7" metalness={0.8} roughness={0.16} />
            </mesh>
          ))}
          {[-0.55, 0.42].map((z) => (
            <mesh key={`door-${side}-${z}`} position={[side * 1.101, 0.72, z]}>
              <boxGeometry args={[0.018, 0.62, 0.018]} />
              <meshStandardMaterial color="#334155" roughness={0.75} />
            </mesh>
          ))}
          <mesh position={[side * 1.08, 0.2, 0]}>
            <boxGeometry args={[0.06, 0.14, 4.1]} />
            <meshStandardMaterial color="#020617" roughness={0.9} />
          </mesh>
          <group position={[side * 1.07, 1.02, 0.82]}>
            <RoundedBox args={[0.12, 0.1, 0.24]} radius={0.035} smoothness={4} castShadow>
              <meshPhysicalMaterial {...bodyMaterialProps} />
            </RoundedBox>
            <mesh position={[side * 0.03, -0.07, 0]} rotation={[0, 0, side > 0 ? -0.22 : 0.22]}>
              <boxGeometry args={[0.035, 0.12, 0.035]} />
              <meshStandardMaterial color="#111827" roughness={0.65} />
            </mesh>
          </group>
        </group>
      ))}

      {/* Front bumper, grille, lights, and plate */}
      <RoundedBox args={[1.78, 0.34, 0.22]} radius={0.08} smoothness={6} position={[0, 0.47, 2.32]} castShadow>
        <meshPhysicalMaterial {...bodyMaterialProps} />
      </RoundedBox>
      <mesh position={[0, 0.46, 2.445]}>
        <boxGeometry args={[1.26, 0.2, 0.035]} />
        <meshStandardMaterial color="#030712" roughness={0.7} metalness={0.25} />
      </mesh>
      <mesh position={[0, 0.67, 2.455]}>
        <boxGeometry args={[0.56, 0.13, 0.025]} />
        <meshStandardMaterial color="#e5e7eb" roughness={0.38} metalness={0.25} />
      </mesh>
      {[-0.56, 0.56].map((x) => (
        <mesh key={`headlight-${x}`} position={[x, 0.77, 2.46]} rotation={[0, x > 0 ? -0.08 : 0.08, 0]}>
          <boxGeometry args={[0.52, 0.075, 0.035]} />
          <meshBasicMaterial color="#c8f3ff" toneMapped={false} />
          <pointLight color="#c8f3ff" intensity={0.22} distance={2.5} />
        </mesh>
      ))}
      {[-0.74, 0.74].map((x) => (
        <mesh key={`fog-${x}`} position={[x, 0.37, 2.46]}>
          <boxGeometry args={[0.22, 0.06, 0.03]} />
          <meshBasicMaterial color="#f8fafc" toneMapped={false} />
        </mesh>
      ))}

      {/* Rear hatch, tail lamps, and diffuser */}
      <RoundedBox args={[1.82, 0.36, 0.18]} radius={0.08} smoothness={6} position={[0, 0.54, -2.28]} castShadow>
        <meshPhysicalMaterial {...bodyMaterialProps} />
      </RoundedBox>
      <mesh position={[0, 0.82, -2.395]}>
        <boxGeometry args={[1.54, 0.065, 0.035]} />
        <meshBasicMaterial color="#ff2848" toneMapped={false} />
        <pointLight color="#ff2848" intensity={0.2} distance={2.4} />
      </mesh>
      <mesh position={[0, 0.56, -2.405]}>
        <boxGeometry args={[0.58, 0.13, 0.025]} />
        <meshStandardMaterial color="#e5e7eb" roughness={0.4} metalness={0.22} />
      </mesh>
      <mesh position={[0, 0.24, -2.35]}>
        <boxGeometry args={[1.5, 0.14, 0.08]} />
        <meshStandardMaterial color="#020617" roughness={0.92} />
      </mesh>

      {/* Wheel wells sit in front of the body side, hiding the rectangular body behind the tires. */}
      {wheelPositions.map(({ position, side }, i) => (
        <WheelWell key={`well-${i}`} position={[side * 1.085, position[1], position[2]]} side={side} />
      ))}

      {/* Hood creases and side character lines */}
      <Line
        points={[
          [-0.62, 0.99, 0.72],
          [-0.4, 0.94, 1.44],
          [-0.32, 0.83, 2.08],
        ]}
        color="#ffffff"
        lineWidth={0.55}
        transparent
        opacity={0.25}
      />
      <Line
        points={[
          [0.62, 0.99, 0.72],
          [0.4, 0.94, 1.44],
          [0.32, 0.83, 2.08],
        ]}
        color="#ffffff"
        lineWidth={0.55}
        transparent
        opacity={0.25}
      />
      <Line
        points={[
          [-1.05, 0.88, -1.98],
          [-1.08, 0.94, -0.9],
          [-1.08, 0.9, 0.6],
          [-1.0, 0.78, 1.86],
        ]}
        color="#ffffff"
        lineWidth={0.6}
        transparent
        opacity={0.26}
      />
      <Line
        points={[
          [1.05, 0.88, -1.98],
          [1.08, 0.94, -0.9],
          [1.08, 0.9, 0.6],
          [1.0, 0.78, 1.86],
        ]}
        color="#ffffff"
        lineWidth={0.6}
        transparent
        opacity={0.26}
      />

      {/* Window trim */}
      <Line
        points={[
          [0.86, 0.96, 0.72],
          [0.86, 1.28, 0.34],
          [0.86, 1.46, -0.28],
          [0.86, 1.34, -0.96],
        ]}
        color="#e2e8f0"
        lineWidth={0.75}
        transparent
        opacity={0.35}
      />
      <Line
        points={[
          [-0.86, 0.96, 0.72],
          [-0.86, 1.28, 0.34],
          [-0.86, 1.46, -0.28],
          [-0.86, 1.34, -0.96],
        ]}
        color="#e2e8f0"
        lineWidth={0.75}
        transparent
        opacity={0.35}
      />

      {wheelPositions.map(({ position, side }, i) => (
        <AeroWheel key={i} position={position} side={side} />
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
          intensity={1.2}
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
          <Bloom luminanceThreshold={1.08} mipmapBlur intensity={0.68} />
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
