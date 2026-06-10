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

  try {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: cat, subcategory: subcat })
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
function openMoveModal() {
  catList.innerHTML = '';
  Object.keys(categoriesTree).forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    catList.appendChild(opt);
  });
  
  if (isEditMode) {
    document.getElementById('move-modal-title').textContent = `Move ${selectedPhotos.size} Photos`;
    movingPhotoName.textContent = `Batch moving ${selectedPhotos.size} items`;
    moveCatInput.value = '';
    moveSubcatInput.value = '';
    updateSubcatDatalist('');
  } else {
    document.getElementById('move-modal-title').textContent = `Move Photo`;
    movingPhotoName.textContent = `Moving: ${currentPhotoObj.name}`;
    moveCatInput.value = currentPhotoObj.category;
    moveSubcatInput.value = currentPhotoObj.subcategory;
    updateSubcatDatalist(currentPhotoObj.category);
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

moveCatInput.addEventListener('input', () => {
  updateSubcatDatalist(moveCatInput.value);
});

function updateSubcatDatalist(cat) {
  subcatList.innerHTML = '';
  if (categoriesTree[cat]) {
    categoriesTree[cat].forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      subcatList.appendChild(opt);
    });
  }
}

submitMovePhoto.onclick = async () => {
  const newCat = moveCatInput.value.trim();
  const newSubcat = moveSubcatInput.value.trim();
  if (!newCat) return alert('Target category is required');

  const photosToMove = isEditMode ? Array.from(selectedPhotos) : [currentPhotoObj];

  try {
    const res = await fetch('/api/photos/move-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        photos: photosToMove.map(p => ({ filename: p.name, oldCategory: p.category, oldSubcategory: p.subcategory })),
        newCategory: newCat,
        newSubcategory: newSubcat
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
        photos: photosToDelete.map(p => ({ filename: p.name, oldCategory: p.category, oldSubcategory: p.subcategory }))
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
       renderGallery(allPhotos, 'All Photos');
    }
  } catch (err) {
    console.error('Failed to load photos', err);
    galleryGrid.innerHTML = '<div class="loading">Failed to load photos. Make sure the server is running.</div>';
  }
}

function renderNavigation() {
  categoryNav.innerHTML = '';

  const allBtn = document.createElement('button');
  allBtn.className = 'category-btn active';
  allBtn.textContent = 'All Photos';
  allBtn.onclick = () => {
    setActiveNav(allBtn);
    renderGallery(allPhotos, 'All Photos');
  };
  categoryNav.appendChild(allBtn);

  Object.keys(categoriesTree).forEach(category => {
    const navItem = document.createElement('div');
    navItem.className = 'nav-item';

    const catBtn = document.createElement('button');
    catBtn.className = 'category-btn';
    catBtn.textContent = category;
    
    const subcatsContainer = document.createElement('div');
    subcatsContainer.className = 'subcategories';

    catBtn.onclick = () => {
      const isExpanded = navItem.classList.contains('expanded');
      document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('expanded'));
      if (!isExpanded) navItem.classList.add('expanded');

      setActiveNav(catBtn);
      const filtered = allPhotos.filter(p => p.category === category);
      renderGallery(filtered, category);
    };

    categoriesTree[category].forEach(subcat => {
      const subBtn = document.createElement('button');
      subBtn.className = 'subcategory-btn';
      subBtn.textContent = subcat;
      subBtn.onclick = (e) => {
        e.stopPropagation();
        setActiveNav(subBtn, true);
        const filtered = allPhotos.filter(p => p.category === category && p.subcategory === subcat);
        renderGallery(filtered, `${category} / ${subcat}`);
      };
      subcatsContainer.appendChild(subBtn);
    });

    navItem.appendChild(catBtn);
    if (categoriesTree[category].length > 0) {
      navItem.appendChild(subcatsContainer);
    }
    categoryNav.appendChild(navItem);
  });
}

function setActiveNav(button, isSub = false) {
  document.querySelectorAll('.category-btn, .subcategory-btn').forEach(btn => btn.classList.remove('active'));
  button.classList.add('active');
}

function renderGallery(photos, title) {
  currentViewTitle.textContent = title;
  photoCount.textContent = `${photos.length} photo${photos.length !== 1 ? 's' : ''}`;
  galleryGrid.innerHTML = '';
  
  // Also clear selectedPhotos if they were looking at a different category and clicked away
  // Let's just keep selected photos across categories for mass moving! So don't clear it here.

  if (photos.length === 0) {
    galleryGrid.innerHTML = '<div class="loading">No photos found in this category.</div>';
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

init();
