import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js';

const canvas = document.getElementById('canvas');
const viewport = document.getElementById('viewport');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x181818);

const camera = new THREE.PerspectiveCamera(60, viewport.clientWidth / viewport.clientHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(viewport.clientWidth, viewport.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

camera.position.set(0, 50, 50);
camera.lookAt(0, 0, 0);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
keyLight.position.set(20, 40, 30);
scene.add(keyLight);

const geometry = new THREE.BoxGeometry(16, 16, 16);
const material = new THREE.MeshStandardMaterial({
  color: 0x2196f3,
  roughness: 0.3,
  metalness: 0.1
});
const box = new THREE.Mesh(geometry, material);
scene.add(box);

const step = 1;
const rotateStep = Math.PI / 18;

function move(axis, amount) {
  box.position[axis] += amount;
}

function rotate(axis, amount) {
  box.rotation[axis] += amount;
}

document.querySelectorAll('[data-action]').forEach(button => {
  button.addEventListener('click', () => {
    const action = button.dataset.action;

    switch (action) {
      case 'move-x-minus': move('x', -step); break;
      case 'move-x-plus': move('x', step); break;
      case 'move-y-minus': move('y', -step); break;
      case 'move-y-plus': move('y', step); break;
      case 'move-z-minus': move('z', -step); break;
      case 'move-z-plus': move('z', step); break;
      case 'rotate-x-minus': rotate('x', -rotateStep); break;
      case 'rotate-x-plus': rotate('x', rotateStep); break;
      case 'rotate-y-minus': rotate('y', -rotateStep); break;
      case 'rotate-y-plus': rotate('y', rotateStep); break;
      case 'rotate-z-minus': rotate('z', -rotateStep); break;
      case 'rotate-z-plus': rotate('z', rotateStep); break;
    }
  });
});

function animate() {
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

window.addEventListener('resize', () => {
  const width = viewport.clientWidth;
  const height = viewport.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});
