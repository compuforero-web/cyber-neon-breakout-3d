import * as THREE from 'three';
import { BlockType, PowerUpType } from '../types/game';

// Create procedural cyberpunk grid texture for the arena floor
export function createArenaFloorTexture(renderer: THREE.WebGLRenderer): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Deep obsidian background
  ctx.fillStyle = '#060914';
  ctx.fillRect(0, 0, 1024, 1024);

  // Subtle sub-grid
  ctx.strokeStyle = 'rgba(14, 165, 233, 0.08)';
  ctx.lineWidth = 2;
  const subStep = 32;
  for (let i = 0; i <= 1024; i += subStep) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 1024);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(1024, i);
    ctx.stroke();
  }

  // Primary tactical grid lines
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.24)';
  ctx.lineWidth = 3;
  const mainStep = 128;
  for (let i = 0; i <= 1024; i += mainStep) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 1024);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(1024, i);
    ctx.stroke();
  }

  // Crosshair accents at intersections
  ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
  for (let x = 0; x <= 1024; x += mainStep) {
    for (let y = 0; y <= 1024; y += mainStep) {
      ctx.fillRect(x - 4, y - 4, 8, 8);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 4);
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

// Create composite multi-part Player Magnetic Paddle (7 distinct parts)
export function createPlayerPaddleGroup(): {
  group: THREE.Group;
  laserCannonLeft: THREE.Mesh;
  laserCannonRight: THREE.Mesh;
  coreGlowMesh: THREE.Mesh;
} {
  const group = new THREE.Group();

  // 1. Primary hull chassis (beveled metallic body)
  const hullGeo = new THREE.BoxGeometry(3.5, 0.48, 0.85);
  const hullMat = new THREE.MeshPhysicalMaterial({
    color: 0x0f172a,
    metalness: 0.9,
    roughness: 0.2,
    clearcoat: 0.8,
  });
  const hullMesh = new THREE.Mesh(hullGeo, hullMat);
  hullMesh.position.y = 0.24;
  hullMesh.castShadow = true;
  hullMesh.receiveShadow = true;
  group.add(hullMesh);

  // 2. Central glowing plasma core bar
  const coreGeo = new THREE.BoxGeometry(2.5, 0.24, 0.92);
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    emissive: 0x06b6d4,
    emissiveIntensity: 1.8,
    roughness: 0.15,
    metalness: 0.3,
  });
  const coreGlowMesh = new THREE.Mesh(coreGeo, coreMat);
  coreGlowMesh.position.set(0, 0.28, 0.02);
  group.add(coreGlowMesh);

  // 3 & 4. Left and Right angled magnetic stabilizer wings
  const wingGeo = new THREE.BoxGeometry(0.65, 0.56, 1.05);
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.85,
    roughness: 0.35,
  });

  const leftWing = new THREE.Mesh(wingGeo, wingMat);
  leftWing.position.set(-1.85, 0.28, 0);
  leftWing.rotation.y = 0.15;
  leftWing.castShadow = true;
  group.add(leftWing);

  const rightWing = new THREE.Mesh(wingGeo, wingMat);
  rightWing.position.set(1.85, 0.28, 0);
  rightWing.rotation.y = -0.15;
  rightWing.castShadow = true;
  group.add(rightWing);

  // 5 & 6. Wing neon bumper trim caps
  const trimGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.6, 16);
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 1.4,
    roughness: 0.2,
  });

  const leftTrim = new THREE.Mesh(trimGeo, trimMat);
  leftTrim.position.set(-2.18, 0.28, 0);
  group.add(leftTrim);

  const rightTrim = new THREE.Mesh(trimGeo, trimMat);
  rightTrim.position.set(2.18, 0.28, 0);
  group.add(rightTrim);

  // 7 & 8. Retractable Dual Laser Cannons (visible when LASER_PODS power-up is active)
  const cannonGeo = new THREE.CylinderGeometry(0.1, 0.16, 0.85, 12);
  cannonGeo.rotateX(Math.PI / 2);
  const cannonMat = new THREE.MeshStandardMaterial({
    color: 0xf43f5e,
    emissive: 0xe11d48,
    emissiveIntensity: 1.6,
    metalness: 0.7,
    roughness: 0.25,
  });

  const laserCannonLeft = new THREE.Mesh(cannonGeo, cannonMat);
  laserCannonLeft.position.set(-1.55, 0.45, -0.45);
  laserCannonLeft.visible = false;
  group.add(laserCannonLeft);

  const laserCannonRight = new THREE.Mesh(cannonGeo, cannonMat);
  laserCannonRight.position.set(1.55, 0.45, -0.45);
  laserCannonRight.visible = false;
  group.add(laserCannonRight);

  return { group, laserCannonLeft, laserCannonRight, coreGlowMesh };
}

// Create composite Plasma Sphere Ball with inner core and outer energy shell
export function createPlasmaBallGroup(): THREE.Group {
  const group = new THREE.Group();

  const innerGeo = new THREE.SphereGeometry(0.32, 24, 24);
  const innerMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x22d3ee,
    emissiveIntensity: 2.4,
    roughness: 0.1,
  });
  const innerMesh = new THREE.Mesh(innerGeo, innerMat);
  innerMesh.castShadow = true;
  group.add(innerMesh);

  // Orbital energy ring around ball
  const ringGeo = new THREE.TorusGeometry(0.42, 0.04, 12, 28);
  ringGeo.rotateX(Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.75,
  });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.name = 'ballRing';
  group.add(ringMesh);

  return group;
}

// Create composite Quantum Block / Floating Enemy Drone (3-5 distinct parts)
export function createQuantumBlockGroup(type: BlockType, colorHex: number): THREE.Group {
  const group = new THREE.Group();

  if (type === 'DRONE') {
    // Floating enemy interceptor ship (4 parts: central fuselage, cockpit dome, 2 swept wings)
    const bodyGeo = new THREE.ConeGeometry(0.75, 1.5, 6);
    bodyGeo.rotateX(Math.PI / 2);
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e1b4b,
      metalness: 0.85,
      roughness: 0.25,
      clearcoat: 0.7,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.45;
    body.castShadow = true;
    group.add(body);

    const wingGeo = new THREE.BoxGeometry(2.1, 0.14, 0.65);
    const wingMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 0.85,
      metalness: 0.6,
      roughness: 0.3,
    });
    const wings = new THREE.Mesh(wingGeo, wingMat);
    wings.position.set(0, 0.45, 0.1);
    group.add(wings);

    const domeGeo = new THREE.SphereGeometry(0.32, 16, 12);
    const domeMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xe11d48,
      emissiveIntensity: 1.5,
      roughness: 0.1,
    });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.set(0, 0.65, 0);
    group.add(dome);

    return group;
  }

  // Standard / Armored / Explosive Quantum Block (3 parts: Metallic Outer Frame, Glowing Core, Top Cap)
  const frameGeo = new THREE.BoxGeometry(2.15, 0.75, 1.05);
  const frameMat = new THREE.MeshPhysicalMaterial({
    color: type === 'ARMORED' ? 0x334155 : 0x0f172a,
    metalness: 0.88,
    roughness: type === 'ARMORED' ? 0.18 : 0.35,
    clearcoat: 0.6,
  });
  const frameMesh = new THREE.Mesh(frameGeo, frameMat);
  frameMesh.position.y = 0.38;
  frameMesh.castShadow = true;
  frameMesh.receiveShadow = true;
  group.add(frameMesh);

  // Glowing inner neon strip
  const coreGeo = new THREE.BoxGeometry(2.22, 0.32, 1.12);
  const coreMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    emissive: colorHex,
    emissiveIntensity: type === 'EXPLOSIVE' ? 2.1 : 1.15,
    roughness: 0.2,
    metalness: 0.2,
  });
  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  coreMesh.position.y = 0.38;
  coreMesh.name = 'blockCore';
  group.add(coreMesh);

  // Top bevel plate
  const capGeo = new THREE.BoxGeometry(1.75, 0.12, 0.72);
  const capMat = new THREE.MeshStandardMaterial({
    color: type === 'ARMORED' ? 0x94a3b8 : colorHex,
    metalness: 0.75,
    roughness: 0.25,
  });
  const capMesh = new THREE.Mesh(capGeo, capMat);
  capMesh.position.y = 0.8;
  group.add(capMesh);

  return group;
}

// Create composite Boss Cruiser for Levels 5 and 10 (8+ parts including rotating shields)
export function createBossFortressGroup(level: number, shieldCount: number): {
  group: THREE.Group;
  shieldOrbitGroup: THREE.Group;
  shieldMeshes: THREE.Mesh[];
  coreMesh: THREE.Mesh;
} {
  const group = new THREE.Group();
  const isFinalBoss = level >= 10;

  // 1. Primary Armored Citadel Hull
  const hullGeo = new THREE.CylinderGeometry(isFinalBoss ? 2.4 : 1.9, isFinalBoss ? 2.0 : 1.5, 1.4, 8);
  const hullMat = new THREE.MeshPhysicalMaterial({
    color: 0x1e1b4b,
    metalness: 0.92,
    roughness: 0.2,
    clearcoat: 0.9,
  });
  const hull = new THREE.Mesh(hullGeo, hullMat);
  hull.position.y = 0.8;
  hull.castShadow = true;
  group.add(hull);

  // 2. Central Quantum Reactor Core (pulses and flashes on damage)
  const coreGeo = new THREE.OctahedronGeometry(isFinalBoss ? 1.25 : 1.0, 1);
  const coreMat = new THREE.MeshStandardMaterial({
    color: isFinalBoss ? 0xf43f5e : 0xf59e0b,
    emissive: isFinalBoss ? 0xe11d48 : 0xd97706,
    emissiveIntensity: 2.0,
    roughness: 0.15,
  });
  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  coreMesh.position.y = 1.4;
  group.add(coreMesh);

  // 3 & 4. Heavy Wing Pylons
  const wingGeo = new THREE.BoxGeometry(isFinalBoss ? 6.2 : 4.8, 0.55, 1.3);
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0x312e81,
    metalness: 0.85,
    roughness: 0.3,
  });
  const wings = new THREE.Mesh(wingGeo, wingMat);
  wings.position.y = 0.75;
  wings.castShadow = true;
  group.add(wings);

  // 5 & 6. Twin Plasma Turret Barrels
  const barrelGeo = new THREE.CylinderGeometry(0.22, 0.26, 1.4, 12);
  barrelGeo.rotateX(Math.PI / 2);
  const barrelMat = new THREE.MeshStandardMaterial({
    color: 0xf43f5e,
    emissive: 0xbe123c,
    emissiveIntensity: 1.2,
  });

  const leftBarrel = new THREE.Mesh(barrelGeo, barrelMat);
  leftBarrel.position.set(-1.6, 0.65, 1.1);
  group.add(leftBarrel);

  const rightBarrel = new THREE.Mesh(barrelGeo, barrelMat);
  rightBarrel.position.set(1.6, 0.65, 1.1);
  group.add(rightBarrel);

  // 7. Rotating Orbital Shields Group
  const shieldOrbitGroup = new THREE.Group();
  shieldOrbitGroup.position.y = 0.75;
  group.add(shieldOrbitGroup);

  const shieldMeshes: THREE.Mesh[] = [];
  const orbitRadius = isFinalBoss ? 3.5 : 2.9;

  for (let i = 0; i < shieldCount; i++) {
    const angle = (i / shieldCount) * Math.PI * 2;
    const shieldGeo = new THREE.BoxGeometry(1.55, 0.85, 0.35);
    const shieldMat = new THREE.MeshPhysicalMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 1.3,
      metalness: 0.5,
      roughness: 0.15,
      transparent: true,
      opacity: 0.88,
    });
    const shield = new THREE.Mesh(shieldGeo, shieldMat);
    shield.position.set(Math.cos(angle) * orbitRadius, 0, Math.sin(angle) * orbitRadius);
    shield.rotation.y = -angle + Math.PI / 2;
    shieldOrbitGroup.add(shield);
    shieldMeshes.push(shield);
  }

  return { group, shieldOrbitGroup, shieldMeshes, coreMesh };
}

// Create Power-Up Capsule 3D Group
export function createPowerUpCapsule(type: PowerUpType): THREE.Group {
  const group = new THREE.Group();

  const colorMap: Record<PowerUpType, number> = {
    MULTI_BALL: 0x06b6d4,    // Cyan
    LASER_PODS: 0xec4899,    // Magenta
    BOTTOM_SHIELD: 0x10b981, // Emerald
    SLOW_MO: 0xf59e0b,       // Amber
  };

  const color = colorMap[type];

  const bodyGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.9, 16);
  bodyGeo.rotateZ(Math.PI / 2);
  const bodyMat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 1.5,
    metalness: 0.6,
    roughness: 0.2,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  group.add(body);

  const ringGeo = new THREE.TorusGeometry(0.44, 0.06, 10, 20);
  ringGeo.rotateY(Math.PI / 2);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.9,
    roughness: 0.1,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  group.add(ring);

  return group;
}
