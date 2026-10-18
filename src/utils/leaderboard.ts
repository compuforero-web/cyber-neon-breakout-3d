import { LeaderboardEntry, LevelConfig } from '../types/game';

const STORAGE_KEY = 'cyber_neon_breakout_top10_v1';

const DEFAULT_TOP_10: LeaderboardEntry[] = [
  { id: 'seed-1', playerName: 'VALKYRIE_X', score: 48200, maxLevel: 10, totalStars: 29, assistsUsed: 0, date: '2026-10-15' },
  { id: 'seed-2', playerName: 'KAITO_99', score: 41500, maxLevel: 10, totalStars: 26, assistsUsed: 1, date: '2026-10-14' },
  { id: 'seed-3', playerName: 'NOVA_CORE', score: 36800, maxLevel: 9, totalStars: 23, assistsUsed: 0, date: '2026-10-14' },
  { id: 'seed-4', playerName: 'ZERO_PULSE', score: 31400, maxLevel: 8, totalStars: 20, assistsUsed: 1, date: '2026-10-13' },
  { id: 'seed-5', playerName: 'AETHER_7', score: 27900, maxLevel: 7, totalStars: 18, assistsUsed: 0, date: '2026-10-12' },
  { id: 'seed-6', playerName: 'CYBER_LYNX', score: 23100, maxLevel: 6, totalStars: 15, assistsUsed: 2, date: '2026-10-11' },
  { id: 'seed-7', playerName: 'ORION_DRIFT', score: 19400, maxLevel: 5, totalStars: 13, assistsUsed: 0, date: '2026-10-10' },
  { id: 'seed-8', playerName: 'VORTEX_MK2', score: 15200, maxLevel: 5, totalStars: 11, assistsUsed: 1, date: '2026-10-09' },
  { id: 'seed-9', playerName: 'SOLARIS_UI', score: 11800, maxLevel: 4, totalStars: 9, assistsUsed: 0, date: '2026-10-08' },
  { id: 'seed-10', playerName: 'ECHO_PILOT', score: 8400, maxLevel: 3, totalStars: 6, assistsUsed: 0, date: '2026-10-07' },
];

export function getLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TOP_10));
      return [...DEFAULT_TOP_10];
    }
    const parsed = JSON.parse(raw) as LeaderboardEntry[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TOP_10));
      return [...DEFAULT_TOP_10];
    }
    return parsed.sort((a, b) => b.score - a.score).slice(0, 10);
  } catch {
    return [...DEFAULT_TOP_10];
  }
}

export function submitScoreToLeaderboard(entry: Omit<LeaderboardEntry, 'id' | 'date'>): {
  updatedList: LeaderboardEntry[];
  qualifiedRank: number | null;
} {
  const current = getLeaderboard();
  const newEntry: LeaderboardEntry = {
    ...entry,
    id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    date: new Date().toISOString().split('T')[0],
  };

  const lowestScore = current.length < 10 ? -1 : current[current.length - 1].score;
  if (newEntry.score <= lowestScore && current.length >= 10) {
    return { updatedList: current, qualifiedRank: null };
  }

  const combined = [...current, newEntry]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(combined));
  } catch {
    // ignore storage quota errors
  }

  const rankIndex = combined.findIndex((item) => item.id === newEntry.id);
  return {
    updatedList: combined,
    qualifiedRank: rankIndex !== -1 ? rankIndex + 1 : null,
  };
}

export const LEVELS_CONFIG: LevelConfig[] = [
  {
    level: 1,
    title: 'Sector 01: Perímetro de Ignición',
    subtitle: 'Calibración de rebote magnético y bloques cuánticos estándar',
    baseBallSpeed: 15.5,
    isBossLevel: false,
    targetScore3Stars: 2200,
    rows: 4,
    cols: 7,
    droneCount: 1,
  },
  {
    level: 2,
    title: 'Sector 02: Matriz de Cobalto',
    subtitle: 'Introducción de blindaje doble y núcleos explosivos',
    baseBallSpeed: 16.8,
    isBossLevel: false,
    targetScore3Stars: 5000,
    rows: 5,
    cols: 7,
    droneCount: 2,
  },
  {
    level: 3,
    title: 'Sector 03: Corredor de Fotones',
    subtitle: 'Escuadrones de drones móviles y barreras de titanio',
    baseBallSpeed: 18.0,
    isBossLevel: false,
    targetScore3Stars: 8500,
    rows: 5,
    cols: 8,
    droneCount: 3,
  },
  {
    level: 4,
    title: 'Sector 04: Bóveda de Plasma',
    subtitle: 'Formación densa con reactores en cadena',
    baseBallSpeed: 19.2,
    isBossLevel: false,
    targetScore3Stars: 12800,
    rows: 6,
    cols: 8,
    droneCount: 3,
  },
  {
    level: 5,
    title: 'Sector 05: Crucero Guardián AEGIS',
    subtitle: 'JEFE INTERMEDIO — Escudos rotatorios y cañón de pulsos',
    baseBallSpeed: 20.2,
    isBossLevel: true,
    bossName: 'CRUCERO GUARDIÁN AEGIS-V',
    bossMaxHp: 22,
    bossShieldCount: 2,
    bossFireInterval: 3.1,
    targetScore3Stars: 19500,
    rows: 3,
    cols: 7,
    droneCount: 2,
  },
  {
    level: 6,
    title: 'Sector 06: Cinturón Hiperespacial',
    subtitle: 'Velocidad incrementada y blindaje reforzado de 3 impactos',
    baseBallSpeed: 21.4,
    isBossLevel: false,
    targetScore3Stars: 25000,
    rows: 6,
    cols: 8,
    droneCount: 4,
  },
  {
    level: 7,
    title: 'Sector 07: Red de Singularidad',
    subtitle: 'Patrullas de interceptores rápidos y nodos volátiles',
    baseBallSpeed: 22.5,
    isBossLevel: false,
    targetScore3Stars: 31000,
    rows: 6,
    cols: 9,
    droneCount: 4,
  },
  {
    level: 8,
    title: 'Sector 08: Forja Cibernética',
    subtitle: 'Fortaleza simétrica de alta dureza',
    baseBallSpeed: 23.6,
    isBossLevel: false,
    targetScore3Stars: 38000,
    rows: 7,
    cols: 9,
    droneCount: 5,
  },
  {
    level: 9,
    title: 'Sector 09: Horizonte de Sucesos',
    subtitle: 'Antesala del núcleo con máxima densidad de patrullas',
    baseBallSpeed: 24.8,
    isBossLevel: false,
    targetScore3Stars: 45500,
    rows: 7,
    cols: 9,
    droneCount: 6,
  },
  {
    level: 10,
    title: 'Sector 10: Núcleo Overlord OMEGA',
    subtitle: 'JEFE FINAL — Fortaleza de 4 escudos orbitales y doble ráfaga',
    baseBallSpeed: 26.0,
    isBossLevel: true,
    bossName: 'NÚCLEO OVERLORD OMEGA-X',
    bossMaxHp: 40,
    bossShieldCount: 4,
    bossFireInterval: 2.2,
    targetScore3Stars: 56000,
    rows: 4,
    cols: 9,
    droneCount: 4,
  },
];
