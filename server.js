const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const PHOTOS_DIR = path.join(__dirname, 'photos');

// Ensure photos directory exists
if (!fs.existsSync(PHOTOS_DIR)) {
  fs.mkdirSync(PHOTOS_DIR);
}

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, 'public')));
// Serve photos directory directly to access images via /photos/...
app.use('/photos', express.static(PHOTOS_DIR));
// Parse JSON bodies
app.use(express.json());

// Helper function to recursively read photos directory
function getPhotosInfo() {
  const photos = [];
  const categories = {};

  try {
    const categoryDirs = fs.readdirSync(PHOTOS_DIR, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory());

    for (const catDir of categoryDirs) {
      const catName = catDir.name;
      categories[catName] = [];
      const catPath = path.join(PHOTOS_DIR, catName);

      const subCategoryDirs = fs.readdirSync(catPath, { withFileTypes: true });

      for (const subDir of subCategoryDirs) {
        if (subDir.isDirectory()) {
          const subCatName = subDir.name;
          categories[catName].push(subCatName);
          const subCatPath = path.join(catPath, subCatName);

          const files = fs.readdirSync(subCatPath, { withFileTypes: true });
          for (const file of files) {
            if (file.isFile() && file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
              const filePath = path.join(subCatPath, file.name);
              const stats = fs.statSync(filePath);
              
              photos.push({
                name: file.name,
                category: catName,
                subcategory: subCatName,
                url: `/photos/${encodeURIComponent(catName)}/${encodeURIComponent(subCatName)}/${encodeURIComponent(file.name)}`,
                date: stats.birthtimeMs || stats.mtimeMs
              });
            }
          }
        } else if (subDir.isFile() && subDir.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
              // Handle photos that are directly inside a category
              const filePath = path.join(catPath, subDir.name);
              const stats = fs.statSync(filePath);
              
              photos.push({
                name: subDir.name,
                category: catName,
                subcategory: 'General',
                url: `/photos/${encodeURIComponent(catName)}/${encodeURIComponent(subDir.name)}`,
                date: stats.birthtimeMs || stats.mtimeMs
              });
        }
      }
    }
  } catch (error) {
    console.error('Error reading photos directory:', error);
  }

  // Sort photos by date descending (newest first)
  photos.sort((a, b) => b.date - a.date);

  return { photos, categories };
}

app.get('/api/photos', (req, res) => {
  const data = getPhotosInfo();
  res.json(data);
});

// Create Category Endpoint
app.post('/api/categories', (req, res) => {
  const { category, subcategory } = req.body;
  if (!category) return res.status(400).json({ error: 'Category is required' });

  try {
    let targetPath = path.join(PHOTOS_DIR, category);
    if (subcategory) {
      targetPath = path.join(targetPath, subcategory);
    }
    
    // Create folder safely (recursive creates parent folders if missing)
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }
    res.json({ success: true, message: 'Folder created successfully' });
  } catch (err) {
    console.error('Error creating folder:', err);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

// Move Photo Endpoint
app.post('/api/photos/move', (req, res) => {
  const { filename, oldCategory, oldSubcategory, newCategory, newSubcategory } = req.body;
  
  if (!filename || !oldCategory || !newCategory) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    // Construct old path
    let oldPath = path.join(PHOTOS_DIR, oldCategory);
    if (oldSubcategory && oldSubcategory !== 'General') {
      oldPath = path.join(oldPath, oldSubcategory);
    }
    oldPath = path.join(oldPath, filename);

    // Construct new path
    let newPath = path.join(PHOTOS_DIR, newCategory);
    if (newSubcategory && newSubcategory !== 'General') {
      newPath = path.join(newPath, newSubcategory);
    }
    
    // Ensure destination exists
    if (!fs.existsSync(newPath)) {
      fs.mkdirSync(newPath, { recursive: true });
    }
    
    newPath = path.join(newPath, filename);

    // Move file
    if (fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, newPath);
      res.json({ success: true, message: 'Photo moved successfully' });
    } else {
      res.status(404).json({ error: 'Original photo not found' });
    }
  } catch (err) {
    console.error('Error moving photo:', err);
    res.status(500).json({ error: 'Failed to move photo' });
  }
});

// Move Batch Endpoint
app.post('/api/photos/move-batch', (req, res) => {
  const { photos, newCategory, newSubcategory } = req.body;
  if (!photos || !Array.isArray(photos) || !newCategory) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    // Construct new destination path
    let newPathDir = path.join(PHOTOS_DIR, newCategory);
    if (newSubcategory && newSubcategory !== 'General') {
      newPathDir = path.join(newPathDir, newSubcategory);
    }
    if (!fs.existsSync(newPathDir)) {
      fs.mkdirSync(newPathDir, { recursive: true });
    }

    const results = [];
    for (const p of photos) {
      let oldPath = path.join(PHOTOS_DIR, p.oldCategory);
      if (p.oldSubcategory && p.oldSubcategory !== 'General') {
        oldPath = path.join(oldPath, p.oldSubcategory);
      }
      oldPath = path.join(oldPath, p.filename);
      let newPath = path.join(newPathDir, p.filename);

      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        results.push({ filename: p.filename, status: 'moved' });
      } else {
        results.push({ filename: p.filename, status: 'not_found' });
      }
    }
    res.json({ success: true, results });
  } catch (err) {
    console.error('Error moving batch:', err);
    res.status(500).json({ error: 'Failed to move photos' });
  }
});

// Delete Batch Endpoint
app.post('/api/photos/delete-batch', (req, res) => {
  const { photos } = req.body;
  if (!photos || !Array.isArray(photos)) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const results = [];
    for (const p of photos) {
      let oldPath = path.join(PHOTOS_DIR, p.oldCategory);
      if (p.oldSubcategory && p.oldSubcategory !== 'General') {
        oldPath = path.join(oldPath, p.oldSubcategory);
      }
      oldPath = path.join(oldPath, p.filename);

      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
        results.push({ filename: p.filename, status: 'deleted' });
      } else {
        results.push({ filename: p.filename, status: 'not_found' });
      }
    }
    res.json({ success: true, results });
  } catch (err) {
    console.error('Error deleting batch:', err);
    res.status(500).json({ error: 'Failed to delete photos' });
  }
});

// --- Faces Database ---
const FACES_DB_PATH = path.join(__dirname, 'faces.json');

// Get Faces Database
app.get('/api/faces', (req, res) => {
  if (fs.existsSync(FACES_DB_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(FACES_DB_PATH, 'utf-8'));
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: 'Failed to read faces database' });
    }
  } else {
    res.json({ clusters: [], namedFaces: {} });
  }
});

// Update Faces Database
app.post('/api/faces', (req, res) => {
  try {
    fs.writeFileSync(FACES_DB_PATH, JSON.stringify(req.body, null, 2), 'utf-8');
    res.json({ success: true });
  } catch (e) {
    console.error('Error saving faces database:', e);
    res.status(500).json({ error: 'Failed to save faces database' });
  }
});

// Serve Manual HTML
app.get('/api/manual', (req, res) => {
  try {
    const { marked } = require('marked');
    const manualPath = path.join(__dirname, 'docs', 'manual.md');
    if (!fs.existsSync(manualPath)) {
      return res.status(404).json({ error: 'Manual not found' });
    }
    const mdContent = fs.readFileSync(manualPath, 'utf-8');
    const htmlContent = marked(mdContent);
    res.json({ html: htmlContent });
  } catch (err) {
    console.error('Error serving manual:', err);
    res.status(500).json({ error: 'Failed to generate manual' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
