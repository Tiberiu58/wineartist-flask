
// ---------- Smooth scroll (Lenis) + GSAP sync ----------
gsap.registerPlugin(ScrollTrigger);

// Use GSAP's high-precision ticker to drive Lenis
const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => {
  // gsap.ticker gives 'time' in seconds; Lenis expects ms
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

// ---------- Three.js scene ----------
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance',
  alpha: false
});
renderer.setClearColor(0x0b0b0d, 1);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
camera.position.set(6, 4, 10);

const clock = new THREE.Clock();

// Lighting
scene.add(new THREE.AmbientLight(0xffffff, 0.28));
const dir = new THREE.DirectionalLight(0xffffff, 1.2);
dir.position.set(4, 8, 2);
scene.add(dir);

// Geometry: floor
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 40),
  new THREE.MeshStandardMaterial({ color: 0x0d0d10, roughness: 0.85 })
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// Room: inside faces visible so we never see "outside"
const room = new THREE.Mesh(
  new THREE.BoxGeometry(30, 10, 30),
  new THREE.MeshStandardMaterial({
    color: 0x121217,
    roughness: 0.95,
    side: THREE.BackSide   // <- key!
  })
);
scene.add(room);


// Geometry: light strips
for (let i = 0; i < 8; i++) {
  const strip = new THREE.Mesh(
    new THREE.BoxGeometry(0.03, 0.03, 3),
    new THREE.MeshBasicMaterial({ color: 0xb6d0ff })
  );
  strip.position.set(Math.sin(i) * 6, 1.5 + i * 0.35, Math.cos(i) * 6);
  scene.add(strip);
}

// Responsive sizing (use window to avoid zero client sizes)
function setRendererSize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  renderer.setPixelRatio(dpr);
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', setRendererSize, { passive: true });
setRendererSize();

// ---------- Camera target (for smooth lookAt) ----------
const camTarget = new THREE.Vector3(0, 2, 0);
const tmpTarget = camTarget.clone();

// Utility to update camera lookAt with a tiny slerp-like blend
function updateCameraLookAt(dt) {
  // Linear blend towards tmpTarget
  camTarget.lerp(tmpTarget, Math.min(1, dt * 6)); // follow speed
  camera.lookAt(camTarget);
}

// ---------- Scroll-driven camera choreography ----------
const camAnim = gsap.timeline({
  scrollTrigger: {
    trigger: "#scroll-sections",
    start: "top top",
    end: "+=3000",
    pin: true,
    scrub: 1
  },
  defaults: { ease: "none" }
});

// Keyframes: change camera position and the lookAt target together
camAnim
  // Move in and lower the gaze
  .to(camera.position, { x: 3, y: 2, z: 6, duration: 1 }, 0)
  .to(tmpTarget,       { x: 0, y: 1.6, z: 0, duration: 1 }, 0)

  // Orbit-left and raise slightly
  .to(camera.position, { x: -2, y: 3.2, z: 5, duration: 1 }, 1)
  .to(tmpTarget,       { x: 0.2, y: 2.0, z: 0, duration: 1 }, 1)

  // Pull up for an overview
  .to(camera.position, { x: 0, y: 6, z: 8, duration: 1 }, 2)
  .to(tmpTarget,       { x: 0, y: 2.6, z: 0, duration: 1 }, 2);

// ---------- Animation loop (delta-time based) ----------
renderer.setAnimationLoop(() => {
  const dt = clock.getDelta();

  // subtle parallax rotation, framerate-independent
  scene.rotation.y += 0.15 * dt;

  updateCameraLookAt(dt);
  renderer.render(scene, camera);
});

const BOUNDS = { x: [-8, 8], y: [1, 7], z: [3, 12] };

function clampCam() {
  camera.position.x = Math.max(BOUNDS.x[0], Math.min(BOUNDS.x[1], camera.position.x));
  camera.position.y = Math.max(BOUNDS.y[0], Math.min(BOUNDS.y[1], camera.position.y));
  camera.position.z = Math.max(BOUNDS.z[0], Math.min(BOUNDS.z[1], camera.position.z));
}

camAnim.eventCallback('onUpdate', clampCam);

renderer.setAnimationLoop(() => {
  const dt = clock.getDelta();
  scene.rotation.y += 0.15 * dt;
  clampCam();                 // keep camera in bounds each frame
  updateCameraLookAt(dt);
  renderer.render(scene, camera);
});
