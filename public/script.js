let allPhotos = [];
let categoriesTree = {};
let currentPhotoObj = null;
let isEditMode = false;
let selectedPhotos = new Set();
let currentDirPath = '';

// DOM Elements
const galleryGrid = document.getElementById('gallery-grid');
const categoryNav = document.getElementById('category-nav');
const currentViewTitle = document.getElementById('current-view-title');
const photoCount = document.getElementById('photo-count');

// Edit Mode Elements
const toggleEditBtn = document.getElementById('toggle-edit-btn');
const editToolbar = document.getElementById('edit-toolbar');
const selectedCountText = document.getElementById('selected-count');
const autoIdentifyBtn = document.getElementById('auto-identify-btn');
const batchRenameBtn = document.getElementById('batch-rename-btn');
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
const renamePhotoBtn = document.getElementById('rename-photo-btn');

// Create Category Modal Elements
const newCategoryBtn = document.getElementById('new-category-btn');
const createCatModal = document.getElementById('create-category-modal');
const closeCreateCat = document.getElementById('close-create-category');
const submitCreateCat = document.getElementById('submit-create-cat');
const newCatName = document.getElementById('new-cat-name');
const newSubcatName = document.getElementById('new-subcat-name');

const renameCatModal = document.getElementById('rename-category-modal');
const closeRenameCat = document.getElementById('close-rename-category');
const submitRenameCat = document.getElementById('submit-rename-cat');
const renameCatInput = document.getElementById('rename-cat-input');
const renamingCategoryName = document.getElementById('renaming-category-name');
let currentRenameCategoryPath = '';

// Move Photo Modal Elements
const movePhotoModal = document.getElementById('move-photo-modal');
const closeMovePhoto = document.getElementById('close-move-photo');
const submitMovePhoto = document.getElementById('submit-move-photo');
const moveCatInput = document.getElementById('move-cat-input');
const moveSubcatInput = document.getElementById('move-subcat-input');
const catList = document.getElementById('category-list');
const subcatList = document.getElementById('subcategory-list');
const movingPhotoName = document.getElementById('moving-photo-name');

// Rename Photo Modal Elements
const renamePhotoModal = document.getElementById('rename-photo-modal');
const closeRenamePhoto = document.getElementById('close-rename-photo');
const submitRenamePhoto = document.getElementById('submit-rename-photo');
const renamePhotoInput = document.getElementById('rename-photo-input');
const renamingPhotoName = document.getElementById('renaming-photo-name');

// Batch Rename Elements
const batchRenameModal = document.getElementById('batch-rename-modal');
const closeBatchRename = document.getElementById('close-batch-rename');
const submitBatchRename = document.getElementById('submit-batch-rename');
const batchRenameTbody = document.getElementById('batch-rename-tbody');

// Manual Elements
const openManualBtn = document.getElementById('open-manual-btn');
const manualModal = document.getElementById('manual-modal');
const closeManual = document.getElementById('close-manual');

// Settings Elements
const openSettingsBtn = document.getElementById('open-settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettings = document.getElementById('close-settings');
const geminiApiKeyInput = document.getElementById('gemini-api-key-input');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const closeManual = document.getElementById('close-manual');
const manualContent = document.getElementById('manual-content');

// Upload Elements
const uploadPhotoBtn = document.getElementById('upload-photo-btn');
const uploadFileInput = document.getElementById('upload-file-input');
const uploadTargetModal = document.getElementById('upload-target-modal');
const closeUploadTarget = document.getElementById('close-upload-target');
const submitUploadBtn = document.getElementById('submit-upload-btn');
const uploadCatInput = document.getElementById('upload-cat-input');
const uploadingPhotoName = document.getElementById('uploading-photo-name');

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
  const count = selectedPhotos.size;
  selectedCountText.textContent = `${count} selected`;
  const hasSelection = count > 0;
  autoIdentifyBtn.disabled = !hasSelection;
  batchRenameBtn.disabled = !hasSelection;
  batchMoveBtn.disabled = !hasSelection;
  batchDeleteBtn.disabled = !hasSelection;
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
  manualModal.classList.remove('active');
  uploadTargetModal.classList.remove('active');
  renamePhotoModal.classList.remove('active');
  batchRenameModal.classList.remove('active');
  renameCatModal.classList.remove('active');
  settingsModal.classList.remove('active');
  deleteConfirmModal.classList.remove('active');
}

closeLightbox.onclick = closeAllModals;
closeCreateCat.onclick = closeAllModals;
closeRenameCat.onclick = closeAllModals;
closeMovePhoto.onclick = closeAllModals;
closeDeleteConfirm.onclick = closeAllModals;
cancelDeleteBtn.onclick = closeAllModals;
closeManual.onclick = closeAllModals;
closeUploadTarget.onclick = closeAllModals;
closeRenamePhoto.onclick = closeAllModals;
closeBatchRename.onclick = closeAllModals;
closeSettings.onclick = closeAllModals;

window.onclick = (e) => {
  // Only auto-close the Lightbox and Manual modals when clicking outside. 
  // Form modals require explicitly clicking the 'X' or 'Cancel' button to prevent accidental data loss.
  if (e.target === lightboxModal || e.target === manualModal) {
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

// --- Upload Logic ---
uploadPhotoBtn.onclick = () => {
  uploadFileInput.click();
};

uploadFileInput.onchange = (e) => {
  if (e.target.files.length === 0) return;
  
  catList.innerHTML = '';
  const allPaths = flattenPaths(categoriesTree);
  allPaths.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p;
    catList.appendChild(opt);
  });
  
  uploadingPhotoName.textContent = `Ready to upload ${e.target.files.length} photo(s)`;
  uploadCatInput.value = currentDirPath === 'Root' ? '' : currentDirPath;
  uploadTargetModal.classList.add('active');
};

submitUploadBtn.onclick = async () => {
  if (uploadFileInput.files.length === 0) return;
  
  const targetPath = uploadCatInput.value.trim();
  const formData = new FormData();
  formData.append('targetPath', targetPath);
  
  for (let i = 0; i < uploadFileInput.files.length; i++) {
    formData.append('photos', uploadFileInput.files[i]);
  }
  
  submitUploadBtn.textContent = 'Uploading...';
  submitUploadBtn.disabled = true;
  
  try {
    const res = await fetch('/api/photos/upload', {
      method: 'POST',
      body: formData
    });
    
    if (res.ok) {
      uploadFileInput.value = '';
      closeAllModals();
      init();
    } else {
      const data = await res.json();
      alert('Upload Error: ' + data.error);
    }
  } catch (err) {
    alert('Failed to upload photos');
  } finally {
    submitUploadBtn.textContent = 'Upload';
    submitUploadBtn.disabled = false;
  }
};

renamePhotoBtn.onclick = () => {
  if (!currentPhotoObj) return;
  renamingPhotoName.textContent = `Renaming: ${currentPhotoObj.name}`;
  const lastDotIdx = currentPhotoObj.name.lastIndexOf('.');
  const baseName = lastDotIdx !== -1 ? currentPhotoObj.name.substring(0, lastDotIdx) : currentPhotoObj.name;
  renamePhotoInput.value = baseName;
  renamePhotoModal.classList.add('active');
};

submitRenamePhoto.onclick = async () => {
  if (!currentPhotoObj) return;
  let newName = renamePhotoInput.value.trim();
  if (!newName) return;
  
  const lastDotIdx = currentPhotoObj.name.lastIndexOf('.');
  const ext = lastDotIdx !== -1 ? currentPhotoObj.name.substring(lastDotIdx) : '';
  if (!newName.toLowerCase().endsWith(ext.toLowerCase())) {
    newName += ext;
  }
  
  if (newName === currentPhotoObj.name) {
    closeAllModals();
    return;
  }
  
  // Ensure the extension is preserved if they forgot it, or just use exactly what they typed.
  // We'll trust what they typed, but maybe add basic validation.
  
  try {
    const res = await fetch('/api/photos/rename', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dirPath: currentPhotoObj.dirPath,
        oldName: currentPhotoObj.name,
        newName: newName
      })
    });
    if (res.ok) {
      closeAllModals();
      init();
    } else {
      const data = await res.json();
      alert('Error: ' + data.error);
    }
  } catch (err) {
    alert('Failed to rename photo');
  }
};

// --- Batch Rename Logic ---
batchRenameBtn.onclick = () => {
  if (selectedPhotos.size === 0) return;
  
  batchRenameTbody.innerHTML = '';
  
  Array.from(selectedPhotos).forEach((photo, idx) => {
    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid var(--border-color)';
    
    // Thumbnail cell
    const tdImg = document.createElement('td');
    tdImg.style.padding = '0.5rem';
    const img = document.createElement('img');
    img.src = photo.url;
    img.style.width = '60px';
    img.style.height = '60px';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '4px';
    tdImg.appendChild(img);
    
    // Input cell
    const tdInput = document.createElement('td');
    tdInput.style.padding = '0.5rem';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'modern-input batch-rename-input';
    input.style.width = '100%';
    const lastDotIdx = photo.name.lastIndexOf('.');
    const baseName = lastDotIdx !== -1 ? photo.name.substring(0, lastDotIdx) : photo.name;
    input.value = baseName;
    input.dataset.oldName = photo.name;
    input.dataset.dirPath = photo.dirPath;
    tdInput.appendChild(input);
    
    tr.appendChild(tdImg);
    tr.appendChild(tdInput);
    batchRenameTbody.appendChild(tr);
  });
  
  batchRenameModal.classList.add('active');
};

submitBatchRename.onclick = async () => {
  const inputs = document.querySelectorAll('.batch-rename-input');
  const photosToRename = [];
  
  inputs.forEach(input => {
    const oldName = input.dataset.oldName;
    const dirPath = input.dataset.dirPath;
    let newName = input.value.trim();
    
    if (newName) {
      const lastDotIdx = oldName.lastIndexOf('.');
      const ext = lastDotIdx !== -1 ? oldName.substring(lastDotIdx) : '';
      if (!newName.toLowerCase().endsWith(ext.toLowerCase())) {
        newName += ext;
      }
      if (newName !== oldName) {
        photosToRename.push({ dirPath, oldName, newName });
      }
    }
  });
  
  if (photosToRename.length === 0) {
    closeAllModals();
    return;
  }
  
  submitBatchRename.textContent = 'Saving...';
  submitBatchRename.disabled = true;
  
  try {
    const res = await fetch('/api/photos/rename-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photos: photosToRename })
    });
    
    if (res.ok) {
      closeAllModals();
      isEditMode = false;
      updateEditUI();
      init();
    } else {
      const data = await res.json();
      alert('Error: ' + data.error);
    }
  } catch (err) {
    alert('Failed to batch rename photos');
  } finally {
    submitBatchRename.textContent = 'Save All';
    submitBatchRename.disabled = false;
  }
};

// --- Auto-Identify Logic ---
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

autoIdentifyBtn.onclick = async () => {
  const apiKey = localStorage.getItem('geminiApiKey');
  if (!apiKey) {
    alert("Please enter your Gemini API Key in the Settings first.");
    openSettingsBtn.click();
    return;
  }
  if (selectedPhotos.size === 0) return;

  autoIdentifyBtn.textContent = 'Identifying...';
  autoIdentifyBtn.disabled = true;

  try {
    const photosToRename = [];
    const usedNames = new Set();
    
    // Add current selection original names
    for (let photo of selectedPhotos) {
      usedNames.add(photo.name.toLowerCase());
    }
    
    // Add existing names in the library to avoid conflicts
    const resDir = await fetch('/api/photos');
    const db = await resDir.json();
    for (let p of db.photos) {
      usedNames.add(p.name.toLowerCase());
    }

    for (let photo of selectedPhotos) {
      try {
        const imgRes = await fetch(photo.url);
        const blob = await imgRes.blob();
        const base64Data = await blobToBase64(blob);

        const promptText = "Identify the specific Transformer character or toy in this image. Respond with ONLY the character's name. If you do not know the specific character, respond with a short 2-3 word description of the object. Do not include any other text, punctuation, or explanations.";

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: promptText },
                { inline_data: { mime_type: blob.type, data: base64Data } }
              ]
            }]
          })
        });

        if (!geminiRes.ok) {
          console.error("Gemini API error", await geminiRes.text());
          continue;
        }

        const data = await geminiRes.json();
        let name = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        
        if (name) {
          // clean up name
          name = name.replace(/[<>:"/\\|?*]/g, '').replace(/\n/g, '').trim();
          
          const oldExt = photo.name.includes('.') ? photo.name.substring(photo.name.lastIndexOf('.')) : '';
          let finalName = name + oldExt;
          let counter = 1;
          
          while (usedNames.has(finalName.toLowerCase()) && finalName.toLowerCase() !== photo.name.toLowerCase()) {
            finalName = `${name} (${counter})${oldExt}`;
            counter++;
          }
          
          usedNames.add(finalName.toLowerCase());
          
          if (finalName !== photo.name) {
            photosToRename.push({
              dirPath: photo.dirPath,
              oldName: photo.name,
              newName: finalName
            });
          }
        }
      } catch (err) {
        console.error("Failed to identify", photo.name, err);
      }
    }

    if (photosToRename.length > 0) {
      const renameRes = await fetch('/api/photos/rename-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photos: photosToRename })
      });
      if (renameRes.ok) {
        isEditMode = false;
        selectedPhotos.clear();
        closeAllModals();
        init();
      } else {
        const errData = await renameRes.json();
        alert("Failed to batch rename after identification: " + (errData.error || ""));
      }
    } else {
      alert("No photos could be automatically renamed. They might have failed to identify or already have the correct name.");
    }
  } catch (err) {
    alert("An error occurred during auto-identify.");
    console.error(err);
  } finally {
    autoIdentifyBtn.textContent = '✨ Auto-Identify';
    autoIdentifyBtn.disabled = selectedPhotos.size === 0;
  }
};

// --- Settings Logic ---
openSettingsBtn.onclick = () => {
  geminiApiKeyInput.value = localStorage.getItem('geminiApiKey') || '';
  settingsModal.classList.add('active');
};

saveSettingsBtn.onclick = () => {
  localStorage.setItem('geminiApiKey', geminiApiKeyInput.value.trim());
  closeAllModals();
};

// --- Move Category Logic ---
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

submitRenameCat.onclick = async () => {
  const newName = renameCatInput.value.trim();
  if (!newName) return;
  if (!currentRenameCategoryPath) return;

  submitRenameCat.textContent = 'Saving...';
  submitRenameCat.disabled = true;

  try {
    const res = await fetch('/api/categories/rename', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dirPath: currentRenameCategoryPath, newName })
    });
    
    if (res.ok) {
      closeAllModals();
      init();
    } else {
      const data = await res.json();
      alert('Error: ' + data.error);
    }
  } catch(err) {
    alert('Failed to rename folder');
  } finally {
    submitRenameCat.textContent = 'Rename Folder';
    submitRenameCat.disabled = false;
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
    
    const previousPath = currentDirPath;
    
    if (previousPath && previousPath !== 'Root') {
       // Escape double quotes just in case they are in the folder name
       const safePath = previousPath.replace(/"/g, '\\"');
       const activeBtn = document.querySelector(`button[data-path="${safePath}"]`);
       if (activeBtn) {
         // Expand parent folders so it's visible in the UI
         let parent = activeBtn.closest('.subcategories');
         while (parent) {
           const navItem = parent.closest('.nav-item');
           if (navItem) navItem.classList.add('expanded');
           parent = navItem ? navItem.closest('.subcategories') : null;
         }
         activeBtn.click();
       } else {
         document.querySelector('.category-btn').click(); // Fallback to All Photos
       }
    } else {
       document.querySelector('.category-btn').click(); // Fallback to All Photos
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
    renderGallery(allPhotos, 'All Photos', 'All Photos', 'Root');
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
    btn.dataset.path = dirPath;
    
    const btnContainer = document.createElement('div');
    btnContainer.style.display = 'flex';
    btnContainer.style.gap = '24px'; // Huge gap

    const renameBtn = document.createElement('button');
    renameBtn.className = 'delete-cat-btn';
    renameBtn.style.marginRight = '8px';
    renameBtn.innerHTML = '✏️';
    renameBtn.title = 'Rename Folder';
    renameBtn.onclick = (e) => {
      e.stopPropagation();
      currentRenameCategoryPath = dirPath;
      const folderName = dirPath.split('/').pop();
      renamingCategoryName.textContent = `Renaming: ${dirPath}`;
      renameCatInput.value = folderName;
      renameCatModal.classList.add('active');
    };

    const delBtn = document.createElement('button');
    delBtn.className = 'delete-cat-btn';
    delBtn.innerHTML = '×';
    delBtn.title = 'Delete Folder';
    delBtn.onclick = (e) => {
      e.stopPropagation();
      deleteCategory(dirPath);
    };

    btnContainer.appendChild(renameBtn);
    btnContainer.appendChild(delBtn);

    catRow.appendChild(btn);
    catRow.appendChild(btnContainer);
    
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
      renderGallery(filtered, dirPath, key, dirPath);
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

function renderGallery(photos, title, shortTitle, dirPath = 'Root') {
  currentViewTitle.textContent = shortTitle || title;
  currentDirPath = dirPath;
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
