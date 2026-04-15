
import { useLayoutEffect, useMemo, useRef } from "react";
import { useLoader, useThree } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import * as THREE from "three";
import { setupKTX2 } from "./ktx2Setup.js";

export default function BridgeModel({ modelPath = "/models/MNB_624+800_glb1.glb", ...props }) {
  const { gl, camera } = useThree();
  const wrapperRef = useRef();
  const ktx2Loader = useMemo(() => setupKTX2(gl), [gl]);
  const onCenterChanged = props?.onCenterChanged;

  const gltf = useLoader(GLTFLoader, modelPath, (loader) => {
    loader.setKTX2Loader(ktx2Loader);
    loader.setMeshoptDecoder(MeshoptDecoder);
  });

  // Always render the original model (no fallback reconstruction).
  // We will frame the camera to the model center instead.
  const scene = useMemo(() => (gltf.scene || gltf.scenes?.[0])?.clone(true), [gltf]);

  useLayoutEffect(() => {
    if (!scene || !wrapperRef.current) return;

    scene.traverse((o) => {
      if (!o.isMesh) return;
      o.visible = true;
      o.castShadow = true;
      o.receiveShadow = true;
      o.frustumCulled = false;
      if (o.material) {
        if (Array.isArray(o.material)) {
          o.material.forEach((m) => m && (m.needsUpdate = true));
        } else {
          o.material.needsUpdate = true;
        }
      }
    });

    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(scene);
    const center = new THREE.Vector3();
    const size = box.getSize(new THREE.Vector3());
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    if (!Number.isFinite(maxDim) || maxDim <= 0) return;

    // Keep model transforms/materials intact (like gltf-viewer).
    // Only move the camera to look at the model's real center.
    wrapperRef.current.position.set(0, 0, 0);
    wrapperRef.current.scale.setScalar(1);
    wrapperRef.current.updateMatrixWorld(true);

    const fov = (camera.fov * Math.PI) / 180;
    const distance = (maxDim / (2 * Math.tan(fov / 2))) * 1.3;
    const dir = new THREE.Vector3(1, 0.45, 1).normalize();
    const camPos = center.clone().add(dir.multiplyScalar(Math.max(distance, 10)));
    camera.position.copy(camPos);
    camera.near = Math.max(0.01, distance / 1000);
    camera.far = Math.max(5000, distance * 20);
    camera.lookAt(center);
    camera.updateProjectionMatrix();

    if (typeof onCenterChanged === "function") {
      onCenterChanged([center.x, center.y, center.z]);
    }
  }, [scene, camera]);

  return (
    <group {...props}>
      <group ref={wrapperRef}>
        <primitive object={scene} />
      </group>
    </group>
  );
}
 