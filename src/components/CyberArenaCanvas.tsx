import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  ActivePowerUps,
  BlockType,
  GameHUDState,
  GamePhase,
  PowerUpType,
} from '../types/game';
import { cyberAudio } from '../utils/audioEngine';
import { LEVELS_CONFIG } from '../utils/leaderboard';
import {
  createArenaFloorTexture,
  createBossFortressGroup,
  createPlasmaBallGroup,
  createPlayerPaddleGroup,
  createPowerUpCapsule,
  createQuantumBlockGroup,
} from '../utils/proceduralModels';

interface CyberArenaCanvasProps {
  hudState: GameHUDState;
  setHudState: React.Dispatch<React.SetStateAction<GameHUDState>>;
  onLevelComplete: (level: number, score: number, lives: number, starsEarned: number) => void;
  onGameEnd: (victory: boolean, finalScore: number, maxLevel: number, starsPerLevel: number[], assistsUsed: number) => void;
  triggerAssistRef: React.MutableRefObject<((type: 'DESTROY_ROW' | 'EMERGENCY_SHIELD') => void) | null>;
  startLevelRef: React.MutableRefObject<((levelNum: number, resetFullGame: boolean) => void) | null>;
}

interface BallEntity {
  group: THREE.Group;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  active: boolean;
}

interface BlockEntity {
  id: number;
  group: THREE.Group;
  type: BlockType;
  hp: number;
  maxHp: number;
  pos: THREE.Vector3;
  baseX: number;
  width: number;
  depth: number;
  points: number;
  colorHex: number;
  active: boolean;
  phaseOffset: number;
}

interface PowerUpEntity {
  group: THREE.Group;
  type: PowerUpType;
  pos: THREE.Vector3;
  active: boolean;
}

interface ProjectileEntity {
  mesh: THREE.Mesh;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  fromPlayer: boolean;
  active: boolean;
}

interface ParticleData {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  color: THREE.Color;
  life: number;
  maxLife: number;
  scale: number;
}

// Reusable module-scope math objects for zero-GC render loop
const _dummyObj = new THREE.Object3D();
const _tempVec3 = new THREE.Vector3();
const _planeIntersect = new THREE.Vector3();
const _playPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const _raycaster = new THREE.Raycaster();
const _pointerNDC = new THREE.Vector2();

const ARENA_HALF_WIDTH = 11.2;
const ARENA_TOP_Z = -15.5;
const ARENA_BOTTOM_Z = 13.5;
const PADDLE_Z = 11.2;
const MAX_PARTICLES = 320;

export const CyberArenaCanvas: React.FC<CyberArenaCanvasProps> = ({
  hudState,
  setHudState,
  onLevelComplete,
  onGameEnd,
  triggerAssistRef,
  startLevelRef,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const hudStateRef = useRef<GameHUDState>(hudState);
  hudStateRef.current = hudState;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene & Renderer Initialization
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070913);
    scene.fog = new THREE.FogExp2(0x070913, 0.018);

    const isHeadless = navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);
    const renderer = new THREE.WebGLRenderer({
      antialias: !isHeadless,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = !isHeadless;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Studio Environment Map (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 2. Cameras (Perspective + Orthographic Isometric)
    const aspect = container.clientWidth / Math.max(1, container.clientHeight);
    const perspCamera = new THREE.PerspectiveCamera(48, aspect, 0.5, 120);
    perspCamera.position.set(0, 23.5, 22.5);
    perspCamera.lookAt(0, 0, 0.5);

    const frustumSize = 29;
    const orthoCamera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      120
    );
    orthoCamera.position.set(0, 26, 18);
    orthoCamera.lookAt(0, 0, 0);

    // 3. Balanced 3-Point Studio Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.65);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.8);
    keyLight.position.set(12, 26, 14);
    keyLight.castShadow = !isHeadless;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    const d = 18;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xec4899, 1.1);
    rimLight.position.set(-14, 15, -18);
    scene.add(rimLight);

    // 4. Arena Floor & Neon Perimeter Walls
    const floorTex = createArenaFloorTexture(renderer);
    const floorGeo = new THREE.PlaneGeometry(ARENA_HALF_WIDTH * 2 + 1.2, 31);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.4,
      metalness: 0.5,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.set(0, -0.02, -1.0);
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Left, Right and Top containment rails (multi-part glowing borders)
    const wallMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.2,
      clearcoat: 0.8,
    });
    const railGlowMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 1.5,
    });

    const sideWallGeo = new THREE.BoxGeometry(0.6, 1.1, 30);
    const leftWall = new THREE.Mesh(sideWallGeo, wallMat);
    leftWall.position.set(-ARENA_HALF_WIDTH - 0.3, 0.55, -1.0);
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(sideWallGeo, wallMat);
    rightWall.position.set(ARENA_HALF_WIDTH + 0.3, 0.55, -1.0);
    scene.add(rightWall);

    const topWallGeo = new THREE.BoxGeometry(ARENA_HALF_WIDTH * 2 + 1.2, 1.1, 0.6);
    const topWall = new THREE.Mesh(topWallGeo, wallMat);
    topWall.position.set(0, 0.55, ARENA_TOP_Z - 0.3);
    scene.add(topWall);

    // Inner neon trim strips on walls
    const sideTrimGeo = new THREE.BoxGeometry(0.12, 0.25, 29.6);
    const leftTrim = new THREE.Mesh(sideTrimGeo, railGlowMat);
    leftTrim.position.set(-ARENA_HALF_WIDTH + 0.04, 0.55, -1.0);
    scene.add(leftTrim);

    const rightTrim = new THREE.Mesh(sideTrimGeo, railGlowMat);
    rightTrim.position.set(ARENA_HALF_WIDTH - 0.04, 0.55, -1.0);
    scene.add(rightTrim);

    // Bottom Emergency Energy Shield Barrier
    const shieldBarrierGeo = new THREE.BoxGeometry(ARENA_HALF_WIDTH * 2, 0.45, 0.35);
    const shieldBarrierMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 2.2,
      transparent: true,
      opacity: 0.85,
    });
    const bottomShieldMesh = new THREE.Mesh(shieldBarrierGeo, shieldBarrierMat);
    bottomShieldMesh.position.set(0, 0.35, PADDLE_Z + 1.35);
    bottomShieldMesh.visible = false;
    scene.add(bottomShieldMesh);

    // 5. Player Paddle Creation
    const paddleObj = createPlayerPaddleGroup();
    paddleObj.group.position.set(0, 0, PADDLE_Z);
    scene.add(paddleObj.group);

    // 6. Instanced Particle System for Neon Explosions
    const particleGeo = new THREE.BoxGeometry(0.24, 0.24, 0.24);
    const particleMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.5,
    });
    const particleInstanced = new THREE.InstancedMesh(particleGeo, particleMat, MAX_PARTICLES);
    particleInstanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    particleInstanced.frustumCulled = false;
    scene.add(particleInstanced);

    const particles: ParticleData[] = [];
    for (let i = 0; i < MAX_PARTICLES; i++) {
      particles.push({
        pos: new THREE.Vector3(0, -100, 0),
        vel: new THREE.Vector3(),
        color: new THREE.Color(0x06b6d4),
        life: 0,
        maxLife: 1,
        scale: 0,
      });
      _dummyObj.position.set(0, -100, 0);
      _dummyObj.scale.setScalar(0);
      _dummyObj.updateMatrix();
      particleInstanced.setMatrixAt(i, _dummyObj.matrix);
      particleInstanced.setColorAt(i, new THREE.Color(0x06b6d4));
    }

    function spawnExplosion(origin: THREE.Vector3, hexColor: number, count: number = 22) {
      let spawned = 0;
      for (let i = 0; i < MAX_PARTICLES && spawned < count; i++) {
        if (particles[i].life <= 0) {
          const p = particles[i];
          p.pos.copy(origin);
          p.pos.y = 0.5;
          const angle = Math.random() * Math.PI * 2;
          const speed = 3 + Math.random() * 9.5;
          p.vel.set(
            Math.cos(angle) * speed,
            2.5 + Math.random() * 6.5,
            Math.sin(angle) * speed
          );
          p.color.setHex(hexColor);
          p.maxLife = 0.45 + Math.random() * 0.45;
          p.life = p.maxLife;
          p.scale = 0.7 + Math.random() * 0.9;
          particleInstanced.setColorAt(i, p.color);
          spawned++;
        }
      }
      if (particleInstanced.instanceColor) {
        particleInstanced.instanceColor.needsUpdate = true;
      }
    }

    // 7. Mutable Game Simulation State
    let paddleTargetX = 0;
    let paddleCurrentX = 0;
    const keysPressed: Record<string, boolean> = {};

    const balls: BallEntity[] = [];
    const blocks: BlockEntity[] = [];
    const powerUps: PowerUpEntity[] = [];
    const projectiles: ProjectileEntity[] = [];

    let bossEntity: {
      active: boolean;
      group: THREE.Group | null;
      shieldOrbitGroup: THREE.Group | null;
      shieldMeshes: THREE.Mesh[];
      coreMesh: THREE.Mesh | null;
      pos: THREE.Vector3;
      hp: number;
      maxHp: number;
      fireCooldown: number;
      fireInterval: number;
    } = {
      active: false,
      group: null,
      shieldOrbitGroup: null,
      shieldMeshes: [],
      coreMesh: null,
      pos: new THREE.Vector3(0, 0, -10.5),
      hp: 0,
      maxHp: 1,
      fireCooldown: 2.5,
      fireInterval: 3.0,
    };

    let currentScore = 0;
    let currentLives = 3;
    let currentLevel = 1;
    let currentCombo = 0;
    let maxCombo = 0;
    let starsPerLevel: number[] = [];
    let assistsRemaining = 2;
    let assistsUsed = 0;
    let laserFireTimer = 0;
    let activeTimers: ActivePowerUps = {
      laserPods: 0,
      bottomShield: 0,
      slowMo: 0,
    };

    function clearArenaEntities() {
      balls.forEach((b) => scene.remove(b.group));
      balls.length = 0;

      blocks.forEach((b) => scene.remove(b.group));
      blocks.length = 0;

      powerUps.forEach((p) => scene.remove(p.group));
      powerUps.length = 0;

      projectiles.forEach((pr) => scene.remove(pr.mesh));
      projectiles.length = 0;

      if (bossEntity.group) {
        scene.remove(bossEntity.group);
        bossEntity.group = null;
      }
      bossEntity.active = false;
    }

    function spawnBall(pos: THREE.Vector3, dirX: number, dirZ: number) {
      const cfg = LEVELS_CONFIG[currentLevel - 1] || LEVELS_CONFIG[0];
      const ballGroup = createPlasmaBallGroup();
      ballGroup.position.copy(pos);
      scene.add(ballGroup);

      const dir = new THREE.Vector3(dirX, 0, dirZ).normalize();
      balls.push({
        group: ballGroup,
        pos: pos.clone(),
        vel: dir.multiplyScalar(cfg.baseBallSpeed),
        active: true,
      });
    }

    function buildLevel(levelNum: number, resetFullGame: boolean) {
      clearArenaEntities();
      currentLevel = Math.min(Math.max(1, levelNum), 10);
      const cfg = LEVELS_CONFIG[currentLevel - 1];

      if (resetFullGame) {
        currentScore = 0;
        currentLives = 3;
        currentCombo = 0;
        maxCombo = 0;
        starsPerLevel = [];
        assistsRemaining = 2;
        assistsUsed = 0;
      }

      activeTimers = { laserPods: 0, bottomShield: 0, slowMo: 0 };
      paddleTargetX = 0;
      paddleCurrentX = 0;
      paddleObj.group.position.x = 0;

      // Spawn initial plasma sphere just above paddle
      spawnBall(new THREE.Vector3(0, 0.35, PADDLE_Z - 1.1), (Math.random() - 0.5) * 0.5, -1);

      const palette = [0x06b6d4, 0x3b82f6, 0xec4899, 0xa855f7, 0x10b981, 0xf59e0b];
      let blockIdCounter = 1;

      const startZ = cfg.isBossLevel ? -6.2 : -13.2;
      const spacingX = 2.4;
      const spacingZ = 1.28;
      const totalWidth = (cfg.cols - 1) * spacingX;

      for (let r = 0; r < cfg.rows; r++) {
        for (let c = 0; c < cfg.cols; c++) {
          const x = -totalWidth / 2 + c * spacingX;
          const z = startZ + r * spacingZ;

          let bType: BlockType = 'STANDARD';
          let hp = 1;
          let pts = 120;
          let color = palette[(r + currentLevel) % palette.length];

          if (r === 0 && currentLevel >= 2) {
            bType = 'ARMORED';
            hp = currentLevel >= 6 ? 3 : 2;
            pts = 280;
            color = 0x38bdf8;
          } else if ((r + c) % 7 === 0 && currentLevel >= 2) {
            bType = 'EXPLOSIVE';
            hp = 1;
            pts = 220;
            color = 0xf43f5e;
          }

          const bGroup = createQuantumBlockGroup(bType, color);
          bGroup.position.set(x, 0, z);
          scene.add(bGroup);

          blocks.push({
            id: blockIdCounter++,
            group: bGroup,
            type: bType,
            hp,
            maxHp: hp,
            pos: new THREE.Vector3(x, 0, z),
            baseX: x,
            width: 2.15,
            depth: 1.05,
            points: pts,
            colorHex: color,
            active: true,
            phaseOffset: r * 0.6 + c * 0.4,
          });
        }
      }

      // Spawn moving interceptor drones
      const droneZ = cfg.isBossLevel ? -2.2 : startZ + cfg.rows * spacingZ + 0.6;
      for (let d = 0; d < cfg.droneCount; d++) {
        const dx = (d - (cfg.droneCount - 1) / 2) * 3.8;
        const dGroup = createQuantumBlockGroup('DRONE', 0xf59e0b);
        dGroup.position.set(dx, 0, droneZ);
        scene.add(dGroup);

        blocks.push({
          id: blockIdCounter++,
          group: dGroup,
          type: 'DRONE',
          hp: currentLevel >= 6 ? 2 : 1,
          maxHp: currentLevel >= 6 ? 2 : 1,
          pos: new THREE.Vector3(dx, 0, droneZ),
          baseX: dx,
          width: 2.0,
          depth: 1.2,
          points: 350,
          colorHex: 0xf59e0b,
          active: true,
          phaseOffset: d * 1.5,
        });
      }

      // Spawn Boss Fortress on Levels 5 & 10
      if (cfg.isBossLevel && cfg.bossMaxHp && cfg.bossShieldCount) {
        const bossModel = createBossFortressGroup(currentLevel, cfg.bossShieldCount);
        bossModel.group.position.set(0, 0, -11.2);
        scene.add(bossModel.group);

        bossEntity = {
          active: true,
          group: bossModel.group,
          shieldOrbitGroup: bossModel.shieldOrbitGroup,
          shieldMeshes: bossModel.shieldMeshes,
          coreMesh: bossModel.coreMesh,
          pos: new THREE.Vector3(0, 0, -11.2),
          hp: cfg.bossMaxHp,
          maxHp: cfg.bossMaxHp,
          fireCooldown: cfg.bossFireInterval || 3.0,
          fireInterval: cfg.bossFireInterval || 3.0,
        };
      }

      setHudState((prev) => ({
        ...prev,
        phase: 'PLAYING',
        level: currentLevel,
        score: currentScore,
        lives: currentLives,
        combo: currentCombo,
        maxCombo,
        starsPerLevel: [...starsPerLevel],
        assistsRemaining,
        assistsUsed,
        activePowerUps: { ...activeTimers },
        bossHp: bossEntity.active ? bossEntity.hp : 0,
        bossMaxHp: bossEntity.active ? bossEntity.maxHp : 0,
        bossName: cfg.bossName || '',
        blocksRemaining: blocks.filter((b) => b.active).length,
        lastPenaltyAmount: 0,
      }));
    }

    startLevelRef.current = buildLevel;

    // 8. Tactical Assist Handler (Max 2 uses per match, -15% score penalty each)
    triggerAssistRef.current = (assistType: 'DESTROY_ROW' | 'EMERGENCY_SHIELD') => {
      if (hudStateRef.current.phase !== 'PLAYING' || assistsRemaining <= 0) return;

      assistsRemaining -= 1;
      assistsUsed += 1;
      const penalty = Math.round(currentScore * 0.15);
      currentScore = Math.max(0, currentScore - penalty);
      cyberAudio.playAssistPulse();

      if (assistType === 'EMERGENCY_SHIELD') {
        activeTimers.bottomShield = Math.max(activeTimers.bottomShield, 15);
        spawnExplosion(new THREE.Vector3(0, 0.5, PADDLE_Z + 1.2), 0x10b981, 35);
      } else if (assistType === 'DESTROY_ROW') {
        // Find active blocks closest to the player (highest Z)
        const activeBlocks = blocks.filter((b) => b.active);
        if (activeBlocks.length > 0) {
          const maxZ = Math.max(...activeBlocks.map((b) => b.pos.z));
          activeBlocks.forEach((b) => {
            if (Math.abs(b.pos.z - maxZ) < 0.85) {
              b.active = false;
              scene.remove(b.group);
              spawnExplosion(b.pos, b.colorHex, 18);
            }
          });
        } else if (bossEntity.active) {
          // If only boss remains, deal 5 tactical damage to boss
          bossEntity.hp = Math.max(1, bossEntity.hp - 5);
          spawnExplosion(bossEntity.pos, 0xf59e0b, 35);
        }
      }

      setHudState((prev) => ({
        ...prev,
        score: currentScore,
        assistsRemaining,
        assistsUsed,
        activePowerUps: { ...activeTimers },
        bossHp: bossEntity.active ? bossEntity.hp : 0,
        blocksRemaining: blocks.filter((b) => b.active).length,
        lastPenaltyAmount: penalty,
      }));
      checkVictoryCondition();
    };

    function maybeSpawnPowerUp(origin: THREE.Vector3) {
      if (Math.random() > 0.27) return;
      const types: PowerUpType[] = ['MULTI_BALL', 'LASER_PODS', 'BOTTOM_SHIELD', 'SLOW_MO'];
      const chosen = types[Math.floor(Math.random() * types.length)];
      const capGroup = createPowerUpCapsule(chosen);
      capGroup.position.set(origin.x, 0.45, origin.z);
      scene.add(capGroup);

      powerUps.push({
        group: capGroup,
        type: chosen,
        pos: new THREE.Vector3(origin.x, 0.45, origin.z),
        active: true,
      });
    }

    function checkVictoryCondition() {
      const remainingBlocks = blocks.filter((b) => b.active).length;
      const bossAlive = bossEntity.active && bossEntity.hp > 0;

      if (remainingBlocks === 0 && !bossAlive) {
        cyberAudio.playLevelWin();
        const cfg = LEVELS_CONFIG[currentLevel - 1];
        let stars = 1;
        if (currentScore >= cfg.targetScore3Stars && currentLives >= 2) {
          stars = 3;
        } else if (currentScore >= cfg.targetScore3Stars * 0.65 || currentLives >= 2) {
          stars = 2;
        }
        starsPerLevel[currentLevel - 1] = stars;

        if (currentLevel >= 10) {
          setHudState((prev) => ({
            ...prev,
            phase: 'VICTORY',
            starsPerLevel: [...starsPerLevel],
            lastLevelStars: stars,
          }));
          onGameEnd(true, currentScore, currentLevel, [...starsPerLevel], assistsUsed);
        } else {
          setHudState((prev) => ({
            ...prev,
            phase: 'LEVEL_COMPLETE',
            starsPerLevel: [...starsPerLevel],
            lastLevelStars: stars,
          }));
          onLevelComplete(currentLevel, currentScore, currentLives, stars);
        }
      }
    }

    function damageBlock(blk: BlockEntity, hitForce: number = 1) {
      if (!blk.active) return;
      blk.hp -= hitForce;
      if (blk.hp > 0) {
        cyberAudio.playArmorHit();
        spawnExplosion(blk.pos, 0x94a3b8, 8);
        return;
      }

      blk.active = false;
      scene.remove(blk.group);
      currentCombo += 1;
      if (currentCombo > maxCombo) maxCombo = currentCombo;

      const comboMultiplier = 1 + Math.min(currentCombo, 10) * 0.1;
      currentScore += Math.round(blk.points * comboMultiplier);

      cyberAudio.playBlockDestroy(currentCombo, blk.type === 'EXPLOSIVE');
      spawnExplosion(blk.pos, blk.colorHex, blk.type === 'EXPLOSIVE' ? 34 : 20);
      maybeSpawnPowerUp(blk.pos);

      // Explosive blocks detonate adjacent blocks
      if (blk.type === 'EXPLOSIVE') {
        blocks.forEach((other) => {
          if (other.active && other.id !== blk.id && other.pos.distanceTo(blk.pos) < 3.1) {
            damageBlock(other, 2);
          }
        });
      }
    }

    // 9. Input Listeners (Mouse, Touch, Keyboard)
    function updatePointerTarget(clientX: number, clientY: number) {
      const rect = renderer.domElement.getBoundingClientRect();
      _pointerNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      _pointerNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      const activeCam = hudStateRef.current.cameraMode === 'ISOMETRIC' ? orthoCamera : perspCamera;
      _raycaster.setFromCamera(_pointerNDC, activeCam);
      if (_raycaster.ray.intersectPlane(_playPlane, _planeIntersect)) {
        paddleTargetX = THREE.MathUtils.clamp(
          _planeIntersect.x,
          -ARENA_HALF_WIDTH + 2.2,
          ARENA_HALF_WIDTH - 2.2
        );
      }
    }

    const onPointerMove = (e: PointerEvent) => {
      if (hudStateRef.current.phase === 'PLAYING') {
        updatePointerTarget(e.clientX, e.clientY);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (hudStateRef.current.phase === 'PLAYING' && e.touches.length > 0) {
        updatePointerTarget(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      keysPressed[e.code] = true;
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysPressed[e.code] = false;
    };

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = Math.max(1, container.clientHeight);
      const newAspect = w / h;

      perspCamera.aspect = newAspect;
      perspCamera.updateProjectionMatrix();

      orthoCamera.left = (-frustumSize * newAspect) / 2;
      orthoCamera.right = (frustumSize * newAspect) / 2;
      orthoCamera.top = frustumSize / 2;
      orthoCamera.bottom = -frustumSize / 2;
      orthoCamera.updateProjectionMatrix();

      renderer.setSize(w, h);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onResize);

    // Pre-compile shaders
    renderer.compile(scene, perspCamera);

    // 10. Main 60FPS Game & Physics Loop
    const clock = new THREE.Clock();
    let animFrameId = 0;
    let hudSyncAccumulator = 0;

    function animate() {
      animFrameId = requestAnimationFrame(animate);
      const rawDelta = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.getElapsedTime();
      const phase = hudStateRef.current.phase;

      // Update particles in all phases for visual polish
      let activeParticleCount = 0;
      for (let i = 0; i < MAX_PARTICLES; i++) {
        const p = particles[i];
        if (p.life > 0) {
          p.life -= rawDelta;
          p.vel.y -= 14.0 * rawDelta; // gravity
          p.pos.addScaledVector(p.vel, rawDelta);
          if (p.pos.y < 0.05) {
            p.pos.y = 0.05;
            p.vel.y *= -0.45;
          }
          const ratio = Math.max(0, p.life / p.maxLife);
          _dummyObj.position.copy(p.pos);
          _dummyObj.rotation.set(elapsed * 4 + i, elapsed * 3, 0);
          _dummyObj.scale.setScalar(p.scale * ratio);
          _dummyObj.updateMatrix();
          particleInstanced.setMatrixAt(i, _dummyObj.matrix);
          activeParticleCount++;
        } else {
          _dummyObj.position.set(0, -100, 0);
          _dummyObj.scale.setScalar(0);
          _dummyObj.updateMatrix();
          particleInstanced.setMatrixAt(i, _dummyObj.matrix);
        }
      }
      if (activeParticleCount > 0) {
        particleInstanced.instanceMatrix.needsUpdate = true;
      }

      if (phase === 'PLAYING') {
        const speedFactor = activeTimers.slowMo > 0 ? 0.55 : 1.0;
        const dt = rawDelta * speedFactor;

        // Keyboard paddle movement
        const keySpeed = 24.0;
        if (keysPressed['ArrowLeft'] || keysPressed['KeyA']) {
          paddleTargetX -= keySpeed * rawDelta;
        }
        if (keysPressed['ArrowRight'] || keysPressed['KeyD']) {
          paddleTargetX += keySpeed * rawDelta;
        }
        paddleTargetX = THREE.MathUtils.clamp(
          paddleTargetX,
          -ARENA_HALF_WIDTH + 2.2,
          ARENA_HALF_WIDTH - 2.2
        );

        // Smooth exponential damping on paddle X and bank tilt
        const prevPaddleX = paddleCurrentX;
        paddleCurrentX = THREE.MathUtils.damp(paddleCurrentX, paddleTargetX, 18, rawDelta);
        const lateralVel = (paddleCurrentX - prevPaddleX) / Math.max(0.001, rawDelta);
        paddleObj.group.position.x = paddleCurrentX;
        paddleObj.group.rotation.z = THREE.MathUtils.clamp(-lateralVel * 0.012, -0.22, 0.22);

        // Power-up timers countdown
        if (activeTimers.laserPods > 0) {
          activeTimers.laserPods = Math.max(0, activeTimers.laserPods - rawDelta);
          paddleObj.laserCannonLeft.visible = true;
          paddleObj.laserCannonRight.visible = true;

          laserFireTimer -= rawDelta;
          if (laserFireTimer <= 0) {
            laserFireTimer = 0.34;
            cyberAudio.playLaserFire();
            [-1.55, 1.55].forEach((offsetX) => {
              const boltGeo = new THREE.BoxGeometry(0.14, 0.14, 0.9);
              const boltMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
              const boltMesh = new THREE.Mesh(boltGeo, boltMat);
              const startPos = new THREE.Vector3(paddleCurrentX + offsetX, 0.4, PADDLE_Z - 0.8);
              boltMesh.position.copy(startPos);
              scene.add(boltMesh);
              projectiles.push({
                mesh: boltMesh,
                pos: startPos,
                vel: new THREE.Vector3(0, 0, -28),
                fromPlayer: true,
                active: true,
              });
            });
          }
        } else {
          paddleObj.laserCannonLeft.visible = false;
          paddleObj.laserCannonRight.visible = false;
        }

        if (activeTimers.bottomShield > 0) {
          activeTimers.bottomShield = Math.max(0, activeTimers.bottomShield - rawDelta);
          bottomShieldMesh.visible = true;
        } else {
          bottomShieldMesh.visible = false;
        }

        if (activeTimers.slowMo > 0) {
          activeTimers.slowMo = Math.max(0, activeTimers.slowMo - rawDelta);
        }

        // Update moving Drones
        blocks.forEach((b) => {
          if (b.active && b.type === 'DRONE') {
            b.pos.x = b.baseX + Math.sin(elapsed * 2.2 + b.phaseOffset) * 2.6;
            b.pos.x = THREE.MathUtils.clamp(b.pos.x, -ARENA_HALF_WIDTH + 1.4, ARENA_HALF_WIDTH - 1.4);
            b.group.position.x = b.pos.x;
          }
        });

        // Update Boss Fortress (Levels 5 & 10)
        if (bossEntity.active && bossEntity.group && bossEntity.shieldOrbitGroup) {
          bossEntity.pos.x = Math.sin(elapsed * 1.15) * 5.2;
          bossEntity.group.position.x = bossEntity.pos.x;
          bossEntity.shieldOrbitGroup.rotation.y += dt * 1.85;
          if (bossEntity.coreMesh) {
            bossEntity.coreMesh.rotation.y += dt * 2.5;
            bossEntity.coreMesh.rotation.x += dt * 1.5;
          }

          bossEntity.fireCooldown -= dt;
          if (bossEntity.fireCooldown <= 0) {
            bossEntity.fireCooldown = bossEntity.fireInterval;
            cyberAudio.playLaserFire();
            const offsets = currentLevel >= 10 ? [-1.6, 1.6] : [0];
            offsets.forEach((ox) => {
              const orbGeo = new THREE.SphereGeometry(0.32, 12, 12);
              const orbMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
              const orbMesh = new THREE.Mesh(orbGeo, orbMat);
              const spawnPos = new THREE.Vector3(bossEntity.pos.x + ox, 0.45, bossEntity.pos.z + 1.5);
              orbMesh.position.copy(spawnPos);
              scene.add(orbMesh);

              // Aim slightly toward player paddle
              const toPlayer = new THREE.Vector3(
                paddleCurrentX - spawnPos.x,
                0,
                PADDLE_Z - spawnPos.z
              )
                .normalize()
                .multiplyScalar(13.5);

              projectiles.push({
                mesh: orbMesh,
                pos: spawnPos,
                vel: toPlayer,
                fromPlayer: false,
                active: true,
              });
            });
          }
        }

        // Update Projectiles (Player Lasers & Boss Plasma Orbs)
        projectiles.forEach((pr) => {
          if (!pr.active) return;
          pr.pos.addScaledVector(pr.vel, dt);
          pr.mesh.position.copy(pr.pos);

          if (pr.pos.z < ARENA_TOP_Z || pr.pos.z > ARENA_BOTTOM_Z) {
            pr.active = false;
            scene.remove(pr.mesh);
            return;
          }

          if (pr.fromPlayer) {
            // Check hit against blocks
            for (let i = 0; i < blocks.length; i++) {
              const b = blocks[i];
              if (
                b.active &&
                Math.abs(pr.pos.x - b.pos.x) < b.width * 0.55 &&
                Math.abs(pr.pos.z - b.pos.z) < b.depth * 0.65
              ) {
                pr.active = false;
                scene.remove(pr.mesh);
                damageBlock(b, 1);
                checkVictoryCondition();
                break;
              }
            }
            // Check hit against Boss
            if (
              pr.active &&
              bossEntity.active &&
              Math.abs(pr.pos.x - bossEntity.pos.x) < 2.2 &&
              Math.abs(pr.pos.z - bossEntity.pos.z) < 1.8
            ) {
              pr.active = false;
              scene.remove(pr.mesh);
              bossEntity.hp -= 1;
              currentScore += 150;
              spawnExplosion(pr.pos, 0xf59e0b, 12);
              if (bossEntity.hp <= 0) {
                bossEntity.active = false;
                if (bossEntity.group) scene.remove(bossEntity.group);
                currentScore += 2500;
                spawnExplosion(bossEntity.pos, 0xf43f5e, 65);
              }
              checkVictoryCondition();
            }
          } else {
            // Enemy projectile hitting player paddle
            if (
              Math.abs(pr.pos.z - PADDLE_Z) < 0.65 &&
              Math.abs(pr.pos.x - paddleCurrentX) < 2.15
            ) {
              pr.active = false;
              scene.remove(pr.mesh);
              if (activeTimers.bottomShield > 0) {
                cyberAudio.playArmorHit();
                spawnExplosion(pr.pos, 0x10b981, 18);
              } else {
                cyberAudio.playLifeLost();
                spawnExplosion(paddleObj.group.position, 0xf43f5e, 30);
                currentLives -= 1;
                currentCombo = 0;
                if (currentLives <= 0) {
                  setHudState((prev) => ({ ...prev, lives: 0, phase: 'GAME_OVER' }));
                  onGameEnd(false, currentScore, currentLevel, [...starsPerLevel], assistsUsed);
                }
              }
            }
          }
        });

        // Update Power-Up Capsules
        powerUps.forEach((pu) => {
          if (!pu.active) return;
          pu.pos.z += 7.5 * rawDelta;
          pu.group.position.copy(pu.pos);
          pu.group.rotation.y += 3.2 * rawDelta;
          pu.group.rotation.x += 1.8 * rawDelta;

          if (
            Math.abs(pu.pos.z - PADDLE_Z) < 0.85 &&
            Math.abs(pu.pos.x - paddleCurrentX) < 2.35
          ) {
            pu.active = false;
            scene.remove(pu.group);
            cyberAudio.playPowerUp();
            currentScore += 250;
            spawnExplosion(pu.pos, 0x38bdf8, 16);

            if (pu.type === 'MULTI_BALL') {
              const refBall = balls.find((b) => b.active);
              const origin = refBall
                ? refBall.pos.clone()
                : new THREE.Vector3(paddleCurrentX, 0.35, PADDLE_Z - 1.0);
              spawnBall(origin, -0.65, -1);
              spawnBall(origin, 0.65, -1);
            } else if (pu.type === 'LASER_PODS') {
              activeTimers.laserPods = 12.0;
            } else if (pu.type === 'BOTTOM_SHIELD') {
              activeTimers.bottomShield = 14.0;
            } else if (pu.type === 'SLOW_MO') {
              activeTimers.slowMo = 10.0;
            }
          } else if (pu.pos.z > ARENA_BOTTOM_Z) {
            pu.active = false;
            scene.remove(pu.group);
          }
        });

        // Update Plasma Balls with sub-stepping for precision collision
        const subSteps = 3;
        const stepDt = dt / subSteps;

        balls.forEach((ball) => {
          if (!ball.active) return;

          for (let s = 0; s < subSteps; s++) {
            ball.pos.addScaledVector(ball.vel, stepDt);

            // Left / Right Arena Walls
            if (ball.pos.x < -ARENA_HALF_WIDTH + 0.4) {
              ball.pos.x = -ARENA_HALF_WIDTH + 0.4;
              ball.vel.x = Math.abs(ball.vel.x);
              cyberAudio.playWallBounce();
            } else if (ball.pos.x > ARENA_HALF_WIDTH - 0.4) {
              ball.pos.x = ARENA_HALF_WIDTH - 0.4;
              ball.vel.x = -Math.abs(ball.vel.x);
              cyberAudio.playWallBounce();
            }

            // Top Arena Wall
            if (ball.pos.z < ARENA_TOP_Z + 0.4) {
              ball.pos.z = ARENA_TOP_Z + 0.4;
              ball.vel.z = Math.abs(ball.vel.z);
              cyberAudio.playWallBounce();
            }

            // Bottom Shield Barrier
            if (
              activeTimers.bottomShield > 0 &&
              ball.vel.z > 0 &&
              ball.pos.z > PADDLE_Z + 1.0 &&
              ball.pos.z < PADDLE_Z + 1.7
            ) {
              ball.pos.z = PADDLE_Z + 1.0;
              ball.vel.z = -Math.abs(ball.vel.z);
              cyberAudio.playPaddleHit(0);
              spawnExplosion(ball.pos, 0x10b981, 12);
            }

            // Player Paddle Bounce with Directional Angle Physics
            if (
              ball.vel.z > 0 &&
              ball.pos.z >= PADDLE_Z - 0.65 &&
              ball.pos.z <= PADDLE_Z + 0.55 &&
              Math.abs(ball.pos.x - paddleCurrentX) <= 2.35
            ) {
              const hitOffset = THREE.MathUtils.clamp((ball.pos.x - paddleCurrentX) / 2.2, -1, 1);
              const speed = ball.vel.length();
              const bounceAngle = hitOffset * (Math.PI * 0.36); // Max ~65 deg deflection
              ball.vel.x = Math.sin(bounceAngle) * speed;
              ball.vel.z = -Math.cos(bounceAngle) * speed;
              ball.pos.z = PADDLE_Z - 0.66;
              currentCombo = 0;

              cyberAudio.playPaddleHit(hitOffset);
              spawnExplosion(ball.pos, 0x06b6d4, 10);
            }

            // Block & Drone Collisions
            for (let i = 0; i < blocks.length; i++) {
              const blk = blocks[i];
              if (!blk.active) continue;

              const halfW = blk.width * 0.5 + 0.32;
              const halfD = blk.depth * 0.5 + 0.32;
              const dx = ball.pos.x - blk.pos.x;
              const dz = ball.pos.z - blk.pos.z;

              if (Math.abs(dx) < halfW && Math.abs(dz) < halfD) {
                const overlapX = halfW - Math.abs(dx);
                const overlapZ = halfD - Math.abs(dz);

                if (overlapX < overlapZ) {
                  ball.vel.x = dx > 0 ? Math.abs(ball.vel.x) : -Math.abs(ball.vel.x);
                } else {
                  ball.vel.z = dz > 0 ? Math.abs(ball.vel.z) : -Math.abs(ball.vel.z);
                }

                damageBlock(blk, 1);
                checkVictoryCondition();
                break;
              }
            }

            // Boss Fortress & Rotating Shield Collisions
            if (bossEntity.active && bossEntity.group) {
              // 1. Check rotating shields first
              for (let shIdx = 0; shIdx < bossEntity.shieldMeshes.length; shIdx++) {
                const shMesh = bossEntity.shieldMeshes[shIdx];
                shMesh.getWorldPosition(_tempVec3);
                if (ball.pos.distanceTo(_tempVec3) < 1.05) {
                  const reflectNormal = ball.pos.clone().sub(_tempVec3).setY(0).normalize();
                  const spd = ball.vel.length();
                  ball.vel.copy(reflectNormal.multiplyScalar(spd));
                  cyberAudio.playArmorHit();
                  spawnExplosion(ball.pos, 0x06b6d4, 10);
                  break;
                }
              }

              // 2. Check Boss Central Core
              if (ball.pos.distanceTo(bossEntity.pos) < 2.15) {
                const normal = ball.pos.clone().sub(bossEntity.pos).setY(0).normalize();
                const spd = ball.vel.length();
                ball.vel.copy(normal.multiplyScalar(spd));
                bossEntity.hp -= 1;
                currentCombo += 1;
                currentScore += 300;
                cyberAudio.playBlockDestroy(currentCombo, true);
                spawnExplosion(ball.pos, 0xf59e0b, 24);

                if (bossEntity.hp <= 0) {
                  bossEntity.active = false;
                  scene.remove(bossEntity.group);
                  currentScore += 3000;
                  spawnExplosion(bossEntity.pos, 0xf43f5e, 75);
                }
                checkVictoryCondition();
              }
            }
          }

          ball.group.position.copy(ball.pos);
          ball.group.rotation.y += 4.0 * dt;

          // Ball Lost Out of Bounds
          if (ball.pos.z > ARENA_BOTTOM_Z) {
            ball.active = false;
            scene.remove(ball.group);
          }
        });

        // Check if all balls were lost
        const activeBalls = balls.filter((b) => b.active);
        if (activeBalls.length === 0 && hudStateRef.current.phase === 'PLAYING') {
          currentLives -= 1;
          currentCombo = 0;
          cyberAudio.playLifeLost();

          if (currentLives <= 0) {
            setHudState((prev) => ({
              ...prev,
              lives: 0,
              phase: 'GAME_OVER',
            }));
            onGameEnd(false, currentScore, currentLevel, [...starsPerLevel], assistsUsed);
          } else {
            spawnBall(new THREE.Vector3(paddleCurrentX, 0.35, PADDLE_Z - 1.1), (Math.random() - 0.5) * 0.5, -1);
          }
        }

        // Sync HUD every ~80ms to avoid React re-render overhead
        hudSyncAccumulator += rawDelta;
        if (hudSyncAccumulator >= 0.08) {
          hudSyncAccumulator = 0;
          setHudState((prev) => ({
            ...prev,
            score: currentScore,
            lives: currentLives,
            combo: currentCombo,
            maxCombo,
            activePowerUps: { ...activeTimers },
            bossHp: bossEntity.active ? bossEntity.hp : 0,
            blocksRemaining: blocks.filter((b) => b.active).length,
          }));
        }
      }

      // Dynamic camera follow on perspective camera
      const activeCam = hudStateRef.current.cameraMode === 'ISOMETRIC' ? orthoCamera : perspCamera;
      if (activeCam === perspCamera) {
        perspCamera.position.x = THREE.MathUtils.damp(
          perspCamera.position.x,
          paddleCurrentX * 0.22,
          5,
          rawDelta
        );
        perspCamera.lookAt(paddleCurrentX * 0.08, 0, 0.5);
      }

      renderer.render(scene, activeCam);
    }

    // Build background preview scene on initial mount
    buildLevel(1, true);
    setHudState((prev) => ({ ...prev, phase: 'START_MENU' }));
    animate();

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 w-full h-full z-0 cursor-ew-resize"
      aria-label="Cyber-Neon Breakout 3D Arena"
    />
  );
};
