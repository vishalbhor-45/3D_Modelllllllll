import React, { useMemo } from "react";
import * as THREE from "three";

export default function CarProcedural(props) {
  const paint = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#c41f2b"),
        metalness: 0.6,
        roughness: 0.22,
        clearcoat: 1.0,
        clearcoatRoughness: 0.08,
        envMapIntensity: 1.2
      }),
    []
  );

  const plasticDark = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#202327",
        metalness: 0.2,
        roughness: 0.6
      }),
    []
  );

  const chrome = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#d9d9d9",
        metalness: 1.0,
        roughness: 0.12,
        envMapIntensity: 1.4
      }),
    []
  );

  const glass = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#a6c6ff",
        transmission: 0.85,
        transparent: true,
        opacity: 1.0,
        roughness: 0.02,
        metalness: 0.0,
        thickness: 0.2,
        ior: 1.45,
        envMapIntensity: 1.0
      }),
    []
  );

  const lightEmissive = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ffffff",
        emissive: "#ffffff",
        emissiveIntensity: 2.5,
        metalness: 0.0,
        roughness: 0.4
      }),
    []
  );

  const wheel = (x, z, flipped = false) => (
    <group position={[x, -0.3, z]} rotation={[0, 0, Math.PI / 2]}>
      {/* Tire */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.42, 0.42, 0.26, 32, 1, true]} />
        <meshStandardMaterial color={"#141518"} metalness={0.1} roughness={0.9} />
      </mesh>
      {/* Rim */}
      <mesh castShadow receiveShadow rotation={[0, 0, flipped ? Math.PI : 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.28, 24]} />
        <primitive object={chrome.clone()} attach="material" />
      </mesh>
      {/* Center cap */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.3, 24]} />
        <primitive object={chrome.clone()} attach="material" />
      </mesh>
      {/* Simple spokes */}
      {[0, 1, 2, 3, 4].map(i => (
        <mesh
          key={i}
          rotation={[0, 0, (i * Math.PI * 2) / 5]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.04, 0.32, 0.04]} />
          <primitive object={chrome.clone()} attach="material" />
        </mesh>
      ))}
      {/* Brake disc */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.02, 32]} />
        <meshStandardMaterial color={"#888"} metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );

  return (
    <group {...props}>
      {/* Car body core */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <sphereGeometry args={[1.25, 64, 64]} />
        <primitive object={paint} attach="material" />
      </mesh>

      {/* Lower skirt / floor */}
      <mesh castShadow receiveShadow position={[0, -0.5, 0]} scale={[2.2, 0.2, 4.4]}>
        <boxGeometry args={[1, 1, 1]} />
        <primitive object={plasticDark} attach="material" />
      </mesh>

      {/* Hood */}
      <mesh castShadow receiveShadow position={[0, 0.15, 1.2]} scale={[1.6, 0.25, 1.1]}>
        <boxGeometry args={[1, 1, 1]} />
        <primitive object={paint} attach="material" />
      </mesh>

      {/* Roof */}
      <mesh castShadow receiveShadow position={[0, 0.65, 0]} scale={[1.3, 0.25, 1.4]}>
        <boxGeometry args={[1, 1, 1]} />
        <primitive object={paint} attach="material" />
      </mesh>

      {/* Trunk */}
      <mesh castShadow receiveShadow position={[0, 0.2, -1.2]} scale={[1.5, 0.25, 1.0]}>
        <boxGeometry args={[1, 1, 1]} />
        <primitive object={paint} attach="material" />
      </mesh>

      {/* Bumpers */}
      <mesh castShadow receiveShadow position={[0, -0.1, 2.1]} scale={[1.6, 0.25, 0.2]}>
        <boxGeometry args={[1, 1, 1]} />
        <primitive object={plasticDark} attach="material" />
      </mesh>
      <mesh castShadow receiveShadow position={[0, -0.1, -2.1]} scale={[1.6, 0.25, 0.2]}>
        <boxGeometry args={[1, 1, 1]} />
        <primitive object={plasticDark} attach="material" />
      </mesh>

      {/* Side panels */}
      <mesh castShadow receiveShadow position={[0, 0.25, 0]} scale={[2.2, 0.5, 2.8]}>
        <boxGeometry args={[1, 1, 1]} />
        <primitive object={paint} attach="material" />
      </mesh>

      {/* Windows */}
      <mesh castShadow receiveShadow position={[0, 0.6, 0.5]} scale={[1.2, 0.3, 0.9]}>
        <boxGeometry args={[1, 1, 1]} />
        <primitive object={glass} attach="material" />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.6, -0.6]} scale={[1.2, 0.3, 0.9]}>
        <boxGeometry args={[1, 1, 1]} />
        <primitive object={glass} attach="material" />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.45, 1.65]} scale={[1.1, 0.25, 0.4]}>
        <boxGeometry args={[1, 1, 1]} />
        <primitive object={glass} attach="material" />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.45, -1.65]} scale={[1.1, 0.25, 0.4]}>
        <boxGeometry args={[1, 1, 1]} />
        <primitive object={glass} attach="material" />
      </mesh>

      {/* Headlights */}
      <mesh castShadow position={[0.6, 0.05, 2.12]} scale={[0.4, 0.08, 0.02]}>
        <boxGeometry args={[1, 1, 1]} />
        <primitive object={lightEmissive} attach="material" />
      </mesh>
      <mesh castShadow position={[-0.6, 0.05, 2.12]} scale={[0.4, 0.08, 0.02]}>
        <boxGeometry args={[1, 1, 1]} />
        <primitive object={lightEmissive} attach="material" />
      </mesh>

      {/* Taillights */}
      <mesh castShadow position={[0.6, 0.05, -2.12]} scale={[0.4, 0.08, 0.02]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={"#ff1a1a"} emissive={"#ff1a1a"} emissiveIntensity={2.2} />
      </mesh>
      <mesh castShadow position={[-0.6, 0.05, -2.12]} scale={[0.4, 0.08, 0.02]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={"#ff1a1a"} emissive={"#ff1a1a"} emissiveIntensity={2.2} />
      </mesh>

      {/* Mirrors */}
      <mesh castShadow position={[1.15, 0.45, 0.4]} scale={[0.2, 0.08, 0.28]}>
        <boxGeometry args={[1, 1, 1]} />
        <primitive object={chrome} attach="material" />
      </mesh>
      <mesh castShadow position={[-1.15, 0.45, 0.4]} scale={[0.2, 0.08, 0.28]}>
        <boxGeometry args={[1, 1, 1]} />
        <primitive object={chrome} attach="material" />
      </mesh>

      {/* Exhaust */}
      <mesh castShadow position={[0.4, -0.4, -2.15]} scale={[0.08, 0.08, 0.3]}>
        <boxGeometry args={[1, 1, 1]} />
        <primitive object={chrome} attach="material" />
      </mesh>
      <mesh castShadow position={[-0.4, -0.4, -2.15]} scale={[0.08, 0.08, 0.3]}>
        <boxGeometry args={[1, 1, 1]} />
        <primitive object={chrome} attach="material" />
      </mesh>

      {/* Wheels */}
      {wheel(1.35, 1.55, false)}
      {wheel(-1.35, 1.55, true)}
      {wheel(1.35, -1.55, false)}
      {wheel(-1.35, -1.55, true)}
    </group>
  );
}
