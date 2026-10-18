import React, { useRef, useState } from 'react';
import {
  Award,
  Camera,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  FileCode,
  Heart,
  Pause,
  Play,
  RotateCcw,
  Shield,
  Sparkles,
  Star,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { CyberArenaCanvas } from './components/CyberArenaCanvas';
import { GameHUDState, LeaderboardEntry } from './types/game';
import { cyberAudio } from './utils/audioEngine';
import {
  getLeaderboard,
  LEVELS_CONFIG,
  submitScoreToLeaderboard,
} from './utils/leaderboard';
import {
  buildStandaloneHtmlCode,
  downloadStandaloneHtmlFile,
} from './utils/standaloneHtmlBuilder';

export default function App() {
  const [hudState, setHudState] = useState<GameHUDState>({
    phase: 'START_MENU',
    playerName: '',
    level: 1,
    score: 0,
    lives: 3,
    combo: 0,
    maxCombo: 0,
    starsPerLevel: [],
    assistsRemaining: 2,
    assistsUsed: 0,
    activePowerUps: {
      laserPods: 0,
      bottomShield: 0,
      slowMo: 0,
    },
    bossHp: 0,
    bossMaxHp: 0,
    bossName: '',
    blocksRemaining: 0,
    cameraMode: 'PERSPECTIVE',
    isMuted: false,
    lastLevelStars: 0,
    lastPenaltyAmount: 0,
  });

  const [pilotNameInput, setPilotNameInput] = useState<string>('');
  const [nameError, setNameError] = useState<boolean>(false);
  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(false);
  const [showTop10Modal, setShowTop10Modal] = useState<boolean>(false);
  const [showHtmlSourceModal, setShowHtmlSourceModal] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => getLeaderboard());
  const [qualifiedRank, setQualifiedRank] = useState<number | null>(null);

  const triggerAssistRef = useRef<((type: 'DESTROY_ROW' | 'EMERGENCY_SHIELD') => void) | null>(null);
  const startLevelRef = useRef<((levelNum: number, resetFullGame: boolean) => void) | null>(null);

  const totalStarsEarned = hudState.starsPerLevel.reduce((acc, s) => acc + (s || 0), 0);
  const currentLevelConfig = LEVELS_CONFIG[hudState.level - 1] || LEVELS_CONFIG[0];

  const handleStartNewGame = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleaned = pilotNameInput.trim().toUpperCase();
    if (!cleaned) {
      setNameError(true);
      return;
    }
    setNameError(false);
    setQualifiedRank(null);
    setHudState((prev) => ({
      ...prev,
      playerName: cleaned,
      phase: 'PLAYING',
    }));
    if (startLevelRef.current) {
      startLevelRef.current(1, true);
    }
  };

  const handleNextLevel = () => {
    const nextLvl = Math.min(10, hudState.level + 1);
    if (startLevelRef.current) {
      startLevelRef.current(nextLvl, false);
    }
  };

  const handleLevelComplete = () => {
    // Triggered by canvas when all blocks and boss are cleared
  };

  const handleGameEnd = (
    _victory: boolean,
    finalScore: number,
    maxLevel: number,
    starsArr: number[],
    assistsUsedCount: number
  ) => {
    const sumStars = starsArr.reduce((a, b) => a + (b || 0), 0);
    const result = submitScoreToLeaderboard({
      playerName: hudState.playerName || pilotNameInput.trim().toUpperCase() || 'PILOTO_X',
      score: finalScore,
      maxLevel,
      totalStars: sumStars,
      assistsUsed: assistsUsedCount,
    });
    setLeaderboard(result.updatedList);
    setQualifiedRank(result.qualifiedRank);
  };

  const toggleAudioMute = () => {
    const nextMuted = !hudState.isMuted;
    cyberAudio.setMuted(nextMuted);
    setHudState((prev) => ({ ...prev, isMuted: nextMuted }));
  };

  const toggleCameraMode = () => {
    setHudState((prev) => ({
      ...prev,
      cameraMode: prev.cameraMode === 'PERSPECTIVE' ? 'ISOMETRIC' : 'PERSPECTIVE',
    }));
  };

  const togglePause = () => {
    if (hudState.phase === 'PLAYING') {
      setHudState((prev) => ({ ...prev, phase: 'PAUSED' }));
    } else if (hudState.phase === 'PAUSED') {
      setHudState((prev) => ({ ...prev, phase: 'PLAYING' }));
    }
  };

  const handleCopyStandaloneCode = () => {
    const code = buildStandaloneHtmlCode();
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    });
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#070913] text-[#F8FAFC] select-none">
      {/* 1. Three.js WebGL 3D Viewport (100% Unobstructed Center) */}
      <CyberArenaCanvas
        hudState={hudState}
        setHudState={setHudState}
        onLevelComplete={handleLevelComplete}
        onGameEnd={handleGameEnd}
        triggerAssistRef={triggerAssistRef}
        startLevelRef={startLevelRef}
      />

      {/* 2. Top Bar Contract (3 Zones: Brand Wordmark | Single-Line Telemetry | Primary Action) */}
      <header className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between gap-8 px-6 py-3.5 bg-[#070913]/90 border-b border-slate-800/80">
        {/* Zone 1: Single text element wordmark */}
        <span className="font-display text-base md:text-lg font-extrabold tracking-wider text-white whitespace-nowrap shrink-0">
          CYBER-NEON BREAKOUT
        </span>

        {/* Zone 2: Clean unboxed telemetry with typographic separators */}
        <div className="hidden lg:flex items-center gap-4 text-xs text-slate-400 whitespace-nowrap shrink-0">
          <span>
            Piloto{' '}
            <strong className="text-slate-100 font-semibold ml-1">
              {hudState.playerName || 'SIN REGISTRAR'}
            </strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Sector{' '}
            <strong className="font-mono-num text-cyan-400 font-bold ml-1">
              {hudState.level} / 10
            </strong>
          </span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            Estrellas{' '}
            <strong className="font-mono-num text-amber-400 font-bold ml-1">
              {totalStarsEarned} ★
            </strong>
          </span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            Vidas{' '}
            <strong className="font-mono-num text-rose-400 font-bold ml-1">
              {hudState.lives}
            </strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Puntaje{' '}
            <strong className="font-mono-num text-white text-sm font-bold ml-1">
              {hudState.score.toLocaleString()}
            </strong>
          </span>
          {hudState.combo > 1 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-mono-num text-fuchsia-400 font-bold">
                Combo x{hudState.combo}
              </span>
            </>
          )}
        </div>

        {/* Zone 3: 1 Primary Action (Top 10 Leaderboard) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              setLeaderboard(getLeaderboard());
              setShowTop10Modal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-100 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            Tabla Top 10
          </button>
        </div>
      </header>

      {/* Mobile Compact Telemetry Strip */}
      <div className="lg:hidden fixed top-14 left-0 right-0 z-10 flex items-center justify-around px-4 py-1.5 bg-[#0B1120]/90 border-b border-slate-800/60 text-xs text-slate-300 font-mono-num">
        <span>Nvl {hudState.level}/10</span>
        <span>★ {totalStarsEarned}</span>
        <span>♥ {hudState.lives}</span>
        <span className="text-cyan-400 font-bold">{hudState.score.toLocaleString()} pts</span>
      </div>

      {/* Boss Health & Active Power-Ups Sub-Header (When in active combat) */}
      {hudState.phase === 'PLAYING' && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 w-full max-w-xl px-4 pointer-events-none">
          {hudState.bossMaxHp > 0 && hudState.bossHp > 0 && (
            <div className="w-full bg-[#0F172A]/95 border border-amber-500/40 rounded-lg px-4 py-2.5 shadow-lg">
              <div className="flex items-center justify-between text-xs font-display font-bold text-amber-400 mb-1.5">
                <span>{hudState.bossName}</span>
                <span className="font-mono-num">
                  {hudState.bossHp} / {hudState.bossMaxHp} HP
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-150"
                  style={{
                    width: `${Math.max(0, (hudState.bossHp / hudState.bossMaxHp) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Active Power-Up Timers */}
          {(hudState.activePowerUps.laserPods > 0 ||
            hudState.activePowerUps.bottomShield > 0 ||
            hudState.activePowerUps.slowMo > 0) && (
            <div className="flex items-center gap-4 px-3.5 py-1.5 rounded-lg bg-[#0F172A]/90 border border-slate-700/70 text-xs font-mono-num text-slate-200">
              {hudState.activePowerUps.laserPods > 0 && (
                <span className="text-pink-400">
                  Láseres: {hudState.activePowerUps.laserPods.toFixed(1)}s
                </span>
              )}
              {hudState.activePowerUps.bottomShield > 0 && (
                <span className="text-emerald-400">
                  Escudo Base: {hudState.activePowerUps.bottomShield.toFixed(1)}s
                </span>
              )}
              {hudState.activePowerUps.slowMo > 0 && (
                <span className="text-amber-400">
                  Ralentización: {hudState.activePowerUps.slowMo.toFixed(1)}s
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. Unified Collapsible Bottom Control Dock (Zero Viewport Occlusion) */}
      <div
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-20 w-[min(960px,95vw)] transition-transform duration-200 ${
          isDockCollapsed ? 'translate-y-[calc(100%-26px)]' : 'translate-y-0'
        }`}
      >
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setIsDockCollapsed(!isDockCollapsed)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1 text-xs font-medium text-slate-300 bg-[#0F172A] border border-b-0 border-slate-700/80 rounded-t-lg hover:text-white transition-colors cursor-pointer"
          >
            {isDockCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" /> Mostrar Controles Tácticos
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" /> Ocultar Controles
              </>
            )}
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#0F172A]/95 border border-slate-700/80 rounded-xl shadow-2xl">
          {/* Left Group: 2 Strategic Assists with -15% Penalty */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={hudState.phase !== 'PLAYING' || hudState.assistsRemaining <= 0}
              onClick={() => triggerAssistRef.current?.('DESTROY_ROW')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/40 rounded-lg hover:bg-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Destruye la línea frontal de bloques o daña al jefe (-15% de puntos)"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Pulso Destructor (-15% pts)
            </button>

            <button
              type="button"
              disabled={hudState.phase !== 'PLAYING' || hudState.assistsRemaining <= 0}
              onClick={() => triggerAssistRef.current?.('EMERGENCY_SHIELD')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/40 rounded-lg hover:bg-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Despliega el escudo inferior por 15 segundos (-15% de puntos)"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Escudo Emergencia (-15% pts)
            </button>

            <span className="text-xs text-slate-400 font-mono-num px-1 whitespace-nowrap">
              Ayudas: {hudState.assistsRemaining} / 2
            </span>
          </div>

          {/* Right Group: Camera, Audio, Pause & Single-File HTML5 Export */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleCameraMode}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800/90 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
              {hudState.cameraMode === 'PERSPECTIVE' ? 'Perspectiva 3D' : 'Isométrica'}
            </button>

            <button
              type="button"
              onClick={toggleAudioMute}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800/90 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {hudState.isMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              )}
              {hudState.isMuted ? 'Silenciado' : 'Audio ASMR'}
            </button>

            {(hudState.phase === 'PLAYING' || hudState.phase === 'PAUSED') && (
              <button
                type="button"
                onClick={togglePause}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800/90 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {hudState.phase === 'PAUSED' ? (
                  <>
                    <Play className="w-3.5 h-3.5 text-emerald-400" /> Reanudar
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5 text-amber-400" /> Pausa
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={downloadStandaloneHtmlFile}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Descargar el juego completo en un único archivo .html autocontenido"
            >
              <Download className="w-3.5 h-3.5" />
              Descargar HTML5 Único
            </button>

            <button
              type="button"
              onClick={() => setShowHtmlSourceModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800/90 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Ver y copiar el código fuente HTML5 autocontenido"
            >
              <FileCode className="w-3.5 h-3.5 text-cyan-400" />
              Código HTML
            </button>
          </div>
        </div>
      </div>

      {/* 4. Mandatory Start Screen Modal (Player Name Registration) */}
      {hudState.phase === 'START_MENU' && !showTop10Modal && !showHtmlSourceModal && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#070913]/85">
          <div className="w-full max-w-lg p-7 bg-[#0F172A] border border-slate-700/80 rounded-2xl shadow-2xl">
            <div className="text-xs font-semibold text-cyan-400 tracking-wide mb-1">
              SIMULADOR ARCADE TRIDIMENSIONAL · 10 NIVELES
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-2">
              CYBER-NEON BREAKOUT
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed mb-5">
              Desliza la plataforma magnética con el mouse, teclado o pantalla táctil para rebotar
              la esfera de plasma, destruir las matrices cuánticas y derrotar a los jefes mecánicos
              en los sectores 5 y 10.
            </p>

            <form onSubmit={handleStartNewGame} className="space-y-4">
              <div>
                <label
                  htmlFor="pilot-name-input"
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  NOMBRE DEL PILOTO (OBLIGATORIO PARA LA TABLA TOP 10)
                </label>
                <input
                  id="pilot-name-input"
                  type="text"
                  maxLength={16}
                  value={pilotNameInput}
                  onChange={(e) => {
                    setPilotNameInput(e.target.value);
                    if (nameError) setNameError(false);
                  }}
                  placeholder="Ej. VALKYRIE_01"
                  className={`w-full px-4 py-3 text-sm font-semibold text-white bg-[#070913] border rounded-xl outline-none transition-colors ${
                    nameError
                      ? 'border-rose-500 focus:border-rose-400'
                      : 'border-slate-700 focus:border-cyan-400'
                  }`}
                  autoFocus
                />
                {nameError && (
                  <p className="text-xs text-rose-400 mt-1">
                    Por favor ingresa tu nombre de piloto antes de iniciar la partida.
                  </p>
                )}
              </div>

              {/* Quick Guide of Power-Ups & Strategic Assists */}
              <div className="grid grid-cols-2 gap-2.5 p-3.5 bg-[#070913]/80 border border-slate-800 rounded-xl text-xs text-slate-300">
                <div>
                  <strong className="text-cyan-400 block mb-0.5">Cápsulas Power-Up</strong>
                  <span>Multi-Esfera · Láseres · Escudo · Ralentización</span>
                </div>
                <div>
                  <strong className="text-amber-400 block mb-0.5">2 Ayudas Tácticas</strong>
                  <span>Pulso de fila o Escudo emergencia (-15% pts)</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={downloadStandaloneHtmlFile}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-200 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-cyan-400" />
                  Descargar HTML5 Único
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-lg transition-colors cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Iniciar Partida
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Level Complete Modal (Star Rating 1-3 Stars & Progression) */}
      {hudState.phase === 'LEVEL_COMPLETE' && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#070913]/85">
          <div className="w-full max-w-md p-7 bg-[#0F172A] border border-slate-700/80 rounded-2xl shadow-2xl text-center">
            <div className="text-xs font-semibold text-emerald-400 tracking-wide mb-1">
              SECTOR {hudState.level} DESPEJADO
            </div>
            <h2 className="font-display text-2xl font-extrabold text-white mb-2">
              {currentLevelConfig.title}
            </h2>

            {/* 1 to 3 Stars Display */}
            <div className="flex items-center justify-center gap-3 my-5">
              {[1, 2, 3].map((starIdx) => {
                const earned = starIdx <= hudState.lastLevelStars;
                return (
                  <div
                    key={starIdx}
                    className={`p-3 rounded-xl border ${
                      earned
                        ? 'bg-amber-500/15 border-amber-400/60 text-amber-400'
                        : 'bg-slate-900 border-slate-800 text-slate-600'
                    }`}
                  >
                    <Star className={`w-7 h-7 ${earned ? 'fill-amber-400' : ''}`} />
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-3 p-4 bg-[#070913] border border-slate-800 rounded-xl text-xs mb-6">
              <div>
                <span className="text-slate-400 block">Puntaje Acumulado</span>
                <strong className="font-mono-num text-lg text-white">
                  {hudState.score.toLocaleString()}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block">Vidas Restantes</span>
                <strong className="font-mono-num text-lg text-rose-400">
                  {hudState.lives} ♥
                </strong>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNextLevel}
              className="w-full py-3 text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl transition-colors cursor-pointer"
            >
              Avanzar al Sector {hudState.level + 1}
              {hudState.level + 1 === 5 || hudState.level + 1 === 10
                ? ' (¡ALERTA DE JEFE!)'
                : ''}
            </button>
          </div>
        </div>
      )}

      {/* 6. Game Over / Victory Final Summary Modal */}
      {(hudState.phase === 'GAME_OVER' || hudState.phase === 'VICTORY') && !showTop10Modal && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#070913]/85">
          <div className="w-full max-w-lg p-7 bg-[#0F172A] border border-slate-700/80 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-xs font-bold tracking-wide ${
                  hudState.phase === 'VICTORY' ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {hudState.phase === 'VICTORY'
                  ? 'CAMPAÑA DE 10 SECTORES COMPLETADA'
                  : 'SECUENCIA INTERRUMPIDA — SIN VIDAS'}
              </span>
              {qualifiedRank !== null && (
                <span className="text-xs font-mono-num font-bold text-amber-400">
                  ¡NUEVO RÉCORD TOP #{qualifiedRank}!
                </span>
              )}
            </div>

            <h2 className="font-display text-2xl md:text-3xl font-extrabold text-white mb-4">
              {hudState.phase === 'VICTORY' ? 'VICTORIA SUPREMA' : 'FIN DE LA PARTIDA'}
            </h2>

            <div className="grid grid-cols-3 gap-3 p-4 bg-[#070913] border border-slate-800 rounded-xl text-xs mb-5">
              <div>
                <span className="text-slate-400 block">Puntaje Final</span>
                <strong className="font-mono-num text-lg text-cyan-400">
                  {hudState.score.toLocaleString()}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block">Estrellas Totales</span>
                <strong className="font-mono-num text-lg text-amber-400">
                  {totalStarsEarned} / 30 ★
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block">Ayudas Usadas</span>
                <strong className="font-mono-num text-lg text-slate-200">
                  {hudState.assistsUsed} / 2
                </strong>
              </div>
            </div>

            {/* Mini Leaderboard Preview */}
            <div className="mb-5">
              <div className="text-xs font-semibold text-slate-300 mb-2">
                CLASIFICACIÓN TOP 10 GLOBAL (LOCALSTORAGE)
              </div>
              <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-xl bg-[#070913]/90">
                <table className="w-full text-left text-xs font-mono-num">
                  <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">Piloto</th>
                      <th className="py-2 px-3">Sector</th>
                      <th className="py-2 px-3">Estrellas</th>
                      <th className="py-2 px-3 text-right">Puntaje</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {leaderboard.map((entry, idx) => (
                      <tr
                        key={entry.id}
                        className={
                          entry.playerName === hudState.playerName &&
                          entry.score === hudState.score
                            ? 'bg-cyan-500/15 text-cyan-300 font-bold'
                            : 'text-slate-300'
                        }
                      >
                        <td className="py-2 px-3">{idx + 1}</td>
                        <td className="py-2 px-3">{entry.playerName}</td>
                        <td className="py-2 px-3">{entry.maxLevel}</td>
                        <td className="py-2 px-3 text-amber-400">{entry.totalStars} ★</td>
                        <td className="py-2 px-3 text-right">{entry.score.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setHudState((prev) => ({ ...prev, phase: 'START_MENU' }))}
                className="px-4 py-2.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Cambiar Piloto
              </button>

              <button
                type="button"
                onClick={() => startLevelRef.current?.(1, true)}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Jugar de Nuevo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Top 10 Global Leaderboard Consultation Modal */}
      {showTop10Modal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-[#070913]/85">
          <div className="w-full max-w-xl p-7 bg-[#0F172A] border border-slate-700/80 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-xl font-extrabold text-white">
                  TABLA TOP 10 GLOBAL
                </h2>
                <p className="text-xs text-slate-400">
                  Los nuevos puntajes desplazan automáticamente al registro menor.
                </p>
              </div>
              <Award className="w-7 h-7 text-amber-400" />
            </div>

            <div className="overflow-hidden border border-slate-800 rounded-xl bg-[#070913] mb-5">
              <table className="w-full text-left text-xs font-mono-num">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Pos</th>
                    <th className="py-2.5 px-3">Piloto</th>
                    <th className="py-2.5 px-3">Nivel Máx</th>
                    <th className="py-2.5 px-3">Estrellas</th>
                    <th className="py-2.5 px-3">Ayudas</th>
                    <th className="py-2.5 px-3 text-right">Puntaje</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {leaderboard.map((item, index) => (
                    <tr key={item.id} className="text-slate-200 hover:bg-slate-900/50">
                      <td className="py-2.5 px-3 font-bold text-cyan-400">#{index + 1}</td>
                      <td className="py-2.5 px-3 font-semibold">{item.playerName}</td>
                      <td className="py-2.5 px-3">{item.maxLevel} / 10</td>
                      <td className="py-2.5 px-3 text-amber-400">{item.totalStars} ★</td>
                      <td className="py-2.5 px-3 text-slate-400">{item.assistsUsed}/2</td>
                      <td className="py-2.5 px-3 text-right font-bold text-white">
                        {item.score.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowTop10Modal(false)}
                className="px-5 py-2.5 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl transition-colors cursor-pointer"
              >
                Cerrar Clasificación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Single-File HTML5 Source Code Viewer & Exporter Modal */}
      {showHtmlSourceModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-[#070913]/85">
          <div className="w-full max-w-3xl p-6 bg-[#0F172A] border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-display text-lg font-extrabold text-white">
                  CÓDIGO HTML5 AUTOCONTENIDO (ARCHIVO ÚNICO)
                </h2>
                <p className="text-xs text-slate-400">
                  Todo el motor 3D Three.js, físicas, 10 niveles, jefes y audio Web Audio API en un
                  solo archivo listo para guardar como .html y ejecutar en cualquier navegador.
                </p>
              </div>
            </div>

            <pre className="flex-1 overflow-auto p-4 rounded-xl bg-[#070913] border border-slate-800 text-xs font-mono-num text-cyan-300 select-all">
              {buildStandaloneHtmlCode()}
            </pre>

            <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyStandaloneCode}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-100 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-cyan-400" />
                  {copiedCode ? '¡Código Copiado!' : 'Copiar Bloque HTML'}
                </button>

                <button
                  type="button"
                  onClick={downloadStandaloneHtmlFile}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Descargar cyber-neon-breakout-3d.html
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowHtmlSourceModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
