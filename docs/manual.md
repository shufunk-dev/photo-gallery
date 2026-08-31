# Photo Gallery User Manual

Welcome to your Photo Gallery application! This guide will help you understand how to navigate, organize, and manage your photos easily.

## Getting Started

When you start the gallery, it automatically reads the `photos/` folder on your hard drive. It looks at the folder structure to figure out where everything belongs:
* **Unlimited Nested Folders**: You can create folders inside of folders infinitely (e.g., `Vacations/2026/Hawaii/Beach`). The sidebar will automatically indent to show you your exact folder tree!

## Viewing Photos

1. **Sidebar Navigation**: Use the left sidebar to navigate your folders. Click on any folder to expand it and see the photos inside.
2. **All Photos**: Click "All Photos" at the top of the sidebar to see everything in your library at once.
3. **Lightbox View**: Click any small photo thumbnail to open it in full size. You can exit this view by clicking the "X" button or clicking anywhere outside the image.

## Adding Photos (Upload)
You can easily add new photos directly through the UI:
1. Click the **Upload Photos** button in the top right corner.
2. Select the photos from your computer.
3. Type or select the exact folder you want them to go to, and click Upload.

## Downloading & Zipping Photos
You can export photos as zip archives at any time:
1. **Download All Photos**: When viewing "All Photos", click the **Download Zip** button in the top bar to zip your entire library while preserving all subfolder structures.
2. **Download a Folder**: Navigate to any folder in the sidebar and click **Download Zip** in the top bar to download only that folder and any subfolders inside it.
3. **Download Selected Photos**: In Edit mode, select any number of photos and click **Zip** in the edit toolbar to download only the chosen photos.

## Organizing Your Gallery

The gallery isn't just a viewer; it's a powerful file manager! Any changes you make here actually modify the files on your computer's hard drive.

### Drag and Drop
- **Reorganize Folders**: You can drag and drop folders in the sidebar directly into other folders!
- **Reorganize Photos**: You can drag any photo and drop it directly onto a folder in the sidebar to move it there instantly.

### Editing a Single Photo
When you click on a photo to view it full size, you will see buttons at the bottom:
- **Rename Photo**: Quickly rename the file on your hard drive.
- **Move Photo**: Move the file to a different folder.
- **Crop Photo**: Opens a visual crop editor. You can optionally rotate the image by 90 degrees before cropping. Saving a crop will safely overwrite the original file and automatically reset any facial recognition tracking for that specific photo.

### Edit Mode (Batch Actions)
If you have multiple photos to manage, click the **Edit** button in the top right corner.
* **Selecting**: Clicking on photos will place a checkmark on them.
* **Select All**: Click the **Select All** button in the edit toolbar to instantly select all photos currently visible in your grid. Clicking it again will deselect them.
* **Batch Zip**: Click **Zip** in the edit toolbar to bundle all selected photos into a zip file.
* **Batch Move**: Select multiple photos, then click **Move** in the toolbar to move them all to a new folder at once.
* **Batch Rename**: Select multiple photos and click **Rename** to open a handy table view where you can quickly type new names for all of them. The thumbnails in this view are large so you can easily read product labels or DVD spines.
* **Batch Delete**: Select photos you no longer want and click **Delete**. *Warning: This permanently removes the files from your hard drive!*

## People & Facial Recognition (AI Scanner)

The gallery features a built-in, 100% offline Artificial Intelligence that can automatically detect and group photos of the same person.
1. **The People Tab**: Click the "People" tab located at the top left of the sidebar.
2. **Rescanning**: If you've just added new photos, click the **Rescan Library** button at the top right of the People tab. The app will extract mathematical "face descriptors" from all your new photos.
3. **Naming Clusters**: The AI will group matching faces together into clusters. You can click on any cluster, assign a name to that person, and instantly view every photo they appear in.
4. **Smart Name Retention**: When you run a Rescan, the AI will automatically remember the mathematical structures of the people you've named and re-apply their names for you when the scan finishes!

---
*This manual is updated automatically via the Auto-Updating GitHub script.*
