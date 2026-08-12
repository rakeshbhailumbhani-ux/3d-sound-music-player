import React, { useState, useRef } from 'react';
import {
  Download,
  DownloadCloud,
  FileAudio,
  CheckCircle2,
  Sparkles,
  Clock,
  Compass,
  SlidersHorizontal,
  Music,
  Loader2,
  AlertCircle,
  FolderOpen,
  Play,
  Trash2,
  Info,
  Smartphone,
  Laptop,
  Globe,
  HardDrive,
  FolderDown,
} from 'lucide-react';
import {
  Track,
  MicrosecondDelaySettings,
  Spatial3DSettings,
  EQSettings,
  Language,
} from '../types';
import { translations } from '../utils/i18n';
import { convertAndExport3DAudio } from '../audio/AudioConverter';

interface ConvertedVaultItem {
  id: string;
  title: string;
  fileName: string;
  url: string;
  format: 'mp3' | 'wav';
  timestamp: string;
  delaySpec: string;
}

interface AudioConverterPanelProps {
  tracks: Track[];
  currentTrack: Track | null;
  microDelaySettings: MicrosecondDelaySettings;
  spatialSettings: Spatial3DSettings;
  eqSettings: EQSettings;
  language: Language;
  onAddCustomTrack?: (file: File) => void;
  onSelectTrack?: (track: Track) => void;
  onAddConvertedTrack?: (track: Track) => void;
}

export const AudioConverterPanel: React.FC<AudioConverterPanelProps> = ({
  tracks,
  currentTrack,
  microDelaySettings,
  spatialSettings,
  eqSettings,
  language,
  onAddCustomTrack,
  onSelectTrack,
  onAddConvertedTrack,
}) => {
  const [selectedTrackId, setSelectedTrackId] = useState<string>(
    currentTrack?.id || (tracks[0]?.id || '')
  );
  const [exportFormat, setExportFormat] = useState<'mp3' | 'wav'>('mp3');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [downloadResult, setDownloadResult] = useState<{
    url: string;
    fileName: string;
    format: 'mp3' | 'wav';
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [vaultItems, setVaultItems] = useState<ConvertedVaultItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = translations[language];

  const selectedTrack = tracks.find((tr) => tr.id === selectedTrackId) || currentTrack || tracks[0];

  const handleOpenLocalFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onAddCustomTrack) {
      const file = e.target.files[0];
      if (file.type.startsWith('audio/')) {
        onAddCustomTrack(file);
      }
    }
  };

  const triggerDownload = (url: string, fileName: string) => {
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
      }, 1000);
    } catch (e) {
      console.error('Auto download failed:', e);
    }
  };

  const handleConvert = async () => {
    if (!selectedTrack) return;

    setIsProcessing(true);
    setProgressPercent(0);
    setStatusMessage(language === 'gu' ? '3D પ્રોસેસિંગ શરૂ થઈ રહ્યું છે...' : 'Starting 3D Audio Processing...');
    setErrorMessage(null);
    setDownloadResult(null);

    try {
      const result = await convertAndExport3DAudio(
        selectedTrack.url,
        microDelaySettings,
        spatialSettings,
        eqSettings,
        exportFormat,
        (percent, text) => {
          setProgressPercent(percent);
          setStatusMessage(text);
        }
      );

      const ext = exportFormat;
      const fileName = `${selectedTrack.title.replace(/[/\\?%*:|"<>]/g, '_')}_3D_${microDelaySettings.leftDelayUs}ms.${ext}`;
      const resData = {
        url: result.url,
        fileName,
        format: exportFormat,
      };

      setDownloadResult(resData);

      // Add to session Converted Vault
      const newItem: ConvertedVaultItem = {
        id: 'vault_' + Date.now(),
        title: selectedTrack.title,
        fileName,
        url: result.url,
        format: exportFormat,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        delaySpec: `L: ${microDelaySettings.leftDelayUs}ms | R: ${microDelaySettings.rightDelayUs}ms`,
      };
      setVaultItems((prev) => [newItem, ...prev]);

      // Automatically add to Main Playlist so it shows under Downloads / Playlist
      if (onAddConvertedTrack) {
        const convertedTrack: Track = {
          id: `converted-${Date.now()}`,
          title: `${selectedTrack.title} [3D ${exportFormat.toUpperCase()}]`,
          artist: `${selectedTrack.artist} (3D Sound)`,
          album: '3D Downloads',
          duration: selectedTrack.duration,
          url: result.url,
          cover: selectedTrack.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300',
          isCustom: true,
          genre: '3D Converted',
        };
        onAddConvertedTrack(convertedTrack);
      }

      // Automatically trigger browser file download prompt
      triggerDownload(result.url, fileName);

    } catch (err) {
      console.error('3D audio conversion failed:', err);
      setErrorMessage(
        language === 'gu'
          ? 'કન્વર્ઝન ફેલ થયું. કૃપા કરીને નવી ફાઇલ સાથે પ્રયાસ કરો.'
          : '3D Audio Conversion failed. Please try with another audio file.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlayVaultItem = (item: ConvertedVaultItem) => {
    if (onAddConvertedTrack) {
      const track: Track = {
        id: `vault-play-${Date.now()}`,
        title: item.fileName.replace(/\.[^/.]+$/, ''),
        artist: 'Converted 3D Vault',
        album: '3D Downloads',
        duration: 180,
        url: item.url,
        cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300',
        isCustom: true,
        genre: '3D Converted',
      };
      onAddConvertedTrack(track);
    } else if (onAddCustomTrack) {
      fetch(item.url)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], item.fileName, { type: item.format === 'mp3' ? 'audio/mp3' : 'audio/wav' });
          onAddCustomTrack(file);
        })
        .catch((err) => console.error('Failed to load vault audio into player:', err));
    }
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-cyan-500/30 p-6 shadow-2xl backdrop-blur-xl space-y-6">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleOpenLocalFile}
        accept="audio/*"
        className="hidden"
      />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <DownloadCloud className="w-5 h-5 text-cyan-400" />
            <span>{t.converterTitle}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">{t.converterSubtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Open Audio File Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
            title={t.openFileBtn}
          >
            <FolderOpen className="w-4 h-4 text-indigo-200" />
            <span>{t.openFileBtn}</span>
          </button>

          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/60 border border-cyan-800/60 rounded-full text-cyan-300 font-mono text-xs">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>MP3 192kbps & WAV</span>
          </div>
        </div>
      </div>

      {/* Current Settings Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-xs">
        {/* Delay Info */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-950/60 text-cyan-400 border border-cyan-800/50">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Channel Delay</span>
            <span className="font-mono text-cyan-300 font-bold">
              L: {microDelaySettings.leftDelayUs}ms | R: {microDelaySettings.rightDelayUs}ms
            </span>
          </div>
        </div>

        {/* Spatial Info */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-950/60 text-indigo-400 border border-indigo-800/50">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">3D Spatial Stage</span>
            <span className="font-mono text-indigo-300 font-bold">
              X: {spatialSettings.x.toFixed(1)} | Z: {spatialSettings.z.toFixed(1)}
            </span>
          </div>
        </div>

        {/* EQ Info */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-purple-950/60 text-purple-400 border border-purple-800/50">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">EQ Bass & Treble</span>
            <span className="font-mono text-purple-300 font-bold">
              Bass: +{eqSettings.bassBoost}dB | Treble: +{eqSettings.trebleBoost}dB
            </span>
          </div>
        </div>
      </div>

      {/* Song Selection Dropdown */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Music className="w-4 h-4 text-cyan-400" />
            <span>{language === 'gu' ? 'કન્વર્ટ કરવા માટે ગીત પસંદ કરો:' : 'Select Song to Convert:'}</span>
          </label>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 underline"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>{language === 'gu' ? 'નવી ફોન/PC ફાઇલ ઓપન કરો' : 'Open Local Phone/PC File'}</span>
          </button>
        </div>

        <select
          value={selectedTrackId}
          onChange={(e) => setSelectedTrackId(e.target.value)}
          disabled={isProcessing}
          className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-cyan-500 font-medium"
        >
          {tracks.map((tr) => (
            <option key={tr.id} value={tr.id}>
              {tr.title} - {tr.artist}
            </option>
          ))}
        </select>
      </div>

      {/* Export Format Selector (MP3 vs WAV) */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <FileAudio className="w-4 h-4 text-cyan-400" />
          <span>{language === 'gu' ? 'ઓડિયો ફાઇલ ફોર્મેટ પસંદ કરો (Format):' : 'Select Output Audio Format:'}</span>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setExportFormat('mp3')}
            disabled={isProcessing}
            className={`p-3.5 rounded-xl border flex flex-col items-start text-left transition-all ${
              exportFormat === 'mp3'
                ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-lg ring-1 ring-cyan-500/50'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-bold text-sm text-cyan-300">MP3 ફોર્મેટ</span>
              <span className="text-[10px] font-mono bg-cyan-950 border border-cyan-800 px-2 py-0.5 rounded text-cyan-400">192 kbps</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1">
              {language === 'gu' ? 'બધા જ મોબાઈલ પ્લેયર માટે અનુકૂળ, નાની ફાઈલ સાઈઝ.' : 'Universal mobile compatibility & compact file size.'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setExportFormat('wav')}
            disabled={isProcessing}
            className={`p-3.5 rounded-xl border flex flex-col items-start text-left transition-all ${
              exportFormat === 'wav'
                ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-lg ring-1 ring-cyan-500/50'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-bold text-sm text-indigo-300">WAV ફોર્મેટ</span>
              <span className="text-[10px] font-mono bg-indigo-950 border border-indigo-800 px-2 py-0.5 rounded text-indigo-400">Uncompressed</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1">
              {language === 'gu' ? 'ઉચ્ચ ઓડિયો કવોલિટી (High Quality Uncompressed Studio).' : 'Highest uncompressed studio sound quality.'}
            </span>
          </button>
        </div>
      </div>

      {/* Convert Action Button */}
      {!isProcessing && !downloadResult && (
        <button
          onClick={handleConvert}
          disabled={!selectedTrack}
          className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
        >
          <Sparkles className="w-5 h-5 fill-slate-950" />
          <span>
            {language === 'gu'
              ? `3D ${exportFormat.toUpperCase()} ફાઇલ કન્વર્ટ કરી ડાઉનલોડ કરો`
              : `Convert & Export 3D ${exportFormat.toUpperCase()} File`}
          </span>
        </button>
      )}

      {/* Processing State */}
      {isProcessing && (
        <div className="space-y-3 bg-slate-950/90 p-4 rounded-xl border border-cyan-500/40">
          <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              {statusMessage || t.converting}
            </span>
            <span className="font-mono">{progressPercent}%</span>
          </div>

          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Completed Download Link */}
      {downloadResult && !isProcessing && (
        <div className="space-y-4 bg-emerald-950/40 border border-emerald-500/50 p-5 rounded-2xl animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-slate-100 text-sm">
                3D {downloadResult.format.toUpperCase()} {t.downloadReady}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">{t.convertSuccessNotice}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <a
              href={downloadResult.url}
              download={downloadResult.fileName}
              className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>
                {language === 'gu'
                  ? `ડાઉનલોડ કરો 3D ${downloadResult.format.toUpperCase()} ફાઇલ`
                  : `Download 3D ${downloadResult.format.toUpperCase()} File`}
              </span>
            </a>

            <button
              onClick={() => {
                setDownloadResult(null);
                setProgressPercent(0);
              }}
              className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              {language === 'gu' ? 'નવું કન્વર્ટ કરો' : 'Convert Another'}
            </button>
          </div>
        </div>
      )}

      {/* Explicit Output File Location / Destination Guide Box */}
      <div className="bg-slate-950/90 border border-amber-500/30 rounded-2xl p-4 md:p-5 space-y-3 shadow-lg">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
          <FolderDown className="w-5 h-5 text-amber-400" />
          <h4 className="font-bold text-amber-300 text-sm">{t.outputLocationTitle}</h4>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          {t.outputLocationSub}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
          {/* Android Location */}
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>{t.androidPathLabel}</span>
            </div>
            <p className="text-[11px] text-slate-300 font-mono bg-slate-950 p-1.5 rounded border border-slate-800/60">
              {t.androidPathValue}
            </p>
          </div>

          {/* PC / Laptop Location */}
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <Laptop className="w-4 h-4 text-cyan-400" />
              <span>{t.pcPathLabel}</span>
            </div>
            <p className="text-[11px] text-slate-300 font-mono bg-slate-950 p-1.5 rounded border border-slate-800/60">
              {t.pcPathValue}
            </p>
          </div>

          {/* Browser Location */}
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <Globe className="w-4 h-4 text-purple-400" />
              <span>{t.browserPathLabel}</span>
            </div>
            <p className="text-[11px] text-slate-300 font-mono bg-slate-950 p-1.5 rounded border border-slate-800/60">
              {t.browserPathValue}
            </p>
          </div>
        </div>
      </div>

      {/* Converted Audio Files Vault (Session History List) */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 md:p-5 space-y-4 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-cyan-400" />
            <h4 className="font-bold text-slate-200 text-sm">{t.vaultTitle}</h4>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-950 border border-cyan-800 text-cyan-300 rounded-full">
              {vaultItems.length}
            </span>
          </div>

          {vaultItems.length > 0 && (
            <button
              onClick={() => setVaultItems([])}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.clearVault}</span>
            </button>
          )}
        </div>

        {vaultItems.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-4">{t.vaultEmpty}</p>
        ) : (
          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {vaultItems.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-bold text-cyan-300">
                    <FileAudio className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="truncate max-w-xs">{item.fileName}</span>
                    <span className="text-[9px] font-mono uppercase bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                      {item.format}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
                    <span>🕒 {item.timestamp}</span>
                    <span>⚡ {item.delaySpec}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Play in App Button */}
                  {onAddCustomTrack && (
                    <button
                      onClick={() => handlePlayVaultItem(item)}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1 transition-all"
                      title={t.playInApp}
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{t.playInApp}</span>
                    </button>
                  )}

                  {/* Download Again */}
                  <a
                    href={item.url}
                    download={item.fileName}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-[11px] flex items-center gap-1 transition-all"
                    title={t.downloadAgain}
                  >
                    <Download className="w-3 h-3" />
                    <span>{t.downloadAgain}</span>
                  </a>

                  {/* Remove Item */}
                  <button
                    onClick={() => setVaultItems((prev) => prev.filter((i) => i.id !== item.id))}
                    className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

