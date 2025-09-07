// frontend/app/three-hero.ts
// CREAȚI/EDITAȚI: creează dacă nu există — ÎNLOCUIEȘTE TOT
'use client'

import * as THREE from 'three'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// 1) Obține canvas-ul; dacă nu există, ieși grațios
const canvas = document.getElementById('scene') as HTMLCanvasElement | null
if (!canvas) {
    // Nu aruncăm eroare – pagina poate fi randată fără canvas în anumite rute
    console.warn('[three-hero] #scene not found, skipping WebGL init')
    export {}
}

// 2) Renderer cu DPR limitat (perf) + background
const renderer = new THREE.WebGLRenderer({
    canvas: canvas!,
    antialias: true,
    powerPreference: 'high-performance',
    alpha: false,
})
renderer.setClearColor(0x0b0b0d, 1)
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
renderer.setSize(window.innerWidth, window.innerHeight, false)

// 3) Scenă + cameră
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(6, 4, 10)

// 4) Lumină
scene.add(new THREE.AmbientLight(0xffffff, 0.4))
const dir = new THREE.DirectionalLight(0xffffff, 1.8)
dir.position.set(4, 8, 2)
scene.add(dir)
const fill = new THREE.PointLight(0xffffff, 0.6)
fill.position.set(-4, 4, 4)
scene.add(fill)

// 5) „Room” — cutie cu fețele interioare vizibile (BackSide), ca să nu mai ieșim „afară”
const room = new THREE.Mesh(
    new THREE.BoxGeometry(30, 10, 30),
    new THREE.MeshStandardMaterial({
        color: 0x121217,
        roughness: 0.95,
        side: THREE.BackSide, // <- cheia: vezi interiorul, nu exteriorul
    }),
)
scene.add(room)

// 6) Podea (opțional, dar ajută percepția spațiului)
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.MeshStandardMaterial({ color: 0x0d0d10, roughness: 0.85 }),
)
floor.rotation.x = -Math.PI / 2
scene.add(floor)

// 7) Benzi de „lumină”
for (let i = 0; i < 8; i++) {
    const strip = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.03, 3),
        new THREE.MeshBasicMaterial({ color: 0xb6d0ff }),
    )
    strip.position.set(Math.sin(i) * 6, 1.5 + i * 0.35, Math.cos(i) * 6)
    scene.add(strip)
}

// 7.5) Sticlă de vin simplă (corp + gât + dop)
const bottle = new THREE.Group()

// corpul principal
const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 1.1, 5, 32),
    new THREE.MeshStandardMaterial({ color: 0x2d5b2d, roughness: 0.15, metalness: 0.25 }),
)
body.position.y = 2.5
bottle.add(body)

// gâtul
const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.4, 2, 32),
    new THREE.MeshStandardMaterial({ color: 0x2d5b2d, roughness: 0.15, metalness: 0.25 }),
)
neck.position.y = 5.5
bottle.add(neck)

// dopul
const cork = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.35, 0.6, 32),
    new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.8 }),
)
cork.position.y = 6.6
bottle.add(cork)

scene.add(bottle)

// animație de rotație continuă
gsap.to(bottle.rotation, { y: Math.PI * 2, duration: 20, ease: 'none', repeat: -1 })

// 8) Redimensionare robustă (pe fereastră, nu pe clientWidth care poate fi 0)
function setRendererSize() {
    const w = window.innerWidth
    const h = window.innerHeight
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
}
window.addEventListener('resize', setRendererSize, { passive: true })
setRendererSize()

// 9) Țintă pentru lookAt (mișcată lin separat de poziția camerei)
const camTarget = new THREE.Vector3(0, 2, 0)
const tmpTarget = camTarget.clone()

function updateCameraLookAt(dt: number) {
    // amestec lin spre noua țintă (viteza ~6x/sec)
    camTarget.lerp(tmpTarget, Math.min(1, dt * 6))
    camera.lookAt(camTarget)
}

// 10) Limite sigure pentru cameră (clamp)
const BOUNDS = { x: [-8, 8], y: [1, 7], z: [3, 12] }
function clampCam() {
    camera.position.x = Math.max(BOUNDS.x[0], Math.min(BOUNDS.x[1], camera.position.x))
    camera.position.y = Math.max(BOUNDS.y[0], Math.min(BOUNDS.y[1], camera.position.y))
    camera.position.z = Math.max(BOUNDS.z[0], Math.min(BOUNDS.z[1], camera.position.z))
}

// 11) Pin secțiunea de scrollytelling (dacă nu ai deja alt ScrollTrigger pentru asta)
if (!ScrollTrigger.getById?.('pin-sections')) {
    ScrollTrigger.create({
        id: 'pin-sections',
        trigger: '#scroll-sections',
        start: 'top top',
        end: '+=3000',
        pin: true,
        scrub: 1,
    })
}

// 12) Timeline scroll-driven pentru cameră + țintă
const camAnim = gsap.timeline({
    scrollTrigger: {
        trigger: '#scroll-sections',
        start: 'top top',
        end: '+=3000',
        scrub: 1,
    },
    defaults: { ease: 'none' },
})

camAnim
    // intrare + coborâre ușoară a privirii
    .to(camera.position, { x: 3, y: 2, z: 6, duration: 1 }, 0)
    .to(tmpTarget,       { x: 0, y: 1.6, z: 0, duration: 1 }, 0)
    // orbită spre stânga + ridicare mică
    .to(camera.position, { x: -2, y: 3.2, z: 5, duration: 1 }, 1)
    .to(tmpTarget,       { x: 0.2, y: 2.0, z: 0, duration: 1 }, 1)
    // overview de sus
    .to(camera.position, { x: 0, y: 6, z: 8, duration: 1 }, 2)
    .to(tmpTarget,       { x: 0, y: 2.6, z: 0, duration: 1 }, 2)
    .eventCallback('onUpdate', clampCam) // clamp la fiecare update

// 13) Loop cu delta-time (mișcare stabilă indiferent de FPS)
const clock = new THREE.Clock()
renderer.setAnimationLoop(() => {
    const dt = clock.getDelta()
    scene.rotation.y += 0.15 * dt // parallax subtil
    clampCam()
    updateCameraLookAt(dt)
    renderer.render(scene, camera)
})

// 14) Asigură-te că ScrollTrigger e la zi când se schimbă layout-ul
requestAnimationFrame(() => ScrollTrigger.refresh())
