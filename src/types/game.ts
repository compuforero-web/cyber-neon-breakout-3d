export type GamePhase =
  | 'START_MENU'
  | 'PLAYING'
  | 'PAUSED'
  | 'LEVEL_COMPLETE'
  | 'GAME_OVER'
  | 'VICTORY';

export type PowerUpType = 'MULTI_BALL' | 'LASER_PODS' | 'BOTTOM_SHIELD' | 'SLOW_MO';

export type BlockType = 'STANDARD' | 'ARMORED' | 'EXPLOSIVE' | 'DRONE';

export interface ActivePowerUps {
  laserPods: number;     // remaining seconds
  bottomShield: number;  // remaining seconds
  slowMo: number;        // remaining seconds
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  maxLevel: number;
  totalStars: number;
  assistsUsed: number;
  date: string;
}

export interface LevelConfig {
  level: number;
  title: string;
  subtitle: string;
  baseBallSpeed: number;
  isBossLevel: boolean;
  bossName?: string;
  bossMaxHp?: number;
  bossShieldCount?: number;
  bossFireInterval?: number;
  targetScore3Stars: number;
  rows: number;
  cols: number;
  droneCount: number;
}

export interface GameHUDState {
  phase: GamePhase;
  playerName: string;
  level: number;
  score: number;
  lives: number;
  combo: number;
  maxCombo: number;
  starsPerLevel: number[];
  assistsRemaining: number;
  assistsUsed: number;
  activePowerUps: ActivePowerUps;
  bossHp: number;
  bossMaxHp: number;
  bossName: string;
  blocksRemaining: number;
  cameraMode: 'PERSPECTIVE' | 'ISOMETRIC';
  isMuted: boolean;
  lastLevelStars: number;
  lastPenaltyAmount: number;
}
