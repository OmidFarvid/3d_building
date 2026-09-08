import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js';

const canvas = document.getElementById('canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

camera.position.set(0, 50, 50);
camera.lookAt(0, 0, 0);

// Lighting makes the sphere's curvature and depth visible.
const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
keyLight.position.set(20, 40, 30);
scene.add(keyLight);

const geometry = new THREE.SphereGeometry(8, 64, 64);
const material = new THREE.MeshStandardMaterial({
  color: 0xff0000,
  roughness: 0.35,
  metalness: 0.05
});
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

function animate() {
  sphere.rotation.y += 0.01;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
