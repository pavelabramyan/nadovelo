import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = window.innerWidth < 768;

const canvas = document.getElementById('three-canvas');
const container = canvas?.closest('.hero-bg');

if (!canvas || !container || prefersReducedMotion) {
  if (canvas) canvas.style.display = 'none';
} else {
  initScene(canvas, container);
}

function initScene(canvas, container) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: !isMobile,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.25 : 1.5));

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x14b8a6, isMobile ? 0.015 : 0.01);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.z = 8;

  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

  const particleCount = isMobile ? 500 : 1200;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  const colorA = new THREE.Color('#a3e635');
  const colorB = new THREE.Color('#06b6d4');

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 24;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    const mix = Math.random();
    colors[i * 3] = colorA.r * mix + colorB.r * (1 - mix);
    colors[i * 3 + 1] = colorA.g * mix + colorB.g * (1 - mix);
    colors[i * 3 + 2] = colorA.b * mix + colorB.b * (1 - mix);
    sizes[i] = Math.random() * 1.5 + 0.4;
  }

  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  particleGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const particleMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: renderer.getPixelRatio() }
    },
    vertexShader: `
      attribute float size;
      attribute vec3 color;
      varying vec3 vColor;
      uniform float uTime;
      uniform float uPixelRatio;
      void main() {
        vColor = color;
        vec3 pos = position;
        pos.y += sin(uTime * 0.35 + position.x * 0.25) * 0.06;
        pos.x += cos(uTime * 0.3 + position.y * 0.15) * 0.04;
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = size * uPixelRatio * (280.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float alpha = smoothstep(0.5, 0.15, d);
        gl_FragColor = vec4(vColor, alpha * 0.55);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true
  });

  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  const rings = [];
  const ringColors = [0xa3e635, 0x14b8a6, 0x06b6d4];
  for (let i = 0; i < 2; i++) {
    const geo = new THREE.TorusGeometry(1.1 + i * 0.5, 0.012, 8, 48);
    const mat = new THREE.MeshBasicMaterial({
      color: ringColors[i],
      transparent: true,
      opacity: 0.18 - i * 0.04
    });
    const ring = new THREE.Mesh(geo, mat);
    ring.position.set(2.5 - i * 1.8, 0.5 - i * 0.5, -2);
    ring.rotation.x = Math.PI / 3;
    scene.add(ring);
    rings.push({ mesh: ring, speed: 0.0015 + i * 0.001 });
  }

  function resize() {
    const { width, height } = container.getBoundingClientRect();
    if (width < 1 || height < 1) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    particleMat.uniforms.uPixelRatio.value = renderer.getPixelRatio();
  }

  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(container);

  container.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    mouse.targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    mouse.targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
  }, { passive: true });

  container.addEventListener('mouseleave', () => {
    mouse.targetX = 0;
    mouse.targetY = 0;
  });

  const clock = new THREE.Clock();
  let visible = true;

  document.addEventListener('visibilitychange', () => {
    visible = !document.hidden;
  });

  function animate() {
    requestAnimationFrame(animate);
    if (!visible) return;

    const t = clock.getElapsedTime();
    particleMat.uniforms.uTime.value = t;

    mouse.x += (mouse.targetX - mouse.x) * 0.03;
    mouse.y += (mouse.targetY - mouse.y) * 0.03;

    camera.position.x = mouse.x * 0.35;
    camera.position.y = -mouse.y * 0.2;
    camera.lookAt(0, 0, 0);

    particles.rotation.y = t * 0.012;

    rings.forEach(({ mesh, speed }) => {
      mesh.rotation.z += speed;
    });

    renderer.render(scene, camera);
  }

  animate();
}
