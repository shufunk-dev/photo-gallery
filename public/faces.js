// face.js - Handles Face API Logic

let faceDb = { clusters: [], namedFaces: {} };
let modelsLoaded = false;
let isScanning = false;
let allPhotosCache = [];

const scannerUi = document.getElementById('scanner-ui');
const scannerStatus = document.getElementById('scanner-status');
const scannerProgressBar = document.getElementById('scanner-progress-bar');
const startScanBtn = document.getElementById('start-scan-btn');
const peopleGrid = document.getElementById('people-grid');
const peopleGalleryGrid = document.getElementById('gallery-grid');
const peopleView = document.getElementById('people-view');
const galleryTabBtn = document.getElementById('gallery-tab-btn');
const peopleTabBtn = document.getElementById('people-tab-btn');
const peopleEditToolbar = document.getElementById('edit-toolbar');

// Initialize Tabs
galleryTabBtn.onclick = () => {
  peopleView.style.display = 'none';
  peopleGalleryGrid.style.display = 'grid';
  galleryTabBtn.style.background = 'var(--bg-hover)';
  peopleTabBtn.style.background = 'transparent';
  document.getElementById('current-view-title').textContent = 'All Photos';
};

peopleTabBtn.onclick = () => {
  peopleGalleryGrid.style.display = 'none';
  peopleEditToolbar.style.display = 'none';
  peopleView.style.display = 'block';
  peopleTabBtn.style.background = 'var(--bg-hover)';
  galleryTabBtn.style.background = 'transparent';
  document.getElementById('current-view-title').textContent = 'People';
  initPeopleView();
};

async function loadFaceDatabase() {
  try {
    const res = await fetch('/api/faces');
    faceDb = await res.json();
  } catch (err) {
    console.error("Failed to load faces db", err);
  }
}

async function saveFaceDatabase() {
  try {
    await fetch('/api/faces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(faceDb)
    });
  } catch (err) {
    console.error("Failed to save faces db", err);
  }
}

async function initPeopleView() {
  await loadFaceDatabase();
  
  if (faceDb.clusters.length === 0) {
    scannerUi.style.display = 'block';
  } else {
    scannerUi.style.display = 'none';
    renderPeopleGrid();
  }
}

async function loadModels() {
  if (modelsLoaded) return;
  scannerStatus.textContent = "Loading AI models into Graphics Card...";
  await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
  await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
  await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
  modelsLoaded = true;
}

startScanBtn.onclick = async () => {
  if (isScanning) return;
  isScanning = true;
  startScanBtn.disabled = true;
  
  await loadModels();
  
  try {
    const res = await fetch('/api/photos');
    const data = await res.json();
    allPhotosCache = data.photos || [];
  } catch (err) {
    scannerStatus.textContent = "Failed to fetch photos.";
    isScanning = false;
    return;
  }

  let totalPhotos = allPhotosCache.length;
  if (totalPhotos === 0) {
    scannerStatus.textContent = "No photos found to scan.";
    isScanning = false;
    return;
  }
  let processed = 0;
  
  // We will store flat array of detected faces: { descriptor, filename, category, subcategory }
  const allDetectedFaces = [];

  for (let photo of allPhotosCache) {
    processed++;
    scannerStatus.textContent = `Scanning ${processed} of ${totalPhotos}...`;
    scannerProgressBar.style.width = `${(processed / totalPhotos) * 100}%`;

    const img = new Image();
    let imgPath = `/photos/${encodeURIComponent(photo.category)}`;
    if (photo.subcategory !== 'General') {
      imgPath += `/${encodeURIComponent(photo.subcategory)}`;
    }
    imgPath += `/${encodeURIComponent(photo.name)}`;
    
    img.crossOrigin = "anonymous";
    img.src = imgPath;

    await new Promise((resolve) => {
      img.onload = async () => {
        try {
          const detections = await faceapi.detectAllFaces(img).withFaceLandmarks().withFaceDescriptors();
          for (let det of detections) {
            allDetectedFaces.push({
              descriptor: Array.from(det.descriptor), // Convert Float32Array to standard array for JSON saving
              filename: photo.name,
              category: photo.category,
              subcategory: photo.subcategory,
              imgPath: imgPath,
              box: det.detection.box
            });
          }
        } catch (e) {
          console.warn("Face scan failed for " + imgPath, e);
        }
        resolve();
      };
      img.onerror = () => resolve();
    });
  }

  scannerStatus.textContent = "Clustering faces...";
  clusterFaces(allDetectedFaces);
  await saveFaceDatabase();
  
  scannerStatus.textContent = "Scan complete!";
  setTimeout(() => {
    scannerUi.style.display = 'none';
    renderPeopleGrid();
  }, 1000);
};

function clusterFaces(faces) {
  // Simple clustering
  let clusters = [];
  const THRESHOLD = 0.55; // Euclidean distance threshold

  for (let face of faces) {
    let matched = false;
    let descriptorArr = new Float32Array(face.descriptor);

    for (let cluster of clusters) {
      // Compare with the first face of the cluster as the "center"
      let centerArr = new Float32Array(cluster.faces[0].descriptor);
      let distance = faceapi.euclideanDistance(descriptorArr, centerArr);
      if (distance < THRESHOLD) {
        cluster.faces.push(face);
        matched = true;
        break;
      }
    }

    if (!matched) {
      clusters.push({
        id: 'cluster_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        faces: [face]
      });
    }
  }

  // Filter out tiny clusters (e.g., less than 2 photos) to reduce noise
  faceDb.clusters = clusters.filter(c => c.faces.length > 1);
}

function renderPeopleGrid() {
  peopleGrid.innerHTML = '';
  if (faceDb.clusters.length === 0) {
    peopleGrid.innerHTML = '<p>No people found in your library.</p>';
    return;
  }

  for (let cluster of faceDb.clusters) {
    const card = document.createElement('div');
    card.className = 'photo-card';
    card.style.cursor = 'pointer';

    const repFace = cluster.faces[0];
    
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.objectFit = 'cover';
    canvas.style.transition = 'transform 0.5s ease';
    
    const ctx = canvas.getContext('2d');
    const imgObj = new Image();
    imgObj.src = repFace.imgPath;
    imgObj.onload = () => {
      // Add some padding around the face box
      const pad = repFace.box._width * 0.4;
      const sx = Math.max(0, repFace.box._x - pad);
      const sy = Math.max(0, repFace.box._y - pad);
      const sw = Math.min(imgObj.width - sx, repFace.box._width + pad * 2);
      const sh = Math.min(imgObj.height - sy, repFace.box._height + pad * 2);
      
      // Calculate a square crop area based on the face box
      const size = Math.max(sw, sh);
      
      ctx.drawImage(imgObj, sx, sy, size, size, 0, 0, 200, 200);
    };

    const overlay = document.createElement('div');
    overlay.className = 'photo-overlay';

    const info = document.createElement('div');
    info.className = 'photo-info';
    
    const name = faceDb.namedFaces[cluster.id] || 'Unknown Person';
    info.innerHTML = `
      <div class="photo-name">${name}</div>
      <p>${cluster.faces.length} photos</p>
    `;

    overlay.appendChild(info);
    card.appendChild(canvas);
    card.appendChild(overlay);

    card.onclick = () => {
      openPersonView(cluster);
    };

    peopleGrid.appendChild(card);
  }
}

function openPersonView(cluster) {
  peopleGrid.style.display = 'none';
  
  const header = document.createElement('div');
  header.style.marginBottom = '2rem';
  header.style.display = 'flex';
  header.style.alignItems = 'center';
  header.style.gap = '1rem';

  const backBtn = document.createElement('button');
  backBtn.className = 'action-btn';
  backBtn.textContent = '← Back to People';
  backBtn.onclick = () => {
    document.getElementById('person-detail-view').remove();
    peopleGrid.style.display = 'grid';
  };

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.value = faceDb.namedFaces[cluster.id] || '';
  nameInput.placeholder = 'Who is this?';
  nameInput.style.padding = '0.5rem';
  nameInput.style.borderRadius = '4px';
  nameInput.style.border = '1px solid var(--border-color)';
  nameInput.style.background = 'var(--bg-secondary)';
  nameInput.style.color = 'var(--text-main)';

  const saveBtn = document.createElement('button');
  saveBtn.className = 'action-btn primary';
  saveBtn.textContent = 'Save Name';
  saveBtn.onclick = async () => {
    faceDb.namedFaces[cluster.id] = nameInput.value.trim();
    await saveFaceDatabase();
    alert('Name saved!');
    // Update the card if we go back
    renderPeopleGrid();
  };

  header.appendChild(backBtn);
  header.appendChild(nameInput);
  header.appendChild(saveBtn);

  const grid = document.createElement('div');
  grid.className = 'photo-grid';
  
  for (let face of cluster.faces) {
    const card = document.createElement('div');
    card.className = 'photo-card';
    
    const img = document.createElement('img');
    img.src = face.imgPath;
    
    card.appendChild(img);
    grid.appendChild(card);
  }

  const wrapper = document.createElement('div');
  wrapper.id = 'person-detail-view';
  wrapper.appendChild(header);
  wrapper.appendChild(grid);

  peopleView.appendChild(wrapper);
}
