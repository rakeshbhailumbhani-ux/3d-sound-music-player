import { Track } from '../types';

export const DEMO_TRACKS: Track[] = [
  {
    id: 'demo-1',
    title: '3D Spatial Binaural Experience',
    artist: 'Acoustic Sound Lab',
    album: '3D Audio Demonstrations',
    duration: 180,
    url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
    cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
    genre: 'Binaural 3D',
  },
  {
    id: 'demo-2',
    title: '8D Cyberpunk Synthwave',
    artist: 'Neon Wave Master',
    album: 'Spatial Future',
    duration: 210,
    url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=cyberpunk-2099-10701.mp3',
    cover: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&auto=format&fit=crop&q=80',
    genre: 'Synthwave / 8D',
  },
  {
    id: 'demo-3',
    title: 'Deep Bass Subwoofer Test',
    artist: 'Bass Dimension',
    album: 'Low Frequency Audio',
    duration: 154,
    url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=electronic-future-beats-117997.mp3',
    cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80',
    genre: 'EDM / Bass',
  },
  {
    id: 'demo-4',
    title: 'Ambient Nature Acoustic 3D',
    artist: 'Serene Harmonics',
    album: 'Natural Binaural',
    duration: 240,
    url: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f37920.mp3?filename=ambient-piano-124424.mp3',
    cover: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&auto=format&fit=crop&q=80',
    genre: 'Relaxation / Acoustic',
  },
  {
    id: 'demo-5',
    title: 'Microsecond Haas Effect Test Tone',
    artist: 'Audio Engineering Tools',
    album: 'DSP Test Bench',
    duration: 120,
    url: 'https://cdn.pixabay.com/download/audio/2022/08/02/audio_884fe92db1.mp3?filename=chill-abstract-intention-12099.mp3',
    cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
    genre: '3D Test Tone',
  }
];

export const EQ_PRESETS: { name: string; labelGu: string; labelEn: string; bands: number[] }[] = [
  { name: 'flat', labelGu: 'ફ્લેટ (Default)', labelEn: 'Flat (Default)', bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { name: 'bass-boost', labelGu: 'સુપર બેસ (Bass Boost)', labelEn: 'Bass Boost', bands: [7, 6, 5, 2, 0, -1, 0, 1, 3, 4] },
  { name: '3d-surround', labelGu: '3D સરાઉન્ડ સ્ટેજ', labelEn: '3D Surround Stage', bands: [4, 3, 2, 0, -1, 1, 3, 5, 6, 5] },
  { name: 'vocal-boost', labelGu: 'વોકલ બૂસ્ટ', labelEn: 'Vocal Boost', bands: [-2, -1, 0, 3, 5, 5, 4, 2, 0, -1] },
  { name: 'rock', labelGu: 'રોક મ્યુઝિક', labelEn: 'Rock', bands: [5, 4, 3, 1, -1, -1, 1, 3, 4, 5] },
  { name: 'pop', labelGu: 'પોપ', labelEn: 'Pop', bands: [2, 3, 4, 3, 1, -1, 1, 3, 4, 3] },
  { name: 'edm', labelGu: 'EDM / ડાન્સ', labelEn: 'EDM / Dance', bands: [6, 5, 3, 0, 1, 3, 4, 4, 3, 5] },
  { name: 'classical', labelGu: 'ક્લાસિકલ', labelEn: 'Classical', bands: [4, 3, 2, 2, -1, 0, 2, 3, 4, 3] },
];
