import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Maximize2, Minimize2, Eye, Activity, Clock, Zap } from 'lucide-react';
import { VisualizerMode, Language } from '../types';
import { translations } from '../utils/i18n';
import { audioEngine } from '../audio/AudioEngine';

interface Visualizer3DProps {
  mode: VisualizerMode;
  onModeChange: (mode: VisualizerMode) => void;
  language: Language;
}

const BANDS = 32; // Number of frequency bands (X-axis)
const SLICES = 60; // 30 seconds history at 2 samples/sec (Z-axis)

export const Visualizer3D: React.FC<Visualizer3DProps> = ({
  mode,
  onModeChange,
  language,
}) => {
  const t = translations[language];
  const containerRef = useRef<HTMLDivElement>(null);
  const canvas2dRef = useRef<HTMLCanvasElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Live analytics state for 3D Spectrogram mode
  const [analytics, setAnalytics] = useState({
    bassPercent: 0,
    midPercent: 0,
    treblePercent: 0,
    peakHz: 0,
  });

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const barsGroupRef = useRef<THREE.Group | null>(null);
  const sphereMeshRef = useRef<THREE.Mesh | null>(null);
  const particlesMeshRef = useRef<THREE.Points | null>(null);

  // 3D Spectrogram References
  const spectrogramMeshRef = useRef<THREE.Mesh | null>(null);
  const spectrogramGeoRef = useRef<THREE.PlaneGeometry | null>(null);
  const historyBufferRef = useRef<number[][]>(
    Array.from({ length: SLICES }, () => new Array(BANDS).fill(0))
  );
  const lastSampleTimeRef = useRef<number>(0);

  // Initialize Three.js Scene
  useEffect(() => {
    if (!containerRef.current || mode.startsWith('2d')) return;

    // Clean up previous renderer if any
    if (rendererRef.current) {
      if (rendererRef.current.domElement && rendererRef.current.domElement.parentNode) {
        rendererRef.current.domElement.parentNode.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current.dispose();
      rendererRef.current = null;
    }

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030712, mode === '3d-spectrogram' ? 0.015 : 0.03);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    if (mode === '3d-spectrogram') {
      camera.position.set(0, 16, 12);
      camera.lookAt(0, -2, -18);
    } else {
      camera.position.set(0, 15, 30);
      camera.lookAt(0, 0, 0);
    }
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    containerRef.current.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x06b6d4, 2.5, 100);
    pointLight.position.set(0, 20, 10);
    scene.add(pointLight);

    const dirLight = new THREE.DirectionalLight(0xa855f7, 1.2);
    dirLight.position.set(-10, 20, -10);
    scene.add(dirLight);

    // Create 3D Objects based on visualizer mode
    if (mode === '3d-bars') {
      const barsGroup = new THREE.Group();
      const numBars = 64;
      const radius = 12;

      for (let i = 0; i < numBars; i++) {
        const angle = (i / numBars) * Math.PI * 2;
        const geometry = new THREE.BoxGeometry(0.8, 1, 0.8);
        const color = new THREE.Color().setHSL(i / numBars, 0.9, 0.5);
        const material = new THREE.MeshStandardMaterial({
          color,
          roughness: 0.2,
          metalness: 0.8,
          emissive: color,
          emissiveIntensity: 0.2,
        });

        const bar = new THREE.Mesh(geometry, material);
        bar.position.x = Math.cos(angle) * radius;
        bar.position.z = Math.sin(angle) * radius;
        bar.rotation.y = -angle;

        barsGroup.add(bar);
      }
      scene.add(barsGroup);
      barsGroupRef.current = barsGroup;
    } else if (mode === '3d-orbit') {
      const geometry = new THREE.IcosahedronGeometry(8, 3);
      const material = new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        wireframe: true,
        roughness: 0.1,
        emissive: 0x3b82f6,
        emissiveIntensity: 0.5,
      });

      const sphere = new THREE.Mesh(geometry, material);
      scene.add(sphere);
      sphereMeshRef.current = sphere;

      // Particle Galaxy Field
      const particlesGeo = new THREE.BufferGeometry();
      const count = 1000;
      const positions = new Float32Array(count * 3);

      for (let i = 0; i < count * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 60;
      }
      particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const particleMat = new THREE.PointsMaterial({
        size: 0.5,
        color: 0x6366f1,
        transparent: true,
        opacity: 0.8,
      });

      const particles = new THREE.Points(particlesGeo, particleMat);
      scene.add(particles);
      particlesMeshRef.current = particles;
    } else if (mode === '3d-spectrogram') {
      // 3D History Spectral Graph Mesh (Plane: X=Frequency 0-20kHz, Z=Time 0s to -30s)
      const planeGeo = new THREE.PlaneGeometry(28, 36, BANDS - 1, SLICES - 1);
      planeGeo.rotateX(-Math.PI / 2);
      // Translate so Z goes from 0 (front, NOW) to -36 (back, -30s ago)
      planeGeo.translate(0, 0, -18);

      // Create initial color buffer for heat-map spectrum
      const numVertices = planeGeo.attributes.position.count;
      const colors = new Float32Array(numVertices * 3);
      for (let i = 0; i < numVertices; i++) {
        colors[i * 3] = 0.02; // R
        colors[i * 3 + 1] = 0.7; // G
        colors[i * 3 + 2] = 0.8; // B
      }
      planeGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const planeMat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        wireframe: false,
        roughness: 0.2,
        metalness: 0.6,
        side: THREE.DoubleSide,
      });

      const spectrogramMesh = new THREE.Mesh(planeGeo, planeMat);
      scene.add(spectrogramMesh);
      spectrogramMeshRef.current = spectrogramMesh;
      spectrogramGeoRef.current = planeGeo;

      // Wireframe Grid Overlay for tech aesthetic
      const wireMat = new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        wireframe: true,
        transparent: true,
        opacity: 0.2,
      });
      const wireMesh = new THREE.Mesh(planeGeo, wireMat);
      scene.add(wireMesh);

      // Add 3D Grid Guide lines for Timeline (-30s, -20s, -10s, 0s)
      const gridHelper = new THREE.GridHelper(36, 12, 0x06b6d4, 0x1e293b);
      gridHelper.position.set(0, -0.2, -18);
      scene.add(gridHelper);
    }

    // Window Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.dispose();
      }
    };
  }, [mode]);

  // Animation Loop for 3D & 2D Visualizer
  useEffect(() => {
    let animId: number;

    const renderLoop = () => {
      const freqData = audioEngine.getFrequencyData();
      const waveData = audioEngine.getWaveformData();

      // 1. Render 3D Scene
      if (mode.startsWith('3d') && rendererRef.current && sceneRef.current && cameraRef.current) {
        if (mode === '3d-bars' && barsGroupRef.current) {
          barsGroupRef.current.rotation.y += 0.005;

          const children = barsGroupRef.current.children as THREE.Mesh[];
          children.forEach((bar, i) => {
            const val = freqData[i % freqData.length] || 0;
            const scaleY = Math.max(0.2, (val / 255) * 15);
            bar.scale.y = scaleY;
            bar.position.y = scaleY / 2;
          });
        } else if (mode === '3d-orbit' && sphereMeshRef.current) {
          sphereMeshRef.current.rotation.x += 0.005;
          sphereMeshRef.current.rotation.y += 0.008;

          // Bass energy for sphere pulse
          let sumBass = 0;
          for (let i = 0; i < 16; i++) {
            sumBass += freqData[i] || 0;
          }
          const bassAvg = sumBass / 16;
          const scale = 1 + (bassAvg / 255) * 0.8;
          sphereMeshRef.current.scale.set(scale, scale, scale);

          if (particlesMeshRef.current) {
            particlesMeshRef.current.rotation.y -= 0.002;
          }
        } else if (mode === '3d-spectrogram' && spectrogramGeoRef.current) {
          const now = performance.now();

          // Sample audio frequencies into history buffer every 500ms (2Hz = 60 slices in 30s)
          if (now - lastSampleTimeRef.current >= 500) {
            lastSampleTimeRef.current = now;

            // Compute 32 frequency averages
            const newRow = new Array(BANDS).fill(0);
            const chunkSize = Math.floor(freqData.length / BANDS) || 1;

            let maxVal = 0;
            let maxIndex = 0;
            let sumBass = 0;
            let sumMid = 0;
            let sumTreble = 0;

            for (let b = 0; b < BANDS; b++) {
              let sum = 0;
              for (let k = 0; k < chunkSize; k++) {
                const idx = b * chunkSize + k;
                const v = freqData[idx] || 0;
                sum += v;
                if (v > maxVal) {
                  maxVal = v;
                  maxIndex = idx;
                }
              }
              const avg = sum / chunkSize;
              newRow[b] = avg / 255.0; // 0.0 to 1.0

              if (b < 6) sumBass += avg;
              else if (b < 20) sumMid += avg;
              else sumTreble += avg;
            }

            // Push latest sample to top of history (Slice 0 = NOW)
            historyBufferRef.current.unshift(newRow);
            if (historyBufferRef.current.length > SLICES) {
              historyBufferRef.current.pop();
            }

            // Calculate live frequency metrics
            const bassP = Math.round((sumBass / (6 * 255)) * 100);
            const midP = Math.round((sumMid / (14 * 255)) * 100);
            const trebP = Math.round((sumTreble / (12 * 255)) * 100);
            const estHz = Math.round((maxIndex / (freqData.length || 128)) * 20000);

            setAnalytics({
              bassPercent: bassP,
              midPercent: midP,
              treblePercent: trebP,
              peakHz: estHz,
            });
          }

          // Update 3D Spectrogram Geometry Vertex Positions (Y height) & Colors (Heat map)
          const geo = spectrogramGeoRef.current;
          const posAttr = geo.attributes.position as THREE.BufferAttribute;
          const colorAttr = geo.attributes.color as THREE.BufferAttribute;

          const history = historyBufferRef.current;

          for (let slice = 0; slice < SLICES; slice++) {
            const row = history[slice] || new Array(BANDS).fill(0);
            for (let band = 0; band < BANDS; band++) {
              const val = row[band] || 0;
              const vertIdx = slice * BANDS + band;

              // Height modulation (Y axis)
              const yVal = val * 8.5;
              posAttr.setY(vertIdx, yVal);

              // Heat map color calculation
              // Low = Blue/Cyan, Mid = Emerald/Gold, High = Magenta/White
              let r = 0, g = 0, b = 0;
              if (val < 0.2) {
                r = 0.02 + val * 2;
                g = 0.4 + val * 2;
                b = 0.8;
              } else if (val < 0.6) {
                r = 0.1 + (val - 0.2) * 2;
                g = 0.9;
                b = 0.2;
              } else if (val < 0.85) {
                r = 0.95;
                g = 0.7 - (val - 0.6) * 2;
                b = 0.1;
              } else {
                r = 0.98;
                g = 0.2 + (val - 0.85) * 4;
                b = 0.8;
              }

              colorAttr.setXYZ(vertIdx, r, g, b);
            }
          }

          posAttr.needsUpdate = true;
          colorAttr.needsUpdate = true;
        }

        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      // 2. Render 2D Canvas Fallback
      if (mode.startsWith('2d') && canvas2dRef.current) {
        const ctx = canvas2dRef.current.getContext('2d');
        if (ctx) {
          const width = canvas2dRef.current.width;
          const height = canvas2dRef.current.height;

          ctx.clearRect(0, 0, width, height);

          if (mode === '2d-spectrum') {
            const barWidth = (width / freqData.length) * 2;
            let x = 0;

            for (let i = 0; i < freqData.length; i++) {
              const barHeight = (freqData[i] / 255) * height;

              const gradient = ctx.createLinearGradient(0, height, 0, 0);
              gradient.addColorStop(0, '#06b6d4');
              gradient.addColorStop(0.5, '#3b82f6');
              gradient.addColorStop(1, '#a855f7');

              ctx.fillStyle = gradient;
              ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);

              x += barWidth;
            }
          } else if (mode === '2d-waveform') {
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = '#06b6d4';
            ctx.beginPath();

            const sliceWidth = (width * 1.0) / waveData.length;
            let x = 0;

            for (let i = 0; i < waveData.length; i++) {
              const v = waveData[i] / 128.0;
              const y = (v * height) / 2;

              if (i === 0) {
                ctx.moveTo(x, y);
              } else {
                ctx.lineTo(x, y);
              }

              x += sliceWidth;
            }

            ctx.lineTo(width, height / 2);
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [mode]);

  return (
    <div
      className={`bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white relative flex flex-col justify-between overflow-hidden shadow-2xl transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none p-6' : 'h-80'
      }`}
    >
      {/* Top Overlay Controls */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-auto">
        {/* Visualizer Mode Selector */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/80 shadow-lg overflow-x-auto max-w-[85%]">
          <Eye className="w-4 h-4 text-cyan-400 ml-1 shrink-0" />
          <button
            onClick={() => onModeChange('3d-bars')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              mode === '3d-bars' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:text-white'
            }`}
          >
            {t.vis3dBars}
          </button>
          <button
            onClick={() => onModeChange('3d-orbit')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              mode === '3d-orbit' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:text-white'
            }`}
          >
            {t.vis3dOrbit}
          </button>
          <button
            onClick={() => onModeChange('3d-spectrogram')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
              mode === '3d-spectrogram' ? 'bg-gradient-to-r from-amber-400 to-pink-500 text-slate-950 font-bold shadow-md' : 'text-amber-300 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{t.vis3dSpectrogram}</span>
          </button>
          <button
            onClick={() => onModeChange('2d-spectrum')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              mode === '2d-spectrum' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:text-white'
            }`}
          >
            {t.vis2dSpectrum}
          </button>
          <button
            onClick={() => onModeChange('2d-waveform')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              mode === '2d-waveform' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:text-white'
            }`}
          >
            {t.vis2dWaveform}
          </button>
        </div>

        {/* Fullscreen Button */}
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-cyan-400 hover:bg-slate-800 shadow-lg transition-all shrink-0"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Render Area */}
      {mode.startsWith('3d') ? (
        <div ref={containerRef} className="w-full h-full flex-grow rounded-xl overflow-hidden" />
      ) : (
        <canvas
          ref={canvas2dRef}
          width={800}
          height={300}
          className="w-full h-full object-cover rounded-xl mt-8"
        />
      )}

      {/* 3D Spectrogram Analytics Overlay Banner */}
      {mode === '3d-spectrogram' && (
        <div className="absolute bottom-3 left-3 right-3 z-10 bg-slate-950/85 backdrop-blur-md p-2.5 rounded-xl border border-amber-500/30 flex flex-wrap items-center justify-between gap-2 text-xs shadow-xl pointer-events-auto">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-bold text-amber-400">
              <Clock className="w-3.5 h-3.5" />
              30s Waterfall History Log
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[11px] text-slate-400">
              <Zap className="w-3 h-3 text-cyan-400" />
              Peak: <strong className="text-cyan-300">{analytics.peakHz} Hz</strong>
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px]">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-slate-400">Bass:</span>
              <span className="font-bold text-indigo-300">{analytics.bassPercent}%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-slate-400">Mid:</span>
              <span className="font-bold text-emerald-300">{analytics.midPercent}%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-slate-400">Treble:</span>
              <span className="font-bold text-amber-300">{analytics.treblePercent}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
