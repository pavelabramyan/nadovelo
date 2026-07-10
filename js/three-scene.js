import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

const hero = document.querySelector('[data-three-hero]');
const canvas = document.getElementById('three-canvas');
const container = canvas?.closest('.hero-bg');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const saveData = navigator.connection?.saveData === true;
const veryLowPower = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2)
  || (navigator.deviceMemory && navigator.deviceMemory <= 2);

if (!hero || !canvas || !container || reduceMotion || saveData || veryLowPower) {
  useFallback();
} else {
  try {
    initEnergyRoute();
  } catch (error) {
    console.warn('Three.js scene unavailable, using visual fallback.', error);
    useFallback();
  }
}

function useFallback() {
  if (canvas) canvas.style.display = 'none';
  if (container) container.classList.add('hero-bg--fallback');
  document.body.classList.remove('three-ready');
}

function initEnergyRoute() {
  const isMobile = window.innerWidth < 768;
  const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  canvas.style.removeProperty('display');
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: !isMobile,
    powerPreference: 'high-performance'
  });

  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.2 : 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x07130f, isMobile ? 0.075 : 0.055);

  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 40);
  camera.position.set(0, 0, isMobile ? 10 : 8);

  const routeRoot = new THREE.Group();
  const orbitRoot = new THREE.Group();
  scene.add(routeRoot, orbitRoot);

  const glowTexture = createGlowTexture();
  const routeColors = [0xb8f34a, 0x12c7a0, 0x33d6d1];
  const routeDefinitions = [
    [
      [-2.8, -2.4, -0.8],
      [-1.8, -1.2, 0.3],
      [-0.2, -0.55, -0.1],
      [0.7, 0.55, 0.25],
      [1.9, 1.15, -0.35],
      [3.15, 2.45, -0.8]
    ],
    [
      [-1.9, 2.7, -1.35],
      [-0.7, 1.65, -0.2],
      [0.9, 1.5, 0.2],
      [2.15, 0.45, -0.25],
      [1.75, -1.0, 0.1],
      [3.4, -2.15, -1.05]
    ],
    [
      [-0.8, -2.8, -1.8],
      [0.25, -1.75, -0.4],
      [0.05, -0.1, 0.45],
      [1.35, 0.9, -0.25],
      [3.45, 0.2, -1.45]
    ]
  ];

  const routes = routeDefinitions.map((definition, index) => {
    const curve = new THREE.CatmullRomCurve3(
      definition.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
      false,
      'catmullrom',
      0.45
    );
    const segments = isMobile ? 72 : 120;
    const glowGeometry = new THREE.TubeGeometry(curve, segments, 0.036, 5, false);
    const coreGeometry = new THREE.TubeGeometry(curve, segments, 0.009, 5, false);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: routeColors[index],
      transparent: true,
      opacity: isMobile ? 0.055 : 0.075,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: routeColors[index],
      transparent: true,
      opacity: isMobile ? 0.28 : 0.42,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    routeRoot.add(
      new THREE.Mesh(glowGeometry, glowMaterial),
      new THREE.Mesh(coreGeometry, coreMaterial)
    );
    addRouteNodes(curve, routeColors[index], routeRoot, glowTexture);
    return curve;
  });

  const pulses = [];
  routes.forEach((curve, routeIndex) => {
    const pulseCount = isMobile ? 1 : 2;
    for (let index = 0; index < pulseCount; index += 1) {
      const pulse = createPulse(routeColors[routeIndex], glowTexture, isMobile);
      routeRoot.add(pulse);
      pulses.push({
        mesh: pulse,
        curve,
        phase: (index / pulseCount) + routeIndex * 0.19,
        speed: 0.055 + routeIndex * 0.012 + index * 0.008
      });
    }
  });

  const rings = createOrbitRings(orbitRoot, isMobile);
  const particles = createDepthParticles(routeRoot, isMobile);
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  let scrollTarget = 0;
  let scrollProgress = 0;
  let elapsed = 0;
  let lastFrame = performance.now();
  let rafId = 0;
  let running = false;
  let inViewport = true;
  const minFrameTime = isMobile ? 1000 / 30 : 0;

  function resize() {
    const rect = container.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;

    const mobileNow = rect.width < 768;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobileNow ? 1.2 : 1.5));
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / rect.height;
    camera.position.z = mobileNow ? 10 : 8;
    camera.updateProjectionMatrix();

    const sceneScale = mobileNow ? 0.64 : Math.min(1.08, 0.88 + rect.width / 8000);
    routeRoot.scale.setScalar(sceneScale);
    orbitRoot.scale.setScalar(sceneScale);
    routeRoot.position.x = mobileNow ? 0.25 : 1.75;
    orbitRoot.position.x = mobileNow ? 0.35 : 2.35;
    orbitRoot.position.y = mobileNow ? -0.35 : -0.1;
  }

  function updateScrollProgress() {
    const rect = hero.getBoundingClientRect();
    scrollTarget = THREE.MathUtils.clamp(-rect.top / Math.max(rect.height, 1), 0, 1);
  }

  function renderFrame(now) {
    if (!running) return;
    rafId = requestAnimationFrame(renderFrame);

    const deltaMs = Math.min(now - lastFrame, 80);
    if (minFrameTime && deltaMs < minFrameTime) return;
    lastFrame = now;
    elapsed += deltaMs / 1000;

    pointer.x += (pointer.targetX - pointer.x) * 0.045;
    pointer.y += (pointer.targetY - pointer.y) * 0.045;
    scrollProgress += (scrollTarget - scrollProgress) * 0.055;

    camera.position.x = pointer.x * (isMobile ? 0.08 : 0.22);
    camera.position.y = -pointer.y * (isMobile ? 0.05 : 0.14) - scrollProgress * 0.16;
    camera.lookAt(0, 0, 0);

    routeRoot.rotation.y = pointer.x * 0.065 + Math.sin(elapsed * 0.16) * 0.018;
    routeRoot.rotation.x = -pointer.y * 0.025;
    routeRoot.position.y = -scrollProgress * 0.42;
    orbitRoot.rotation.y = pointer.x * 0.08;
    orbitRoot.position.y = (isMobile ? -0.35 : -0.1) - scrollProgress * 0.25;

    pulses.forEach(({ mesh, curve, phase, speed }) => {
      const routePosition = (phase + elapsed * speed) % 1;
      const safePosition = Number.isFinite(routePosition)
        ? THREE.MathUtils.clamp(routePosition, 0.0001, 0.9999)
        : 0.0001;
      curve.getPoint(safePosition, mesh.position);
      const breathe = 0.9 + Math.sin(elapsed * 4 + phase * 8) * 0.14;
      mesh.scale.setScalar(breathe);
    });

    rings.forEach(({ mesh, xSpeed, ySpeed, zSpeed, phase }) => {
      mesh.rotation.x += xSpeed * deltaMs;
      mesh.rotation.y += ySpeed * deltaMs;
      mesh.rotation.z += zSpeed * deltaMs;
      mesh.position.y += Math.sin(elapsed * 0.6 + phase) * 0.00025 * deltaMs;
    });

    particles.rotation.y = elapsed * 0.012;
    particles.rotation.z = Math.sin(elapsed * 0.12) * 0.025;

    renderer.render(scene, camera);
  }

  function syncLoop() {
    const shouldRun = inViewport && !document.hidden;
    if (shouldRun && !running) {
      running = true;
      lastFrame = performance.now();
      rafId = requestAnimationFrame(renderFrame);
    } else if (!shouldRun && running) {
      running = false;
      cancelAnimationFrame(rafId);
    }
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);

  const visibilityObserver = new IntersectionObserver(([entry]) => {
    inViewport = entry.isIntersecting;
    syncLoop();
  }, { rootMargin: '120px 0px', threshold: 0.01 });
  visibilityObserver.observe(hero);

  if (hasFinePointer) {
    hero.addEventListener('pointermove', (event) => {
      const rect = hero.getBoundingClientRect();
      pointer.targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      pointer.targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    }, { passive: true });
    hero.addEventListener('pointerleave', () => {
      pointer.targetX = 0;
      pointer.targetY = 0;
    }, { passive: true });
  }

  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  document.addEventListener('visibilitychange', syncLoop);
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    running = false;
    cancelAnimationFrame(rafId);
    useFallback();
  }, { once: true });

  resize();
  updateScrollProgress();
  renderer.render(scene, camera);
  container.classList.remove('hero-bg--fallback');
  document.body.classList.add('three-ready');
  syncLoop();
}

function createGlowTexture() {
  const size = 128;
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = size;
  textureCanvas.height = size;
  const context = textureCanvas.getContext('2d');
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.12, 'rgba(255,255,255,.88)');
  gradient.addColorStop(0.42, 'rgba(255,255,255,.2)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createPulse(color, glowTexture, isMobile) {
  const group = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(isMobile ? 0.045 : 0.055, 10, 10),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  );
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture,
    color,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }));
  glow.scale.setScalar(isMobile ? 0.46 : 0.62);
  group.add(core, glow);
  return group;
}

function addRouteNodes(curve, color, parent, glowTexture) {
  [0.04, 0.49, 0.96].forEach((position, index) => {
    const node = new THREE.Group();
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.095 + index * 0.012, 0.009, 6, 28),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    );
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTexture,
      color,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    glow.scale.setScalar(0.42);
    node.add(ring, glow);
    curve.getPointAt(position, node.position);
    node.rotation.x = Math.PI * (0.25 + index * 0.12);
    parent.add(node);
  });
}

function createOrbitRings(parent, isMobile) {
  const configs = [
    { radius: 1.12, color: 0xb8f34a, opacity: 0.14, tilt: [1.08, 0.12, 0.25] },
    { radius: 1.58, color: 0x12c7a0, opacity: 0.1, tilt: [0.72, -0.2, -0.45] },
    { radius: 2.05, color: 0x33d6d1, opacity: 0.075, tilt: [1.25, 0.34, 0.18] }
  ];

  return configs.map((config, index) => {
    const mesh = new THREE.Mesh(
      new THREE.TorusGeometry(config.radius, isMobile ? 0.007 : 0.009, 5, isMobile ? 56 : 88),
      new THREE.MeshBasicMaterial({
        color: config.color,
        transparent: true,
        opacity: config.opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    );
    mesh.rotation.set(...config.tilt);
    mesh.position.z = -1.1 - index * 0.3;
    parent.add(mesh);
    return {
      mesh,
      xSpeed: 0.000025 * (index + 1),
      ySpeed: 0.00004 * (index % 2 ? -1 : 1),
      zSpeed: 0.00002 * (index + 1),
      phase: index * 1.7
    };
  });
}

function createDepthParticles(parent, isMobile) {
  const count = isMobile ? 90 : 260;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const lime = new THREE.Color(0xb8f34a);
  const cyan = new THREE.Color(0x33d6d1);

  for (let index = 0; index < count; index += 1) {
    const offset = index * 3;
    positions[offset] = (Math.random() - 0.5) * 13;
    positions[offset + 1] = (Math.random() - 0.5) * 8;
    positions[offset + 2] = (Math.random() - 0.5) * 6 - 0.5;
    const color = lime.clone().lerp(cyan, Math.random());
    colors[offset] = color.r;
    colors[offset + 1] = color.g;
    colors[offset + 2] = color.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({
    size: isMobile ? 0.022 : 0.03,
    transparent: true,
    opacity: isMobile ? 0.28 : 0.4,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    sizeAttenuation: true
  });
  const particles = new THREE.Points(geometry, material);
  parent.add(particles);
  return particles;
}
