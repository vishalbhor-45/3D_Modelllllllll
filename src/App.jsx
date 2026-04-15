
import * as THREE from "three";
import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useThree, useFrame, extend } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Loader,
} from "@react-three/drei";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls.js";
import { setupKTX2 } from "./ktx2Setup.js";
import BridgeModel from "./Bridge.jsx";
import ModelSelector from "./ModelSelector.jsx";
import MapComponent from "./MapComponent.jsx";

// Extend React Three Fiber with TrackballControls
extend({ TrackballControls });

// Component to configure KTX2 before models load
function KTX2Config() {
  const { gl } = useThree();
  
  useEffect(() => {
    if (gl) {
      setupKTX2(gl);
    }
  }, [gl]);
  
  return null;
}

// Custom TrackballControls component for free 360° rotation
function FreeTrackballControls(props) {
  const { camera, gl } = useThree();
  const controlsRef = useRef(null);
  const target = props.target || [0, 0, 0];
  
  useEffect(() => {
    if (controlsRef.current) {
      const controls = controlsRef.current;
      
      // Set target to model center
      controls.target.set(target[0], target[1], target[2]);
      controls.update();
      
      console.log('✅ TrackballControls - Free 360° rotation in all X, Y, Z directions enabled');
      console.log('Controls target:', controls.target);
    }
  }, [camera, gl, target]);
  
  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.update();
      // Keep target synced with current model center
      if (
        controlsRef.current.target.x !== target[0] ||
        controlsRef.current.target.y !== target[1] ||
        controlsRef.current.target.z !== target[2]
      ) {
        controlsRef.current.target.set(target[0], target[1], target[2]);
      }
    }
  });
  
  return (
    <trackballControls
      ref={controlsRef}
      args={[camera, gl.domElement]}
      target={target}
      rotateSpeed={3.0}
      zoomSpeed={1}
      panSpeed={0.8}
      minDistance={5}
      maxDistance={200}
      dynamicDampingFactor={0.1}
      noRotate={false}
      noZoom={false}
      noPan={false}
      {...props}
    />
  );
}


export default function App() {
  const [selectedModel, setSelectedModel] = useState(null);
  const [mapData, setMapData] = useState(null);
  const [modelCenter, setModelCenter] = useState([0, 0, 0]);

  // Map model names to JSON data files
  const getJsonPathForModel = (modelName) => {
    const name = modelName.toLowerCase().replace(/[+_]/g, ' ').replace(/\s+/g, ' ');
    
    // Check for 894+285 pattern
    if (name.includes('894') && name.includes('285')) {
      return '/CH+894+285.json';
    }
    // Check for 967+030 pattern
    if (name.includes('967') && name.includes('030')) {
      return '/CH-967+030.json';
    }
    // MNB_624+800_glb1.glb - no data mapping (returns null to show no data on map)
    
    return null;
  };

  const handleModelSelect = (model) => {
    setSelectedModel(model);
    
    // Load corresponding JSON data for the map
    const jsonPath = getJsonPathForModel(model.name);
    
    if (jsonPath) {
      fetch(jsonPath)
        .then(response => {
          if (!response.ok) throw new Error('Failed to load JSON');
          return response.json();
        })
        .then(data => {
          setMapData(data);
          console.log('Map data loaded:', data);
        })
        .catch(error => {
          console.error('Error loading map data:', error);
          setMapData(null);
        });
    } else {
      setMapData(null);
    }
  };

  return (
    <div className="min-h-screen w-[99vw] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 sm:px-6 md:px-8 lg:px-12 py-8 flex flex-col items-center justify-start" style={{ overflowX: 'hidden' }}>
      {/* Header Section */}
      <div className="w-full max-w-7xl text-center">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2" style={{ textShadow: '0 0 10px rgba(0, 0, 0, 0.5)',color: 'black' }}>
          3D Model Viewer
        </h1>
        <p className="text-gray-600 text-lg">Interactive 3D visualization with location mapping</p>
      </div>

      {/* Model Selector Dropdown */}
      <div className="mb-6 w-full max-w-7xl flex justify-center">
        <ModelSelector 
          onModelSelect={handleModelSelect} 
          selectedModel={selectedModel}
        />
      </div>

      {/* 3D Model Container */}
      <div
        className="mx-auto rounded-3xl overflow-hidden shadow-2xl relative border-2 border-white/20 backdrop-blur-sm bg-white/10"
        style={{
          width: "100%",
          maxWidth: "1400px",
          height: "55vh",
          minHeight: "500px",
          minWidth: "800px",
          borderRadius: "20px",
        }}
      >
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: [40, 18, 40], fov: 45, near: 0.1, far: 2000 }}
          gl={{
            antialias: true,
            outputColorSpace: THREE.SRGBColorSpace,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.0,
          }}
        >
          <KTX2Config />
          <color attach="background" args={["#1e293b"]} />

          {/* Enhanced Realistic Lighting for Bridge */}
          <hemisphereLight
            intensity={0.4}
            color="#87ceeb"
            groundColor="#2a2a2a"
          />
          <directionalLight
            position={[30, 40, 20]}
            castShadow
            intensity={3.0}
            shadow-mapSize-width={4096}
            shadow-mapSize-height={4096}
            shadow-bias={-0.0001}
            shadow-camera-far={100}
            shadow-camera-left={-20}
            shadow-camera-right={20}
            shadow-camera-top={20}
            shadow-camera-bottom={-20}
          />
          <spotLight
            position={[-25, 25, -15]}
            angle={0.4}
            penumbra={0.8}
            intensity={2.0}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          
          {/* Additional fill lights for realistic bridge illumination */}
          <pointLight
            position={[0, 10, 0]}
            intensity={1.5}
            distance={50}
            decay={2}
            color="#ffffff"
          />
          <pointLight
            position={[20, 5, 20]}
            intensity={1.0}
            distance={40}
            decay={2}
            color="#ffd700"
          />

          {/* Model + Shadows */}
          <Suspense fallback={null}>
            {selectedModel && (
              <BridgeModel
                position={[0, 0, 0]}
                modelPath={selectedModel.path}
                onCenterChanged={setModelCenter}
              />
            )}
            <ContactShadows
              position={[0, -0.01, 0]}
              opacity={0.4}
              scale={400}
              blur={2.6}
              far={40}
            />
            <Environment preset="sunset" />
          </Suspense>

          {/* ✅ TrackballControls - Free 360° Rotation in All Directions (X, Y, Z) */}
          <FreeTrackballControls target={modelCenter} />
        </Canvas>

        {/* Loader */}
        <Loader />
      </div>

      {/* Map Component - Below 3D Model Container */}
      <div className="w-[91vw] " style={{marginTop: '10px', overflowX: 'hidden' , borderRadius: '20px' , maxWidth:"full"}}>
        <MapComponent data={mapData} />
      </div>
    </div>
  );
}
