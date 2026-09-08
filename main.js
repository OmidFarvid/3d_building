import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js';

const canvas = document.getElementById('canvas');
const viewport = document.getElementById('viewport');
const deviceMode = document.getElementById('deviceMode');
const materialDropdown = document.getElementById('materialDropdown');
const materialDropdownButton = document.getElementById('materialDropdownButton');
const materialPreview = document.getElementById('materialPreview');
const materialLabel = document.getElementById('materialLabel');
const createButton = document.getElementById('createButton');
const deleteButton = document.getElementById('deleteButton');
const library = document.getElementById('library');

function updateDeviceMode() {
  const isMobile = window.matchMedia('(max-width: 767.98px)').matches;
  deviceMode.textContent = isMobile ? '📱 Mobile Mode' : '🖥️ Desktop Mode';
}
updateDeviceMode();
window.addEventListener('resize', updateDeviceMode);

const materialColors = { brick: '#b84a32', concrete: '#999999', wood: '#8b5a2b', glass: '#66ccff', metal: '#9aa0a6' };
const materialNames = { brick: 'Brick', concrete: 'Concrete', wood: 'Wood', glass: 'Glass', metal: 'Metal' };

function materialImage(key) {
  const color = materialColors[key];
  const pattern = key === 'brick'
    ? `<path d="M0 11h34M0 23h34M17 0v11M8 11v12M25 11v12M17 23v11" stroke="rgba(0,0,0,.3)" stroke-width="2"/>`
    : key === 'wood'
      ? `<path d="M2 7c8-5 17 5 30-1M1 17c10-5 17 6 32 0M4 28c8-4 16 4 27-1" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="2"/>`
      : key === 'glass' ? `<path d="M7 27L27 7M13 32L32 13" stroke="white" stroke-opacity=".55" stroke-width="3"/>` : '';
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34"><rect width="34" height="34" rx="4" fill="${color}"/>${pattern}</svg>`)}`;
}

let selectedMaterial = 'brick';
materialPreview.src = materialImage(selectedMaterial);
document.querySelectorAll('.material-option').forEach(option => {
  option.querySelector('img').src = materialImage(option.dataset.value);
  option.addEventListener('click', () => {
    selectedMaterial = option.dataset.value;
    materialPreview.src = materialImage(selectedMaterial);
    materialLabel.textContent = materialNames[selectedMaterial];
    document.querySelectorAll('.material-option').forEach(item => item.classList.toggle('selected', item === option));
    materialDropdown.classList.remove('open');
  });
});
materialDropdownButton.addEventListener('click', event => { event.stopPropagation(); materialDropdown.classList.toggle('open'); });
document.addEventListener('click', () => materialDropdown.classList.remove('open'));

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x181818);
const camera = new THREE.PerspectiveCamera(60, viewport.clientWidth / viewport.clientHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(viewport.clientWidth, viewport.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
camera.position.set(0, 50, 50);
const cameraTarget = new THREE.Vector3(0, 0, 0);
camera.lookAt(cameraTarget);
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

const objects = [];
let selectedObject = null;
let nextObjectId = 1;

function createSelectionOutline(mesh) {
  const edges = new THREE.EdgesGeometry(mesh.geometry);
  const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xff2222, linewidth: 2 }));
  line.scale.setScalar(1.02);
  line.visible = false;
  line.userData.isSelectionOutline = true;
  mesh.add(line);
  mesh.userData.outline = line;
}

function setSelectionOutline(object, visible) {
  if (object?.userData.outline) object.userData.outline.visible = visible;
}

function createObject(materialKey = selectedMaterial) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), materials[materialKey].clone());
  mesh.position.set(0, 0, 0);
  mesh.userData = { id: nextObjectId++, material: materialKey };
  scene.add(mesh);
  objects.push(mesh);
  createSelectionOutline(mesh);
  selectObject(mesh);
}

function selectObject(object) {
  if (selectedObject && selectedObject !== object) setSelectionOutline(selectedObject, false);
  selectedObject = object;
  setSelectionOutline(selectedObject, true);
  deleteButton.disabled = !selectedObject;
  updateLibrary();
}

function deleteSelectedObject() {
  if (!selectedObject) return;
  const index = objects.indexOf(selectedObject);
  if (index >= 0) objects.splice(index, 1);
  const outline = selectedObject.userData.outline;
  if (outline) {
    outline.geometry.dispose();
    outline.material.dispose();
  }
  selectedObject.geometry.dispose();
  selectedObject.material.dispose();
  scene.remove(selectedObject);
  selectedObject = null;
  deleteButton.disabled = true;
  updateLibrary();
}

deleteButton.addEventListener('click', deleteSelectedObject);

document.addEventListener('keydown', event => {
  if (event.key === 'Delete') deleteSelectedObject();
});

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

function move(axis, amount) { if (selectedObject) selectedObject.position[axis] += amount; }
function rotate(axis, amount) { if (selectedObject) selectedObject.rotation[axis] += amount; }

function zoom(direction) {
  const currentDistance = camera.position.distanceTo(cameraTarget);
  const nextDistance = THREE.MathUtils.clamp(currentDistance - direction * 5, 2, 500);
  const offset = camera.position.clone().sub(cameraTarget).normalize().multiplyScalar(nextDistance);
  camera.position.copy(cameraTarget).add(offset);
  camera.lookAt(cameraTarget);
}

const moveStep = 1;
const rotateStep = Math.PI / 2;
document.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => {
  switch (button.dataset.action) {
    case 'move-x-minus': move('x', -moveStep); break; case 'move-x-plus': move('x', moveStep); break;
    case 'move-y-minus': move('y', -moveStep); break; case 'move-y-plus': move('y', moveStep); break;
    case 'move-z-minus': move('z', -moveStep); break; case 'move-z-plus': move('z', moveStep); break;
    case 'rotate-x-minus': rotate('x', -rotateStep); break; case 'rotate-x-plus': rotate('x', rotateStep); break;
    case 'rotate-y-minus': rotate('y', -rotateStep); break; case 'rotate-y-plus': rotate('y', rotateStep); break;
    case 'rotate-z-minus': rotate('z', -rotateStep); break; case 'rotate-z-plus': rotate('z', rotateStep); break;
    case 'zoom-in': zoom(1); break; case 'zoom-out': zoom(-1); break;
  }
}));

canvas.addEventListener('wheel', event => { event.preventDefault(); zoom(event.deltaY < 0 ? 1 : -1); }, { passive: false });

let isPanning = false;
let lastPanX = 0;
let lastPanY = 0;
canvas.addEventListener('contextmenu', event => event.preventDefault());
canvas.addEventListener('pointerdown', event => {
  if (event.button !== 2) return;
  isPanning = true; lastPanX = event.clientX; lastPanY = event.clientY;
  canvas.classList.add('panning'); canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', event => {
  if (!isPanning) return;
  const dx = event.clientX - lastPanX, dy = event.clientY - lastPanY;
  lastPanX = event.clientX; lastPanY = event.clientY;
  panCamera(dx, dy);
});
canvas.addEventListener('pointerup', event => {
  if (event.button !== 2) return;
  isPanning = false; canvas.classList.remove('panning');
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
});
canvas.addEventListener('pointercancel', () => { isPanning = false; canvas.classList.remove('panning'); });

function panCamera(dx, dy) {
  const distance = camera.position.distanceTo(cameraTarget), panSpeed = distance * 0.0015;
  const forward = cameraTarget.clone().sub(camera.position).normalize();
  const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
  const up = new THREE.Vector3().crossVectors(right, forward).normalize();
  const offset = right.multiplyScalar(-dx * panSpeed).add(up.multiplyScalar(dy * panSpeed));
  camera.position.add(offset); cameraTarget.add(offset); camera.lookAt(cameraTarget);
}

const touchPoints = new Map();
let touchMode = null;
let lastTouchCenter = null;
let lastTouchDistance = 0;

canvas.addEventListener('pointerdown', event => {
  if (event.pointerType !== 'touch') return;
  touchPoints.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (touchPoints.size === 2) {
    const points = [...touchPoints.values()];
    lastTouchCenter = { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 };
    lastTouchDistance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
    touchMode = 'panzoom';
  }
});

canvas.addEventListener('pointermove', event => {
  if (event.pointerType !== 'touch' || !touchPoints.has(event.pointerId)) return;
  touchPoints.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (touchPoints.size !== 2 || touchMode !== 'panzoom') return;

  const points = [...touchPoints.values()];
  const center = { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 };
  const distance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
  panCamera(center.x - lastTouchCenter.x, center.y - lastTouchCenter.y);
  if (lastTouchDistance > 0) zoom((distance - lastTouchDistance) * 0.08);
  lastTouchCenter = center;
  lastTouchDistance = distance;
});

function endTouch(event) {
  if (event.pointerType !== 'touch') return;
  touchPoints.delete(event.pointerId);
  if (touchPoints.size < 2) {
    touchMode = null;
    lastTouchCenter = null;
    lastTouchDistance = 0;
  }
}
canvas.addEventListener('pointerup', endTouch);
canvas.addEventListener('pointercancel', endTouch);

createButton.addEventListener('click', () => createObject());
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
canvas.addEventListener('click', event => {
  if (event.button !== 0 || isPanning || touchMode === 'panzoom') return;
  const rect = canvas.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(objects, false);
  if (hits.length > 0) selectObject(hits[0].object);
});

function animate() { renderer.render(scene, camera); requestAnimationFrame(animate); }
animate();
window.addEventListener('resize', () => {
  const width = viewport.clientWidth, height = viewport.clientHeight;
  camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.setSize(width, height);
});
createObject('brick');
