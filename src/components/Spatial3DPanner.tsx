import React, { useRef, useState, useEffect } from 'react';
import { Compass, Move, RotateCcw, Volume2, User } from 'lucide-react';
import { Spatial3DSettings, Language } from '../types';
import { translations } from '../utils/i18n';

interface Spatial3DPannerProps {
  settings: Spatial3DSettings;
  onChange: (updated: Partial<Spatial3DSettings>) => void;
  language: Language;
}

export const Spatial3DPanner: React.FC<Spatial3DPannerProps> = ({
  settings,
  onChange,
  language,
}) => {
  const t = translations[language];
  const radarRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Convert 3D coordinates (-10 to 10) to percentages for Radar display
  const mapXToPercent = (x: number) => ((x + 10) / 20) * 100;
  const mapZToPercent = (z: number) => ((z + 10) / 20) * 100;

  const mapPercentToX = (p: number) => Math.round(((p / 100) * 20 - 10) * 10) / 10;
  const mapPercentToZ = (p: number) => Math.round(((p / 100) * 20 - 10) * 10) / 10;

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    updatePositionFromPointer(e);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      updatePositionFromPointer(e);
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const updatePositionFromPointer = (e: React.PointerEvent) => {
    if (!radarRef.current) return;
    const rect = radarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const percentX = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
    const percentZ = Math.max(0, Math.min(100, (clickY / rect.height) * 100));

    const x = mapPercentToX(percentX);
    const z = mapPercentToZ(percentZ);

    onChange({ x, z });
  };

  return (
    <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-5 md:p-6 text-white shadow-2xl backdrop-blur-md relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </span>
            <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent">
              {t.spatialTitle}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {t.spatialSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Master 3D Spatial Audio ON/OFF Segmented Buttons */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-indigo-500/40">
            <button
              onClick={() => onChange({ enabled: false })}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                !settings.enabled
                  ? 'bg-slate-800 text-white shadow-md border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              3D OFF (Flat)
            </button>
            <button
              onClick={() => onChange({ enabled: true })}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                settings.enabled
                  ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-slate-950 shadow-md shadow-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              3D ON
            </button>
          </div>

          {/* Reset Position Button */}
          <button
            onClick={() => onChange({ x: 0, y: 0, z: -1, enabled: true })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-all w-fit"
            title="Flat Center Reset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.centerPosition}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-center">
        {/* Radar 2D Stage Canvas */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div
            ref={radarRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-slate-950 border-2 border-indigo-500/40 shadow-inner flex items-center justify-center cursor-crosshair overflow-hidden touch-none"
          >
            {/* Radar Grid Circles */}
            <div className="absolute inset-4 rounded-full border border-indigo-500/20 pointer-events-none"></div>
            <div className="absolute inset-12 rounded-full border border-indigo-500/15 pointer-events-none"></div>
            <div className="absolute inset-20 rounded-full border border-indigo-500/10 pointer-events-none"></div>

            {/* Radar Crosshairs */}
            <div className="absolute w-full h-px bg-indigo-500/20 pointer-events-none"></div>
            <div className="absolute h-full w-px bg-indigo-500/20 pointer-events-none"></div>

            {/* Direction Labels */}
            <span className="absolute top-2 text-[10px] font-mono text-indigo-400/80 uppercase">FRONT (0°)</span>
            <span className="absolute bottom-2 text-[10px] font-mono text-indigo-400/80 uppercase">BACK (180°)</span>
            <span className="absolute left-2 text-[10px] font-mono text-indigo-400/80 uppercase">LEFT (-90°)</span>
            <span className="absolute right-2 text-[10px] font-mono text-indigo-400/80 uppercase">RIGHT (+90°)</span>

            {/* Listener Head Icon at Center */}
            <div className="relative z-10 w-10 h-10 rounded-full bg-slate-800 border-2 border-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <User className="w-5 h-5 text-indigo-300" />
            </div>

            {/* Flat Sound Bypass Overlay Badge when 3D is disabled */}
            {!settings.enabled && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] z-30 flex flex-col items-center justify-center p-4 text-center">
                <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700 shadow-lg">
                  {t.spatialFlatBypass || '3D Effect OFF (Flat Sound)'}
                </span>
                <p className="text-[11px] text-slate-400 mt-2 max-w-[200px]">
                  હવે ઓરિજિનલ સ્ટીરિયો પ્લેબેક ફ્લેટ સાઉન્ડ મોડ ચાલુ છે.
                </p>
                <button
                  onClick={() => onChange({ enabled: true })}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold text-xs"
                >
                  3D સાઉન્ડ ચાલુ કરો
                </button>
              </div>
            )}

            {/* Draggable Audio Speaker Point */}
            <div
              className="absolute z-20 w-8 h-8 -ml-4 -mt-4 rounded-full bg-cyan-500 border-2 border-white flex items-center justify-center shadow-lg shadow-cyan-500/80 transition-transform hover:scale-125 active:scale-110"
              style={{
                left: `${mapXToPercent(settings.x)}%`,
                top: `${mapZToPercent(settings.z)}%`,
              }}
            >
              <Volume2 className="w-4 h-4 text-slate-950 animate-pulse" />
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-3 text-center">
            માઉસ વડે આ સ્પીકર ડોટને કાનની આસપાસ ડ્રેગ કરીને 3D સાઉન્ડની પોઝિશન બદલો!
          </p>
        </div>

        {/* 3D Coordinate Sliders */}
        <div className={`lg:col-span-5 space-y-4 transition-opacity ${!settings.enabled ? 'opacity-50' : 'opacity-100'}`}>
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold px-1">
            <span>{t.spatialTitle || 'Direct 3D Position Stage'}</span>
            <span className={settings.enabled ? 'text-emerald-400' : 'text-slate-500'}>
              {settings.enabled ? '● Active' : '○ Inactive (3D OFF)'}
            </span>
          </div>

          {/* X Axis Slider */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center mb-2 text-xs">
              <span className="text-cyan-300 font-semibold">{t.posX}</span>
              <span className="font-mono text-cyan-400 font-bold">{settings.x}</span>
            </div>
            <input
              type="range"
              min={-10}
              max={10}
              step={0.5}
              disabled={!settings.enabled}
              value={settings.x}
              onChange={(e) => onChange({ x: parseFloat(e.target.value) })}
              className="w-full h-2 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400 disabled:cursor-not-allowed"
            />
          </div>

          {/* Y Axis Slider (Elevation) */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center mb-2 text-xs">
              <span className="text-indigo-300 font-semibold">{t.posY}</span>
              <span className="font-mono text-indigo-400 font-bold">{settings.y}</span>
            </div>
            <input
              type="range"
              min={-10}
              max={10}
              step={0.5}
              disabled={!settings.enabled}
              value={settings.y}
              onChange={(e) => onChange({ y: parseFloat(e.target.value) })}
              className="w-full h-2 bg-slate-800 rounded appearance-none cursor-pointer accent-indigo-400 disabled:cursor-not-allowed"
            />
          </div>

          {/* Z Axis Slider (Depth) */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center mb-2 text-xs">
              <span className="text-emerald-300 font-semibold">{t.posZ}</span>
              <span className="font-mono text-emerald-400 font-bold">{settings.z}</span>
            </div>
            <input
              type="range"
              min={-10}
              max={10}
              step={0.5}
              disabled={!settings.enabled}
              value={settings.z}
              onChange={(e) => onChange({ z: parseFloat(e.target.value) })}
              className="w-full h-2 bg-slate-800 rounded appearance-none cursor-pointer accent-emerald-400 disabled:cursor-not-allowed"
            />
          </div>

          {/* Panning Model Selector */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">{t.panningModel}</span>
            <select
              value={settings.panningModel}
              onChange={(e) => onChange({ panningModel: e.target.value as 'HRTF' | 'equalpower' })}
              className="bg-slate-800 border border-slate-700 text-xs text-cyan-300 rounded-lg px-3 py-1.5 focus:outline-none"
            >
              <option value="HRTF">{t.hrtfMode}</option>
              <option value="equalpower">Equalpower Stereo</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
