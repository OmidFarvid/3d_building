import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js';

const canvas = document.getElementById('canvas');
const viewport = document.getElementById('viewport');
const materialSelect = document.getElementById('materialSelect');
const createButton = document.getElementById('createButton');
const library = document.getElementById('library');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x181818);

const camera = new THREE.PerspectiveCamera(60, viewport.clientWidth / viewport.clientHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(viewport.clientWidth, viewport.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

camera.position.set(0, 50, 50);
camera.lookAt(0, 0, 0);

scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
keyLight.position.set(20, 40, 30);
scene.add(keyLight);

const materials = {
  brick: new THREE.MeshStandardMaterial({ color: 0xb84a32, roughness: 0.9 }),
  concrete: new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.95 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.8 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0x66ccff, transparent: true, opacity: 0.45, roughness: 0.05, metalness: 0 }),
  metal: new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.25, metalness: 0.85 })
};

const materialNames = {
  brick: 'Brick',
  concrete: 'Concrete',
  wood: 'Wood',
  glass: 'Glass',
  metal: 'Metal'
};

const objects = [];
let selectedObject = null;
let nextObjectId = 1;

// One Three.js unit represents 1 cm, so every box is exactly 1 cm x 1 cm x 1 cm.
function createObject(materialKey = materialSelect.value) {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const mesh = new THREE.Mesh(geometry, materials[materialKey].clone());
  mesh.position.set(0, 0, 0);
  mesh.userData = {
    id: nextObjectId++,
    material: materialKey
  };
  scene.add(mesh);
  objects.push(mesh);
  selectObject(mesh);
  updateLibrary();
}

function selectObject(object) {
  selectedObject = object;
  updateLibrary();
}

function updateLibrary() {
  library.innerHTML = '';

  objects.forEach(object => {
    const item = document.createElement('button');
    item.className = `library-item${object === selectedObject ? ' selected' : ''}`;
    item.textContent = `Box #${object.userData.id} — ${materialNames[object.userData.material]}`;
    item.addEventListener('click', () => selectObject(object));
    library.appendChild(item);
  });
}

function move(axis, amount) {
  if (!selectedObject) return;
  selectedObject.position[axis] += amount;
}

function rotate(axis, amount) {
  if (!selectedObject) return;
  selectedObject.rotation[axis] += amount;
}

// Zoom only: move the camera along its current viewing direction. No orbit.
function zoom(direction) {
  const viewDirection = new THREE.Vector3();
  camera.getWorldDirection(viewDirection);
  const currentDistance = camera.position.length();
  const step = 5;
  const nextDistance = THREE.MathUtils.clamp(currentDistance - direction * step, 2, 500);
  camera.position.setLength(nextDistance);
  camera.lookAt(0, 0, 0);
}

const moveStep = 1;
const rotateStep = Math.PI / 2;

document.querySelectorAll('[data-action]').forEach(button => {
  button.addEventListener('click', () => {
    const action = button.dataset.action;
    switch (action) {
      case 'move-x-minus': move('x', -moveStep); break;
      case 'move-x-plus': move('x', moveStep); break;
      case 'move-y-minus': move('y', -moveStep); break;
      case 'move-y-plus': move('y', moveStep); break;
      case 'move-z-minus': move('z', -moveStep); break;
      case 'move-z-plus': move('z', moveStep); break;
      case 'rotate-x-minus': rotate('x', -rotateStep); break;
      case 'rotate-x-plus': rotate('x', rotateStep); break;
      case 'rotate-y-minus': rotate('y', -rotateStep); break;
      case 'rotate-y-plus': rotate('y', rotateStep); break;
      case 'rotate-z-minus': rotate('z', -rotateStep); break;
      case 'rotate-z-plus': rotate('z', rotateStep); break;
      case 'zoom-in': zoom(1); break;
      case 'zoom-out': zoom(-1); break;
    }
  });
});

// Mouse wheel zoom, without orbit.
canvas.addEventListener('wheel', event => {
  event.preventDefault();
  zoom(event.deltaY < 0 ? 1 : -1);
}, { passive: false });

createButton.addEventListener('click', () => createObject());

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

canvas.addEventListener('click', event => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(objects, false);

  if (hits.length > 0) {
    selectObject(hits[0].object);
  }
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

createObject('brick');
