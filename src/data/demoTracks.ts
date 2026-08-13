import { Track } from '../types';

export const DEMO_TRACKS: Track[] = [
  {
    id: 'song-1',
    title: 'Song 1 - 3D Audio',
    artist: 'My Music',
    album: '3D Sound Music Player',
    duration: 180,
    url: '/audio/song1.mp3',
    cover:
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
    genre: '3D Audio',
  },
  {
    id: 'song-2',
    title: 'Song 2 - 3D Audio',
    artist: 'My Music',
    album: '3D Sound Music Player',
    duration: 180,
    url: '/audio/song2.mp3',
    cover:
      'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&auto=format&fit=crop&q=80',
    genre: '3D Audio',
  },
];

export const EQ_PRESETS: {
  name: string;
  labelGu: string;
  labelEn: string;
  bands: number[];
}[] = [
  {
    name: 'flat',
    labelGu: 'ફ્લેટ (Default)',
    labelEn: 'Flat (Default)',
    bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  {
    name: 'bass-boost',
    labelGu: 'સુપર બેસ (Bass Boost)',
    labelEn: 'Bass Boost',
    bands: [7, 6, 5, 2, 0, -1, 0, 1, 3, 4],
  },
  {
    name: '3d-surround',
    labelGu: '3D સરાઉન્ડ સ્ટેજ',
    labelEn: '3D Surround Stage',
    bands: [4, 3, 2, 0, -1, 1, 3, 5, 6, 5],
  },
  {
    name: 'vocal-boost',
    labelGu: 'વોકલ બૂસ્ટ',
    labelEn: 'Vocal Boost',
    bands: [-2, -1, 0, 3, 5, 5, 4, 2, 0, -1],
  },
  {
    name: 'rock',
    labelGu: 'રોક મ્યુઝિક',
    labelEn: 'Rock',
    bands: [5, 4, 3, 1, -1, -1, 1, 3, 4, 5],
  },
  {
    name: 'pop',
    labelGu: 'પોપ',
    labelEn: 'Pop',
    bands: [2, 3, 4, 3, 1, -1, 1, 3, 4, 3],
  },
  {
    name: 'edm',
    labelGu: 'EDM / ડાન્સ',
    labelEn: 'EDM / Dance',
    bands: [6, 5, 3, 0, 1, 3, 4, 4, 3, 5],
  },
  {
    name: 'classical',
    labelGu: 'ક્લાસિકલ',
    labelEn: 'Classical',
    bands: [4, 3, 2, 2, -1, 0, 2, 3, 4, 3],
  },
];
