let allPhotos = [];
let categoriesTree = {};
let currentPhotoObj = null;
let isEditMode = false;
let selectedPhotos = new Set();

// DOM Elements
const galleryGrid = document.getElementById('gallery-grid');
const categoryNav = document.getElementById('category-nav');
const currentViewTitle = document.getElementById('current-view-title');
const photoCount = document.getElementById('photo-count');

// Edit Mode Elements
const toggleEditBtn = document.getElementById('toggle-edit-btn');
const editToolbar = document.getElementById('edit-toolbar');
const selectedCountText = document.getElementById('selected-count');
const batchMoveBtn = document.getElementById('batch-move-btn');
const batchDeleteBtn = document.getElementById('batch-delete-btn');
const deleteConfirmModal = document.getElementById('delete-confirm-modal');
const closeDeleteConfirm = document.getElementById('close-delete-confirm');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const submitDeleteBtn = document.getElementById('submit-delete-btn');

// Lightbox Elements
const lightboxModal = document.getElementById('lightbox-modal');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCaption = document.getElementById('lightbox-caption');
const closeLightbox = document.getElementById('close-lightbox');
const movePhotoBtn = document.getElementById('move-photo-btn');

// Create Category Modal Elements
const newCategoryBtn = document.getElementById('new-category-btn');
const createCatModal = document.getElementById('create-category-modal');
const closeCreateCat = document.getElementById('close-create-category');
const submitCreateCat = document.getElementById('submit-create-cat');
const newCatName = document.getElementById('new-cat-name');
const newSubcatName = document.getElementById('new-subcat-name');

// Move Photo Modal Elements
const movePhotoModal = document.getElementById('move-photo-modal');
const closeMovePhoto = document.getElementById('close-move-photo');
const submitMovePhoto = document.getElementById('submit-move-photo');
const moveCatInput = document.getElementById('move-cat-input');
const moveSubcatInput = document.getElementById('move-subcat-input');
const catList = document.getElementById('category-list');
const subcatList = document.getElementById('subcategory-list');
const movingPhotoName = document.getElementById('moving-photo-name');

// Manual Elements
const openManualBtn = document.getElementById('open-manual-btn');
const manualModal = document.getElementById('manual-modal');
const closeManual = document.getElementById('close-manual');
const manualContent = document.getElementById('manual-content');

// --- Edit Mode Logic ---
function updateEditUI() {
  if (isEditMode) {
    toggleEditBtn.textContent = 'Cancel';
    toggleEditBtn.style.color = '#ef4444';
    editToolbar.style.display = 'flex';
  } else {
    toggleEditBtn.textContent = 'Edit';
    toggleEditBtn.style.color = '';
    editToolbar.style.display = 'none';
    selectedPhotos.clear();
    document.querySelectorAll('.photo-card.selected').forEach(el => el.classList.remove('selected'));
  }
  updateSelectionUI();
}

function updateSelectionUI() {
  selectedCountText.textContent = `${selectedPhotos.size} selected`;
  batchMoveBtn.disabled = selectedPhotos.size === 0;
  batchDeleteBtn.disabled = selectedPhotos.size === 0;
}

toggleEditBtn.onclick = () => {
  isEditMode = !isEditMode;
  updateEditUI();
};

// --- Modals Logic ---
function closeAllModals() {
  lightboxModal.classList.remove('active');
  createCatModal.classList.remove('active');
  movePhotoModal.classList.remove('active');
  deleteConfirmModal.classList.remove('active');
  manualModal.classList.remove('active');
}

closeLightbox.onclick = closeAllModals;
closeCreateCat.onclick = closeAllModals;
closeMovePhoto.onclick = closeAllModals;
closeDeleteConfirm.onclick = closeAllModals;
cancelDeleteBtn.onclick = closeAllModals;
closeManual.onclick = closeAllModals;

window.onclick = (e) => {
  if (e.target === lightboxModal || e.target === createCatModal || e.target === movePhotoModal || e.target === deleteConfirmModal || e.target === manualModal) {
    closeAllModals();
  }
};

// --- Manual Logic ---
openManualBtn.onclick = async () => {
  manualModal.classList.add('active');
  try {
    const res = await fetch('/api/manual');
    const data = await res.json();
    if (res.ok) {
      manualContent.innerHTML = data.html;
    } else {
      manualContent.innerHTML = `<p style="color:red">Error: ${data.error}</p>`;
    }
  } catch (err) {
    manualContent.innerHTML = `<p style="color:red">Failed to load manual.</p>`;
  }
};

// --- Create Category Logic ---
newCategoryBtn.onclick = () => {
  createCatModal.classList.add('active');
  newCatName.focus();
};

submitCreateCat.onclick = async () => {
  const cat = newCatName.value.trim();
  const subcat = newSubcatName.value.trim();
  if (!cat) return alert('Category name is required');

  const dirPath = subcat ? `${cat}/${subcat}` : cat;

  try {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dirPath })
    });
    if (res.ok) {
      newCatName.value = '';
      newSubcatName.value = '';
      closeAllModals();
      init();
    } else {
      const data = await res.json();
      alert('Error: ' + data.error);
    }
  } catch (err) {
    alert('Failed to create category');
  }
};

// --- Move Photo Logic ---
// Flatten recursive tree to get all paths for the dropdown
function flattenPaths(tree, currentPath = '', result = []) {
  for (const key of Object.keys(tree)) {
    const p = currentPath ? `${currentPath}/${key}` : key;
    result.push(p);
    flattenPaths(tree[key], p, result);
  }
  return result;
}

function openMoveModal() {
  catList.innerHTML = '';
  subcatList.innerHTML = '';
  const allPaths = flattenPaths(categoriesTree);
  
  allPaths.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p;
    catList.appendChild(opt);
  });
  
  if (isEditMode) {
    document.getElementById('move-modal-title').textContent = `Move ${selectedPhotos.size} Photos`;
    movingPhotoName.textContent = `Batch moving ${selectedPhotos.size} items`;
    moveCatInput.value = '';
  } else {
    document.getElementById('move-modal-title').textContent = `Move Photo`;
    movingPhotoName.textContent = `Moving: ${currentPhotoObj.name}`;
    moveCatInput.value = currentPhotoObj.dirPath === 'Root' ? '' : currentPhotoObj.dirPath;
  }
  
  movePhotoModal.classList.add('active');
}

movePhotoBtn.onclick = () => {
  if (!currentPhotoObj) return;
  lightboxModal.classList.remove('active');
  openMoveModal();
};

batchMoveBtn.onclick = () => {
  if (selectedPhotos.size === 0) return;
  openMoveModal();
};

submitMovePhoto.onclick = async () => {
  let newDirPath = moveCatInput.value.trim();
  // Support legacy subcategory input field if they typed it
  const newSubcat = moveSubcatInput.value.trim();
  if (newSubcat) {
    newDirPath = newDirPath ? `${newDirPath}/${newSubcat}` : newSubcat;
  }

  if (!newDirPath) return alert('Target path is required');

  const photosToMove = isEditMode ? Array.from(selectedPhotos) : [currentPhotoObj];

  try {
    const res = await fetch('/api/photos/move-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        photos: photosToMove.map(p => ({ filename: p.name, oldDirPath: p.dirPath })),
        newDirPath: newDirPath
      })
    });
    
    if (res.ok) {
      if (isEditMode) {
        isEditMode = false;
        updateEditUI();
      }
      closeAllModals();
      init(); 
    } else {
      const data = await res.json();
      alert('Error: ' + data.error);
    }
  } catch (err) {
    alert('Failed to move photos');
  }
};

// --- Delete Photo Logic ---
batchDeleteBtn.onclick = () => {
  if (selectedPhotos.size === 0) return;
  document.getElementById('delete-confirm-text').textContent = `Are you sure you want to permanently delete ${selectedPhotos.size} photo(s)?`;
  deleteConfirmModal.classList.add('active');
};

submitDeleteBtn.onclick = async () => {
  const photosToDelete = Array.from(selectedPhotos);
  try {
    const res = await fetch('/api/photos/delete-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        photos: photosToDelete.map(p => ({ filename: p.name, oldDirPath: p.dirPath }))
      })
    });
    
    if (res.ok) {
      isEditMode = false;
      updateEditUI();
      closeAllModals();
      init();
    } else {
      const data = await res.json();
      alert('Error: ' + data.error);
    }
  } catch(err) {
    alert('Failed to delete photos');
  }
};

// --- Recursive Category Actions ---
async function deleteCategory(dirPath) {
  if (!confirm(`Are you sure you want to permanently delete "${dirPath}" and ALL photos inside it?`)) return;

  try {
    const res = await fetch('/api/categories/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dirPath })
    });
    if (res.ok) {
      init();
    } else {
      const data = await res.json();
      alert('Error: ' + data.error);
    }
  } catch (err) {
    alert('Failed to delete folder');
  }
}

async function moveCategory(sourcePath, targetPath) {
  try {
    const res = await fetch('/api/categories/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourcePath, targetPath })
    });
    if (res.ok) {
      init();
    } else {
      const data = await res.json();
      alert('Error: ' + data.error);
    }
  } catch (err) {
    alert('Failed to move folder');
  }
}

async function movePhotosDragAndDrop(photos, newDirPath) {
  try {
    const res = await fetch('/api/photos/move-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photos, newDirPath })
    });
    
    if (res.ok) {
      if (isEditMode) {
        isEditMode = false;
        updateEditUI();
      }
      init(); 
    } else {
      const data = await res.json();
      alert('Error: ' + data.error);
    }
  } catch (err) {
    alert('Failed to move photos');
  }
}

// --- Initialization & Render ---
async function init() {
  try {
    if(allPhotos.length === 0) galleryGrid.innerHTML = '<div class="loading">Loading your beautiful photos...</div>';
    const res = await fetch('/api/photos');
    const data = await res.json();
    
    allPhotos = data.photos;
    categoriesTree = data.categories;

    renderNavigation();
    
    const activeBtn = document.querySelector('.category-btn.active, .subcategory-btn.active');
    if (activeBtn && activeBtn.textContent !== 'All Photos') {
       activeBtn.click();
    } else {
       renderGallery(allPhotos, 'All Photos', 'All Photos');
    }
  } catch (err) {
    console.error('Failed to load photos', err);
    galleryGrid.innerHTML = '<div class="loading">Failed to load photos. Make sure the server is running.</div>';
  }
}

function renderNavigation() {
  categoryNav.innerHTML = '';

  // Drop target for "Root" (moving a category back to the top level)
  const rootDropZone = document.createElement('div');
  rootDropZone.className = 'nav-item';
  rootDropZone.innerHTML = '<div style="height: 10px; width: 100%;"></div>';
  rootDropZone.addEventListener('dragover', e => { e.preventDefault(); rootDropZone.classList.add('drag-over'); });
  rootDropZone.addEventListener('dragleave', () => rootDropZone.classList.remove('drag-over'));
  rootDropZone.addEventListener('drop', e => {
    e.preventDefault();
    rootDropZone.classList.remove('drag-over');

    const jsonData = e.dataTransfer.getData('application/json');
    if (jsonData) {
      try {
        const data = JSON.parse(jsonData);
        if (data.type === 'photos') {
          movePhotosDragAndDrop(data.items, 'Root');
          return;
        }
      } catch(err) {}
    }

    const sourcePath = e.dataTransfer.getData('text/plain');
    if (sourcePath && sourcePath.includes('/')) {
      moveCategory(sourcePath, '');
    }
  });

  const allBtn = document.createElement('button');
  allBtn.className = 'category-btn active';
  allBtn.textContent = 'All Photos';
  allBtn.onclick = () => {
    setActiveNav(allBtn);
    renderGallery(allPhotos, 'All Photos', 'All Photos');
  };
  
  categoryNav.appendChild(rootDropZone);
  categoryNav.appendChild(allBtn);

  renderTree(categoriesTree, categoryNav, '');
}

function renderTree(node, parentEl, currentPath, depth = 0) {
  Object.keys(node).forEach(key => {
    const dirPath = currentPath ? `${currentPath}/${key}` : key;
    
    const navItem = document.createElement('div');
    navItem.className = 'nav-item';
    navItem.style.marginLeft = `${depth * 15}px`; // Recursive indentation

    // Drop Target Logic
    navItem.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      navItem.classList.add('drag-over');
    });
    navItem.addEventListener('dragleave', (e) => {
      e.stopPropagation();
      navItem.classList.remove('drag-over');
    });
    navItem.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      navItem.classList.remove('drag-over');

      const jsonData = e.dataTransfer.getData('application/json');
      if (jsonData) {
        try {
          const data = JSON.parse(jsonData);
          if (data.type === 'photos') {
            movePhotosDragAndDrop(data.items, dirPath);
            return;
          }
        } catch(err) {}
      }

      const sourcePath = e.dataTransfer.getData('text/plain');
      if (!sourcePath) return;
      if (sourcePath === dirPath || dirPath.startsWith(sourcePath + '/')) return; // Prevent dropping into self
      moveCategory(sourcePath, dirPath);
    });

    const catRow = document.createElement('div');
    catRow.className = 'nav-row';
    
    // Drag Source Logic
    catRow.draggable = true;
    catRow.addEventListener('dragstart', (e) => {
      catRow.classList.add('dragging');
      e.dataTransfer.setData('text/plain', dirPath);
      e.stopPropagation();
    });
    catRow.addEventListener('dragend', () => catRow.classList.remove('dragging'));

    const btn = document.createElement('button');
    btn.className = depth === 0 ? 'category-btn' : 'subcategory-btn';
    btn.textContent = key;
    
    const delBtn = document.createElement('button');
    delBtn.className = 'delete-cat-btn';
    delBtn.innerHTML = '🗑️';
    delBtn.title = 'Delete Folder';
    delBtn.onclick = (e) => {
      e.stopPropagation();
      deleteCategory(dirPath);
    };

    catRow.appendChild(btn);
    catRow.appendChild(delBtn);
    
    const childrenContainer = document.createElement('div');
    childrenContainer.className = 'subcategories';

    btn.onclick = (e) => {
      e.stopPropagation();
      const isExpanded = navItem.classList.contains('expanded');
      
      // If holding shift, don't collapse others, otherwise collapse siblings
      if (!e.shiftKey && depth === 0) {
         document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('expanded'));
      }
      
      if (!isExpanded) navItem.classList.add('expanded');

      setActiveNav(btn);
      
      // Filter photos to only those exactly in this dirPath (do not include subfolders)
      const filtered = allPhotos.filter(p => p.dirPath === dirPath);
      renderGallery(filtered, dirPath, key);
    };

    navItem.appendChild(catRow);
    
    if (Object.keys(node[key]).length > 0) {
      renderTree(node[key], childrenContainer, dirPath, depth + 1);
      navItem.appendChild(childrenContainer);
    }
    
    parentEl.appendChild(navItem);
  });
}

function setActiveNav(button) {
  document.querySelectorAll('.category-btn, .subcategory-btn').forEach(btn => btn.classList.remove('active'));
  button.classList.add('active');
}

function renderGallery(photos, title, shortTitle) {
  currentViewTitle.textContent = shortTitle || title;
  photoCount.textContent = `${photos.length} photo${photos.length !== 1 ? 's' : ''}`;
  galleryGrid.innerHTML = '';
  
  if (photos.length === 0) {
    galleryGrid.innerHTML = '<div class="loading">No photos found in this folder.</div>';
    return;
  }

  photos.forEach((photo, index) => {
    const card = document.createElement('div');
    card.className = 'photo-card';
    if (selectedPhotos.has(photo)) {
      card.classList.add('selected');
    }
    
    card.style.animation = `popIn 0.4s ease forwards ${index * 0.05}s`;
    card.style.opacity = '0';

    card.draggable = true;
    card.addEventListener('dragstart', (e) => {
      let photosToMove = [];
      if (isEditMode && selectedPhotos.has(photo)) {
        photosToMove = Array.from(selectedPhotos);
      } else {
        photosToMove = [photo];
      }
      
      const payload = {
        type: 'photos',
        items: photosToMove.map(p => ({ filename: p.name, oldDirPath: p.dirPath }))
      };
      
      e.dataTransfer.setData('application/json', JSON.stringify(payload));
      card.style.opacity = '0.5';
    });
    card.addEventListener('dragend', () => {
      card.style.opacity = '1';
    });

    card.onclick = () => {
      if (isEditMode) {
        if (selectedPhotos.has(photo)) {
          selectedPhotos.delete(photo);
          card.classList.remove('selected');
        } else {
          selectedPhotos.add(photo);
          card.classList.add('selected');
        }
        updateSelectionUI();
      } else {
        currentPhotoObj = photo;
        lightboxImg.src = photo.url;
        lightboxCaption.textContent = photo.name;
        lightboxModal.classList.add('active');
      }
    };

    const img = document.createElement('img');
    img.src = photo.url;
    img.loading = 'lazy';
    img.alt = photo.name;

    const overlay = document.createElement('div');
    overlay.className = 'photo-overlay';
    
    const info = document.createElement('div');
    info.className = 'photo-info';
    
    const name = document.createElement('div');
    name.className = 'photo-name';
    name.textContent = photo.name;

    const date = document.createElement('p');
    const dateObj = new Date(photo.date);
    date.textContent = dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

    info.appendChild(name);
    info.appendChild(date);
    overlay.appendChild(info);
    card.appendChild(img);
    card.appendChild(overlay);
    galleryGrid.appendChild(card);
  });
}

// Start app
init();
