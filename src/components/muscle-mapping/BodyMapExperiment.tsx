import React, { useState, Suspense, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useProgress, Html } from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';

const MODEL_URL = 'https://dicwdviufetibnafzipa.supabase.co/storage/v1/object/public/models/Ecorche_by_AlexLashko_ShrunkenView.obj';

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="text-[#00ffba] text-xs">
        {progress.toFixed(0)}%
      </div>
    </Html>
  );
}

interface ExperimentSettings {
  backgroundColor: string;
  objectColor: string;
  stretchColor: string;
  strengthenColor: string;
  wireframeOpacity: number;
}

interface ExperimentModelProps {
  settings: ExperimentSettings;
  stretchMuscles: string[];
  strengthenMuscles: string[];
}

function ExperimentModel({ settings, stretchMuscles, strengthenMuscles }: ExperimentModelProps) {
  const obj = useLoader(OBJLoader, MODEL_URL);

  const norm = (s: string) => (s || '').trim().toLowerCase();
  const getBaseName = (name: string) => {
    if (name.startsWith('Trapezius_')) return 'Trapezius';
    return name.replace(/_Left$|_Right$|_left$|_right$/i, '');
  };

  const strengthenSet = useMemo(() => new Set(strengthenMuscles.map(m => norm(m))), [strengthenMuscles]);
  const stretchSet = useMemo(() => new Set(stretchMuscles.map(m => norm(m))), [stretchMuscles]);

  const clonedObj = useMemo(() => {
    const clone = obj.clone(true);
    
    clone.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    clone.position.sub(center);
    clone.updateWorldMatrix(true, true);

    clone.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;

      const meshNameRaw = (child.name || '').trim();
      const meshBase = norm(getBaseName(meshNameRaw));

      const isStrengthen = strengthenSet.has(meshBase) || strengthenSet.has(norm(meshNameRaw));
      const isStretch = stretchSet.has(meshBase) || stretchSet.has(norm(meshNameRaw));

      if (isStrengthen) {
        child.material = new THREE.MeshStandardMaterial({
          color: settings.strengthenColor,
          roughness: 0.3,
          metalness: 0.2,
          emissive: settings.strengthenColor,
          emissiveIntensity: 0.4,
        });
        child.visible = true;
        return;
      }

      if (isStretch) {
        child.material = new THREE.MeshStandardMaterial({
          color: settings.stretchColor,
          roughness: 0.3,
          metalness: 0.2,
          emissive: settings.stretchColor,
          emissiveIntensity: 0.4,
        });
        child.visible = true;
        return;
      }

      // Default wireframe
      child.material = new THREE.MeshStandardMaterial({
        color: settings.objectColor,
        wireframe: true,
        transparent: true,
        opacity: settings.wireframeOpacity,
      });
      child.visible = true;
    });

    return clone;
  }, [obj, settings, strengthenSet, stretchSet]);

  return <primitive object={clonedObj} />;
}

export const BodyMapExperiment: React.FC = () => {
  const [settings, setSettings] = useState<ExperimentSettings>({
    backgroundColor: '#1a1a1a',
    objectColor: '#000000',
    stretchColor: '#ffbb38',
    strengthenColor: '#f80000',
    wireframeOpacity: 0.25,
  });

  const [stretchInput, setStretchInput] = useState('Biceps_Left, Hamstrings_Right');
  const [strengthenInput, setStrengthenInput] = useState('Gluteus_Maximus_Left, Trapezius');

  const stretchMuscles = stretchInput.split(',').map(s => s.trim()).filter(Boolean);
  const strengthenMuscles = strengthenInput.split(',').map(s => s.trim()).filter(Boolean);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Controls Panel */}
      <Card className="rounded-none">
        <CardHeader className="p-3 sm:p-4">
          <CardTitle className="text-sm sm:text-base">Ρυθμίσεις Πειραματισμού</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0 space-y-4">
          {/* Background Color */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Χρώμα Φόντου</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={settings.backgroundColor}
                onChange={(e) => setSettings(s => ({ ...s, backgroundColor: e.target.value }))}
                className="w-12 h-9 p-1 rounded-none"
              />
              <Input
                type="text"
                value={settings.backgroundColor}
                onChange={(e) => setSettings(s => ({ ...s, backgroundColor: e.target.value }))}
                className="flex-1 rounded-none text-xs"
              />
            </div>
          </div>

          {/* Object Color */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Χρώμα Wireframe</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={settings.objectColor}
                onChange={(e) => setSettings(s => ({ ...s, objectColor: e.target.value }))}
                className="w-12 h-9 p-1 rounded-none"
              />
              <Input
                type="text"
                value={settings.objectColor}
                onChange={(e) => setSettings(s => ({ ...s, objectColor: e.target.value }))}
                className="flex-1 rounded-none text-xs"
              />
            </div>
          </div>

          {/* Wireframe Opacity */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Διαφάνεια Wireframe: {settings.wireframeOpacity}</Label>
            <Input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.wireframeOpacity}
              onChange={(e) => setSettings(s => ({ ...s, wireframeOpacity: parseFloat(e.target.value) }))}
              className="rounded-none"
            />
          </div>

          {/* Stretch Color */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Χρώμα Διάτασης</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={settings.stretchColor}
                onChange={(e) => setSettings(s => ({ ...s, stretchColor: e.target.value }))}
                className="w-12 h-9 p-1 rounded-none"
              />
              <Input
                type="text"
                value={settings.stretchColor}
                onChange={(e) => setSettings(s => ({ ...s, stretchColor: e.target.value }))}
                className="flex-1 rounded-none text-xs"
              />
            </div>
          </div>

          {/* Strengthen Color */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Χρώμα Ενδυνάμωσης</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={settings.strengthenColor}
                onChange={(e) => setSettings(s => ({ ...s, strengthenColor: e.target.value }))}
                className="w-12 h-9 p-1 rounded-none"
              />
              <Input
                type="text"
                value={settings.strengthenColor}
                onChange={(e) => setSettings(s => ({ ...s, strengthenColor: e.target.value }))}
                className="flex-1 rounded-none text-xs"
              />
            </div>
          </div>

          {/* Stretch Muscles */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Μύες για Διάταση (comma separated)</Label>
            <Input
              type="text"
              value={stretchInput}
              onChange={(e) => setStretchInput(e.target.value)}
              placeholder="π.χ. Biceps_Left, Hamstrings"
              className="rounded-none text-xs"
            />
          </div>

          {/* Strengthen Muscles */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Μύες για Ενδυνάμωση (comma separated)</Label>
            <Input
              type="text"
              value={strengthenInput}
              onChange={(e) => setStrengthenInput(e.target.value)}
              placeholder="π.χ. Gluteus_Maximus_Left, Trapezius"
              className="rounded-none text-xs"
            />
          </div>

          {/* Reset Button */}
          <Button
            variant="outline"
            onClick={() => {
              setSettings({
                backgroundColor: '#1a1a1a',
                objectColor: '#000000',
                stretchColor: '#ffbb38',
                strengthenColor: '#f80000',
                wireframeOpacity: 0.25,
              });
              setStretchInput('');
              setStrengthenInput('');
            }}
            className="w-full rounded-none"
          >
            Επαναφορά
          </Button>
        </CardContent>
      </Card>

      {/* 3D Canvas */}
      <Card className="rounded-none lg:col-span-2">
        <CardContent className="p-0 h-[500px] sm:h-[600px]">
          <Canvas
            style={{ background: settings.backgroundColor }}
            camera={{ position: [0, 0, 2.5], fov: 50 }}
            gl={{ localClippingEnabled: true }}
          >
            <ambientLight intensity={0.7} />
            <directionalLight position={[5, 5, 5]} intensity={0.8} />
            <directionalLight position={[-5, 5, -5]} intensity={0.5} />
            
            <Suspense fallback={<Loader />}>
              <ExperimentModel 
                settings={settings}
                stretchMuscles={stretchMuscles}
                strengthenMuscles={strengthenMuscles}
              />
            </Suspense>
            
            <OrbitControls 
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={1}
              maxDistance={10}
            />
          </Canvas>
        </CardContent>
      </Card>
    </div>
  );
};
