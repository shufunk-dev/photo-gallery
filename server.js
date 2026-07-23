const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = 3000;
const PHOTOS_DIR = path.join(__dirname, 'photos');

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let targetPath = req.body.targetPath || '';
    if (targetPath === 'Root') targetPath = '';
    const dest = path.join(PHOTOS_DIR, targetPath);
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage });

// Ensure photos directory exists
if (!fs.existsSync(PHOTOS_DIR)) {
  fs.mkdirSync(PHOTOS_DIR);
}

app.use(express.static(path.join(__dirname, 'public')));
app.use('/photos', express.static(PHOTOS_DIR));
app.use(express.json({ limit: '50mb' }));

// Helper function to recursively read photos directory
function getPhotosInfo() {
  const photos = [];
  const categories = {}; // Will be a nested tree

  function walkDir(currentPath, treeNode, relativePath) {
    let items;
    try {
      items = fs.readdirSync(currentPath, { withFileTypes: true });
    } catch (e) {
      return;
    }

    for (const item of items) {
      if (item.name === '.gitkeep') continue;
      
      const fullPath = path.join(currentPath, item.name);
      const itemRelativePath = relativePath ? `${relativePath}/${item.name}` : item.name;

      if (item.isDirectory()) {
        treeNode[item.name] = {};
        walkDir(fullPath, treeNode[item.name], itemRelativePath);
      } else if (item.isFile() && item.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        const stats = fs.statSync(fullPath);
        const urlSegments = itemRelativePath.split('/').map(seg => encodeURIComponent(seg));
        
        photos.push({
          name: item.name,
          dirPath: relativePath || 'Root', // Top-level files go in 'Root' visually
          url: `/photos/${urlSegments.join('/')}`,
          date: stats.birthtimeMs || stats.mtimeMs
        });
      }
    }
  }

  walkDir(PHOTOS_DIR, categories, '');
  photos.sort((a, b) => b.date - a.date);
  return { photos, categories };
}

app.get('/api/photos', (req, res) => {
  const data = getPhotosInfo();
  res.json(data);
});

app.post('/api/categories', (req, res) => {
  const { dirPath } = req.body;
  if (!dirPath) return res.status(400).json({ error: 'Path is required' });

  try {
    const targetPath = path.join(PHOTOS_DIR, dirPath);
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

app.post('/api/categories/delete', (req, res) => {
  const { dirPath } = req.body;
  if (!dirPath) return res.status(400).json({ error: 'Path is required' });

  try {
    const targetPath = path.join(PHOTOS_DIR, dirPath);
    if (fs.existsSync(targetPath)) {
      fs.rmSync(targetPath, { recursive: true, force: true });
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Folder not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete folder' });
  }
});

app.post('/api/categories/move', (req, res) => {
  const { sourcePath, targetPath } = req.body;
  if (!sourcePath || targetPath === undefined) {
    return res.status(400).json({ error: 'Paths are required' });
  }

  try {
    const absSourcePath = path.join(PHOTOS_DIR, sourcePath);
    const folderName = path.basename(absSourcePath);
    const absTargetPath = targetPath === '' 
      ? path.join(PHOTOS_DIR, folderName) 
      : path.join(PHOTOS_DIR, targetPath, folderName);

    if (fs.existsSync(absSourcePath)) {
      if (fs.existsSync(absTargetPath)) {
        return res.status(400).json({ error: 'Folder already exists in target location.' });
      }
      fs.renameSync(absSourcePath, absTargetPath);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Source not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to move folder' });
  }
});

app.post('/api/photos/move', (req, res) => {
  const { filename, oldDirPath, newDirPath } = req.body;
  if (!filename || oldDirPath === undefined || newDirPath === undefined) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    const oldPath = path.join(PHOTOS_DIR, oldDirPath === 'Root' ? '' : oldDirPath, filename);
    const newDir = path.join(PHOTOS_DIR, newDirPath === 'Root' ? '' : newDirPath);
    fs.mkdirSync(newDir, { recursive: true });
    const newPath = path.join(newDir, filename);

    if (fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, newPath);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Original photo not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to move photo' });
  }
});

app.post('/api/photos/move-batch', (req, res) => {
  const { photos, newDirPath } = req.body;
  if (!photos || !Array.isArray(photos) || newDirPath === undefined) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    const newDir = path.join(PHOTOS_DIR, newDirPath === 'Root' ? '' : newDirPath);
    fs.mkdirSync(newDir, { recursive: true });

    const results = [];
    for (const p of photos) {
      const oldPath = path.join(PHOTOS_DIR, p.oldDirPath === 'Root' ? '' : p.oldDirPath, p.filename);
      const newPath = path.join(newDir, p.filename);

      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        results.push({ filename: p.filename, status: 'moved' });
      }
    }
    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ error: 'Failed to move photos' });
  }
});

app.post('/api/photos/delete-batch', (req, res) => {
  const { photos } = req.body;
  if (!photos || !Array.isArray(photos)) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    const results = [];
    for (const p of photos) {
      const oldPath = path.join(PHOTOS_DIR, p.oldDirPath === 'Root' ? '' : p.oldDirPath, p.filename);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
        results.push({ filename: p.filename, status: 'deleted' });
      }
    }
    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete photos' });
  }
});

// Rename Photo Endpoint
app.post('/api/photos/rename', (req, res) => {
  const { dirPath, oldName, newName } = req.body;
  if (!oldName || !newName) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    const activeDirPath = dirPath === 'Root' ? '' : dirPath;
    const oldPath = path.join(PHOTOS_DIR, activeDirPath, oldName);
    const newPath = path.join(PHOTOS_DIR, activeDirPath, newName);

    if (!fs.existsSync(oldPath)) {
      return res.status(404).json({ error: 'Original photo not found' });
    }
    
    if (fs.existsSync(newPath)) {
      return res.status(400).json({ error: 'A file with that name already exists' });
    }

    fs.renameSync(oldPath, newPath);
    res.json({ success: true });
  } catch (err) {
    console.error('Rename Error:', err);
    res.status(500).json({ error: 'Failed to rename photo' });
  }
});

// Upload Photos Endpoint
app.post('/api/photos/upload', upload.array('photos'), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    res.json({ success: true, count: req.files.length });
  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).json({ error: 'Failed to upload photos' });
  }
});

// Faces Database
const FACES_DB_PATH = path.join(__dirname, 'faces.json');

app.get('/api/faces', (req, res) => {
  if (fs.existsSync(FACES_DB_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(FACES_DB_PATH, 'utf-8'));
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: 'Failed to read faces db' });
    }
  } else {
    res.json({ clusters: [], namedFaces: {} });
  }
});

app.post('/api/faces', (req, res) => {
  try {
    fs.writeFileSync(FACES_DB_PATH, JSON.stringify(req.body, null, 2), 'utf-8');
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to save faces db' });
  }
});

app.get('/api/manual', (req, res) => {
  const manualPath = path.join(__dirname, 'docs', 'manual.md');
  if (fs.existsSync(manualPath)) {
    const md = fs.readFileSync(manualPath, 'utf-8');
    let html = md.replace(/^# (.*$)/gim, '<h1>$1</h1>')
                 .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                 .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                 .replace(/\*\*(.*)\*\*/gim, '<b>$1</b>')
                 .replace(/\*(.*)\*/gim, '<i>$1</i>')
                 .replace(/`(.*?)`/gim, '<code>$1</code>')
                 .replace(/\n$/gim, '<br />');
    res.json({ html });
  } else {
    res.status(404).json({ error: 'Manual not found' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
