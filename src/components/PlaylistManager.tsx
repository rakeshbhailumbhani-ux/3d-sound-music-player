import React, { useState, useRef } from 'react';
import { Play, Pause, Upload, Search, Music, Clock, Trash2, Sparkles, CheckCircle, Download } from 'lucide-react';
import { Track, Language } from '../types';
import { translations } from '../utils/i18n';

interface PlaylistManagerProps {
  tracks: Track[];
  currentTrackId: string | null;
  isPlaying: boolean;
  onSelectTrack: (track: Track) => void;
  onAddCustomTrack: (file: File) => void;
  onRemoveTrack: (trackId: string) => void;
  language: Language;
}

export const PlaylistManager: React.FC<PlaylistManagerProps> = ({
  tracks,
  currentTrackId,
  isPlaying,
  onSelectTrack,
  onAddCustomTrack,
  onRemoveTrack,
  language,
}) => {
  const t = translations[language];
  const [searchQuery, setSearchQuery] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const filteredTracks = tracks.filter(
    (tr) =>
      tr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tr.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tr.album.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      (Array.from(e.target.files) as File[]).forEach((file: File) => {
        if (file.type.startsWith('audio/')) {
          onAddCustomTrack(file);
        }
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      (Array.from(e.dataTransfer.files) as File[]).forEach((file: File) => {
        if (file.type.startsWith('audio/')) {
          onAddCustomTrack(file);
        }
      });
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 text-white shadow-2xl backdrop-blur-md">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Music className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-300 to-indigo-300 bg-clip-text text-transparent">
              {t.playlistTitle}
            </h2>
            <p className="text-xs text-slate-400">Total {tracks.length} tracks available</p>
          </div>
        </div>

        {/* Search & Upload */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t.searchSong}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-cyan-500/50 w-48 sm:w-64"
            />
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="audio/*"
            multiple
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/20"
          >
            <Upload className="w-4 h-4" />
            <span>{t.addSong}</span>
          </button>
        </div>
      </div>

      {/* Drag & Drop Audio Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`mt-4 p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer flex items-center justify-center gap-3 text-xs ${
          isDraggingOver
            ? 'border-cyan-400 bg-cyan-500/10 text-cyan-300'
            : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
        }`}
      >
        <Sparkles className="w-4 h-4 text-cyan-400" />
        <span>{t.dragDropAudio} (MP3, WAV, AAC, FLAC, OGG)</span>
      </div>

      {/* Tracks List */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono border-b border-slate-800">
            <tr>
              <th className="p-3 w-12 text-center">#</th>
              <th className="p-3">Track Title</th>
              <th className="p-3 hidden sm:table-cell">{t.artist}</th>
              <th className="p-3 hidden md:table-cell">Genre</th>
              <th className="p-3 text-right">
                <Clock className="w-3.5 h-3.5 inline text-slate-400" />
              </th>
              <th className="p-3 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredTracks.map((tr, idx) => {
              const isSelected = tr.id === currentTrackId;

              return (
                <tr
                  key={tr.id}
                  onClick={() => onSelectTrack(tr)}
                  className={`group hover:bg-slate-800/60 cursor-pointer transition-all ${
                    isSelected ? 'bg-cyan-950/40 border-l-4 border-cyan-400' : ''
                  }`}
                >
                  <td className="p-3 text-center font-mono">
                    {isSelected && isPlaying ? (
                      <span className="flex items-center justify-center">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                      </span>
                    ) : (
                      idx + 1
                    )}
                  </td>
                  <td className="p-3 font-medium">
                    <div className="flex items-center gap-3">
                      <img
                        src={tr.cover}
                        alt={tr.title}
                        className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                      />
                      <div>
                        <div
                          className={`font-semibold line-clamp-1 ${
                            isSelected ? 'text-cyan-300' : 'text-white'
                          }`}
                        >
                          {tr.title}
                        </div>
                        <div className="text-[11px] text-slate-400 sm:hidden">{tr.artist}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 hidden sm:table-cell text-slate-400">{tr.artist}</td>
                  <td className="p-3 hidden md:table-cell">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-cyan-300 border border-slate-700">
                      {tr.genre || '3D Audio'}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono text-slate-400">
                    {formatDuration(tr.duration)}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a
                        href={tr.url}
                        download={`${tr.title.replace(/[/\\?%*:|"<>]/g, '_')}.mp3`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 text-slate-400 hover:text-cyan-300 transition-all"
                        title="Download Audio File"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      {tr.isCustom && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveTrack(tr.id);
                          }}
                          className="p-1 text-slate-500 hover:text-red-400 transition-all"
                          title="Delete Track"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredTracks.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-xs">{t.noSongs}</div>
        )}
      </div>
    </div>
  );
};
